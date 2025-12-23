import { IndustryLandingData } from '../types';

export const villageSavingsGroups: IndustryLandingData = {
  // Basics
  slug: 'village-savings-groups',
  name: 'Village Savings & Loan Groups',
  icon: '👥',

  // SEO
  title: 'Crypto Payments for Village Savings & Loan Groups (VSLA) | PortalPay',
  metaDescription:
    'Collect meeting contributions via QR, track loans and repayments, issue share-out receipts, and split stipends for treasurers. Offline-first with audit-ready ledgers.',
  keywords: [
    'VSLA payments',
    'village savings groups',
    'rotating savings',
    'loan and repayment tracking',
    'share-out receipts',
    'meeting fees QR',
    'offline ledger',
    'treasurer stipends',
    'developing countries finance',
  ],

  // Hero Section
  heroHeadline: 'Transparent Savings, Loans, and Share-Outs',
  heroSubheadline:
    'Collect contributions and meeting fees via QR, manage loans and penalties with itemized receipts, and export audit-ready ledgers—online or offline.',
  heroCTA: {
    primary: 'Set Up Your Group',
    primaryLink: '/admin',
    secondary: 'View Community Finance Presets',
    secondaryLink: '/shop',
  },

  // Value Props
  painPoints: [
    'Paper ledgers are error-prone and hard to audit',
    'Cash handling risks during meetings and share-outs',
    'Disputes over loan balances, interest, and penalties',
    'No clear stipend splits for treasurers and secretaries',
    'Connectivity drops interrupt record keeping',
    'Difficult to provide transparent records to NGOs or banks',
  ],
  solutions: [
    'QR-based meeting contributions and fees with instant receipts',
    'Loan and repayment tracking with interest and penalties itemized',
    'Share-out events with member-level statements and audit exports',
    'Automated split payouts for treasurer/secretary stipends',
    'Offline-first tally; sync and reconcile when connectivity returns',
    'CSV/JSON ledger exports for partners and grant reporting',
  ],

  // Benefits
  benefits: [
    {
      icon: '💰',
      title: 'Pooled Savings via QR',
      description:
        'Collect contributions and meeting fees digitally with receipts tied to the member roster.',
      stat: 'Cut cash risks by 80%',
    },
    {
      icon: '🧮',
      title: 'Loan & Repayment Ledger',
      description:
        'Track principal, interest, penalties, and due dates per member with clear statements.',
      stat: 'Reduce disputes by 60%',
    },
    {
      icon: '🧾',
      title: 'Share-Out Receipts',
      description:
        'Generate member-level share-out receipts with transparent calculations and notes.',
      stat: 'Minutes, not days',
    },
    {
      icon: '🤝',
      title: 'Stipend Split Payouts',
      description:
        'Allocate a percentage of meeting fees to treasurer/secretary at settlement with statements.',
      stat: 'Zero manual reconciliation',
    },
    {
      icon: '📶',
      title: 'Offline First',
      description:
        'Record contributions and loans without connectivity; sync and reconcile later.',
      stat: '100% meeting continuity',
    },
    {
      icon: '📊',
      title: 'Audit-Ready Exports',
      description:
        'Provide transparent ledgers to NGOs, banks, and regulators as CSV/JSON.',
      stat: 'Trusted by partners',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 7000,
  competitorComparison: {
    'Legacy Processor': {
      processingFee: 0.029,
      flatFee: 0.3,
      monthlyFee: 25,
      annualSoftwareCost: 240,
    },
    'Bank Transfer': {
      processingFee: 0.012,
      flatFee: 0.2,
      monthlyFee: 5,
      annualSoftwareCost: 0,
    },
    'Mobile Money': {
      processingFee: 0.015,
      flatFee: 0.1,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
  },

  // Use Cases
  useCases: [
    {
      title: 'Weekly Meeting Contributions',
      description:
        'Members pay savings and meeting fees via QR; receipts are logged to the roster with notes.',
      example:
        '25 members contribute; treasurer sees a live tally and member receipts with meeting notes.',
      savings: 'Eliminates cash counting errors',
    },
    {
      title: 'Loan Issuance & Repayments',
      description:
        'Issue loans with interest terms and due dates; repayments auto-apply and itemize penalties if late.',
      example:
        'A $50 loan at 5% monthly is tracked; on repayment, interest and penalties are itemized on the receipt.',
      savings: 'Prevents ledger inconsistencies',
    },
    {
      title: 'Share-Out Event',
      description:
        'Run an annual share-out; members receive statements with clear calculations and payout history.',
      example:
        'Share-out statements are exported; NGO partner receives a ledger summary for reporting.',
      savings: 'Speeds up end-of-cycle accounting',
    },
  ],

  // Features
  industryFeatures: [
    'QR meeting fees and contributions',
    'Member roster with roles',
    'Loan issuance and repayment tracking',
    'Interest, penalties, and due dates',
    'Stipend split payouts for officers',
    'Offline tally and sync',
    'Audit-ready ledger exports',
  ],
  includedFeatures: [
    {
      name: 'Contribution QR',
      description: 'Collect savings and meeting fees with member-linked receipts.',
      usualCost: '$99/yr',
    },
    {
      name: 'Loan Ledger',
      description: 'Track principal, interest, penalties, and schedules by member.',
      usualCost: '$149/yr',
    },
    {
      name: 'Split Payouts',
      description: 'Automated stipends for treasurer and secretary at settlement.',
      usualCost: '$120/yr',
    },
    {
      name: 'Offline Mode',
      description: 'Record during connectivity drops; sync later.',
      usualCost: '$59/yr',
    },
    {
      name: 'Reports & Exports',
      description: 'CSV/JSON ledgers for partners and grant reporting.',
      usualCost: '$49/yr',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create your group profile and meeting schedule in /admin',
    'Add members and assign officer roles (treasurer, secretary)',
    'Configure contribution amounts, fees, and loan terms',
    'Set stipend split rules for officers',
    'Print QR cards for meetings and events',
    'Connect wallet for settlement payouts',
  ],

  // FAQ
  faqs: [
    {
      question: 'How are contributions recorded per member?',
      answer:
        'QR payments are linked to the roster. Receipts include member name, meeting date, and notes for transparency.',
      category: 'Contributions',
    },
    {
      question: 'Can we track loans with interest and penalties?',
      answer:
        'Yes. Define loan terms. Repayments itemize principal, interest, and penalties. Statements are exportable.',
      category: 'Loans',
    },
    {
      question: 'Do you support offline meetings?',
      answer:
        'Yes. Contributions and loan events can be recorded offline and reconciled when connectivity returns.',
      category: 'Offline',
    },
    {
      question: 'Can officer stipends be split automatically?',
      answer:
        'Configure split rules. Settlement distributes shares to treasurer/secretary with a statement.',
      category: 'Payouts',
    },
    {
      question: 'Are ledgers audit-ready?',
      answer:
        'All records can be exported as CSV/JSON for NGOs, banks, and regulators.',
      category: 'Reporting',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'QR contributions and share-out statements ended our ledger disputes. Partners praised the exports.',
      author: 'Grace N.',
      business: 'Uhuru VSLA – Western Kenya',
      savings: 'Saved 65% on fees',
    },
    {
      quote:
        'Officer stipends are automatic and transparent. Offline mode keeps meetings on track.',
      author: 'Carlos M.',
      business: 'Amanecer Savings Circle – Cusco',
    },
  ],

  // Related
  relatedIndustries: ['community-tailors', 'smallholder-farmers', 'community-radio-stations'],
  relatedUseCases: ['rotating-savings', 'loan-ledger', 'split-payments', 'offline-mode', 'audit-exports'],
};
