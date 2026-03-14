/**
 * BasaltSurge Node Staking Verification
 * 
 * Verifies that node operators hold the required minimum
 * of 100,000 BSURGE tokens via on-chain balance reads.
 * 
 * Uses Thirdweb SDK (or ethers fallback) to read ERC-20 balances.
 */

import type { StakingSnapshot, NodeOperator } from '@/types/node';
import { MINIMUM_STAKE } from '@/lib/decentralization';

// ─── Single Wallet Check ─────────────────────────────────────────────────────

/**
 * Check the BSURGE token balance for a single wallet address.
 * Returns a StakingSnapshot with compliance status.
 */
export async function checkStakingCompliance(
  walletAddress: string,
  nodeId: string
): Promise<StakingSnapshot> {
  const now = Date.now();
  let balance = 0;
  let blockNumber: number | undefined;

  try {
    const tokenAddress = (process.env.BSURGE_TOKEN_ADDRESS || '').trim();
    const rpcUrl = (process.env.BSURGE_RPC_URL || process.env.RPC_URL || '').trim();

    if (tokenAddress && rpcUrl) {
      // Use ethers to read ERC-20 balance
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);

      const rawBalance = await contract.balanceOf(walletAddress);
      // BSURGE has 18 decimals
      balance = Number(ethers.formatUnits(rawBalance, 18));
      blockNumber = await provider.getBlockNumber();
    }
  } catch (err) {
    console.error('[NodeStaking] Failed to check balance:', err);
    // If we can't read the balance, mark as non-compliant to be safe
  }

  return {
    id: `node:staking:${nodeId}:${now}`,
    type: 'node_staking',
    nodeId,
    walletAddress: walletAddress.toLowerCase(),
    bsurgeBalance: balance,
    requiredBalance: MINIMUM_STAKE,
    isCompliant: balance >= MINIMUM_STAKE,
    blockNumber,
    timestamp: now,
    createdAt: now,
  };
}

// ─── Global Snapshot ─────────────────────────────────────────────────────────

/**
 * Run a staking snapshot across all active nodes.
 * Returns an array of snapshots and stores them in the database.
 */
export async function runGlobalSnapshot(
  activeNodes: Pick<NodeOperator, 'nodeId' | 'walletAddress'>[]
): Promise<StakingSnapshot[]> {
  const snapshots: StakingSnapshot[] = [];

  for (const node of activeNodes) {
    try {
      const snapshot = await checkStakingCompliance(node.walletAddress, node.nodeId);
      snapshots.push(snapshot);

      // Store snapshot in DB
      const { getContainer } = await import('@/lib/cosmos');
      const container = await getContainer();
      await container.items.upsert(snapshot);
    } catch (err) {
      console.error(`[NodeStaking] Snapshot failed for ${node.nodeId}:`, err);
    }
  }

  return snapshots;
}

/**
 * Get the latest staking snapshot for a node.
 */
export async function getLatestSnapshot(nodeId: string): Promise<StakingSnapshot | null> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resources } = await container.items.query({
      query: 'SELECT TOP 1 * FROM c WHERE c.type = "node_staking" AND c.nodeId = @nodeId ORDER BY c.timestamp DESC',
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();
    return resources?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Get staking history for a node (paginated).
 */
export async function getStakingHistory(
  nodeId: string,
  limit: number = 20
): Promise<StakingSnapshot[]> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resources } = await container.items.query({
      query: `SELECT TOP ${limit} * FROM c WHERE c.type = "node_staking" AND c.nodeId = @nodeId ORDER BY c.timestamp DESC`,
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();
    return resources || [];
  } catch {
    return [];
  }
}
