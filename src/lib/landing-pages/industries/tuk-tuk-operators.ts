import { IndustryLandingData } from '../types';

export const tukTukOperators: IndustryLandingData = {
  // Basics
  slug: 'tuk-tuk-operators',
  name: 'Tuk-Tuk Operators',
  icon: '🛺',

  // SEO
  title: 'Crypto Payments for Tuk-Tuk Operators – Route QR Fares, Split Payouts, Offline Tallies',
  metaDescription:
    'Collect fares with QR codes, auto-split payouts to vehicle owners and drivers, track parking stand fees, and reconcile offline segments. Built for auto-rickshaw fleets across South Asia and Southeast Asia.',
  keywords: [
    'tuk-tuk payments',
    'auto rickshaw fares',
    'route QR tickets',
    'crypto fares',
    'driver owner split',
    'parking stand fee',
    'offline tally',
    'South Asia',
    'Southeast Asia',
    'daily settlement',
  ],

  // Hero Section
  heroHeadline: 'QR Fares and Crypto Split Payouts for Tuk-Tuk Fleets',
  heroSubheadline:
    'Reduce cash leakage and disputes. Collect fares with QR tickets and route funds automatically to owners, drivers, and stand committees.',
  heroCTA: {
    primary: 'Enable QR Fare Tickets',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Cash fares are hard to track and invite disputes between owner and driver',
    'Variable pricing by traffic, time-of-day, and route causes confusion',
    'Parking stand fees and association dues are inconsistently paid',
    'Connectivity drops during routes make digital tracking unreliable',
    'Weekly settlements and float issues strain drivers and owners',
  ],
  solutions: [
    'Route-based QR tickets with rush/off-peak presets',
    'Automatic split payouts to vehicle owner and driver per fare',
    'Optional fee allocations for stand committees or association dues',
    'Offline tally mode to record fares during connectivity gaps',
    'Daily settlements in stablecoins for predictable cash flow',
  ],

  // Benefits
  benefits: [
    {
      icon: '🔒',
      title: 'Reduced Leakage',
      description:
        'Crypto fares limit leak points; transparent splits reduce reconciliation conflicts.',
      stat: 'Recover 10–20% previously leaked cash',
    },
    {
      icon: '⚖️',
      title: 'Fair Payouts',
      description:
        'Auto-route percentages to owners and drivers—no manual counting at the end of the day.',
    },
    {
      icon: '🅿️',
      title: 'Stand Fees',
      description:
        'Deduct stand fees or association dues automatically from each fare.',
    },
    {
      icon: '📊',
      title: 'Route Insights',
      description:
        'Track fares by route and time-of-day; optimize pricing and driver schedules.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 3500,
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
      title: 'Route QR Tickets',
      description:
        'Preset fares for common routes; apply rush or off-peak pricing automatically.',
      example:
        'Railway Station ↔ Main Bazaar QR tickets reduce haggling and speed boarding.',
      savings: 'Cuts queue time and driver-owner disputes',
    },
    {
      title: 'Owner/Driver Splits',
      description:
        'Configure 50/50 or 60/40 split; funds distribute instantly per fare.',
      example:
        'Owner receives maintenance reserve daily; driver gets predictable payouts.',
    },
    {
      title: 'Stand Fees & Dues',
      description:
        'Deduct a small fixed amount per fare to the stand committee wallet.',
      example:
        '₹1 per fare routed to the stand fund; no cash handoff needed.',
    },
    {
      title: 'Offline Segments',
      description:
        'Record fares offline during low signal; reconcile later with secure tallies.',
      example:
        'Outskirts routes tallied offline; reconciliation after return to the stand.',
    },
  ],

  // Features
  industryFeatures: [
    'Route-based QR fare tickets',
    'Rush/off-peak pricing presets',
    'Automatic owner/driver split payouts',
    'Optional stand fee/association deductions',
    'Offline tally and reconciliation',
    'Daily settlements to stablecoins',
    'Route-level reporting and insights',
  ],
  includedFeatures: [
    {
      name: 'QR Ticket Generator',
      description: 'Create route QR codes with rush/off-peak presets.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description: 'Auto-route percentages to owner and driver wallets.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Fee Allocations',
      description:
        'Deduct stand fees or association dues automatically per fare.',
    },
    {
      name: 'Offline Tally',
      description: 'Record fares during connectivity gaps; reconcile later.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect owner and driver wallets',
    'Define common routes and fare presets',
    'Configure split payouts and any fee allocations',
    'Print/display route QR codes on the tuk-tuk',
    'Start collecting fares and monitor daily settlements',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do passengers need an app?',
      answer:
        'No. Passengers can scan QR codes and pay using widely supported crypto wallets.',
      category: 'Passenger',
    },
    {
      question: 'Can we handle cash segments?',
      answer:
        'Yes. Use offline tally to record cash fares; keep unified records with crypto.',
      category: 'Operations',
    },
    {
      question: 'How do stand fees work?',
      answer:
        'Set a fixed deduction per fare; the system routes it automatically to the stand wallet.',
      category: 'Fees',
    },
    {
      question: 'How are owner/driver splits enforced?',
      answer:
        'You define percentages; payouts occur automatically per transaction.',
      category: 'Payouts',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Automatic splits ended daily arguments. Stand fees are paid without cash handling.',
      author: 'Rakesh',
      business: 'Auto-Rickshaw Stand – Jaipur',
      savings: 'Recovered ~12% leakage',
    },
    {
      quote:
        'QR tickets reduced fare disputes and boarding time. Drivers prefer the daily payouts.',
      author: 'Soma',
      business: 'Central Market Route – Dhaka',
    },
  ],

  // Related
  relatedIndustries: [
    'matatu-operators',
    'boda-boda-operators',
    'street-food-vendors',
    'retail',
  ],
  relatedUseCases: ['qr-checkout', 'split-payouts', 'offline-tally', 'fee-allocations'],
};
