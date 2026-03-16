/**
 * BasaltSurge Node Operators Admin Panel
 * 
 * Displayed under the Platform section of the admin sidebar.
 * Provides full management of the node operator ecosystem:
 *   - Overview dashboard with region stats
 *   - Node applications (approve/reject)
 *   - Active node monitoring
 *   - Decommission management
 *   - Reward ledger and airdrop manifest
 *   - Staking compliance snapshot
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

type TabView = 'overview' | 'applications' | 'active' | 'decommissions' | 'rewards' | 'staking';

interface NodeEntry {
  nodeId: string;
  operatorName: string;
  regionId: string;
  regionName: string;
  continent: string;
  status: string;
  endpointUrl: string;
  appliedAt: number;
  provisionedAt?: number;
}

interface RegionStat {
  active: number;
  total: number;
  maxNodes: number;
}

export function NodeOperatorsPanel() {
  const [tab, setTab] = useState<TabView>('overview');
  const [nodes, setNodes] = useState<NodeEntry[]>([]);
  const [regionStats, setRegionStats] = useState<Record<string, RegionStat>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionResult, setActionResult] = useState('');

  const fetchNodes = useCallback(async (statusFilter?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter ? `/api/nodes?status=${statusFilter}&limit=100` : '/api/nodes?limit=100';
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNodes(data.nodes || []);
      setRegionStats(data.regionStats || {});
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nodes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'applications') fetchNodes('pending_review');
    else if (tab === 'active') fetchNodes('active');
    else if (tab === 'decommissions') fetchNodes('decommissioning');
    else fetchNodes();
  }, [tab, fetchNodes]);

  const handleProvision = async (nodeId: string, action: 'approve' | 'reject') => {
    setActionResult('');
    try {
      const res = await fetch('/api/nodes/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      if (action === 'approve' && data.apiKey) {
        setActionResult(`✅ Node ${nodeId} approved. API Key (ONE-TIME): ${data.apiKey}`);
      } else {
        setActionResult(`Node ${nodeId} ${action === 'approve' ? 'approved' : 'rejected'}`);
      }
      fetchNodes('pending_review');
    } catch (err: any) {
      setActionResult(`❌ ${err.message}`);
    }
  };

  const handleDecommission = async (nodeId: string) => {
    try {
      const res = await fetch('/api/nodes/decommission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, reason: 'admin_action', details: 'Manual decommission by admin' }),
      });
      if (!res.ok) throw new Error('Decommission failed');
      setActionResult(`Node ${nodeId} tagged for decommission`);
      fetchNodes();
    } catch (err: any) {
      setActionResult(`❌ ${err.message}`);
    }
  };

  const totalActive = Object.values(regionStats).reduce((s, r) => s + r.active, 0);
  const totalCapacity = Object.values(regionStats).reduce((s, r) => s + r.maxNodes, 0);

  const tabStyle = (t: TabView) => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: tab === t ? 'var(--pp-secondary, #f59e0b)' : 'transparent',
    color: tab === t ? '#fff' : 'var(--muted-foreground, #a1a1aa)',
    fontWeight: tab === t ? 700 : 400,
    fontSize: 13,
    cursor: 'pointer' as const,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Node Operators</h2>
      <p style={{ color: 'var(--muted-foreground, #a1a1aa)', fontSize: 14, marginBottom: 20 }}>
        Manage the BasaltSurge decentralized node network
      </p>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {([
          ['overview', 'Overview'],
          ['applications', 'Applications'],
          ['active', 'Active Nodes'],
          ['decommissions', 'Decommissions'],
          ['rewards', 'Rewards'],
          ['staking', 'Staking'],
        ] as [TabView, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={tabStyle(key)}>{label}</button>
        ))}
      </div>

      {/* Alerts */}
      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {actionResult && <div style={{ background: '#14532d', color: '#86efac', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13, wordBreak: 'break-all' }}>{actionResult}</div>}

      {loading && <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Loading...</p>}

      {/* Overview */}
      {!loading && tab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label="Active Nodes" value={totalActive} />
            <StatCard label="Total Capacity" value={totalCapacity} />
            <StatCard label="All Applications" value={nodes.length} />
            <StatCard label="Regions" value={Object.keys(regionStats).length} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Region Utilization</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {Object.entries(regionStats).map(([regionId, stat]) => (
              <div key={regionId} style={{ background: 'var(--card, #18181b)', borderRadius: 8, padding: 12, border: '1px solid var(--border, #27272a)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{regionId}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                  {stat.active}/{stat.maxNodes} active · {stat.total} total
                </div>
                <div style={{ marginTop: 6, height: 4, background: 'var(--border, #27272a)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${(stat.active / stat.maxNodes) * 100}%`, background: stat.active >= stat.maxNodes ? '#ef4444' : '#f59e0b', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications */}
      {!loading && tab === 'applications' && (
        <NodeTable
          nodes={nodes}
          actions={(node) => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleProvision(node.nodeId, 'approve')} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Approve</button>
              <button onClick={() => handleProvision(node.nodeId, 'reject')} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Reject</button>
            </div>
          )}
        />
      )}

      {/* Active Nodes */}
      {!loading && tab === 'active' && (
        <NodeTable
          nodes={nodes}
          actions={(node) => (
            <button onClick={() => handleDecommission(node.nodeId)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>Decommission</button>
          )}
        />
      )}

      {/* Decommissions */}
      {!loading && tab === 'decommissions' && (
        <NodeTable nodes={nodes} />
      )}

      {/* Rewards */}
      {!loading && tab === 'rewards' && <RewardsView />}

      {/* Staking */}
      {!loading && tab === 'staking' && <StakingView />}
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: 'var(--card, #18181b)', borderRadius: 12, padding: 20, border: '1px solid var(--border, #27272a)', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground, #fff)' }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted-foreground, #a1a1aa)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function NodeTable({ nodes, actions }: { nodes: NodeEntry[]; actions?: (node: NodeEntry) => React.ReactNode }) {
  if (nodes.length === 0) return <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>No nodes found.</p>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border, #27272a)' }}>
            <th style={thStyle}>Node ID</th>
            <th style={thStyle}>Operator</th>
            <th style={thStyle}>Region</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Applied</th>
            {actions && <th style={thStyle}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {nodes.map((n) => (
            <tr key={n.nodeId} style={{ borderBottom: '1px solid var(--border, #27272a)' }}>
              <td style={tdStyle}><code style={{ fontSize: 12 }}>{n.nodeId}</code></td>
              <td style={tdStyle}>{n.operatorName}</td>
              <td style={tdStyle}>{n.regionName || n.regionId}</td>
              <td style={tdStyle}><StatusBadge status={n.status} /></td>
              <td style={tdStyle}>{n.appliedAt ? new Date(n.appliedAt).toLocaleDateString() : '—'}</td>
              {actions && <td style={tdStyle}>{actions(n)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#14532d', text: '#86efac' },
    pending_review: { bg: '#713f12', text: '#fde68a' },
    provisioning: { bg: '#1e3a5f', text: '#93c5fd' },
    degraded: { bg: '#7c2d12', text: '#fdba74' },
    decommissioning: { bg: '#7f1d1d', text: '#fca5a5' },
    decommissioned: { bg: '#3f3f46', text: '#a1a1aa' },
    rejected: { bg: '#3f3f46', text: '#a1a1aa' },
  };
  const c = colors[status] || colors.rejected;
  return <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>{status.replace(/_/g, ' ')}</span>;
}

function RewardsView() {
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/nodes/rewards').then(r => r.json()).then(setManifest).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Loading rewards...</p>;
  if (!manifest) return <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>No reward data.</p>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Pending" value={`$${manifest.summary?.totalPending?.toFixed(2) || '0.00'}`} />
        <StatCard label="Eligible for Airdrop" value={manifest.summary?.eligibleForAirdrop || 0} />
        <StatCard label="Total Nodes" value={manifest.summary?.totalNodes || 0} />
      </div>
      {manifest.manifest?.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #27272a)' }}>
                <th style={thStyle}>Node ID</th>
                <th style={thStyle}>Wallet</th>
                <th style={thStyle}>Pending ($)</th>
                <th style={thStyle}>Transactions</th>
                <th style={thStyle}>Eligible</th>
              </tr>
            </thead>
            <tbody>
              {manifest.manifest.map((m: any) => (
                <tr key={m.nodeId} style={{ borderBottom: '1px solid var(--border, #27272a)' }}>
                  <td style={tdStyle}><code style={{ fontSize: 12 }}>{m.nodeId}</code></td>
                  <td style={tdStyle}><code style={{ fontSize: 11 }}>{m.walletAddress?.slice(0, 6)}...{m.walletAddress?.slice(-4)}</code></td>
                  <td style={tdStyle}>${m.pendingPayout?.toFixed(2)}</td>
                  <td style={tdStyle}>{m.transactionCount}</td>
                  <td style={tdStyle}>{m.meetsThreshold ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StakingView() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSnapshot = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/nodes/staking/snapshot', { method: 'POST' });
      const data = await res.json();
      setResult(data);
    } catch { }
    setRunning(false);
  };

  return (
    <div>
      <button
        onClick={runSnapshot}
        disabled={running}
        style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: running ? '#3f3f46' : '#f59e0b', color: '#fff', fontWeight: 600, fontSize: 14, cursor: running ? 'default' : 'pointer', marginBottom: 20 }}
      >
        {running ? 'Running Snapshot...' : 'Run Staking Snapshot'}
      </button>
      {result && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
            <StatCard label="Total Checked" value={result.total || 0} />
            <StatCard label="Compliant" value={result.compliant || 0} />
            <StatCard label="Non-Compliant" value={result.nonCompliant || 0} />
          </div>
          {result.snapshots?.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border, #27272a)' }}>
                    <th style={thStyle}>Node ID</th>
                    <th style={thStyle}>BSURGE Balance</th>
                    <th style={thStyle}>Compliant</th>
                  </tr>
                </thead>
                <tbody>
                  {result.snapshots.map((s: any) => (
                    <tr key={s.nodeId} style={{ borderBottom: '1px solid var(--border, #27272a)' }}>
                      <td style={tdStyle}><code style={{ fontSize: 12 }}>{s.nodeId}</code></td>
                      <td style={tdStyle}>{s.bsurgeBalance?.toLocaleString()}</td>
                      <td style={tdStyle}>{s.isCompliant ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Shared styles
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'var(--muted-foreground, #a1a1aa)' };
const tdStyle: React.CSSProperties = { padding: '8px 12px' };
