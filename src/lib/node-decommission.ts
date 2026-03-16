/**
 * BasaltSurge Node Decommissioning Engine
 * 
 * Unified decommission logic that handles both triggers:
 *   1. Performance below threshold (3+ consecutive degraded windows)
 *   2. Staking below required BSURGE balance (< 100,000)
 * 
 * Decommission flow:
 *   Tag → Grace period (72h default) → Execute or Cancel
 * 
 * During grace period, node can recover by:
 *   - Improving performance (for perf-based triggers)
 *   - Restoring token balance (for staking-based triggers)
 */

import type {
  DecommissionRecord,
  DecommissionReason,
  NodePerformanceMetrics,
  StakingSnapshot,
  NodeOperator,
} from '@/types/node';
import { DEFAULT_GRACE_PERIOD_HOURS } from '@/lib/decentralization';
import { shouldTagForDecommission } from '@/lib/node-performance';
import { isGenesisNode } from '@/lib/node-genesis';

// ─── Evaluation ──────────────────────────────────────────────────────────────

/**
 * Evaluate a node for decommissioning based on both
 * performance metrics and staking compliance.
 * 
 * Returns a DecommissionRecord if a trigger fires, or null if the node is healthy.
 */
export function evaluateForDecommission(
  node: Pick<NodeOperator, 'nodeId'>,
  recentMetrics: NodePerformanceMetrics[],
  latestSnapshot: StakingSnapshot | null,
  triggeredBy: string = 'system'
): DecommissionRecord | null {
  const now = Date.now();

  // Genesis node is immortal — never decommission the platform instance
  if (isGenesisNode(node.nodeId)) return null;

  // Check staking compliance first (higher priority)
  if (latestSnapshot && !latestSnapshot.isCompliant) {
    return createDecommissionRecord(
      node.nodeId,
      'staking_below_threshold',
      `BSURGE balance (${latestSnapshot.bsurgeBalance.toLocaleString()}) is below the required minimum (${latestSnapshot.requiredBalance.toLocaleString()})`,
      triggeredBy,
      now
    );
  }

  // Check performance threshold
  if (shouldTagForDecommission(recentMetrics)) {
    const latestHealth = recentMetrics.length > 0
      ? recentMetrics.sort((a, b) => b.timestamp - a.timestamp)[0]
      : null;
    const detail = latestHealth
      ? `Uptime: ${latestHealth.uptimePercent}%, P95 Latency: ${latestHealth.p95LatencyMs}ms, Error Rate: ${(latestHealth.errorRate * 100).toFixed(2)}%`
      : 'Consecutive degraded performance windows detected';

    return createDecommissionRecord(
      node.nodeId,
      'performance_below_threshold',
      detail,
      triggeredBy,
      now
    );
  }

  return null;
}

// ─── Record Creation ─────────────────────────────────────────────────────────

function createDecommissionRecord(
  nodeId: string,
  reason: DecommissionReason,
  details: string,
  triggeredBy: string,
  now: number,
  gracePeriodHours: number = DEFAULT_GRACE_PERIOD_HOURS
): DecommissionRecord {
  return {
    id: `node:decommission:${nodeId}:${now}`,
    type: 'node_decommission',
    nodeId,
    reason,
    details,
    gracePeriodHours,
    graceExpiresAt: now + (gracePeriodHours * 60 * 60 * 1000),
    executionStatus: 'pending',
    triggeredAt: now,
    triggeredBy,
    createdAt: now,
  };
}

// ─── Grace Period ────────────────────────────────────────────────────────────

/**
 * Check if a decommission record's grace period has expired.
 */
export function isGracePeriodExpired(record: DecommissionRecord): boolean {
  return Date.now() >= record.graceExpiresAt;
}

// ─── Execution ───────────────────────────────────────────────────────────────

/**
 * Execute a decommission — remove node from active routing.
 */
export async function executeDecommission(nodeId: string): Promise<boolean> {
  // Genesis node is immortal — refuse to execute
  if (isGenesisNode(nodeId)) {
    console.warn('[NodeDecommission] Attempted to decommission genesis node — blocked');
    return false;
  }

  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    // Update node operator status to decommissioned
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_operator" AND c.nodeId = @nodeId',
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();

    for (const doc of resources || []) {
      await container.item(doc.id, doc.id).replace({
        ...doc,
        status: 'decommissioned',
        decommissionedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Revoke API key
    const { revokeNodeApiKey } = await import('@/lib/node-gateway-auth');
    await revokeNodeApiKey(nodeId);

    return true;
  } catch (err) {
    console.error(`[NodeDecommission] Failed to execute for ${nodeId}:`, err);
    return false;
  }
}

/**
 * Cancel a pending decommission (node recovered during grace period).
 */
export async function cancelDecommission(
  decommissionDocId: string,
  reason: string
): Promise<boolean> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resource } = await container.item(decommissionDocId, decommissionDocId).read();

    if (resource && resource.executionStatus === 'pending') {
      await container.item(decommissionDocId, decommissionDocId).replace({
        ...resource,
        executionStatus: 'cancelled',
        cancellationReason: reason,
        cancelledAt: Date.now(),
      });

      // Restore node status to active
      const { resources: nodes } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.type = "node_operator" AND c.nodeId = @nodeId',
        parameters: [{ name: '@nodeId', value: resource.nodeId }],
      }).fetchAll();

      for (const node of nodes || []) {
        if (node.status === 'decommissioning') {
          await container.item(node.id, node.id).replace({
            ...node,
            status: 'active',
            updatedAt: Date.now(),
          });
        }
      }

      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get all pending decommission records (for admin review).
 */
export async function getPendingDecommissions(): Promise<DecommissionRecord[]> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_decommission" AND c.executionStatus = "pending" ORDER BY c.triggeredAt DESC',
    }).fetchAll();
    return resources || [];
  } catch {
    return [];
  }
}
