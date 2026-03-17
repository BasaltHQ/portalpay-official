'use client';

import React from 'react';
import Link from 'next/link';

/* ───────────────────────────────────────────────────────────────────────────
   Cannabis Compliance Hero Section
   "The first free, fully compliant Cannabis POS — METRC + BioTrack built-in."
   ─────────────────────────────────────────────────────────────────────────── */

const METRC_STATES = ['AK', 'CA', 'CO', 'DC', 'LA', 'MA', 'MD', 'ME', 'MI', 'MO', 'MT', 'NJ', 'NV', 'OH', 'OK', 'OR', 'WV'];
const BIOTRACK_STATES = ['FL', 'NM', 'HI', 'DE', 'CT', 'AR'];

const FEATURES = [
  { icon: '🌱', title: 'Seed-to-Sale Tracking', desc: 'Full plant lifecycle — clone to cured flower — synced in real-time with your state compliance system.' },
  { icon: '📦', title: 'Package & Inventory Sync', desc: 'Two-way sync with 210+ METRC endpoints and 55+ BioTrack endpoints — never submit a manual report again.' },
  { icon: '🔬', title: 'Lab Results Integration', desc: 'Import COAs, link potency data to batches, and auto-release test results to your traceability provider.' },
  { icon: '🚚', title: 'Transfer Manifests', desc: 'Generate compliant transport manifests, manage drivers and vehicles, and track deliveries end-to-end.' },
  { icon: '💰', title: 'Sales Receipts & Dispensing', desc: 'Every POS sale auto-reports to METRC or BioTrack. Patient limits, customer types, and retailer deliveries built-in.' },
  { icon: '🔍', title: 'Audit & Reconciliation', desc: 'Track discrepancies between your POS and compliance platform. Sync or bypass — with a full audit trail.' },
];

const ENDPOINT_CATEGORIES = [
  'Additives', 'Caregivers', 'Employees', 'Facilities', 'Harvests', 'Items',
  'Lab Tests', 'Locations', 'Packages', 'Patients', 'Plant Batches', 'Plants',
  'Processing', 'Retail ID', 'Sales', 'Strains', 'Tags', 'Transfers',
  'Transporters', 'Units', 'Waste',
];

export default function CannabisComplianceSection() {
  const [hoveredFeature, setHoveredFeature] = React.useState<number | null>(null);

  return (
    <section className="mt-8 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/[0.04] blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Animated top accent bar */}
        <div className="h-1 w-full" style={{
          background: 'linear-gradient(90deg, #10b981 0%, #34d399 25%, #8b5cf6 50%, #a78bfa 75%, #10b981 100%)',
          backgroundSize: '200% 100%',
          animation: 'cannabis-gradient-slide 6s linear infinite',
        }} />

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes cannabis-gradient-slide {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
          @keyframes cannabis-leaf-float {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.04; }
            50% { transform: translateY(-12px) rotate(8deg); opacity: 0.08; }
          }
          @keyframes cannabis-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          @keyframes cannabis-state-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}} />

        <div className="p-6 md:p-10 bg-gradient-to-b from-[#0a0f0a] via-[#0c1210] to-[#0a0a10]">

          {/* ─── HERO ─── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Industry First</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
              The First <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-violet-400">Free & Fully Compliant</span>
              <br />Cannabis POS Solution
            </h2>
            <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-6">
              METRC v2 and BioTrack natively integrated. 210+ API endpoints. Zero compliance fees.
              Accept crypto payments <em>and</em> stay 100% compliant with your state's seed-to-sale system — all from one platform.
            </p>
            <Link href="/cannabis" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              Learn more about our cannabis compliance solution
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* ─── PROVIDER BADGES ─── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            {/* METRC Badge */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xl">🏛️</div>
              <div>
                <p className="text-sm font-bold text-emerald-400">METRC v2</p>
                <p className="text-[11px] text-white/40">24 categories · 210+ endpoints</p>
              </div>
              <div className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">FULL COVERAGE</div>
            </div>
            {/* BioTrack Badge */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl border border-violet-500/15 bg-violet-500/[0.04] backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-xl">🧬</div>
              <div>
                <p className="text-sm font-bold text-violet-400">BioTrack</p>
                <p className="text-[11px] text-white/40">13 categories · 55+ endpoints</p>
              </div>
              <div className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/15 text-violet-400">ALL STATES</div>
            </div>
          </div>

          {/* ─── STATE COVERAGE SCROLLER ─── */}
          <div className="relative mb-10 overflow-hidden py-3">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0f0a] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a10] to-transparent z-10" />
            <div className="flex gap-2 whitespace-nowrap" style={{ animation: 'cannabis-state-scroll 30s linear infinite', width: 'max-content' }}>
              {[...METRC_STATES, ...BIOTRACK_STATES, ...METRC_STATES, ...BIOTRACK_STATES].map((st, i) => {
                const isMetrc = METRC_STATES.includes(st);
                return (
                  <span key={`${st}-${i}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                      isMetrc
                        ? 'border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-400/80'
                        : 'border-violet-500/15 bg-violet-500/[0.06] text-violet-400/80'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isMetrc ? 'bg-emerald-500' : 'bg-violet-500'}`} />
                    {st}
                  </span>
                );
              })}
            </div>
          </div>

          {/* ─── FEATURES GRID ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`relative rounded-xl border p-5 transition-all duration-300 cursor-default ${
                  hoveredFeature === i
                    ? 'border-emerald-500/20 bg-emerald-500/[0.04] scale-[1.02] shadow-lg shadow-emerald-500/5'
                    : 'border-white/[0.06] bg-white/[0.015] hover:border-white/10'
                }`}
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* ─── WHY FREE? ─── */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 md:p-8 mb-10">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">
                  Why is this free?
                </h3>
                <p className="text-sm text-white/40 leading-relaxed mb-4">
                  Other cannabis POS compliance add-ons cost <span className="text-white/60 font-medium">$200–$500/month</span> per location.
                  We believe compliance shouldn't be a luxury. By building METRC and BioTrack directly into the
                  BasaltSurge protocol, every dispensary — from single-location operators to multi-state MSOs — gets
                  enterprise-grade traceability at <span className="text-emerald-400 font-semibold">zero additional cost</span>.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Compliance Fee', value: '$0', color: 'text-emerald-400' },
                    { label: 'API Calls', value: 'Unlimited', color: 'text-emerald-400' },
                    { label: 'States Covered', value: '23', color: 'text-white' },
                    { label: 'Endpoint Categories', value: '37', color: 'text-white' },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-64 shrink-0">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-violet-500/10 border border-white/[0.08] p-5 text-center">
                  <div className="text-4xl mb-2">🍃</div>
                  <p className="text-xs text-white/50 mb-3">Start selling compliant today</p>
                  <Link
                    href="/apply"
                    className="block w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Get Started — Free
                  </Link>
                  <a
                    href="#contact"
                    className="block w-full mt-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/60 text-sm font-medium hover:bg-white/[0.06] hover:text-white/80 hover:border-white/20 transition-all text-center"
                  >
                    Contact Us — Migration Help
                  </a>
                  <p className="text-[10px] text-white/25 mt-2">No contracts · No compliance fees</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── ENDPOINT COVERAGE TICKER ─── */}
          <div className="text-center">
            <p className="text-[11px] text-white/20 mb-2 uppercase tracking-widest font-medium">Full METRC v2 Endpoint Coverage</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {ENDPOINT_CATEGORIES.map((cat) => (
                <span key={cat} className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/30 font-medium">
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
