import { IndustryLandingData } from '../types';

export const waterKioskOperators: IndustryLandingData = {
  // Basics
  slug: 'water-kiosk-operators',
  name: 'Water Kiosk Operators',
  icon: '🚰',

  // SEO
  title: 'Crypto Payments for Water Kiosk Operators – Prepaid QR, Per-Liter Pricing, Split Payouts',
  metaDescription:
    'Run community water points with prepaid QR tokens, per-liter pricing, offline tally, and transparent split payouts. Built for peri-urban and rural kiosks across Africa and South Asia.',
  keywords: [
    'water kiosk payments',
    'prepaid QR tokens',
    'per-liter pricing',
    'crypto payments',
    'offline tally',
    'community water',
    'Africa',
    'South Asia',
    'daily settlement',
    'split payouts',
  ],

  // Hero Section
  heroHeadline: 'Prepaid QR and Crypto Checkout for Community Water Points',
  heroSubheadline:
    'Sell water by jerrycan or liter with QR tokens—reduce cash leakage and reconcile transparently, even with low connectivity.',
  heroCTA: {
    primary: 'Issue Prepaid Tokens',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Cash leakage and manual reconciliation at busy kiosks',
    'Token fraud and informal credit not tracked',
    'Unreliable connectivity during peak hours',
    'Difficulty tracking subsidies and social tariffs',
    'Complex revenue sharing for owners, operators, and maintenance funds',
  ],
  solutions: [
    'Prepaid QR tokens that represent fixed volumes (e.g., 20L jerrycan)',
    'Per-liter pricing with quick presets for common containers',
    'Transparent split payouts to owner and maintenance fund',
    'Offline tally mode with later reconciliation when signal returns',
    'Simple exports for NGO audits, co-op records, or municipal reporting',
  ],

  // Benefits
  benefits: [
    {
      icon: '⚡',
      title: 'Faster Service',
      description:
        'Scan prepaid QR tokens or use preset volumes—reduce queues and speed water dispensing.',
      stat: 'Serve 20–40% more households per day',
    },
    {
      icon: '🔍',
      title: 'Transparent Records',
      description:
        'Unified ledger for prepaid tokens, cash, and crypto—trace subsidies and splits clearly.',
    },
    {
      icon: '💸',
      title: 'Lower Costs',
      description:
        'Avoid heavy POS fees and reduce cash handling losses with direct crypto acceptance.',
      stat: 'Save 1–3% vs. typical card/POS systems',
    },
    {
      icon: '🤝',
      title: 'Accountable Splits',
      description:
        'Automatically route funds to operator stipends and maintenance reserves per transaction.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 1800,
  competitorComparison: {
    'POS/Card Terminal': {
      processingFee: 2.5,
      flatFee: 0.1,
      monthlyFee: 20,
      annualSoftwareCost: 120,
    },
    'Mobile Money': {
      processingFee: 1.0,
      flatFee: 0.03,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
    'BasaltSurge (Crypto)': {
      processingFee: 0.5,
      flatFee: 0,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
  },

  // Use Cases
  useCases: [
    {
      title: 'Prepaid Tokens for 20L Jerrycans',
      description:
        'Issue QR tokens worth 20 liters—households scan and redeem, reducing cash handling.',
      example: 'Kiosk in Kibera uses QR tokens to serve 20L units with quick scanning.',
      savings: 'Cuts cash leakage by ~25%',
    },
    {
      title: 'Subsidy Tracking',
      description:
        'Tag transactions as social tariff or NGO-funded; export reports for audits.',
      example:
        'Municipal pilot distinguishes full-price vs. subsidized liters in CSV exports.',
    },
    {
      title: 'Owner/Operator/Maintenance Splits',
      description:
        'Configure splits (e.g., 70% owner, 20% operator, 10% maintenance) per sale.',
      example:
        'Co-op kiosk routes funds automatically—operator stipends paid fairly without cash.',
    },
    {
      title: 'Offline Market Days',
      description:
        'Record tallies when signal is low; reconcile when network improves in the evening.',
      example:
        'Peak demand hours handled offline; ledger reconciled after connectivity returns.',
    },
  ],

  // Features
  industryFeatures: [
    'Prepaid QR tokens for fixed volumes',
    'Per-liter and per-container pricing presets',
    'Cash + crypto unified ledger',
    'Split payouts to operator and maintenance reserve',
    'Offline tally and reconciliation',
    'Exports for NGO/co-op/municipal reporting',
    'Mobile-first interface',
  ],
  includedFeatures: [
    {
      name: 'QR Token Generator',
      description: 'Create prepaid tokens for common volumes like 10L and 20L.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Route a percentage to owners, operators, and maintenance funds automatically.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Offline Tally',
      description: 'Record sales without connectivity and reconcile later.',
    },
    {
      name: 'Audit Exports',
      description:
        'CSV exports of prepaid, redeemed, and split payouts for transparent reporting.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect a wallet',
    'Set per-liter prices and common container presets',
    'Issue prepaid QR tokens to households',
    'Configure owner/operator/maintenance splits',
    'Start dispensing and track redemptions',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do households need bank accounts?',
      answer:
        'No. Prepaid QR tokens can be issued and redeemed without bank accounts.',
      category: 'Access',
    },
    {
      question: 'How are subsidies tracked?',
      answer:
        'Mark transactions with subsidy tags. Reports show subsidized vs. full-price volumes.',
      category: 'Compliance',
    },
    {
      question: 'What if connectivity is unreliable?',
      answer:
        'Use offline tally mode to record redemptions and reconcile later.',
      category: 'Operations',
    },
    {
      question: 'Can we route funds to maintenance automatically?',
      answer:
        'Yes. Configure split rules to send a percentage to a maintenance reserve on each sale.',
      category: 'Payouts',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Prepaid QR reduced cash leakage and made subsidy reporting straightforward.',
      author: 'Grace',
      business: 'Community Water Point – Kisumu',
      savings: 'Recovered ~25% previously untracked cash',
    },
    {
      quote:
        'Operator stipends and maintenance funds are paid automatically—no more disputes.',
      author: 'Joseph',
      business: 'Co-op Kiosk – Mathare',
    },
  ],

  // Related
  relatedIndustries: [
    'market-stall-vendors',
    'street-food-vendors',
    'boda-boda-operators',
    'retail',
  ],
  relatedUseCases: ['qr-checkout', 'prepaid-tokens', 'split-payouts', 'offline-tally'],
};
