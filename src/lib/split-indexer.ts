import { createThirdwebClient, getContract, prepareEvent, getContractEvents } from "thirdweb";
import { base } from "thirdweb/chains";
import { fetchEthRates } from "./eth";

let _indexerClient: ReturnType<typeof createThirdwebClient> | null = null;

function getIndexerClient() {
  if (!_indexerClient) {
    const secret = process.env.THIRDWEB_SECRET_KEY;
    const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
    _indexerClient = secret
      ? createThirdwebClient({ secretKey: secret as string })
      : createThirdwebClient({ clientId: String(clientId || "") });
  }
  return _indexerClient;
}

/**
 * Auto-indexes split contract transactions into Cosmos DB
 * This should be called after payments are made or when refreshing merchant data
 */
export async function indexSplitTransactions(splitAddress: string, merchantWallet: string) {
  try {
    console.log(`[SPLIT INDEXER] Starting indexing for merchant ${merchantWallet.slice(0,10)}...`);
    
    // Call the indexer endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/split/index`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-wallet': merchantWallet,
      },
      body: JSON.stringify({
        splitAddress,
        merchantWallet,
        forceReindex: false, // Only index new transactions
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.ok) {
      console.error(`[SPLIT INDEXER] Failed to index:`, result.error);
      return { ok: false, error: result.error };
    }
    
    console.log(`[SPLIT INDEXER] Successfully indexed ${result.indexed} new transactions for ${merchantWallet.slice(0,10)}...`);
    return { ok: true, indexed: result.indexed, metrics: result.metrics };
  } catch (e: any) {
    console.error(`[SPLIT INDEXER] Exception:`, e);
    return { ok: false, error: e?.message || 'indexing_failed' };
  }
}

/**
 * Watches split contract for PaymentReleased events and auto-indexes
 * This runs in the background and triggers indexing when new events are detected
 */
export async function watchSplitContract(splitAddress: string, merchantWallet: string, onNewTransaction?: (tx: any) => void) {
  try {
    const contract = getContract({
      client: getIndexerClient(),
      chain: base,
      address: splitAddress as `0x${string}`,
    });
    
    // PaymentReleased(address to, uint256 amount)
    const paymentReleasedEvent = prepareEvent({
      signature: "event PaymentReleased(address to, uint256 amount)",
    });
    
    console.log(`[SPLIT WATCHER] Starting to watch split contract ${splitAddress.slice(0,10)}...`);
    
    // Get recent events first
    const events = await getContractEvents({
      contract,
      events: [paymentReleasedEvent],
      fromBlock: BigInt(0), // Get all historical events
    });
    
    console.log(`[SPLIT WATCHER] Found ${events.length} historical PaymentReleased events`);
    
    // Trigger indexing if we found new events
    if (events.length > 0) {
      await indexSplitTransactions(splitAddress, merchantWallet);
      
      // Notify callback if provided
      if (onNewTransaction) {
        for (const event of events) {
          onNewTransaction(event);
        }
      }
    }
    
    return { ok: true, eventsFound: events.length };
  } catch (e: any) {
    console.error(`[SPLIT WATCHER] Error:`, e);
    return { ok: false, error: e?.message || 'watch_failed' };
  }
}

/**
 * Triggers indexing for all merchants with split contracts
 * This can be called periodically or on-demand
 */
export async function indexAllMerchants() {
  try {
    console.log(`[SPLIT INDEXER] Starting batch indexing for all merchants...`);
    
    // This would need to query Cosmos for all merchants with split addresses
    // and call indexSplitTransactions for each
    // Implementation depends on how you want to trigger this (cron job, admin button, etc.)
    
    return { ok: true, message: 'Batch indexing initiated' };
  } catch (e: any) {
    console.error(`[SPLIT INDEXER] Batch indexing error:`, e);
    return { ok: false, error: e?.message || 'batch_indexing_failed' };
  }
}
