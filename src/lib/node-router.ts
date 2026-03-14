/**
 * BasaltSurge Node Router
 * 
 * Routes incoming merchant/shopper requests to the optimal node
 * based on geographic proximity and node health.
 * 
 * Routing strategy:
 *   1. Determine shopper's region from Geo-IP headers
 *   2. Find all healthy nodes in that region (or nearest region)
 *   3. Select a node via weighted random (healthier nodes get more traffic)
 *   4. If no healthy nodes → fallback to genesis node (the platform itself)
 * 
 * When DECENTRALIZATION is OFF, all requests stay on the platform (no routing).
 */

import { isDecentralizationEnabled } from '@/lib/decentralization';
import { GENESIS_NODE_ID } from '@/lib/node-genesis';
import { NODE_REGIONS, getRegionById } from '@/lib/node-regions';
import type { NodeOperator } from '@/types/node';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RouteDecision {
  /** The selected node to handle this request */
  nodeId: string;
  /** The endpoint URL of the selected node */
  endpointUrl: string;
  /** The region the node is in */
  regionId: string;
  /** Whether this is the genesis (platform) node */
  isGenesis: boolean;
  /** Why this node was selected */
  reason: 'geo_match' | 'nearest_region' | 'weighted_random' | 'genesis_fallback' | 'decentralization_disabled';
}

// ─── Geo-IP Region Resolution ────────────────────────────────────────────────

/**
 * Resolve a region ID from request headers.
 * Most CDNs/reverse proxies set geo headers automatically:
 *   - CF-IPCountry (Cloudflare)
 *   - X-Vercel-IP-Country (Vercel)
 *   - X-Country-Code (generic)
 * 
 * Falls back to latitude/longitude headers if available.
 */
export function resolveRegionFromHeaders(headers: Headers): string | null {
  // Try country code first
  const countryCode = (
    headers.get('cf-ipcountry') ||
    headers.get('x-vercel-ip-country') ||
    headers.get('x-country-code') ||
    ''
  ).trim().toLowerCase();

  if (countryCode) {
    return mapCountryToRegion(countryCode);
  }

  // Try lat/lng
  const lat = parseFloat(headers.get('x-vercel-ip-latitude') || headers.get('cf-iplatitude') || '');
  const lng = parseFloat(headers.get('x-vercel-ip-longitude') || headers.get('cf-iplongitude') || '');

  if (!isNaN(lat) && !isNaN(lng)) {
    return findNearestRegion(lat, lng);
  }

  return null;
}

// ─── Country-to-Region Mapping ───────────────────────────────────────────────

const COUNTRY_REGION_MAP: Record<string, string> = {
  // United States — map to nearest US region
  us: 'us-east-va',

  // Canada
  ca: 'ca-east-on',

  // Mexico
  mx: 'mx-central',

  // Caribbean
  pr: 'cb-pr', jm: 'cb-jm', do: 'cb-do', tt: 'cb-tt',

  // Central America
  gt: 'gt-central', cr: 'cr-central', pa: 'pa-central',

  // South America
  br: 'br-southeast', ar: 'ar-central', co: 'co-central', cl: 'cl-central',
  pe: 'pe-central', ec: 'ec-central', ve: 've-central', uy: 'uy-central',
  py: 'py-central', bo: 'bo-central',

  // Europe
  gb: 'uk-london', ie: 'ie-dublin', fr: 'fr-paris', nl: 'nl-amsterdam',
  be: 'be-brussels', lu: 'lu-luxembourg', de: 'de-frankfurt', ch: 'ch-zurich',
  at: 'at-vienna', cz: 'cz-prague', pl: 'pl-warsaw', hu: 'hu-budapest',
  sk: 'sk-bratislava', se: 'se-stockholm', no: 'no-oslo', dk: 'dk-copenhagen',
  fi: 'fi-helsinki', is: 'is-reykjavik', ee: 'ee-tallinn', lv: 'lv-riga',
  lt: 'lt-vilnius', es: 'es-madrid', pt: 'pt-lisbon', it: 'it-milan',
  gr: 'gr-athens', hr: 'hr-zagreb', rs: 'rs-belgrade', ro: 'ro-bucharest',
  bg: 'bg-sofia', si: 'si-ljubljana', mt: 'mt-valletta', cy: 'cy-nicosia',
  ua: 'ua-kyiv', md: 'md-chisinau', ge: 'ge-tbilisi', am: 'am-yerevan',

  // Africa
  eg: 'eg-cairo', ma: 'ma-casablanca', tn: 'tn-tunis', ng: 'ng-lagos',
  gh: 'gh-accra', sn: 'sn-dakar', ci: 'ci-abidjan', ke: 'ke-nairobi',
  tz: 'tz-dar', et: 'et-addis', rw: 'rw-kigali', ug: 'ug-kampala',
  za: 'za-johannesburg', mz: 'mz-maputo', mu: 'mu-port-louis',
  cm: 'cm-douala', cd: 'cd-kinshasa',

  // Middle East
  ae: 'ae-dubai', sa: 'sa-riyadh', qa: 'qa-doha', bh: 'bh-manama',
  kw: 'kw-kuwait', om: 'om-muscat', jo: 'jo-amman', lb: 'lb-beirut',
  il: 'il-tel-aviv', tr: 'tr-istanbul', iq: 'iq-baghdad',

  // Asia
  jp: 'jp-tokyo', kr: 'kr-seoul', tw: 'tw-taipei', hk: 'cn-hong-kong',
  cn: 'cn-shanghai', mn: 'mn-ulaanbaatar',
  in: 'in-mumbai', pk: 'pk-karachi', bd: 'bd-dhaka', lk: 'lk-colombo', np: 'np-kathmandu',
  sg: 'sg-singapore', my: 'my-kuala-lumpur', th: 'th-bangkok',
  vn: 'vn-ho-chi-minh', id: 'id-jakarta', ph: 'ph-manila',
  mm: 'mm-yangon', kh: 'kh-phnom-penh', la: 'la-vientiane',
  kz: 'kz-almaty', uz: 'uz-tashkent',

  // Oceania
  au: 'au-sydney', nz: 'nz-auckland', fj: 'fj-suva', pg: 'pg-port-moresby',
};

function mapCountryToRegion(countryCode: string): string | null {
  return COUNTRY_REGION_MAP[countryCode] || null;
}

// ─── Nearest Region (Haversine) ──────────────────────────────────────────────

function findNearestRegion(lat: number, lng: number): string {
  let nearestId = 'us-east-va';
  let minDist = Infinity;

  for (const region of NODE_REGIONS) {
    const d = haversineDistance(lat, lng, region.lat, region.lng);
    if (d < minDist) {
      minDist = d;
      nearestId = region.regionId;
    }
  }

  return nearestId;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ─── Route Selection ─────────────────────────────────────────────────────────

/**
 * Select the best node to handle a request.
 * 
 * @param headers - Request headers (for geo-IP resolution)
 * @param activeNodes - List of all active node operators (from DB cache)
 * @returns RouteDecision with the selected node
 */
export function selectNode(
  headers: Headers,
  activeNodes: NodeOperator[]
): RouteDecision {
  // If decentralization is off, always use genesis
  if (!isDecentralizationEnabled()) {
    const genesis = activeNodes.find((n) => n.nodeId === GENESIS_NODE_ID);
    return {
      nodeId: GENESIS_NODE_ID,
      endpointUrl: genesis?.endpointUrl || '',
      regionId: genesis?.regionId || 'us-east-va',
      isGenesis: true,
      reason: 'decentralization_disabled',
    };
  }

  // Resolve shopper's region
  const shopperRegion = resolveRegionFromHeaders(headers);

  // Only consider active/degraded nodes (not decommissioning)
  const healthyNodes = activeNodes.filter((n) =>
    n.status === 'active' || n.status === 'degraded'
  );

  if (healthyNodes.length === 0) {
    // No healthy nodes at all — genesis fallback
    const genesis = activeNodes.find((n) => n.nodeId === GENESIS_NODE_ID);
    return {
      nodeId: GENESIS_NODE_ID,
      endpointUrl: genesis?.endpointUrl || '',
      regionId: genesis?.regionId || 'us-east-va',
      isGenesis: true,
      reason: 'genesis_fallback',
    };
  }

  // Try exact region match
  if (shopperRegion) {
    const regionNodes = healthyNodes.filter((n) => n.regionId === shopperRegion);
    if (regionNodes.length > 0) {
      const selected = weightedRandom(regionNodes);
      return {
        nodeId: selected.nodeId,
        endpointUrl: selected.endpointUrl,
        regionId: selected.regionId,
        isGenesis: selected.nodeId === GENESIS_NODE_ID,
        reason: 'geo_match',
      };
    }

    // Try nearest region with active nodes
    const shopperRegionData = getRegionById(shopperRegion);
    if (shopperRegionData) {
      const nearestNode = findNearestNodeByRegion(shopperRegionData.lat, shopperRegionData.lng, healthyNodes);
      if (nearestNode) {
        return {
          nodeId: nearestNode.nodeId,
          endpointUrl: nearestNode.endpointUrl,
          regionId: nearestNode.regionId,
          isGenesis: nearestNode.nodeId === GENESIS_NODE_ID,
          reason: 'nearest_region',
        };
      }
    }
  }

  // No geo data or no regional match — weighted random across all healthy nodes
  const selected = weightedRandom(healthyNodes);
  return {
    nodeId: selected.nodeId,
    endpointUrl: selected.endpointUrl,
    regionId: selected.regionId,
    isGenesis: selected.nodeId === GENESIS_NODE_ID,
    reason: 'weighted_random',
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Select a node with weighted random — active nodes get 3x weight over degraded.
 */
function weightedRandom(nodes: NodeOperator[]): NodeOperator {
  const weights = nodes.map((n) => n.status === 'active' ? 3 : 1);
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * totalWeight;

  for (let i = 0; i < nodes.length; i++) {
    r -= weights[i];
    if (r <= 0) return nodes[i];
  }

  return nodes[0]; // fallback
}

/**
 * Find the nearest node to a given lat/lng considering only nodes with active regions.
 */
function findNearestNodeByRegion(lat: number, lng: number, nodes: NodeOperator[]): NodeOperator | null {
  let nearest: NodeOperator | null = null;
  let minDist = Infinity;

  for (const node of nodes) {
    const region = getRegionById(node.regionId);
    if (!region) continue;

    const d = haversineDistance(lat, lng, region.lat, region.lng);
    if (d < minDist) {
      minDist = d;
      nearest = node;
    }
  }

  return nearest;
}

// ─── Routing API Helper ──────────────────────────────────────────────────────

/**
 * Get all active nodes from the database (for use in routing).
 * Results should be cached for a short TTL (e.g., 30 seconds).
 */
let _cachedNodes: NodeOperator[] | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function getActiveNodesForRouting(): Promise<NodeOperator[]> {
  const now = Date.now();
  if (_cachedNodes && now < _cacheExpiry) return _cachedNodes;

  try {
    const { getContainer } = await import('@/lib/cosmos');
    const container = await getContainer();
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.type = "node_operator" AND (c.status = "active" OR c.status = "degraded")',
    }).fetchAll();

    _cachedNodes = (resources || []) as NodeOperator[];
    _cacheExpiry = now + CACHE_TTL_MS;
    return _cachedNodes;
  } catch {
    return _cachedNodes || [];
  }
}

/**
 * Full route resolution: fetch nodes + select best one.
 */
export async function routeRequest(headers: Headers): Promise<RouteDecision> {
  const nodes = await getActiveNodesForRouting();
  return selectNode(headers, nodes);
}
