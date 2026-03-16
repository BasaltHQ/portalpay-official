/**
 * BasaltSurge Node Staking Snapshot API
 * 
 * POST /api/nodes/staking/snapshot — Run a global staking snapshot
 * GET  /api/nodes/staking/snapshot — List recent snapshots for a node
 */

import { NextRequest, NextResponse } from 'next/server';
import { isDecentralizationEnabled } from '@/lib/decentralization';

export async function POST(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    // Get all active nodes
    const { resources: operators } = await container.items.query({
      query: 'SELECT c.nodeId, c.walletAddress FROM c WHERE c.type = "node_operator" AND c.status = "active"',
    }).fetchAll();

    if (!operators || operators.length === 0) {
      return NextResponse.json({ snapshots: [], message: 'No active nodes' });
    }

    const { runGlobalSnapshot } = await import('@/lib/node-staking');
    const snapshots = await runGlobalSnapshot(operators);

    const compliant = snapshots.filter((s) => s.isCompliant).length;
    const nonCompliant = snapshots.filter((s) => !s.isCompliant);

    // Auto-tag non-compliant nodes for decommission
    for (const snapshot of nonCompliant) {
      try {
        const { evaluateForDecommission } = await import('@/lib/node-decommission');
        const record = evaluateForDecommission(
          { nodeId: snapshot.nodeId },
          [],
          snapshot,
          'system:staking_snapshot'
        );
        if (record) {
          await container.items.upsert(record);
        }
      } catch { /* continue with others */ }
    }

    return NextResponse.json({
      total: snapshots.length,
      compliant,
      nonCompliant: nonCompliant.length,
      snapshots: snapshots.map((s) => ({
        nodeId: s.nodeId,
        bsurgeBalance: s.bsurgeBalance,
        isCompliant: s.isCompliant,
        timestamp: s.timestamp,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Snapshot failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('nodeId');

    if (!nodeId) {
      return NextResponse.json({ error: 'nodeId query parameter required' }, { status: 400 });
    }

    const { getStakingHistory } = await import('@/lib/node-staking');
    const history = await getStakingHistory(nodeId);

    return NextResponse.json({ nodeId, snapshots: history });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch history' }, { status: 500 });
  }
}
