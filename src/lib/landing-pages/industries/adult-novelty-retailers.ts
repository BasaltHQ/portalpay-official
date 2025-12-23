import { IndustryLandingData } from '../types';

export const adultNoveltyRetailers: IndustryLandingData = {
  slug: 'adult-novelty-retailers',
  name: 'Adult Novelty Retailers',
  icon: '🛍️',
  title: 'Crypto Payments for Adult Novelty Retailers | Lower Fees | Discreet Receipts',
  metaDescription:
    'Accept crypto and onramp payments in-store and online with instant settlement, lower fees, and privacy-conscious receipts tailored for adult novelty retailers.',
  keywords: [
    'adult novelty payments',
    'sex-positive retail crypto',
    'privacy receipts',
    'low fee payment processor',
    'instant settlement',
  ],

  // Hero
  heroHeadline: 'Lower Fees & Discreet, Modern Checkout',
  heroSubheadline:
    'Offer QR checkout and onramp for card/Apple Pay with instant settlement. Use brand-only descriptors while keeping exportable line items for accounting.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'High-risk pricing and frequent declines on sensitive goods',
    'Chargebacks and disputes for online orders',
    'Customer privacy concerns around descriptors',
    'Cash handling and weekend settlement delays',
  ],
  solutions: [
    '0.5–1% per transaction with instant settlement',
    'On-chain finality reduces chargebacks and disputes',
    'Privacy-conscious receipts (brand-only descriptors)',
    'Onramp for customers without crypto (cards/Apple Pay)',
  ],

  // Benefits
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save 50–70% vs legacy processors.', stat: '0.5–1%' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce chargebacks on sensitive goods.', stat: 'Irrevocable' },
    { icon: '🧾', title: 'Privacy Receipts', description: 'Brand-only line items; export detailed data.', stat: 'CSV/JSON' },
  ],

  // Cost Comparison
  avgMonthlyVolume: 28000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  // Use Cases
  useCases: [
    { title: 'In-Store QR Checkout', description: 'Fast QR flow at the counter.', example: 'Customer pays instantly; discreet receipt saved.' },
    { title: 'Curbside/Pickup Links', description: 'Prepay before pickup without awkwardness.', example: 'Improve flow and reduce cash handling.' },
    { title: 'Subscriptions/Refills', description: 'Recurring stablecoin billing for refills.', example: 'Lower fees vs cards.' },
  ],

  // Features
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Privacy Receipts', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Simple QR flow customers understand', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support via onramp', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Revenue and item insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts and line items', usualCost: '$15/mo' },
  ],

  // Setup
  setupSteps: ['Create account', 'Add items/SKUs', 'Enable onramp optionally', 'Share QR/links', 'Accept payments'],

  // FAQ
  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. Onramp supports card and Apple Pay; crypto-native customers can pay directly.' },
    { question: 'Privacy?', answer: 'Use brand-only descriptors on receipts with exportable detailed data for accounting.' },
    { question: 'Chargebacks?', answer: 'On-chain finality reduces traditional chargeback exposure.' },
  ],

  // Testimonials
  testimonials: [
    { quote: 'Lower fees and private receipts improved customer trust.', author: 'Owner', business: 'Velvet Room', savings: '50–70% fees saved' },
  ],

  // Related
  relatedIndustries: ['adult-entertainment', 'retail', 'cbd-hemp-products'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'curbside-pickup'],
};
