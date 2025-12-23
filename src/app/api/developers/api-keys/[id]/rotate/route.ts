import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";
import { rotateApiKey, findApiKeysByWallet } from "@/lib/apim/keys";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireThirdwebAuth(req);
        const { id } = await params;

        // Verify ownership
        // rotateApiKey checks by ID, but we should verify the key belongs to the user to prevent unauthorized rotation.
        // Option 1: fetch keys and check.
        // Option 2: Pass wallet to rotateApiKey (I updated rotateApiKey to just take ID in previous step).
        // Let's check ownership here.
        const keys = await findApiKeysByWallet(auth.wallet);
        const match = keys.find(k => k.id === id);
        if (!match) {
            return NextResponse.json({ error: "Key not found or unauthorized" }, { status: 403 });
        }

        const newKey = await rotateApiKey(id);
        if (!newKey) {
            throw new Error("Failed to rotate key");
        }

        return NextResponse.json({ apiKey: newKey });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Error" }, { status: 500 });
    }
}
