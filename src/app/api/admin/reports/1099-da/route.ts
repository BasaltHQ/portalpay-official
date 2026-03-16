import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";

/**
 * GET /api/admin/reports/1099-da
 *
 * Generates IRS Form 1099-DA data for a merchant's digital asset transactions.
 * Implements PDAP (Processor of Digital Asset Payments) reporting per final
 * regulations (TD 9989, July 2024) effective for transactions on/after Jan 1, 2025.
 *
 * Query params:
 *   wallet       – Merchant wallet address (required)
 *   taxYear      – Calendar tax year, e.g. "2025" (required)
 *
 * Returns structured JSON with:
 *   - formData: populated 1099-DA box fields per IRS layout
 *   - transactions: individual disposition detail rows
 *   - summary: aggregate statistics
 *   - compliance: threshold / deadline / coverage metadata
 */

// ── Constants ──────────────────────────────────────────────────
const PDAP_DE_MINIMIS = 600;       // $600 annual aggregate threshold for PDAP
const STABLECOIN_DE_MINIMIS = 10000; // $10,000 for qualifying stablecoins

// Approximate USD prices for non-stablecoin tokens (fallback when no oracle)
const FALLBACK_USD_PRICES: Record<string, number> = {
  ETH: 3200, USDC: 1, USDT: 1, cbBTC: 95000, cbXRP: 2.5, SOL: 170,
};

const STABLECOINS = new Set(["USDC", "USDT"]);

// Digital asset codes (9-digit alphanumeric per IRS instructions)
const ASSET_CODES: Record<string, string> = {
  ETH: "ETH000001", USDC: "USC000001", USDT: "UST000001",
  cbBTC: "BTC000001", cbXRP: "XRP000001", SOL: "SOL000001",
};

interface AcquisitionLot {
  token: string;
  units: number;
  costPerUnit: number;
  dateAcquired: number; // epoch ms
  hash: string;
}

interface Disposition {
  token: string;
  tokenName: string;
  assetCode: string;
  units: number;
  dateAcquired: number;
  dateDisposed: number;
  proceeds: number;         // Box 1f
  costBasis: number;        // Box 1g
  gainLoss: number;         // computed
  isLongTerm: boolean;      // held > 1 year
  txHash: string;           // Box 1b (transaction ID)
  isNoncovered: boolean;    // Box 9
  reliedOnCustomerInfo: boolean; // Box 8
}

function getUsdPrice(token: string): number {
  return FALLBACK_USD_PRICES[token] ?? 1;
}

function getTokenName(token: string): string {
  const names: Record<string, string> = {
    ETH: "Ether (ETH)", USDC: "USD Coin (USDC)", USDT: "Tether (USDT)",
    cbBTC: "Coinbase Wrapped BTC (cbBTC)", cbXRP: "Coinbase Wrapped XRP (cbXRP)",
    SOL: "Solana (SOL)",
  };
  return names[token] || token;
}

// One year in milliseconds
const ONE_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const wallet = (url.searchParams.get("wallet") || "").toLowerCase();
  const taxYearStr = url.searchParams.get("taxYear") || "";
  const taxYear = Number(taxYearStr);

  if (!wallet || !/^0x[a-f0-9]{40}$/i.test(wallet)) {
    return NextResponse.json(
      { ok: false, error: "wallet_required", correlationId },
      { status: 400 }
    );
  }

  if (!taxYear || taxYear < 2020 || taxYear > 2100) {
    return NextResponse.json(
      { ok: false, error: "invalid_tax_year", correlationId },
      { status: 400 }
    );
  }

  const yearStart = new Date(`${taxYear}-01-01T00:00:00Z`).getTime();
  const yearEnd = new Date(`${taxYear + 1}-01-01T00:00:00Z`).getTime();
  const now = Date.now();
  const isCurrentYear = now >= yearStart && now < yearEnd;
  const isFutureYear = now < yearStart;

  // Cost basis required for TY2026+ covered securities
  const basisRequired = taxYear >= 2026;
  // Assets acquired before 2026 are noncovered
  const NONCOVERED_CUTOFF = new Date("2026-01-01T00:00:00Z").getTime();

  try {
    // ── Fetch ALL split transactions via the same endpoint the Reports panel uses ──
    // This triggers full multi-split discovery across all split contracts (current + history),
    // live Blockscout fetching, and persists results to split_index atomically.
    let allTransactions: any[] = [];

    try {
      const origin = new URL(req.url).origin;
      // Forward request headers so brand key is resolved from hostname for partner containers
      const forwardHeaders: Record<string, string> = {};
      for (const key of ["host", "cookie", "authorization", "x-wallet", "x-brand-key"]) {
        const val = req.headers.get(key);
        if (val) forwardHeaders[key] = val;
      }
      const splitRes = await fetch(
        `${origin}/api/split/transactions?merchantWallet=${encodeURIComponent(wallet)}&limit=10000`,
        { cache: "no-store", headers: forwardHeaders }
      );
      const splitData = await splitRes.json();
      if (splitData.ok && Array.isArray(splitData.transactions)) {
        allTransactions = splitData.transactions;
      }
    } catch (e) {
      console.warn("[1099-DA] Failed to fetch split transactions, falling back to split_index:", e);
      // Fallback: direct split_index read if internal fetch fails
      try {
        const container = await getContainer();
        const indexId = `split_index_${wallet}`;
        const { resource } = await container.item(indexId, indexId).read();
        if (resource && Array.isArray(resource.transactions)) {
          allTransactions = resource.transactions;
        }
      } catch { /* split_index not found */ }
    }

    // ── Filter to tax year ──
    const yearTxs = allTransactions.filter((tx: any) => {
      const ts = Number(tx.timestamp || 0);
      return ts >= yearStart && ts < yearEnd;
    });

    // Separate into acquisitions (payments received) and dispositions (releases)
    const acquisitions: any[] = [];
    const releases: any[] = [];

    for (const tx of yearTxs) {
      if (tx.type === "payment") {
        acquisitions.push(tx);
      } else if (tx.type === "release") {
        releases.push(tx);
      }
    }

    // Also gather ALL historical acquisitions for FIFO basis matching
    const allAcquisitions = allTransactions
      .filter((tx: any) => tx.type === "payment" && Number(tx.timestamp || 0) < yearEnd)
      .sort((a: any, b: any) => Number(a.timestamp || 0) - Number(b.timestamp || 0));

    // ── Build FIFO acquisition lots (per-wallet, per-token) ──
    const lotsByToken: Record<string, AcquisitionLot[]> = {};
    for (const acq of allAcquisitions) {
      const token = String(acq.token || "ETH");
      const units = Math.abs(Number(acq.value || 0));
      if (units <= 0) continue;

      if (!lotsByToken[token]) lotsByToken[token] = [];
      lotsByToken[token].push({
        token,
        units,
        costPerUnit: getUsdPrice(token),
        dateAcquired: Number(acq.timestamp || 0),
        hash: String(acq.hash || ""),
      });
    }

    // ── Compute dispositions with FIFO basis matching ──
    const dispositions: Disposition[] = [];

    // Sort releases chronologically for FIFO
    const sortedReleases = [...releases].sort(
      (a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)
    );

    for (const rel of sortedReleases) {
      const token = String(rel.token || "ETH");
      const units = Math.abs(Number(rel.value || 0));
      if (units <= 0) continue;

      const priceAtDisposition = getUsdPrice(token);
      const proceeds = units * priceAtDisposition;
      const dateDisposed = Number(rel.timestamp || 0);
      const lots = lotsByToken[token] || [];

      // FIFO consume lots
      let remaining = units;
      let totalBasis = 0;
      let earliestAcquisition = dateDisposed;
      let reliedOnCustomer = false;

      while (remaining > 0 && lots.length > 0) {
        const lot = lots[0];
        const consume = Math.min(remaining, lot.units);
        totalBasis += consume * lot.costPerUnit;
        if (lot.dateAcquired < earliestAcquisition) {
          earliestAcquisition = lot.dateAcquired;
        }
        lot.units -= consume;
        remaining -= consume;
        if (lot.units <= 0) lots.shift();
      }

      // If we couldn't match enough lots, mark as customer-provided basis
      if (remaining > 0) {
        totalBasis += remaining * priceAtDisposition; // assume proceeds = basis (no gain)
        reliedOnCustomer = true;
      }

      const isNoncovered = earliestAcquisition < NONCOVERED_CUTOFF;
      const holdingMs = dateDisposed - earliestAcquisition;
      const isLongTerm = holdingMs > ONE_YEAR_MS;
      const gainLoss = proceeds - totalBasis;

      dispositions.push({
        token,
        tokenName: getTokenName(token),
        assetCode: ASSET_CODES[token] || "UNK000001",
        units,
        dateAcquired: earliestAcquisition,
        dateDisposed,
        proceeds: Math.round(proceeds * 100) / 100,
        costBasis: Math.round(totalBasis * 100) / 100,
        gainLoss: Math.round(gainLoss * 100) / 100,
        isLongTerm,
        txHash: String(rel.hash || ""),
        isNoncovered,
        reliedOnCustomerInfo: reliedOnCustomer,
      });
    }

    // ── Aggregate statistics ──
    const totalProceeds = dispositions.reduce((s, d) => s + d.proceeds, 0);
    const totalBasis = dispositions.reduce((s, d) => s + d.costBasis, 0);
    const totalGainLoss = dispositions.reduce((s, d) => s + d.gainLoss, 0);
    const shortTermGain = dispositions.filter(d => !d.isLongTerm).reduce((s, d) => s + d.gainLoss, 0);
    const longTermGain = dispositions.filter(d => d.isLongTerm).reduce((s, d) => s + d.gainLoss, 0);

    // Per-token aggregation for stablecoin de minimis check
    const proceedsByToken: Record<string, number> = {};
    for (const d of dispositions) {
      proceedsByToken[d.token] = (proceedsByToken[d.token] || 0) + d.proceeds;
    }

    // ── Compliance checks ──
    const exceedsPdapThreshold = totalProceeds >= PDAP_DE_MINIMIS;
    const stablecoinProceeds = Object.entries(proceedsByToken)
      .filter(([t]) => STABLECOINS.has(t))
      .reduce((s, [, v]) => s + v, 0);
    const exceedsStablecoinThreshold = stablecoinProceeds >= STABLECOIN_DE_MINIMIS;

    // Filing deadlines for this tax year
    const filingYear = taxYear + 1;
    const recipientDeadline = `${filingYear}-02-17`;
    const paperFilingDeadline = `${filingYear}-03-02`;
    const electronicFilingDeadline = `${filingYear}-03-31`;

    // ── Build response ──
    return NextResponse.json({
      ok: true,
      correlationId,
      taxYear,
      isDraft: isCurrentYear || isFutureYear,
      basisRequired,

      formData: {
        // Per-token form pages
        byToken: Object.entries(proceedsByToken).map(([token, proceeds]) => {
          const tokenDispositions = dispositions.filter(d => d.token === token);
          const tokenBasis = tokenDispositions.reduce((s, d) => s + d.costBasis, 0);
          const tokenGainLoss = tokenDispositions.reduce((s, d) => s + d.gainLoss, 0);
          const totalUnits = tokenDispositions.reduce((s, d) => s + d.units, 0);
          return {
            box1a: ASSET_CODES[token] || "UNK000001",  // Digital asset code
            box1b: getTokenName(token),                  // Digital asset name
            box1c: totalUnits,                           // Number of units
            box1f: Math.round(proceeds * 100) / 100,     // Proceeds
            box1g: basisRequired ? Math.round(tokenBasis * 100) / 100 : null, // Cost basis
            box2: basisRequired,                         // Basis reported to IRS
            box3a: "G",                                  // Gross proceeds reported
            box4: 0,                                     // Federal tax withheld
            box7: true,                                  // Only cash proceeds
            box9: tokenDispositions.some(d => d.isNoncovered), // Noncovered security
            box11a: STABLECOINS.has(token) ? "S" : null, // Stablecoin aggregate
            box11b: STABLECOINS.has(token) ? tokenDispositions.length : null,
            transactionCount: tokenDispositions.length,
            gainLoss: Math.round(tokenGainLoss * 100) / 100,
          };
        }),
      },

      transactions: dispositions,
      acquisitionCount: acquisitions.length,

      summary: {
        totalDispositions: dispositions.length,
        totalProceeds: Math.round(totalProceeds * 100) / 100,
        totalBasis: Math.round(totalBasis * 100) / 100,
        totalGainLoss: Math.round(totalGainLoss * 100) / 100,
        shortTermGainLoss: Math.round(shortTermGain * 100) / 100,
        longTermGainLoss: Math.round(longTermGain * 100) / 100,
        proceedsByToken,
      },

      compliance: {
        pdapThreshold: PDAP_DE_MINIMIS,
        exceedsPdapThreshold,
        stablecoinThreshold: STABLECOIN_DE_MINIMIS,
        exceedsStablecoinThreshold,
        recipientDeadline,
        paperFilingDeadline,
        electronicFilingDeadline,
        penaltyRelief: taxYear === 2025,
        noncoveredCount: dispositions.filter(d => d.isNoncovered).length,
        coveredCount: dispositions.filter(d => !d.isNoncovered).length,
      },
    });
  } catch (e: any) {
    console.error("[1099-DA] Error generating report:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "generation_failed", correlationId },
      { status: 500 }
    );
  }
}
