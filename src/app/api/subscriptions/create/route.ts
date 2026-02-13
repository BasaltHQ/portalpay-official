import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { createSubscription, getPlan } from "@/lib/subscriptions";
import type { BillingPeriod } from "@/lib/eip712-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/subscriptions/create
 *
 * Customer subscribes to a merchant's plan.
 * After the customer signs the EIP-712 SpendPermission on the client side,
 * the frontend sends the signature + permission data here to store the subscription.
 *
 * Body: {
 *   planId,
 *   customerWallet,
 *   permissionSignature,   // "0x..." EIP-712 signature
 *   permissionData: {      // the signed SpendPermission struct
 *     account, spender, token, allowance, period, start, end, salt, extraData
 *   }
 * }
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const body = await req.json().catch(() => ({}));
        const authed = await getAuthenticatedWallet(req);
        const customerWallet = (
            authed ||
            String(body.customerWallet || "").toLowerCase() ||
            String(req.headers.get("x-wallet") || "").toLowerCase()
        ).toLowerCase();

        if (!customerWallet || !/^0x[a-f0-9]{40}$/i.test(customerWallet)) {
            return NextResponse.json(
                { error: "unauthorized", message: "Customer wallet required" },
                { status: 401, headers: { "x-correlation-id": correlationId } }
            );
        }

        const planId = String(body.planId || "").trim();
        if (!planId) {
            return NextResponse.json(
                { error: "plan_id_required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Validate plan exists and is active
        const plan = await getPlan(planId);
        if (!plan || !plan.active) {
            return NextResponse.json(
                { error: "plan_not_found", message: "Plan does not exist or is inactive" },
                { status: 404, headers: { "x-correlation-id": correlationId } }
            );
        }

        const sig = String(body.permissionSignature || "").trim();
        if (!sig || !sig.startsWith("0x")) {
            return NextResponse.json(
                { error: "signature_required", message: "EIP-712 permissionSignature required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const pd = body.permissionData;
        if (
            !pd ||
            !pd.account ||
            !pd.spender ||
            !pd.token ||
            !pd.allowance ||
            !pd.period ||
            !pd.start ||
            !pd.end
        ) {
            return NextResponse.json(
                { error: "permission_data_required", message: "Full permissionData struct required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Ensure customer wallet matches the signed permission account
        if (String(pd.account || "").toLowerCase() !== customerWallet) {
            return NextResponse.json(
                { error: "wallet_mismatch", message: "permissionData.account must match customerWallet" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const subscription = await createSubscription({
            planId: plan.planId,
            merchantWallet: plan.merchantWallet,
            customerWallet,
            priceUsd: plan.priceUsd,
            period: plan.period,
            permissionSignature: sig,
            permissionData: {
                account: String(pd.account).toLowerCase(),
                spender: String(pd.spender).toLowerCase(),
                token: String(pd.token).toLowerCase(),
                allowance: String(pd.allowance),
                period: Number(pd.period),
                start: Number(pd.start),
                end: Number(pd.end),
                salt: String(pd.salt || "0"),
                extraData: String(pd.extraData || "0x"),
            },
        });

        return NextResponse.json(
            { success: true, subscription },
            { status: 201, headers: { "x-correlation-id": correlationId } }
        );
    } catch (err: any) {
        console.error("[subscriptions/create] POST error:", err);
        return NextResponse.json(
            { error: "internal", message: err?.message || "Unknown error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
