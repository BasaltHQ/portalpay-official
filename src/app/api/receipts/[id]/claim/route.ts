import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/receipts/[id]/claim
 * Body: { wallet: string, shopSlug?: string, transactionHash?: string }
 * - Links a buyer wallet to a paid receipt (loyalty claim)
 * - Updates 'buyerWallet', 'shopSlug', and 'transactionHash' fields in Cosmos
 * - Auto-resolves shopSlug from merchant's shop config if missing
 * - Only works if receipt is paid/settled
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const correlationId = crypto.randomUUID();
    const p = await ctx.params;
    const id = String(p?.id || "").trim();

    if (!id) {
        return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    try {
        const body = await req.json().catch(() => ({}));
        const buyerWallet = String(body.wallet || "").toLowerCase();
        let shopSlug = body.shopSlug ? String(body.shopSlug).trim() : undefined;
        const transactionHash = body.transactionHash ? String(body.transactionHash).trim() : undefined;

        if (!/^0x[a-f0-9]{40}$/i.test(buyerWallet)) {
            return NextResponse.json({ ok: false, error: "invalid_wallet" }, { status: 400 });
        }

        const container = await getContainer();

        // We need to find the receipt. Since we might not know the merchant wallet (partition key),
        // we query by receiptId. Ideally, the client provides merchant wallet to optimized read,
        // but for safety we query.
        // However, for efficiency, let's try to assume the client passes the merchant wallet in header
        // or we query.
        // Querying by ID is safer.

        const spec = {
            query: "SELECT TOP 1 * FROM c WHERE c.type='receipt' AND c.receiptId=@id",
            parameters: [{ name: "@id", value: id }]
        };
        const { resources } = await container.items.query(spec).fetchAll();
        const existing = Array.isArray(resources) && resources[0] ? resources[0] : null;

        if (!existing) {
            return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
        }

        const status = String(existing.status || "").toLowerCase();
        const isPaid = ["paid", "completed", "reconciled", "settled", "checkout_success", "tx_mined"].includes(status);

        if (!isPaid) {
            return NextResponse.json({ ok: false, error: "receipt_not_paid" }, { status: 400 });
        }

        // If already claimed by someone else?
        // "let's them know that they are now registered... and link it"
        // If buyerWallet is already set and different, do we overwrite? 
        // Usually on-ramp creates a temp wallet. The user connecting is the "real" wallet.
        // Let's allow overwrite for now or if empty.

        // Auto-resolve shopSlug from merchant's shop config if not provided and not already on receipt
        if (!shopSlug && !existing.shopSlug) {
            const merchantWallet = String(existing.wallet || "").toLowerCase();
            if (merchantWallet) {
                try {
                    // Query for the shop config associated with this merchant
                    const shopSpec = {
                        query: "SELECT TOP 1 c.config.slug, c.config.name FROM c WHERE c.type='shop' AND c.wallet=@wallet",
                        parameters: [{ name: "@wallet", value: merchantWallet }]
                    };
                    const { resources: shops } = await container.items.query(shopSpec).fetchAll();
                    if (shops && shops[0]) {
                        shopSlug = shops[0].slug || shops[0].name || undefined;
                        console.log(`[CLAIM] Auto-resolved shopSlug="${shopSlug}" for merchant=${merchantWallet}`);
                    }
                } catch (e) {
                    console.error("[CLAIM] Failed to auto-resolve shopSlug:", e);
                }
            }
        }

        // Update - merge new fields with existing, preserving existing values if not provided
        const patch: Record<string, any> = {
            ...existing,
            buyerWallet: buyerWallet,
            claimed: true,  // Mark as claimed for loyalty tracking (without changing status)
            claimedAt: Date.now(),
            lastUpdatedAt: Date.now()
        };

        // Fix: If status was incorrectly changed to 'receipt_claimed', restore it to 'paid'
        if (existing.status === 'receipt_claimed') {
            patch.status = 'paid';
        }

        // Only update these if provided and not already set (or being explicitly updated)
        if (shopSlug && !existing.shopSlug) {
            patch.shopSlug = shopSlug;
        }
        if (transactionHash) {
            // Always update transactionHash if provided (it may come from the confirmation)
            patch.transactionHash = transactionHash;
        }

        await container.items.upsert(patch);

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("Claim failed", e);
        return NextResponse.json({ ok: false, error: e.message || "failed" }, { status: 500 });
    }
}

