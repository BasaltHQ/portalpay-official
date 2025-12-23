import { IndustryLandingData } from '../types';

export const fisherfolkCooperatives: IndustryLandingData = {
  // Basics
  slug: 'fisherfolk-cooperatives',
  name: 'Fisherfolk Cooperatives',
  icon: '🎣',

  // SEO
  title:
    'Crypto Payments for Fisherfolk Cooperatives – Auction QR, Crew/Owner Splits, Landing Levies',
  metaDescription:
    'Run transparent fish auctions with QR tickets, auto-split payouts to owner and crew, deduct landing levies and ice fees, and reconcile offline at landing sites. Built for coastal, lake, and river fisheries.',
  keywords: [
    'fish auction payments',
    'fisherfolk cooperative',
    'boat crew split',
    'landing levy',
    'ice fees',
    'crypto payments',
    'QR tickets',
    'offline tally',
    'coastal fisheries',
    'lake fisheries',
    'East Africa',
    'South Asia',
    'Latin America',
  ],

  // Hero Section
  heroHeadline: 'QR Auctions and Automatic Crew/Owner Splits for Fisher Co-ops',
  heroSubheadline:
    'Sell catch by lot with QR auction tickets, deduct levies and ice fees, and pay owner and crew instantly—even with low connectivity at the landing site.',
  heroCTA: {
    primary: 'Start QR Auction',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Cash-based auctions lead to leakage and delayed settlements',
    'Manual owner/crew sharing causes disputes after sales',
    'Landing levies and ice/cold-chain fees are inconsistently collected',
    'Connectivity at landing sites is unreliable for digital tools',
    'Audit trails for NGO or government programs are hard to maintain',
  ],
  solutions: [
    'QR auction tickets per lot (species, grade, weight)',
    'Automatic split payouts between boat owner and crew per sale',
    'Configurable deductions for landing levies and ice/cold-chain fees',
    'Offline tally mode with later reconciliation when signal returns',
    'Exports for co-op boards, NGOs, and fishery management audits',
  ],

  // Benefits
  benefits: [
    {
      icon: '🔍',
      title: 'Transparent Auctions',
      description:
        'Clearly tagged lots with instant receipts reduce leakage and disputes.',
      stat: 'Cut reconciliation time by 50–70%',
    },
    {
      icon: '🤝',
      title: 'Fair Shares',
      description:
        'Owner and crew splits happen automatically—no manual counting needed.',
    },
    {
      icon: '🧊',
      title: 'Fee Compliance',
      description:
        'Landing levy and ice fees are deducted and routed to the right wallets.',
    },
    {
      icon: '📡',
      title: 'Offline Friendly',
      description:
        'Tally lots offline at the landing site; reconcile later without data loss.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 9000,
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
      title: 'QR Auction Lots',
      description:
        'Create QR labels for lots by species, grade, and weight; buyers scan to pay.',
      example:
        'Tilapia Grade A 120kg lot sold via QR at lakeside auction; instant receipt issued.',
      savings: 'Eliminates cash handling delays',
    },
    {
      title: 'Owner/Crew Splits',
      description:
        'Autopay 50% to owner and 50% split among crew (or any custom rule).',
      example:
        'Crew shares settle instantly after each lot; fewer disputes at day’s end.',
    },
    {
      title: 'Levies and Ice Fees',
      description:
        'Deduct landing levies and ice/cold-chain fees automatically per sale.',
      example:
        '2% landing levy and fixed ice charge routed to co-op and cold-room wallets.',
    },
    {
      title: 'Offline Landing Sites',
      description:
        'Record transactions offline; sync and reconcile when connectivity returns.',
      example:
        'Remote beach tally synced in the evening; exports ready for the co-op board.',
    },
  ],

  // Features
  industryFeatures: [
    'QR auction tickets per lot',
    'Automatic owner/crew split payouts',
    'Configurable levies and fee deductions',
    'Offline tally and reconciliation',
    'Cash + crypto unified ledger',
    'Exports for audits and subsidies',
    'Mobile-first interface for landing sites',
  ],
  includedFeatures: [
    {
      name: 'Auction Ticket Generator',
      description: 'Create scannable tickets tagged by species, grade, and weight.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Distribute funds to owner and crew wallets automatically per sale.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Fee Allocations',
      description:
        'Deduct levies, ice, or cold-chain fees and route to designated wallets.',
    },
    {
      name: 'Offline Tally',
      description:
        'Record auction results without connectivity and reconcile later.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect co-op, owner, and crew wallets',
    'Define split rules and levy/fee deductions',
    'Tag lots with species, grade, and weight; print QR tickets',
    'Run auction and collect payments',
    'Export records for the co-op board or regulators',
  ],

  // FAQ
  faqs: [
    {
      question: 'Can we handle mixed cash and crypto buyers?',
      answer:
        'Yes. Use the unified ledger to record both; crypto sales settle instantly, cash sales are tallied for reconciliation.',
      category: 'Operations',
    },
    {
      question: 'How flexible are the split rules?',
      answer:
        'You can set percentages or fixed amounts for owner and crew, and add earmarks for safety or gear funds.',
      category: 'Payouts',
    },
    {
      question: 'How are levies and ice fees tracked?',
      answer:
        'Deduction rules tag each sale and route to the correct wallets; exports show fee totals by day or lot.',
      category: 'Fees',
    },
    {
      question: 'What about remote sites with no signal?',
      answer:
        'Use offline tally. Data syncs and reconciles when connectivity returns, preserving full detail.',
      category: 'Connectivity',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Instant crew shares after each lot ended end-of-day arguments. Co-op fees are now automatic.',
      author: 'Okoth',
      business: 'Lake Victoria Co-op',
      savings: 'Reduced disputes and saved ~2% leakage',
    },
    {
      quote:
        'QR tickets sped up auctions and made NGO reporting painless. Ice fees route automatically.',
      author: 'Mariam',
      business: 'Coastal Fishers Union',
    },
  ],

  // Related
  relatedIndustries: [
    'market-stall-vendors',
    'water-kiosk-operators',
    'matatu-operators',
    'tuk-tuk-operators',
  ],
  relatedUseCases: [
    'qr-checkout',
    'split-payouts',
    'fee-allocations',
    'offline-tally',
    'auction-sales',
  ],
};
