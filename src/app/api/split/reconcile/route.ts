import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";
import { auditEvent } from "@/lib/audit";
import { fetchEthRates } from "@/lib/eth";

/**
 * POST /api/split/reconcile
 * Reconciles receipts for a merchant by matching split inbound payments.
 *
 * Body:
 * - merchantWallet: string (required, hex address)
 * - splitAddress: string (optional, hex address; if not provided, attempt to resolve via site config)
 * - txHashes: string[] (optional, preferred; specific transaction hashes to reconcile)
 * - timeWindowMs: number (optional; default 2 hours)
 * - tolerancePct: number (optional; default 1.0 i.e., ±1% on value matching)
 * - receiptId: string (optional; reconcile a single receipt)
 *
 * Strategy:
 * - If txHashes provided, fetch split transactions and filter by those hashes.
 * - Else fetch recent split transactions and try to match:
 *   • First by expectedToken/expectedAmountToken metadata from receipt (status: checkout_initialized)
 *   • Fallback: USD value matching within tolerance and timestamp window
 *   • Fallback: buyerWallet equals tx.from if present
 * - On match: set transactionHash, transactionTimestamp, buyerWallet; status -> 'reconciled' (idempotent).
 * - Write an idempotency link doc: receipt_tx_link:{receiptId} to prevent duplicate linking.
 */

function isHexAddr(s: string): boolean {
  return /^0x[a-f0-9]{40}$/i.test(String(s || "").trim());
}

function isTxHash(s: string): boolean {
  return /^0x[a-f0-9]{64}$/i.test(String(s || "").trim());
}

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();

  try {
    const body = await req.json().catch(() => ({}));
    const merchantWallet = String(body.merchantWallet || "").toLowerCase();
    let splitAddress = String(body.splitAddress || "").toLowerCase();
    const txHashesIn: any[] = Array.isArray(body.txHashes) ? body.txHashes : [];
    const txHashes = txHashesIn.map((h) => String(h || "").toLowerCase()).filter((h) => isTxHash(h));
    const timeWindowMs = Number.isFinite(Number(body.timeWindowMs)) ? Math.max(60_000, Number(body.timeWindowMs)) : 2 * 60 * 60 * 1000;
    const tolerancePct = Number.isFinite(Number(body.tolerancePct)) ? Math.max(0, Math.min(100, Number(body.tolerancePct))) : 20.0;
    const receiptIdTarget = typeof body.receiptId === "string" && String(body.receiptId).trim() ? String(body.receiptId).trim() : undefined;

    if (!isHexAddr(merchantWallet)) {
      return NextResponse.json(
        { ok: false, error: "invalid_merchant_wallet" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    const container = await getContainer();

    // Resolve splitAddress via site config if not provided
    if (!isHexAddr(splitAddress)) {
      try {
        const { resource: siteCfg } = await container.item("site:config", merchantWallet).read<any>();
        const resolved = String(siteCfg?.splitAddress || siteCfg?.split?.address || "").toLowerCase();
        if (isHexAddr(resolved)) {
          splitAddress = resolved;
        }
      } catch { }
    }

    if (!isHexAddr(splitAddress)) {
      return NextResponse.json(
        { ok: false, error: "split_required" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    const baseOrigin = req.nextUrl.origin;

    // Fetch split transactions for this merchant
    const txUrl = `${baseOrigin}/api/split/transactions?splitAddress=${encodeURIComponent(splitAddress)}&merchantWallet=${encodeURIComponent(merchantWallet)}&limit=1000`;
    const txRes = await fetch(txUrl, { cache: "no-store" });
    const txData = await txRes.json().catch(() => ({}));
    if (!txRes.ok || !txData?.ok) {
      return NextResponse.json(
        { ok: false, error: txData?.error || "failed_to_fetch_transactions" },
        { status: 500, headers: { "x-correlation-id": correlationId } }
      );
    }

    const transactions: any[] = Array.isArray(txData.transactions) ? txData.transactions : [];
    const paymentTxs = transactions.filter((t: any) => t?.type === "payment");

    // If receiptId is provided, focus on it
    let candidateReceipts: any[] = [];
    const now = Date.now();
    const windowStart = now - timeWindowMs;
    const statusesForRecon = new Set(["generated", "pending", "checkout_initialized", "checkout_success", "edited"]);

    if (receiptIdTarget) {
      // Load specific receipt doc for merchant partition
      try {
        const { resource } = await container.item(`receipt:${receiptIdTarget}`, merchantWallet).read<any>();
        if (resource) candidateReceipts = [resource];
      } catch { }
    } else {
      // Query recent receipts for this merchant partition
      try {
        const spec = {
          query:
            "SELECT c.id, c.receiptId, c.status, c.createdAt, c.expectedToken, c.expectedAmountToken, c.expectedUsd, c.buyerWallet, c.transactionHash FROM c WHERE c.type='receipt' AND c.wallet=@w AND c.createdAt>=@start",
          parameters: [{ name: "@w", value: merchantWallet }, { name: "@start", value: windowStart }]
        } as { query: string; parameters: any[] };
        const { resources } = await container.items.query(spec).fetchAll();
        candidateReceipts = (Array.isArray(resources) ? resources : []).filter(
          (r: any) =>
            statusesForRecon.has(String(r.status || "").toLowerCase()) &&
            !isTxHash(String(r.transactionHash || ""))
        );
      } catch { }
    }

    // Token prices for USD conversion
    let ethUsdRate = 0;
    try {
      const rates = await fetchEthRates();
      ethUsdRate = Number(rates?.USD || 0);
    } catch { }
    const tokenPrices: Record<string, number> = {
      ETH: ethUsdRate || 2500,
      USDC: 1.0,
      USDT: 1.0,
      cbBTC: 65000,
      cbXRP: 0.50
    };

    function toUsd(token: string, value: number): number {
      const p = tokenPrices[token] || 0;
      return +(value * p).toFixed(2);
    }

    function withinTolerance(expected: number, actual: number, pct: number): boolean {
      if (!(expected > 0) || !(actual > 0)) return false;
      const delta = Math.abs(actual - expected);
      const relTol = (pct / 100) * expected;
      const absTol = 5.0; // $5 min tolerance
      return delta <= Math.max(relTol, absTol);
    }

    // Helper to update receipt doc idempotently
    async function linkReceiptToTx(receipt: any, tx: any) {
      const receiptId = String(receipt.receiptId || receipt.id || "").trim();
      if (!receiptId) return false;

      // Idempotency: if already linked; or link doc exists
      const linkId = `receipt_tx_link:${receiptId}`;
      try {
        const { resource: existingLink } = await container.item(linkId, linkId).read<any>();
        if (existingLink && existingLink.txHash && isTxHash(String(existingLink.txHash))) {
          return false;
        }
      } catch { }

      const ts = Date.now();
      const docId = `receipt:${receiptId}`;
      let resource: any = null;
      try {
        const { resource: existing } = await container.item(docId, merchantWallet).read<any>();
        resource = existing || null;
      } catch { }

      const next = resource
        ? {
          ...resource,
          status: "reconciled",
          statusHistory: Array.isArray(resource.statusHistory)
            ? [...resource.statusHistory, { status: "reconciled", ts }]
            : [{ status: "reconciled", ts }],
          lastUpdatedAt: ts,
          transactionHash: String(tx.hash || tx.txHash || "").toLowerCase(),
          transactionTimestamp: Number(tx.timestamp || Date.now()),
          buyerWallet:
            String(resource.buyerWallet || tx.from || "").toLowerCase() || undefined
        }
        : {
          id: docId,
          type: "receipt",
          wallet: merchantWallet,
          receiptId,
          status: "reconciled",
          statusHistory: [{ status: "reconciled", ts }],
          createdAt: Number(receipt.createdAt || ts),
          lastUpdatedAt: ts,
          transactionHash: String(tx.hash || tx.txHash || "").toLowerCase(),
          transactionTimestamp: Number(tx.timestamp || ts),
          buyerWallet: String(tx.from || "").toLowerCase() || undefined
        };

      await container.items.upsert(next as any);

      // Write link doc
      await container.items.upsert({
        id: linkId,
        type: "receipt_tx_link",
        txHash: String(tx.hash || tx.txHash || "").toLowerCase(),
        merchantWallet,
        linkedAt: ts,
        correlationId
      } as any);

      try {
        await auditEvent(req, {
          who: String(next.buyerWallet || "unknown"),
          roles: [],
          what: "receipt_reconciled",
          target: merchantWallet,
          correlationId,
          ok: true,
          metadata: { receiptId, txHash: next.transactionHash }
        });
      } catch { }

      return true;
    }

    let reconciledCount = 0;
    const unmatched: string[] = [];

    // If specific tx hashes provided, match by hash; link to receiptIdTarget or try to find matching receipt
    if (txHashes.length > 0) {
      for (const h of txHashes) {
        const tx = paymentTxs.find((t: any) => String(t.hash || t.txHash || "").toLowerCase() === h);
        if (!tx) {
          unmatched.push(h);
          continue;
        }

        let targetReceipt: any = null;

        if (receiptIdTarget) {
          targetReceipt = candidateReceipts.find((r: any) => String(r.receiptId || r.id || "") === receiptIdTarget);
        } else {
          // Prefer match on expected metadata
          targetReceipt =
            candidateReceipts.find((r: any) => {
              const tok = String(r.expectedToken || "").toUpperCase();
              const amt = Number(r.expectedAmountToken || 0);
              const usd = Number(r.expectedUsd || 0);
              const txUsd = toUsd(String(tx.token || "ETH"), Number(tx.value || 0));
              const timeOk =
                Number(tx.timestamp || now) >= (Number(r.createdAt || now) - timeWindowMs) &&
                Number(tx.timestamp || now) <= (Number(r.createdAt || now) + timeWindowMs);
              const tokenOk = tok ? tok === String(tx.token || "").toUpperCase() : true;
              const amtOk = tok ? withinTolerance(amt, Number(tx.value || 0), tolerancePct) : true;
              const usdOk = usd ? withinTolerance(usd, txUsd, tolerancePct) : true;
              return timeOk && tokenOk && (amtOk || usdOk);
            }) ||
            // Fallback by USD & time
            candidateReceipts.find((r: any) => {
              const usd = Number(r.expectedUsd || 0) || Number(r.totalUsd || 0);
              const txUsd = toUsd(String(tx.token || "ETH"), Number(tx.value || 0));
              const timeOk =
                Number(tx.timestamp || now) >= (Number(r.createdAt || now) - timeWindowMs) &&
                Number(tx.timestamp || now) <= (Number(r.createdAt || now) + timeWindowMs);
              return usd > 0 && timeOk && withinTolerance(usd, txUsd, tolerancePct);
            }) ||
            // Fallback by buyer wallet
            candidateReceipts.find((r: any) => {
              const bw = String(r.buyerWallet || "").toLowerCase();
              const from = String(tx.from || "").toLowerCase();
              const timeOk =
                Number(tx.timestamp || now) >= (Number(r.createdAt || now) - timeWindowMs) &&
                Number(tx.timestamp || now) <= (Number(r.createdAt || now) + timeWindowMs);
              return bw && from && bw === from && timeOk;
            });
        }

        if (targetReceipt) {
          const linked = await linkReceiptToTx(targetReceipt, tx);
          if (linked) reconciledCount++;
        } else {
          unmatched.push(h);
        }
      }

      return NextResponse.json(
        { ok: true, reconciled: reconciledCount, unmatched },
        { headers: { "x-correlation-id": correlationId } }
      );
    }

    // No specific hashes: iterate through payments and try to match
    for (const tx of paymentTxs) {
      let targetReceipt: any = null;

      if (receiptIdTarget) {
        targetReceipt = candidateReceipts.find((r: any) => String(r.receiptId || r.id || "") === receiptIdTarget);
      } else {
        targetReceipt =
          candidateReceipts.find((r: any) => {
            const tok = String(r.expectedToken || "").toUpperCase();
            const amt = Number(r.expectedAmountToken || 0);
            const usd = Number(r.expectedUsd || 0);
            const txUsd = toUsd(String(tx.token || "ETH"), Number(tx.value || 0));
            const timeOk =
              Number(tx.timestamp || now) >= (Number(r.createdAt || now) - timeWindowMs) &&
              Number(tx.timestamp || now) <= (Number(r.createdAt || now) + timeWindowMs);
            const tokenOk = tok ? tok === String(tx.token || "").toUpperCase() : true;
            const amtOk = tok ? withinTolerance(amt, Number(tx.value || 0), tolerancePct) : false;
            const usdOk = usd ? withinTolerance(usd, txUsd, tolerancePct) : false;
            return timeOk && tokenOk && (amtOk || usdOk);
          }) ||
          candidateReceipts.find((r: any) => {
            const usd = Number(r.expectedUsd || 0) || Number(r.totalUsd || 0);
            const txUsd = toUsd(String(tx.token || "ETH"), Number(tx.value || 0));
            const timeOk =
              Number(tx.timestamp || now) >= (Number(r.createdAt || now) - timeWindowMs) &&
              Number(tx.timestamp || now) <= (Number(r.createdAt || now) + timeWindowMs);
            return usd > 0 && timeOk && withinTolerance(usd, txUsd, tolerancePct);
          }) ||
          candidateReceipts.find((r: any) => {
            const bw = String(r.buyerWallet || "").toLowerCase();
            const from = String(tx.from || "").toLowerCase();
            const timeOk =
              Number(tx.timestamp || now) >= (Number(r.createdAt || now) - timeWindowMs) &&
              Number(tx.timestamp || now) <= (Number(r.createdAt || now) + timeWindowMs);
            return bw && from && bw === from && timeOk;
          });
      }

      if (targetReceipt) {
        const linked = await linkReceiptToTx(targetReceipt, tx);
        if (linked) reconciledCount++;
      }
    }

    return NextResponse.json(
      { ok: true, reconciled: reconciledCount },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    console.error("[SPLIT RECONCILE] Error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "reconcile_failed" },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}

/**
 * GET /api/split/reconcile
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "split-reconcile",
    status: "active"
  });
}
