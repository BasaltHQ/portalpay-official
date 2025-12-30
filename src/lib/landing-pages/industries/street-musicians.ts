import { IndustryLandingData } from '../types';

export const streetMusicians: IndustryLandingData = {
  // Basics
  slug: 'street-musicians',
  name: 'Street Musicians',
  icon: '🎸',

  // SEO
  title:
    'Crypto Payments for Street Musicians – QR Tip Jar, Setlist Merch, Band Splits',
  metaDescription:
    'Earn tips with QR codes, sell CDs/merch with preset amounts, auto-split payouts among band members, and reconcile offline after shows. Built for buskers and small bands in cities and festivals worldwide.',
  keywords: [
    'busker tips',
    'street musician payments',
    'QR tip jar',
    'crypto tips',
    'band split payouts',
    'offline tally',
    'merch sales',
    'festival',
    'live music',
  ],

  // Hero Section
  heroHeadline: 'QR Tip Jar and Crypto Payouts for Buskers and Small Bands',
  heroSubheadline:
    'Boost earnings with scannable tips and quick merch checkout. Split earnings fairly among members—no cash counting.',
  heroCTA: {
    primary: 'Create QR Tip Jar',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Cash tips are unpredictable and hard to split fairly',
    'Merch sales are slow without a card reader',
    'Connectivity varies at outdoor spots and festival grounds',
    'End-of-day cash counting creates disputes',
    'Keeping records for visas, grants, or permits is difficult',
  ],
  solutions: [
    'QR tip jar with preset amounts and custom messages',
    'Setlist merch QR for CDs, stickers, shirts—no card reader needed',
    'Automatic split payouts to band members per tip/sale',
    'Offline tally mode for low-connectivity venues',
    'Unified ledger and exports for grants, permits, and taxes',
  ],

  // Benefits
  benefits: [
    {
      icon: '💰',
      title: 'More Tips',
      description:
        'QR tips lower friction—fans can support instantly with their phone.',
      stat: 'Increase tips by 20–40%',
    },
    {
      icon: '⏱️',
      title: 'Faster Merch',
      description:
        'Preset QR amounts for common merch items speed checkout.',
    },
    {
      icon: '🤝',
      title: 'Fair Splits',
      description:
        'Auto-route tips and sales to members based on agreed percentages.',
    },
    {
      icon: '📒',
      title: 'Clean Records',
      description:
        'Keep simple exports for festivals, visas, grants, or taxes.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 600,
  competitorComparison: {
    'POS/Card Reader': {
      processingFee: 2.9,
      flatFee: 0.3,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
    'Mobile Money': {
      processingFee: 1.0,
      flatFee: 0.03,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
    'BasaltSurge (Crypto)': {
      processingFee: 0.5,
      flatFee: 0,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
  },

  // Use Cases
  useCases: [
    {
      title: 'QR Tip Jar',
      description:
        'Display a large QR with preset tip amounts and a thank-you note.',
      example:
        'Fans scan and tip $2, $5, or $10 instantly during the set.',
      savings: 'No card reader or cash handling needed',
    },
    {
      title: 'Setlist Merch',
      description:
        'Create QR codes for CDs, stickers, shirts with preset prices.',
      example:
        'Post-show line moves quickly—fans pay while chatting with the band.',
    },
    {
      title: 'Band Member Splits',
      description:
        'Set split rules (e.g., equal shares or sound tech percentage).',
      example:
        'Each tip and sale routes to member wallets instantly per rule.',
    },
    {
      title: 'Offline Festival Grounds',
      description:
        'Record offline tallies and reconcile later after connectivity returns.',
      example:
        'Festival day tallied offline; evening sync produces clean ledger.',
    },
  ],

  // Features
  industryFeatures: [
    'QR tip jar with preset amounts',
    'Merch QR checkout (CDs, stickers, shirts)',
    'Automatic split payouts to band members',
    'Offline tally and reconciliation',
    'Cash + crypto unified ledger',
    'Exports for permits, grants, and taxes',
  ],
  includedFeatures: [
    {
      name: 'QR Code Generator',
      description:
        'Create scannable codes for tips and setlist merch items.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Distribute earnings to member wallets automatically per transaction.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Offline Tally',
      description:
        'Record tips and merch without connectivity; reconcile later.',
    },
    {
      name: 'Ledger Export',
      description:
        'CSV exports of tips, sales, and splits for simple reporting.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect member wallets',
    'Set tip presets and merch item prices',
    'Configure split payout rules',
    'Print/display QR codes near performance area',
    'Start collecting tips and selling merch',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do fans need an app?',
      answer:
        'No. Most fans can scan the QR and pay with widely supported crypto wallets.',
      category: 'Audience',
    },
    {
      question: 'Can we mix cash and crypto?',
      answer:
        'Yes. Use offline tally to record cash tips and keep unified records.',
      category: 'Operations',
    },
    {
      question: 'How do splits work?',
      answer:
        'You set percentages or fixed amounts. The system routes earnings automatically.',
      category: 'Payouts',
    },
    {
      question: 'Can we track merch inventory?',
      answer:
        'You can tag items and export sales for simple inventory reconciliation.',
      category: 'Inventory',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'QR tips doubled our take-home and ended end-of-night cash counting.',
      author: 'Luisa',
      business: 'Duo Buskers – Lisbon',
      savings: 'Tip volume up ~35%',
    },
    {
      quote:
        'Fans buy stickers and CDs faster—our line shrank and we sold more.',
      author: 'Kofi',
      business: 'Highlife Trio – Accra',
    },
  ],

  // Related
  relatedIndustries: [
    'market-stall-vendors',
    'retail',
    'freelancers',
    'street-food-vendors',
  ],
  relatedUseCases: ['qr-checkout', 'split-payouts', 'offline-tally', 'merch-sales'],
};
