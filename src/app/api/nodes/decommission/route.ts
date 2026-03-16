/**
 * BasaltSurge Node Decommission API
 * 
 * POST  /api/nodes/decommission — Tag a node for decommission
 * PATCH /api/nodes/decommission — Execute or cancel after grace period
 * GET   /api/nodes/decommission — List pending decommissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { isDecentralizationEnabled } from '@/lib/decentralization';

export async function GET(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    const { getPendingDecommissions } = await import('@/lib/node-decommission');
    const records = await getPendingDecommissions();
    return NextResponse.json({ decommissions: records });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch decommissions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { nodeId, reason, gracePeriodHours } = body;

    if (!nodeId || !reason) {
      return NextResponse.json({ error: 'nodeId and reason are required' }, { status: 400 });
    }

    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    // Find node
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_operator" AND c.nodeId = @nodeId',
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();

    const node = resources?.[0];
    if (!node) return NextResponse.json({ error: 'Node not found' }, { status: 404 });

    // Build decommission record
    const now = Date.now();
    const hours = gracePeriodHours || 72;
    const record = {
      id: `node:decommission:${nodeId}:${now}`,
      type: 'node_decommission',
      nodeId,
      reason,
      details: body.details || `Manual decommission: ${reason}`,
      gracePeriodHours: hours,
      graceExpiresAt: now + (hours * 60 * 60 * 1000),
      executionStatus: 'pending',
      triggeredAt: now,
      triggeredBy: body.triggeredBy || 'admin',
      createdAt: now,
    };

    await container.items.upsert(record);

    // Update node status
    await container.item(node.id, node.id).replace({
      ...node,
      status: 'decommissioning',
      updatedAt: now,
    });

    return NextResponse.json({ success: true, decommission: record });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Decommission failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { decommissionId, action } = body;

    if (!decommissionId || !action || !['execute', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'decommissionId and action (execute/cancel) required' }, { status: 400 });
    }

    if (action === 'execute') {
      const { getContainer } = await import('@/lib/cosmos');
      const container = await getContainer();
      const { resource } = await container.item(decommissionId, decommissionId).read();

      if (!resource || resource.executionStatus !== 'pending') {
        return NextResponse.json({ error: 'Not a pending decommission' }, { status: 409 });
      }

      const { executeDecommission } = await import('@/lib/node-decommission');
      const success = await executeDecommission(resource.nodeId);

      if (success) {
        await container.item(decommissionId, decommissionId).replace({
          ...resource,
          executionStatus: 'executed',
          executedAt: Date.now(),
        });
      }

      return NextResponse.json({ success, action: 'executed' });
    }

    if (action === 'cancel') {
      const { cancelDecommission } = await import('@/lib/node-decommission');
      const success = await cancelDecommission(decommissionId, body.reason || 'Admin cancelled');
      return NextResponse.json({ success, action: 'cancelled' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Action failed' }, { status: 500 });
  }
}
