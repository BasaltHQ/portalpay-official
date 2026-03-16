import { NextRequest, NextResponse } from 'next/server';
import { getRegionById } from '@/lib/node-regions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_operator" AND c.nodeId = @nodeId',
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();

    const node = resources?.[0];
    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    const region = getRegionById(node.regionId);

    // Fetch latest performance metrics
    let latestPerformance = null;
    try {
      const { resources: perfDocs } = await container.items.query({
        query: 'SELECT TOP 1 * FROM c WHERE c.type = "node_performance" AND c.nodeId = @nodeId ORDER BY c.timestamp DESC',
        parameters: [{ name: '@nodeId', value: nodeId }],
      }).fetchAll();
      latestPerformance = perfDocs?.[0] || null;
    } catch { /* non-critical */ }

    // Fetch accrued rewards
    let rewards = { totalAccrued: 0, totalPaid: 0, pendingPayout: 0, transactionCount: 0 };
    try {
      const { getAccruedRewards } = await import('@/lib/node-rewards');
      rewards = await getAccruedRewards(nodeId);
    } catch { /* non-critical */ }

    // Fetch latest staking snapshot
    let stakingStatus = null;
    try {
      const { getLatestSnapshot } = await import('@/lib/node-staking');
      stakingStatus = await getLatestSnapshot(nodeId);
    } catch { /* non-critical */ }

    return NextResponse.json({
      nodeId: node.nodeId,
      operatorName: node.operatorName,
      contactEmail: node.contactEmail,
      walletAddress: node.walletAddress,
      regionId: node.regionId,
      region: region ? { name: region.name, continent: region.continent, lat: region.lat, lng: region.lng } : null,
      status: node.status,
      endpointUrl: node.endpointUrl,
      appliedAt: node.appliedAt,
      provisionedAt: node.provisionedAt,
      performance: latestPerformance ? {
        uptimePercent: latestPerformance.uptimePercent,
        p95LatencyMs: latestPerformance.p95LatencyMs,
        errorRate: latestPerformance.errorRate,
        performanceScore: latestPerformance.performanceScore,
        healthStatus: latestPerformance.healthStatus,
        lastReportedAt: latestPerformance.timestamp,
      } : null,
      rewards,
      staking: stakingStatus ? {
        bsurgeBalance: stakingStatus.bsurgeBalance,
        requiredBalance: stakingStatus.requiredBalance,
        isCompliant: stakingStatus.isCompliant,
        lastCheckedAt: stakingStatus.timestamp,
      } : null,
    });
  } catch (err: any) {
    console.error('[NodeDetail] Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch node' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await req.json();
    const { endpointUrl, contactEmail, operatorName } = body;

    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_operator" AND c.nodeId = @nodeId',
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();

    const node = resources?.[0];
    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    // Only allow updating safe fields
    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (endpointUrl) updates.endpointUrl = endpointUrl;
    if (contactEmail) updates.contactEmail = contactEmail;
    if (operatorName) updates.operatorName = operatorName;

    await container.item(node.id, node.id).replace({ ...node, ...updates });

    return NextResponse.json({ success: true, nodeId, updated: Object.keys(updates).filter(k => k !== 'updatedAt') });
  } catch (err: any) {
    console.error('[NodePatch] Error:', err);
    return NextResponse.json({ error: err?.message || 'Update failed' }, { status: 500 });
  }
}
