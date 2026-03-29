import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";

/**
 * PATCH /api/orders/[id]/edit
 * 
 * Edit an existing active receipt (add items, cancel items, or cancel the whole order).
 * Cannot edit if the receipt is in `paid` status.
 *
 * Payload:
 * {
 *   wallet: string; // The merchant wallet making the request
 *   action: "cancel_order" | "edit_items";
 *   reason?: string;
 *   addedItems?: any[];
 *   cancelledItemIndices?: { index: number; reason: string }[];
 * }
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const correlationId = crypto.randomUUID();
    try {
        const { id } = await context.params;
        const body = await req.json().catch(() => ({}));
        
        // We require the wallet in the headers or body from Handheld devices
        const merchantWallet = req.headers.get("x-wallet") || body.wallet;

        if (!id) {
            return NextResponse.json(
                { ok: false, error: "missing_id" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        if (!merchantWallet) {
            return NextResponse.json(
                { ok: false, error: "Wallet required" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const container = await getContainer();
        const spec = {
            // Include both exact ID and receipt:ID matching
            query: "SELECT * FROM c WHERE c.type = 'receipt' AND (LOWER(c.receiptId) = @id OR LOWER(c.id) = @fullId) AND c.wallet = @wallet",
            parameters: [
                { name: "@id", value: id.toLowerCase().replace("receipt:", "") },
                { name: "@fullId", value: id.toLowerCase().includes("receipt:") ? id.toLowerCase() : `receipt:${id.toLowerCase()}` },
                { name: "@wallet", value: merchantWallet.toLowerCase() }
            ],
        };

        const { resources } = await container.items.query(spec).fetchAll();
        const receipt = resources[0];

        if (!receipt) {
            return NextResponse.json(
                { ok: false, error: "not_found" },
                { status: 404, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Must not be paid
        if (receipt.status === "paid") {
            return NextResponse.json(
                { ok: false, error: "cannot_edit_paid_ticket" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        if (body.action === "cancel_order") {
            receipt.status = "cancelled";
            // KDS will use receipt.cancelledAt to clear it after 5m or show a manual clear button
            receipt.metadata = receipt.metadata || {};
            receipt.metadata.cancelReason = body.reason || "No reason provided";
            receipt.cancelledAt = Date.now();
            
            await container.items.upsert(receipt);
            
            return NextResponse.json({ ok: true, receipt });
        }

        if (body.action === "mark_item_ready") {
            const idx = body.itemIndex;
            if (Array.isArray(receipt.lineItems) && idx >= 0 && idx < receipt.lineItems.length) {
                receipt.lineItems[idx].readyAt = Date.now();
                await container.items.upsert(receipt);
                return NextResponse.json({ ok: true, receipt });
            }
            return NextResponse.json(
                { ok: false, error: "invalid_item_index" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        if (body.action === "edit_items") {
            // Ensure lineItems exists
            if (!Array.isArray(receipt.lineItems)) {
                receipt.lineItems = [];
            }

            let recalculateTotal = false;
            let addedNewItems = false;

            // Handle Cancellations
            if (Array.isArray(body.cancelledItemIndices)) {
                for (const cancellation of body.cancelledItemIndices) {
                    const idx = cancellation.index;
                    if (idx >= 0 && idx < receipt.lineItems.length && !receipt.lineItems[idx].cancelled) {
                        receipt.lineItems[idx].cancelled = true;
                        receipt.lineItems[idx].cancelReason = cancellation.reason || "Removed by staff";
                        receipt.lineItems[idx].cancelledAt = Date.now();
                        recalculateTotal = true;
                    }
                }
            }

            // Handle Additions
            if (Array.isArray(body.addedItems) && body.addedItems.length > 0) {
                const now = Date.now();
                const taggedItems = body.addedItems.map((item: any) => ({
                    ...item,
                    addedAt: now
                }));
                receipt.lineItems.push(...taggedItems);
                
                // Alert the KDS by pulling it back to the first column
                // The user requested it goes back to "new" (or prep), even if it was previously archived.
                receipt.kitchenStatus = "new";
                addedNewItems = true;
                recalculateTotal = true;
            }

            // Recalculate Total
            if (recalculateTotal) {
                let newTotal = 0;
                let activeItemsCount = 0;
                for (const item of receipt.lineItems) {
                    if (item.cancelled) continue; // skip cancelled items from total

                    activeItemsCount++;
                    const qty = item.qty || 1;
                    const price = Number(item.priceUsd) || 0;
                    newTotal += price * qty;
                    
                    if (item.attributes?.modifierGroups && Array.isArray(item.attributes.modifierGroups)) {
                        for (const mg of item.attributes.modifierGroups) {
                            if (mg.modifiers && Array.isArray(mg.modifiers)) {
                                for (const m of mg.modifiers) {
                                    if (m.selected && m.priceAdjustment) {
                                        newTotal += Number(m.priceAdjustment) * qty;
                                    }
                                }
                            }
                        }
                    } else if (item.modifiers && Array.isArray(item.modifiers)) {
                        for (const m of item.modifiers) {
                            if (m.priceAdjustment) {
                                newTotal += Number(m.priceAdjustment) * qty;
                            }
                        }
                    }
                }

                receipt.totalUsd = parseFloat(newTotal.toFixed(2));
                // Add an edit log
                receipt.metadata = receipt.metadata || {};
                receipt.metadata.editHistory = receipt.metadata.editHistory || [];
                receipt.metadata.editHistory.push({
                    timestamp: Date.now(),
                    action: "edited_items",
                    addedItemsCount: body.addedItems?.length || 0,
                    cancelledItemsCount: body.cancelledItemIndices?.length || 0
                });

                if (activeItemsCount === 0) {
                    receipt.status = "cancelled";
                    receipt.metadata.cancelReason = "All items removed by staff during edit";
                    receipt.cancelledAt = Date.now();
                }
            }

            await container.items.upsert(receipt);
            
            return NextResponse.json({ ok: true, receipt });
        }

        return NextResponse.json(
            { ok: false, error: "invalid_action" },
            { status: 400, headers: { "x-correlation-id": correlationId } }
        );

    } catch (e: any) {
        console.error("Failed to edit order:", e);
        return NextResponse.json(
            { ok: false, error: e?.message || "failed" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
