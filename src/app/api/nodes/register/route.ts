/**
 * BasaltSurge Node Registration
 * 
 * POST /api/nodes/register — Submit a node operator application
 * 
 * Open to any wallet holder. Creates a pending application
 * that must be approved via the admin panel.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isDecentralizationEnabled } from '@/lib/decentralization';
import { getRegionById, isRegionAtCapacity } from '@/lib/node-regions';

export async function POST(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { walletAddress, operatorName, contactEmail, regionId, endpointUrl, nodePublicKey } = body;

    // Validate required fields
    if (!walletAddress || !operatorName || !contactEmail || !regionId || !endpointUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, operatorName, contactEmail, regionId, endpointUrl' },
        { status: 400 }
      );
    }

    // Validate wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address format' }, { status: 400 });
    }

    // Validate region exists
    const region = getRegionById(regionId);
    if (!region) {
      return NextResponse.json({ error: `Unknown region: ${regionId}` }, { status: 400 });
    }

    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    // Check if wallet is already registered
    const { resources: existing } = await container.items.query({
      query: 'SELECT c.id FROM c WHERE c.type = "node_operator" AND c.walletAddress = @wallet AND c.status != "rejected" AND c.status != "decommissioned"',
      parameters: [{ name: '@wallet', value: walletAddress.toLowerCase() }],
    }).fetchAll();

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Wallet already has an active or pending node application' }, { status: 409 });
    }

    // Check region capacity
    const { resources: regionNodes } = await container.items.query({
      query: 'SELECT COUNT(1) AS cnt FROM c WHERE c.type = "node_operator" AND c.regionId = @region AND c.status IN ("active", "provisioning", "pending_review")',
      parameters: [{ name: '@region', value: regionId }],
    }).fetchAll();

    const activeCount = regionNodes?.[0]?.cnt || 0;
    if (isRegionAtCapacity(regionId, activeCount)) {
      return NextResponse.json({ error: `Region ${regionId} is at capacity (${region.maxNodes} nodes)` }, { status: 409 });
    }

    // Generate node ID
    const nodeIndex = activeCount + 1;
    const nodeId = `node_${regionId}_${String(nodeIndex).padStart(3, '0')}`;
    const now = Date.now();

    const doc = {
      id: `node:operator:${walletAddress.toLowerCase()}`,
      type: 'node_operator',
      walletAddress: walletAddress.toLowerCase(),
      operatorName,
      contactEmail,
      regionId,
      endpointUrl,
      nodePublicKey: nodePublicKey || '',
      status: 'pending_review',
      nodeId,
      appliedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await container.items.upsert(doc);

    return NextResponse.json({
      success: true,
      nodeId,
      status: 'pending_review',
      message: 'Application submitted. You will be notified once reviewed by the BasaltSurge team.',
      region: region.name,
    }, { status: 201 });
  } catch (err: any) {
    console.error('[NodeRegister] Error:', err);
    return NextResponse.json({ error: err?.message || 'Registration failed' }, { status: 500 });
  }
}
