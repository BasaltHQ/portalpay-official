import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";
import { findApiKeysByWallet } from "@/lib/apim/keys";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const auth = await requireThirdwebAuth(req);
        const keys = await findApiKeysByWallet(auth.wallet);

        // Transform keys into "Subscription" view
        const subscriptions = keys.map(k => ({
            subscriptionId: k.id,
            label: k.label,
            plan: k.plan,
            status: k.isActive ? "active" : "revoked",
            createdAt: k.createdAt,
            wallet: k.ownerWallet,
            scopes: k.scopes
        }));

        return NextResponse.json({ subscriptions });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Unauthorized" }, { status: 401 });
    }
}
