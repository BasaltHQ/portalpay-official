/**
 * BasaltSurge Node Dashboard Panel
 * 
 * This is the OPERATOR-FACING view — what a node operator would see
 * when managing their own node. Platform admins can also preview this
 * to understand the operator experience.
 * 
 * Shows:
 *   - Genesis node (platform instance) status
 *   - Network overview: active nodes, region map, health summary
 *   - Individual node detail viewer (drill-down by nodeId)
 *   - Routing info: how traffic is distributed
 *   - Operator application form (for prospective operators)
 */

'use client';

import React, { useState, useEffect } from 'react';

interface NodeDetail {
  nodeId: string;
  operatorName: string;
  walletAddress: string;
  regionId: string;
  region: { name: string; continent: string } | null;
  status: string;
  endpointUrl: string;
  appliedAt: number;
  provisionedAt?: number;
  performance: {
    uptimePercent: number;
    p95LatencyMs: number;
    errorRate: number;
    performanceScore: number;
    healthStatus: string;
    lastReportedAt: number;
  } | null;
  rewards: {
    totalAccrued: number;
    totalPaid: number;
    pendingPayout: number;
    transactionCount: number;
  };
  staking: {
    bsurgeBalance: number;
    requiredBalance: number;
    isCompliant: boolean;
    lastCheckedAt: number;
  } | null;
}

interface NetworkNode {
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

type DashView = 'network' | 'detail' | 'apply' | 'routing';

export function NodeDashboardPanel() {
  const [view, setView] = useState<DashView>('network');
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [regionStats, setRegionStats] = useState<Record<string, { active: number; total: number; maxNodes: number }>>({});
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [nodeDetail, setNodeDetail] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch network overview
  useEffect(() => {
    setLoading(true);
    fetch('/api/nodes?limit=100')
      .then(r => r.json())
      .then(data => {
        setNodes(data.nodes || []);
        setRegionStats(data.regionStats || {});
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch node detail
  const loadDetail = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setView('detail');
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/nodes/${nodeId}`);
      if (!res.ok) throw new Error(await res.text());
      setNodeDetail(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const activeNodes = nodes.filter(n => n.status === 'active' || n.status === 'degraded');
  const genesisNode = nodes.find(n => n.nodeId === 'node_genesis_000');
  const totalActive = Object.values(regionStats).reduce((s, r) => s + r.active, 0);
  const totalCapacity = Object.values(regionStats).reduce((s, r) => s + r.maxNodes, 0);

  // Group active nodes by continent
  const byCont: Record<string, NetworkNode[]> = {};
  for (const n of activeNodes) {
    const c = n.continent || 'Unknown';
    if (!byCont[c]) byCont[c] = [];
    byCont[c].push(n);
  }

  const navStyle = (v: DashView) => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: view === v ? '#f59e0b' : 'transparent',
    color: view === v ? '#fff' : 'var(--muted-foreground, #a1a1aa)',
    fontWeight: view === v ? 700 : 400,
    fontSize: 13,
    cursor: 'pointer' as const,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Nodes</h2>
      <p style={{ color: 'var(--muted-foreground, #a1a1aa)', fontSize: 14, marginBottom: 20 }}>
        BasaltSurge decentralized node network — operator view
      </p>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setView('network')} style={navStyle('network')}>Network</button>
        <button onClick={() => setView('routing')} style={navStyle('routing')}>Routing</button>
        <button onClick={() => setView('apply')} style={navStyle('apply')}>Become a Node Operator</button>
      </div>

      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {/* ─── Network Overview ─────────────────────────────────────────── */}
      {view === 'network' && (
        <div>
          {loading ? <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Loading network...</p> : (
            <>
              {/* Genesis Node Banner */}
              <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #18181b)', borderRadius: 12, padding: 20, border: '1px solid #2563eb33', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: genesisNode ? '#22c55e' : '#ef4444', boxShadow: genesisNode ? '0 0 8px #22c55eaa' : 'none' }} />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Genesis Node — Platform Instance</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#14532d', color: '#86efac', fontWeight: 600 }}>immortal</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                  <code style={{ fontSize: 11 }}>node_genesis_000</code> · 
                  {genesisNode ? ` ${genesisNode.regionName || genesisNode.regionId}` : ' Not yet registered'} · 
                  First node in the network — can never be decommissioned
                </div>
                {genesisNode && (
                  <button
                    onClick={() => loadDetail('node_genesis_000')}
                    style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', fontSize: 12, cursor: 'pointer' }}
                  >
                    View Details
                  </button>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
                <Card label="Active Nodes" value={totalActive} />
                <Card label="Total Capacity" value={totalCapacity.toLocaleString()} />
                <Card label="Utilization" value={totalCapacity > 0 ? `${Math.round((totalActive / totalCapacity) * 100)}%` : '0%'} />
                <Card label="Continents" value={Object.keys(byCont).length} />
              </div>

              {/* By Continent */}
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Active Nodes by Region</h3>
              {Object.entries(byCont).sort(([a], [b]) => a.localeCompare(b)).map(([continent, cNodes]) => (
                <div key={continent} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 6 }}>{continent} ({cNodes.length})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                    {cNodes.map(n => (
                      <div
                        key={n.nodeId}
                        onClick={() => loadDetail(n.nodeId)}
                        style={{
                          background: 'var(--card, #18181b)', borderRadius: 8, padding: 12,
                          border: '1px solid var(--border, #27272a)', cursor: 'pointer',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseOver={e => (e.currentTarget.style.borderColor = '#f59e0b')}
                        onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border, #27272a)')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.status === 'active' ? '#22c55e' : '#eab308' }} />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{n.operatorName}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>
                          <code>{n.nodeId}</code> · {n.regionName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {activeNodes.length === 0 && (
                <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>No active nodes in the network yet. The genesis node will be the first.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── Node Detail ──────────────────────────────────────────────── */}
      {view === 'detail' && (
        <div>
          <button onClick={() => setView('network')} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border, #27272a)', background: 'transparent', color: 'var(--muted-foreground)', fontSize: 12, cursor: 'pointer', marginBottom: 16 }}>
            ← Back to Network
          </button>

          {detailLoading && <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Loading node details...</p>}

          {!detailLoading && nodeDetail && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: nodeDetail.status === 'active' ? '#22c55e' : nodeDetail.status === 'degraded' ? '#eab308' : '#ef4444' }} />
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700 }}>{nodeDetail.operatorName}</h3>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    <code>{nodeDetail.nodeId}</code> · {nodeDetail.region?.name || nodeDetail.regionId} · {nodeDetail.region?.continent}
                  </div>
                </div>
                {nodeDetail.nodeId === 'node_genesis_000' && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#14532d', color: '#86efac', fontWeight: 600 }}>genesis</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                <Card label="Status" value={nodeDetail.status} />
                <Card label="Wallet" value={nodeDetail.walletAddress ? `${nodeDetail.walletAddress.slice(0, 6)}...${nodeDetail.walletAddress.slice(-4)}` : '—'} />
                <Card label="Provisioned" value={nodeDetail.provisionedAt ? new Date(nodeDetail.provisionedAt).toLocaleDateString() : '—'} />
                <Card label="Endpoint" value={nodeDetail.endpointUrl ? '✓ Online' : '—'} />
              </div>

              {/* Performance */}
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Performance</h4>
              {nodeDetail.performance ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                  <Card label="Uptime" value={`${nodeDetail.performance.uptimePercent}%`} />
                  <Card label="P95 Latency" value={`${nodeDetail.performance.p95LatencyMs}ms`} />
                  <Card label="Error Rate" value={`${(nodeDetail.performance.errorRate * 100).toFixed(2)}%`} />
                  <Card label="Health Score" value={nodeDetail.performance.performanceScore.toFixed(1)} />
                  <Card label="Health" value={nodeDetail.performance.healthStatus} />
                </div>
              ) : (
                <p style={{ color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 24 }}>No performance data reported yet.</p>
              )}

              {/* Rewards */}
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Rewards</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                <Card label="Total Accrued" value={`$${nodeDetail.rewards.totalAccrued.toFixed(2)}`} />
                <Card label="Total Paid" value={`$${nodeDetail.rewards.totalPaid.toFixed(2)}`} />
                <Card label="Pending" value={`$${nodeDetail.rewards.pendingPayout.toFixed(2)}`} />
                <Card label="Transactions" value={nodeDetail.rewards.transactionCount} />
              </div>

              {/* Staking */}
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Staking</h4>
              {nodeDetail.staking ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <Card label="BSURGE Balance" value={nodeDetail.staking.bsurgeBalance.toLocaleString()} />
                  <Card label="Required" value={nodeDetail.staking.requiredBalance.toLocaleString()} />
                  <Card label="Compliant" value={nodeDetail.staking.isCompliant ? '✅ Yes' : '❌ No'} />
                </div>
              ) : (
                <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Staking verification not active (token not configured).</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Routing ──────────────────────────────────────────────────── */}
      {view === 'routing' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>How Traffic Routing Works</h3>

          <div style={{ background: 'var(--card, #18181b)', borderRadius: 12, padding: 24, border: '1px solid var(--border, #27272a)', marginBottom: 20 }}>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--muted-foreground)' }}>
              <p style={{ marginBottom: 16 }}>When a merchant or shopper makes a request, the platform routes it to the optimal node using this strategy:</p>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                <li style={{ marginBottom: 8 }}><strong style={{ color: 'var(--foreground, #fff)' }}>Geo-IP Resolution</strong> — Determine the shopper&apos;s location from CDN headers (Cloudflare, Vercel, etc.)</li>
                <li style={{ marginBottom: 8 }}><strong style={{ color: 'var(--foreground, #fff)' }}>Region Match</strong> — Find all healthy nodes in the shopper&apos;s region</li>
                <li style={{ marginBottom: 8 }}><strong style={{ color: 'var(--foreground, #fff)' }}>Nearest Region</strong> — If no nodes in the exact region, find the nearest region with active nodes using Haversine distance</li>
                <li style={{ marginBottom: 8 }}><strong style={{ color: 'var(--foreground, #fff)' }}>Weighted Random</strong> — Select a node with weighted probability (active nodes: 3×, degraded: 1×)</li>
                <li style={{ marginBottom: 0 }}><strong style={{ color: 'var(--foreground, #fff)' }}>Genesis Fallback</strong> — If no healthy nodes are available, the platform instance (genesis node) handles the request</li>
              </ol>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--card, #18181b)', borderRadius: 12, padding: 20, border: '1px solid var(--border, #27272a)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Attribution</div>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6, margin: 0 }}>
                Every transaction is stamped with the processing node&apos;s ID. This powers the reward ledger — each node accrues 25% of the platform fee from transactions it processes.
              </p>
            </div>
            <div style={{ background: 'var(--card, #18181b)', borderRadius: 12, padding: 20, border: '1px solid var(--border, #27272a)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Heartbeat</div>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6, margin: 0 }}>
                Nodes report performance metrics periodically. If a node degrades for 3+ consecutive windows, it is tagged for decommission with a 72-hour grace period.
              </p>
            </div>
            <div style={{ background: 'var(--card, #18181b)', borderRadius: 12, padding: 20, border: '1px solid var(--border, #27272a)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Airdrops</div>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6, margin: 0 }}>
                Rewards accrue in a USD-denominated ledger. When a node&apos;s pending balance reaches $50, it becomes eligible for a BSURGE token airdrop.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Apply ────────────────────────────────────────────────────── */}
      {view === 'apply' && <ApplyForm />}
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: 'var(--card, #18181b)', borderRadius: 12, padding: 16, border: '1px solid var(--border, #27272a)', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground, #fff)', wordBreak: 'break-all' }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontSize: 11, color: 'var(--muted-foreground, #a1a1aa)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ApplyForm() {
  const [form, setForm] = useState({ walletAddress: '', operatorName: '', contactEmail: '', regionId: '', endpointUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/nodes/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div style={{ background: '#14532d', borderRadius: 12, padding: 24, border: '1px solid #16a34a' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#86efac', marginBottom: 8 }}>✅ Application Submitted</h3>
        <p style={{ fontSize: 14, color: '#86efac', marginBottom: 8 }}>Node ID: <code>{result.nodeId}</code></p>
        <p style={{ fontSize: 13, color: '#bbf7d0' }}>{result.message}</p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--border, #27272a)', background: 'var(--card, #18181b)',
    color: 'var(--foreground, #fff)', fontSize: 14, outline: 'none',
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Apply to Become a Node Operator</h3>

      {error && <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--muted-foreground)' }}>Wallet Address</label>
          <input style={inputStyle} placeholder="0x..." value={form.walletAddress} onChange={e => setForm(f => ({ ...f, walletAddress: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--muted-foreground)' }}>Operator Name</label>
          <input style={inputStyle} placeholder="Your organization name" value={form.operatorName} onChange={e => setForm(f => ({ ...f, operatorName: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--muted-foreground)' }}>Contact Email</label>
          <input style={inputStyle} type="email" placeholder="ops@example.com" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--muted-foreground)' }}>Region ID</label>
          <input style={inputStyle} placeholder="e.g. us-east-va" value={form.regionId} onChange={e => setForm(f => ({ ...f, regionId: e.target.value }))} />
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>See <a href="/nodes" target="_blank" style={{ color: '#f59e0b' }}>/nodes</a> for available regions</div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--muted-foreground)' }}>Endpoint URL</label>
          <input style={inputStyle} placeholder="https://your-node.example.com" value={form.endpointUrl} onChange={e => setForm(f => ({ ...f, endpointUrl: e.target.value }))} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !form.walletAddress || !form.operatorName || !form.contactEmail || !form.regionId || !form.endpointUrl}
          style={{
            padding: '12px 24px', borderRadius: 8, border: 'none',
            background: submitting ? '#3f3f46' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: submitting ? 'default' : 'pointer',
            marginTop: 8,
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}
