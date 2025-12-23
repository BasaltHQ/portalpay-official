import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const correlationId = crypto.randomUUID();
    try {
        const caller = await requireThirdwebAuth(req);
        const me = String(caller.wallet || "").toLowerCase();
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { ok: false, error: "missing_id" },
                { status: 400, headers: { "x-correlation-id": correlationId } }
            );
        }

        const container = await getContainer();
        // Case-insensitive lookup for receiptId
        const spec = {
            query: "SELECT * FROM c WHERE c.type = 'receipt' AND LOWER(c.receiptId) = @id",
            parameters: [{ name: "@id", value: id.toLowerCase() }],
        };

        const { resources } = await container.items.query(spec).fetchAll();
        const r = resources[0];

        if (!r) {
            return NextResponse.json(
                { ok: false, error: "not_found" },
                { status: 404, headers: { "x-correlation-id": correlationId } }
            );
        }

        // Auth check: caller must be buyer or merchant
        const buyer = String(r.buyerWallet || "").toLowerCase();
        const merchant = String(r.wallet || "").toLowerCase();

        if (me !== buyer && me !== merchant) {
            return NextResponse.json(
                { ok: false, error: "unauthorized" },
                { status: 403, headers: { "x-correlation-id": correlationId } }
            );
        }

        const item = {
            receiptId: String(r.receiptId || ""),
            merchantWallet: String(r.wallet || ""),
            totalUsd: Number(r.totalUsd || 0),
            currency: String(r.currency || "USD"),
            lineItems: Array.isArray(r.lineItems) ? r.lineItems : [],
            createdAt: Number(r.createdAt || 0),
            status: String(r.status || "generated"),
            buyerWallet: String(r.buyerWallet || ""),
            shopSlug: typeof r.shopSlug === "string" ? r.shopSlug : undefined,
            tokenSymbol: String((r?.metadata?.token ?? r?.token ?? r?.expectedToken ?? r?.settlementToken ?? "") || ""),
            tokenAmount: Number(r?.metadata?.tokenValue ?? r?.tokenValue ?? r?.expectedAmountToken ?? r?.settlementAmountToken ?? 0),
            transactionHash:
                typeof r?.transactionHash === "string" && r.transactionHash
                    ? String(r.transactionHash)
                    : typeof r?.metadata?.txHash === "string" && r.metadata.txHash
                        ? String(r.metadata.txHash)
                        : "",
        };

        return NextResponse.json(
            { ok: true, item },
            { headers: { "x-correlation-id": correlationId } }
        );
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message || "failed" },
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
