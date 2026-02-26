import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export const dynamic = "force-dynamic";

/**
 * Partner Reports API — Aggregates stats per merchant for a partner container.
 * Uses split_index as the source of truth (matching the Merchants panel)
 * with receipt-based fallback for legacy data.
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

        const container = await getContainer();

        // 1. Fetch split_index records — the source of truth for merchant stats
        //    (same data the Merchants panel uses)
        const splitQuery = {
            query: `SELECT c.merchantWallet, c.splitAddress, c.brandKey,
                           c.totalVolumeUsd, c.merchantEarnedUsd, c.platformFeeUsd,
                           c.customers, c.totalCustomerXp, c.transactionCount
                    FROM c
                    WHERE c.type = 'split_index'`,
            parameters: [],
        };
        const { resources: splitRows } = await container.items
            .query(splitQuery)
            .fetchAll();

        // Filter by brand: match this partner's brand key
        // Platform brands (portalpay, basaltsurge) are equivalent
        const isPlatformBrand = brandKey === "portalpay" || brandKey === "basaltsurge";
        const filteredSplits = (splitRows || []).filter((row: any) => {
            const rowBrand = String(row.brandKey || "").toLowerCase();
            if (isPlatformBrand) {
                return !rowBrand || rowBrand === "portalpay" || rowBrand === "basaltsurge";
            }
            return rowBrand === brandKey;
        });

        // 2. Fetch shop_config for merchant names and logos
        const shopQuery = {
            query: `SELECT c.wallet, c.name, c.theme FROM c WHERE c.type = 'shop_config'`,
            parameters: [],
        };
        const { resources: shops } = await container.items.query(shopQuery).fetchAll();

        const shopMap = new Map<string, { name: string; logo?: string }>();
        for (const shop of shops || []) {
            const w = String(shop.wallet || "").toLowerCase();
            if (w) {
                shopMap.set(w, {
                    name: shop.name || "Unknown Merchant",
                    logo: shop.theme?.brandLogoUrl || shop.theme?.brandFaviconUrl,
                });
            }
        }

        // 3. Build per-merchant stats from split_index
        const merchantMap = new Map<
            string,
            {
                wallet: string;
                name: string;
                logo?: string;
                totalSales: number;
                merchantEarned: number;
                platformFee: number;
                totalTips: number;
                transactionCount: number;
                customers: number;
            }
        >();

        for (const row of filteredSplits) {
            const w = String(row.merchantWallet || "").toLowerCase();
            if (!w) continue;
            const shopInfo = shopMap.get(w);
            const existing = merchantMap.get(w);
            const totalVol = Number(row.totalVolumeUsd || 0);
            const merchantEarned = Number(row.merchantEarnedUsd || 0);
            const platformFee = Number(row.platformFeeUsd || 0);
            const txnCount = Number(row.transactionCount || 0);
            const customers = Number(row.customers || 0);

            if (existing) {
                // Merge (same wallet may have multiple split_index entries)
                existing.totalSales += totalVol;
                existing.merchantEarned += merchantEarned;
                existing.platformFee += platformFee;
                existing.transactionCount += txnCount;
                existing.customers += customers;
            } else {
                merchantMap.set(w, {
                    wallet: w,
                    name: shopInfo?.name || "Unknown Merchant",
                    logo: shopInfo?.logo,
                    totalSales: totalVol,
                    merchantEarned,
                    platformFee,
                    totalTips: 0,
                    transactionCount: txnCount,
                    customers,
                });
            }
        }

        const merchants = Array.from(merchantMap.values()).map((m) => ({
            ...m,
            averageOrderValue:
                m.transactionCount > 0 ? m.totalSales / m.transactionCount : 0,
        }));

        // 4. Also try to get tip totals from receipts (tips aren't in split_index)
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
                for (const r of tipReceipts || []) {
                    const w = String(r.wallet || "").toLowerCase();
                    const m = merchantMap.get(w);
                    if (m) m.totalTips += Number(r.tipAmount || 0);
                }
            } catch { /* tips are optional */ }
        }

        // 5. Overall aggregate
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
