import { IndustryLandingData } from '../types';

export const sariSariStores: IndustryLandingData = {
  slug: 'sari-sari-stores',
  name: 'Sari-Sari Stores (Philippines)',
  icon: '🧃',

  title: 'Accept Crypto and Local Wallets for Sari-Sari Stores | QR Checkout | BasaltSurge',
  metaDescription:
    'Sari-sari store payments with QR checkout. Accept crypto or local cards via onramp, track “lista” credit, and settle daily. Pay 0.5–1% vs 2%+ typical. Works alongside GCash, Maya, and cash.',
  keywords: [
    'sari-sari payments',
    'qr checkout sari sari',
    'philippines small store',
    'low fee sari sari POS',
    'accept payments without bank',
  ],

  heroHeadline: 'QR Checkout for Your Sari-Sari Store',
  heroSubheadline:
    'Let customers pay via crypto or local cards using one QR. Track small tickets, daily settlement, and customer tabs (“lista”). No monthly fees.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'Try Demo',
    secondaryLink: '/terminal',
  },

  painPoints: [
    '2%+ payment fees cut into very small margins',
    'Noisy hardware POS and monthly software costs',
    'Cash is hard to reconcile and risky after-hours',
    'Customers buy “tingi” (sachets) with tiny tickets',
    'Managing customer credit (“lista”) on paper',
  ],

  solutions: [
    'Pay only 0.5–1% with no monthly fees',
    'One QR works on any phone or tablet—no terminal',
    'Instant on-chain settlement with clear audit trail',
    'Optimized for small-ticket, high-frequency sales',
    'Built-in customer tab (“lista”) tracking with receipts',
  ],

  benefits: [
    {
      icon: '💰',
      title: 'Lower Fees on Small Tickets',
      description:
        'Keep more pesos on ₱10–₱200 items. No fixed per-tx peso fee, so small sales stay economical.',
      stat: 'Up to 70% Lower Fees',
    },
    {
      icon: '📲',
      title: 'QR on Any Device',
      description:
        'Print a QR or show it on a cheap phone. Customers scan, pay, and get a receipt in seconds.',
      stat: 'No Hardware Cost',
    },
    {
      icon: '🧾',
      title: '“Lista” Credit Tracking',
      description:
        'Record items to a named tab, take partial payments, and auto-generate balances and receipts.',
      stat: 'Fewer Write-Offs',
    },
    {
      icon: '⚡',
      title: 'Faster Cash Flow',
      description:
        'Funds settle instantly. Convert to stablecoins or withdraw later. Easier restock decisions.',
      stat: 'Same-Day Access',
    },
    {
      icon: '🏪',
      title: 'Micro-Inventory',
      description:
        'Track sachets and popular FMCG items, set low-stock alerts, and reduce out-of-stock moments.',
      stat: 'Sell More, Waste Less',
    },
    {
      icon: '🧮',
      title: 'Simple Accounting',
      description:
        'Itemized receipts, daily summary, export to CSV for your bookkeeper. Easier BIR compliance.',
      stat: 'Clean Books',
    },
  ],

  avgMonthlyVolume: 120000, // PHP example
  competitorComparison: {
    'traditional-pos': {
      processingFee: 0.02,
      flatFee: 0,
      monthlyFee: 15,
      annualSoftwareCost: 180,
    },
    'mobile-wallet-aggregator': {
      processingFee: 0.018,
      flatFee: 0,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
    cash: {
      processingFee: 0,
      flatFee: 0,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
  },

  useCases: [
    {
      title: 'Counter QR for Small Items',
      description:
        'Customer buys sachets and snacks. Scan QR, pay in seconds, get digital receipt—no coins needed.',
      example:
        'Store with ₱120,000/month splits 40% QR, 60% cash. Saving ~₱1,200/month vs 2% fees.',
      savings: '₱14,400/year',
    },
    {
      title: '“Lista” Customer Credit',
      description:
        'Track running balance for neighbors. Add items daily, accept partial payments, send balance receipts.',
      example:
        '20 regular “lista” customers reduce disputes and missed collections by ₱500/month.',
      savings: '₱6,000/year',
    },
    {
      title: 'Phone Orders & Delivery',
      description:
        'Share a payment link via SMS or Messenger for delivery orders. Collect before dispatch.',
      example:
        '₱30,000/month delivery volume saves ~₱300/month on fees and improves cash-on-hand.',
      savings: '₱3,600/year',
    },
  ],

  industryFeatures: [
    'Universal QR Checkout',
    'Customer Tabs (“Lista”)',
    'Micro-Inventory Tracking',
    'Low-Stock Alerts',
    'Itemized Digital Receipts',
    'Daily Payout Summaries',
    'Staff PIN / Roles',
    'Offline Order Capture (Sync Later)',
    'Supplier Payment Links',
    'CSV Export for Accounting',
  ],

  includedFeatures: [
    {
      name: 'QR Checkout',
      description: 'One QR for crypto or card via onramp',
      usualCost: '₱0 (built-in)',
    },
    {
      name: 'Lista Manager',
      description: 'Customer credit tabs with balances and receipts',
      usualCost: '₱300/mo',
    },
    {
      name: 'Micro-Inventory',
      description: 'Track sachets and fast-moving items by qty',
      usualCost: '₱350/mo',
    },
    {
      name: 'Daily Reports',
      description: 'Sales, fees, and payout summaries each day',
      usualCost: '₱200/mo',
    },
    {
      name: 'CSV Export',
      description: 'Download itemized sales and tabs for BIR accounting',
      usualCost: '₱150/mo',
    },
    {
      name: 'Staff Controls',
      description: 'Cashier PIN, role restrictions, and audit log',
      usualCost: '₱250/mo',
    },
  ],

  setupSteps: [
    'Create or connect a wallet (2 minutes)',
    'Add store details and upload logo (optional)',
    'Print/display your QR at the counter',
    'Add top 20 selling items to inventory',
    'Enable “lista” for regular customers',
    'Run a ₱10 test payment and verify receipt',
    'Start accepting QR payments',
  ],

  faqs: [
    {
      question: 'Can customers pay with GCash/Maya?',
      answer:
        'Most customers can pay with their cards or Apple/Google Pay via our onramp. It converts instantly to crypto so you get low fees and instant settlement. You can keep GCash/Maya and cash alongside BasaltSurge.',
      category: 'Payments',
    },
    {
      question: 'How do “lista” tabs work?',
      answer:
        'Search/add a customer, add items to their tab, and take partial payments any time. We keep balances and generate receipts so there’s no dispute later.',
      category: 'Credit',
    },
    {
      question: 'Is this okay for very small tickets (₱5–₱20)?',
      answer:
        'Yes. We charge a percentage (0.5–1%), no fixed peso fee per transaction. That’s why it works better for tingi.',
      category: 'Pricing',
    },
    {
      question: 'Do I need a bank account to start?',
      answer:
        'No. You can receive crypto directly. Convert to PHP later through an exchange or payout partner when convenient.',
      category: 'Banking',
    },
    {
      question: 'What if the internet drops?',
      answer:
        'You can tally orders offline and sync when online. QR payments require connectivity to settle, but your records won’t be lost.',
      category: 'Connectivity',
    },
  ],

  testimonials: [
    {
      quote:
        'QR checkout helped with small tickets. Lista tracking is the real winner—we collect more and argue less.',
      author: 'Aling Nena',
      business: 'Nena’s Sari-Sari, Quezon City',
      savings: '₱18,000/year including better collections',
    },
  ],

  relatedIndustries: ['kirana-stores', 'street-food-vendors', 'market-stall-vendors', 'retail'],
  relatedUseCases: ['qr-code-payments', 'small-ticket-sales', 'daily-settlement', 'customer-credit'],
};
