import { IndustryLandingData } from '../types';

export const realEstate: IndustryLandingData = {
  slug: 'real-estate',
  name: 'Real Estate',
  icon: '🏢',
  
  title: 'Accept Crypto Payments for Real Estate | Instant Settlement | PortalPay',
  metaDescription: 'Real estate crypto payment processing. Instant cross-border transactions, no wire delays, reduced fees. Perfect for property down payments, deposits, and international buyers.',
  keywords: [
    'real estate crypto payments',
    'property crypto transactions',
    'accept bitcoin real estate',
    'international property payments',
    'instant property settlement',
    'real estate blockchain payments',
  ],
  
  heroHeadline: 'Accept Crypto for Real Estate Transactions',
  heroSubheadline: 'Enable instant cross-border property payments with crypto. Perfect for down payments, deposits, and international buyers. No wire delays, lower fees, instant settlement.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'Try Demo',
    secondaryLink: '/terminal',
  },
  
  painPoints: [
    'Wire transfer delays of 3-7 days for international transactions',
    'High wire transfer fees ($25-75 per transfer)',
    'Currency conversion losses on international deals',
    'Complex escrow arrangements for cross-border transactions',
    'Fraud risks with traditional payment methods',
  ],
  
  solutions: [
    'Instant crypto settlement - funds available immediately',
    'Minimal transaction fees compared to wire transfers',
    'No currency conversion losses with stablecoins',
    'Blockchain-verified transactions reduce fraud',
    'Perfect for international buyers and sellers',
  ],
  
  benefits: [
    {
      icon: '⚡',
      title: 'Instant Settlement',
      description: 'Property deposits and down payments settle immediately, not in 3-7 business days. Accelerate deal closings and reduce counter-party risk.',
      stat: 'Same-Day',
    },
    {
      icon: '🌍',
      title: 'Global Transactions',
      description: 'Accept payments from international buyers without wire delays, currency conversion, or banking restrictions. Perfect for overseas investors.',
      stat: 'No Borders',
    },
    {
      icon: '💰',
      title: 'Lower Fees',
      description: 'Save on wire transfer fees ($25-75), intermediary bank charges, and currency conversion losses. Significant savings on large transactions.',
      stat: 'Save Thousands',
    },
    {
      icon: '🔒',
      title: 'Blockchain Security',
      description: 'Every transaction recorded on-chain provides immutable proof of payment. Enhanced security for high-value property transactions.',
      stat: 'Verified On-Chain',
    },
    {
      icon: '📊',
      title: 'Transparent Tracking',
      description: 'Real-time transaction visibility for all parties. Buyers, sellers, and agents can verify payment status instantly.',
      stat: 'Full Visibility',
    },
    {
      icon: '🏦',
      title: 'No Banking Delays',
      description: 'Bypass traditional banking hours and holidays. Process transactions 24/7, including weekends and holidays.',
      stat: '24/7 Access',
    },
  ],
  
  avgMonthlyVolume: 150000,
  competitorComparison: {
    toast: { processingFee: 0.0249, flatFee: 0.15, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  
  useCases: [
    {
      title: 'International Property Down Payments',
      description: 'Accept down payments from overseas buyers instantly. No waiting for international wires, no currency conversion losses.',
      example: '$50,000 down payment from Asia settles in minutes instead of 5-7 days, saves $150 in wire fees.',
      savings: 'Instant + $150/tx',
    },
    {
      title: 'Commercial Lease Deposits',
      description: 'Process first month rent and security deposits from corporate clients instantly. Ideal for commercial real estate.',
      example: '$24,000 commercial deposit processes instantly, tenant moves in same day.',
      savings: 'Faster Closings',
    },
    {
      title: 'Land Purchases',
      description: 'Large land transactions with instant on-chain verification. Perfect for raw land and development deals.',
      example: '$150,000 land purchase with instant settlement and blockchain proof of payment.',
      savings: '$200+ Wire Fees',
    },
  ],
  
  industryFeatures: [
    'Instant Settlement',
    'Blockchain Verification',
    'International Payments',
    'No Wire Delays',
    'Transparent Tracking',
    '24/7 Processing',
  ],
  
  includedFeatures: [
    {
      name: 'Instant Settlement',
      description: 'Funds available immediately, not 3-7 business days',
      usualCost: 'Standard',
    },
    {
      name: 'Blockchain Records',
      description: 'Immutable on-chain proof of all transactions',
      usualCost: 'Included',
    },
    {
      name: 'Multi-Currency Support',
      description: 'Accept payments in multiple stablecoins and crypto',
      usualCost: 'Free',
    },
    {
      name: 'Transaction Analytics',
      description: 'Track all payments with detailed reporting',
      usualCost: 'Included',
    },
    {
      name: 'White-Label Portal',
      description: 'Branded payment experience for your clients',
      usualCost: 'Free',
    },
    {
      name: 'API Access',
      description: 'Integrate with property management systems',
      usualCost: 'Included',
    },
  ],
  
  setupSteps: [
    'Create your PortalPay account and connect wallet',
    'Set up branded payment portal with your real estate company branding',
    'Configure accepted tokens (USDC, USDT, BTC, ETH, XRP)',
    'Generate payment links for specific properties or amounts',
    'Share payment portal with buyers - they can pay with crypto or cards',
    'Receive instant settlement and blockchain verification',
  ],
  
  faqs: [
    {
      question: 'How quickly do real estate crypto payments settle?',
      answer: 'Payments settle within seconds to minutes, depending on network congestion. Compare this to 3-7 days for international wire transfers. This dramatically speeds up deal closings and reduces counter-party risk.',
      category: 'Payments',
    },
    {
      question: 'Can international buyers pay with their local currency?',
      answer: 'Yes! Buyers can pay with credit cards, debit cards, or Apple Pay through our onramp, and we instantly convert to crypto. They don\'t need to own crypto - we handle everything. You receive stablecoins or crypto of your choice.',
      category: 'International',
    },
    {
      question: 'How do I handle earnest money deposits with crypto?',
      answer: 'You can set up custom payment amounts for earnest money. The transaction is recorded on-chain providing immutable proof. Many escrow companies now work with crypto - we can help connect you with crypto-friendly title companies.',
      category: 'Escrow',
    },
    {
      question: 'Is this legal for real estate transactions?',
      answer: 'Yes. Crypto payments for real estate are legal in most jurisdictions. You still comply with all standard real estate regulations, disclosures, and tax reporting. Crypto is simply the payment method. We recommend consulting with a real estate attorney familiar with crypto.',
      category: 'Legal',
    },
    {
      question: 'What about price volatility during the transaction?',
      answer: 'We primarily use stablecoins (USDC, USDT) which are pegged 1:1 to the US dollar. A $50,000 payment equals $50,000 in stablecoins - no volatility. If buyers pay with Bitcoin or Ethereum, you can instantly convert to stablecoins.',
      category: 'Technical',
    },
  ],
  
  testimonials: [
    {
      quote: 'We closed an international property sale in 2 hours instead of 2 weeks. The buyer in Singapore sent crypto and we had instant settlement. Game changer for our luxury listings.',
      author: 'Sarah Mitchell',
      business: 'Elite Properties Group',
      savings: '2 weeks faster',
    },
  ],
  
  relatedIndustries: ['luxury-real-estate', 'commercial-real-estate', 'property-management'],
  relatedUseCases: ['international-payments', 'instant-settlement', 'large-transactions'],
};
