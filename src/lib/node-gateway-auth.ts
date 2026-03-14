/**
 * BasaltSurge Node Gateway Authentication
 * 
 * Middleware for authenticating node instances via their API key.
 * Nodes authenticate with a single header: x-node-api-key.
 * This module validates the key, resolves the node identity,
 * and returns a scoped caller context.
 */

import type { NextRequest } from 'next/server';
import type { NodeApiKeyDoc, NodeGatewayCaller, NodeGatewayScope } from '@/types/node';
import { isDecentralizationEnabled } from '@/lib/decentralization';
import { createHash, randomBytes } from 'crypto';

// ─── Key Hashing ─────────────────────────────────────────────────────────────

/**
 * Hash a raw API key using SHA-256 for storage and comparison.
 */
export function hashNodeApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey.trim()).digest('hex');
}

/**
 * Generate a new random Node API key.
 * Format: bsn_{64 hex chars} (BasaltSurge Node)
 */
export function generateRawNodeApiKey(): string {
  return `bsn_${randomBytes(32).toString('hex')}`;
}

// ─── DB Lookup ───────────────────────────────────────────────────────────────

async function findNodeApiKeyByHash(keyHash: string): Promise<NodeApiKeyDoc | null> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_api_key" AND c.keyHash = @hash AND c.status = "active"',
      parameters: [{ name: '@hash', value: keyHash }],
    }).fetchAll();
    if (!resources || resources.length === 0) return null;
    return resources[0] as NodeApiKeyDoc;
  } catch {
    return null;
  }
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

/**
 * Authenticate a node instance from its API key header.
 * Returns a NodeGatewayCaller with the node's identity and scopes.
 * Throws a structured error if authentication fails.
 */
export async function requireNodeAuth(
  req: NextRequest,
  requiredScopes?: NodeGatewayScope[]
): Promise<NodeGatewayCaller> {
  // Gate: decentralization must be enabled
  if (!isDecentralizationEnabled()) {
    const e: any = new Error('decentralization_disabled');
    e.status = 503;
    throw e;
  }

  // Extract key from header
  const rawKey = (req.headers.get('x-node-api-key') || '').trim();
  if (!rawKey) {
    const e: any = new Error('node_unauthorized');
    e.status = 401;
    throw e;
  }

  // Hash and lookup
  const keyHash = hashNodeApiKey(rawKey);
  const keyDoc = await findNodeApiKeyByHash(keyHash);

  if (!keyDoc) {
    const e: any = new Error('node_unauthorized');
    e.status = 401;
    throw e;
  }

  // Check expiry
  if (keyDoc.expiresAt && Date.now() > keyDoc.expiresAt) {
    const e: any = new Error('node_key_expired');
    e.status = 401;
    throw e;
  }

  // Check IP allowlist if configured
  if (keyDoc.ipAllowlist && keyDoc.ipAllowlist.length > 0) {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || '';
    if (clientIp && !keyDoc.ipAllowlist.includes(clientIp)) {
      const e: any = new Error('node_ip_denied');
      e.status = 403;
      throw e;
    }
  }

  // Check required scopes
  if (requiredScopes && requiredScopes.length > 0) {
    const granted = new Set(keyDoc.scopes || []);
    const missing = requiredScopes.filter((s) => !granted.has(s));
    if (missing.length > 0) {
      const e: any = new Error('node_insufficient_scope');
      e.status = 403;
      throw e;
    }
  }

  // Update lastUsedAt (fire-and-forget, don't await)
  updateLastUsed(keyDoc.id).catch(() => {});

  // Resolve operator wallet
  const wallet = await resolveNodeWallet(keyDoc.nodeId);

  return {
    source: 'node_api_key',
    nodeId: keyDoc.nodeId,
    regionId: keyDoc.regionId,
    walletAddress: wallet,
    scopes: keyDoc.scopes || [],
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function updateLastUsed(keyDocId: string): Promise<void> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resource } = await container.item(keyDocId, keyDocId).read();
    if (resource) {
      await container.item(keyDocId, keyDocId).replace({
        ...resource,
        lastUsedAt: Date.now(),
      });
    }
  } catch { /* fire and forget */ }
}

async function resolveNodeWallet(nodeId: string): Promise<string> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resources } = await container.items.query({
      query: 'SELECT c.walletAddress FROM c WHERE c.type = "node_operator" AND c.nodeId = @nodeId',
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();
    return resources?.[0]?.walletAddress || '';
  } catch {
    return '';
  }
}

/**
 * Check if a merchant wallet is within a node's assigned scope (region-based).
 * For now, all platform-brand merchants in the node's region are in scope.
 */
export async function isInNodeScope(nodeRegionId: string, merchantWallet: string): Promise<boolean> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    // Check if this merchant has a site config in the node's region
    // For platform brand merchants, we check region assignment
    const { resources } = await container.items.query({
      query: `SELECT c.id FROM c WHERE c.type = "site_config" AND c.wallet = @wallet AND (NOT IS_DEFINED(c.assignedRegion) OR c.assignedRegion = @region)`,
      parameters: [
        { name: '@wallet', value: merchantWallet.toLowerCase() },
        { name: '@region', value: nodeRegionId },
      ],
    }).fetchAll();
    return (resources?.length || 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Generate a new Node API key pair (raw key for the operator, hash for storage).
 */
export function generateNodeApiKey(nodeId: string, regionId: string): {
  rawKey: string;
  keyDoc: Omit<NodeApiKeyDoc, 'id'>;
} {
  const rawKey = generateRawNodeApiKey();
  const keyHash = hashNodeApiKey(rawKey);
  const now = Date.now();
  const expiresAt = now + (90 * 24 * 60 * 60 * 1000); // 90 days

  const ALL_SCOPES: NodeGatewayScope[] = [
    'node:merchant_read',
    'node:inventory_read',
    'node:config_read',
    'node:receipt_write',
    'node:receipt_read',
    'node:media_read',
    'node:heartbeat',
    'node:bootstrap',
  ];

  return {
    rawKey,
    keyDoc: {
      type: 'node_api_key',
      nodeId,
      regionId,
      keyHash,
      scopes: ALL_SCOPES,
      status: 'active',
      issuedAt: now,
      expiresAt,
    },
  };
}

/**
 * Revoke a node's API key immediately.
 */
export async function revokeNodeApiKey(nodeId: string): Promise<boolean> {
  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_api_key" AND c.nodeId = @nodeId AND c.status = "active"',
      parameters: [{ name: '@nodeId', value: nodeId }],
    }).fetchAll();

    for (const doc of resources || []) {
      await container.item(doc.id, doc.id).replace({
        ...doc,
        status: 'revoked',
        updatedAt: Date.now(),
      });
    }
    return true;
  } catch {
    return false;
  }
}
