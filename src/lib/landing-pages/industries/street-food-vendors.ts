import { IndustryLandingData } from '../types';

export const streetFoodVendors: IndustryLandingData = {
  slug: 'street-food-vendors',
  name: 'Street Food Vendors',
  icon: '🍢',

  title: 'Accept Crypto or Local Cards for Street Food | QR Tip Jar | Offline Tally | PortalPay',
  metaDescription:
    'Street food vendor payments with QR checkout and tip jar. Works for tiny tickets, festival pop-ups, and roaming carts. 0.5–1% fees vs 2%+. Offline tally, split payouts, and instant settlement.',
  keywords: [
    'street food payments',
    'qr tip jar',
    'festival vendor checkout',
    'roaming cart payments',
    'low fee micro-payments',
  ],

  heroHeadline: 'QR Payments for Street Food—Fast, Simple, Low Fee',
  heroSubheadline:
    'Customers scan and pay in seconds. Add tips, track sales, and settle daily with ultra-low fees. Perfect for markets, festivals, and roaming carts.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'Try Demo',
    secondaryLink: '/terminal',
  },

  painPoints: [
    'High fees make tiny-ticket sales uneconomical',
    'Cash handling is slow, unsafe, and hard to reconcile',
    'Festival hardware POS rentals are expensive',
    'Card declines and settlement delays hurt cash flow',
    'Hard to split revenue with helpers or stall partners',
  ],

  solutions: [
    'Pay only 0.5–1% per transaction—ideal for small tickets',
    'Single QR checkout and tip jar on any phone or tablet',
    'Instant settlement to your wallet for same-day restock',
    'Offline tally mode when internet is spotty (sync later)',
    'Automatic split payouts to partners/helpers',
  ],

  benefits: [
    {
      icon: '💸',
      title: 'Make Micro-Sales Profitable',
      description:
        'No fixed per-transaction fee—percentage-only pricing preserves margin on ₹/₱/$5–$10 items.',
      stat: '0.5–1% Fees',
    },
    {
      icon: '⚡',
      title: 'Instant Settlement',
      description:
        'Get funds in seconds. No waiting 1–3 days. Rebuy ingredients same day.',
      stat: 'Same-Day Cash',
    },
    {
      icon: '📶',
      title: 'Offline Tally Support',
      description:
        'Record orders offline during network issues and sync later for receipts and reporting.',
      stat: 'Resilient Ops',
    },
    {
      icon: '🤝',
      title: 'Split Revenue',
      description:
        'Split proceeds automatically with partners or helpers. Transparent percentages, instant payouts.',
      stat: 'No Manual Math',
    },
    {
      icon: '🧾',
      title: 'Digital Receipts',
      description:
        'Customers get SMS/WhatsApp receipts. You get itemized logs for accounting and tax.',
      stat: 'Clean Bookkeeping',
    },
    {
      icon: '🎪',
      title: 'Festival-Ready',
      description:
        'Deploy on any phone or tablet. No costly rental terminals needed. Quick setup on-site.',
      stat: 'Zero Hardware',
    },
  ],

  avgMonthlyVolume: 5000,
  competitorComparison: {
    'mobile-pos': {
      processingFee: 0.02,
      flatFee: 0.15,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
    'wallet-aggregator': {
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
      title: 'Festival QR Line',
      description:
        'Display a big QR at the stall. Customers select items and tip. Queue moves faster than cash.',
      example:
        'Vendor doing $5,000/month at festivals reduces queues; tips increase by 10% with QR convenience.',
      savings: 'Time + more tips',
    },
    {
      title: 'Roaming Cart',
      description:
        'Run a cart with a phone/tablet showing your QR. Customers pay in seconds, receive a receipt.',
      example:
        'Cart selling $2,000/month in snacks saves ~$300/year on fees vs 2%+ processors.',
      savings: '$300/year',
    },
    {
      title: 'Partner Splits',
      description:
        'Auto-split revenue with a helper or landlord percentage. No manual calculations or delayed payouts.',
      example:
        'Stall splitting 30% to a partner gets transparent on-chain payouts every day.',
      savings: 'Reduced admin',
    },
  ],

  industryFeatures: [
    'Universal QR Checkout',
    'Tip Jar with Presets',
    'Offline Order Tally',
    'Split Payouts',
    'Itemized Receipts',
    'Daily Payout Summaries',
    'Staff PIN & Roles',
    'Simple Menu Builder',
    'CSV Export',
    'Supplier Payment Links',
  ],

  includedFeatures: [
    {
      name: 'QR Checkout',
      description: 'One QR for crypto or card via onramp',
      usualCost: '$0 (built-in)',
    },
    {
      name: 'Tip Jar',
      description: 'Preset and custom tips with instant payout',
      usualCost: '$15/mo',
    },
    {
      name: 'Offline Tally',
      description: 'Capture orders without network, sync later',
      usualCost: '$10/mo',
    },
    {
      name: 'Split Payouts',
      description: 'Automatic partner/helper payouts on-chain',
      usualCost: '$20/mo',
    },
    {
      name: 'Daily Reports',
      description: 'Sales and settlement summaries each day',
      usualCost: '$10/mo',
    },
    {
      name: 'CSV Export',
      description: 'Download itemized sales for accounting',
      usualCost: '$10/mo',
    },
  ],

  setupSteps: [
    'Create/connect your wallet (2 minutes)',
    'Add stall name, menu items, and prices',
    'Print/display your QR prominently',
    'Enable tip jar presets (10%, 15%, 20%)',
    'Set split payout percentages (optional)',
    'Run a $1 test payment and verify receipt',
    'Start accepting QR payments',
  ],

  faqs: [
    {
      question: 'Do customers need crypto?',
      answer:
        'No. Most will pay with cards or Apple/Google Pay via our onramp. We convert to crypto instantly so you get low fees and instant settlement.',
      category: 'Payments',
    },
    {
      question: 'Will this work during bad network?',
      answer:
        'You can tally orders offline and sync later. Settlement requires connectivity, but your records won’t be lost.',
      category: 'Connectivity',
    },
    {
      question: 'Can I add tips easily?',
      answer:
        'Yes. Tip jar presets and custom tips are supported. Tips go directly to your wallet instantly.',
      category: 'Tips',
    },
    {
      question: 'How do split payouts work?',
      answer:
        'Set partner/helper percentages per stall. Revenue splits automatically on-chain when payments arrive.',
      category: 'Splits',
    },
  ],

  testimonials: [
    {
      quote:
        'Queues were shorter and customers tipped more with the QR. End of day cash-up is so much easier.',
      author: 'Fatima',
      business: 'Night Market Grill, Nairobi',
      savings: '$400/year including better tips',
    },
  ],

  relatedIndustries: ['food-trucks', 'kirana-stores', 'sari-sari-stores', 'market-stall-vendors'],
  relatedUseCases: ['qr-code-payments', 'micro-payments', 'offline-tally', 'split-payouts'],
};
