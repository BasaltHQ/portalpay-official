import { IndustryLandingData } from '../types';

export const freelancers: IndustryLandingData = {
    slug: 'freelancers',
    name: 'Freelancers & Consultants',
    icon: '💼',
    
    title: 'Accept Crypto Payments as a Freelancer | International Clients | PortalPay',
    metaDescription: 'Freelancer crypto payment processing. Accept international payments instantly. 0.5-1% fee vs PayPal 5.4%. No bank account needed. Perfect for global freelancers.',
    keywords: [
      'freelancer crypto payments',
      'accept bitcoin freelance',
      'international freelance payments',
      'low fee freelance processor',
      'global payment gateway freelancer',
    ],
    
    heroHeadline: 'Accept Crypto Payments as a Freelancer',
    heroSubheadline: 'Get paid by international clients instantly. Save 80% on fees vs PayPal. No bank account needed. Invoice in any currency, receive in crypto.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying PayPal 5.4% + currency conversion on international payments',
      'Waiting 3-5 days for bank transfers',
      'Lost 3-5% on currency conversion fees',
      'Declined payments from certain countries',
      'Banking restrictions in your country',
    ],
    
    solutions: [
      'Pay only 0.5-1% on all invoices - save 80% vs PayPal',
      'Instant payment settlement in crypto',
      'No currency conversion fees ever',
      'Accept payments from any country',
      'Work without a traditional bank account',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $2,500-5,000 Annually',
        description: 'On $5k/month freelance income, save $2,640/year vs PayPal international fees. No currency conversion losses.',
        stat: '80% Lower Fees',
      },
      {
        icon: '🌍',
        title: 'True Global Payments',
        description: 'Accept from clients in US, Europe, Asia, Africa - anywhere. No country restrictions. No international transfer fees.',
        stat: 'Zero Borders',
      },
      {
        icon: '⚡',
        title: 'Instant Settlement',
        description: 'Get paid immediately, not in 3-5 days. Start next project right away. Cash flow that actually flows.',
        stat: 'Same-Day Access',
      },
      {
        icon: '🏦',
        title: 'No Bank Account Needed',
        description: 'Perfect for digital nomads, emerging markets, or anyone who wants banking freedom. Wallet = your account.',
        stat: 'Global Freedom',
      },
      {
        icon: '📄',
        title: 'Professional Invoicing',
        description: 'Send branded invoices with payment link. Client pays in one click. Automatic receipt. Track all invoices.',
        stat: 'All Included',
      },
      {
        icon: '💱',
        title: 'No FX Losses',
        description: 'Invoice in USD, EUR, or any currency. Client pays, you receive crypto value. No 3-5% currency conversion fees.',
        stat: 'Keep More Money',
      },
    ],
    
    avgMonthlyVolume: 5000,
    competitorComparison: {
      paypal: {
        processingFee: 0.054,
        flatFee: 0.30,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
      wise: {
        processingFee: 0.041,
        flatFee: 0.50,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
      stripe: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
    },
    
    useCases: [
      {
        title: 'International Client Payments',
        description: 'US client pays you in Nigeria, India, Philippines, anywhere. No bank transfer delays. No Western Union. Instant payment.',
        example: 'Developer in Philippines earning $5k/month from US clients saves $2,640/year vs PayPal fees.',
        savings: '$2,640/year',
      },
      {
        title: 'Project Milestones',
        description: 'Send invoice for each milestone. Client pays instantly. Release next phase immediately. Better cash flow.',
        example: 'Designer doing 10 projects/month at $500 each saves $240/year on processing.',
        savings: '$240/year',
      },
      {
        title: 'Retainer Agreements',
        description: 'Client pays monthly retainer in crypto. Auto-recurring or manual. Track time against retainer. Perfect for ongoing work.',
        example: 'Consultant with 5 retainer clients at $2k/month saves $1,320/year.',
        savings: '$1,320/year',
      },
    ],
    
    industryFeatures: [
      'Professional Invoicing',
      'Multi-Currency Support',
      'Automatic Receipts',
      'Client Portal',
      'Project Tracking',
      'Time Tracking',
      'Expense Management',
      'Tax Document Generation',
      'Client Database',
      'Payment Reminders',
    ],
    
    includedFeatures: [
      {
        name: 'Invoice System',
        description: 'Create, send, and track professional invoices',
        usualCost: '$15/mo',
      },
      {
        name: 'Client Portal',
        description: 'Clients view invoices, pay, download receipts',
        usualCost: '$20/mo',
      },
      {
        name: 'Multi-Currency',
        description: 'Invoice in any currency, no conversion fees',
        usualCost: '$10/mo',
      },
      {
        name: 'Project Management',
        description: 'Track projects, milestones, deliverables',
        usualCost: '$25/mo',
      },
      {
        name: 'Time Tracking',
        description: 'Log hours, generate timesheet reports',
        usualCost: '$15/mo',
      },
      {
        name: 'Tax Documents',
        description: 'Generate tax forms, annual summaries',
        usualCost: '$20/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet (or create new one in 2 minutes)',
      'Add your business details, logo, and branding',
      'Create client profiles with contact info',
      'Set up your service rates and invoice templates',
      'Send first invoice with embedded payment link',
      'Client pays in one click',
      'Receive payment instantly in wallet',
    ],
    
    faqs: [
      {
        question: 'How do international clients pay me?',
        answer: 'Send them an invoice with embedded payment link. They click the link, pay with credit card or crypto. Payment arrives in your wallet instantly. They can pay from anywhere in the world - no restrictions, no international fees.',
        category: 'Payments',
      },
      {
        question: 'Do clients need crypto to pay my invoices?',
        answer: 'No! Clients can pay with regular credit/debit card or Apple Pay. Our onramp converts to crypto instantly. They never see crypto - just a normal payment screen. You get the benefits (low fees, instant settlement, global access).',
        category: 'Clients',
      },
      {
        question: 'How much do I really save vs PayPal?',
        answer: 'PayPal international: 5.4% + 3-5% currency conversion = 8-10% total. On $5,000/month, that\'s $400-500/month ($4,800-6,000/year). PortalPay: 0.75% average = $37.50/month ($450/year). Annual savings: $4,350-5,550. Plus instant settlement instead of 3-5 day holds.',
        category: 'Savings',
      },
      {
        question: 'What if I don\'t have a bank account?',
        answer: 'You don\'t need one! This is perfect for: digital nomads without fixed residence, freelancers in countries with banking restrictions, anyone who wants independence from traditional banks. Payments go to your crypto wallet. Cash out to local currency when needed via any exchange.',
        category: 'Banking',
      },
      {
        question: 'Can I invoice in different currencies?',
        answer: 'Yes. Invoice in USD, EUR, GBP, or 150+ currencies. Client sees their currency. When they pay, you receive equivalent in crypto stablecoins. No currency conversion fees (which typically cost 3-5%). Better rate than banks or PayPal.',
        category: 'Currency',
      },
    ],
    
    testimonials: [
      {
        quote: 'I\'m a developer in India working with US clients. PayPal was taking 8% total with fees and conversion. PortalPay costs me under 1%. I\'m keeping $350 more per month.',
        author: 'Raj Patel',
        business: 'Full-Stack Developer, Mumbai',
        savings: '$4,200/year',
      },
    ],
    
    relatedIndustries: ['consultants', 'designers', 'developers', 'writers', 'agencies'],
    relatedUseCases: ['international-payments', 'instant-settlement', 'no-bank-account', 'low-fees'],
  };
