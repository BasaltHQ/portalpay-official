import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { indexSplitTransactions } from "@/lib/split-indexer";

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * POST /api/split/webhook
 * Webhook endpoint to trigger split transaction indexing
 * Called after payments or periodically to keep data synchronized
 * 
 * Body:
 * - splitAddress: The split contract address
 * - merchantWallet: The merchant wallet address
 * - trigger: Optional trigger type ('payment', 'manual', 'scheduled')
 */
export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  
  try {
    const body = await req.json().catch(() => ({}));
    const splitAddress = body?.splitAddress || "";
    const merchantWallet = body?.merchantWallet || "";
    const trigger = body?.trigger || "manual";
    // Optional targeted reconciliation data
    const txHashesIn = Array.isArray(body?.txHashes) ? body.txHashes : [];
    const txHashes = txHashesIn.map((h: any) => String(h || "").toLowerCase()).filter((h: string) => /^0x[a-f0-9]{64}$/i.test(h));
    const corrIn = typeof body?.correlationId === "string" ? String(body.correlationId) : undefined;
    
    console.log(`[SPLIT WEBHOOK] Received indexing request - merchant: ${merchantWallet.slice(0,10)}..., trigger: ${trigger}`);
    
    if (!splitAddress || !/^0x[a-f0-9]{40}$/i.test(splitAddress)) {
      return NextResponse.json(
        { ok: false, error: "invalid_split_address" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }
    
    if (!merchantWallet || !/^0x[a-f0-9]{40}$/i.test(merchantWallet)) {
      return NextResponse.json(
        { ok: false, error: "invalid_merchant_wallet" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }
    
    // Trigger indexing
    const result = await indexSplitTransactions(splitAddress, merchantWallet);
    
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500, headers: { "x-correlation-id": correlationId } }
      );
    }
    
    console.log(`[SPLIT WEBHOOK] Successfully indexed ${result.indexed} transactions for ${merchantWallet.slice(0,10)}...`);
    
    // Immediately trigger reconciliation (targeted by txHashes when provided)
    let reconcile: any = null;
    try {
      const recRes = await fetch(`${req.nextUrl.origin}/api/split/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantWallet,
          splitAddress,
          txHashes,
          correlationId: corrIn || correlationId
        })
      });
      reconcile = await recRes.json().catch(() => ({}));
      console.log(`[SPLIT WEBHOOK] Reconcile result:`, reconcile);
    } catch (e) {
      console.error("[SPLIT WEBHOOK] Error reconciling after indexing:", e);
    }
    
    return NextResponse.json(
      { 
        ok: true,
        indexed: result.indexed,
        metrics: result.metrics,
        trigger,
        reconcile
      },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    console.error("[SPLIT WEBHOOK] Error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "webhook_failed" },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}

/**
 * GET /api/split/webhook
 * Health check endpoint
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    ok: true, 
    service: "split-indexer-webhook",
    status: "active" 
  });
}
