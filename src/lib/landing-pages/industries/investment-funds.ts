import { IndustryLandingData } from '../types';

export const investmentFunds: IndustryLandingData = {
  slug: 'investment-funds',
  name: 'Investment Funds',
  icon: '📈',
  
  title: 'Accept Crypto for Investment Fund Subscriptions | BasaltSurge',
  metaDescription: 'Investment fund crypto payment processing. Instant subscriptions, transparent on-chain records, global investor access. Perfect for mutual funds, ETFs, and hedge funds.',
  keywords: [
    'investment fund crypto payments',
    'hedge fund crypto subscriptions',
    'accept bitcoin funds',
    'crypto mutual funds',
    'blockchain investment funds',
  ],
  
  heroHeadline: 'Accept Crypto for Fund Subscriptions',
  heroSubheadline: 'Enable instant investor subscriptions with crypto. Perfect for hedge funds, mutual funds, and ETFs. Global access, instant settlement, transparent tracking.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'Try Demo',
    secondaryLink: '/terminal',
  },
  
  painPoints: [
    'Wire transfer delays for fund subscriptions',
    'High minimum investments limit investor base',
    'Complex international investor onboarding',
    'Delayed NAV calculations waiting for settlements',
    'High administrative costs for payment processing',
  ],
  
  solutions: [
    'Instant subscriptions with same-day settlement',
    'Lower minimums with reduced friction',
    'Global investor access without banking barriers',
    'Real-time NAV updates with instant settlements',
    'Automated payment processing reduces overhead',
  ],
  
  benefits: [
    {
      icon: '⚡',
      title: 'Instant Subscriptions',
      description: 'Investor capital available immediately for deployment. No waiting for wire transfers to clear before executing trades.',
      stat: 'Same-Day NAV',
    },
    {
      icon: '🌍',
      title: 'Global Investor Base',
      description: 'Accept subscriptions from investors worldwide without international banking complications.',
      stat: 'No Borders',
    },
    {
      icon: '💰',
      title: 'Lower Minimums',
      description: 'Reduced friction enables lower investment minimums, expanding your investor base significantly.',
      stat: 'More Access',
    },
    {
      icon: '🔒',
      title: 'On-Chain Transparency',
      description: 'All subscriptions recorded on blockchain for complete audit trail and investor confidence.',
      stat: 'Verified',
    },
    {
      icon: '📊',
      title: 'Automated Reporting',
      description: 'Real-time subscription tracking and automated investor statements reduce administrative burden.',
      stat: 'Less Admin',
    },
    {
      icon: '⏰',
      title: 'Always Open',
      description: 'Accept subscriptions 24/7, not limited by banking hours or wire cut-off times.',
      stat: '24/7 Access',
    },
  ],
  
  avgMonthlyVolume: 500000,
  competitorComparison: {
    toast: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
    stripe: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  
  useCases: [
    {
      title: 'Mutual Fund Subscriptions',
      description: 'Accept retail investor subscriptions instantly, enabling same-day NAV execution and deployment.',
      example: '$100K mutual fund subscription processes instantly, deployed at current NAV.',
      savings: 'Same-Day Execution',
    },
    {
      title: 'ETF Purchases',
      description: 'Institutional and retail investors can purchase ETF units instantly with crypto or card payments.',
      example: '$50K ETF purchase settles immediately, saves $75 in wire fees.',
      savings: '$75/Transfer',
    },
    {
      title: 'Hedge Fund Subscriptions',
      description: 'High-net-worth individuals and institutions can subscribe instantly, even for monthly closings.',
      example: '$1M hedge fund subscription from international investor settles same-day.',
      savings: 'Faster Closing',
    },
  ],
  
  industryFeatures: [
    'Instant Settlement',
    'Blockchain Verification',
    'Global Access',
    'Automated Reporting',
    '24/7 Processing',
  ],
  
  includedFeatures: [
    {
      name: 'Instant Settlement',
      description: 'Subscriptions available for immediate deployment',
      usualCost: 'Standard',
    },
    {
      name: 'Blockchain Records',
      description: 'Immutable subscription records',
      usualCost: 'Included',
    },
    {
      name: 'Investor Portal',
      description: 'Real-time subscription and balance tracking',
      usualCost: 'Free',
    },
    {
      name: 'Automated Statements',
      description: 'Auto-generated investor statements',
      usualCost: 'Included',
    },
    {
      name: 'API Integration',
      description: 'Connect with fund accounting platforms',
      usualCost: 'Free',
    },
    {
      name: 'White-Label Portal',
      description: 'Branded subscription experience',
      usualCost: 'Included',
    },
  ],
  
  setupSteps: [
    'Create BasaltSurge account and connect fund wallet',
    'Set up branded subscription portal',
    'Configure minimum investments and accepted tokens',
    'Generate payment links for subscriptions',
    'Investors subscribe with crypto or cards',
    'Receive instant settlement and deploy capital',
  ],
  
  faqs: [
    {
      question: 'How do instant settlements affect NAV calculations?',
      answer: 'Instant settlement means you can execute trades at current NAV immediately, rather than waiting days for wire transfers. This improves returns and reduces timing risk for investors.',
      category: 'Operations',
    },
    {
      question: 'Can we accept both crypto and traditional payments?',
      answer: 'Yes! Investors can pay with crypto directly or use credit cards through our onramp. You receive stablecoins either way, benefiting from instant settlement regardless of payment method.',
      category: 'Payments',
    },
    {
      question: 'How does this work with fund accounting software?',
      answer: 'We provide APIs to integrate with major fund accounting platforms. Subscriptions and redemptions sync automatically with your existing systems.',
      category: 'Integration',
    },
    {
      question: 'What about investor verification and KYC?',
      answer: 'You maintain your existing KYC/AML processes. BasaltSurge is simply the payment method - all investor verification requirements remain the same. The blockchain records provide additional transparency.',
      category: 'Compliance',
    },
    {
      question: 'Can investors redeem their shares for crypto?',
      answer: 'Yes. You can process redemptions by sending crypto back to investor wallets. This enables instant redemptions rather than multi-day wire transfers.',
      category: 'Redemptions',
    },
  ],
  
  testimonials: [
    {
      quote: 'Our hedge fund now accepts subscriptions 24/7 from global investors. The instant settlement improved our trading efficiency and investor satisfaction dramatically.',
      author: 'David Park',
      business: 'Quantum Capital Management',
      savings: '24/7 availability',
    },
  ],
  
  relatedIndustries: ['venture-capital', 'private-equity', 'asset-management'],
  relatedUseCases: ['instant-settlement', 'international-payments', 'automated-reporting'],
};
