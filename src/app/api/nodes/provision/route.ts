/**
 * BasaltSurge Node Provisioning
 * 
 * POST /api/nodes/provision — Admin approves or rejects a node application
 * 
 * On approval:
 *   1. Verifies BSURGE staking requirement (if token is live)
 *   2. Generates a Node API Key
 *   3. Sets status to active
 *   4. Returns the raw API key (one-time display)
 */

import { NextRequest, NextResponse } from 'next/server';
import { isDecentralizationEnabled } from '@/lib/decentralization';
import { requireThirdwebAuth } from '@/lib/auth';
import { generateNodeApiKey } from '@/lib/node-gateway-auth';

export async function POST(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    // Require admin authentication
    const caller = await requireThirdwebAuth(req);
    if (!caller.roles?.includes('admin') && !caller.roles?.includes('superadmin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { nodeId, action, adminNotes } = body;

    if (!nodeId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'nodeId and action (approve/reject) are required' }, { status: 400 });
    }

    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    // Find the node operator
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_operator" AND c.nodeId = @nodeId',
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();

    const operator = resources?.[0];
    if (!operator) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    if (operator.status !== 'pending_review') {
      return NextResponse.json({ error: `Node is in '${operator.status}' state, not pending_review` }, { status: 409 });
    }

    const now = Date.now();

    if (action === 'reject') {
      await container.item(operator.id, operator.id).replace({
        ...operator,
        status: 'rejected',
        adminNotes: adminNotes || '',
        updatedAt: now,
      });

      return NextResponse.json({ success: true, status: 'rejected' });
    }

    // === APPROVE FLOW ===

    // Optional: verify staking if token is configured
    const tokenAddress = (process.env.BSURGE_TOKEN_ADDRESS || '').trim();
    if (tokenAddress) {
      try {
        const { checkStakingCompliance } = await import('@/lib/node-staking');
        const snapshot = await checkStakingCompliance(operator.walletAddress, nodeId);
        if (!snapshot.isCompliant) {
          return NextResponse.json({
            error: `Staking requirement not met. Balance: ${snapshot.bsurgeBalance.toLocaleString()} BSURGE, Required: ${snapshot.requiredBalance.toLocaleString()} BSURGE`,
          }, { status: 403 });
        }
      } catch (err) {
        console.warn('[NodeProvision] Staking check failed, proceeding:', err);
      }
    }

    // Generate API key
    const { rawKey, keyDoc } = generateNodeApiKey(nodeId, operator.regionId);
    const keyDocId = `node:apikey:${nodeId}`;

    // Store key document
    await container.items.upsert({
      id: keyDocId,
      ...keyDoc,
    });

    // Update operator status
    await container.item(operator.id, operator.id).replace({
      ...operator,
      status: 'active',
      provisionedAt: now,
      provisionedBy: caller.wallet,
      adminNotes: adminNotes || operator.adminNotes || '',
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      status: 'active',
      nodeId,
      // ⚠️ ONE-TIME DISPLAY: This raw key is never stored or shown again
      apiKey: rawKey,
      message: 'Node provisioned successfully. SAVE THIS API KEY — it will not be shown again.',
      bootstrapUrl: '/api/node-gateway/bootstrap',
      instructions: [
        '1. Set NODE_API_KEY in your deployment environment',
        '2. The node will fetch its full configuration from the bootstrap endpoint',
        '3. No other environment variables are needed',
      ],
    });
  } catch (err: any) {
    console.error('[NodeProvision] Error:', err);
    const status = err?.status || 500;
    return NextResponse.json({ error: err?.message || 'Provisioning failed' }, { status });
  }
}
