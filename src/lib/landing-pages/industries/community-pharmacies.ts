import { IndustryLandingData } from '../types';

export const communityPharmacies: IndustryLandingData = {
  // Basics
  slug: 'community-pharmacies',
  name: 'Community Pharmacies',
  icon: '💊',

  // SEO
  title:
    'Crypto Payments for Community Pharmacies – QR Prescriptions, Patient Tabs, Reimbursement Tracking',
  metaDescription:
    'Accept payments for prescriptions and generics with QR checkout, manage patient tabs, track insurance reimbursements, split payouts, and reconcile offline. Built for neighborhood pharmacies and drug shops.',
  keywords: [
    'pharmacy payments',
    'prescription checkout',
    'generics',
    'QR payments',
    'patient tabs',
    'insurance reimbursement',
    'split payouts',
    'offline tally',
    'drug shop',
    'compliance exports',
  ],

  // Hero Section
  heroHeadline: 'QR Checkout and Patient Tabs for Neighborhood Pharmacies',
  heroSubheadline:
    'Speed up prescription sales with QR, keep clean records of patient tabs and reimbursements, and settle daily—no POS rental needed.',
  heroCTA: {
    primary: 'Enable QR Prescriptions',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Slow card payments and cash handling during peak hours',
    'Patient tabs tracked informally and prone to errors',
    'Insurance reimbursements and copays hard to reconcile',
    'Connectivity issues cause delayed settlements',
    'Owners struggle to split payouts fairly with pharmacists',
  ],
  solutions: [
    'QR checkout for prescriptions and OTC generics',
    'Simple patient tabs ledger with due-date reminders',
    'Tag payments for insurance reimbursements vs. copays',
    'Daily settlements in stablecoins with offline tally support',
    'Automatic split payouts between owner and pharmacist',
  ],

  // Benefits
  benefits: [
    {
      icon: '⚡',
      title: 'Faster Checkout',
      description:
        'QR payments reduce queues and speed up prescription handover.',
      stat: 'Serve 20–35% more customers at peak',
    },
    {
      icon: '📒',
      title: 'Clean Tabs',
      description:
        'Keep patient tabs and balances visible with simple reminders.',
    },
    {
      icon: '🏥',
      title: 'Reimbursement Clarity',
      description:
        'Tag reimbursements and copays for easy export and audit.',
    },
    {
      icon: '🤝',
      title: 'Fair Payouts',
      description:
        'Split revenue automatically between owner and pharmacist.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 3500,
  competitorComparison: {
    'POS/Card Terminal': {
      processingFee: 2.5,
      flatFee: 0.1,
      monthlyFee: 25,
      annualSoftwareCost: 120,
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
      title: 'QR Prescription Checkout',
      description:
        'Generate QR for Rx orders and collect copays instantly at the counter.',
      example:
        'Amoxicillin + paracetamol order paid via QR; receipt linked to Rx number.',
      savings: 'Speeds handover and reduces cash counting',
    },
    {
      title: 'Patient Tabs Ledger',
      description:
        'Track balances with due dates and send gentle reminders.',
      example:
        'Chronic patient tab shows outstanding copay with next refill date.',
    },
    {
      title: 'Reimbursement Tagging',
      description:
        'Mark transactions as reimbursed vs. out-of-pocket copays.',
      example:
        'Monthly export summarizes reimbursements for insurer reporting.',
    },
    {
      title: 'Owner/Pharmacist Splits',
      description:
        'Auto-route percentages per sale to owner and pharmacist wallets.',
      example:
        '70/30 split configured; daily settlements occur automatically.',
    },
  ],

  // Features
  industryFeatures: [
    'QR checkout for prescriptions and OTC',
    'Patient tabs and due-date reminders',
    'Insurance reimbursement tagging',
    'Automatic owner/pharmacist split payouts',
    'Offline tally and reconciliation',
    'Exports for compliance and audits',
    'Basic inventory tags for generics and OTC',
  ],
  includedFeatures: [
    {
      name: 'QR Code Generator',
      description:
        'Create scannable codes for Rx orders and common OTC items.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Tabs Ledger',
      description:
        'Maintain patient tabs with due dates and lightweight reminders.',
      usualCost: '$10–$20/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Route agreed percentages to owner and pharmacist wallets.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Audit Exports',
      description:
        'CSV exports for reimbursements, copays, and tabs history.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect owner and pharmacist wallets',
    'Enable QR checkout and set OTC presets',
    'Configure split payout rules',
    'Start tracking patient tabs with due dates',
    'Export reimbursements and copays monthly',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do customers need a special app?',
      answer:
        'No. They scan the QR and pay with widely supported crypto wallets.',
      category: 'Customer',
    },
    {
      question: 'Is this compliant for prescriptions?',
      answer:
        'Payment acceptance is separate from dispensing compliance. Use exports to support audit trails.',
      category: 'Compliance',
    },
    {
      question: 'Can we mix cash and crypto?',
      answer:
        'Yes. Use offline tally to record cash payments and keep unified records.',
      category: 'Operations',
    },
    {
      question: 'What if connectivity is poor?',
      answer:
        'Record sales offline and reconcile once signal returns—no data loss.',
      category: 'Connectivity',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'QR checkout sped the line, and tabs are finally organized. Split payouts end end-of-day disputes.',
      author: 'Nadia',
      business: 'Neighborhood Pharmacy – Casablanca',
      savings: 'Queues down ~25%',
    },
    {
      quote:
        'Reimbursement tagging and monthly exports simplified insurer reporting.',
      author: 'Samuel',
      business: 'Community Drug Shop – Kampala',
    },
  ],

  // Related
  relatedIndustries: [
    'medical',
    'retail',
    'kirana-stores',
    'sari-sari-stores',
  ],
  relatedUseCases: [
    'qr-checkout',
    'split-payouts',
    'offline-tally',
    'reimbursement-tracking',
    'tabs-ledger',
  ],
};
