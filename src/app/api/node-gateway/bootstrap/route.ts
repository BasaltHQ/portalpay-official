/**
 * BasaltSurge Node Bootstrap Endpoint
 * 
 * GET /api/node-gateway/bootstrap
 * 
 * This is the magic endpoint that makes the thin-node model work.
 * Node operators deploy the repo with ONLY:
 *   NODE_API_KEY=bsn_xxxxx
 * 
 * On startup, the node calls this endpoint to get its full configuration
 * (DB credentials, S3 keys, brand config, region, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireNodeAuth } from '@/lib/node-gateway-auth';
import { isDecentralizationEnabled } from '@/lib/decentralization';
import { getRegionById } from '@/lib/node-regions';
import type { NodeBootstrapConfig } from '@/types/node';

export async function GET(req: NextRequest) {
  if (!isDecentralizationEnabled()) {
    return NextResponse.json({ error: 'Decentralization is not enabled' }, { status: 503 });
  }

  try {
    const caller = await requireNodeAuth(req, ['node:bootstrap']);

    // Look up the full node operator record
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_operator" AND c.nodeId = @nodeId',
      parameters: [{ name: '@nodeId', value: caller.nodeId }],
    }).fetchAll();

    const operator = resources?.[0];
    if (!operator || operator.status === 'decommissioned' || operator.status === 'rejected') {
      return NextResponse.json({ error: 'Node is not active' }, { status: 403 });
    }

    const region = getRegionById(caller.regionId);

    // Build the bootstrap configuration
    // These are the platform's OWN credentials, scoped for node use
    const config: NodeBootstrapConfig = {
      nodeId: caller.nodeId,
      regionId: caller.regionId,
      regionName: region?.name || caller.regionId,
      operatorName: operator.operatorName || '',
      walletAddress: caller.walletAddress,
      status: operator.status,

      // Database: scoped MongoDB connection
      dbConnectionString: process.env.MONGODB_CONNECTION_STRING || process.env.COSMOS_CONNECTION_STRING || '',
      dbName: process.env.COSMOS_DB_ID || 'payportal',
      dbCollection: process.env.COSMOS_CONTAINER_ID || 'payportal_events',

      // S3 storage
      s3Endpoint: process.env.S3_ENDPOINT || '',
      s3Region: process.env.S3_REGION || 'us-east-1',
      s3Bucket: process.env.S3_BUCKET_NAME || 'basaltsurge',
      s3AccessKey: process.env.S3_ACCESS_KEY || '',
      s3SecretKey: process.env.S3_SECRET_KEY || '',
      s3PublicUrlBase: process.env.S3_PUBLIC_URL_BASE || '',

      // Brand identity
      brandKey: 'basaltsurge',
      platformName: 'BasaltSurge',

      // Thirdweb for gas sponsorship
      thirdwebClientId: process.env.THIRDWEB_CLIENT_ID || '',

      // Fee accounting (internal, not on-chain split)
      nodeBps: 25,
      platformBps: 75,

      // Feature flags relevant to nodes
      features: {
        decentralization: true,
        bds: process.env.ENABLE_BDS === 'true',
        stakingVerification: process.env.BSURGE_TOKEN_ADDRESS ? true : false,
      },

      configVersion: Date.now(),
      issuedAt: Date.now(),
    };

    return NextResponse.json(config);
  } catch (err: any) {
    const status = err?.status || 500;
    return NextResponse.json(
      { error: err?.message || 'Bootstrap failed' },
      { status }
    );
  }
}
