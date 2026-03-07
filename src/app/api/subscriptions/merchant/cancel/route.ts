import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { cancelSubscriptionByMerchant } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/merchant/cancel
 *
 * Cancel a subscription. Only the merchant owner of the plan can cancel.
 *
 * Body: { subscriptionId }
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const body = await req.json().catch(() => ({}));
        const authed = await getAuthenticatedWallet(req);
        const wallet = (
            authed ||
            String(body.wallet || "").toLowerCase() ||
            String(req.headers.get("x-wallet") || "").toLowerCase()
        ).toLowerCase();

        if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
            return NextResponse.json(
                { error: "unauthorized" },
                { status: 401, headers: { "x-correlation-id": correlationId } }
            );
        }

        const subscriptionId = String(body.subscriptionId || "").trim();
        if (!subscriptionId) {
            return NextResponse.json(
                { error: "subscription_id_required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const cancelled = await cancelSubscriptionByMerchant(subscriptionId, wallet);
        if (!cancelled) {
            return NextResponse.json(
                { error: "not_found_or_unauthorized", message: "Subscription not found or you are not the merchant" },
                { status: 404, headers: { "x-correlation-id": correlationId } }
            );
        }

        return NextResponse.json(
            { success: true, message: "Subscription cancelled" },
            { headers: { "x-correlation-id": correlationId } }
        );
    } catch (err: any) {
        console.error("[subscriptions/merchant/cancel] POST error:", err);
        return NextResponse.json(
            { error: "internal", message: err?.message || "Unknown error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
