/**
 * BasaltSurge Node Reward Ledger
 * 
 * IMPORTANT: This does NOT modify merchant split configurations.
 * Instead, we maintain an internal ledger tracking what each node
 * is owed based on transaction attribution.
 * 
 * When a sufficient amount accrues, BasaltSurge airdrops rewards
 * to node operators from the platform's own collected fees.
 * 
 * The ledger serves as the source of truth for airdrop calculations.
 * 
 * Internal accounting split of the PLATFORM FEE (not the merchant):
 *   - 75% → BasaltSurge Treasury (retained by platform)
 *   - 25% → Node Provider Ledger (accrues, paid via airdrop)
 */

import type { NodeRewardRecord, NodeFeeDistribution } from '@/types/node';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Percentage of the platform fee allocated to node providers (internal accounting) */
export const NODE_SHARE_PERCENT = 25;

/** Percentage of the platform fee retained by the BasaltSurge treasury */
export const TREASURY_SHARE_PERCENT = 75;

/** Minimum accrued reward (USD) before eligible for airdrop payout */
export const AIRDROP_THRESHOLD_USD = 50;

// ─── Fee Calculation ─────────────────────────────────────────────────────────

/**
 * Calculate the internal fee distribution for a transaction processed by a node.
 * This does NOT affect the on-chain split — it's purely for ledger accounting.
 * 
 * @param platformFeeUsd - The platform fee already collected from the transaction
 * @param totalPlatformBps - The platform BPS from the split config (for reference)
 * @returns NodeFeeDistribution with the internal breakdown
 */
export function calculateNodeFeeDistribution(
  platformFeeUsd: number,
  totalPlatformBps: number
): NodeFeeDistribution {
  const nodeRewardUsd = platformFeeUsd * (NODE_SHARE_PERCENT / 100);
  const protocolShareUsd = platformFeeUsd * (TREASURY_SHARE_PERCENT / 100);

  return {
    totalPlatformBps: totalPlatformBps,
    protocolBps: TREASURY_SHARE_PERCENT,
    nodeBps: NODE_SHARE_PERCENT,
    nodeRewardUsd: Math.round(nodeRewardUsd * 100) / 100,
    protocolShareUsd: Math.round(protocolShareUsd * 100) / 100,
  };
}

// ─── Ledger Operations ───────────────────────────────────────────────────────

/**
 * Record a transaction's node share to the reward ledger.
 * Called whenever a receipt is created through a node.
 */
export async function recordNodeRewardEntry(
  nodeId: string,
  regionId: string,
  receiptId: string,
  merchantWallet: string,
  transactionValueUsd: number,
  platformFeeUsd: number
): Promise<void> {
  const distribution = calculateNodeFeeDistribution(platformFeeUsd, 0);
  const now = Date.now();

  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    const docId = `node:tx:${nodeId}:${receiptId}`;
    await container.items.upsert({
      id: docId,
      type: 'node_transaction',
      nodeId,
      regionId,
      receiptId,
      merchantWallet: merchantWallet.toLowerCase(),
      transactionValueUsd,
      platformFeeUsd,
      nodeShareUsd: distribution.nodeRewardUsd,
      timestamp: now,
      createdAt: now,
    });
  } catch (err) {
    console.error('[NodeRewardLedger] Failed to record entry:', err);
  }
}

/**
 * Get the total accrued (unpaid) rewards for a specific node.
 */
export async function getAccruedRewards(nodeId: string): Promise<{
  totalAccrued: number;
  totalPaid: number;
  pendingPayout: number;
  transactionCount: number;
}> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    // Sum all node transaction shares
    const { resources: txResults } = await container.items.query({
      query: `
        SELECT 
          COUNT(1) AS txCount,
          SUM(c.nodeShareUsd) AS totalAccrued
        FROM c 
        WHERE c.type = "node_transaction" AND c.nodeId = @nodeId
      `,
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();

    // Sum all completed airdrop payouts
    const { resources: payoutResults } = await container.items.query({
      query: `
        SELECT SUM(c.amountUsd) AS totalPaid
        FROM c 
        WHERE c.type = "node_airdrop" AND c.nodeId = @nodeId AND c.status = "completed"
      `,
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();

    const totalAccrued = txResults?.[0]?.totalAccrued || 0;
    const totalPaid = payoutResults?.[0]?.totalPaid || 0;
    const transactionCount = txResults?.[0]?.txCount || 0;

    return {
      totalAccrued: Math.round(totalAccrued * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      pendingPayout: Math.round((totalAccrued - totalPaid) * 100) / 100,
      transactionCount,
    };
  } catch {
    return { totalAccrued: 0, totalPaid: 0, pendingPayout: 0, transactionCount: 0 };
  }
}

/**
 * Get a full airdrop manifest — all nodes with their pending payouts.
 * Used by platform admins to generate an airdrop batch.
 */
export async function getAirdropManifest(): Promise<Array<{
  nodeId: string;
  walletAddress: string;
  pendingPayout: number;
  transactionCount: number;
  meetsThreshold: boolean;
}>> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    // Get all active node operators
    const { resources: operators } = await container.items.query({
      query: 'SELECT c.nodeId, c.walletAddress FROM c WHERE c.type = "node_operator" AND c.status = "active"',
    }).fetchAll();

    const manifest = [];
    for (const op of operators || []) {
      const accrued = await getAccruedRewards(op.nodeId);
      manifest.push({
        nodeId: op.nodeId,
        walletAddress: op.walletAddress,
        pendingPayout: accrued.pendingPayout,
        transactionCount: accrued.transactionCount,
        meetsThreshold: accrued.pendingPayout >= AIRDROP_THRESHOLD_USD,
      });
    }

    return manifest.sort((a, b) => b.pendingPayout - a.pendingPayout);
  } catch {
    return [];
  }
}

/**
 * Record a completed airdrop payout for a node.
 */
export async function recordAirdropPayout(
  nodeId: string,
  walletAddress: string,
  amountUsd: number,
  txHash: string
): Promise<void> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const now = Date.now();

    await container.items.upsert({
      id: `node:airdrop:${nodeId}:${now}`,
      type: 'node_airdrop',
      nodeId,
      walletAddress: walletAddress.toLowerCase(),
      amountUsd,
      txHash,
      status: 'completed',
      paidAt: now,
      createdAt: now,
    });
  } catch (err) {
    console.error('[NodeRewardLedger] Failed to record airdrop:', err);
  }
}
