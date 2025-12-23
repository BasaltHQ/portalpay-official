import { IndustryLandingData } from '../types';

export const hardwareShops: IndustryLandingData = {
  // Basics
  slug: 'hardware-shops',
  name: 'Hardware Shops',
  icon: '🛠️',

  // SEO
  title:
    'Crypto Payments for Hardware Shops – QR Checkout, Contractor Tabs, Bulk Pricing, Split Payouts',
  metaDescription:
    'Speed up sales with QR checkout, manage contractor tabs, preset bulk pricing for cement/steel/pipes, auto-split payouts for commissions, and reconcile offline. Built for neighborhood hardware stores and building supply shops.',
  keywords: [
    'hardware store payments',
    'QR checkout',
    'contractor tabs',
    'bulk pricing',
    'cement',
    'steel',
    'pipes',
    'split payouts',
    'offline tally',
    'building supply',
  ],

  // Hero Section
  heroHeadline: 'QR Checkout and Contractor Tabs for Building Supply Stores',
  heroSubheadline:
    'Sell cement, steel, and fixtures faster with QR receipts, track contractor tabs cleanly, and pay staff commissions automatically—even with spotty connectivity.',
  heroCTA: {
    primary: 'Enable QR Checkout',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Heavy cash handling and long queues for bulky items',
    'Contractor tabs tracked informally; balances go missing',
    'Quote-to-order workflows are slow and error-prone',
    'Mixed units (sheets, meters, bags) complicate pricing',
    'Connectivity issues delay settlements and reconciliation',
  ],
  solutions: [
    'QR checkout with presets for common bulk quantities',
    'Clean contractor tabs ledger with due-date reminders',
    'Quote-to-order links with QR payment attached to the quote ID',
    'Automatic split payouts for owner and salesperson commissions',
    'Offline tally mode with later reconciliation when signal returns',
  ],

  // Benefits
  benefits: [
    {
      icon: '⚡',
      title: 'Faster Counter Service',
      description:
        'Preset amounts for cement/steel/pipes speed checkout and reduce queues.',
      stat: 'Serve 20–30% more orders at peak',
    },
    {
      icon: '📒',
      title: 'Clear Contractor Tabs',
      description:
        'Ledger and reminders keep balances organized and recoverable.',
    },
    {
      icon: '🧾',
      title: 'Quote-to-Order',
      description:
        'Attach payment links to quotes; convert orders without re-keying.',
    },
    {
      icon: '🤝',
      title: 'Fair Commissions',
      description:
        'Auto-split payouts per sale to owner and salesperson wallets.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 4000,
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
      title: 'Contractor Tabs',
      description:
        'Track balances for frequent buyers; set due dates and reminders.',
      example:
        'Contractor purchases steel weekly; tab shows balance and next payment date.',
      savings: 'Reduces write-offs and improves collections',
    },
    {
      title: 'Quote-to-Order QR',
      description:
        'Generate quotes with linked QR payment; convert to orders seamlessly.',
      example:
        'Client scans QR from the quote; payment posts to the exact quote ID.',
    },
    {
      title: 'Bulk Pricing Presets',
      description:
        'Preset amounts for cement bags, pipe meters, and roofing sheets.',
      example:
        'Counter selects 10 bags cement preset; QR generated instantly.',
    },
    {
      title: 'Delivery Receipts',
      description:
        'Tag receipt with delivery info and driver; keep proof in exports.',
      example:
        'Pipe delivery logged with driver name and drop-off location for audit.',
    },
  ],

  // Features
  industryFeatures: [
    'QR checkout for bulk items',
    'Contractor tabs ledger with reminders',
    'Quote-to-order payment links',
    'Automatic commission split payouts',
    'Offline tally and reconciliation',
    'Cash + crypto unified ledger',
    'Basic inventory tags for SKUs',
  ],
  includedFeatures: [
    {
      name: 'QR Code Generator',
      description:
        'Create scannable codes for common bulk quantities and fixtures.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Tabs Ledger',
      description:
        'Maintain contractor balances with due dates and reminders.',
      usualCost: '$10–$20/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Route a percentage per sale to owner and salesperson wallets.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Delivery Tagging',
      description:
        'Attach driver and drop-off details to receipts for proof of delivery.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect owner and salesperson wallets',
    'Enable QR checkout and set bulk pricing presets',
    'Configure commission split rules',
    'Start tracking contractor tabs and quotes',
    'Export deliveries and tabs for reconciliation',
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
      question: 'Can we handle units like meters or sheets?',
      answer:
        'Use presets and tags for common units; export shows quantities clearly.',
      category: 'Inventory',
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
        'QR checkout sped our counter line. Tabs are organized, and commissions pay themselves.',
      author: 'Emmanuel',
      business: 'Community Hardware – Kumasi',
      savings: 'Queues down ~20%',
    },
    {
      quote:
        'Quote-to-order links cut mistakes. Delivery tagging gives us clear proof for big jobs.',
      author: 'Anita',
      business: 'BuildRight Supplies – Cebu',
    },
  ],

  // Related
  relatedIndustries: [
    'retail',
    'kirana-stores',
    'community-pharmacies',
    'market-stall-vendors',
  ],
  relatedUseCases: [
    'qr-checkout',
    'split-payouts',
    'offline-tally',
    'tabs-ledger',
    'quote-to-order',
  ],
};
