/**
 * BasaltSurge Node Performance Engine
 * 
 * Evaluates node health against thresholds and determines
 * if a node should be tagged for decommissioning.
 */

import type { NodePerformanceMetrics } from '@/types/node';
import {
  PERFORMANCE_THRESHOLDS,
  DEGRADED_WINDOWS_BEFORE_DECOMMISSION,
} from '@/lib/decentralization';

// ─── Health Evaluation ───────────────────────────────────────────────────────

/**
 * Evaluate a single set of metrics against thresholds.
 */
export function evaluateNodeHealth(
  metrics: NodePerformanceMetrics
): 'healthy' | 'degraded' | 'critical' {
  const t = PERFORMANCE_THRESHOLDS;
  let failures = 0;

  if (metrics.uptimePercent < t.minUptimePercent) failures++;
  if (metrics.p95LatencyMs > t.maxP95LatencyMs) failures++;
  if (metrics.errorRate > t.maxErrorRate) failures++;

  if (failures >= 2) return 'critical';
  if (failures >= 1) return 'degraded';
  return 'healthy';
}

/**
 * Calculate a composite performance score (0-100).
 * Weights: uptime 40%, latency 30%, error rate 30%
 */
export function calculatePerformanceScore(metrics: NodePerformanceMetrics): number {
  const t = PERFORMANCE_THRESHOLDS;

  // Uptime score: 100 at 100%, 0 at (minUptime - 2%)
  const uptimeFloor = Math.max(0, t.minUptimePercent - 2);
  const uptimeScore = Math.min(100, Math.max(0,
    ((metrics.uptimePercent - uptimeFloor) / (100 - uptimeFloor)) * 100
  ));

  // Latency score: 100 at 0ms, 0 at 2x max threshold
  const latencyScore = Math.min(100, Math.max(0,
    ((t.maxP95LatencyMs * 2 - metrics.p95LatencyMs) / (t.maxP95LatencyMs * 2)) * 100
  ));

  // Error rate score: 100 at 0%, 0 at 2x max threshold
  const errorScore = Math.min(100, Math.max(0,
    ((t.maxErrorRate * 2 - metrics.errorRate) / (t.maxErrorRate * 2)) * 100
  ));

  return Math.round(uptimeScore * 0.4 + latencyScore * 0.3 + errorScore * 0.3);
}

/**
 * Determine if a node should be tagged for decommissioning
 * based on recent performance history.
 * 
 * Returns true if the node has been degraded or critical
 * for DEGRADED_WINDOWS_BEFORE_DECOMMISSION consecutive windows.
 */
export function shouldTagForDecommission(
  recentMetrics: NodePerformanceMetrics[]
): boolean {
  if (recentMetrics.length < DEGRADED_WINDOWS_BEFORE_DECOMMISSION) return false;

  // Sort by timestamp descending (most recent first)
  const sorted = [...recentMetrics].sort((a, b) => b.timestamp - a.timestamp);

  // Check the most recent N windows
  const recentWindows = sorted.slice(0, DEGRADED_WINDOWS_BEFORE_DECOMMISSION);

  return recentWindows.every((m) => {
    const health = evaluateNodeHealth(m);
    return health === 'degraded' || health === 'critical';
  });
}

/**
 * Enrich a metrics object with calculated fields (score and health status).
 */
export function enrichMetrics(
  metrics: NodePerformanceMetrics
): NodePerformanceMetrics {
  return {
    ...metrics,
    performanceScore: calculatePerformanceScore(metrics),
    healthStatus: evaluateNodeHealth(metrics),
  };
}
