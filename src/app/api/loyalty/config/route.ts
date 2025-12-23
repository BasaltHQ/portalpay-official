import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getBrandKey } from "@/config/brands";
import { isPlatformContext } from "@/lib/env";

/**
 * Resolve the brand key for loyalty config.
 */
function resolveBrandKey(): string {
    if (isPlatformContext()) {
        return "portalpay";
    }
    try {
        return getBrandKey() || "portalpay";
    } catch {
        return "portalpay";
    }
}

// Reuse logic from admin/loyalty/defaults
const getPlatformDocId = (brandKey: string) => `loyalty:defaults:${brandKey}`;
const PLATFORM_DEFAULTS_WALLET = "platform_loyalty_defaults";

// Reuse logic from shop/config
const getShopDocId = (brandKey: string) => {
    const key = String(brandKey || "").toLowerCase();
    if (!key || key === "portalpay") return "shop:config";
    return `shop:config:${key}`;
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // 'platform' or 'merchant'
        const wallet = searchParams.get("wallet");
        const brandKey = resolveBrandKey();

        const container = await getContainer();

        // Always fetch Platform Defaults to serve as the base/fallback
        const platformDocId = getPlatformDocId(brandKey);
        let platformConfig = {
            xpPerDollar: 1,
            baseXP: 100,
            multiplier: 1.11,
            maxLevel: 50,
            maxPrestige: 10,
            prestigeEnabled: true,
            coolDownMinutes: 0
        };

        try {
            const { resource } = await container.item(platformDocId, PLATFORM_DEFAULTS_WALLET).read();
            if (resource) {
                platformConfig = {
                    xpPerDollar: resource.defaultXpPerDollar,
                    baseXP: resource.defaultBaseXP,
                    multiplier: resource.defaultMultiplier,
                    maxLevel: resource.defaultMaxLevel,
                    maxPrestige: resource.defaultMaxPrestige,
                    prestigeEnabled: resource.defaultPrestigeEnabled,
                    coolDownMinutes: resource.defaultCoolDownMinutes
                };
            }
        } catch (e) { }

        if (type === "platform") {
            return NextResponse.json({ config: platformConfig });
        }

        if (type === "merchant" && wallet) {
            // Fetch Merchant Shop Config
            const shopDocId = getShopDocId(brandKey);
            try {
                const { resource: shop } = await container.item(shopDocId, wallet).read();

                if (shop) {
                    const loyalty = shop.loyalty || {};
                    // Merge: Platform Defaults -> Merchant Overrides
                    return NextResponse.json({
                        config: {
                            xpPerDollar: shop.xpPerDollar || platformConfig.xpPerDollar,
                            baseXP: loyalty.baseXP ?? platformConfig.baseXP,
                            multiplier: loyalty.multiplier ?? platformConfig.multiplier,
                            maxLevel: loyalty.prestige?.maxLevel ?? platformConfig.maxLevel,
                            maxPrestige: loyalty.prestige?.maxPrestige ?? platformConfig.maxPrestige,
                            prestigeEnabled: loyalty.prestige?.enabled ?? platformConfig.prestigeEnabled,
                            platformOptIn: loyalty.platformOptIn ?? false,
                            art: loyalty.art
                        }
                    });
                }
            } catch (e) { }

            // If shop not found, return Platform Defaults (assuming they are part of the system)
            return NextResponse.json({ config: platformConfig });
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });

    } catch (e: any) {
        console.error("GET /api/loyalty/config error:", e);
        return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
    }
}
