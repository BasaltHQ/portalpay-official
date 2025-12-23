import { IndustryLandingData } from '../types';

export const lubeManufacturers: IndustryLandingData = {
  slug: 'lube-manufacturers',
  name: 'Lube Manufacturers',
  icon: '🧪',
  title: 'Crypto Payments for Lube Manufacturers | B2B Invoices | Instant Settlement',
  metaDescription:
    'Accept crypto and onramp payments for B2B lube manufacturing orders with instant settlement, lower fees, discreet receipts, and exportable records.',
  keywords: [
    'lube manufacturer payments',
    'intimate wellness B2B payments',
    'crypto B2B invoices',
    'private label lube payments',
    'low fee wire alternative',
  ],

  // Hero
  heroHeadline: 'Instant Settlement for B2B Orders',
  heroSubheadline:
    'Cut wire delays and FX fees on bulk and private-label orders. Offer payment links and QR for trade shows. Discreet, exportable receipts built for compliance.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Wire/ACH delays and cross-border FX loss on bulk orders',
    'High-risk pricing and declines from legacy processors',
    'Distributors need links/invoices that work on mobile',
    'Manual reconciliation for deposits, balances, and samples',
    'Sensitive descriptors create friction for payers and banks',
  ],
  solutions: [
    '0.5–1% per transaction with instant settlement',
    'Onramp for cards/Apple Pay—no crypto required for buyers',
    'Payment links and QR that work from emails and trade booths',
    'Exportable receipts and SKU-level line items for accounting',
    'Optional brand-only descriptors for privacy-conscious receipts',
  ],

  // Benefits
  benefits: [
    {
      icon: '⚡',
      title: 'Instant Settlement',
      description: 'Collect deposits and balances in minutes—not days.',
      stat: '24/7',
    },
    {
      icon: '💰',
      title: 'Lower Fees',
      description: 'Save 50–70% vs wire/card rails on large B2B orders.',
      stat: '0.5–1%',
    },
    {
      icon: '🧾',
      title: 'Discreet Receipts',
      description: 'Brand-only descriptors and exportable line-item data.',
      stat: 'CSV/JSON',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 100000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  // Use Cases
  useCases: [
    {
      title: 'PO Deposits',
      description: 'Collect deposits for bulk and private-label runs via link or QR.',
      example: 'Distributor pays deposit instantly; production starts sooner.',
      savings: 'Save 50–70% vs card fees',
    },
    {
      title: 'Distributor Invoices',
      description: 'Send invoices with onramp support for cards and Apple Pay.',
      example: 'International partners pay without FX loss.',
    },
    {
      title: 'Trade Show Orders',
      description: 'QR payment at the booth with instant confirmation and receipts.',
      example: 'Capture more orders without dealing with terminals.',
    },
  ],

  // Features
  industryFeatures: [
    'Payment Links',
    'QR Code Payments',
    'Instant Settlement',
    'Onramp Support',
    'Exportable Reports',
    'Discreet Descriptors',
  ],
  includedFeatures: [
    { name: 'Payment Links', description: 'Invoice or request payment via link', usualCost: '$25/mo' },
    { name: 'QR Checkout', description: 'Fast QR flow for trade shows and on-site deals', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Cards/Apple Pay converted to stablecoins', usualCost: '$50/mo' },
    { name: 'Export', description: 'CSV/JSON for accounting and audits', usualCost: '$15/mo' },
  ],

  // Setup
  setupSteps: [
    'Create account',
    'Add business profile and SKUs/batches',
    'Enable onramp if needed',
    'Generate invoice/payment links',
    'Share links/QR and get paid instantly',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do buyers need crypto?',
      answer: 'No. They can pay via cards/Apple Pay using onramp; we convert to stablecoins behind the scenes.',
    },
    {
      question: 'Can receipts avoid sensitive descriptors?',
      answer:
        'Yes. You can use brand-only line items on receipts while still keeping SKU-level exports for accounting.',
    },
    {
      question: 'How fast is settlement?',
      answer: 'Typically seconds to minutes, 24/7—even weekends and holidays.',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote: 'Instant settlement on deposits helped us start production sooner and cut wire headaches.',
      author: 'Operations Lead',
      business: 'FlowChem Labs',
      savings: 'Wire fees avoided + 50–70% lower processing',
    },
  ],

  // Related
  relatedIndustries: ['adult-novelty-retailers', 'cbd-hemp-products', 'retail'],
  relatedUseCases: ['instant-settlement', 'invoice-payments', 'qr-code-payments'],
};
