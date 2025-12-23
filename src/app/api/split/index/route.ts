import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireRole } from "@/lib/auth";
import crypto from "node:crypto";
import { fetchEthRates } from "@/lib/eth";
import { getBrandKey } from "@/config/brands";

/**
 * POST /api/split/index
 * Indexes split contract transactions into Cosmos DB as the single source of truth
 * Query params:
 * - splitAddress: The split contract address to index
 * - merchantWallet: The merchant wallet address
 * - forceReindex: If true, reindexes all transactions (default: false, only new ones)
 */
export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  
  try {
    // Require merchant role
    const caller = await requireRole(req, "merchant");
    
    const body = await req.json().catch(() => ({}));
    const splitAddress = body?.splitAddress || "";
    const merchantWallet = body?.merchantWallet || caller.wallet;
    const forceReindex = body?.forceReindex === true;
    
    if (!splitAddress || !/^0x[a-f0-9]{40}$/i.test(splitAddress)) {
      return NextResponse.json(
        { ok: false, error: "invalid_split_address" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }
    
    const container = await getContainer();
    
    // Fetch ALL transactions from the split
    const txUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/split/transactions?splitAddress=${encodeURIComponent(splitAddress)}&merchantWallet=${encodeURIComponent(merchantWallet)}&limit=1000`;
    const txRes = await fetch(txUrl, { cache: 'no-store' });
    const txData = await txRes.json().catch(() => ({}));
    
    if (!txRes.ok || !txData?.ok) {
      return NextResponse.json(
        { ok: false, error: txData?.error || "failed_to_fetch_transactions" },
        { status: 500, headers: { "x-correlation-id": correlationId } }
      );
    }
    
    const transactions = Array.isArray(txData?.transactions) ? txData.transactions : [];
    const cumulative = txData?.cumulative || { payments: {}, merchantReleases: {}, platformReleases: {} };
    
    // Get ETH rate for USD conversion
    let ethUsdRate = 0;
    try {
      const rates = await fetchEthRates();
      ethUsdRate = Number(rates?.USD || 0);
    } catch {}
    
    // Token prices in USD
    const tokenPrices: Record<string, number> = {
      ETH: ethUsdRate || 2500,
      USDC: 1.0,
      USDT: 1.0,
      cbBTC: 65000,
      cbXRP: 0.50,
    };
    
    // Calculate total metrics
    let totalVolumeUsd = 0;
    const uniqueCustomers = new Set<string>();
    let merchantEarnedUsd = 0;
    let platformFeeUsd = 0;
    
    // Calculate from cumulative payment data
    for (const [token, amount] of Object.entries(cumulative.payments || {})) {
      const tokenPrice = tokenPrices[token] || 0;
      const amountNum = Number(amount || 0);
      if (amountNum > 0 && tokenPrice > 0) {
        totalVolumeUsd += amountNum * tokenPrice;
      }
    }
    
    // Calculate merchant earnings (payments - platform releases)
    merchantEarnedUsd = totalVolumeUsd;
    for (const [token, amount] of Object.entries(cumulative.platformReleases || {})) {
      const tokenPrice = tokenPrices[token] || 0;
      const amountNum = Number(amount || 0);
      if (amountNum > 0 && tokenPrice > 0) {
        merchantEarnedUsd -= amountNum * tokenPrice;
        platformFeeUsd += amountNum * tokenPrice;
      }
    }
    
    // Count unique customers from payment transactions
    for (const tx of transactions) {
      if (tx?.type === 'payment') {
        const from = String(tx?.from || "").toLowerCase();
        if (from && /^0x[a-f0-9]{40}$/i.test(from)) {
          uniqueCustomers.add(from);
        }
      }
    }
    
    // Store/update indexed split metrics in Cosmos
    const indexDoc = {
      id: `split_index_${merchantWallet.toLowerCase()}`,
      type: "split_index",
      brandKey: getBrandKey(),
      merchantWallet: merchantWallet.toLowerCase(),
      splitAddress: splitAddress.toLowerCase(),
      totalVolumeUsd: Math.round(totalVolumeUsd * 100) / 100,
      merchantEarnedUsd: Math.round(merchantEarnedUsd * 100) / 100,
      platformFeeUsd: Math.round(platformFeeUsd * 100) / 100,
      customers: uniqueCustomers.size,
      totalCustomerXp: Math.floor(totalVolumeUsd), // 1 XP per $1
      transactionCount: transactions.length,
      cumulativePayments: cumulative.payments || {},
      cumulativeMerchantReleases: cumulative.merchantReleases || {},
      cumulativePlatformReleases: cumulative.platformReleases || {},
      lastIndexedAt: Date.now(),
      correlationId,
    };
    
    await container.items.upsert(indexDoc);
    
    // Also create/update individual transaction records for granular querying
    let indexed = 0;
    for (const tx of transactions) {
      try {
        const txDoc = {
          id: `split_tx_${tx.hash}`,
          type: "split_transaction",
          hash: tx.hash,
          splitAddress: splitAddress.toLowerCase(),
          merchantWallet: merchantWallet.toLowerCase(),
          from: String(tx.from || "").toLowerCase(),
          to: String(tx.to || "").toLowerCase(),
          value: tx.value,
          token: tx.token,
          timestamp: tx.timestamp,
          blockNumber: tx.blockNumber,
          txType: tx.type,
          releaseType: tx.releaseType,
          releaseTo: tx.releaseTo,
          indexedAt: Date.now(),
          correlationId,
        };
        
        // Check if already indexed (unless forceReindex)
        if (!forceReindex) {
          try {
            await container.item(txDoc.id, txDoc.id).read();
            continue; // Already indexed, skip
          } catch {
            // Not found, proceed to upsert
          }
        }
        
        await container.items.upsert(txDoc);
        indexed++;
      } catch (e) {
        console.error(`Failed to index tx ${tx.hash}:`, e);
      }
    }
    
    return NextResponse.json(
      { 
        ok: true, 
        indexed: indexed,
        totalTransactions: transactions.length,
        metrics: {
          totalVolumeUsd: indexDoc.totalVolumeUsd,
          merchantEarnedUsd: indexDoc.merchantEarnedUsd,
          platformFeeUsd: indexDoc.platformFeeUsd,
          customers: indexDoc.customers,
          totalCustomerXp: indexDoc.totalCustomerXp,
        }
      },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    console.error("Error indexing split transactions:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "failed_to_index" },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}
