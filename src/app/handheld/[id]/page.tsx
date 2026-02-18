import { notFound } from "next/navigation";
import { getContainer } from "@/lib/cosmos";
import HandheldSessionManager from "@/components/handheld/HandheldSessionManager";
import { ShopConfig } from "@/app/shop/[slug]/ShopClient";

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

export default async function HandheldModePage({ params }: { params: Promise<{ id: string }> }) {
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

    const shopConfig = docs.find((c: any) => c.type === 'shop_config');
    const siteConfig = docs.find((c: any) => c.type === 'site_config');

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

    // 2. Sanitize Theme
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

    // 3. Security Check: Handheld Enabled? (Optional, similar to Terminal Check)
    // For now, assume if Terminal or Kiosk is enabled, or just existence of config allows it.
    // Or we can add a specific check later. Defaults to allowing if provisioned.

    // 4. Fetch Inventory (Server-Side)
    const merchantWallet = mergedConfig.wallet || initialConfig.wallet;
    let items: any[] = [];
    try {
        const { resources } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.type = 'inventory_item' AND c.wallet = @wallet",
                parameters: [{ name: "@wallet", value: merchantWallet }]
            })
            .fetchAll();
        items = resources || [];
    } catch (e) {
        console.error("Failed to fetch inventory for handheld", e);
    }

    return (
        <HandheldSessionManager
            config={mergedConfig as any}
            merchantWallet={merchantWallet}
            items={items}
        />
    );
}
