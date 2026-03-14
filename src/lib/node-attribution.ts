/**
 * BasaltSurge Node Transaction Attribution
 * 
 * Stamps node identity on receipts and aggregates
 * per-node transaction volumes for reward calculation.
 */

import { isDecentralizationEnabled, isNodeInstance } from '@/lib/decentralization';

// ─── Attribution Stamping ────────────────────────────────────────────────────

/**
 * Get the current node's identifier from environment.
 * Returns empty string on platform instances (non-node).
 */
export function getNodeIdentifier(): string {
  if (!isNodeInstance()) return '';
  return (process.env.NODE_ID || '').trim();
}

/**
 * Get the current node's region from environment.
 * Populated by the bootstrap process.
 */
export function getNodeRegion(): string {
  if (!isNodeInstance()) return '';
  return (process.env.NODE_REGION || '').trim();
}

/**
 * Stamp node attribution fields onto a receipt or transaction document.
 * This is a non-destructive operation — it only adds fields, never removes.
 * On platform instances, this is a no-op (returns the original doc unchanged).
 */
export function stampNodeAttribution<T extends Record<string, any>>(doc: T): T {
  if (!isDecentralizationEnabled() || !isNodeInstance()) return doc;

  const nodeId = getNodeIdentifier();
  const nodeRegion = getNodeRegion();

  if (!nodeId) return doc;

  return {
    ...doc,
    processingNodeId: nodeId,
    processingNodeRegion: nodeRegion,
    nodeAttributedAt: Date.now(),
  };
}

// ─── Aggregation Queries ─────────────────────────────────────────────────────

/**
 * Get a summary of all transactions attributed to a specific node
 * within a time range.
 */
export async function getNodeTransactionSummary(
  nodeId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalVolume: number;
  totalPlatformFees: number;
  totalNodeShare: number;
  transactionCount: number;
}> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    const { resources } = await container.items.query({
      query: `
        SELECT 
          COUNT(1) AS txCount,
          SUM(c.transactionValueUsd) AS totalVolume,
          SUM(c.platformFeeUsd) AS totalPlatformFees,
          SUM(c.nodeShareUsd) AS totalNodeShare
        FROM c 
        WHERE c.type = "node_transaction" 
          AND c.nodeId = @nodeId 
          AND c.timestamp >= @start 
          AND c.timestamp <= @end
      `,
      parameters: [
        { name: '@nodeId', value: nodeId },
        { name: '@start', value: startDate.getTime() },
        { name: '@end', value: endDate.getTime() },
      ],
    }).fetchAll();

    const row = resources?.[0] || {};
    return {
      totalVolume: row.totalVolume || 0,
      totalPlatformFees: row.totalPlatformFees || 0,
      totalNodeShare: row.totalNodeShare || 0,
      transactionCount: row.txCount || 0,
    };
  } catch {
    return {
      totalVolume: 0,
      totalPlatformFees: 0,
      totalNodeShare: 0,
      transactionCount: 0,
    };
  }
}
