/**
 * BasaltSurge /nodes Landing Page
 * 
 * Premium, badass presentation of the decentralized node network.
 * Shows "Coming Soon" banner with full system breakdown.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Node Network — BasaltSurge',
  description: 'Become a node operator on the BasaltSurge decentralized commerce network. Deploy, earn, and power the future of payments.',
};

export default function NodesPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050506',
      color: '#f4f4f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      {/* ── Animated Grid Background ──────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />
      <div style={{
        position: 'fixed', top: '-40%', right: '-20%', width: '80vw', height: '80vw',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'fixed', bottom: '-30%', left: '-10%', width: '60vw', height: '60vw',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(239,68,68,0.04) 0%, transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <header style={{ textAlign: 'center', paddingTop: 100, paddingBottom: 60 }}>
          {/* Coming Soon Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 20px', borderRadius: 999, marginBottom: 32,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.15))',
            border: '1px solid rgba(245,158,11,0.3)',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#f59e0b',
              boxShadow: '0 0 12px #f59e0baa',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#f59e0b' }}>
              Coming Soon
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.05,
            letterSpacing: '-0.03em', margin: 0,
            background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            The BasaltSurge<br />Node Network
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)', color: '#71717a', lineHeight: 1.7,
            maxWidth: 640, margin: '24px auto 0',
          }}>
            Deploy your own instance. Process transactions in your region.
            Earn BSURGE rewards for powering decentralized commerce.
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 48, marginTop: 48,
            flexWrap: 'wrap',
          }}>
            {[
              ['150+', 'Regions'],
              ['3,950', 'Node Capacity'],
              ['25%', 'Revenue Share'],
              ['$0', 'Infra Fees'],
            ].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{val}</div>
                <div style={{ fontSize: 12, color: '#52525b', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* ── How It Works ────────────────────────────────────────── */}
        <section style={{ paddingBottom: 80 }}>
          <SectionTitle label="How It Works" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            <StepCard
              step="01"
              title="Stake"
              description="Hold 100,000 BSURGE tokens in your wallet. This is verified via periodic on-chain snapshots — no lock-up required, just maintain your balance."
            />
            <StepCard
              step="02"
              title="Apply"
              description="Submit your operator application with your wallet address, preferred region, and endpoint URL. The platform verifies your stake automatically."
            />
            <StepCard
              step="03"
              title="Deploy"
              description="Once approved, receive a single API key. Deploy the BasaltSurge repo — the node self-configures via bootstrap. No .env hell."
            />
            <StepCard
              step="04"
              title="Earn"
              description="Your node processes transactions for your region. Accrue 25% of platform fees per transaction. Receive BSURGE airdrops when your balance hits $50."
            />
          </div>
        </section>

        {/* ── Architecture ────────────────────────────────────────── */}
        <section style={{ paddingBottom: 80 }}>
          <SectionTitle label="Architecture" />

          <div style={{
            background: 'linear-gradient(135deg, rgba(24,24,27,0.8), rgba(9,9,11,0.9))',
            borderRadius: 16, padding: 40, border: '1px solid rgba(245,158,11,0.1)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2.2, color: '#a1a1aa' }}>
              <div style={{ color: '#52525b' }}>{'// Request lifecycle'}</div>
              <div><span style={{ color: '#f59e0b' }}>shopper</span>.request()</div>
              <div style={{ paddingLeft: 24 }}>→ <span style={{ color: '#3b82f6' }}>platform</span>.resolveGeoIP(headers)</div>
              <div style={{ paddingLeft: 24 }}>→ <span style={{ color: '#3b82f6' }}>router</span>.findRegion(lat, lng)</div>
              <div style={{ paddingLeft: 24 }}>→ <span style={{ color: '#22c55e' }}>node</span>.processTransaction()</div>
              <div style={{ paddingLeft: 24 }}>→ <span style={{ color: '#a855f7' }}>ledger</span>.accrueReward(nodeId, 25bps)</div>
              <div style={{ paddingLeft: 24 }}>→ <span style={{ color: '#f59e0b' }}>receipt</span>.stamp(nodeId)</div>
              <div style={{ color: '#52525b', marginTop: 12 }}>{'// Fallback'}</div>
              <div><span style={{ color: '#ef4444' }}>if</span> (healthyNodes === 0) → <span style={{ color: '#f59e0b' }}>genesis</span>.handle() <span style={{ color: '#52525b' }}>{'// platform always online'}</span></div>
            </div>
          </div>
        </section>

        {/* ── Routing Engine ───────────────────────────────────────── */}
        <section style={{ paddingBottom: 80 }}>
          <SectionTitle label="Intelligent Routing" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <FeatureCard
              icon="🌐"
              title="Geo-IP Resolution"
              description="Every request is geolocated using CDN headers (Cloudflare, Vercel). The platform knows where your shoppers are before the request even reaches application code."
            />
            <FeatureCard
              icon="📡"
              title="Haversine Distance"
              description="If no nodes exist in the shopper's exact region, we find the nearest one using real spherical distance calculations. Latency stays minimal."
            />
            <FeatureCard
              icon="⚖️"
              title="Weighted Selection"
              description="Healthy nodes get 3× the traffic weight of degraded nodes. Traffic naturally flows to the strongest performers in each region."
            />
            <FeatureCard
              icon="🏔️"
              title="Genesis Fallback"
              description="The platform instance itself is the immortal genesis node. If every operator node goes offline, the genesis node handles all traffic. Zero downtime, ever."
            />
          </div>
        </section>

        {/* ── Requirements ─────────────────────────────────────────── */}
        <section style={{ paddingBottom: 80 }}>
          <SectionTitle label="Requirements" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <RequirementCard
              title="Staking"
              items={[
                '100,000 BSURGE tokens held in wallet',
                'Verified via periodic on-chain snapshots',
                'Soft stake — no lock-up, but must maintain balance',
                'Falling below triggers 72-hour grace period',
              ]}
            />
            <RequirementCard
              title="Performance"
              items={[
                '≥ 99.5% uptime per 24-hour window',
                '≤ 200ms P95 latency',
                '< 1% error rate',
                '3 consecutive degraded windows → decommission tag',
              ]}
            />
            <RequirementCard
              title="Infrastructure"
              items={[
                'Deploy the BasaltSurge repository',
                'Set a single environment variable: NODE_API_KEY',
                'Node bootstraps full config from the platform',
                'No database credentials or S3 keys needed',
              ]}
            />
          </div>
        </section>

        {/* ── Revenue Model ────────────────────────────────────────── */}
        <section style={{ paddingBottom: 80 }}>
          <SectionTitle label="Revenue Model" />

          <div style={{
            background: 'linear-gradient(135deg, rgba(24,24,27,0.8), rgba(9,9,11,0.9))',
            borderRadius: 16, padding: 40, border: '1px solid rgba(245,158,11,0.1)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#f59e0b' }}>75%</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1aa', marginTop: 4 }}>BasaltSurge Treasury</div>
                <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>Platform operations,<br />development, and growth</div>
              </div>
              <div>
                <div style={{ fontSize: 48, fontWeight: 900, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>25%</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1aa', marginTop: 4 }}>Node Operators</div>
                <div style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>Accrued per transaction,<br />disbursed via BSURGE airdrop</div>
              </div>
            </div>

            <div style={{
              marginTop: 32, padding: 20, borderRadius: 12,
              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.8 }}>
                Rewards accrue in a USD-denominated internal ledger. When your pending payout reaches <strong style={{ color: '#f59e0b' }}>$50</strong>, you become eligible for a BSURGE token airdrop. No complicated split management — we handle distribution centrally.
              </div>
            </div>
          </div>
        </section>

        {/* ── Global Coverage ──────────────────────────────────────── */}
        <section style={{ paddingBottom: 80 }}>
          <SectionTitle label="Global Coverage" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { continent: 'North America', count: 41, cities: 'Virginia · New York · Toronto · Mexico City · São José' },
              { continent: 'South America', count: 17, cities: 'São Paulo · Buenos Aires · Bogotá · Santiago · Lima' },
              { continent: 'Europe', count: 42, cities: 'London · Frankfurt · Paris · Amsterdam · Stockholm' },
              { continent: 'Africa', count: 20, cities: 'Lagos · Nairobi · Cape Town · Cairo · Accra' },
              { continent: 'Middle East', count: 14, cities: 'Dubai · Riyadh · Istanbul · Tel Aviv · Doha' },
              { continent: 'Asia', count: 35, cities: 'Tokyo · Singapore · Mumbai · Seoul · Bangkok' },
              { continent: 'Oceania', count: 9, cities: 'Sydney · Melbourne · Auckland · Brisbane · Perth' },
            ].map(({ continent, count, cities }) => (
              <div key={continent} style={{
                background: 'rgba(24,24,27,0.6)', borderRadius: 12, padding: 20,
                border: '1px solid rgba(39,39,42,0.8)',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{continent}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                  }}>{count} regions</span>
                </div>
                <div style={{ fontSize: 11, color: '#52525b', lineHeight: 1.6 }}>{cities}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Decommissioning ──────────────────────────────────────── */}
        <section style={{ paddingBottom: 80 }}>
          <SectionTitle label="Safety & Enforcement" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <FeatureCard
              icon="🛡️"
              title="Dual Trigger System"
              description="Nodes are flagged for decommission if performance degrades over 3+ consecutive windows OR if staking balance falls below the 1M BSURGE threshold."
            />
            <FeatureCard
              icon="⏱️"
              title="72-Hour Grace Period"
              description="When flagged, operators get 72 hours to recover — improve performance metrics or restore token balance. Recovery automatically cancels the decommission."
            />
            <FeatureCard
              icon="🔐"
              title="Scoped Access"
              description="Node API keys are SHA-256 hashed. Nodes never see database credentials or S3 keys directly. All data access goes through the platform's secure gateway."
            />
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section style={{ textAlign: 'center', paddingBottom: 120 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.08))',
            borderRadius: 20, padding: '60px 40px',
            border: '1px solid rgba(245,158,11,0.15)',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 999, marginBottom: 20,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0baa' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#f59e0b' }}>Launching with BSURGE Token</span>
            </div>

            <h2 style={{
              fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, lineHeight: 1.1,
              letterSpacing: '-0.02em', margin: '0 0 16px',
            }}>
              Ready to Power<br />Decentralized Commerce?
            </h2>
            <p style={{ fontSize: 16, color: '#71717a', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7 }}>
              The node operator program launches alongside the BSURGE token.
              Get early access by reaching out to the BasaltSurge team.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/nodes/apply"
                style={{
                  display: 'inline-block', padding: '14px 36px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 24px rgba(245,158,11,0.3)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                Apply Now
              </a>
              <a
                href="mailto:nodes@basaltsurge.com"
                style={{
                  display: 'inline-block', padding: '14px 36px', borderRadius: 12,
                  background: 'transparent', border: '1px solid rgba(245,158,11,0.3)',
                  color: '#f59e0b', fontSize: 16, fontWeight: 700, textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
              >
                Get In Touch
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
        color: '#f59e0b', marginBottom: 8,
      }}>{label}</div>
      <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, #f59e0b, transparent)', borderRadius: 1 }} />
    </div>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div style={{
      background: 'rgba(24,24,27,0.6)', borderRadius: 16, padding: 28,
      border: '1px solid rgba(39,39,42,0.8)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -8, right: -4,
        fontSize: 80, fontWeight: 900, color: 'rgba(245,158,11,0.04)',
        lineHeight: 1,
      }}>{step}</div>
      <div style={{
        fontSize: 12, fontWeight: 800, color: '#f59e0b', letterSpacing: 2,
        textTransform: 'uppercase', marginBottom: 12,
      }}>Step {step}</div>
      <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7, margin: 0 }}>{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      background: 'rgba(24,24,27,0.6)', borderRadius: 16, padding: 28,
      border: '1px solid rgba(39,39,42,0.8)',
    }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#71717a', lineHeight: 1.7, margin: 0 }}>{description}</p>
    </div>
  );
}

function RequirementCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{
      background: 'rgba(24,24,27,0.6)', borderRadius: 16, padding: 28,
      border: '1px solid rgba(39,39,42,0.8)',
    }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>{title}</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={i} style={{
            fontSize: 13, color: '#a1a1aa', lineHeight: 1.7, paddingLeft: 16,
            position: 'relative', marginBottom: 6,
          }}>
            <span style={{
              position: 'absolute', left: 0, top: 8,
              width: 5, height: 5, borderRadius: '50%', background: '#f59e0b',
            }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
