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
    // Fetch both ETH transactions AND ERC-20 token transfers
    const transactionsUrl = `https://base.blockscout.com/api/v2/addresses/${splitAddress}/transactions`;
    const tokenTransfersUrl = `https://base.blockscout.com/api/v2/addresses/${splitAddress}/token-transfers`;
    
    const [txResponse, tokenResponse] = await Promise.all([
      fetch(transactionsUrl, { headers: { "Accept": "application/json" } }),
      fetch(tokenTransfersUrl, { headers: { "Accept": "application/json" } })
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
    
    const ethItems = Array.isArray(txData?.items) ? txData.items : [];
    const tokenItems = Array.isArray(tokenData?.items) ? tokenData.items : [];
    
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
    } catch {}

    // Parse and format transactions with type detection
    const splitAddrLower = splitAddress.toLowerCase();
    const merchantAddrLower = merchantWallet?.toLowerCase();
    const platformAddrLower = (process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "").toLowerCase();
    
    
    // Track cumulative metrics per token
    const cumulativePayments: Record<string, number> = {};
    const cumulativeMerchantReleases: Record<string, number> = {};
    const cumulativePlatformReleases: Record<string, number> = {};
    
    // Process ALL ETH transactions for accurate cumulative tracking
    const ethTransactions = await Promise.all(ethItems.map(async (tx: any) => {
      const txValue = tx?.value ? String(tx.value) : "0";
      const timestamp = tx?.timestamp ? new Date(tx.timestamp).getTime() : Date.now();
      const hash = tx?.hash || "";
      const from = tx?.from?.hash || "";
      const to = tx?.to?.hash || "";
      
      // Convert Wei to ETH
      let valueInEth = Number(txValue) / 1e18;
      
      // Determine transaction type
      const fromLower = from.toLowerCase();
      const toLower = to.toLowerCase();
      
      console.log(`[TX DEBUG] Processing tx ${hash.slice(0,10)}... from=${fromLower.slice(0,10)}... to=${toLower.slice(0,10)}... value=${valueInEth} ETH`);
      
      // Payment: someone sends funds TO the split
      const isPayment = toLower === splitAddrLower && fromLower !== merchantAddrLower && fromLower !== platformAddrLower;
      
      // Release: merchant or platform calls release() function on split contract
      // This shows as: from=merchant/platform, to=split (contract call)
      const isRelease = toLower === splitAddrLower && (fromLower === merchantAddrLower || fromLower === platformAddrLower);
      
      console.log(`[TX DEBUG] tx ${hash.slice(0,10)}... isPayment=${isPayment}, isRelease=${isRelease}`);
      
      let txType: 'payment' | 'release' | 'unknown' = 'unknown';
      let releaseType: 'merchant' | 'platform' | undefined;
      let releaseTo: string | undefined;
      
      if (isPayment) {
        txType = 'payment';
        const related = tokenTransfersByHash.get(String(hash).toLowerCase()) || [];
        if (valueInEth <= 0 && related.length > 0) {
          console.log(`[TX DEBUG] Zero-ETH payment ${hash.slice(0,10)}... correlated with ${related.length} token transfers`);
        } else if (valueInEth <= 0) {
          console.log(`[TX DEBUG] Zero-ETH payment ${hash.slice(0,10)}... (no related token transfers found)`);
        } else {
          console.log(`[TX DEBUG] Detected PAYMENT tx ${hash.slice(0,10)}... (ETH ${valueInEth})`);
        }
      } else if (isRelease) {
        txType = 'release';
        releaseType = fromLower === merchantAddrLower ? 'merchant' : 'platform';
        console.log(`[TX DEBUG] Detected RELEASE tx ${hash.slice(0,10)}... releaseType=${releaseType}`);
        
        // Fetch transaction logs directly from Blockscout logs API
        try {
          // Blockscout v2 API doesn't include logs in the transaction endpoint
          // We need to fetch logs separately
          const logsUrl = `https://base.blockscout.com/api/v2/transactions/${hash}/logs`;
          console.log(`[TX DEBUG] Fetching logs from: ${logsUrl}`);
          
          const logsRes = await fetch(logsUrl, {
            headers: { "Accept": "application/json" },
          });
          
          console.log(`[TX DEBUG] Logs response status: ${logsRes.status}`);
          
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            const logs = Array.isArray(logsData?.items) ? logsData.items : [];
            console.log(`[TX DEBUG] Found ${logs.length} logs for tx ${hash.slice(0,10)}...`);
            
            // Find PaymentReleased event: PaymentReleased(address to, uint256 amount)
            // Topic[0] = keccak256("PaymentReleased(address,uint256)")
            // Note: 'to' and 'amount' are NOT indexed, so they're in the data field
            const paymentReleasedTopic = "0xdf20fd1e76bc69d672e4814fafb2c449bba3a5369d8359adf9e05e6fde87b056";
            
            for (let i = 0; i < logs.length; i++) {
              const log = logs[i];
              const topics = Array.isArray(log?.topics) ? log.topics : [];
              const logAddress = String(log?.address?.hash || "").toLowerCase();
              
              console.log(`[TX DEBUG] Log ${i}: address=${logAddress}, topics=${topics.length}, topic0=${topics[0]}`);
              
              // Ensure the log is from the split contract and matches PaymentReleased event
              if (logAddress === splitAddrLower && topics[0]?.toLowerCase() === paymentReleasedTopic.toLowerCase()) {
                console.log(`[PaymentReleased] MATCHED PaymentReleased event for tx ${hash}`);
                
                // Parse event data: data contains 'to' (32 bytes) + 'amount' (32 bytes)
                const dataHex = String(log?.data || "0x");
                
                // Data format: 0x + 64 hex chars (to address padded) + 64 hex chars (amount)
                // Expected length: 2 (0x) + 64 (address) + 64 (amount) = 130 characters
                console.log(`[PaymentReleased] Raw log data for tx ${hash}:`, dataHex);
                console.log(`[PaymentReleased] Data length: ${dataHex.length}`);
                
                if (dataHex.startsWith("0x") && dataHex.length >= 130) {
                  try {
                    // Remove 0x prefix for easier parsing
                    const dataWithoutPrefix = dataHex.slice(2);
                    
                    // First 64 hex chars (32 bytes) = padded address
                    // Last 40 hex chars of this segment = actual address
                    const addressSegment = dataWithoutPrefix.slice(0, 64);
                    const toAddr = `0x${addressSegment.slice(-40)}`.toLowerCase();
                    
                    // Next 64 hex chars (32 bytes) = amount in wei
                    const amountSegment = dataWithoutPrefix.slice(64, 128);
                    const amountHex = `0x${amountSegment}`;
                    
                    console.log(`[PaymentReleased] Parsing - addressSegment: ${addressSegment}, amountSegment: ${amountSegment}`);
                    console.log(`[PaymentReleased] Parsing - toAddr: ${toAddr}, amountHex: ${amountHex}`);
                    
                    // Parse as BigInt to handle large numbers accurately
                    const amountWei = BigInt(amountHex);
                    const amountWeiNumber = Number(amountWei);
                    valueInEth = amountWeiNumber / 1e18;
                    releaseTo = toAddr;
                    
                    // Log successful parse for debugging
                    console.log(`[PaymentReleased] SUCCESS - tx=${hash.slice(0,10)}... to=${toAddr} amount=${valueInEth} ETH (wei: ${amountWei.toString()}, weiNum: ${amountWeiNumber})`);
                    break;
                  } catch (e) {
                    // If parsing fails, keep the transaction value as-is
                    console.error(`[PaymentReleased] ERROR parsing log for tx ${hash}:`, e);
                    console.error(`[PaymentReleased] ERROR dataHex:`, dataHex);
                  }
                } else {
                  console.warn(`[PaymentReleased] Invalid data length for tx ${hash}: expected >=130, got ${dataHex.length}, data: ${dataHex}`);
                }
              }
            }
          } else {
            console.error(`[TX DEBUG] Logs fetch failed with status: ${logsRes.status}`);
          }
        } catch (e) {
          console.error(`[TX DEBUG] Exception fetching logs for tx ${hash}:`, e);
        }
      }
      
      // Track cumulative totals
      if (txType === 'payment') {
        cumulativePayments['ETH'] = (cumulativePayments['ETH'] || 0) + valueInEth;
      } else if (txType === 'release' && releaseType) {
        if (releaseType === 'merchant') {
          cumulativeMerchantReleases['ETH'] = (cumulativeMerchantReleases['ETH'] || 0) + valueInEth;
        } else if (releaseType === 'platform') {
          cumulativePlatformReleases['ETH'] = (cumulativePlatformReleases['ETH'] || 0) + valueInEth;
        }
      }
      
      return {
        hash,
        from,
        to,
        value: valueInEth,
        timestamp,
        blockNumber: tx?.block || 0,
        status: tx?.status || "success",
        type: txType,
        releaseType,
        releaseTo,
        token: 'ETH',
        // Hint for downstream reconciliation: token transfers that share this tx hash
        relatedTokens: tokenTransfersByHash.get(String(hash).toLowerCase()) || [],
      };
    }));
    
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
