import { IndustryLandingData } from '../types';

export const privateEquity: IndustryLandingData = {
  slug: 'private-equity',
  name: 'Private Equity',
  icon: '🏦',
  
  title: 'Accept Crypto for Private Equity Deals | Instant Settlement | PortalPay',
  metaDescription: 'Private equity crypto payment processing. Instant buyout financing, transparent on-chain records, global LP access. Perfect for buyouts, growth capital, and distressed assets.',
  keywords: [
    'private equity crypto payments',
    'buyout crypto financing',
    'accept bitcoin private equity',
    'crypto pe deals',
    'blockchain private equity',
  ],
  
  heroHeadline: 'Accept Crypto for PE Transactions',
  heroSubheadline: 'Execute buyouts and growth capital deals with instant crypto settlement. Attract global LPs, reduce wire delays, enhance transparency.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'Try Demo',
    secondaryLink: '/terminal',
  },
  
  painPoints: [
    'Multi-day wire delays for large acquisitions',
    'High transaction costs on multi-million deals',
    'Complex cross-border LP coordination',
    'Delayed capital calls slow deal execution',
    'Limited transparency for LP investors',
  ],
  
  solutions: [
    'Instant settlement for rapid deal execution',
    'Reduced transaction costs on large deals',
    'Seamless global LP participation',
    'Same-day capital deployment',
    'On-chain transparency builds LP confidence',
  ],
  
  benefits: [
    {
      icon: '⚡',
      title: 'Rapid Deal Execution',
      description: 'Close buyout deals in days, not weeks. Instant settlement enables aggressive timelines and competitive advantages.',
      stat: 'Days Faster',
    },
    {
      icon: '🌍',
      title: 'Global LP Network',
      description: 'Accept capital from international LPs without wire delays or currency complications. Expand your LP base globally.',
      stat: 'Worldwide',
    },
    {
      icon: '💰',
      title: 'Save on Fees',
      description: '$5M deal saves $500-1,000 in wire fees. Multiple closings save significantly more annually.',
      stat: '$500+/Deal',
    },
    {
      icon: '🔒',
      title: 'On-Chain Records',
      description: 'Every transaction recorded on blockchain. Perfect audit trail for LPs, auditors, and regulators.',
      stat: 'Verified',
    },
    {
      icon: '📊',
      title: 'LP Transparency',
      description: 'LPs can track capital calls, distributions, and fund performance in real-time.',
      stat: 'Live Tracking',
    },
    {
      icon: '⏰',
      title: 'No Banking Delays',
      description: 'Process transactions 24/7. Close deals on weekends when opportunities arise.',
      stat: '24/7 Active',
    },
  ],
  
  avgMonthlyVolume: 3000000,
  competitorComparison: {
    toast: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
    stripe: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  
  useCases: [
    {
      title: 'Leveraged Buyouts',
      description: 'Execute buyout deals with instant capital deployment. Multiple LP sources coordinate seamlessly.',
      example: '$5M buyout deal closes in 48 hours instead of 2 weeks with instant LP capital.',
      savings: '10+ days faster',
    },
    {
      title: 'Growth Capital',
      description: 'Provide growth equity to portfolio companies instantly. Rapid deployment capitalizes on market opportunities.',
      example: '$3M growth capital deployed same-day, company secures major contract.',
      savings: 'Immediate Impact',
    },
    {
      title: 'Distressed Asset Acquisitions',
      description: 'Act quickly on distressed opportunities. Instant settlement enables competitive bids.',
      example: '$1.5M distressed asset purchase closes in hours, beating slower competitors.',
      savings: 'Competitive Edge',
    },
  ],
  
  industryFeatures: [
    'Instant Settlement',
    'On-Chain Transparency',
    'Global Access',
    'Capital Call Automation',
    'Distribution Management',
  ],
  
  includedFeatures: [
    {
      name: 'Instant Settlement',
      description: 'Capital calls and investments settle immediately',
      usualCost: 'Standard',
    },
    {
      name: 'Blockchain Audit Trail',
      description: 'Complete transaction history on-chain',
      usualCost: 'Included',
    },
    {
      name: 'LP Portal',
      description: 'Real-time tracking for limited partners',
      usualCost: 'Free',
    },
    {
      name: 'Capital Call Automation',
      description: 'Automated LP capital call processing',
      usualCost: 'Included',
    },
    {
      name: 'Distribution Management',
      description: 'Process LP distributions instantly',
      usualCost: 'Free',
    },
    {
      name: 'Fund Admin Integration',
      description: 'API connects to fund administration platforms',
      usualCost: 'Included',
    },
  ],
  
  setupSteps: [
    'Create PortalPay account and connect fund wallet',
    'Set up branded portal with PE firm branding',
    'Configure capital call and distribution workflows',
    'Generate payment links for LP capital calls',
    'LPs fund instantly with crypto or cards',
    'Deploy capital immediately to portfolio companies',
  ],
  
  faqs: [
    {
      question: 'How does instant settlement help with competitive deal processes?',
      answer: 'In competitive auctions, the ability to close in days (not weeks) is a major advantage. Instant crypto settlement lets you prove funds availability immediately and execute faster than competitors waiting for wire transfers.',
      category: 'Competitive',
    },
    {
      question: 'Can we manage capital calls from multiple LPs simultaneously?',
      answer: 'Yes. Generate individual payment links for each LP. Track who has funded in real-time. No more chasing wire confirmations or dealing with bank delays.',
      category: 'Operations',
    },
    {
      question: 'How do distributions work with crypto?',
      answer: 'You can instantly distribute returns to LPs via crypto. They receive funds in their wallets immediately - no waiting for checks or wire transfers. This improves LP satisfaction significantly.',
      category: 'Distributions',
    },
    {
      question: 'Is this compliant with PE fund regulations?',
      answer: 'Yes. Crypto is simply the payment method. You maintain all standard PE compliance, SEC reporting, and investor qualifications. The blockchain records actually enhance audit trails.',
      category: 'Compliance',
    },
    {
      question: 'What tokens do institutional investors prefer?',
      answer: 'Most institutional investors prefer stablecoins (USDC, USDT) for their price stability. However, we support BTC, ETH, and XRP for those who want crypto exposure.',
      category: 'Tokens',
    },
  ],
  
  testimonials: [
    {
      quote: 'We closed a $5M buyout deal 10 days faster than our previous process. LP capital calls funded instantly, and we had competitive advantage in the auction.',
      author: 'James Williams',
      business: 'Summit Capital Partners',
      savings: '$50K wire fees',
    },
  ],
  
  relatedIndustries: ['venture-capital', 'investment-funds', 'real-estate'],
  relatedUseCases: ['instant-settlement', 'large-transactions', 'global-payments'],
};
