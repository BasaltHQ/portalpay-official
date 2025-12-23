import { IndustryLandingData } from '../types';

export const wastePickers: IndustryLandingData = {
  // Basics
  slug: 'waste-pickers',
  name: 'Waste Pickers',
  icon: '♻️',

  // SEO
  title:
    'Crypto Payments for Waste Pickers – QR Weigh Tickets, Depot Splits, Safety Gear Funds',
  metaDescription:
    'Run transparent buybacks for recyclables with QR weigh tickets, auto-split payouts to depots and collectors, reserve funds for safety gear, and reconcile offline. Built for informal recycling networks in developing cities.',
  keywords: [
    'waste picker payments',
    'recyclables buyback',
    'QR weigh ticket',
    'per-kg pricing',
    'depot split',
    'safety gear fund',
    'offline tally',
    'informal recycling',
    'urban sustainability',
  ],

  // Hero Section
  heroHeadline: 'QR Weigh Tickets and Crypto Payouts for Informal Recyclers',
  heroSubheadline:
    'Tag buys by material and weight, pay collectors instantly, reserve funds for safety gear, and export audit-ready records—works even with low connectivity.',
  heroCTA: {
    primary: 'Issue QR Weigh Tickets',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Cash-based buybacks invite leakage and delayed settlements',
    'Manual depot/collector splits cause disputes',
    'Safety gear budgets and training funds are inconsistently set aside',
    'Connectivity is unreliable near dumpsites and transfer stations',
    'Audit/reporting for NGOs or municipalities is burdensome',
  ],
  solutions: [
    'QR weigh tickets tagged by material (PET, HDPE, paper, metal) and weight',
    'Automatic split payouts to depots and collectors per buyback',
    'Reserve allocations for safety gear (gloves, masks) and training',
    'Offline tally mode with later reconciliation when signal returns',
    'Exports for co-op boards, NGO partners, and city programs',
  ],

  // Benefits
  benefits: [
    {
      icon: '🔍',
      title: 'Transparent Buybacks',
      description:
        'Tagged weigh tickets reduce leakage and speed settlements.',
      stat: 'Cut reconciliation time by 40–60%',
    },
    {
      icon: '🤝',
      title: 'Fair Splits',
      description:
        'Depot and collector shares settle automatically—fewer disputes.',
    },
    {
      icon: '🛡️',
      title: 'Safety Gear Funds',
      description:
        'Auto-reserve budgets for gear and training per transaction.',
    },
    {
      icon: '📡',
      title: 'Offline Ready',
      description:
        'Record transactions offline at yards; reconcile later without data loss.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 1800,
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
    'PortalPay (Crypto)': {
      processingFee: 0.5,
      flatFee: 0,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
  },

  // Use Cases
  useCases: [
    {
      title: 'QR Weigh Tickets',
      description:
        'Create QR labels per buy with material and weight; collectors scan to get paid.',
      example:
        'PET 35kg buyback logged via QR at the depot; instant receipt issued.',
      savings: 'Eliminates cash handling delays',
    },
    {
      title: 'Depot/Collector Splits',
      description:
        'Autopay splits (e.g., 85% collector, 10% depot, 5% safety fund).',
      example:
        'Funds route per buy; disputes drop as splits are enforced automatically.',
    },
    {
      title: 'Safety Gear & Training Reserves',
      description:
        'Allocate a fixed percentage to gear and training wallets.',
      example:
        '5% reserve funds masks and gloves purchases monthly via export.',
    },
    {
      title: 'Offline Yard Operations',
      description:
        'Record buybacks offline; sync when connectivity returns.',
      example:
        'Transfer station tallies offline; evening sync exports summaries.',
    },
  ],

  // Features
  industryFeatures: [
    'QR weigh tickets per buyback',
    'Automatic depot/collector split payouts',
    'Reserve allocations for safety gear and training',
    'Offline tally and reconciliation',
    'Cash + crypto unified ledger',
    'Exports for audits and municipal programs',
    'Mobile-first interface for depots and field agents',
  ],
  includedFeatures: [
    {
      name: 'Weigh Ticket Generator',
      description: 'Create scannable tickets tagged by material and weight.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Distribute funds to depot and collector wallets automatically per buy.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Reserve Allocations',
      description:
        'Dedicate percentages to safety gear or training reserves.',
    },
    {
      name: 'Offline Tally',
      description:
        'Record buybacks without connectivity and reconcile later.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect depot and collector wallets',
    'Define split rules and safety/training reserves',
    'Tag materials and common per-kg price presets',
    'Start recording buybacks with QR weigh tickets',
    'Export records for co-op or municipal programs',
  ],

  // FAQ
  faqs: [
    {
      question: 'Can we mix cash and crypto buyers?',
      answer:
        'Yes. Use the unified ledger to record both; crypto settles instantly, cash tallies reconcile later.',
      category: 'Operations',
    },
    {
      question: 'How flexible are split rules?',
      answer:
        'Set percentages or fixed amounts for depot, collector, and reserve wallets.',
      category: 'Payouts',
    },
    {
      question: 'How are reserves tracked?',
      answer:
        'Reserve tags show gear/training totals in exports; wallets receive allocations per transaction.',
      category: 'Reserves',
    },
    {
      question: 'What about remote yards with no signal?',
      answer:
        'Use offline tally. Data syncs and reconciles when connectivity returns.',
      category: 'Connectivity',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Weigh tickets and instant shares ended cash disputes. Gear funds set aside automatically.',
      author: 'Rosa',
      business: 'Urban Recycling Co-op – Lima',
      savings: 'Reduced disputes and saved ~2% leakage',
    },
    {
      quote:
        'QR buybacks sped payments and improved NGO reporting. Safety reserves are now consistent.',
      author: 'James',
      business: 'Depot Network – Kampala',
    },
  ],

  // Related
  relatedIndustries: [
    'market-stall-vendors',
    'smallholder-farmers',
    'fisherfolk-cooperatives',
    'hardware-shops',
  ],
  relatedUseCases: [
    'qr-checkout',
    'split-payouts',
    'fee-allocations',
    'offline-tally',
    'weigh-tickets',
  ],
};
