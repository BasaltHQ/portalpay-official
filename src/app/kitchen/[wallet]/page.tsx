import { getContainer } from "@/lib/cosmos";
import KitchenSessionManager from "@/components/kitchen/KitchenSessionManager";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KitchenPage({ params }: { params: Promise<{ wallet: string }> }) {
    const { wallet } = await params;
    if (!wallet) return notFound();

    const cleanWallet = wallet.toLowerCase();
    const container = await getContainer();

    try {
        const { resources: docs } = await container.items
            .query({
                query: "SELECT c.name, c.theme FROM c WHERE c.id = 'shop:config' AND c.wallet = @w",
                parameters: [{ name: "@w", value: cleanWallet }]
            })
            .fetchAll();

        const shop = docs[0];

        // We wrap the traditional KitchenInterface with the new KitchenSessionManager
        // that handles terminal authentication based on the merchant's staff PINs.
        return (
            <KitchenSessionManager 
                merchantWallet={cleanWallet}
                brandName={shop?.name}
                brandLogo={shop?.theme?.brandLogoUrl || shop?.theme?.logoUrl}
                primaryColor={shop?.theme?.primaryColor}
                secondaryColor={shop?.theme?.secondaryColor}
            />
        );
    } catch {
        return notFound();
    }
}
