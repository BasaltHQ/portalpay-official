import { IndustryLandingData } from '../types';

export const butcherShops: IndustryLandingData = {
  // Basics
  slug: 'butcher-shops',
  name: 'Butcher Shops',
  icon: '🥩',

  // SEO
  title:
    'Crypto Payments for Butcher Shops – QR Checkout, Cut Presets, Cold-Chain Tags, Split Payouts',
  metaDescription:
    'Speed up counter service with QR checkout and cut presets, tag cold-chain items, auto-split commissions, and reconcile offline. Built for neighborhood butcheries and meat counters.',
  keywords: [
    'butcher payments',
    'QR checkout',
    'meat cuts',
    'cold chain',
    'commission split',
    'offline tally',
    'weight-based pricing',
    'deli counter',
    'neighborhood butchery',
  ],

  // Hero Section
  heroHeadline: 'Fast QR Checkout and Commission Splits for Butcheries',
  heroSubheadline:
    'Sell cuts and deli items at the counter with QR receipts, track cold-chain orders, and pay staff commissions automatically—no POS rental required.',
  heroCTA: {
    primary: 'Enable QR Counter Checkout',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Long queues and cash handling at peak hours',
    'Weight-based pricing and cut variations slow checkout',
    'Cold-chain items need tagging and proof for audits',
    'Commission payouts cause end-of-day disputes',
    'Connectivity drops delay settlements and reconciliation',
  ],
  solutions: [
    'QR checkout with presets for common cuts and weights',
    'Quick tags for cold-chain, halal/kosher, and special orders',
    'Automatic split payouts for owner and counter staff',
    'Offline tally mode with later reconciliation when signal returns',
    'Unified ledger and exports for audits and food safety programs',
  ],

  // Benefits
  benefits: [
    {
      icon: '⚡',
      title: 'Faster Counter',
      description:
        'Preset amounts for popular cuts reduce queue times and errors.',
      stat: 'Serve 20–30% more customers at peak',
    },
    {
      icon: '🏷️',
      title: 'Better Tagging',
      description:
        'Cold-chain and dietary tags travel with the receipt for easy audit.',
    },
    {
      icon: '🤝',
      title: 'Fair Commissions',
      description:
        'Split payouts route automatically to staff—no cash counting.',
    },
    {
      icon: '🧾',
      title: 'Clean Records',
      description:
        'Exports support food safety checks and supplier reconciliations.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 3000,
  competitorComparison: {
    'POS/Card Terminal': {
      processingFee: 2.5,
      flatFee: 0.1,
      monthlyFee: 25,
      annualSoftwareCost: 120,
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
      title: 'Cut Presets',
      description:
        'Preset QR amounts for common cuts (sirloin, ribeye, mince) by 250g/500g.',
      example:
        'Counter selects 500g ribeye preset; customer pays instantly via QR.',
      savings: 'Reduces queue time and pricing errors',
    },
    {
      title: 'Cold-Chain Tagging',
      description:
        'Attach cold-chain tags and dietary notes (halal/kosher) to receipts.',
      example:
        'Audit export shows cold-chain items with timestamp and staff initials.',
    },
    {
      title: 'Commission Splits',
      description:
        'Auto-route a percentage to counter staff per sale.',
      example:
        '70/30 owner/staff split configured; payouts happen daily without disputes.',
    },
    {
      title: 'Offline Peak Periods',
      description:
        'Record cash and pending payments offline; reconcile when network stabilizes.',
      example:
        'Evening sync merges offline tallies with crypto receipts cleanly.',
    },
  ],

  // Features
  industryFeatures: [
    'QR checkout for counter sales',
    'Cut and weight presets',
    'Cold-chain and dietary tags',
    'Automatic commission split payouts',
    'Offline tally and reconciliation',
    'Cash + crypto unified ledger',
    'Exports for audits and supplier reconciliation',
  ],
  includedFeatures: [
    {
      name: 'QR Code Generator',
      description:
        'Create scannable codes for common cuts and weight presets.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Route agreed percentages to owner and counter staff wallets.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Tagging',
      description:
        'Attach cold-chain, halal/kosher, and special-order notes.',
    },
    {
      name: 'Offline Tally',
      description:
        'Record sales without connectivity and reconcile later.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect owner and staff wallets',
    'Enable QR checkout and set cut/weight presets',
    'Configure commission split rules',
    'Tag cold-chain and dietary items at the counter',
    'Export records for audits and supplier reconciliation',
  ],

  // FAQ
  faqs: [
    {
      question: 'Can we mix cash and crypto?',
      answer:
        'Yes. Record cash sales in the unified ledger and reconcile with crypto receipts.',
      category: 'Operations',
    },
    {
      question: 'How do commissions work?',
      answer:
        'Set percentages or fixed amounts; payouts route automatically per sale.',
      category: 'Payouts',
    },
    {
      question: 'Can we handle weight-based pricing?',
      answer:
        'Use presets for common weights and add notes for exact-scale adjustments.',
      category: 'Pricing',
    },
    {
      question: 'What if connectivity drops?',
      answer:
        'Use offline tally mode and reconcile when the network returns.',
      category: 'Connectivity',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Queue times dropped. Staff commissions pay themselves—no end-of-day arguments.',
      author: 'Lerato',
      business: 'Neighborhood Butchery – Johannesburg',
      savings: 'Queues down ~25%',
    },
    {
      quote:
        'Cold-chain tags and exports make audits easy. Suppliers love the clean receipts.',
      author: 'Miguel',
      business: 'Carnicería Central – Lima',
    },
  ],

  // Related
  relatedIndustries: [
    'restaurants',
    'retail',
    'hardware-shops',
    'market-stall-vendors',
  ],
  relatedUseCases: [
    'qr-checkout',
    'split-payouts',
    'offline-tally',
    'cold-chain-tagging',
  ],
};
