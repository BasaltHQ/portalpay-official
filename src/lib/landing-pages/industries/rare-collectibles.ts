import { IndustryLandingData } from '../types';

export const rareCollectibles: IndustryLandingData = {
  slug: 'rare-collectibles',
  name: 'Rare Collectibles',
  icon: '🏎️',
  
  title: 'Accept Crypto for Rare Collectibles | Instant Global Transactions | PortalPay',
  metaDescription: 'Rare collectibles crypto payments. Instant settlement for vintage cars, rare coins, fine wine, and memorabilia. Perfect for global collectors and auction houses.',
  keywords: [
    'rare collectibles crypto payments',
    'vintage car bitcoin',
    'rare coin crypto',
    'fine wine blockchain',
    'collectibles auction crypto',
  ],
  
  heroHeadline: 'Accept Crypto for Rare Collectibles',
  heroSubheadline: 'Enable collectors to purchase rare assets with crypto. Instant international transactions, enhanced provenance, reduced fees.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'Try Demo',
    secondaryLink: '/terminal',
  },
  
  painPoints: [
    'International wires take 5-10 days for high-value sales',
    'High banking and wire fees on six-figure purchases',
    'Provenance and authenticity tracking is fragmented',
    'Privacy concerns for high-profile collectors',
    'Cross-border currency conversion losses',
  ],
  
  solutions: [
    'Instant settlement for rapid acquisitions',
    'Minimal fees regardless of transaction size',
    'Blockchain-linked provenance and certificates',
    'Enhanced privacy for collectors',
    'Stablecoin payments eliminate FX risk',
  ],
  
  benefits: [
    {
      icon: '⚡',
      title: 'Same-Day Settlement',
      description: 'Close sales immediately. Ideal for auctions and private treaty sales where speed matters.',
      stat: 'Instant',
    },
    {
      icon: '🌍',
      title: 'Global Buyers',
      description: 'Sell to international collectors without banking friction. Expand your market worldwide.',
      stat: 'Worldwide',
    },
    {
      icon: '💰',
      title: 'Save on Fees',
      description: '$450K vintage car sale saves $1,000+ in wire fees and eliminates FX losses.',
      stat: '$1K+/Sale',
    },
    {
      icon: '🔒',
      title: 'Provenance on Chain',
      description: 'Connect payment to digital provenance and certificates for permanent records.',
      stat: 'Verified',
    },
    {
      icon: '📊',
      title: 'Transparent Records',
      description: 'Immutable on-chain proof of payment, ideal for audits and resale.',
      stat: 'On-Chain',
    },
    {
      icon: '🧾',
      title: 'Auction Ready',
      description: 'Perfect for live or online auctions. Winning bidders can pay instantly.',
      stat: 'Auction Fit',
    },
  ],
  
  avgMonthlyVolume: 300000,
  competitorComparison: {
    toast: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
    stripe: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  
  useCases: [
    {
      title: 'Vintage Car Sales',
      description: 'Sell classic cars to international collectors with instant crypto settlement.',
      example: '$450K 1960s vintage car sold to overseas buyer, settled instantly.',
      savings: '$1,000 wire fees',
    },
    {
      title: 'Rare Coin Collections',
      description: 'Process rare coin collections with blockchain certificates and provenance.',
      example: '$125K rare coin collection purchased by global collector with instant settlement.',
      savings: 'Instant Access',
    },
    {
      title: 'Fine Wine Lots',
      description: 'Sell fine wine in bonded storage with instant payment and storage proof.',
      example: '$85K fine wine lot sold with digital proof and storage record.',
      savings: 'No FX Loss',
    },
  ],
  
  industryFeatures: [
    'Instant Settlement',
    'Provenance Integration',
    'Global Transactions',
    'Authentication Support',
    'Auction Payments',
  ],
  
  includedFeatures: [
    {
      name: 'Instant Settlement',
      description: 'Close rare collectible sales same day',
      usualCost: 'Standard',
    },
    {
      name: 'Blockchain Provenance',
      description: 'Connect payment to certificates and provenance',
      usualCost: 'Included',
    },
    {
      name: 'Collector Privacy',
      description: 'Discreet transactions for high-profile buyers',
      usualCost: 'Free',
    },
    {
      name: 'Multi-Currency',
      description: 'Accept USDC, USDT, BTC, ETH, XRP',
      usualCost: 'Included',
    },
    {
      name: 'Auction Mode',
      description: 'Instant payment links for winning bids',
      usualCost: 'Free',
    },
    {
      name: 'Splits',
      description: 'Commission and consignor splits automated on payment',
      usualCost: 'Included',
    },
  ],
  
  setupSteps: [
    'Create PortalPay account and connect company wallet',
    'Set up collectibles-branded payment portal',
    'Configure item-specific payment links and certificates',
    'Share QR codes or links for auctions and private sales',
    'Collectors pay with crypto or cards instantly',
    'Issue digital provenance with blockchain proof',
  ],
  
  faqs: [
    {
      question: 'Is crypto common among collectibles buyers?',
      answer: 'Yes. Many high-net-worth crypto holders actively collect vintage cars, rare coins, watches, and fine wine. They prefer crypto for speed, privacy, and global reach.',
      category: 'Market',
    },
    {
      question: 'How do we handle provenance?',
      answer: 'Link payments to digital provenance records or certificates. The blockchain provides immutable timestamps to enhance authenticity and resale value.',
      category: 'Provenance',
    },
    {
      question: 'Can this work for live auctions?',
      answer: 'Perfectly. Generate instant payment links for winning bidders. Settlements happen immediately, eliminating days of waiting for wires to clear.',
      category: 'Auctions',
    },
    {
      question: 'Do customs or shipping handle crypto differently?',
      answer: 'Crypto affects only payment. Normal import/export rules apply for physical items. Payment finality and transparency simplify the transaction process.',
      category: 'Logistics',
    },
    {
      question: 'Can we split payment between consignor and house?',
      answer: 'Yes. Configure split percentages and PortalPay will distribute funds instantly upon settlement.',
      category: 'Splits',
    },
  ],
  
  testimonials: [
    {
      quote: 'A $450K vintage car sold to a global buyer in hours. Instant crypto settlement eliminated a week of wire delays and FX headaches.',
      author: 'Luca Bianchi',
      business: 'Heritage Motors',
      savings: '7 days + fees',
    },
  ],
  
  relatedIndustries: ['art-galleries', 'jewelry-diamonds', 'yacht-brokers'],
  relatedUseCases: ['instant-settlement', 'provenance', 'international-collectors'],
};
