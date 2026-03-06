import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";

/**
 * POST /api/receipts/[id]/tracking
 * Updates tracking information (carrier, trackingNumber, trackingUrl) on a receipt.
 * Merchant-only: requires auth + wallet ownership of the receipt.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const correlationId = crypto.randomUUID();
    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: "missing_id" }, { status: 400, headers: { "x-correlation-id": correlationId } });
    }

    let wallet = "";
    try {
        const caller = await requireThirdwebAuth(req);
        // Use x-wallet header if present and valid (admin acting on their own receipts)
        const xWallet = req.headers.get("x-wallet");
        if (xWallet && /^0x[a-f0-9]{40}$/i.test(xWallet)) {
            wallet = xWallet.toLowerCase();
        } else {
            wallet = caller.wallet;
        }
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "unauthorized" },
            { status: 401, headers: { "x-correlation-id": correlationId } }
        );
    }

    const body = await req.json().catch(() => ({}));

    // Validate tracking fields
    const carrier = typeof body?.carrier === "string" ? body.carrier.trim().slice(0, 100) : "";
    const trackingNumber = typeof body?.trackingNumber === "string" ? body.trackingNumber.trim().slice(0, 200) : "";
    const trackingUrl = typeof body?.trackingUrl === "string" ? body.trackingUrl.trim().slice(0, 500) : "";

    if (!carrier && !trackingNumber) {
        return NextResponse.json(
            { error: "invalid_request", message: "carrier or tracking number required" },
            { status: 400, headers: { "x-correlation-id": correlationId } }
        );
    }

    try {
        const container = await getContainer();

        // Find the receipt
        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.type='receipt' AND c.receiptId=@id AND c.wallet=@wallet",
            parameters: [
                { name: "@id", value: id },
                { name: "@wallet", value: wallet },
            ],
        }).fetchAll();

        const receipt = Array.isArray(resources) && resources[0] ? resources[0] : null;
        if (!receipt) {
            return NextResponse.json({ error: "receipt_not_found" }, { status: 404, headers: { "x-correlation-id": correlationId } });
        }

        const ts = Date.now();
        const tracking = {
            carrier,
            trackingNumber,
            trackingUrl,
            shippedAt: receipt.tracking?.shippedAt || ts,
            updatedAt: ts,
        };

        const updated = {
            ...receipt,
            tracking,
            lastUpdatedAt: ts,
            statusHistory: Array.isArray(receipt.statusHistory)
                ? [...receipt.statusHistory, { status: "shipped", ts }]
                : [{ status: "shipped", ts }],
        };

        // Set status to "shipped" if not already in a later stage
        const laterStatuses = ["delivered", "completed"];
        if (!laterStatuses.includes((receipt.status || "").toLowerCase())) {
            updated.status = "shipped";
        }

        await container.items.upsert(updated);

        return NextResponse.json({ ok: true, tracking }, { headers: { "x-correlation-id": correlationId } });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "server_error" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
