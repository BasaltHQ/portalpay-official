import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import {
    listCustomerSubscriptions,
    listMerchantSubscriptions,
    getSubscription,
} from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions/status
 *
 * Query subscriptions. Supports:
 * - ?subscriptionId=...     → single subscription
 * - ?customer=0x...         → all subscriptions for a customer
 * - ?merchant=0x...         → all subscriptions for a merchant's plans
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const subscriptionId = req.nextUrl.searchParams.get("subscriptionId")?.trim();
        const customerWallet = req.nextUrl.searchParams.get("customer")?.toLowerCase();
        const merchantWallet = req.nextUrl.searchParams.get("merchant")?.toLowerCase();
        const authed = await getAuthenticatedWallet(req);

        // Single subscription lookup
        if (subscriptionId) {
            const sub = await getSubscription(subscriptionId);
            if (!sub) {
                return NextResponse.json(
                    { error: "not_found" },
                    { status: 404, headers: { "x-correlation-id": correlationId } }
                );
            }
            return NextResponse.json(
                { success: true, subscription: sub },
                { headers: { "x-correlation-id": correlationId } }
            );
        }

        // Customer subscriptions
        if (customerWallet && /^0x[a-f0-9]{40}$/i.test(customerWallet)) {
            const subs = await listCustomerSubscriptions(customerWallet);
            return NextResponse.json(
                { success: true, subscriptions: subs },
                { headers: { "x-correlation-id": correlationId } }
            );
        }

        // Merchant subscriptions
        if (merchantWallet && /^0x[a-f0-9]{40}$/i.test(merchantWallet)) {
            const subs = await listMerchantSubscriptions(merchantWallet);
            return NextResponse.json(
                { success: true, subscriptions: subs },
                { headers: { "x-correlation-id": correlationId } }
            );
        }

        // Fallback: use authenticated wallet as customer
        if (authed && /^0x[a-f0-9]{40}$/i.test(authed)) {
            const subs = await listCustomerSubscriptions(authed.toLowerCase());
            return NextResponse.json(
                { success: true, subscriptions: subs },
                { headers: { "x-correlation-id": correlationId } }
            );
        }

        return NextResponse.json(
            { error: "query_required", message: "Provide ?subscriptionId, ?customer, or ?merchant" },
            { status: 400, headers: { "x-correlation-id": correlationId } }
        );
    } catch (err: any) {
        console.error("[subscriptions/status] GET error:", err);
        return NextResponse.json(
            { error: "internal", message: err?.message || "Unknown error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
