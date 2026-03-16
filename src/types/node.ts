/**
 * BasaltSurge Decentralized Node Operator Types
 * 
 * All type definitions for the node provider ecosystem.
 * Gated by DECENTRALIZATION=TRUE env flag.
 */

// ─── Status & Enums ──────────────────────────────────────────────────────────

export type NodeStatus =
  | 'pending_review'
  | 'provisioning'
  | 'active'
  | 'degraded'
  | 'decommissioning'
  | 'decommissioned'
  | 'rejected';

export type DecommissionReason =
  | 'performance_below_threshold'
  | 'staking_below_threshold'
  | 'voluntary'
  | 'admin_action';

export type NodeGatewayScope =
  | 'node:merchant_read'
  | 'node:inventory_read'
  | 'node:config_read'
  | 'node:receipt_write'
  | 'node:receipt_read'
  | 'node:media_read'
  | 'node:heartbeat'
  | 'node:bootstrap';

// ─── Region ──────────────────────────────────────────────────────────────────

export interface NodeRegion {
  regionId: string;
  name: string;
  continent: string;
  /** Maximum number of nodes allowed in this region */
  maxNodes: number;
  /** Approximate latitude for map display */
  lat: number;
  /** Approximate longitude for map display */
  lng: number;
}

// ─── Node Operator (the person/entity) ───────────────────────────────────────

export interface NodeOperator {
  id: string; // node:operator:{walletAddress}
  type: 'node_operator';
  walletAddress: string;
  operatorName: string;
  contactEmail: string;
  regionId: string;
  endpointUrl: string;
  nodePublicKey?: string;
  status: NodeStatus;
  /** Unique node identifier, e.g. node_us-east_001 */
  nodeId: string;
  appliedAt: number;
  provisionedAt?: number;
  provisionedBy?: string;
  decommissionedAt?: number;
  adminNotes?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Node API Key ────────────────────────────────────────────────────────────

export interface NodeApiKeyDoc {
  id: string; // node:apikey:{nodeId}
  type: 'node_api_key';
  nodeId: string;
  regionId: string;
  /** SHA-256 hash of the raw key — never store raw */
  keyHash: string;
  scopes: NodeGatewayScope[];
  ipAllowlist?: string[];
  status: 'active' | 'revoked' | 'expired';
  issuedAt: number;
  expiresAt: number;
  lastUsedAt?: number;
  rotatedFromKeyId?: string;
}

// ─── Bootstrap Configuration ─────────────────────────────────────────────────

/** 
 * Configuration returned to a node on startup via the bootstrap endpoint.
 * This is how nodes get their config WITHOUT needing a massive .env file.
 * The only env var they need is NODE_API_KEY.
 */
export interface NodeBootstrapConfig {
  nodeId: string;
  regionId: string;
  regionName: string;
  operatorName: string;
  walletAddress: string;
  status: NodeStatus;
  /** MongoDB connection string scoped to node's partition */
  dbConnectionString: string;
  dbName: string;
  dbCollection: string;
  /** S3 credentials scoped to node's merchant media */
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3PublicUrlBase?: string;
  /** Platform identity */
  brandKey: string;
  platformName: string;
  /** Thirdweb client ID for gas sponsorship */
  thirdwebClientId: string;
  /** The node's share of platform fees in BPS */
  nodeBps: number;
  platformBps: number;
  /** Feature flags */
  features: Record<string, boolean>;
  /** Timestamp of this config snapshot */
  configVersion: number;
  issuedAt: number;
}

// ─── Performance Metrics ─────────────────────────────────────────────────────

export interface NodePerformanceMetrics {
  id: string; // node:performance:{nodeId}:{timestamp}
  type: 'node_performance';
  nodeId: string;
  regionId: string;
  /** Uptime percentage (0-100) */
  uptimePercent: number;
  /** P95 latency in milliseconds */
  p95LatencyMs: number;
  /** Total requests processed in this window */
  requestsProcessed: number;
  /** Error rate (0-1, e.g. 0.01 = 1%) */
  errorRate: number;
  /** Swarm sync lag in milliseconds */
  swarmSyncLagMs?: number;
  /** CPU usage percentage (0-100) */
  cpuPercent?: number;
  /** Memory usage percentage (0-100) */
  memoryPercent?: number;
  /** Composite performance score (0-100) */
  performanceScore?: number;
  /** Health evaluation result */
  healthStatus?: 'healthy' | 'degraded' | 'critical';
  timestamp: number;
  createdAt: number;
}

// ─── Transaction Attribution ─────────────────────────────────────────────────

export interface NodeTransactionRecord {
  id: string; // node:tx:{nodeId}:{receiptId}
  type: 'node_transaction';
  nodeId: string;
  regionId: string;
  receiptId: string;
  merchantWallet: string;
  /** Total transaction value in USD */
  transactionValueUsd: number;
  /** Total platform fee collected in USD */
  platformFeeUsd: number;
  /** Node's share of the platform fee in USD */
  nodeShareUsd: number;
  /** BPS values at time of transaction */
  platformBps: number;
  nodeBps: number;
  transactionHash?: string;
  timestamp: number;
  createdAt: number;
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export interface NodeRewardRecord {
  id: string; // node:reward:{nodeId}:{periodId}
  type: 'node_reward';
  nodeId: string;
  regionId: string;
  periodStart: number;
  periodEnd: number;
  /** Total transaction volume processed during this period */
  totalVolumeProcessed: number;
  /** Total platform fees from this node's transactions */
  totalPlatformFees: number;
  /** Node's earned reward (30% of platformBps component — but now 25 BPS of 100 BPS platform total) */
  nodeReward: number;
  /** Number of transactions in this period */
  transactionCount: number;
  /** Payout status */
  payoutStatus: 'pending' | 'processing' | 'paid' | 'failed';
  payoutTxHash?: string;
  paidAt?: number;
  createdAt: number;
}

// ─── Staking ─────────────────────────────────────────────────────────────────

export interface StakingSnapshot {
  id: string; // node:staking:{nodeId}:{timestamp}
  type: 'node_staking';
  nodeId: string;
  walletAddress: string;
  /** BSURGE token balance at snapshot time */
  bsurgeBalance: number;
  /** Required minimum stake (100,000) */
  requiredBalance: number;
  /** Whether the node meets the staking requirement */
  isCompliant: boolean;
  /** On-chain block number at snapshot */
  blockNumber?: number;
  timestamp: number;
  createdAt: number;
}

// ─── Decommissioning ─────────────────────────────────────────────────────────

export interface DecommissionRecord {
  id: string; // node:decommission:{nodeId}:{timestamp}
  type: 'node_decommission';
  nodeId: string;
  reason: DecommissionReason;
  /** Details about why decommission was triggered */
  details: string;
  /** Grace period in hours before execution */
  gracePeriodHours: number;
  /** When the grace period expires */
  graceExpiresAt: number;
  /** Current execution status */
  executionStatus: 'pending' | 'executing' | 'executed' | 'cancelled';
  /** If cancelled, why */
  cancellationReason?: string;
  triggeredAt: number;
  executedAt?: number;
  cancelledAt?: number;
  triggeredBy: string; // 'system' | admin wallet
  createdAt: number;
}

// ─── Gateway Auth ────────────────────────────────────────────────────────────

export interface NodeGatewayCaller {
  source: 'node_api_key';
  nodeId: string;
  regionId: string;
  walletAddress: string;
  scopes: NodeGatewayScope[];
}

// ─── Platform Fee Split (Node-Aware) ─────────────────────────────────────────

/**
 * When decentralization is active, the platform fee
 * is split between the Protocol and the Node Provider.
 * 
 * Platform total = platformBps (from splitConfig)
 * Of that total:
 *   - 75 BPS → Protocol Treasury (BasaltSurge)
 *   - 25 BPS → Node Provider
 * 
 * Partner fees remain separate and unchanged.
 */
export interface NodeFeeDistribution {
  /** Total platform BPS before node split */
  totalPlatformBps: number;
  /** BPS retained by BasaltSurge treasury */
  protocolBps: number;
  /** BPS awarded to the node provider */
  nodeBps: number;
  /** Calculated node reward in USD for a given transaction */
  nodeRewardUsd: number;
  /** Calculated protocol share in USD for a given transaction */
  protocolShareUsd: number;
}
