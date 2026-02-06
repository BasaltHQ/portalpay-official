import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet, requireThirdwebAuth } from "@/lib/auth";
import { createApiKeyDoc, findApiKeysByWallet } from "@/lib/apim/keys";
import { ApiKeyPlan } from "@/lib/apim/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireThirdwebAuth(req); // Enforce auth
        const keys = await findApiKeysByWallet(auth.wallet);

        // Mask sensitive data if any (though we only store hash, so it's safe)
        const safeKeys = keys.map(k => ({
            ...k,
            keyHash: undefined, // Don't allow client to see hash
            maskedKey: k.prefix + "•".repeat(24),
        }));

        return NextResponse.json({ keys: safeKeys });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Unauthorized" }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireThirdwebAuth(req);
        const body = await req.json();

        const label = body.label || "New API Key";
        const plan: ApiKeyPlan = body.plan || "starter"; // Default plan
        const brandKey = body.brandKey; // Optional

        // Validation: Only admins might create 'enterprise' keys? 
        // For now, allow self-service creation of keys based on user roles if needed.
        // Let's assume starter is free for everyone.

        const defaultScopes = [
            "receipts:read", "receipts:write",
            "orders:read", "orders:create",
            "inventory:read", "inventory:write",
            "split:read", "split:write", "shop:read"
        ];
        const { apiKey, doc } = await createApiKeyDoc(auth.wallet, label, plan, defaultScopes, brandKey);

        return NextResponse.json({
            apiKey, // Return raw key once!
            key: { ...doc, keyHash: undefined }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to create key" }, { status: 500 });
    }
}
