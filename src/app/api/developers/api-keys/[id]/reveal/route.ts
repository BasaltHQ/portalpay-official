
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { decryptApiKey, findApiKeysByWallet } from "@/lib/apim/keys";
import { getContainer } from "@/lib/cosmos";

export const dynamic = "force-dynamic";

/**
 * POST /api/developers/api-keys/[id]/reveal
 * Reveal the raw API key for a specific ID.
 */
export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const wallet = await getAuthenticatedWallet(req);
        if (!wallet) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        // Verify ownership
        const container = await getContainer();
        const query = "SELECT * FROM c WHERE c.type = 'api_key' AND c.id = @id AND c.ownerWallet = @wallet";
        const { resources } = await container.items.query({
            query,
            parameters: [
                { name: "@id", value: id },
                { name: "@wallet", value: wallet.toLowerCase() }
            ]
        }).fetchAll();

        const doc = resources[0];
        if (!doc) {
            return NextResponse.json({ error: "Key not found or access denied" }, { status: 404 });
        }

        if (!doc.encryptedKey) {
            return NextResponse.json({ error: "This key does not support reveal (legacy or rotated before encryption enabled). Please regenerate." }, { status: 400 });
        }

        const rawKey = decryptApiKey(doc.encryptedKey);
        if (!rawKey) {
            return NextResponse.json({ error: "Failed to decrypt key" }, { status: 500 });
        }

        return NextResponse.json({ apiKey: rawKey });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}
