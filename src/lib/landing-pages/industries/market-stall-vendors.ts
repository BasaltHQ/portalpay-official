import { IndustryLandingData } from '../types';

export const marketStallVendors: IndustryLandingData = {
  // Basics
  slug: 'market-stall-vendors',
  name: 'Market Stall Vendors',
  icon: '🧺',

  // SEO
  title: 'Crypto Payments for Market Stall Vendors – Fast QR Checkout, Offline Tally, Daily Payouts',
  metaDescription:
    'Accept crypto payments at market stalls with QR checkout, offline tally support, and instant split payouts. Designed for informal retail in open-air markets across Africa, South Asia, and Latin America.',
  keywords: [
    'market stall payments',
    'QR checkout',
    'crypto payments',
    'offline tally',
    'street market',
    'informal retail',
    'Africa',
    'South Asia',
    'Latin America',
    'daily payouts',
  ],

  // Hero Section
  heroHeadline: 'Tap-to-Pay and QR Crypto Checkout for Market Stalls',
  heroSubheadline:
    'Collect payments in seconds with QR codes—no POS rental, no bank hassles. Track cash and crypto together with simple daily tallies.',
  heroCTA: {
    primary: 'Start QR Checkout',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Long lines during peak hours with manual cash handling',
    'POS rental and bank setup is costly or unavailable',
    'End-of-day reconciliations are error-prone',
    'Shared stall owners need split payouts without paperwork',
    'Unreliable connectivity during busy market days',
  ],
  solutions: [
    'QR checkout that works online or with quick offline tally entry',
    'Instant crypto settlements to your wallet—no bank required',
    'Auto split payouts for partners, helpers, or owners',
    'Unified ledger for cash and crypto in one simple view',
    'Lightweight mobile-first UI for feature phones and smartphones',
  ],

  // Benefits
  benefits: [
    {
      icon: '⚡',
      title: 'Faster Lines',
      description: 'QR codes and preset amounts speed up checkout and reduce queues.',
      stat: 'Up to 2x throughput during peak hours',
    },
    {
      icon: '💸',
      title: 'Lower Fees',
      description: 'Avoid POS rentals and high card fees with direct crypto acceptance.',
      stat: 'Save 1–3% vs. typical POS/card',
    },
    {
      icon: '🧮',
      title: 'Easy Tally',
      description:
        'Record cash and offline sales in seconds. Auto-reconcile with received crypto.',
    },
    {
      icon: '🤝',
      title: 'Split Payouts',
      description:
        'Automatically split a percentage or fixed amount to owners or helpers on each sale.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 1200,
  competitorComparison: {
    'POS/Card Terminal': {
      processingFee: 2.5,
      flatFee: 0.1,
      monthlyFee: 25,
      annualSoftwareCost: 120,
    },
    'Mobile Money': {
      processingFee: 1.5,
      flatFee: 0.05,
      monthlyFee: 10,
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
      title: 'Preset QR Prices',
      description: 'Generate QR codes for 50, 100, 200 units—customers scan and pay instantly.',
      example: 'Fruits stall with 50/100/200 peso QR codes speeds checkout.',
      savings: 'Cuts queue time by ~40%',
    },
    {
      title: 'Owner/Helper Splits',
      description:
        'Configure a 70/30 split to auto-route funds to the owner and assistant wallets.',
      example: 'Shared stall pays helpers fairly without manual cash splits.',
    },
    {
      title: 'Offline Market Days',
      description:
        'Record cash sales and mark pending crypto payments; reconcile when connectivity returns.',
      example: 'Busy Saturday market reconciled in minutes after signal improves.',
    },
    {
      title: 'Daily Payouts',
      description:
        'Withdraw to a preferred wallet or stablecoin daily to manage cash flow and inventory restock.',
      example: 'Evening payout to stablecoin used for next-day stock purchases.',
    },
  ],

  // Features
  industryFeatures: [
    'QR checkout with preset amounts',
    'Cash + crypto unified ledger',
    'Split payouts per sale',
    'Offline tally and later reconciliation',
    'Simple inventory tags (optional)',
    'Mobile-first interface',
    'Export for tax or co-op records',
  ],
  includedFeatures: [
    {
      name: 'QR Code Generator',
      description: 'Create scannable codes for common basket totals or weight-based prices.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Route a percentage or fixed amount to partner wallets automatically per transaction.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Offline Tally',
      description: 'Track cash and crypto sales even with limited connectivity.',
    },
    {
      name: 'Daily Settlement',
      description: 'Withdraw to stablecoins or keep balances in working wallet.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect a wallet',
    'Add preset QR amounts for common baskets',
    'Optionally configure split payouts',
    'Print or display QR codes at the stall',
    'Start accepting payments and track tallies',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do I need a bank account or POS?',
      answer:
        'No. You can accept crypto directly with a wallet and QR codes—no bank or POS required.',
      category: 'Getting Started',
    },
    {
      question: 'What if the network is unreliable?',
      answer:
        'Use offline tally mode to record sales and reconcile later when connectivity improves.',
      category: 'Operations',
    },
    {
      question: 'Can I split payouts automatically?',
      answer:
        'Yes. Configure split rules and the system will route funds per sale to the right wallets.',
      category: 'Payouts',
    },
    {
      question: 'How do I export records for taxes or co-ops?',
      answer:
        'Download CSV exports of sales, splits, and payouts. Keep both cash and crypto records unified.',
      category: 'Compliance',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Queues dropped and helpers get paid fairly without counting cash. QR made market days smooth.',
      author: 'Amina',
      business: 'Kisumu Produce Stall',
      savings: 'Saved ~2% in fees vs POS',
    },
    {
      quote:
        'We added preset QR prices for baskets. Customers pay faster and we reconcile nightly.',
      author: 'Rogelio',
      business: 'Baguio Vegetable Stand',
    },
  ],

  // Related
  relatedIndustries: [
    'street-food-vendors',
    'kirana-stores',
    'sari-sari-stores',
    'retail',
  ],
  relatedUseCases: ['qr-checkout', 'split-payouts', 'offline-tally'],
};
