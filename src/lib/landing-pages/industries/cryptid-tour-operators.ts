import { IndustryLandingData } from '../types';

export const cryptidTourOperators: IndustryLandingData = {
  // Basics
  slug: 'cryptid-tour-operators',
  name: 'Cryptid Tour Operators',
  icon: '🦕',

  // SEO
  title: 'Crypto Payments for Cryptid Tour Operators | BasaltSurge',
  metaDescription:
    'Sell night safari tickets via QR, manage permits and guide splits, track merch, and operate offline in remote habitats. Transparent receipts with disclaimers.',
  keywords: [
    'cryptid tours payments',
    'night safari ticketing',
    'guide split payouts',
    'permit fees',
    'offline expedition logging',
    'wilderness tours',
    'remote area QR',
    'merch sales',
    'developing country ecotourism',
  ],

  // Hero Section
  heroHeadline: 'Mystery Meets Modern Payments',
  heroSubheadline:
    'Issue QR tickets for night safaris, settle guide and ranger splits, track permits and merch, and operate offline with transparent receipts and safety notes.',
  heroCTA: {
    primary: 'Launch Night Safari',
    primaryLink: '/admin',
    secondary: 'See Cost Comparison',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Paper tickets and cash boxes create reconciliation risk in remote areas',
    'Manual guide and ranger payouts lead to disputes',
    'Permit and conservation fees tracked inconsistently',
    'Connectivity gaps interrupt ticket sales and check-ins',
    'Merch sales and bundles lack itemization',
    'High payment fees hurt low-cost eco experiences',
  ],
  solutions: [
    'QR tickets tied to scheduled expeditions and headcount',
    'Automatic split payouts for guides, rangers, and operator',
    'Itemized permit/conservation fees on receipts',
    'Offline-first capture with sync and audit on reconnect',
    'Merch bundles (torches, ponchos, patches) with inventory tags',
    'Ultra-low fees ideal for micro-fares and add-ons',
  ],

  // Benefits
  benefits: [
    {
      icon: '🎫',
      title: 'QR Ticketing & Check-In',
      description:
        'Sell and scan tickets by expedition and time. Prevent counterfeits and speed up staging.',
      stat: 'Boarding time down 35%',
    },
    {
      icon: '🌲',
      title: 'Permit & Conservation Fees',
      description:
        'Automatically allocate fees to permits and funds with transparent line items.',
      stat: 'Predictable compliance',
    },
    {
      icon: '🧭',
      title: 'Guide & Ranger Splits',
      description:
        'Configure split rules per tour type. Settlement distributes shares instantly with statements.',
      stat: 'Zero manual reconciliation',
    },
    {
      icon: '🛍️',
      title: 'Merch Bundles',
      description:
        'Sell tour gear and souvenirs with SKU tags linked to expeditions.',
      stat: 'Boost ARPU by 20%',
    },
    {
      icon: '📶',
      title: 'Offline First',
      description:
        'Record sales and check-ins without connectivity deep in wilderness. Sync and reconcile later.',
      stat: '100% expedition continuity',
    },
    {
      icon: '📑',
      title: 'Safety & Disclaimers',
      description:
        'Attach safety notes and sightings disclaimers to receipts for clarity.',
      stat: 'Fewer guest disputes',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 6000,
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
      title: 'Night Safari Headcount',
      description:
        'Issue QR tickets for a 9 PM expedition. Scan at staging, lock headcount, and export a manifest.',
      example:
        '18 guests checked in; manifest includes permit fee allocations and safety briefing acknowledgment.',
      savings: 'Eliminates paper ticket fraud',
    },
    {
      title: 'Guide/Ranger Split Payout',
      description:
        'Define split rules per safari type. Settlement distributes shares to guides and rangers automatically.',
      example:
        'Operator 60%, lead guide 25%, ranger 10%, conservation fund 5% with monthly export for the park.',
      savings: 'Removes manual payout worksheets',
    },
    {
      title: 'Merch Bundle Sales',
      description:
        'Sell torch + poncho + patch bundles linked to expedition IDs with SKU-level tags.',
      example:
        'Guests purchase bundle at staging; receipt itemizes SKUs and permit fee line items.',
      savings: 'Prevents stock and cash leakage',
    },
  ],

  // Features
  industryFeatures: [
    'Expedition-based QR ticketing',
    'Headcount manifests and staging',
    'Permit and conservation fee allocations',
    'Operator/guide/ranger split payouts',
    'Offline capture and sync',
    'Merch SKU tagging and bundles',
    'Safety notes and disclaimers on receipts',
  ],
  includedFeatures: [
    {
      name: 'QR Ticketing',
      description: 'Create and scan tickets for expeditions with manifests.',
      usualCost: '$149/yr',
    },
    {
      name: 'Split Payouts',
      description: 'Automatic distribution to operator, guides, and rangers.',
      usualCost: '$120/yr',
    },
    {
      name: 'Offline Mode',
      description: 'Sell and check in guests in remote habitats; sync later.',
      usualCost: '$59/yr',
    },
    {
      name: 'Merch & Bundles',
      description: 'SKU-level tags and bundled pricing linked to tours.',
      usualCost: '$79/yr',
    },
    {
      name: 'Reports & Exports',
      description: 'CSV/JSON manifests and settlement statements.',
      usualCost: '$49/yr',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create expedition types and schedules in /admin',
    'Set fare tables, merch SKUs, and permit fees',
    'Define split rules for operator, guides, and rangers',
    'Print QR posters for staging and cashier areas',
    'Enable offline mode for wilderness operations',
    'Connect wallet for settlement payouts',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do QR tickets work offline in remote habitats?',
      answer:
        'Yes. Tickets can be sold and scanned offline. Events sync and reconcile when connectivity returns.',
      category: 'Offline',
    },
    {
      question: 'Can we allocate permit and conservation fees?',
      answer:
        'Define reserve rules per ticket. Receipts itemize permit and conservation lines with statements.',
      category: 'Compliance',
    },
    {
      question: 'How are guide and ranger payouts handled?',
      answer:
        'Set split percentages per expedition. Settlement distributes shares automatically with a statement.',
      category: 'Payouts',
    },
    {
      question: 'Can we bundle merch and track SKUs?',
      answer:
        'Yes. Create bundles and track SKUs linked to expedition IDs for inventory and receipts.',
      category: 'Merch',
    },
    {
      question: 'Are small fares economical to process?',
      answer:
        'Fees are 0.5–1% with no monthly charges, ideal for micro-fares and add-ons.',
      category: 'Pricing',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Ticket scanning and split payouts made expeditions smoother. Permit allocations are transparent on receipts.',
      author: 'Naledi T.',
      business: 'Shadow Trails – KwaZulu-Natal',
      savings: 'Saved 68% on fees',
    },
    {
      quote:
        'Offline mode kept night safaris running in remote valleys. Merch bundles raised guest satisfaction.',
      author: 'Mateo C.',
      business: 'Sierra Mysteries – Oaxaca',
    },
  ],

  // Related
  relatedIndustries: ['small-ferry-operators', 'matatu-operators', 'internet-cafes', 'fisherfolk-cooperatives'],
  relatedUseCases: ['ticketing', 'split-payments', 'offline-mode', 'permits-and-dues', 'merch-bundles'],
};
