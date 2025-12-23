import { IndustryLandingData } from '../types';

export const ventureCapital: IndustryLandingData = {
  slug: 'venture-capital',
  name: 'Venture Capital',
  icon: '💼',
  
  title: 'Accept Crypto for Venture Capital Investments | Instant Settlement | PortalPay',
  metaDescription: 'Venture capital crypto payment processing. Instant investment transfers, transparent on-chain records, global LP access. Perfect for seed rounds, Series A, and bridge financing.',
  keywords: [
    'venture capital crypto payments',
    'startup investment crypto',
    'accept bitcoin venture capital',
    'crypto vc investments',
    'blockchain venture funding',
    'instant investment settlement',
  ],
  
  heroHeadline: 'Accept Crypto for VC Investments',
  heroSubheadline: 'Enable instant investment transfers from global LPs. On-chain transparency, immediate settlement, reduced wire fees. Perfect for seed rounds, Series A-C, and bridge financing.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'Try Demo',
    secondaryLink: '/terminal',
  },
  
  painPoints: [
    'International LP wire transfers taking 3-7 days',
    'High wire fees ($50-150) on large investments',
    'Complex multi-jurisdiction banking requirements',
    'Delayed fund deployments slow deal closings',
    'Limited transparency in payment tracking',
  ],
  
  solutions: [
    'Instant settlement enables same-day fund deployment',
    'Minimal transaction fees vs traditional wires',
    'Global LP access without banking barriers',
    'On-chain transparency for all stakeholders',
    'Automated compliance and reporting',
  ],
  
  benefits: [
    {
      icon: '⚡',
      title: 'Instant Fund Deployment',
      description: 'LP commitments settle immediately, allowing instant capital deployment to portfolio companies. Close deals faster and capitalize on opportunities.',
      stat: 'Same-Day',
    },
    {
      icon: '🌍',
      title: 'Global LP Access',
      description: 'Accept investments from international LPs without wire delays or banking restrictions. Tap into worldwide capital sources.',
      stat: 'No Borders',
    },
    {
      icon: '💰',
      title: 'Reduced Fees',
      description: 'Save thousands on wire fees for large investments. $500K investment saves $100-150 in wire fees alone.',
      stat: '$100+/Transfer',
    },
    {
      icon: '🔒',
      title: 'On-Chain Records',
      description: 'Every investment recorded on blockchain provides immutable audit trail. Enhanced transparency for LPs and regulators.',
      stat: 'Verified',
    },
    {
      icon: '📊',
      title: 'Real-Time Tracking',
      description: 'LPs can track their investments in real-time. Automated reporting reduces administrative overhead.',
      stat: 'Live Updates',
    },
    {
      icon: '⏰',
      title: '24/7 Processing',
      description: 'Close deals and receive investments any time, including weekends and holidays. No banking hour restrictions.',
      stat: 'Always Open',
    },
  ],
  
  avgMonthlyVolume: 1000000,
  competitorComparison: {
    toast: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
    stripe: { processingFee: 0.005, flatFee: 0, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  
  useCases: [
    {
      title: 'Seed Round Investments',
      description: 'Accept seed investments from angels and early-stage VCs instantly. Enable quick deployment to portfolio companies.',
      example: '$500K seed investment settles in minutes, startup receives capital same day.',
      savings: 'Hours vs Days',
    },
    {
      title: 'Series A Commitments',
      description: 'Process large Series A investments from multiple LPs with instant settlement and on-chain verification.',
      example: '$2M Series A from international LPs closes instantly, saves $300 in wire fees.',
      savings: '$300+ Fees',
    },
    {
      title: 'Bridge Financing',
      description: 'Quick bridge rounds between major financing events. Instant deployment critical for runway extension.',
      example: '$250K bridge financing processes immediately, keeps startup operations funded.',
      savings: 'Instant Access',
    },
  ],
  
  industryFeatures: [
    'Instant Settlement',
    'On-Chain Transparency',
    'Global LP Access',
    'Automated Compliance',
    'Real-Time Reporting',
    '24/7 Processing',
  ],
  
  includedFeatures: [
    {
      name: 'Instant Settlement',
      description: 'LP investments available immediately for deployment',
      usualCost: 'Standard',
    },
    {
      name: 'Blockchain Records',
      description: 'Immutable on-chain audit trail for all investments',
      usualCost: 'Included',
    },
    {
      name: 'Multi-Currency Support',
      description: 'Accept investments in USDC, USDT, BTC, ETH, XRP',
      usualCost: 'Free',
    },
    {
      name: 'LP Dashboard',
      description: 'Real-time investment tracking for limited partners',
      usualCost: 'Included',
    },
    {
      name: 'Compliance Reporting',
      description: 'Automated reports for regulatory requirements',
      usualCost: 'Free',
    },
    {
      name: 'API Integration',
      description: 'Integrate with fund management platforms',
      usualCost: 'Included',
    },
  ],
  
  setupSteps: [
    'Create PortalPay account and connect fund wallet',
    'Set up branded investment portal with fund branding',
    'Configure accepted tokens and investment minimums',
    'Generate unique payment links for each LP or round',
    'Share portal with LPs - they can invest with crypto or cards',
    'Receive instant settlement with on-chain verification',
  ],
  
  faqs: [
    {
      question: 'How quickly can we deploy capital after receiving LP commitments?',
      answer: 'Immediately. Crypto investments settle within seconds to minutes. This means you can receive LP capital and deploy it to portfolio companies the same day, rather than waiting 3-7 days for wire transfers.',
      category: 'Payments',
    },
    {
      question: 'Can international LPs invest without complex banking?',
      answer: 'Yes! LPs from any country can invest using crypto or credit cards through our onramp. This eliminates international wire delays, currency conversion issues, and banking restrictions that often limit global fundraising.',
      category: 'International',
    },
    {
      question: 'How do we maintain compliance and audit trails?',
      answer: 'Every transaction is recorded on-chain providing immutable, timestamped records. We provide detailed reports for auditors and regulators. You maintain all standard VC compliance - crypto is simply the payment method.',
      category: 'Compliance',
    },
    {
      question: 'What about price volatility for investments?',
      answer: 'We use stablecoins (USDC, USDT) pegged 1:1 to USD. A $500K investment equals $500K in stablecoins - no volatility. If LPs send Bitcoin or Ethereum, you can instantly convert to stablecoins.',
      category: 'Technical',
    },
    {
      question: 'Can we use this for capital calls from existing LPs?',
      answer: 'Absolutely. Generate payment links for capital calls and LPs can fund instantly. Track which LPs have paid in real-time. Much faster than waiting for wire confirmations.',
      category: 'Operations',
    },
  ],
  
  testimonials: [
    {
      quote: 'We closed a $2M Series A with international LPs in 48 hours instead of 2 weeks. The instant settlement let us deploy capital to the startup immediately. Game-changing for cross-border deals.',
      author: 'Michael Chen',
      business: 'Apex Ventures',
      savings: '12 days faster',
    },
  ],
  
  relatedIndustries: ['private-equity', 'investment-funds', 'angel-investors'],
  relatedUseCases: ['instant-settlement', 'international-payments', 'large-transactions'],
};
