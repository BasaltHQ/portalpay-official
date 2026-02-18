import { notFound } from "next/navigation";
import { getContainer } from "@/lib/cosmos";
import TerminalSessionManager from "@/components/terminal/TerminalSessionManager";
import { ShopConfig } from "@/app/shop/[slug]/ShopClient";

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

export default async function TerminalModePage({ params }: { params: Promise<{ id: string }> }) {
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

    // 2. Security Check: Terminal Enabled?
    const isTerminalEnabled = (mergedConfig as any).terminalEnabled === true;

    if (!isTerminalEnabled) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 text-center">
                <div className="max-w-md space-y-4">
                    <h1 className="text-2xl font-bold">Terminal Not Enabled</h1>
                    <p className="text-muted-foreground">This merchant has not enabled Terminal mode. Please check with an administrator.</p>
                </div>
            </div>
        );
    }

    // 3. Sanitize Theme & Inject Identity
    if (!mergedConfig.theme) {
        mergedConfig.theme = {};
    }

    // Ensure top-level shop identity (logo/name) is injected into the theme object
    // This handles cases where shop_config has logoUrl/shopLogoUrl but no nested theme object,
    // or when we want to ensure the shop's logo overrides any stale site_config theme logo.
    if (mergedConfig.shopLogoUrl || mergedConfig.logoUrl) {
        mergedConfig.theme.brandLogoUrl = mergedConfig.shopLogoUrl || mergedConfig.logoUrl;
    }
    if (mergedConfig.name) {
        mergedConfig.theme.brandName = mergedConfig.name;
    }

    mergedConfig.theme = sanitizeShopTheme(mergedConfig.theme);

    return (
        <TerminalSessionManager
            config={mergedConfig as any}
            merchantWallet={mergedConfig.wallet}
        />
    );
}
