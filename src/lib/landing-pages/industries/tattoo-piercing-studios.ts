import { IndustryLandingData } from '../types';

export const tattooPiercingStudios: IndustryLandingData = {
  slug: 'tattoo-piercing-studios',
  name: 'Tattoo & Piercing Studios',
  icon: '🖋️',
  title: 'Crypto Payments for Tattoo & Piercing Studios | Lower Fees | Instant Settlement',
  metaDescription:
    'Accept crypto and onramp payments for tattoos and piercings with instant settlement, lower fees, QR checkout, deposits, and exportable receipts.',
  keywords: [
    'tattoo studio payments',
    'piercing payments',
    'crypto tattoo deposits',
    'qr checkout studio',
    'low fee processor',
  ],

  // Hero
  heroHeadline: 'Instant Deposits & Faster Checkout',
  heroSubheadline:
    'Collect deposits and session payments via QR or link. Lower fees, instant settlement—even weekends. Exportable receipts made for studios.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'High fees and chargebacks on deposits',
    'No-shows without easy deposit collection',
    'Cash handling and weekend settlement delays',
    'Manual reconciliation for artists and sessions',
  ],
  solutions: [
    '0.5–1% per transaction with instant settlement',
    'Payment links and QR for deposits and session fees',
    'Onramp for customers without crypto (cards/Apple Pay)',
    'Exportable receipts for bookkeeping and splits',
  ],

  // Benefits
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save 50–70% vs card processors.', stat: '0.5–1% Fees' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Deposits and sessions settle in minutes.', stat: '24/7' },
    { icon: '🧾', title: 'Exportable Receipts', description: 'Clean records for artists and accounting.', stat: 'CSV/JSON' },
  ],

  // Cost Comparison
  avgMonthlyVolume: 18000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  // Use Cases
  useCases: [
    { title: 'Booking Deposits', description: 'Collect deposits via link or QR.', example: 'Reduce no-shows and secure time slots.' },
    { title: 'Session Payments', description: 'QR checkout at the counter.', example: 'Faster flow and instant receipts.' },
    { title: 'Artist Splits', description: 'Export receipts for split accounting.', example: 'Transparent payouts and records.' },
  ],

  // Features
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports', 'Deposits'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast, customer-friendly QR payments', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support via onramp', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Revenue and session insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts and line items', usualCost: '$15/mo' },
  ],

  // Setup
  setupSteps: ['Create account', 'Add services and deposits', 'Enable onramp optionally', 'Share QR/links', 'Accept payments'],

  // FAQ
  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. Onramp supports card and Apple Pay; crypto-native customers can pay directly.' },
    { question: 'Deposits and chargebacks?', answer: 'On-chain finality reduces dispute exposure on deposits.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],

  // Testimonials
  testimonials: [
    { quote: 'Deposits cleared instantly and no-shows dropped.', author: 'Owner', business: 'Ink & Steel', savings: 'Lower fees + faster settlement' },
  ],

  // Related
  relatedIndustries: ['salons', 'bars', 'adult-entertainment'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'deposits'],
};
