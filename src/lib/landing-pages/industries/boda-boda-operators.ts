import { IndustryLandingData } from '../types';

export const bodaBodaOperators: IndustryLandingData = {
  slug: 'boda-boda-operators',
  name: 'Boda Boda Operators (East Africa)',
  icon: '🛵',

  title: 'Accept Crypto or Local Cards for Boda Boda | QR Fares, Tips, and Split Payouts | PortalPay',
  metaDescription:
    'Boda boda fare collection with QR checkout and instant settlement. Low fees (0.5–1%), tip support, partner splits, and offline tally. Works for individual riders and stage groups in Kenya, Uganda, Tanzania.',
  keywords: [
    'boda boda payments',
    'motorbike taxi qr',
    'kenya boda crypto',
    'uganda boda wallet',
    'low fee fare collection',
  ],

  heroHeadline: 'QR Fares and Tips for Boda Boda Riders',
  heroSubheadline:
    'Passengers scan and pay in seconds. Collect fares, tips, and settle instantly at ultra-low fees. Ideal for riders, dispatchers, and stage groups.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'Try Demo',
    secondaryLink: '/terminal',
  },

  painPoints: [
    'Cash fares are risky and hard to reconcile',
    'Mobile money and aggregators take high fees on small fares',
    'Daily cash-outs delayed or limited by network issues',
    'Difficult to split revenue with bike owners or dispatchers',
    'Keeping records for loans, repairs, and fuel is manual',
  ],

  solutions: [
    'Pay only 0.5–1% per fare—no fixed fee on small tickets',
    'Universal QR on any phone; riders or dispatchers can display it',
    'Instant on-chain settlement with optional end-of-day summaries',
    'Automatic split payouts for owner-rider agreements',
    'Itemized receipts for fares, tips, fuel, and maintenance',
  ],

  benefits: [
    {
      icon: '💸',
      title: 'Keep More of Each Fare',
      description:
        'Percentage-only pricing preserves margin on KSh/UGX/TSh small fares compared to fixed-fee models.',
      stat: '0.5–1% Fees',
    },
    {
      icon: '⚡',
      title: 'Instant Settlement',
      description:
        'Funds arrive in seconds. Refill fuel or pay maintenance the same day without waiting.',
      stat: 'Same-Day Cash',
    },
    {
      icon: '🤝',
      title: 'Automatic Splits',
      description:
        'Define owner/rider or stage percentages. Payouts split on-chain instantly and transparently.',
      stat: 'Zero Disputes',
    },
    {
      icon: '🧾',
      title: 'Clear Records',
      description:
        'Receipts and daily summaries help with loan applications, group savings, and maintenance planning.',
      stat: 'Bank-Ready Logs',
    },
    {
      icon: '📶',
      title: 'Offline Tally',
      description:
        'Record fares when network is weak and sync later. Your trip log is never lost.',
      stat: 'Resilient Ops',
    },
    {
      icon: '🎯',
      title: 'Tips and Add-ons',
      description:
        'Passengers can add a tip or extra charges (luggage, delivery) at checkout.',
      stat: 'Higher Take-Home',
    },
  ],

  avgMonthlyVolume: 800, // USD-equivalent example across fares and tips
  competitorComparison: {
    'mobile-money-aggregator': {
      processingFee: 0.02,
      flatFee: 0,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
    'ride-hailing-app': {
      processingFee: 0.15,
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
      title: 'Street Hail QR Fare',
      description:
        'Rider shows QR, passenger scans, enters agreed fare, optionally adds tip, and pays in seconds.',
      example:
        'Rider doing $800/month in fares saves ~$120/year compared to 2%+ processors.',
      savings: '$120/year',
    },
    {
      title: 'Owner-Rider Split',
      description:
        'Set a 70/30 or daily target split. Payouts are automatic and transparent with every transaction.',
      example:
        'Owner receives 30% automatically—no end-of-day arguments or miscounts.',
      savings: 'Less admin & fewer disputes',
    },
    {
      title: 'Dispatcher/Stage Fee',
      description:
        'Stage group adds a small levy (e.g., 2–5%) to fund security or shade. Automatically split to stage wallet.',
      example:
        'Stage fund grows predictably without manual collections.',
      savings: 'Time and governance clarity',
    },
  ],

  industryFeatures: [
    'Universal QR Checkout',
    'Tip Support',
    'Split Payouts (Owner/Rider/Stage)',
    'Offline Fare Tally',
    'Daily Payout Summaries',
    'Itemized Receipts',
    'CSV Export',
    'Simple Fare Presets',
    'Dispatcher Panel',
    'Fuel/Maintenance Tags',
  ],

  includedFeatures: [
    {
      name: 'QR Checkout',
      description: 'One QR for crypto or card via onramp',
      usualCost: '$0 (built-in)',
    },
    {
      name: 'Split Payouts',
      description: 'Automatic owner/rider/stage percentages',
      usualCost: '$20/mo',
    },
    {
      name: 'Offline Tally',
      description: 'Record fares when network is bad; sync later',
      usualCost: '$10/mo',
    },
    {
      name: 'Daily Reports',
      description: 'End-of-day summaries for reconciliation',
      usualCost: '$10/mo',
    },
    {
      name: 'CSV Export',
      description: 'Download trips and payouts for accounting',
      usualCost: '$10/mo',
    },
    {
      name: 'Dispatcher Panel',
      description: 'View active riders, volumes, and stage split',
      usualCost: '$15/mo',
    },
  ],

  setupSteps: [
    'Create or connect wallet (2 minutes)',
    'Set owner/rider/stage split percentages (optional)',
    'Print/display your QR on helmet or bike',
    'Add fare presets (short, medium, long)',
    'Run a small test fare to verify receipt',
    'Start collecting fares and tips',
  ],

  faqs: [
    {
      question: 'Do passengers need crypto to pay?',
      answer:
        'No. Most will pay with cards or Apple/Google Pay via our onramp. We convert to crypto instantly so you get low fees and instant settlement.',
      category: 'Payments',
    },
    {
      question: 'Can I operate without a bank account?',
      answer:
        'Yes. Receive crypto directly and convert later via an exchange or payout partner. This is helpful for riders without formal banking.',
      category: 'Banking',
    },
    {
      question: 'What if the network is unreliable?',
      answer:
        'Use offline tally to record fares and sync later when online. Settlement requires connectivity, but you won’t lose trip data.',
      category: 'Connectivity',
    },
    {
      question: 'How do split payouts work?',
      answer:
        'Set percentages once (e.g., 70/30 or add a stage levy). Every fare splits automatically on-chain to each wallet.',
      category: 'Splits',
    },
  ],

  testimonials: [
    {
      quote:
        'No more end-of-day arguments. Splits are automatic and I can refuel immediately. Tips also went up.',
      author: 'Okello',
      business: 'Rider, Kampala',
      savings: '$180/year including fewer disputes',
    },
  ],

  relatedIndustries: ['street-food-vendors', 'market-stall-vendors', 'kirana-stores', 'sari-sari-stores'],
  relatedUseCases: ['qr-code-payments', 'split-payouts', 'offline-tally', 'daily-settlement'],
};
