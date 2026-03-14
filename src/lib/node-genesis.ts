/**
 * BasaltSurge Genesis Node
 * 
 * The platform instance itself is always Node 0 — the genesis node.
 * It can NEVER be decommissioned regardless of performance or staking.
 * 
 * On startup (or first admin access), this module ensures the genesis
 * node is registered in the database if it doesn't already exist.
 */

import type { NodeOperator } from '@/types/node';
import { isDecentralizationEnabled } from '@/lib/decentralization';

/** The immutable genesis node ID */
export const GENESIS_NODE_ID = 'node_genesis_000';

/** Check if a node is the genesis node (cannot be decommissioned) */
export function isGenesisNode(nodeId: string): boolean {
  return nodeId === GENESIS_NODE_ID;
}

/**
 * Ensure the genesis node exists in the database.
 * This is idempotent — safe to call on every startup or admin access.
 */
export async function ensureGenesisNode(): Promise<NodeOperator | null> {
  if (!isDecentralizationEnabled()) return null;

  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    // Check if genesis node already exists
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_operator" AND c.nodeId = @nodeId',
      parameters: [{ name: '@nodeId', value: GENESIS_NODE_ID }],
    }).fetchAll();

    if (resources && resources.length > 0) {
      // Ensure status is always active (self-heal)
      const existing = resources[0];
      if (existing.status !== 'active') {
        await container.item(existing.id, existing.id).replace({
          ...existing,
          status: 'active',
          updatedAt: Date.now(),
        });
      }
      return existing as NodeOperator;
    }

    // Determine region from existing region-mapping or env
    const platformRegion = (
      process.env.PLATFORM_REGION ||
      process.env.NODE_REGION ||
      'us-east-va'
    ).trim();

    const platformWallet = (
      process.env.PLATFORM_WALLET ||
      process.env.ADMIN_WALLET ||
      ''
    ).trim().toLowerCase();

    const platformUrl = (
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://basaltsurge.com'
    ).trim();

    const now = Date.now();

    const genesisDoc: any = {
      id: `node:operator:genesis`,
      type: 'node_operator',
      walletAddress: platformWallet,
      operatorName: 'BasaltSurge Platform',
      contactEmail: 'nodes@basaltsurge.com',
      regionId: platformRegion,
      endpointUrl: platformUrl,
      status: 'active',
      nodeId: GENESIS_NODE_ID,
      isGenesisNode: true,
      appliedAt: now,
      provisionedAt: now,
      provisionedBy: 'system',
      createdAt: now,
      updatedAt: now,
    };

    await container.items.upsert(genesisDoc);
    console.log('[GenesisNode] Platform registered as genesis node:', GENESIS_NODE_ID);
    return genesisDoc as NodeOperator;
  } catch (err) {
    console.error('[GenesisNode] Failed to ensure genesis node:', err);
    return null;
  }
}
