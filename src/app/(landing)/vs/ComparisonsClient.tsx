'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAllComparisons } from '@/lib/landing-pages/comparisons';
import LogoTile from '@/components/landing/LogoTile';
import { useBrand } from '@/contexts/BrandContext';

export default function ComparisonsClient() {
  const brand = useBrand();
  const [pageStatuses, setPageStatuses] = useState<Record<string, { enabled: boolean }>>({});

  // Load SEO page statuses to filter enabled pages only
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/seo-pages', { cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.ok && data?.settings?.pageStatuses) {
          setPageStatuses(data.settings.pageStatuses as Record<string, { enabled: boolean }>);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const all = useMemo(() => getAllComparisons(), []);
  const comps = useMemo(() => all.filter(c => (pageStatuses[`comparison-${c.slug}`]?.enabled ?? true)), [all, pageStatuses]);

  // Group comparisons by category (same groupings as server page)
  const majorCompetitors = useMemo(() => comps.filter(c => ['stripe', 'square', 'paypal', 'toast', 'coinbase-commerce'].includes(c.slug)), [comps]);
  const globalProcessors = useMemo(() => comps.filter(c => ['adyen', 'worldpay', 'checkout-com'].includes(c.slug)), [comps]);
  const regionalEmerging = useMemo(() => comps.filter(c => ['razorpay', 'paystack', 'flutterwave', 'mercado-pago', 'mpesa'].includes(c.slug)), [comps]);
  const cryptoFocused = useMemo(() => comps.filter(c => ['bitpay', 'flexa', 'opennode'].includes(c.slug)), [comps]);
  const highRiskCannabis = useMemo(() => comps.filter(c => ['dutchie', 'aeropay', 'hypur', 'paymentcloud', 'paykings', 'durango-merchant-services', 'canpay'].includes(c.slug)), [comps]);
  const merchantServices = useMemo(() => comps.filter(c => ['clover-fiserv', 'global-payments', 'elavon', 'authorize-net', 'wepay', 'stax', 'helcim', 'braintree', 'shopify-payments', 'rapyd', 'bluesnap', 'nmi', 'nuvei', 'paysafe', 'cybersource', '2checkout', 'moneris', 'evo-payments'].includes(c.slug)), [comps]);
  const posPlatforms = useMemo(() => comps.filter(c => ['lightspeed', 'touchbistro', 'cova-pos', 'flowhub', 'treez'].includes(c.slug)), [comps]);
  const ecommercePlatforms = useMemo(() => comps.filter(c => ['woocommerce'].includes(c.slug)), [comps]);

  const Section = ({ title, items }: { title: string; items: typeof comps }) => (
    items.length === 0 ? null : (
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((comparison) => (
            <Link
              key={comparison.slug}
              href={`/vs/${comparison.slug}`}
              className="glass-pane rounded-xl border p-6 hover:border-[var(--primary)] transition-colors"
            >
              <div className="mb-3 flex justify-center">
                <LogoTile slug={comparison.slug} alt={`${comparison.name} logo`} size="md" />
              </div>
              <h3 className="text-xl font-semibold mb-2">vs {comparison.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {comparison.subheadline}
              </p>
              <div className="flex items-center text-[var(--primary)] text-sm font-medium">
                Compare now →
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Compare {brand.name} vs Competitors
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
            See how {brand.name} stacks up against major payment processors. Lower fees, instant settlement, 
            and enterprise features included free.
          </p>
          
          <div className="glass-pane rounded-xl border p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-[var(--primary)] mb-1">70-85%</div>
                <div className="text-sm text-muted-foreground">Lower Fees</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[var(--primary)] mb-1">Instant</div>
                <div className="text-sm text-muted-foreground">Settlement</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[var(--primary)] mb-1">$0</div>
                <div className="text-sm text-muted-foreground">Monthly Fees</div>
              </div>
            </div>
          </div>
        </section>

        <Section title="Major Competitors" items={majorCompetitors} />
        <Section title="Global Payment Processors" items={globalProcessors} />
        <Section title="Regional & Emerging Markets" items={regionalEmerging} />
        <Section title="Crypto-Focused Processors" items={cryptoFocused} />
        <Section title="Cannabis & High-Risk Payments" items={highRiskCannabis} />
        <Section title="Merchant Services & Gateways" items={merchantServices} />
        <Section title="POS Platforms" items={posPlatforms} />
        <Section title="E-commerce Platforms" items={ecommercePlatforms} />

        {/* CTA Section */}
        <section className="glass-pane rounded-2xl border p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Save on Payment Processing?
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of businesses that switched to {brand.name} for lower fees, 
            instant settlement, and better features.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/admin"
              className="px-8 py-4 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-lg font-semibold hover:opacity-90 transition"
            >
              Get Started Free
            </Link>
            <Link
              href="/terminal"
              className="px-8 py-4 rounded-md border text-lg font-semibold hover:bg-accent transition"
            >
              View Pricing
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
