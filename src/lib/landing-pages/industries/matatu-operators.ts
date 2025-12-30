import { IndustryLandingData } from '../types';

export const matatuOperators: IndustryLandingData = {
  // Basics
  slug: 'matatu-operators',
  name: 'Matatu Operators',
  icon: '🚐',

  // SEO
  title: 'Crypto Payments for Matatu Operators – Stage QR Fares, Split Payouts, Fuel/Maintenance Tags',
  metaDescription:
    'Accept crypto for matatu fares with stage-based QR tickets, automatic owner/driver/stage splits, fuel and maintenance tagging, and offline tally. Built for Kenya minibuses and East Africa microtransit.',
  keywords: [
    'matatu payments',
    'minibus fares',
    'stage tickets',
    'crypto fares',
    'split payouts',
    'fuel tags',
    'maintenance reserve',
    'offline tally',
    'Kenya',
    'East Africa',
  ],

  // Hero Section
  heroHeadline: 'Stage-Based QR Fares and Crypto Split Payouts for Matatus',
  heroSubheadline:
    'Reduce cash leakage and disputes. Collect fares by stage with QR tickets and auto-split payouts to owners, drivers, and stage committees.',
  heroCTA: {
    primary: 'Enable Stage QR Fares',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Cash leakage and reconciliation disputes between owner, driver, and stage',
    'Manual fare tracking by stage and time (rush vs. off-peak)',
    'Fuel advances and maintenance reserves not consistently set aside',
    'Unreliable connectivity on routes and rural segments',
    'Weekly settlements cause float issues and disputes',
  ],
  solutions: [
    'QR stage tickets with preset fares (rush/off-peak variants)',
    'Automatic split payouts per fare to owner, driver, and stage/association',
    'Fuel and maintenance tagging on transactions for transparent reserves',
    'Offline tally mode with later reconciliation when signal returns',
    'Daily settlements to stablecoins for predictable float and payroll',
  ],

  // Benefits
  benefits: [
    {
      icon: '🔒',
      title: 'Reduced Leakage',
      description:
        'Crypto fares reduce cash handling and leak points. Transparent splits end disputes.',
      stat: 'Recover 10–20% previously leaked cash',
    },
    {
      icon: '⚖️',
      title: 'Fair Splits',
      description:
        'Auto-route percentages to owner, driver, and stage committee per fare—no manual counting.',
    },
    {
      icon: '⛽',
      title: 'Fuel & Maintenance',
      description:
        'Tag fares and auto-allocate reserves to fuel and maintenance wallets.',
    },
    {
      icon: '📈',
      title: 'Route Insights',
      description:
        'Stage-level tallies and time-of-day presets give clarity on rush vs. off-peak revenue.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 5000,
  competitorComparison: {
    'Cash + Conductor': {
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
      title: 'Stage QR Tickets',
      description:
        'Generate QR tickets per stage with rush/off-peak pricing presets.',
      example:
        'CBD → Westlands fares scanned via QR; rush hour preset applied automatically.',
      savings: 'Cuts queue times and conductor counting',
    },
    {
      title: 'Owner/Driver/Stage Splits',
      description:
        'Configure 60/30/10 split to auto-route funds and end reconciliation disputes.',
      example:
        'Driver receives daily payouts; stage committee gets transparent share.',
    },
    {
      title: 'Fuel & Maintenance Reserves',
      description:
        'Tag transactions and allocate a fixed percentage to fuel and maintenance wallets.',
      example:
        '5% of fares automatically routed to maintenance reserve for service intervals.',
    },
    {
      title: 'Offline Route Segments',
      description:
        'Record fares offline when signal drops; reconcile later at the stage.',
      example:
        'Rural segments tallied offline; evening reconciliation on stable connectivity.',
    },
  ],

  // Features
  industryFeatures: [
    'Stage-based QR tickets',
    'Rush/off-peak fare presets',
    'Automatic owner/driver/stage splits',
    'Fuel and maintenance tagging',
    'Offline tally and reconciliation',
    'Daily settlements to stablecoins',
    'Route and stage-level reporting',
  ],
  includedFeatures: [
    {
      name: 'QR Ticket Generator',
      description:
        'Create stage QR codes with price presets for rush and off-peak.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Auto-route percentages to owner, driver, and stage committee wallets.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Reserve Allocations',
      description:
        'Dedicate a percentage of each fare to fuel or maintenance wallets.',
    },
    {
      name: 'Offline Tally',
      description: 'Record fares during connectivity drops; reconcile later.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect wallets for owner, driver, and stage',
    'Define stages and fare presets (rush/off-peak)',
    'Configure split rules and reserve allocations',
    'Print/display stage QR codes inside the matatu',
    'Begin accepting fares and monitor daily settlements',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do passengers need to install an app?',
      answer:
        'No. Passengers scan QR codes and pay with widely supported crypto wallets.',
      category: 'Passenger',
    },
    {
      question: 'How do splits work?',
      answer:
        'You set percentages for owner/driver/stage. Funds route automatically per fare.',
      category: 'Payouts',
    },
    {
      question: 'Can we handle cash segments?',
      answer:
        'Yes. Use offline tally to record cash fares; keep unified records with crypto.',
      category: 'Operations',
    },
    {
      question: 'How are fuel and maintenance reserves enforced?',
      answer:
        'Reserve allocations tag transactions and route funds to dedicated wallets automatically.',
      category: 'Reserves',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Disputes faded after automatic splits. Daily settlements keep driver and owner aligned.',
      author: 'Mwangi',
      business: 'Nairobi CBD–Westlands Route',
      savings: 'Recovered ~15% leakage',
    },
    {
      quote:
        'Fuel top-ups and maintenance reserves happen automatically—no more borrowing from daily fares.',
      author: 'Achieng',
      business: 'Thika Road Stage Committee',
    },
  ],

  // Related
  relatedIndustries: [
    'boda-boda-operators',
    'street-food-vendors',
    'market-stall-vendors',
    'retail',
  ],
  relatedUseCases: ['qr-checkout', 'split-payouts', 'offline-tally', 'reserve-allocations'],
};
