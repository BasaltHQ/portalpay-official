/**
 * Merchant-to-Customer Subscription System
 *
 * Cosmos DB types and CRUD for:
 * - SubscriptionPlan: merchant-defined plans (price, period, description)
 * - SubscriptionRecord: customer subscriptions with spend permission data
 *
 * Uses the same Cosmos container ("payportal_events") and getContainer() as billing.
 */

import { getContainer } from "@/lib/cosmos";
import type { BillingPeriod } from "@/lib/eip712-subscriptions";
import { randomUUID } from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Merchant-defined subscription plan */
export type SubscriptionPlan = {
    id: string;                          // "sub_plan|{planId}"
    type: "subscription_plan";
    planId: string;                      // UUID
    merchantWallet: string;              // lowercase hex address
    name: string;                        // e.g. "Gold Membership"
    description?: string;
    priceUsd: number;                    // dollars (e.g. 29.99)
    period: BillingPeriod;               // "MONTHLY" | "WEEKLY" | etc.
    active: boolean;
    createdAt: number;                   // epoch ms
    updatedAt: number;
};

/** Customer subscription to a merchant plan */
export type SubscriptionRecord = {
    id: string;                          // "subscription|{subscriptionId}"
    type: "subscription";
    subscriptionId: string;              // UUID
    planId: string;                      // references SubscriptionPlan.planId
    merchantWallet: string;              // lowercase hex
    customerWallet: string;              // lowercase hex (partition key)
    priceUsd: number;                    // price at time of subscription
    period: BillingPeriod;
    status: "active" | "cancelled" | "expired" | "past_due";
    // Spend permission data
    permissionSignature: string;         // "0x..." EIP-712 signature
    permissionData: {
        account: string;
        spender: string;
        token: string;
        allowance: string;                 // bigint as string
        period: number;
        start: number;
        end: number;
        salt: string;                      // bigint as string
        extraData: string;
    };
    // Billing state
    lastChargedAt?: number;              // epoch ms
    nextChargeAt: number;                // epoch ms
    chargeCount: number;
    totalChargedUsd: number;
    // Metadata
    createdAt: number;
    updatedAt: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeHex(addr: string): string {
    const a = String(addr || "").toLowerCase().trim();
    return /^0x[a-fA-F0-9]{40}$/.test(a) ? a : "";
}

function now(): number {
    return Date.now();
}

// ─── Plan CRUD ───────────────────────────────────────────────────────────────

/** Create a new subscription plan for a merchant */
export async function createPlan(params: {
    merchantWallet: string;
    name: string;
    description?: string;
    priceUsd: number;
    period: BillingPeriod;
}): Promise<SubscriptionPlan> {
    const wallet = normalizeHex(params.merchantWallet);
    if (!wallet) throw new Error("invalid_merchant_wallet");
    if (!params.name?.trim()) throw new Error("name_required");
    if (typeof params.priceUsd !== "number" || params.priceUsd <= 0) throw new Error("invalid_price");

    const planId = randomUUID();
    const ts = now();

    const doc: SubscriptionPlan = {
        id: `sub_plan|${planId}`,
        type: "subscription_plan",
        planId,
        merchantWallet: wallet,
        name: params.name.trim(),
        description: params.description?.trim() || undefined,
        priceUsd: params.priceUsd,
        period: params.period || "MONTHLY",
        active: true,
        createdAt: ts,
        updatedAt: ts,
    };

    const container = await getContainer();
    await container.items.upsert(doc, { disableAutomaticIdGeneration: true });
    return doc;
}

/** List all active plans for a merchant */
export async function listPlans(merchantWallet: string): Promise<SubscriptionPlan[]> {
    const wallet = normalizeHex(merchantWallet);
    if (!wallet) return [];

    const container = await getContainer();
    const { resources } = await container.items
        .query({
            query:
                "SELECT * FROM c WHERE c.type='subscription_plan' AND c.merchantWallet=@w AND c.active=true ORDER BY c.createdAt DESC",
            parameters: [{ name: "@w", value: wallet }],
        })
        .fetchAll();

    return (resources || []) as SubscriptionPlan[];
}

/** Get a single plan by planId */
export async function getPlan(planId: string): Promise<SubscriptionPlan | null> {
    if (!planId) return null;
    const container = await getContainer();
    const { resources } = await container.items
        .query({
            query: "SELECT TOP 1 * FROM c WHERE c.type='subscription_plan' AND c.planId=@p",
            parameters: [{ name: "@p", value: planId }],
        })
        .fetchAll();

    return resources?.[0] as SubscriptionPlan | null || null;
}

/** Deactivate a plan (soft delete) */
export async function deactivatePlan(planId: string, merchantWallet: string): Promise<boolean> {
    const plan = await getPlan(planId);
    if (!plan) return false;
    if (plan.merchantWallet !== normalizeHex(merchantWallet)) return false;

    const container = await getContainer();
    await container.items.upsert(
        { ...plan, active: false, updatedAt: now() },
        { disableAutomaticIdGeneration: true }
    );
    return true;
}

/** Update a plan (name, description, etc.) */
export async function updatePlan(
    planId: string,
    merchantWallet: string,
    updates: Partial<Pick<SubscriptionPlan, "name" | "description" | "priceUsd" | "period" | "active">>
): Promise<SubscriptionPlan | null> {
    const plan = await getPlan(planId);
    if (!plan) return null;
    if (plan.merchantWallet !== normalizeHex(merchantWallet)) return null;

    const updated: SubscriptionPlan = {
        ...plan,
        ...updates,
        updatedAt: now(),
    };

    // If price/period changes, we should ideally warn or version, but for now we allow it.
    // Existing subscriptions are locked to the price they signed for in the EIP-712 struct.

    const container = await getContainer();
    await container.items.upsert(updated, { disableAutomaticIdGeneration: true });
    return updated;
}

// ─── Subscription CRUD ──────────────────────────────────────────────────────

/** Create a new subscription record after customer signs spend permission */
export async function createSubscription(params: {
    planId: string;
    merchantWallet: string;
    customerWallet: string;
    priceUsd: number;
    period: BillingPeriod;
    permissionSignature: string;
    permissionData: SubscriptionRecord["permissionData"];
}): Promise<SubscriptionRecord> {
    const merchantWallet = normalizeHex(params.merchantWallet);
    const customerWallet = normalizeHex(params.customerWallet);
    if (!merchantWallet) throw new Error("invalid_merchant_wallet");
    if (!customerWallet) throw new Error("invalid_customer_wallet");
    if (!params.permissionSignature) throw new Error("signature_required");

    const subscriptionId = randomUUID();
    const ts = now();

    // First charge happens immediately after subscription creation
    const periodMs = params.permissionData.period * 1000;

    const doc: SubscriptionRecord = {
        id: `subscription|${subscriptionId}`,
        type: "subscription",
        subscriptionId,
        planId: params.planId,
        merchantWallet,
        customerWallet,
        priceUsd: params.priceUsd,
        period: params.period,
        status: "active",
        permissionSignature: params.permissionSignature,
        permissionData: params.permissionData,
        lastChargedAt: undefined,
        nextChargeAt: ts, // charge immediately on first run
        chargeCount: 0,
        totalChargedUsd: 0,
        createdAt: ts,
        updatedAt: ts,
    };

    const container = await getContainer();
    await container.items.upsert(doc, { disableAutomaticIdGeneration: true });
    return doc;
}

/** Get a subscription by ID */
export async function getSubscription(subscriptionId: string): Promise<SubscriptionRecord | null> {
    if (!subscriptionId) return null;
    const container = await getContainer();
    const { resources } = await container.items
        .query({
            query: "SELECT TOP 1 * FROM c WHERE c.type='subscription' AND c.subscriptionId=@s",
            parameters: [{ name: "@s", value: subscriptionId }],
        })
        .fetchAll();

    return resources?.[0] as SubscriptionRecord | null || null;
}

/** List subscriptions for a customer */
export async function listCustomerSubscriptions(customerWallet: string): Promise<SubscriptionRecord[]> {
    const wallet = normalizeHex(customerWallet);
    if (!wallet) return [];

    const container = await getContainer();
    const { resources } = await container.items
        .query({
            query:
                "SELECT * FROM c WHERE c.type='subscription' AND c.customerWallet=@w ORDER BY c.createdAt DESC",
            parameters: [{ name: "@w", value: wallet }],
        })
        .fetchAll();

    return (resources || []) as SubscriptionRecord[];
}

/** List subscriptions for a merchant's plans */
export async function listMerchantSubscriptions(merchantWallet: string): Promise<SubscriptionRecord[]> {
    const wallet = normalizeHex(merchantWallet);
    if (!wallet) return [];

    const container = await getContainer();
    const { resources } = await container.items
        .query({
            query:
                "SELECT * FROM c WHERE c.type='subscription' AND c.merchantWallet=@w ORDER BY c.createdAt DESC",
            parameters: [{ name: "@w", value: wallet }],
        })
        .fetchAll();

    return (resources || []) as SubscriptionRecord[];
}

/** Cancel a subscription */
export async function cancelSubscription(
    subscriptionId: string,
    customerWallet: string
): Promise<boolean> {
    const sub = await getSubscription(subscriptionId);
    if (!sub) return false;
    if (sub.customerWallet !== normalizeHex(customerWallet)) return false;
    if (sub.status === "cancelled") return true; // idempotent

    const container = await getContainer();
    await container.items.upsert(
        { ...sub, status: "cancelled" as const, updatedAt: now() },
        { disableAutomaticIdGeneration: true }
    );
    return true;
}

/** Get all active subscriptions due for charging */
export async function getDueSubscriptions(): Promise<SubscriptionRecord[]> {
    const ts = now();
    const container = await getContainer();
    const { resources } = await container.items
        .query({
            query:
                "SELECT * FROM c WHERE c.type='subscription' AND c.status='active' AND c.nextChargeAt <= @now",
            parameters: [{ name: "@now", value: ts }],
        })
        .fetchAll();

    return (resources || []) as SubscriptionRecord[];
}

/** Update subscription after a successful charge */
export async function recordCharge(
    subscriptionId: string,
    chargeAmountUsd: number
): Promise<SubscriptionRecord | null> {
    const sub = await getSubscription(subscriptionId);
    if (!sub) return null;

    const ts = now();
    const periodMs = sub.permissionData.period * 1000;

    const updated: SubscriptionRecord = {
        ...sub,
        lastChargedAt: ts,
        nextChargeAt: ts + periodMs,
        chargeCount: sub.chargeCount + 1,
        totalChargedUsd: sub.totalChargedUsd + chargeAmountUsd,
        updatedAt: ts,
    };

    const container = await getContainer();
    await container.items.upsert(updated, { disableAutomaticIdGeneration: true });
    return updated;
}

/** Mark subscription as past_due after a failed charge */
export async function markPastDue(subscriptionId: string): Promise<void> {
    const sub = await getSubscription(subscriptionId);
    if (!sub) return;

    const container = await getContainer();
    await container.items.upsert(
        { ...sub, status: "past_due" as const, updatedAt: now() },
        { disableAutomaticIdGeneration: true }
    );
}

/** Get subscriber count for a plan */
export async function getSubscriberCount(planId: string): Promise<number> {
    if (!planId) return 0;
    const container = await getContainer();
    const { resources } = await container.items
        .query({
            query:
                "SELECT VALUE COUNT(1) FROM c WHERE c.type='subscription' AND c.planId=@p AND c.status='active'",
            parameters: [{ name: "@p", value: planId }],
        })
        .fetchAll();

    return typeof resources?.[0] === "number" ? resources[0] : 0;
}
