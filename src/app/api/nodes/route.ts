/**
 * BasaltSurge Node List & Summary
 * 
 * GET /api/nodes — List all nodes with optional filters
 * 
 * Query params:
 *   ?region=us-east    Filter by region
 *   ?status=active     Filter by status
 *   ?continent=Europe  Filter by continent
 *   ?page=1&limit=50   Pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRegionById, NODE_REGIONS } from '@/lib/node-regions';

export async function GET(req: NextRequest) {
  // No DECENTRALIZATION gate — admin dashboard needs this to work always.
  // The individual mutation endpoints (register, provision) still gate.

  try {
    // Ensure genesis node is registered (idempotent)
    try {
      const { ensureGenesisNode } = await import('@/lib/node-genesis');
      await ensureGenesisNode();
    } catch { /* non-critical */ }
    const url = new URL(req.url);
    const regionFilter = url.searchParams.get('region') || '';
    const statusFilter = url.searchParams.get('status') || '';
    const continentFilter = url.searchParams.get('continent') || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));

    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();

    // Build query dynamically
    let queryParts = ['SELECT * FROM c WHERE c.type = "node_operator"'];
    const params: { name: string; value: any }[] = [];

    if (regionFilter) {
      queryParts.push('AND c.regionId = @region');
      params.push({ name: '@region', value: regionFilter });
    }
    if (statusFilter) {
      queryParts.push('AND c.status = @status');
      params.push({ name: '@status', value: statusFilter });
    }

    queryParts.push('ORDER BY c.createdAt DESC');

    const { resources } = await container.items.query({
      query: queryParts.join(' '),
      parameters: params,
    }).fetchAll();

    let nodes = resources || [];

    // Client-side continent filter (region → continent mapping)
    if (continentFilter) {
      const normalizedContinent = continentFilter.toLowerCase();
      nodes = nodes.filter((n: any) => {
        const region = getRegionById(n.regionId);
        return region?.continent?.toLowerCase() === normalizedContinent;
      });
    }

    // Paginate
    const total = nodes.length;
    const offset = (page - 1) * limit;
    const paginatedNodes = nodes.slice(offset, offset + limit);

    // Strip sensitive fields from public response
    const sanitized = paginatedNodes.map((n: any) => ({
      nodeId: n.nodeId,
      operatorName: n.operatorName,
      regionId: n.regionId,
      regionName: getRegionById(n.regionId)?.name || n.regionId,
      continent: getRegionById(n.regionId)?.continent || '',
      status: n.status,
      endpointUrl: n.endpointUrl,
      appliedAt: n.appliedAt,
      provisionedAt: n.provisionedAt,
    }));

    // Region summary stats
    const regionStats: Record<string, { active: number; total: number; maxNodes: number }> = {};
    for (const region of NODE_REGIONS) {
      regionStats[region.regionId] = { active: 0, total: 0, maxNodes: region.maxNodes };
    }
    for (const n of resources || []) {
      if (regionStats[n.regionId]) {
        regionStats[n.regionId].total++;
        if (n.status === 'active') regionStats[n.regionId].active++;
      }
    }

    return NextResponse.json({
      nodes: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      regionStats,
    });
  } catch (err: any) {
    console.error('[NodeList] Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to list nodes' }, { status: 500 });
  }
}
