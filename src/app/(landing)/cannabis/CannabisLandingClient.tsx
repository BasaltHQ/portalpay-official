'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ContactFormSection from '@/components/landing/ContactFormSection';

/* ═══════════════════════════════════════════════════════════════════════════
   Cannabis POS — Dedicated Landing Page
   "The first free, fully compliant Cannabis POS"
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── State Data ───
const METRC_STATES = [
  { code: 'AK', name: 'Alaska' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'DC', name: 'Washington DC' }, { code: 'LA', name: 'Louisiana' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MD', name: 'Maryland' }, { code: 'ME', name: 'Maine' }, { code: 'MI', name: 'Michigan' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NV', name: 'Nevada' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'WV', name: 'West Virginia' },
];
const BIOTRACK_STATES = [
  { code: 'FL', name: 'Florida' }, { code: 'NM', name: 'New Mexico' }, { code: 'HI', name: 'Hawaii' },
  { code: 'DE', name: 'Delaware' }, { code: 'CT', name: 'Connecticut' }, { code: 'AR', name: 'Arkansas' },
];

// ─── Competitor Data (from public pricing pages, Capterra, SelectHub) ───
const COMPETITORS = [
  {
    name: 'BasaltSurge',
    highlight: true,
    monthly: 'Free',
    compliance: 'Free',
    contracts: 'None',
    metrc: true, biotrack: true,
    crypto: true,
    endpoints: '265+',
    states: 23,
    features: ['POS', 'Inventory', 'Compliance', 'Audit', 'Crypto Payments', 'Analytics', 'Lab Results'],
  },
  {
    name: 'Dutchie',
    monthly: '$500+',
    compliance: 'Included',
    contracts: '12–36 mo',
    metrc: true, biotrack: true,
    crypto: false,
    endpoints: 'N/A',
    states: 'Variable',
    features: ['POS', 'E-Commerce', 'Compliance'],
  },
  {
    name: 'Flowhub',
    monthly: '$399–499+',
    compliance: 'Included',
    contracts: '12 mo',
    metrc: true, biotrack: true,
    crypto: false,
    endpoints: 'N/A',
    states: 'Variable',
    features: ['POS', 'Compliance', 'Inventory'],
  },
  {
    name: 'Treez',
    monthly: '$500–1,500+',
    compliance: 'Included',
    contracts: 'Annual',
    metrc: true, biotrack: false,
    crypto: false,
    endpoints: 'N/A',
    states: 'METRC only',
    features: ['POS', 'Payments', 'Compliance'],
  },
  {
    name: 'BLAZE',
    monthly: 'Custom Quote',
    compliance: 'Add-on',
    contracts: 'Annual + 5% increase',
    metrc: true, biotrack: false,
    crypto: false,
    endpoints: 'N/A',
    states: 'METRC only',
    features: ['POS', 'Delivery', 'Compliance'],
  },
  {
    name: 'Meadow',
    monthly: 'Contact Sales',
    compliance: 'Included',
    contracts: 'Annual',
    metrc: true, biotrack: false,
    crypto: false,
    endpoints: 'N/A',
    states: 'CA focused',
    features: ['POS', 'E-Commerce', 'Compliance'],
  },
];

// ─── Features ───
const FEATURES = [
  { icon: '🌱', title: 'Seed-to-Sale Tracking', desc: 'Full plant lifecycle — clone to cured flower — synced in real-time with your state compliance system. Track every plant, harvest, and package.', details: ['Plant batches & mothers', 'Growth phase tracking', 'Harvest batch management', 'Waste & destruction logging'] },
  { icon: '📦', title: 'Package & Inventory Sync', desc: 'Two-way sync with 210+ METRC endpoints and 55+ BioTrack endpoints. Every inventory movement auto-reports.', details: ['Real-time quantity sync', 'Package creation & transfers', 'Location/sublocation tracking', 'Automatic tag assignment'] },
  { icon: '🔬', title: 'Lab Results Integration', desc: 'Import COAs, link potency data to batches, and auto-release test results to your traceability provider.', details: ['COA document upload', 'Potency & terpene tracking', 'Batch linkage', 'Auto-release workflow'] },
  { icon: '🚚', title: 'Transfer & Transport Manifests', desc: 'Generate compliant transport manifests, manage drivers and vehicles, and track deliveries end-to-end.', details: ['Driver & vehicle registry', 'Route planning', 'Real-time status updates', 'Hub transfer support'] },
  { icon: '💰', title: 'Sales & Dispensing Compliance', desc: 'Every POS sale auto-reports to METRC or BioTrack. Patient limits, customer types, and retailer deliveries built-in.', details: ['Receipt auto-reporting', 'Patient limit enforcement', 'Delivery sales tracking', 'Customer type management'] },
  { icon: '🔍', title: 'Audit & Reconciliation', desc: 'Track discrepancies between your POS and compliance platform. Sync or bypass — with a full audit trail.', details: ['Quantity discrepancy detection', 'One-click sync resolution', 'Bypass with audit logging', 'Historical diff tracking'] },
  { icon: '💳', title: 'Crypto & Cashless Payments', desc: 'Accept stablecoins (USDC, USDT) and tokens on-chain. Instant settlement, no chargebacks, no bank holds.', details: ['QR code payments', 'Instant settlement', 'Multi-token support', 'No bank account required'] },
  { icon: '📊', title: 'Analytics & Reporting', desc: 'Real-time dashboards with sales trends, inventory levels, compliance status, and financial reconciliation.', details: ['Revenue dashboards', 'Compliance score tracking', 'Inventory velocity', 'Custom report exports'] },
  { icon: '🏷️', title: 'Tag & Label Management', desc: 'Track METRC tags from assignment through retirement. Manage plant, package, and location tags.', details: ['Tag inventory tracking', 'Auto-assignment workflows', 'Void & replacement', 'Tag type management'] },
  { icon: '👥', title: 'Patient & Caregiver Management', desc: 'Verify patients, manage caregivers, enforce dispensing limits, and track medical vs. adult-use sales.', details: ['Patient card verification', 'Caregiver associations', 'Purchase limit enforcement', 'Medical vs. recreational split'] },
  { icon: '🏭', title: 'Processing & Manufacturing', desc: 'Track processing jobs from input materials to finished products. Manage additives, yields, and waste.', details: ['Processing job creation', 'Input/output tracking', 'Yield calculations', 'Additive templates'] },
  { icon: '🌐', title: 'Multi-State Support', desc: 'One platform for all your locations. State-specific configurations auto-apply based on your license.', details: ['Per-state API routing', 'Regulatory body mapping', 'State-specific categories', 'Multi-license management'] },
];

// ─── METRC Endpoint Categories (all 24) ───
const METRC_CATEGORIES = [
  'Additives Templates', 'Caregivers', 'Employees', 'Facilities', 'Harvests', 'Items',
  'Lab Tests', 'Locations', 'Packages', 'Patient Check-Ins', 'Patients & Status',
  'Plant Batches', 'Plants', 'Processing Jobs', 'Retail ID',
  'Sales (Receipts + Deliveries + Retailer)', 'Sandbox', 'Strains', 'Sublocations',
  'Tags', 'Transfers (Templates + Hub)', 'Transporters (Drivers + Vehicles)',
  'Units of Measure', 'Waste Methods',
];

// ─── BioTrack Endpoint Categories (all 13) ───
const BIOTRACK_CATEGORIES = [
  'Inventory', 'Plants', 'Manifest', 'Lab Results', 'Sales', 'Rooms',
  'Employees', 'Vendors', 'Sync', 'Waste', 'Strains', 'Harvests', 'Dispensing',
];

// ─── How It Works ───
const STEPS = [
  { num: '01', title: 'Sign Up Free', desc: 'Create your BasaltSurge account. No credit card, no contracts, no compliance fees ever.' },
  { num: '02', title: 'Select Your State', desc: 'Choose your state and traceability provider (METRC or BioTrack). We auto-configure everything.' },
  { num: '03', title: 'Enter API Credentials', desc: 'Add your integrator API key (METRC) or username/password (BioTrack). Takes 30 seconds.' },
  { num: '04', title: 'Start Selling Compliant', desc: 'Every sale, transfer, and inventory change auto-syncs with your state system. You\'re compliant from day one.' },
];

// ─── FAQ ───
const FAQS = [
  { q: 'Is this really free? What\'s the catch?', a: 'Yes, truly free. No compliance fees, no API call limits, no per-location charges. BasaltSurge earns through optional crypto payment processing (0.5-1% per transaction). The compliance integration is free for every dispensary — single-location or multi-state MSO.' },
  { q: 'Which states are supported?', a: 'We support all 17 METRC states (AK, CA, CO, DC, LA, MA, MD, ME, MI, MO, MT, NJ, NV, OH, OK, OR, WV) and all 6 BioTrack states (FL, NM, HI, DE, CT, AR). That\'s 23 states total — every state with a major seed-to-sale compliance system.' },
  { q: 'Can I use this without crypto payments?', a: 'Absolutely. The compliance integration works independently of our payment features. You can use BasaltSurge purely as a cannabis compliance POS and never touch crypto. If you later want to accept crypto, it\'s one toggle away.' },
  { q: 'Do I need to switch from my current POS?', a: 'Not necessarily. BasaltSurge can run alongside your existing POS as a compliance layer, or serve as your full POS replacement. We can help you plan a migration that works for your operation.' },
  { q: 'How does the audit reconciliation work?', a: 'Our audit module compares your POS inventory against your METRC/BioTrack inventory in real-time. When discrepancies are found, you can either sync your values to the compliance system or bypass (when the compliance system has the correct count). Every action is logged for your audit trail.' },
  { q: 'Is my data secure?', a: 'Yes. All API credentials are encrypted at rest. Compliance data flows directly between your BasaltSurge instance and the state traceability system. We never store or have access to your METRC/BioTrack login credentials beyond what\'s needed for API calls.' },
];

export default function CannabisLandingClient() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#050805] text-white">

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.05] blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/[0.04] blur-[130px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,_rgba(16,185,129,0.06),transparent)]" />
        </div>

        {/* Top accent */}
        <div className="h-1 w-full" style={{
          background: 'linear-gradient(90deg, #10b981, #34d399, #8b5cf6, #a78bfa, #10b981)',
          backgroundSize: '200% 100%',
          animation: 'gslide 6s linear infinite',
        }} />

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes gslide { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
          @keyframes sscroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        `}} />

        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Industry First — Now Live</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              The First <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-violet-400">Free & Fully Compliant</span>
              <br />Cannabis POS
            </h1>

            <p className="text-xl md:text-2xl text-white/50 mb-8 max-w-2xl leading-relaxed">
              Native METRC v2 and BioTrack integration. <strong className="text-white/70">210+ API endpoints</strong>. 
              Seed-to-sale tracking, audit reconciliation, crypto payments — <strong className="text-emerald-400">zero compliance fees</strong>.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/apply" className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-lg font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-2xl shadow-emerald-500/25 hover:scale-[1.02]">
                Get Started — Free
              </Link>
              <a href="#comparison" className="px-8 py-4 rounded-xl border-2 border-white/15 text-lg font-semibold hover:bg-white/5 transition backdrop-blur-sm">
                See How We Compare
              </a>
            </div>

            {/* Provider badges */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04]">
                <span className="text-xl">🏛️</span>
                <div>
                  <p className="text-sm font-bold text-emerald-400">METRC v2</p>
                  <p className="text-[11px] text-white/35">24 categories · 210+ endpoints</p>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 uppercase">Full</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-violet-500/15 bg-violet-500/[0.04]">
                <span className="text-xl">🧬</span>
                <div>
                  <p className="text-sm font-bold text-violet-400">BioTrack</p>
                  <p className="text-[11px] text-white/35">13 categories · 55+ endpoints</p>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold bg-violet-500/15 text-violet-400 uppercase">All States</span>
              </div>
            </div>

            <p className="mt-6 text-xs text-white/25 italic">
              ⓘ Available exclusively to state-licensed cannabis operators. A valid state cannabis license is required to activate compliance features.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF STATS ═══ */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '$0', label: 'Monthly Compliance Fee', color: 'text-emerald-400' },
              { value: '265+', label: 'API Endpoints Integrated', color: 'text-white' },
              { value: '23', label: 'States Supported', color: 'text-white' },
              { value: '37', label: 'Endpoint Categories', color: 'text-white' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-4xl md:text-5xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-white/30 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATE COVERAGE ═══ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">23 States. Two Platforms. One Integration.</h2>
            <p className="text-white/40 max-w-2xl mx-auto">Whether your state uses METRC or BioTrack, BasaltSurge has you covered with a native, fully-tested integration.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* METRC states */}
            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏛️</span>
                <div>
                  <p className="font-bold text-emerald-400">METRC States</p>
                  <p className="text-xs text-white/30">{METRC_STATES.length} states · 24 categories · 210+ endpoints</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {METRC_STATES.map(s => (
                  <span key={s.code} className="px-3 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10 text-xs font-medium text-emerald-400/80">
                    <span className="font-bold">{s.code}</span> <span className="text-white/25">· {s.name}</span>
                  </span>
                ))}
              </div>
            </div>
            {/* BioTrack states */}
            <div className="rounded-2xl border border-violet-500/10 bg-violet-500/[0.02] p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🧬</span>
                <div>
                  <p className="font-bold text-violet-400">BioTrack States</p>
                  <p className="text-xs text-white/30">{BIOTRACK_STATES.length} states · 13 categories · 55+ endpoints</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {BIOTRACK_STATES.map(s => (
                  <span key={s.code} className="px-3 py-1.5 rounded-lg bg-violet-500/[0.06] border border-violet-500/10 text-xs font-medium text-violet-400/80">
                    <span className="font-bold">{s.code}</span> <span className="text-white/25">· {s.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMPETITOR COMPARISON ═══ */}
      <section id="comparison" className="py-16 md:py-24 bg-white/[0.01] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How We Compare</h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              Other cannabis POS solutions charge <span className="text-white/60 font-medium">$400–$1,500/month</span> per location.
              We believe compliance shouldn&apos;t be a luxury tax on your business.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-3 text-white/40 font-medium text-xs uppercase tracking-wider">Provider</th>
                  <th className="text-center py-4 px-3 text-white/40 font-medium text-xs uppercase tracking-wider">Monthly Cost</th>
                  <th className="text-center py-4 px-3 text-white/40 font-medium text-xs uppercase tracking-wider">Compliance Fee</th>
                  <th className="text-center py-4 px-3 text-white/40 font-medium text-xs uppercase tracking-wider">Contracts</th>
                  <th className="text-center py-4 px-3 text-white/40 font-medium text-xs uppercase tracking-wider">METRC</th>
                  <th className="text-center py-4 px-3 text-white/40 font-medium text-xs uppercase tracking-wider">BioTrack</th>
                  <th className="text-center py-4 px-3 text-white/40 font-medium text-xs uppercase tracking-wider">Crypto Pay</th>
                  <th className="text-center py-4 px-3 text-white/40 font-medium text-xs uppercase tracking-wider">API Endpoints</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c) => (
                  <tr
                    key={c.name}
                    className={`border-b border-white/[0.04] ${
                      c.highlight
                        ? 'bg-emerald-500/[0.04] border-l-2 border-l-emerald-500'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${c.highlight ? 'text-emerald-400' : 'text-white/80'}`}>{c.name}</span>
                        {c.highlight && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">YOU ARE HERE</span>}
                      </div>
                    </td>
                    <td className={`text-center py-4 px-3 font-semibold ${c.highlight ? 'text-emerald-400' : 'text-white/60'}`}>{c.monthly}</td>
                    <td className={`text-center py-4 px-3 ${c.highlight ? 'text-emerald-400 font-bold' : 'text-white/50'}`}>{c.compliance}</td>
                    <td className={`text-center py-4 px-3 ${c.highlight ? 'text-emerald-400' : 'text-white/50'}`}>{c.contracts}</td>
                    <td className="text-center py-4 px-3">{c.metrc ? <span className="text-emerald-400">✓</span> : <span className="text-white/20">—</span>}</td>
                    <td className="text-center py-4 px-3">{c.biotrack ? <span className="text-emerald-400">✓</span> : <span className="text-white/20">—</span>}</td>
                    <td className="text-center py-4 px-3">{c.crypto ? <span className="text-emerald-400">✓</span> : <span className="text-white/20">—</span>}</td>
                    <td className={`text-center py-4 px-3 ${c.highlight ? 'text-emerald-400 font-bold' : 'text-white/40'}`}>{c.endpoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Annual savings callout */}
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-emerald-500/[0.06] via-emerald-500/[0.03] to-violet-500/[0.06] border border-emerald-500/15 p-8 text-center">
            <p className="text-4xl md:text-5xl font-black text-emerald-400 mb-2">$6,000–$18,000</p>
            <p className="text-white/50">saved per location per year compared to leading competitors</p>
            <p className="text-xs text-white/25 mt-1">Based on published pricing from Dutchie, Flowhub, and Treez</p>
          </div>
        </div>
      </section>

      {/* ═══ THE OLD WAY vs BASALTSURGE ═══ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Compliance Was Never Meant to Cost This Much</h2>
            <p className="text-white/40 max-w-2xl mx-auto">The cannabis industry pays more for compliance tools than any other retail sector. We&apos;re changing that.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.02] p-8">
              <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-3">
                <span className="text-3xl">❌</span> The Industry Standard
              </h3>
              <ul className="space-y-4">
                {[
                  '$400–$1,500/month per location',
                  '12–36 month contracts with auto-renewal',
                  '5% annual price increases baked in',
                  '$10,000–$50,000 implementation fees',
                  'Compliance is an "add-on" — not included',
                  'Crypto payments? What\'s that?',
                  'Locked into one traceability provider',
                  'API access limited or behind paywalls',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                    <span className="text-white/50">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* The BasaltSurge Way */}
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.02] p-8">
              <h3 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-3">
                <span className="text-3xl">✓</span> The BasaltSurge Way
              </h3>
              <ul className="space-y-4">
                {[
                  'Free. No monthly fees. No per-location charges.',
                  'No contracts. No commitments. Leave anytime.',
                  'Price will never increase — it\'s free.',
                  'Zero implementation costs — self-service setup',
                  'METRC + BioTrack compliance built-in from day one',
                  'Native crypto payments (USDC, USDT, ETH)',
                  'Both METRC and BioTrack in one platform',
                  '265+ API endpoints — fully open integration',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    <span className="text-white/60">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-16 md:py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything You Need. Nothing You Don&apos;t.</h2>
            <p className="text-white/40 max-w-2xl mx-auto">12 core modules covering every aspect of cannabis compliance, inventory, payments, and analytics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                onClick={() => setExpandedFeature(expandedFeature === i ? null : i)}
                className={`rounded-xl border p-5 cursor-pointer transition-all duration-300 ${
                  expandedFeature === i
                    ? 'border-emerald-500/20 bg-emerald-500/[0.04] shadow-lg shadow-emerald-500/5'
                    : 'border-white/[0.06] bg-white/[0.015] hover:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <svg className={`w-4 h-4 text-white/20 transition-transform ${expandedFeature === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                {expandedFeature === i && (
                  <ul className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
                    {f.details.map(d => (
                      <li key={d} className="flex items-center gap-2 text-xs text-emerald-400/70">
                        <span className="w-1 h-1 rounded-full bg-emerald-500/50 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ENDPOINT COVERAGE ═══ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Complete API Coverage</h2>
            <p className="text-white/40 max-w-2xl mx-auto">Every single endpoint from the official METRC v2 and BioTrack APIs — verified against documentation.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] p-6">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">METRC v2 — 24 Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {METRC_CATEGORIES.map(c => (
                  <span key={c} className="px-2.5 py-1 rounded-md bg-emerald-500/[0.06] border border-emerald-500/[0.08] text-[10px] text-emerald-400/70 font-medium">{c}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-violet-500/10 bg-violet-500/[0.02] p-6">
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-4">BioTrack — 13 Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {BIOTRACK_CATEGORIES.map(c => (
                  <span key={c} className="px-2.5 py-1 rounded-md bg-violet-500/[0.06] border border-violet-500/[0.08] text-[10px] text-violet-400/70 font-medium">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HARDWARE ═══ */}
      <section className="py-16 md:py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-emerald-500/[0.04] blur-3xl" />
                <img
                  src="/handheld.png"
                  alt="BasaltSurge Handheld POS Terminal"
                  className="relative w-full max-w-md md:max-w-lg drop-shadow-2xl rounded-2xl"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Purpose-Built <span className="text-emerald-400">Hardware</span>
              </h2>
              <p className="text-white/40 mb-8 max-w-lg leading-relaxed">
                Run your dispensary on hardware designed for cannabis retail. Handheld terminals for budtenders on the floor, 
                kiosks for self-service check-in, and inventory displays for your back-of-house — all running the BasaltSurge compliance stack.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Terminal / Handheld', price: '$245', icon: '📱', tag: 'Popular', desc: 'Android smart POS with dual screens, NFC, and receipt printer' },
                  { name: 'Inventory Room Display 22″', price: '$375', icon: '🖥️', tag: null, desc: 'Wall-mount display for real-time inventory & compliance status' },
                  { name: 'Self-Service Kiosk 22″', price: '$650', icon: '🏪', tag: null, desc: 'Customer-facing check-in and menu kiosk with touchscreen' },
                  { name: 'Dual-Screen Desktop POS', price: 'Coming Soon', icon: '🖥️', tag: 'Soon', desc: 'Full desktop POS with merchant and customer displays' },
                ].map(hw => (
                  <div key={hw.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-emerald-500/15 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xl">{hw.icon}</span>
                      {hw.tag && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          hw.tag === 'Popular' 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : 'bg-violet-500/15 text-violet-400'
                        }`}>{hw.tag}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{hw.name}</h3>
                    <p className="text-[11px] text-white/30 mb-3 leading-relaxed">{hw.desc}</p>
                    <p className={`text-lg font-black ${hw.price === 'Coming Soon' ? 'text-violet-400' : 'text-emerald-400'}`}>
                      {hw.price}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs text-white/20">
                All devices ship pre-configured with BasaltSurge. Plug in, connect to Wi-Fi, and start selling. Additional peripherals (barcode scanners, cash drawers, label printers) available upon request.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Up and Running in 5 Minutes</h2>
            <p className="text-white/40 max-w-2xl mx-auto">No implementation team. No onboarding calls. No 6-week rollout.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-6">
                <div className="text-3xl font-black text-emerald-500/20 mb-3">{s.num}</div>
                <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-200 ${
                  expandedFaq === i
                    ? 'border-emerald-500/15 bg-emerald-500/[0.02]'
                    : 'border-white/[0.06] bg-white/[0.01] hover:border-white/10'
                }`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-white/80 pr-4">{faq.q}</span>
                  <svg className={`w-4 h-4 text-white/30 shrink-0 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-white/40 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA + CONTACT FORM ═══ */}
      <section className="py-16 md:py-24 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto px-6">
          {/* CTA */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Ready to Stop Paying<br />for Compliance?
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto mb-8">
              Join the first dispensaries running on a free, fully compliant cannabis POS with native crypto payments.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/apply" className="px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-lg font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-2xl shadow-emerald-500/25 hover:scale-[1.02]">
                Get Started — Free
              </Link>
              <a href="#cannabis-contact" className="px-10 py-4 rounded-xl border-2 border-white/15 text-lg font-semibold hover:bg-white/5 transition">
                Talk to Us About Migration
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <ContactFormSection id="cannabis-contact" />
        </div>
      </section>

    </div>
  );
}
