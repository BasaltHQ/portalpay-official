import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

/**
 * GET /api/split/transactions
 * Fetches recent transactions from the split contract using Blockscout API
 * Query params:
 * - splitAddress: The split contract address
 * - limit: Number of transactions to fetch (default 50)
 * - merchantWallet: The merchant wallet address (for release type detection)
 */
export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  const url = new URL(req.url);
  const splitAddress = url.searchParams.get("splitAddress");
  const merchantWallet = url.searchParams.get("merchantWallet");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));

  if (!splitAddress || !/^0x[a-f0-9]{40}$/i.test(splitAddress)) {
    return NextResponse.json(
      { ok: false, error: "invalid_split_address" },
      { status: 400, headers: { "x-correlation-id": correlationId } }
    );
  }

  try {
    // Fetch standard ETH transactions (for reference), ERC-20 token transfers,
    // AND contract event logs (for reliable PaymentReleased/PaymentReceived detection)
    const transactionsUrl = `https://base.blockscout.com/api/v2/addresses/${splitAddress}/transactions`;
    const tokenTransfersUrl = `https://base.blockscout.com/api/v2/addresses/${splitAddress}/token-transfers`;
    const logsUrl = `https://base.blockscout.com/api/v2/addresses/${splitAddress}/logs`;

    const [txResponse, tokenResponse, logsResponse] = await Promise.all([
      fetch(transactionsUrl, { headers: { "Accept": "application/json" } }),
      fetch(tokenTransfersUrl, { headers: { "Accept": "application/json" } }),
      fetch(logsUrl, { headers: { "Accept": "application/json" } }).catch(() => null)
    ]);

    if (!txResponse.ok) {
      throw new Error(`Blockscout transactions API returned ${txResponse.status}`);
    }
    if (!tokenResponse.ok) {
      throw new Error(`Blockscout token-transfers API returned ${tokenResponse.status}`);
    }

    const [txData, tokenData] = await Promise.all([
      txResponse.json(),
      tokenResponse.json()
    ]);

    let logsData: any = null;
    if (logsResponse && logsResponse.ok) {
      try { logsData = await logsResponse.json(); } catch { }
    }

    const ethItems = Array.isArray(txData?.items) ? txData.items : [];
    const tokenItems = Array.isArray(tokenData?.items) ? tokenData.items : [];
    const logItems = Array.isArray(logsData?.items) ? logsData.items : [];

    // Token addresses for identification
    const tokenAddresses: Record<string, string> = {
      ETH: "native",
      USDC: (process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS || "").toLowerCase(),
      USDT: (process.env.NEXT_PUBLIC_BASE_USDT_ADDRESS || "").toLowerCase(),
      cbBTC: (process.env.NEXT_PUBLIC_BASE_CBBTC_ADDRESS || "").toLowerCase(),
      cbXRP: (process.env.NEXT_PUBLIC_BASE_CBXRP_ADDRESS || "").toLowerCase(),
      SOL: (process.env.NEXT_PUBLIC_BASE_SOL_ADDRESS || "").toLowerCase(),
    };

    // Reverse lookup: token address -> token symbol
    const addressToToken = new Map<string, string>();
    for (const [symbol, addr] of Object.entries(tokenAddresses)) {
      if (addr && addr !== "native") {
        addressToToken.set(addr, symbol);
      }
    }

    // Index token transfers by tx hash to correlate with zero-ETH payment calls
    const tokenTransfersByHash = new Map<string, { symbol: string; value: number; to: string; from: string }[]>();
    try {
      for (const transfer of tokenItems || []) {
        const tokenAddr = String(transfer?.token?.address || "").toLowerCase();
        let tokenSymbol = addressToToken.get(tokenAddr);
        if (!tokenSymbol) {
          const blockscoutSymbol = String(transfer?.token?.symbol || "").toUpperCase();
          if (blockscoutSymbol === "USDC" || blockscoutSymbol.includes("USDC")) tokenSymbol = "USDC";
          else if (blockscoutSymbol === "USDT" || blockscoutSymbol.includes("USDT")) tokenSymbol = "USDT";
          else if (blockscoutSymbol === "CBBTC" || blockscoutSymbol.includes("BTC")) tokenSymbol = "cbBTC";
          else if (blockscoutSymbol === "CBXRP" || blockscoutSymbol.includes("XRP")) tokenSymbol = "cbXRP";
          else if (blockscoutSymbol === "SOL" || blockscoutSymbol.includes("SOL")) tokenSymbol = "SOL";
          else continue;
        }
        const decimals = Number(transfer?.token?.decimals || 18);
        const valueRaw = String(transfer?.total?.value || "0");
        const valueInToken = Number(valueRaw) / Math.pow(10, decimals);
        if (!(valueInToken > 0)) continue;
        const h = String(transfer?.tx_hash || "").toLowerCase();
        if (!h) continue;
        const arr = tokenTransfersByHash.get(h) || [];
        arr.push({
          symbol: tokenSymbol,
          value: valueInToken,
          to: String(transfer?.to?.hash || "").toLowerCase(),
          from: String(transfer?.from?.hash || "").toLowerCase(),
        });
        tokenTransfersByHash.set(h, arr);
      }
    } catch { }

    // Parse and format transactions with type detection
    const splitAddrLower = splitAddress.toLowerCase();
    const merchantAddrLower = merchantWallet?.toLowerCase();
    const platformAddrLower = (process.env.NEXT_PUBLIC_PLATFORM_WALLET || process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "").toLowerCase();

    // Track cumulative metrics per token
    const cumulativePayments: Record<string, number> = {};
    const cumulativeMerchantReleases: Record<string, number> = {};
    const cumulativePlatformReleases: Record<string, number> = {};

    // ─── ETH FLOW DETECTION VIA CONTRACT EVENT LOGS ───
    // Standard transactions and internal transactions are UNRELIABLE for ERC-4337 proxy calls.
    // Instead, we parse the split contract's event logs directly:
    //   PaymentReceived(address from, uint256 amount) → topic: 0x6ef95f06...
    //   PaymentReleased(address to, uint256 amount)   → topic: 0xdf20fd1e...
    // These events are ALWAYS emitted regardless of call path (direct, proxy, bundler, etc.)
    const PAYMENT_RECEIVED_TOPIC = "0x6ef95f06320e7a25a04a175ca677b7052bdd97131872c2192525a629f51be770";
    const PAYMENT_RELEASED_TOPIC = "0xdf20fd1e76bc69d672e4814fafb2c449bba3a5369d8359adf9e05e6fde87b056";

    const ethTransactions: any[] = [];
    console.log(`[SPLIT TX] Processing ${logItems.length} contract event logs for ${splitAddrLower}`);
    console.log(`[SPLIT TX] merchantAddr=${merchantAddrLower}, platformAddr=${platformAddrLower}`);

    for (const log of logItems) {
      try {
        const topics = Array.isArray(log?.topics) ? log.topics : [];
        const topic0 = String(topics[0] || "").toLowerCase();
        const dataHex = String(log?.data || "0x");
        const txHash = String(log?.tx_hash || log?.transaction_hash || "").toLowerCase();
        const timestamp = log?.timestamp ? new Date(log.timestamp).getTime() : Date.now();
        const blockNumber = log?.block_number || 0;

        if (!dataHex.startsWith("0x") || dataHex.length < 130) continue;

        const dataWithoutPrefix = dataHex.slice(2);
        const addressSegment = dataWithoutPrefix.slice(0, 64);
        const addr = `0x${addressSegment.slice(-40)}`.toLowerCase();
        const amountHex = `0x${dataWithoutPrefix.slice(64, 128)}`;
        const amountWei = BigInt(amountHex);
        const amountEth = Number(amountWei) / 1e18;

        if (amountEth <= 0) continue;

        if (topic0 === PAYMENT_RECEIVED_TOPIC.toLowerCase()) {
          // PaymentReceived(address from, uint256 amount) — ETH payment INTO the split
          cumulativePayments['ETH'] = (cumulativePayments['ETH'] || 0) + amountEth;
          ethTransactions.push({
            hash: txHash, from: addr, to: splitAddrLower,
            value: amountEth, timestamp, blockNumber,
            status: "success", type: 'payment', token: 'ETH',
            relatedTokens: [],
          });
          console.log(`[SPLIT TX] PaymentReceived: from=${addr} amount=${amountEth} ETH`);
        } else if (topic0 === PAYMENT_RELEASED_TOPIC.toLowerCase()) {
          // PaymentReleased(address to, uint256 amount) — ETH released FROM the split
          let releaseType: 'merchant' | 'platform' | undefined;
          if (addr === merchantAddrLower) {
            releaseType = 'merchant';
            cumulativeMerchantReleases['ETH'] = (cumulativeMerchantReleases['ETH'] || 0) + amountEth;
          } else if (addr === platformAddrLower) {
            releaseType = 'platform';
            cumulativePlatformReleases['ETH'] = (cumulativePlatformReleases['ETH'] || 0) + amountEth;
          }

          if (releaseType) {
            ethTransactions.push({
              hash: txHash, from: splitAddrLower, to: addr,
              value: amountEth, timestamp, blockNumber,
              status: "success", type: 'release',
              releaseType, releaseTo: addr, token: 'ETH',
              relatedTokens: [],
            });
            console.log(`[SPLIT TX] PaymentReleased: to=${addr} amount=${amountEth} ETH type=${releaseType}`);
          }
        }
      } catch (e) { /* skip malformed log */ }
    }

    // Process ALL ERC-20 token transfers for accurate cumulative tracking - filter to only supported tokens
    const supportedTokens = ["USDC", "USDT", "cbBTC", "cbXRP", "SOL"];
    const tokenTransactions = tokenItems.map((transfer: any) => {
      const tokenAddr = String(transfer?.token?.address || "").toLowerCase();
      // Try to match by address first, then fallback to token symbol from Blockscout
      let tokenSymbol = addressToToken.get(tokenAddr);
      if (!tokenSymbol) {
        // Use Blockscout's token symbol if we can't match by address
        const blockscoutSymbol = String(transfer?.token?.symbol || "").toUpperCase();
        // Map common variations to our standard symbols
        if (blockscoutSymbol === "USDC" || blockscoutSymbol.includes("USDC")) tokenSymbol = "USDC";
        else if (blockscoutSymbol === "USDT" || blockscoutSymbol.includes("USDT")) tokenSymbol = "USDT";
        else if (blockscoutSymbol === "CBBTC" || blockscoutSymbol.includes("BTC")) tokenSymbol = "cbBTC";
        else if (blockscoutSymbol === "CBXRP" || blockscoutSymbol.includes("XRP")) tokenSymbol = "cbXRP";
        else if (blockscoutSymbol === "SOL" || blockscoutSymbol.includes("SOL")) tokenSymbol = "SOL";
        else return null; // Skip unsupported tokens
      }

      // Skip if token is not in our supported list
      if (!supportedTokens.includes(tokenSymbol)) {
        return null;
      }
      const decimals = Number(transfer?.token?.decimals || 18);
      const valueRaw = String(transfer?.total?.value || "0");
      const valueInToken = Number(valueRaw) / Math.pow(10, decimals);
      // Ignore zero-value token transfers
      if (!(valueInToken > 0)) {
        return null;
      }

      const timestamp = transfer?.timestamp ? new Date(transfer.timestamp).getTime() : Date.now();
      // Robust tx hash extraction across Blockscout variants
      const hash = String(
        transfer?.tx_hash ||
        transfer?.hash ||
        transfer?.transaction_hash ||
        transfer?.tx?.hash ||
        ""
      ).toLowerCase();
      const from = String(transfer?.from?.hash || "").toLowerCase();
      const to = String(transfer?.to?.hash || "").toLowerCase();

      // Determine transaction type for token transfers
      let txType: 'payment' | 'release' | 'unknown' = 'unknown';
      let releaseType: 'merchant' | 'platform' | undefined;
      let releaseTo: string | undefined;

      // Payment: someone sends tokens TO the split
      const isPayment = to === splitAddrLower && from !== merchantAddrLower && from !== platformAddrLower;

      // Release: split sends tokens FROM itself (release via PaymentReleased event)
      const isRelease = from === splitAddrLower;

      if (isPayment) {
        txType = 'payment';
        cumulativePayments[tokenSymbol] = (cumulativePayments[tokenSymbol] || 0) + valueInToken;
      } else if (isRelease) {
        txType = 'release';
        releaseTo = to;

        // Determine if release is to merchant or platform
        if (to === merchantAddrLower) {
          releaseType = 'merchant';
          cumulativeMerchantReleases[tokenSymbol] = (cumulativeMerchantReleases[tokenSymbol] || 0) + valueInToken;
        } else if (to === platformAddrLower) {
          releaseType = 'platform';
          cumulativePlatformReleases[tokenSymbol] = (cumulativePlatformReleases[tokenSymbol] || 0) + valueInToken;
        }
      }

      return {
        hash,
        from: transfer?.from?.hash || "",
        to: transfer?.to?.hash || "",
        value: valueInToken,
        timestamp,
        blockNumber: transfer?.block || 0,
        status: "success",
        type: txType,
        releaseType,
        releaseTo,
        token: tokenSymbol,
      };
    }).filter(Boolean); // Remove null entries (unsupported tokens)

    // Merge and sort all transactions by timestamp (most recent first)
    const transactions = [...ethTransactions, ...tokenTransactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    // Add debug info to response to help diagnose the issue
    const debugInfo = {
      splitAddress: splitAddrLower,
      merchantWallet: merchantAddrLower,
      platformWallet: platformAddrLower,
      totalEthTxs: ethItems.length,
      totalTokenTxs: tokenItems.length,
      totalLogItems: logItems.length,
      processedEthTxs: ethTransactions.length,
      releaseDetected: ethTransactions.some(tx => tx.type === 'release'),
    };

    return NextResponse.json(
      {
        ok: true,
        transactions,
        cumulative: {
          payments: cumulativePayments,
          merchantReleases: cumulativeMerchantReleases,
          platformReleases: cumulativePlatformReleases,
        },
        debug: debugInfo,
      },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    console.error("Error fetching split transactions:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "failed_to_fetch_transactions", transactions: [] },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}
