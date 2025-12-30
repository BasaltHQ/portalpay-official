import { IndustryLandingData } from '../types';

export const smallholderFarmers: IndustryLandingData = {
  // Basics
  slug: 'smallholder-farmers',
  name: 'Smallholder Farmers',
  icon: '🌾',

  // SEO
  title:
    'Crypto Payments for Smallholder Farmers – Farmgate QR, Co-op Splits, Input Vouchers',
  metaDescription:
    'Accept farmgate payments via QR, auto-split payouts between growers and co-ops, issue input vouchers for seeds and fertilizer, and reconcile offline in rural areas. Built for smallholder agriculture across Africa, South Asia, and Latin America.',
  keywords: [
    'smallholder payments',
    'farmgate QR',
    'co-op splits',
    'input vouchers',
    'fertilizer',
    'seed credits',
    'offline tally',
    'rural connectivity',
    'agriculture',
    'Africa',
    'South Asia',
    'Latin America',
  ],

  // Hero Section
  heroHeadline: 'Farmgate QR and Crypto Payouts for Smallholder Agriculture',
  heroSubheadline:
    'Sell produce with QR receipts, pay growers and co-ops instantly, and issue seed/fertilizer vouchers—works even with limited connectivity.',
  heroCTA: {
    primary: 'Issue Farmgate QR',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Cash-based farmgate purchases cause leakage and delayed payments',
    'Manual co-op/grower splits lead to disputes',
    'Seed and fertilizer subsidies are hard to track',
    'Connectivity is unreliable in rural areas',
    'Audit/reporting requirements from NGOs or buyers are burdensome',
  ],
  solutions: [
    'QR receipts tagged by crop, grade, and weight',
    'Automatic split payouts to grower and co-op per sale',
    'Input vouchers for seeds/fertilizer redeemable at partner shops',
    'Offline tally with reconciliation when signal returns',
    'Exports for NGO programs, buyer audits, and certifications',
  ],

  // Benefits
  benefits: [
    {
      icon: '🔍',
      title: 'Transparent Farmgate',
      description:
        'QR receipts and tagged lots reduce leakage and speed settlements.',
      stat: 'Cut reconciliation time by 40–60%',
    },
    {
      icon: '🤝',
      title: 'Fair Co-op Splits',
      description:
        'Grower and co-op shares settle automatically—fewer disputes.',
    },
    {
      icon: '🌱',
      title: 'Input Vouchers',
      description:
        'Issue vouchers redeemable for seeds, fertilizer, or tools to improve yields.',
    },
    {
      icon: '📡',
      title: 'Offline Ready',
      description:
        'Record transactions offline in the field; reconcile later without data loss.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 2500,
  competitorComparison: {
    'Cash + Manual': {
      processingFee: 0,
      flatFee: 0,
      monthlyFee: 0,
      annualSoftwareCost: 0,
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
      title: 'QR Farmgate Receipts',
      description:
        'Tag buys by crop, grade, and weight; generate instant QR receipts.',
      example:
        'Maize Grade A 80kg recorded at farmgate; grower paid instantly.',
      savings: 'Reduces leakage and delays',
    },
    {
      title: 'Grower/Co-op Splits',
      description:
        'Route percentages automatically—e.g., 85% grower, 15% co-op.',
      example:
        'Co-op dues and services covered transparently with split payouts.',
    },
    {
      title: 'Input Vouchers',
      description:
        'Issue crypto-backed vouchers redeemable at partner agro-dealers.',
      example:
        'Seed/fertilizer vouchers reduce cash handling and improve yields.',
    },
    {
      title: 'Offline Field Buys',
      description:
        'Record purchases offline in remote areas; reconcile in the evening.',
      example:
        'Field agent tallies offline; nightly sync produces audit-ready exports.',
    },
  ],

  // Features
  industryFeatures: [
    'QR receipts for crop buys',
    'Automatic grower/co-op split payouts',
    'Input vouchers (seed, fertilizer, tools)',
    'Offline tally and reconciliation',
    'Cash + crypto unified ledger',
    'Exports for audits and certifications',
    'Mobile-first interface for field agents',
  ],
  includedFeatures: [
    {
      name: 'QR Receipt Generator',
      description: 'Create scannable receipts tagged by crop, grade, and weight.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Distribute funds to grower and co-op wallets automatically per purchase.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Voucher Issuance',
      description:
        'Issue and track input vouchers that can be redeemed at partner shops.',
    },
    {
      name: 'Offline Tally',
      description:
        'Record buys without connectivity and reconcile later.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect grower and co-op wallets',
    'Define split rules and voucher catalogs',
    'Tag crop/grade/weight presets for field agents',
    'Start recording farmgate purchases with QR receipts',
    'Export records for buyers or NGO partners',
  ],

  // FAQ
  faqs: [
    {
      question: 'Can we mix cash and crypto?',
      answer:
        'Yes. Use the unified ledger to record both crypto and cash farmgate buys.',
      category: 'Operations',
    },
    {
      question: 'How flexible are split rules?',
      answer:
        'Set percentages or fixed amounts for grower/co-op—adjust per season if needed.',
      category: 'Payouts',
    },
    {
      question: 'How do vouchers work?',
      answer:
        'Issue vouchers tagged to growers; partner shops redeem and receive payouts automatically.',
      category: 'Vouchers',
    },
    {
      question: 'What about remote areas with no signal?',
      answer:
        'Use offline tally mode; data syncs and reconciles when connectivity returns.',
      category: 'Connectivity',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Farmgate QR ended delays. Growers receive shares instantly; co-op dues happen automatically.',
      author: 'Nafula',
      business: 'Maize Co-op – Western Kenya',
      savings: 'Cut reconciliation time by half',
    },
    {
      quote:
        'Seed vouchers and split payouts boosted yields and reduced cash handling risk.',
      author: 'Sanjay',
      business: 'Village Agro Program – Bihar',
    },
  ],

  // Related
  relatedIndustries: [
    'market-stall-vendors',
    'fisherfolk-cooperatives',
    'kirana-stores',
    'community-tailors',
  ],
  relatedUseCases: ['qr-checkout', 'split-payouts', 'offline-tally', 'voucher-issuance'],
};
