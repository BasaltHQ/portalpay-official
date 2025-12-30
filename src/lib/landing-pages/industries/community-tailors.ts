import { IndustryLandingData } from '../types';

export const communityTailors: IndustryLandingData = {
  // Basics
  slug: 'community-tailors',
  name: 'Community Tailors',
  icon: '🧵',

  // SEO
  title: 'Crypto Payments for Community Tailors – QR Deposits, Job Tickets, Split Payouts',
  metaDescription:
    'Accept deposits and final payments via QR and crypto, track jobs with simple tickets, and auto-split payouts between shop owners and tailors. Built for home-based and micro tailors across Africa, South Asia, and Latin America.',
  keywords: [
    'tailor payments',
    'QR deposits',
    'crypto payments',
    'job tickets',
    'split payouts',
    'informal sector',
    'home-based tailors',
    'Africa',
    'South Asia',
    'Latin America',
  ],

  // Hero Section
  heroHeadline: 'QR Deposits and Crypto Checkout for Community Tailors',
  heroSubheadline:
    'Take deposits in seconds, tag jobs for easy tracking, and pay tailors fairly with automatic split payouts—even without a bank.',
  heroCTA: {
    primary: 'Create a Job Ticket',
    primaryLink: '/portal',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Cash deposits get lost and are hard to reconcile',
    'Job tickets are informal and easily misplaced',
    'Peak seasons (school uniforms, weddings) overwhelm manual workflows',
    'Owners struggle to pay tailors fairly and on time',
    'Connectivity is unreliable for digital tools',
  ],
  solutions: [
    'QR deposits linked to a job ticket ID',
    'Simple job tagging for measurements and delivery dates',
    'Auto split payouts between shop owner and tailors',
    'Offline tally mode with later reconciliation',
    'Unified ledger for cash and crypto payments',
  ],

  // Benefits
  benefits: [
    {
      icon: '💳',
      title: 'Reliable Deposits',
      description:
        'Accept deposits via QR or crypto—reduce cancellations and lost cash.',
      stat: 'Cut no-shows by ~20–30%',
    },
    {
      icon: '🏷️',
      title: 'Clear Job Tracking',
      description:
        'Tag payments to job tickets with measurements and delivery dates.',
    },
    {
      icon: '🤝',
      title: 'Fair Payouts',
      description:
        'Automatically split final payments between shop owner and assigned tailor.',
    },
    {
      icon: '📦',
      title: 'Faster Pickups',
      description:
        'Customers settle balances quickly with QR—reduce pickup delays.',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 800,
  competitorComparison: {
    'POS/Card Terminal': {
      processingFee: 2.5,
      flatFee: 0.1,
      monthlyFee: 20,
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
      title: 'School Uniform Season',
      description:
        'Generate deposit QR codes for uniform orders and tag jobs with delivery dates.',
      example:
        'Shop collects 30–50% deposits via QR; final balance paid on pickup.',
      savings: 'Reduces cancellations and improves cash flow',
    },
    {
      title: 'Wedding & Event Tailoring',
      description:
        'Track multiple garments per job ticket with measurements and schedule.',
      example:
        'Bridal party deposits per garment; final payments split to tailor and shop.',
    },
    {
      title: 'Home-Based Tailors',
      description:
        'Owners assign jobs to tailors and pay shares automatically upon completion.',
      example:
        'Owner keeps 40%, tailor receives 60% via auto split payout per job.',
    },
    {
      title: 'Offline Neighborhoods',
      description:
        'Record cash and pending payments offline; reconcile when connectivity returns.',
      example:
        'Evening reconciliation merges cash and crypto logs into one ledger.',
    },
  ],

  // Features
  industryFeatures: [
    'QR deposits and final payment links',
    'Job ticket tagging (ID, measurements, due date)',
    'Automatic split payouts to assigned tailors',
    'Cash + crypto unified ledger',
    'Offline tally and reconciliation',
    'Exports for co-op or tax records',
    'Mobile-first interface',
  ],
  includedFeatures: [
    {
      name: 'QR Code Generator',
      description:
        'Create scannable codes for deposits and final payments per job ticket.',
      usualCost: '$5–$15/mo elsewhere',
    },
    {
      name: 'Split Payouts',
      description:
        'Route percentages to shop owner and assigned tailors automatically.',
      usualCost: '$10–$30/mo elsewhere',
    },
    {
      name: 'Job Ticket Tags',
      description:
        'Attach job IDs, measurements, and delivery dates to payments.',
    },
    {
      name: 'Offline Tally',
      description: 'Record payments without connectivity and reconcile later.',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create or connect a wallet',
    'Add job ticket presets and measurement tags',
    'Configure split payout rules for tailors',
    'Display deposit QR codes and issue job tickets',
    'Track balances and release final payouts',
  ],

  // FAQ
  faqs: [
    {
      question: 'Do we need bank accounts?',
      answer:
        'No. You can accept crypto directly with a wallet and QR codes—no bank required.',
      category: 'Access',
    },
    {
      question: 'How are tailors paid fairly?',
      answer:
        'Set split rules; payouts route automatically when a job is completed.',
      category: 'Payouts',
    },
    {
      question: 'Can we operate during connectivity issues?',
      answer:
        'Yes. Use offline tally mode to record payments and reconcile later.',
      category: 'Operations',
    },
    {
      question: 'How do we manage peak seasons?',
      answer:
        'Use deposit QR codes and job tags to organize workloads and reduce cancellations.',
      category: 'Seasonality',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Deposits via QR reduced cancellations. Tailors get paid fairly without counting cash.',
      author: 'Fatima',
      business: 'Neighborhood Tailor Co-op – Lahore',
      savings: 'Cut no-shows by ~25%',
    },
    {
      quote:
        'Job tickets and split payouts made school uniform season manageable and transparent.',
      author: 'Jorge',
      business: 'Barrio Taller – Medellín',
    },
  ],

  // Related
  relatedIndustries: [
    'freelancers',
    'retail',
    'market-stall-vendors',
    'kirana-stores',
  ],
  relatedUseCases: ['qr-checkout', 'split-payouts', 'offline-tally', 'job-ticketing'],
};
