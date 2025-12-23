import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { listSubscriptionSecrets } from "@/lib/azure-management";
import { assertSubscriptionOwnershipOrThrow } from "@/lib/subscription-mapping";

/**
 * GET /api/apim-management/subscriptions/[id]/keys
 * Retrieve subscription keys (primary and secondary).
 */
export async function GET(
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

    // Retrieve keys from APIM
    const keys = await listSubscriptionSecrets(subscriptionId);

    return NextResponse.json(
      {
        subscriptionId,
        primaryKey: keys.primaryKey || null,
        secondaryKey: keys.secondaryKey || null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    const status = e?.status || 500;
    return NextResponse.json({ error: e?.message || "internal_error" }, { status });
  }
}
