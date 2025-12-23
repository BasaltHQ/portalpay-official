import { IndustryLandingData } from '../types';

export const streetBarbers: IndustryLandingData = {
  // Basics
  slug: 'street-barbers',
  name: 'Street Barbers',
  icon: '💈',

  // SEO
  title:
    'Crypto Payments for Street Barbers – QR Tip Jar, Service Presets, Stand Fee Allocations',
  metaDescription:
    'Earn tips and collect service payments via QR, preset common cuts/shaves, auto-deduct stand/association fees, and reconcile offline. Built for street and roadside barbers across developing cities.',
  keywords: [
    'street barber payments',
    'QR tips',
    'haircut QR',
    'crypto payments',
    'stand fee',
    'association dues',
    'offline tally',
    'roadside barber',
    'mobile barber',
  ],

  // Hero Section
  heroHeadline: 'QR Tips and Fast Crypto Checkout for Street Barbers',
  heroSubheadline:
    'Boost income with scannable tips and preset haircut amounts. Auto-deduct stand fees and keep clean records—no card reader required.',
  heroCTA: {
    primary: 'Create QR Tip Jar',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Cash tips and service payments are hard to track and split',
    'No card readers; clients prefer fast, contactless QR',
    'Stand fees/association dues collected informally and inconsistently',
    'Connectivity varies on pavements and outdoor spots',
    'End-of-day counting creates disputes for shared chairs or helpers',
  ],
  solutions: [
    'QR tip jar with preset amounts and thank-you notes',
    'Service presets for haircuts, shaves, beard trims via QR',
    'Auto-deduct stand fees or committee dues per transaction',
    'Offline tally mode for low-connectivity areas',
    'Unified ledger for cash + crypto with simple exports',
  ],

  // Benefits
  benefits: [
    {
      icon: '💰',
      title: 'More Tips',
      description:
        'QR tips reduce friction—clients support instantly with their phone.',
      stat: 'Increase tips by 20–35%',
    },
    {
      icon: '⏱️',
      title: 'Faster Checkout',
      description:
        'Preset amounts for common services speed payment and turnover.',
    },
    {
      icon: '🤝',
      title: 'Fair Splits',
      description:
        'Allocate owner/helper shares automatically on each payment.',
    },
    {
      icon: '🧾',
      title: 'Clear Records',
      description:
        'Exports support permits, association reporting, and taxes.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 500,
  competitorComparison: {
    'POS/Card Reader': {
      processingFee: 2.9,
      flatFee: 0.3,
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
      title: 'QR Tip Jar',
      description:
        'Display a QR with preset tips ($1, $2, $5) for quick gratitude.',
      example:
        'Clients scan and tip instantly after a shave—no change needed.',
      savings: 'Eliminates cash handling and change issues',
    },
    {
      title: 'Service Presets',
      description:
        'Common services (haircut, shave, trim) preset for faster checkout.',
      example:
        'Haircut QR at fixed price; client pays before or after the service.',
    },
    {
      title: 'Stand/Committee Fees',
      description:
        'Deduct small fixed dues per transaction to stand or association wallet.',
      example:
        '$0.10 per payment routed to the committee fund automatically.',
    },
    {
      title: 'Owner/Helper Splits',
      description:
        'Configure splits when a helper assists; payouts route per sale.',
      example:
        '70/30 owner/helper split ensures fair shares without cash counting.',
    },
  ],

  // Features
  industryFeatures: [
    'QR tip jar with preset amounts',
    'Service presets for common cuts/shaves',
    'Automatic owner/helper split payouts',
    'Optional stand fee/association deductions',
    'Offline tally and reconciliation',
    'Cash + crypto unified ledger',
    'Exports for permits and dues reporting',
  ],
  includedFeatures: [
    {
      name: 'QR Code Generator',
      description: 'Create scannable codes for tips and service presets.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Route percentages to owner and helper wallets automatically.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Fee Allocations',
      description:
        'Deduct stand/association dues automatically per payment.',
    },
    {
      name: 'Offline Tally',
      description:
        'Record payments without connectivity and reconcile later.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect wallets (owner and optional helper)',
    'Set tip presets and service amounts',
    'Configure split payouts and stand/committee fee',
    'Print/display QR codes at the chair or mirror',
    'Start collecting tips and service payments',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do clients need a special app?',
      answer:
        'No. Most clients can scan the QR and pay using widely supported crypto wallets.',
      category: 'Client',
    },
    {
      question: 'Can we mix cash and crypto?',
      answer:
        'Yes. Record cash in the ledger and keep unified records with crypto.',
      category: 'Operations',
    },
    {
      question: 'How are splits enforced?',
      answer:
        'You set percentages; payouts route automatically per transaction.',
      category: 'Payouts',
    },
    {
      question: 'What if connectivity is poor?',
      answer:
        'Use offline tally mode; reconcile once signal returns.',
      category: 'Connectivity',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'QR tips boosted income and ended end-of-day cash counting with my helper.',
      author: 'Babu',
      business: 'Roadside Barber – Mumbai',
      savings: 'Tips up ~25%',
    },
    {
      quote:
        'Preset haircut amounts and auto dues made it simple to comply with our stand rules.',
      author: 'Peter',
      business: 'Pavement Barber – Nairobi',
    },
  ],

  // Related
  relatedIndustries: [
    'salons',
    'street-musicians',
    'street-food-vendors',
    'market-stall-vendors',
  ],
  relatedUseCases: ['qr-checkout', 'split-payouts', 'offline-tally', 'fee-allocations'],
};
