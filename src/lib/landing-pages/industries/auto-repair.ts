import { IndustryLandingData } from '../types';

export const autoRepair: IndustryLandingData = {
  slug: 'auto-repair',
  name: 'Auto Repair Shops',
  icon: '🛠️',

  title: 'Accept Crypto Payments for Auto Repair | Lower Fees | PortalPay',
  metaDescription:
    'Auto repair crypto payment processing with 50-70% lower fees than card processors. Instant settlement, approve-by-text estimates, deposit holds, and modern POS for service shops.',
  keywords: [
    'auto repair crypto payments',
    'mechanic bitcoin payments',
    'auto shop payment processor',
    'estimate approvals text',
    'low fee service pos',
  ],

  heroHeadline: 'Lower-Fee Payments for Auto Repair',
  heroSubheadline:
    'Collect deposits, approve estimates by text, and get paid at pickup. Customers can pay with card/onramp or crypto with instant settlement and 50-70% lower fees.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
  secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  painPoints: [
    'High card processing fees on large repair tickets',
    'Chargebacks on disputed work orders',
    'Unapproved estimates slowing down workflow',
    'Parts prepayment and deposit handling',
    'Manual signatures and paper records',
  ],

  solutions: [
    'Pay only 0.5-1% per transaction',
    'On-chain final settlement reduces chargebacks',
    'Approve estimates via text with digital signatures',
    'Collect deposits or parts prepayment instantly',
    'Automatic receipts and work order records',
  ],

  benefits: [
    {
      icon: '💰',
      title: 'Lower Processing Costs',
      description:
        'Typical auto shops save 50-70% on payment fees vs legacy processors, especially on high-ticket repairs.',
      stat: '0.5-1% Fees',
    },
    {
      icon: '📝',
      title: 'Estimate Approval by Text',
      description:
        'Send customers an estimate link. They review, sign, and pay deposit from their phone—no waiting at counter.',
      stat: 'Faster Turnaround',
    },
    {
      icon: '🔒',
      title: 'Final Settlement',
      description:
        'Crypto payments settle instantly and are final, reducing exposure to chargebacks on completed service.',
      stat: 'No Chargebacks',
    },
  ],

  avgMonthlyVolume: 15000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    {
      title: 'Diagnostics + Repair Deposit',
      description:
        'Customer approves diagnostic fee and pays a deposit via link before work starts. Parts ordered immediately.',
      example:
        'Shop taking $500 deposits for major repairs eliminates cancellations and parts restocking headaches.',
      savings: '50-70% fee reduction on deposits',
    },
    {
      title: 'Approve-by-Text Work Orders',
      description:
        'Send detailed estimate with line items. Customer signs from phone; work order moves to active queue automatically.',
      example:
        'Reduce counter time and phone-tag. Faster approvals keep bays full and techs working.',
    },
    {
      title: 'Fleet Service Billing',
      description:
        'Manage fleet clients with consolidated invoicing and low-fee payments. Track vehicle history and approvals.',
      example:
        'Fleet client with 12 vehicles pays monthly with onramp card or stablecoin—no bank wires needed.',
    },
  ],

  industryFeatures: [
    'Estimate Builder',
    'Approve-by-Text',
    'Digital Signatures',
    'Deposit & Holds',
    'Parts Prepayment',
    'Vehicle History',
    'Tech Assignment',
    'Photo Attachments',
    'Work Order Queue',
    'Customer Notifications',
  ],

  includedFeatures: [
    { name: 'Estimate Builder', description: 'Create line-item estimates with parts, labor, taxes', usualCost: '$40/mo' },
    { name: 'Text Approvals', description: 'Send links for review, signature, and deposit collection', usualCost: '$30/mo' },
    { name: 'Deposit & Holds', description: 'Collect deposits and hold funds against work orders', usualCost: '$25/mo' },
    { name: 'Work Order Queue', description: 'Track status from diagnostics to completed pickup', usualCost: '$35/mo' },
  ],

  setupSteps: [
    'Create account and set up your shop profile',
    'Add labor rates, taxes, and standard service items',
    'Build estimate templates for common repairs',
    'Enable text approvals and deposit collection',
    'Import customer list and vehicle history if available',
    'Start sending estimates and collecting payments',
  ],

  faqs: [
    {
      question: 'Do customers need crypto to pay?',
      answer:
        'No. Customers can pay by card, Apple Pay, or Google Pay via onramp, or directly with crypto if they prefer. You still get low fees.',
      category: 'Payments',
    },
    {
      question: 'Can I collect deposits safely?',
      answer:
        'Yes. Collect deposits or place holds when estimates are approved. Crypto settlement is final, reducing chargeback risk.',
      category: 'Deposits',
    },
    {
      question: 'How are signatures handled?',
      answer:
        'Customers review the estimate and sign digitally on their phone. The signed record is attached to the work order automatically.',
      category: 'Compliance',
    },
  ],

  testimonials: [
    {
      quote:
        'Approvals by text and deposits upfront changed our workflow. We cut phone time and saved thousands on fees.',
      author: 'Daniel R.',
      business: 'Precision Auto, Denver',
      savings: '50-70% fees saved',
    },
  ],

  relatedIndustries: ['construction', 'electricians', 'plumbers', 'logistics', 'car-dealerships'],
  relatedUseCases: ['estimate-approvals', 'deposits', 'stablecoin-settlement', 'digital-signature'],
};
