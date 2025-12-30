import { IndustryLandingData } from '../types';

export const mobileMoneyAgents: IndustryLandingData = {
  // Basics
  slug: 'mobile-money-agents',
  name: 'Mobile Money Agents',
  icon: '📲',

  // SEO
  title:
    'Crypto Payments for Mobile Money Agents – QR Cash-In/Out, Float Management, Commission Splits',
  metaDescription:
    'Streamline agent cash-in/out with QR tickets, manage float balances, auto-split commissions to agents and super-agents, and reconcile offline. Built for neighborhood agent kiosks and airtime/data resellers.',
  keywords: [
    'mobile money agent',
    'cash in',
    'cash out',
    'agent commission',
    'float management',
    'QR ticket',
    'offline tally',
    'airtime',
    'data bundles',
    'super-agent',
  ],

  // Hero Section
  heroHeadline: 'QR Cash-In/Out and Crypto Commission Splits for Agent Kiosks',
  heroSubheadline:
    'Issue QR tickets for deposits and withdrawals, manage float cleanly, and route commissions automatically to agent and super-agent wallets—even with spotty connectivity.',
  heroCTA: {
    primary: 'Enable QR Cash-In/Out',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Manual cash-in/out ledgers cause errors and reconciliation delays',
    'Float shortfalls create customer dissatisfaction and lost sales',
    'Commission tracking is informal and invites disputes',
    'Connectivity drops make digital ticketing unreliable',
    'Agent compliance reporting for operators and regulators is cumbersome',
  ],
  solutions: [
    'QR tickets for cash-in (deposit) and cash-out (withdrawal)',
    'Real-time float balance view with alerts and thresholds',
    'Automatic commission split payouts to agent and super-agent',
    'Offline tally mode with later reconciliation when signal returns',
    'Exports for operator audits and regulatory reporting',
  ],

  // Benefits
  benefits: [
    {
      icon: '🧮',
      title: 'Accurate Ledgers',
      description:
        'QR tickets reduce errors; unified records keep deposits/withdrawals clean.',
      stat: 'Cut reconciliation time by 40–60%',
    },
    {
      icon: '💸',
      title: 'Healthy Float',
      description:
        'Alerts and thresholds help maintain adequate float for peak hours.',
    },
    {
      icon: '🤝',
      title: 'Fair Commissions',
      description:
        'Split payouts per transaction end end-of-day disputes.',
    },
    {
      icon: '📑',
      title: 'Audit-Ready',
      description:
        'Simple exports support operator and regulator reporting.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 5000,
  competitorComparison: {
    'Cash + Manual Ledger': {
      processingFee: 0,
      flatFee: 0,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
    'Operator POS': {
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
      title: 'QR Cash-In Tickets',
      description:
        'Issue QR for deposit transactions; customer scans and confirms instantly.',
      example:
        'Customer tops up wallet with ₦5,000 via QR; receipt tagged to agent ID.',
      savings: 'Reduces errors and speeds service',
    },
    {
      title: 'QR Cash-Out Tickets',
      description:
        'Create QR for withdrawals; settle quickly with clear ledger entries.',
      example:
        'Cash-out ₵100 logged; ticket number ties to agent shift and float.',
    },
    {
      title: 'Commission Splits',
      description:
        'Auto-route percentage to agent and super-agent wallets per transaction.',
      example:
        '0.8% to agent, 0.2% to super-agent on each cash-in/out.',
    },
    {
      title: 'Float Alerts',
      description:
        'Set thresholds; receive alerts when float drops below minimum.',
      example:
        'Agent receives alert at ₦20,000 threshold; rebalances float before rush hour.',
    },
  ],

  // Features
  industryFeatures: [
    'QR tickets for cash-in/out',
    'Real-time float balance view and alerts',
    'Automatic agent/super-agent commission splits',
    'Offline tally and reconciliation',
    'Cash + crypto unified ledger',
    'Exports for operators/regulators',
    'Shift tagging and kiosk ID tracking',
  ],
  includedFeatures: [
    {
      name: 'QR Ticket Generator',
      description: 'Create scannable tickets for deposits and withdrawals.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Route percentages automatically to agent and super-agent wallets.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Float Alerts',
      description:
        'Set thresholds and receive notifications to prevent stockouts.',
    },
    {
      name: 'Audit Exports',
      description:
        'CSV summaries for operator settlement and regulatory reporting.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect agent and super-agent wallets',
    'Enable QR cash-in/out and set commission splits',
    'Set float thresholds and alert preferences',
    'Tag kiosk ID and shift schedules',
    'Export daily summaries for operator settlement',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do customers need a special app?',
      answer:
        'No. They scan the QR and pay using widely supported crypto wallets.',
      category: 'Customer',
    },
    {
      question: 'Can we mix operator rails and crypto?',
      answer:
        'Yes. Use the unified ledger to record both; crypto settles instantly, operator rails are tallied.',
      category: 'Operations',
    },
    {
      question: 'How do commission splits work?',
      answer:
        'Configure percentages or fixed amounts; splits route automatically per transaction.',
      category: 'Payouts',
    },
    {
      question: 'What if connectivity is poor?',
      answer:
        'Use offline tally mode; reconcile once signal returns—no data loss.',
      category: 'Connectivity',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'QR tickets ended ledger errors. Commissions route automatically; float alerts saved our morning rush.',
      author: 'Amina',
      business: 'Agent Kiosk – Abuja',
      savings: 'Reconciliation time down ~50%',
    },
    {
      quote:
        'Daily exports make operator settlement easy. Super-agent shares are transparent.',
      author: 'Suresh',
      business: 'Neighborhood Agent – Chennai',
    },
  ],

  // Related
  relatedIndustries: [
    'kirana-stores',
    'sari-sari-stores',
    'hardware-shops',
    'street-barbers',
  ],
  relatedUseCases: [
    'qr-checkout',
    'split-payouts',
    'offline-tally',
    'commission-tracking',
    'float-management',
  ],
};
