import { notFound } from "next/navigation";
import { getContainer } from "@/lib/cosmos";
import TerminalSessionManager from "@/components/terminal/TerminalSessionManager";
import { ShopConfig } from "@/app/shop/[slug]/ShopClient";
import { getSiteConfigForWallet } from "@/lib/site-config";

export default async function TerminalModePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cleanSlug = id.toLowerCase();
    const container = await getContainer();

    // 1. Resolve Shop Config (to identify the wallet)
    const { resources: configs } = await container.items
        .query({
            query: "SELECT * FROM c WHERE c.slug = @slug OR (c.customDomain = @slug AND c.customDomainVerified = true) OR c.wallet = @slug",
            parameters: [{ name: "@slug", value: cleanSlug }]
        })
        .fetchAll();

    // Prioritize shop_config
    const initialConfig = (configs.find((c: any) => c.type === 'shop_config') || configs[0]) as (ShopConfig & { wallet: string }) | undefined;

    if (!initialConfig || !initialConfig.wallet) {
        return notFound();
    }

    // 2. Fetch Normalized Site Config (handles inheritance, branding, and splits)
    // We use the wallet found in step 1 to perform the standard config lookup
    const normalizedConfig = await getSiteConfigForWallet(initialConfig.wallet);

    // 3. Merge configs
    // We want the specific fields from initialConfig (arrangement, bio, etc.) to override defaults
    // We use normalizedConfig as the base (defaults)
    const mergedConfig = {
        ...normalizedConfig,
        ...initialConfig,
        theme: {
            ...normalizedConfig.theme,
            ...initialConfig.theme
        }
    };

    // 4. Security Check: Terminal Enabled?
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

    return (
        <TerminalSessionManager
            config={mergedConfig as any}
            merchantWallet={mergedConfig.wallet || initialConfig.wallet}
        />
    );
}
