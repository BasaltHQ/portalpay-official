import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { createPlan, listPlans, updatePlan, deactivatePlan } from "@/lib/subscriptions";
import type { BillingPeriod } from "@/lib/eip712-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions/plans?wallet=0x...
 * List active subscription plans for a merchant.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const wallet =
            req.nextUrl.searchParams.get("wallet")?.toLowerCase() ||
            req.headers.get("x-wallet")?.toLowerCase() ||
            "";

        if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
            return NextResponse.json(
                { error: "wallet_required", message: "Provide ?wallet=0x... for the merchant" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const plans = await listPlans(wallet);
        return NextResponse.json(
            { success: true, plans },
            { headers: { "x-correlation-id": correlationId } }
        );
    } catch (err: any) {
        console.error("[subscriptions/plans] GET error:", err);
        return NextResponse.json(
            { error: "internal", message: err?.message || "Unknown error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}

/**
 * POST /api/subscriptions/plans
 * Create a new subscription plan. Requires authenticated merchant wallet.
 *
 * Body: { name, description?, priceUsd, period? }
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const authed = await getAuthenticatedWallet(req);
        const body = await req.json().catch(() => ({}));
        const bodyWallet = String(body.wallet || "").toLowerCase();
        const headerWallet = String(req.headers.get("x-wallet") || "").toLowerCase();
        const wallet = (authed || bodyWallet || headerWallet).toLowerCase();

        if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
            return NextResponse.json(
                { error: "unauthorized", message: "Valid wallet required" },
                { status: 401, headers: { "x-correlation-id": correlationId } }
            );
        }

        const name = String(body.name || "").trim();
        const description = body.description ? String(body.description).trim() : undefined;
        const priceUsd = Number(body.priceUsd);
        const period: BillingPeriod = body.period || "MONTHLY";

        if (!name) {
            return NextResponse.json(
                { error: "name_required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }
        if (!priceUsd || priceUsd <= 0) {
            return NextResponse.json(
                { error: "invalid_price", message: "priceUsd must be > 0" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const plan = await createPlan({
            merchantWallet: wallet,
            name,
            description,
            priceUsd,
            period,
        });

        return NextResponse.json(
            { success: true, plan },
            { status: 201, headers: { "x-correlation-id": correlationId } }
        );
    } catch (err: any) {
        console.error("[subscriptions/plans] POST error:", err);
        return NextResponse.json(
            { error: "internal", message: err?.message || "Unknown error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}

/**
 * PUT /api/subscriptions/plans
 * Update an existing plan.
 * Body: { planId, name, description?, priceUsd?, period?, active? }
 */
export async function PUT(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const authed = await getAuthenticatedWallet(req);
        const body = await req.json().catch(() => ({}));
        const bodyWallet = String(body.wallet || "").toLowerCase(); // Optional override if admin
        const headerWallet = String(req.headers.get("x-wallet") || "").toLowerCase();
        const wallet = (authed || bodyWallet || headerWallet).toLowerCase();

        if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
            return NextResponse.json(
                { error: "unauthorized", message: "Valid wallet required" },
                { status: 401, headers: { "x-correlation-id": correlationId } }
            );
        }

        const { planId, name, description, priceUsd, period, active } = body;

        if (!planId) {
            return NextResponse.json(
                { error: "plan_id_required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const updated = await updatePlan(planId, wallet, {
            name,
            description,
            priceUsd,
            period,
            active,
        });

        if (!updated) {
            return NextResponse.json(
                { error: "not_found", message: "Plan not found or not owned by wallet" },
                { status: 404, headers: { "x-correlation-id": correlationId } }
            );
        }

        return NextResponse.json(
            { success: true, plan: updated },
            { headers: { "x-correlation-id": correlationId } }
        );
    } catch (err: any) {
        console.error("[subscriptions/plans] PUT error:", err);
        return NextResponse.json(
            { error: "internal", message: err?.message || "Unknown error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}

/**
 * DELETE /api/subscriptions/plans?planId=...
 * Deactivate a plan.
 */
export async function DELETE(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const authed = await getAuthenticatedWallet(req);
        const urlWallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
        const headerWallet = String(req.headers.get("x-wallet") || "").toLowerCase();
        const wallet = (authed || urlWallet || headerWallet).toLowerCase();

        if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
            return NextResponse.json(
                { error: "unauthorized", message: "Valid wallet required" },
                { status: 401, headers: { "x-correlation-id": correlationId } }
            );
        }

        const planId = req.nextUrl.searchParams.get("planId");
        if (!planId) {
            return NextResponse.json(
                { error: "plan_id_required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const success = await deactivatePlan(planId, wallet);
        if (!success) {
            return NextResponse.json(
                { error: "not_found", message: "Plan not found or not owned by wallet" },
                { status: 404, headers: { "x-correlation-id": correlationId } }
            );
        }

        return NextResponse.json(
            { success: true },
            { headers: { "x-correlation-id": correlationId } }
        );
    } catch (err: any) {
        console.error("[subscriptions/plans] DELETE error:", err);
        return NextResponse.json(
            { error: "internal", message: err?.message || "Unknown error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
