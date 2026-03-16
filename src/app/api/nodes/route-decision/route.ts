/**
 * BasaltSurge Node Routing API
 * 
 * POST /api/nodes/route — Resolve the optimal node for a request
 * 
 * Used internally by the platform edge to decide which node
 * should handle an incoming merchant/shopper request.
 * 
 * Body:
 *   { countryCode?: string, lat?: number, lng?: number }
 * 
 * Or simply uses request headers for geo-IP resolution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isDecentralizationEnabled } from '@/lib/decentralization';
import { routeRequest, resolveRegionFromHeaders, selectNode, getActiveNodesForRouting } from '@/lib/node-router';
import { GENESIS_NODE_ID } from '@/lib/node-genesis';

export async function POST(req: NextRequest) {
  try {
    // If decentralization is off, return genesis immediately
    if (!isDecentralizationEnabled()) {
      return NextResponse.json({
        nodeId: GENESIS_NODE_ID,
        endpointUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
        regionId: process.env.PLATFORM_REGION || 'us-east-va',
        isGenesis: true,
        reason: 'decentralization_disabled',
      });
    }

    // Use request headers first, then body overrides
    const body = await req.json().catch(() => ({}));
    let decision;

    if (body.countryCode || (body.lat && body.lng)) {
      // Build synthetic headers from body data
      const syntheticHeaders = new Headers();
      if (body.countryCode) syntheticHeaders.set('x-country-code', body.countryCode);
      if (body.lat) syntheticHeaders.set('x-vercel-ip-latitude', String(body.lat));
      if (body.lng) syntheticHeaders.set('x-vercel-ip-longitude', String(body.lng));

      const nodes = await getActiveNodesForRouting();
      decision = selectNode(syntheticHeaders, nodes);
    } else {
      decision = await routeRequest(req.headers);
    }

    return NextResponse.json(decision);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Routing failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!isDecentralizationEnabled()) {
      return NextResponse.json({
        nodeId: GENESIS_NODE_ID,
        endpointUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
        regionId: process.env.PLATFORM_REGION || 'us-east-va',
        isGenesis: true,
        reason: 'decentralization_disabled',
        resolvedRegion: resolveRegionFromHeaders(req.headers),
      });
    }

    const decision = await routeRequest(req.headers);
    return NextResponse.json({
      ...decision,
      resolvedRegion: resolveRegionFromHeaders(req.headers),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Routing failed' }, { status: 500 });
  }
}
