import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export const dynamic = "force-dynamic";

/**
 * Partner Reports API — Aggregates stats per merchant for a partner container.
 * Uses multi-source brand resolution (site_config > split_index > shop_config)
 * to discover merchants, then pulls stats from receipts filtered by time range
 * (or from split_index for all-time totals, matching the Merchants panel).
 *
 * Query params:
 *   start — Unix timestamp (seconds) for the start of the date range
 *   end   — Unix timestamp (seconds) for the end of the date range
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

        // Parse time range (frontend sends Unix seconds)
        const { searchParams } = new URL(req.url);
        const startSec = Number(searchParams.get("start") || 0);
        const endSec = Number(searchParams.get("end") || 0);
        // Convert to milliseconds (receipt.createdAt is in ms)
        const startMs = startSec > 0 ? startSec * 1000 : 0;
        const endMs = endSec > 0 ? endSec * 1000 : Date.now();

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
        }

        // Pass 3: site_config.brandKey (highest priority — set during onboarding)
        for (const sc of siteConfigs) {
            const w = String(sc.wallet || "").toLowerCase();
            if (!hex(w)) continue;
            const rawBk = String(sc.brandKey || "").toLowerCase();
            if (rawBk) walletBrand.set(w, rawBk);
        }

        // ── 4. Filter wallets belonging to this partner brand ──
        const partnerWallets = new Set<string>();
        for (const [w, resolvedBrand] of walletBrand.entries()) {
            if (isPlatformBrand) {
                if (!resolvedBrand || resolvedBrand === "portalpay" || resolvedBrand === "basaltsurge") {
                    partnerWallets.add(w);
                }
            } else {
                if (resolvedBrand === brandKey) {
                    partnerWallets.add(w);
                }
            }
        }

        const partnerWalletArray = Array.from(partnerWallets);

        if (partnerWalletArray.length === 0) {
            // No merchants → return empty response
            return NextResponse.json({
                merchants: [],
                aggregate: {
                    totalSales: 0, merchantEarned: 0, platformFee: 0,
                    totalTips: 0, transactionCount: 0, averageOrderValue: 0,
                    merchantCount: 0, customers: 0,
                },
            });
        }

        // ── 5. Build per-merchant stats ──
        // When "all time" (startMs === 0), use indexed split_index values directly
        // instead of expensive receipt queries. Otherwise, query receipts for the range.
        const useIndexed = startMs === 0;

        const merchantStatsMap = new Map<
            string,
            { totalSales: number; totalTips: number; transactionCount: number }
        >();

        if (!useIndexed) {
            // Fetch receipts within time range for these merchants
            const receiptQuery = {
                query: `SELECT c.wallet, c.totalUsd, c.tipAmount, c.createdAt FROM c
                        WHERE c.type = 'receipt' AND c.status = 'paid'
                        AND ARRAY_CONTAINS(@wallets, c.wallet)
                        AND c.createdAt >= @startMs AND c.createdAt <= @endMs`,
                parameters: [
                    { name: "@wallets", value: partnerWalletArray },
                    { name: "@startMs", value: startMs },
                    { name: "@endMs", value: endMs },
                ],
            };
            const { resources: receipts } = await container.items.query(receiptQuery).fetchAll();

            for (const r of receipts || []) {
                const w = String(r.wallet || "").toLowerCase();
                if (!partnerWallets.has(w)) continue;

                const totalUsd = Number(r.totalUsd || 0);
                const tipAmount = Number(r.tipAmount || 0);

                const existing = merchantStatsMap.get(w);
                if (existing) {
                    existing.totalSales += totalUsd;
                    existing.totalTips += tipAmount;
                    existing.transactionCount += 1;
                } else {
                    merchantStatsMap.set(w, {
                        totalSales: totalUsd,
                        totalTips: tipAmount,
                        transactionCount: 1,
                    });
                }
            }
        }

        // ── 6. Also pull split_index for earned/fee breakdown per merchant ──
        const splitStatsMap = new Map<
            string,
            { totalVolumeUsd: number; merchantEarnedUsd: number; platformFeeUsd: number; customers: number; transactionCount: number }
        >();

        for (const row of splitRows) {
            const w = String(row.merchantWallet || "").toLowerCase();
            if (!partnerWallets.has(w)) continue;

            const vol = Number(row.totalVolumeUsd || 0);
            const earned = Number(row.merchantEarnedUsd || 0);
            const fee = Number(row.platformFeeUsd || 0);
            const cust = Number(row.customers || 0);
            const txCount = Number(row.transactionCount || 0);

            const existing = splitStatsMap.get(w);
            if (existing) {
                existing.totalVolumeUsd += vol;
                existing.merchantEarnedUsd += earned;
                existing.platformFeeUsd += fee;
                existing.customers += cust;
                existing.transactionCount += txCount;
            } else {
                splitStatsMap.set(w, {
                    totalVolumeUsd: vol,
                    merchantEarnedUsd: earned,
                    platformFeeUsd: fee,
                    customers: cust,
                    transactionCount: txCount,
                });
            }
        }

        // ── 7. Build merchant list ──
        const merchants = partnerWalletArray.map((w) => {
            const shopInfo = shopMap.get(w);
            const receiptStats = merchantStatsMap.get(w);
            const splitStats = splitStatsMap.get(w);

            // For "all time", use indexed amounts directly
            let totalSales: number;
            let totalTips: number;
            let transactionCount: number;
            let merchantEarned: number;
            let platformFee: number;

            if (useIndexed && splitStats) {
                totalSales = splitStats.totalVolumeUsd;
                merchantEarned = splitStats.merchantEarnedUsd;
                platformFee = splitStats.platformFeeUsd;
                totalTips = 0; // tips not tracked in split_index
                transactionCount = splitStats.transactionCount;
            } else {
                totalSales = receiptStats?.totalSales || 0;
                totalTips = receiptStats?.totalTips || 0;
                transactionCount = receiptStats?.transactionCount || 0;

                // Estimate earned/fee from receipt volume using the split_index ratio
                merchantEarned = totalSales;
                platformFee = 0;
                if (splitStats && splitStats.totalVolumeUsd > 0) {
                    const feeRatio = splitStats.platformFeeUsd / splitStats.totalVolumeUsd;
                    platformFee = Math.round(totalSales * feeRatio * 100) / 100;
                    merchantEarned = Math.round((totalSales - platformFee) * 100) / 100;
                }
            }

            const customers = splitStats?.customers || 0;

            return {
                wallet: w,
                name: shopInfo?.name || "Unknown Merchant",
                logo: shopInfo?.logo,
                totalSales: Math.round(totalSales * 100) / 100,
                merchantEarned: Math.round(merchantEarned * 100) / 100,
                platformFee: Math.round(platformFee * 100) / 100,
                totalTips: Math.round(totalTips * 100) / 100,
                transactionCount,
                customers,
                averageOrderValue: transactionCount > 0
                    ? Math.round((totalSales / transactionCount) * 100) / 100
                    : 0,
            };
        });

        // ── 9. Overall aggregate ──
        const aggregate = {
            totalSales: merchants.reduce((s, m) => s + m.totalSales, 0),
            merchantEarned: merchants.reduce((s, m) => s + m.merchantEarned, 0),
            platformFee: merchants.reduce((s, m) => s + m.platformFee, 0),
            totalTips: merchants.reduce((s, m) => s + m.totalTips, 0),
            transactionCount: merchants.reduce((s, m) => s + m.transactionCount, 0),
            averageOrderValue: 0 as number,
            merchantCount: merchants.filter((m) => m.transactionCount > 0).length,
            customers: merchants.reduce((s, m) => s + m.customers, 0),
        };
        aggregate.averageOrderValue =
            aggregate.transactionCount > 0
                ? Math.round((aggregate.totalSales / aggregate.transactionCount) * 100) / 100
                : 0;

        return NextResponse.json({ merchants, aggregate });
    } catch (e: any) {
        console.error("[PartnerReports] Error:", e);
        return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
    }
}
