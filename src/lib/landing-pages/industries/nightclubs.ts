import { IndustryLandingData } from '../types';

export const nightclubs: IndustryLandingData = {
  slug: 'nightclubs',
  name: 'Nightclubs',
  icon: '🪩',
  title: 'Crypto Payments for Nightclubs | Faster Lines | Instant Settlement',
  metaDescription:
    'Accept crypto and onramp payments at the door and bar with instant settlement, lower fees, QR checkout, VIP deposits, and exportable receipts.',
  keywords: [
    'nightclub payments',
    'crypto cover charge',
    'bar tab crypto',
    'vip table deposit',
    'low fee processor',
  ],

  // Hero
  heroHeadline: 'Faster Lines. Lower Fees. No Banking Lag.',
  heroSubheadline:
    'QR at the door and bar, instant settlement all night (even weekends), and onramp for cards/Apple Pay. Lower fees and fewer disputes.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Long lines at the door and bar due to card terminals',
    'High card fees on tabs and cover charges',
    'Weekend settlement delays hurting cash flow',
    'Chargebacks on tabs and VIP reservations',
  ],
  solutions: [
    'QR-based checkout that moves the line',
    '0.5–1% per transaction with instant settlement',
    'Onramp for guests without crypto (cards/Apple Pay)',
    'On-chain finality reduces disputes and chargebacks',
  ],

  // Benefits
  benefits: [
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds land in minutes—even weekends.', stat: '24/7' },
    { icon: '💸', title: 'Lower Fees', description: 'Save 50–70% vs legacy card processors.', stat: '0.5–1%' },
    { icon: '🍹', title: 'Move the Line', description: 'QR at door/bar keeps the floor packed.', stat: '10s QR' },
  ],

  // Cost Comparison
  avgMonthlyVolume: 60000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  // Use Cases
  useCases: [
    { title: 'Cover Charge QR', description: 'Scan-and-go entry payments.', example: 'Door staff shows QR; guests pay in seconds.' },
    { title: 'VIP Table Deposits', description: 'Collect deposits instantly to lock tables.', example: 'Reduce cancellations and no-shows.' },
    { title: 'Bar Tabs & Rounds', description: 'QR at the bar to keep lines moving.', example: 'Guest pays; receipt auto-saved.' },
  ],

  // Features
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports', 'Deposits'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast QR flows for door and bar', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Cards/Apple Pay converted to stablecoins', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Hourly revenue and item mix', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts for bookkeeping', usualCost: '$15/mo' },
  ],

  // Setup
  setupSteps: ['Create account', 'Add cover charge and menu SKUs', 'Enable onramp', 'Print/display QR', 'Start accepting payments'],

  // FAQ
  faqs: [
    { question: 'Do guests need crypto?', answer: 'No. Guests can pay via cards/Apple Pay through onramp; crypto-native guests pay directly.' },
    { question: 'Chargebacks?', answer: 'On-chain finality reduces traditional chargeback exposure.' },
    { question: 'Hardware required?', answer: 'Any smartphone/tablet works—no proprietary terminals needed.' },
  ],

  // Testimonials
  testimonials: [
    { quote: 'Lines moved faster and fees dropped—perfect for busy nights.', author: 'GM', business: 'Pulse Club', savings: '50–70% fees saved' },
  ],

  // Related
  relatedIndustries: ['bars', 'liquor-stores', 'adult-entertainment'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'deposits'],
};
