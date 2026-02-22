import { notFound } from "next/navigation";
import { getContainer } from "@/lib/cosmos";
import { InventoryItem } from "@/types/inventory";
import KioskClient from "./KioskClient";
import { ShopConfig } from "@/app/shop/[slug]/ShopClient";
import { getBrandKey } from "@/config/brands";

// Force fresh data on every request — admin theme changes must appear immediately
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to sanitize theme (duplicated from shop/page.tsx to ensure consistency)
function sanitizeShopTheme(theme: any) {
    if (!theme) return undefined;

    // Create a new object to avoid mutation
    const sanitized = { ...theme };

    // 1. Ensure logoUrl is present (prefer brandLogoUrl)
    if (sanitized.brandLogoUrl) {
        sanitized.logoUrl = sanitized.brandLogoUrl;
    } else if (sanitized.logoUrl) {
        sanitized.brandLogoUrl = sanitized.logoUrl;
    }

    // 2. Ensure primary/secondary colors have defaults if missing
    if (!sanitized.primaryColor) sanitized.primaryColor = "#0ea5e9";
    if (!sanitized.secondaryColor) sanitized.secondaryColor = "#22c55e";

    return sanitized;
}

export default async function KioskPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cleanSlug = id.toLowerCase();
    const container = await getContainer();

    // 1. Resolve Shop Config & Site Config
    // We fetch both to merge:
    // - shop_config: Truth for shop identity (name, current theme)
    // - site_config: Truth for touchpoint settings (touchpointThemes override)
    const { resources: docs } = await container.items
        .query({
            query: "SELECT * FROM c WHERE (c.slug = @slug OR (c.customDomain = @slug AND c.customDomainVerified = true) OR c.wallet = @slug) AND (c.type = 'shop_config' OR c.type = 'site_config')",
            parameters: [{ name: "@slug", value: cleanSlug }]
        })
        .fetchAll();

    console.log(`[KIOSK DEBUG] found ${docs.length} docs for ${cleanSlug}:`, docs.map((c: any) => ({ id: c.id, type: c.type, kiosk: c.kioskEnabled })));

    // Categorize docs
    let shopConfig = docs.find((c: any) => c.type === 'shop_config');

    // Multiple site_config docs may exist (site:config:basaltsurge, site:config:portalpay, site:config).
    // Prefer the brand-scoped doc that the admin actually writes to.
    let brandKey = "basaltsurge";
    try { brandKey = getBrandKey(); } catch { }
    const siteConfigs = docs.filter((c: any) => c.type === 'site_config');
    let siteConfig =
        siteConfigs.find((c: any) => c.id === `site:config:${brandKey}`) ||  // brand-scoped (admin writes here)
        siteConfigs.find((c: any) => c.id === 'site:config') ||              // legacy mirror
        siteConfigs[0];                                                       // any fallback

    console.log(`[KIOSK DEBUG] selected site_config id=${siteConfig?.id}, touchpointThemes=`, JSON.stringify(siteConfig?.touchpointThemes));

    // If we found a shop_config by slug but missed the site_config entirely,
    // do a targeted point-read using the merchant wallet
    if (shopConfig && !siteConfig && shopConfig.wallet) {
        const merchantWallet = String(shopConfig.wallet).toLowerCase();
        const brandDocId = `site:config:${brandKey}`;
        const legacyDocId = "site:config";

        try {
            const { resource } = await container.item(brandDocId, merchantWallet).read<any>();
            if (resource) {
                siteConfig = resource;
                console.log(`[KIOSK DEBUG] fetched site_config via brand doc ${brandDocId} for wallet ${merchantWallet}`);
            }
        } catch {
            try {
                const { resource } = await container.item(legacyDocId, merchantWallet).read<any>();
                if (resource) {
                    siteConfig = resource;
                    console.log(`[KIOSK DEBUG] fetched site_config via legacy doc ${legacyDocId} for wallet ${merchantWallet}`);
                }
            } catch { }
        }
    }

    if (!shopConfig && !siteConfig) {
        return notFound();
    }

    // Merge Configs: Prioritize shop_config, fallback to site_config
    // We perform a shallow merge of the theme object to ensure fields missing in shop_config (e.g. logo)
    // are picked up from site_config if available.
    const siteTheme = siteConfig?.theme || {};
    const shopTheme = shopConfig?.theme || {};

    // Merge themes: Start with site theme, override with shop theme
    // We filter out empty strings from shopTheme to prevent wiping out valid siteTheme values
    const mergedTheme = { ...siteTheme };
    for (const [key, value] of Object.entries(shopTheme)) {
        if (value !== "" && value !== undefined && value !== null) {
            mergedTheme[key] = value;
        }
    }

    const mergedConfig: any = {
        ...(siteConfig || {}),
        ...(shopConfig || {}), // Shop config overrides general site settings
        theme: mergedTheme,
        // Explicitly merge specific fields if needed
        touchpointThemes: { ...(siteConfig?.touchpointThemes || {}), ...(shopConfig?.touchpointThemes || {}) },
        wallet: shopConfig?.wallet || siteConfig?.wallet || docs[0]?.wallet,
    };

    console.log(`[KIOSK DEBUG] touchpointThemes resolved:`, JSON.stringify(mergedConfig.touchpointThemes));

    // 2. Security Check: Kiosk Enabled?
    const isKioskEnabled = mergedConfig.kioskEnabled === true;

    if (!isKioskEnabled) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 text-center">
                <div className="max-w-md space-y-4">
                    <h1 className="text-2xl font-bold">Kiosk Not Enabled</h1>
                    <p className="text-muted-foreground">This merchant has not enabled Kiosk mode. Please check with an administrator.</p>
                </div>
            </div>
        );
    }

    // 3. Sanitize Theme
    if (mergedConfig.theme) {
        mergedConfig.theme = sanitizeShopTheme(mergedConfig.theme);
    } else {
        // Fallback if no theme object exists but top-level fields do
        mergedConfig.theme = sanitizeShopTheme({
            brandLogoUrl: mergedConfig.shopLogoUrl || mergedConfig.logoUrl,
            primaryColor: mergedConfig.primaryColor,
            secondaryColor: mergedConfig.secondaryColor
        });
    }

    // 4. Prebuild items
    const items: InventoryItem[] = [];

    return (
        <KioskClient
            config={mergedConfig as ShopConfig}
            items={items}
            merchantWallet={mergedConfig.wallet}
        />
    );
}

