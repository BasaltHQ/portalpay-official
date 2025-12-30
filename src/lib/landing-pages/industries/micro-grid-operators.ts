import { IndustryLandingData } from '../types';

export const microGridOperators: IndustryLandingData = {
  // Basics
  slug: 'micro-grid-operators',
  name: 'Micro-Grid Operators',
  icon: '⚡',

  // SEO
  title: 'Crypto Payments for Micro-Grid Operators | BasaltSurge',
  metaDescription:
    'Prepaid energy tokens via QR, tiered tariffs, load management, maintenance funds, and split payouts to community and operators with ultra-low fees.',
  keywords: [
    'microgrid payments',
    'prepaid energy tokens',
    'tiered tariffs',
    'load management',
    'maintenance reserve',
    'community power',
    'off-grid energy',
    'developing markets',
    'QR energy credits',
  ],

  // Hero Section
  heroHeadline: 'Prepaid Energy with Transparent Settlement',
  heroSubheadline:
    'Sell energy credits via QR, manage tariff tiers, schedule load, and split payouts between operator and community funds—online or offline.',
  heroCTA: {
    primary: 'Configure Tariffs',
    primaryLink: '/admin',
    secondary: 'Explore Energy Presets',
    secondaryLink: '/shop',
  },

  // Value Props
  painPoints: [
    'Cash collection risks and reconciliation overhead',
    'Unclear tariff tiers and night/day pricing disputes',
    'No reliable maintenance fund contributions',
    'Manual settlement between operator and community trust',
    'Connectivity outages disrupting prepaid top-ups',
    'Limited reporting for grant and regulator compliance',
  ],
  solutions: [
    'QR-based prepaid tokens linked to household meters',
    'Tiered tariff configuration with transparent receipts',
    'Automatic maintenance reserve allocation per sale',
    'Split payouts to operator and community fund at settlement',
    'Offline token issuance with sync and audit on reconnect',
    'Exportable reports for grants, regulators, and donors',
  ],

  // Benefits
  benefits: [
    {
      icon: '🔋',
      title: 'QR Energy Credits',
      description:
        'Sell prepaid credits that link to meters or smart plugs for instant activation.',
      stat: 'Reduce cash handling by 90%',
    },
    {
      icon: '🕒',
      title: 'Tiered Tariffs',
      description:
        'Configure day/night, lifeline tiers, and community discounts with clear line items.',
      stat: 'Cut pricing disputes by 50%',
    },
    {
      icon: '🏦',
      title: 'Maintenance Reserve',
      description:
        'Automatically allocate a percentage of every sale to a maintenance fund with statements.',
      stat: 'Predictable upkeep budgeting',
    },
    {
      icon: '🤝',
      title: 'Split Payouts',
      description:
        'Set split rules for operator, community trust, and field technicians.',
      stat: 'Zero manual reconciliation',
    },
    {
      icon: '📶',
      title: 'Offline Issuance',
      description:
        'Record sales during outages; tokens sync and validate when connectivity returns.',
      stat: '100% continuity',
    },
    {
      icon: '📈',
      title: 'Regulatory Reports',
      description:
        'Export consumption and revenue summaries for compliance and grant applications.',
      stat: 'Minutes, not days',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 12000,
  competitorComparison: {
    'Legacy Processor': {
      processingFee: 0.029,
      flatFee: 0.3,
      monthlyFee: 25,
      annualSoftwareCost: 240,
    },
    'Bank Transfer': {
      processingFee: 0.012,
      flatFee: 0.2,
      monthlyFee: 5,
      annualSoftwareCost: 0,
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
      title: 'Household Top-Up via QR',
      description:
        'Residents buy energy credits by scanning a QR at a kiosk or with their phones; credits link to meter IDs.',
      example:
        'Family purchases $3 of energy; token activates on meter #M-221 in seconds with a receipt.',
      savings: 'Removes cash reconciliation errors',
    },
    {
      title: 'Tiered Night Tariffs',
      description:
        'Automatically apply night-time pricing for eligible households with transparent receipts.',
      example:
        'Lifeline customers receive discounted night rates; statements show tier and period.',
      savings: 'Builds trust in pricing',
    },
    {
      title: 'Maintenance Reserve Split',
      description:
        'Allocate 5–10% of each sale to a maintenance fund; operator and community splits settle instantly.',
      example:
        '$20 sale splits into $18 operator, $2 reserve; monthly report exported to the community board.',
      savings: 'Predictable maintenance funding',
    },
  ],

  // Features
  industryFeatures: [
    'Prepaid energy tokens via QR',
    'Meter and plug linking by ID',
    'Tiered tariffs and lifeline pricing',
    'Operator/community split payouts',
    'Offline sales capture and sync',
    'Consumption and revenue reporting',
  ],
  includedFeatures: [
    {
      name: 'QR Token Sales',
      description: 'Generate scannable codes for prepaid energy credit purchases.',
      usualCost: '$99/yr',
    },
    {
      name: 'Tariff Management',
      description: 'Configure tiers, schedules, and discounts with audit logs.',
      usualCost: '$149/yr',
    },
    {
      name: 'Split Payouts',
      description: 'Automatic distribution to operator and community funds.',
      usualCost: '$120/yr',
    },
    {
      name: 'Offline Mode',
      description: 'Issue tokens during outages and reconcile later.',
      usualCost: '$59/yr',
    },
    {
      name: 'Regulatory Exports',
      description: 'CSV/JSON summaries for compliance and grants.',
      usualCost: '$49/yr',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create micro-grid profile and service area in /admin',
    'Link meters and device IDs for households',
    'Configure tariff tiers and lifeline discounts',
    'Set split rules for operator and maintenance reserve',
    'Print QR tokens for kiosks and field agents',
    'Connect wallet for settlement payouts',
  ],

  // FAQ
  faqs: [
    {
      question: 'How do prepaid credits link to meters?',
      answer:
        'Each sale is associated with a meter or device ID; activation occurs on sync and is recorded on the receipt.',
      category: 'Meters',
    },
    {
      question: 'Can we allocate funds to maintenance automatically?',
      answer:
        'Yes. Define a reserve percentage per sale. Settlement distributes shares with statements.',
      category: 'Payouts',
    },
    {
      question: 'Do you support offline credit issuance?',
      answer:
        'Yes. Sales can be recorded offline. When connectivity returns, tokens and receipts sync and reconcile.',
      category: 'Offline',
    },
    {
      question: 'Can we export reports for regulators and grants?',
      answer:
        'You can export consumption, revenue, and reserve allocations as CSV/JSON.',
      category: 'Reporting',
    },
    {
      question: 'Are small purchases economical?',
      answer:
        'Fees are 0.5–1% with no monthly charges, ideal for micro-top-ups.',
      category: 'Pricing',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Prepaid QR credits let us sell power even during network outages. The maintenance reserve is finally consistent.',
      author: 'Chisomo P.',
      business: 'Lakeview Micro-Grid – Malawi',
      savings: 'Saved 72% on fees',
    },
    {
      quote:
        'Tiered tariffs and split payouts delivered instant transparency to residents and our board.',
      author: 'Ritika S.',
      business: 'SunVillage Energy – Rajasthan',
    },
  ],

  // Related
  relatedIndustries: ['water-kiosk-operators', 'hardware-shops', 'community-pharmacies'],
  relatedUseCases: ['prepaid-tokens', 'split-payments', 'maintenance-funds', 'offline-mode'],
};
