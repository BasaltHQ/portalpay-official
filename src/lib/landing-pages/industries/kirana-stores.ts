import { IndustryLandingData } from '../types';

export const kiranaStores: IndustryLandingData = {
  slug: 'kirana-stores',
  name: 'Kirana Stores (India)',
  icon: '🧺',

  title: 'Accept Crypto and Local Cards for Kirana Stores | Ultra-Low Fees | BasaltSurge',
  metaDescription:
    'Kirana store payments with crypto or local cards. QR checkout, daily settlement, and inventory tools. Pay 0.5–1% vs 2–3%+ with traditional POS. Works alongside UPI and cash.',
  keywords: [
    'kirana store payments',
    'india small shop crypto',
    'qr code checkout kirana',
    'low fee kirana POS',
    'accept payments without bank account',
  ],

  heroHeadline: 'Accept Payments at Your Kirana with a Simple QR',
  heroSubheadline:
    'Customers pay via crypto or local cards using one QR. Save on fees, settle daily, and manage inventory. Works even for small average bills.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'Try Demo',
    secondaryLink: '/terminal',
  },

  painPoints: [
    '2–3% card processing fees reduce already thin margins',
    'POS terminals and monthly software subscriptions are expensive',
    'Cash handling is risky and hard to reconcile',
    'Inventory tracking across many low-cost items is time-consuming',
    'Bank account setup or approvals can be a barrier for new shops',
  ],

  solutions: [
    'Pay only 0.5–1% per transaction with no monthly fees',
    'QR-based checkout on any phone or tablet (no terminal required)',
    'Instant on-chain settlement with optional daily payouts',
    'Built-in lightweight inventory and low-stock alerts',
    'Operate without a traditional bank account if needed',
  ],

  benefits: [
    {
      icon: '💰',
      title: 'Protect Thin Margins',
      description:
        'Reduce fees from 2–3% to 0.5–1%. On ₹150,000 monthly sales, that saves ₹1,500–₹3,750 each month.',
      stat: 'Up to 70% Lower Fees',
    },
    {
      icon: '📱',
      title: 'No Hardware Needed',
      description:
        'Show a printed or digital QR at the counter. Customers scan and pay. Works on any smartphone or tablet.',
      stat: 'Zero-Terminal Setup',
    },
    {
      icon: '⚡',
      title: 'Fast Settlement',
      description:
        'Funds settle to your wallet instantly. Convert to stablecoins or withdraw when convenient.',
      stat: 'Same-Day Access',
    },
    {
      icon: '📦',
      title: 'Simple Inventory',
      description:
        'Track staples like rice, pulses, oil, snacks, and FMCG. Low-stock alerts help avoid missed sales.',
      stat: 'FMCG-Ready',
    },
    {
      icon: '🧾',
      title: 'Digital Receipts',
      description:
        'Give customers SMS/WhatsApp receipts. Maintain clear records for accounting and GST.',
      stat: 'Clean Bookkeeping',
    },
    {
      icon: '🌍',
      title: 'Bank-Lite Operation',
      description:
        'Start without a traditional bank account. Accept cards through onramp and receive crypto.',
      stat: 'Inclusive Access',
    },
  ],

  avgMonthlyVolume: 150000, // INR equivalent volume example
  competitorComparison: {
    'traditional-pos': {
      processingFee: 0.025,
      flatFee: 0,
      monthlyFee: 20,
      annualSoftwareCost: 240,
    },
    'mobile-aggregator': {
      processingFee: 0.02,
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
      title: 'Counter QR Checkout',
      description:
        'Display a single QR at the counter. Customer scans, enters amount, and pays. Receipt is generated instantly.',
      example:
        'Kirana with ₹150,000/month sales reduces fees by ~₹2,250 at 1.5% savings vs 2.5% typical.',
      savings: '₹27,000/year',
    },
    {
      title: 'Home Delivery Payments',
      description:
        'Send a payment link for phone orders. Customer pays before delivery. Helps reduce cash leakage and speed up collection.',
      example:
        'Shop doing ₹50,000/month in home deliveries saves ~₹600/month on fees and reconciles faster.',
      savings: '₹7,200/year',
    },
    {
      title: 'Supplier Settlement',
      description:
        'Pay select suppliers with on-chain transfers. Instant, traceable, with lower friction than bank transfers.',
      example:
        'Monthly supplier payouts of ₹80,000 settled on-chain cut transfer friction and provide better audit trails.',
      savings: 'Time and accounting accuracy',
    },
  ],

  industryFeatures: [
    'QR-Based Checkout',
    'Itemized Receipts',
    'Basic Inventory Tracking',
    'Low-Stock Alerts',
    'Staff PIN and Roles',
    'Multi-User Access',
    'Daily Payout Reports',
    'Customer Receipts via SMS/WhatsApp',
    'Supplier Payment Links',
    'Offline Order Tally (Sync Later)',
  ],

  includedFeatures: [
    {
      name: 'QR Checkout',
      description: 'One QR for crypto or card via onramp',
      usualCost: '₹0 (built-in)',
    },
    {
      name: 'Inventory Basics',
      description: 'Track staples with quantities and costs',
      usualCost: '₹600/mo',
    },
    {
      name: 'Digital Receipts',
      description: 'Share receipts over SMS/WhatsApp',
      usualCost: '₹300/mo',
    },
    {
      name: 'Multi-User Access',
      description: 'Owner and cashier roles with PIN lock',
      usualCost: '₹400/mo',
    },
    {
      name: 'Daily Reports',
      description: 'Sales and payout summaries each day',
      usualCost: '₹300/mo',
    },
    {
      name: 'Supplier Links',
      description: 'Generate links for supplier settlements',
      usualCost: '₹200/mo',
    },
  ],

  setupSteps: [
    'Connect or create a wallet (2 minutes)',
    'Add shop name, GSTIN (optional), and address',
    'Print or display your QR at the counter',
    'Add top-selling items to inventory for tracking',
    'Set staff PINs for cashiers (optional)',
    'Do a ₹10 test payment to confirm receipts',
    'Start accepting customer payments',
  ],

  faqs: [
    {
      question: 'Will this work alongside UPI and cash?',
      answer:
        'Yes. Many shops keep UPI and cash. BasaltSurge adds a low-fee digital option with better reconciliation and instant settlement.',
      category: 'Compatibility',
    },
    {
      question: 'Do customers need crypto?',
      answer:
        'No. Most will pay by local cards or Apple/Google Pay through our onramp. We convert to crypto instantly on the backend.',
      category: 'Customers',
    },
    {
      question: 'How do I handle small tickets like ₹50 or ₹100?',
      answer:
        'Our low fee range (0.5–1%) is ideal for small-ticket volumes. No fixed per-transaction rupee fee means small sales stay economical.',
      category: 'Pricing',
    },
    {
      question: 'Can I export sales for accounting and GST?',
      answer:
        'Yes. Export itemized sales, taxes, and payouts to CSV for your accountant. Digital receipts simplify record-keeping.',
      category: 'Accounting',
    },
    {
      question: 'Do I need a bank account to start?',
      answer:
        'No. You can receive crypto directly. If you want, convert to INR later through an exchange or payout partner.',
      category: 'Banking',
    },
  ],

  testimonials: [
    {
      quote:
        'Margins are tight. Dropping fees to under 1% made a visible difference. QR checkout was easy for customers.',
      author: 'Rakesh Sharma',
      business: 'Rakesh General Store, Pune',
      savings: '₹24,000/year',
    },
  ],

  relatedIndustries: ['sari-sari-stores', 'street-food-vendors', 'market-stall-vendors', 'retail'],
  relatedUseCases: ['qr-code-payments', 'low-fee-processing', 'daily-settlement', 'inventory-tracking'],
};
