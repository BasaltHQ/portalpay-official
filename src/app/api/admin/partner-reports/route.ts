import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export const dynamic = "force-dynamic";

/**
 * Partner Reports API — Aggregates stats per merchant for a partner container.
 * Uses multi-source brand resolution (site_config > split_index > shop_config)
 * to discover merchants, then pulls stats from split_index (the same source
 * as the Merchants panel / Users panel).
 *
 * Auth: x-wallet header must match an admin wallet for this container.
 */

function isAdminWallet(wallet: string): boolean {
    const w = wallet.toLowerCase();
    const owner = String(process.env.NEXT_PUBLIC_OWNER_WALLET || "").toLowerCase();
    const platform = String(process.env.NEXT_PUBLIC_PLATFORM_WALLET || "").toLowerCase();
    const admins = String(process.env.ADMIN_WALLETS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return w === owner || w === platform || admins.includes(w);
}

const hex = (s: any) => typeof s === "string" && /^0x[a-f0-9]{40}$/i.test(s);

export async function GET(req: NextRequest) {
    try {
        const wallet = req.headers.get("x-wallet") || "";
        if (!wallet || !isAdminWallet(wallet)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const brandKey = String(
            process.env.BRAND_KEY || process.env.NEXT_PUBLIC_BRAND_KEY || ""
        ).toLowerCase();

        if (!brandKey) {
            return NextResponse.json(
                { error: "No brand key configured for this container" },
                { status: 500 }
            );
        }

        const isPlatformBrand = brandKey === "portalpay" || brandKey === "basaltsurge";

        const container = await getContainer();

        // ── 1. Parallel fetch: split_index, shop_config, site_config ──
        const [splitIndexRes, shopConfigRes, siteConfigRes] = await Promise.all([
            container.items.query({
                query: `SELECT c.merchantWallet, c.splitAddress, c.brandKey,
                               c.totalVolumeUsd, c.merchantEarnedUsd, c.platformFeeUsd,
                               c.customers, c.totalCustomerXp, c.transactionCount
                        FROM c WHERE c.type = 'split_index'`,
                parameters: [],
            }).fetchAll(),
            container.items.query({
                query: `SELECT c.wallet, c.name, c.theme FROM c WHERE c.type = 'shop_config'`,
                parameters: [],
            }).fetchAll(),
            // site_config — authoritative brand source for onboarded merchants
            container.items.query({
                query: `SELECT c.wallet, c.brandKey, c.splitAddress FROM c WHERE c.type = 'site_config'`,
                parameters: [],
            }).fetchAll(),
        ]);

        const splitRows = splitIndexRes.resources || [];
        const shops = shopConfigRes.resources || [];
        const siteConfigs = siteConfigRes.resources || [];

        // ── 2. Build shop info map (names + logos) ──
        const shopMap = new Map<string, { name: string; logo?: string; brandKey?: string }>();
        for (const shop of shops) {
            const w = String(shop.wallet || "").toLowerCase();
            if (!w) continue;
            shopMap.set(w, {
                name: shop.name || "Unknown Merchant",
                logo: shop.theme?.brandLogoUrl || shop.theme?.brandFaviconUrl,
                brandKey: String(shop.theme?.brandKey || "").toLowerCase() || undefined,
            });
        }

        // ── 3. Multi-source brand resolution ──
        // Priority: site_config.brandKey > split_index.brandKey > shop_config.theme.brandKey
        const walletBrand = new Map<string, string>();
        const walletSplitAddr = new Map<string, string>();

        // Pass 1: shop_config.theme.brandKey (lowest priority)
        for (const shop of shops) {
            const w = String(shop.wallet || "").toLowerCase();
            if (!hex(w)) continue;
            const rawBk = String(shop.theme?.brandKey || "").toLowerCase();
            if (rawBk) walletBrand.set(w, rawBk);
        }

        // Pass 2: split_index.brandKey (overrides shop_config)
        for (const row of splitRows) {
            const w = String(row.merchantWallet || "").toLowerCase();
            if (!hex(w)) continue;
            const rawBk = String(row.brandKey || "").toLowerCase();
            if (rawBk) walletBrand.set(w, rawBk);
            const splitAddr = String(row.splitAddress || "").toLowerCase();
            if (hex(splitAddr)) walletSplitAddr.set(w, splitAddr);
        }

        // Pass 3: site_config.brandKey (highest priority — set during onboarding)
        for (const sc of siteConfigs) {
            const w = String(sc.wallet || "").toLowerCase();
            if (!hex(w)) continue;
            const rawBk = String(sc.brandKey || "").toLowerCase();
            if (rawBk) walletBrand.set(w, rawBk);
            const splitAddr = String(sc.splitAddress || "").toLowerCase();
            if (hex(splitAddr) && !walletSplitAddr.has(w)) walletSplitAddr.set(w, splitAddr);
        }

        // ── 4. Filter wallets belonging to this partner brand ──
        const partnerWallets = new Set<string>();
        for (const [w, resolvedBrand] of walletBrand.entries()) {
            if (isPlatformBrand) {
                // Platform brand: include merchants with empty/portalpay/basaltsurge brand
                if (!resolvedBrand || resolvedBrand === "portalpay" || resolvedBrand === "basaltsurge") {
                    partnerWallets.add(w);
                }
            } else {
                // Partner brand: exact match
                if (resolvedBrand === brandKey) {
                    partnerWallets.add(w);
                }
            }
        }

        // ── 5. Build split_index stats map (same source as Merchants panel) ──
        const splitStatsMap = new Map<
            string,
            {
                totalVolumeUsd: number;
                merchantEarnedUsd: number;
                platformFeeUsd: number;
                customers: number;
                totalCustomerXp: number;
                transactionCount: number;
            }
        >();

        for (const row of splitRows) {
            const w = String(row.merchantWallet || "").toLowerCase();
            if (!w || !partnerWallets.has(w)) continue;

            const vol = Number(row.totalVolumeUsd || 0);
            const earned = Number(row.merchantEarnedUsd || 0);
            const fee = Number(row.platformFeeUsd || 0);
            const txns = Number(row.transactionCount || 0);
            const cust = Number(row.customers || 0);
            const xp = Number(row.totalCustomerXp || 0);

            const existing = splitStatsMap.get(w);
            if (existing) {
                // Merge (same wallet may have multiple split_index entries)
                existing.totalVolumeUsd += vol;
                existing.merchantEarnedUsd += earned;
                existing.platformFeeUsd += fee;
                existing.transactionCount += txns;
                existing.customers += cust;
                existing.totalCustomerXp += xp;
            } else {
                splitStatsMap.set(w, {
                    totalVolumeUsd: vol,
                    merchantEarnedUsd: earned,
                    platformFeeUsd: fee,
                    transactionCount: txns,
                    customers: cust,
                    totalCustomerXp: xp,
                });
            }
        }

        // ── 6. Build merchant list ──
        const merchants = Array.from(partnerWallets).map((w) => {
            const shopInfo = shopMap.get(w);
            const stats = splitStatsMap.get(w);

            const totalSales = stats?.totalVolumeUsd || 0;
            const merchantEarned = stats?.merchantEarnedUsd || 0;
            const platformFee = stats?.platformFeeUsd || 0;
            const transactionCount = stats?.transactionCount || 0;
            const customers = stats?.customers || 0;

            return {
                wallet: w,
                name: shopInfo?.name || "Unknown Merchant",
                logo: shopInfo?.logo,
                totalSales,
                merchantEarned,
                platformFee,
                totalTips: 0,
                transactionCount,
                customers,
                averageOrderValue: transactionCount > 0 ? totalSales / transactionCount : 0,
            };
        });

        // ── 7. Get tip totals from receipts ──
        const merchantWallets = merchants.map((m) => m.wallet);
        if (merchantWallets.length > 0) {
            try {
                const tipQuery = {
                    query: `SELECT c.wallet, c.tipAmount FROM c
                            WHERE c.type = 'receipt' AND c.status = 'paid'
                            AND ARRAY_CONTAINS(@wallets, c.wallet)`,
                    parameters: [{ name: "@wallets", value: merchantWallets }],
                };
                const { resources: tipReceipts } = await container.items
                    .query(tipQuery)
                    .fetchAll();
                const tipMap = new Map<string, number>();
                for (const r of tipReceipts || []) {
                    const w = String(r.wallet || "").toLowerCase();
                    tipMap.set(w, (tipMap.get(w) || 0) + Number(r.tipAmount || 0));
                }
                for (const m of merchants) {
                    m.totalTips = tipMap.get(m.wallet) || 0;
                }
            } catch { /* tips are optional */ }
        }

        // ── 8. Overall aggregate ──
        const aggregate = {
            totalSales: merchants.reduce((s, m) => s + m.totalSales, 0),
            merchantEarned: merchants.reduce((s, m) => s + m.merchantEarned, 0),
            platformFee: merchants.reduce((s, m) => s + m.platformFee, 0),
            totalTips: merchants.reduce((s, m) => s + m.totalTips, 0),
            transactionCount: merchants.reduce((s, m) => s + m.transactionCount, 0),
            averageOrderValue: 0 as number,
            merchantCount: merchants.length,
            customers: merchants.reduce((s, m) => s + m.customers, 0),
        };
        aggregate.averageOrderValue =
            aggregate.transactionCount > 0
                ? aggregate.totalSales / aggregate.transactionCount
                : 0;

        return NextResponse.json({ merchants, aggregate });
    } catch (e: any) {
        console.error("[PartnerReports] Error:", e);
        return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
    }
}
