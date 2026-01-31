import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const wallet = (url.searchParams.get("wallet") || "").toLowerCase().trim();
        const brandKey = (url.searchParams.get("brandKey") || "").toLowerCase().trim();

        if (!wallet || !brandKey) {
            return NextResponse.json({ error: "Missing wallet or brandKey" }, { status: 400 });
        }

        const container = await getContainer();

        // 1. Check Shop Config (Raw)
        const shopQuery = "SELECT * FROM c WHERE c.type = 'shop_config' AND c.wallet = @w AND c.brandKey = @b";
        const { resources: shopConfigs } = await container.items.query({
            query: shopQuery,
            parameters: [{ name: "@w", value: wallet }, { name: "@b", value: brandKey }]
        }).fetchAll();

        // 2. Check Client Request (Raw)
        const requestQuery = "SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = @w AND c.brandKey = @b";
        const { resources: clientRequests } = await container.items.query({
            query: requestQuery,
            parameters: [{ name: "@w", value: wallet }, { name: "@b", value: brandKey }]
        }).fetchAll();

        // 3. Check for any case-mismatched wallets (Fuzzy check)
        // Note: StringEquals(c.wallet, @w, true) checks case-insensitive
        const fuzzyQuery = "SELECT c.id, c.type, c.wallet, c.brandKey, c.status FROM c WHERE (c.type = 'shop_config' OR c.type = 'client_request') AND StringEquals(c.wallet, @w, true) AND StringEquals(c.brandKey, @b, true)";
        const { resources: fuzzyMatches } = await container.items.query({
            query: fuzzyQuery,
            parameters: [{ name: "@w", value: wallet }, { name: "@b", value: brandKey }]
        }).fetchAll();

        return NextResponse.json({
            meta: {
                queriedWallet: wallet,
                queriedBrandKey: brandKey
            },
            results: {
                exactShopConfigs: shopConfigs,
                exactClientRequests: clientRequests,
                fuzzyMatches: fuzzyMatches
            },
            analysis: {
                hasShopConfig: shopConfigs.length > 0,
                shopConfigStatus: shopConfigs[0]?.status || "none",
                hasClientRequest: clientRequests.length > 0,
                clientRequestStatus: clientRequests[0]?.status || "none",
                potentialCaseIssues: fuzzyMatches.length !== (shopConfigs.length + clientRequests.length)
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
