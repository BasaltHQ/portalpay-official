import { IndustryLandingData } from '../types';

export const smallFerryOperators: IndustryLandingData = {
  // Basics
  slug: 'small-ferry-operators',
  name: 'Small Ferry Operators',
  icon: '⛴️',

  // SEO
  title: 'Crypto Payments for Small Ferry Operators | PortalPay',
  metaDescription:
    'Sell QR tickets, manage passenger manifests and cargo fees, allocate harbor dues and fuel reserves, and split payouts to owner, captain, and crew with ultra-low fees.',
  keywords: [
    'ferry ticketing crypto',
    'passenger manifest QR',
    'cargo surcharge per kg',
    'harbor dues settlement',
    'owner captain crew splits',
    'offline island routes',
    'water transport developing countries',
  ],

  // Hero
  heroHeadline: 'QR Ticketing and Transparent Settlements for Water Transport',
  heroSubheadline:
    'Issue QR tickets, weigh cargo, apply harbor dues, and split payouts between owner, captain, and crew. Works offline on remote routes with clear manifests.',
  heroCTA: {
    primary: 'Launch Ticketing',
    primaryLink: '/admin',
    secondary: 'Compare Costs',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Paper tickets and cash boxes create reconciliation risk',
    'Manual passenger manifests and safety headcounts',
    'Cargo fees and harbor dues tracked inconsistently',
    'Fuel and maintenance reserves underfunded',
    'Connectivity gaps on island and lake routes',
    'High payment fees on low-cost commuter tickets',
  ],
  solutions: [
    'QR tickets linked to scheduled routes and seats',
    'Digital passenger manifests with headcount confirmation',
    'Per-kg cargo surcharges and harbor dues itemized on receipts',
    'Automatic split payouts plus fuel/maintenance reserves',
    'Offline capture with sync and audit on reconnect',
    'Ultra-low fees ideal for micro-fares and surcharges',
  ],

  // Benefits
  benefits: [
    {
      icon: '🎫',
      title: 'QR Ticketing',
      description:
        'Sell and scan tickets by route and time. Reduce counterfeits and speed up boarding.',
      stat: 'Boarding time down 40%',
    },
    {
      icon: '📋',
      title: 'Passenger Manifests',
      description:
        'Auto-build manifests from ticket scans and confirm headcount before departure.',
      stat: '100% headcount visibility',
    },
    {
      icon: '⚖️',
      title: 'Cargo Weighing & Fees',
      description:
        'Add per-kg surcharges and fragile handling fees with printed or digital receipts.',
      stat: 'Leakage cut by 60%',
    },
    {
      icon: '🛟',
      title: 'Harbor Dues & Safety Funds',
      description:
        'Allocate a percentage to dues and safety gear funds automatically at settlement.',
      stat: 'Predictable compliance',
    },
    {
      icon: '⛽',
      title: 'Fuel & Maintenance Reserve',
      description:
        'Set reserve rules by route; reserves accrue transparently with statements.',
      stat: 'No more surprise shortages',
    },
    {
      icon: '📶',
      title: 'Offline First',
      description:
        'Operate without connectivity on water. Sync tickets and payments when back online.',
      stat: '100% route continuity',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 9000,
  competitorComparison: {
    'Legacy Processor': {
      processingFee: 0.029,
      flatFee: 0.3,
      monthlyFee: 25,
      annualSoftwareCost: 240,
    },
    'Bank POS': {
      processingFee: 0.025,
      flatFee: 0.15,
      monthlyFee: 15,
      annualSoftwareCost: 120,
    },
    'Mobile Money': {
      processingFee: 0.015,
      flatFee: 0.1,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
  },

  // Use Cases
  useCases: [
    {
      title: 'Morning Commuter Run',
      description:
        'Issue QR tickets for the 7:00 route. Scan at boarding, auto-generate passenger manifest and headcount.',
      example:
        '50 passengers board with QR scans; manifest locks at departure and is archived for audits.',
      savings: 'Eliminates paper ticket fraud',
    },
    {
      title: 'Cargo Surcharge by Weight',
      description:
        'Weigh sacks and crates; add per-kg surcharge and fragile handling fee with itemized receipts.',
      example:
        'A 35kg crate adds a per-kg fee; receipt shows base fare + cargo + harbor dues line items.',
      savings: 'Stops under-collection',
    },
    {
      title: 'Split Payouts with Dues',
      description:
        'Define split rules for owner, captain, crew, and a harbor dues reserve. Settlement distributes instantly.',
      example:
        'Owner 70%, captain 15%, crew pool 10%, harbor dues 5% reserve with monthly export for port authority.',
      savings: 'Zero manual reconciliation',
    },
  ],

  // Features
  industryFeatures: [
    'Route-based QR ticketing and scans',
    'Passenger manifests with headcount confirm',
    'Per-kg cargo and fragile handling surcharges',
    'Owner/captain/crew split payouts',
    'Harbor dues and safety gear reserves',
    'Offline capture and sync',
    'Route analytics and exports',
  ],
  includedFeatures: [
    {
      name: 'QR Ticketing',
      description: 'Create and scan tickets for scheduled routes and special sailings.',
      usualCost: '$149/yr',
    },
    {
      name: 'Cargo & Dues',
      description: 'Itemize cargo surcharges and harbor dues with audit logs.',
      usualCost: '$99/yr',
    },
    {
      name: 'Split Payouts',
      description: 'Automatic distribution to owner, captain, and crew.',
      usualCost: '$120/yr',
    },
    {
      name: 'Offline Mode',
      description: 'Board and sell tickets without connectivity; sync later.',
      usualCost: '$59/yr',
    },
    {
      name: 'Reports & Exports',
      description: 'CSV/JSON manifests and settlement statements.',
      usualCost: '$49/yr',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create your routes and schedules in /admin',
    'Set fare tables, cargo surcharges, and harbor dues',
    'Define split rules for owner, captain, and crew',
    'Print QR boarding posters and cashier tent cards',
    'Enable offline mode for water routes',
    'Connect wallet for settlement payouts',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do QR tickets work offline on the water?',
      answer:
        'Yes. Tickets can be sold and scanned offline. All events sync and reconcile when connectivity returns.',
      category: 'Offline',
    },
    {
      question: 'Can we track harbor dues and safety funds?',
      answer:
        'Define reserve rules for dues and safety gear. Reserves accrue per ticket and appear in statements.',
      category: 'Compliance',
    },
    {
      question: 'How do crew payouts work?',
      answer:
        'Set split percentages for owner/captain/crew. Settlement distributes automatically with a clear statement.',
      category: 'Payouts',
    },
    {
      question: 'Can we weigh cargo and charge per kg?',
      answer:
        'Yes. Add per-kg surcharges and optional handling fees. Receipts itemize every line for auditing.',
      category: 'Cargo',
    },
    {
      question: 'Are small fares economical to process?',
      answer:
        'Fees are 0.5–1% with no monthly charges, ideal for low-cost commuter tickets and micro-surcharges.',
      category: 'Pricing',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Boarding is faster and our manifests are always accurate. Harbor dues and crew splits happen automatically.',
      author: 'Marites D.',
      business: 'IslandLink Ferries – Cebu',
      savings: 'Saved 67% on fees',
    },
    {
      quote:
        'Cargo surcharge leaks disappeared once we itemized with QR receipts.',
      author: 'Hassan J.',
      business: 'Lake Passage – Mwanza',
    },
  ],

  // Related
  relatedIndustries: ['matatu-operators', 'tuk-tuk-operators', 'fisherfolk-cooperatives', 'hardware-shops'],
  relatedUseCases: ['ticketing', 'cargo-fees', 'split-payments', 'offline-mode', 'safety-funds'],
};
