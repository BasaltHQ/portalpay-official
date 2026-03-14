/**
 * BasaltSurge Decentralization Feature Flag
 * 
 * All node operator functionality is gated behind: DECENTRALIZATION=TRUE
 * This allows the feature to remain dormant until the BSURGE token is live.
 */

/**
 * Check if the decentralization feature is enabled.
 * Reads from DECENTRALIZATION or NEXT_PUBLIC_DECENTRALIZATION env vars.
 */
export function isDecentralizationEnabled(): boolean {
  const val = (
    process.env.DECENTRALIZATION ||
    process.env.NEXT_PUBLIC_DECENTRALIZATION ||
    ''
  ).trim().toUpperCase();
  return val === 'TRUE' || val === '1' || val === 'YES';
}

/**
 * Check if the current instance is running as a node (not the platform).
 * A node instance has NODE_API_KEY set in its environment.
 */
export function isNodeInstance(): boolean {
  return Boolean((process.env.NODE_API_KEY || '').trim());
}

/**
 * Get the node API key from the environment.
 * This is the ONLY env var a node operator needs to set.
 */
export function getNodeApiKey(): string {
  return (process.env.NODE_API_KEY || '').trim();
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** BPS allocated to the BasaltSurge protocol treasury from the platform fee */
export const PROTOCOL_BPS = 75;

/** BPS allocated to the node provider from the platform fee */
export const NODE_BPS = 25;

/** Total platform BPS (protocol + node) — must equal sum of above */
export const TOTAL_PLATFORM_SPLIT_BPS = PROTOCOL_BPS + NODE_BPS;

/** Minimum BSURGE tokens required to operate a node */
export const MINIMUM_STAKE = 100_000;

/** Default grace period (hours) before a decommission executes */
export const DEFAULT_GRACE_PERIOD_HOURS = 72;

/** Node API key expiry in days */
export const NODE_API_KEY_EXPIRY_DAYS = 90;

/** Key rotation grace period in days */
export const KEY_ROTATION_GRACE_DAYS = 7;

/** Performance evaluation window in milliseconds (1 hour) */
export const PERFORMANCE_WINDOW_MS = 60 * 60 * 1000;

/** Number of consecutive degraded windows before decommission tag */
export const DEGRADED_WINDOWS_BEFORE_DECOMMISSION = 3;

// ─── Performance Thresholds ──────────────────────────────────────────────────

export const PERFORMANCE_THRESHOLDS = {
  /** Minimum uptime percentage (99.5%) */
  minUptimePercent: 99.5,
  /** Maximum acceptable P95 latency in ms */
  maxP95LatencyMs: 500,
  /** Maximum acceptable error rate (1%) */
  maxErrorRate: 0.01,
  /** Maximum acceptable swarm sync lag in ms (5 minutes) */
  maxSwarmSyncLagMs: 5 * 60 * 1000,
} as const;

/** Snapshot interval for staking verification (6 hours in ms) */
export const STAKING_SNAPSHOT_INTERVAL_MS = 6 * 60 * 60 * 1000;
