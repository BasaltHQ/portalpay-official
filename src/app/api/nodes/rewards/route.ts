/**
 * BasaltSurge Node Rewards API
 * 
 * GET  /api/nodes/rewards          — Get airdrop manifest (all nodes)
 * POST /api/nodes/rewards          — Record an airdrop payout
 * GET  /api/nodes/rewards?nodeId=  — Get specific node's accrued rewards
 */

import { NextRequest, NextResponse } from 'next/server';
import { isDecentralizationEnabled } from '@/lib/decentralization';

export async function GET(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('nodeId');

    if (nodeId) {
      // Single node rewards
      const { getAccruedRewards } = await import('@/lib/node-rewards');
      const rewards = await getAccruedRewards(nodeId);
      return NextResponse.json({ nodeId, ...rewards });
    }

    // Full airdrop manifest
    const { getAirdropManifest } = await import('@/lib/node-rewards');
    const manifest = await getAirdropManifest();

    const totalPending = manifest.reduce((sum, m) => sum + m.pendingPayout, 0);
    const eligibleCount = manifest.filter((m) => m.meetsThreshold).length;

    return NextResponse.json({
      manifest,
      summary: {
        totalPending: Math.round(totalPending * 100) / 100,
        eligibleForAirdrop: eligibleCount,
        totalNodes: manifest.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch rewards' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { nodeId, walletAddress, amountUsd, txHash } = body;

    if (!nodeId || !walletAddress || !amountUsd || !txHash) {
      return NextResponse.json({ error: 'nodeId, walletAddress, amountUsd, txHash required' }, { status: 400 });
    }

    const { recordAirdropPayout } = await import('@/lib/node-rewards');
    await recordAirdropPayout(nodeId, walletAddress, amountUsd, txHash);

    return NextResponse.json({ success: true, nodeId, amountUsd, txHash });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to record payout' }, { status: 500 });
  }
}
