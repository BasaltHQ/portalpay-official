import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { regenerateSubscriptionKey } from "@/lib/azure-management";
import { assertSubscriptionOwnershipOrThrow } from "@/lib/subscription-mapping";

/**
 * POST /api/apim-management/subscriptions/[id]/regenerate-key
 * Regenerate primary or secondary key for a subscription.
 * Body: { keyType: "primary" | "secondary" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const wallet = await getAuthenticatedWallet(req);
    if (!wallet) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id: subscriptionId } = await params;
    if (!subscriptionId) {
      return NextResponse.json({ error: "subscription_id_required" }, { status: 400 });
    }

    // Verify ownership
    await assertSubscriptionOwnershipOrThrow(subscriptionId, wallet);

    const body = await req.json().catch(() => ({}));
    const keyType = String(body.keyType || "primary").toLowerCase();
    if (keyType !== "primary" && keyType !== "secondary") {
      return NextResponse.json({ error: "invalid_key_type" }, { status: 400 });
    }

    // Regenerate in APIM
    await regenerateSubscriptionKey(subscriptionId, keyType as "primary" | "secondary");

    return NextResponse.json(
      {
        subscriptionId,
        keyType,
        message: `${keyType} key regenerated successfully. Retrieve new keys via GET /api/apim-management/subscriptions/${subscriptionId}/keys`,
      },
      { status: 200 }
    );
  } catch (e: any) {
    const status = e?.status || 500;
    return NextResponse.json({ error: e?.message || "internal_error" }, { status });
  }
}
