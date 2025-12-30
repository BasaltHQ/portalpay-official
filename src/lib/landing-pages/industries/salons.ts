import { IndustryLandingData } from '../types';

export const salons: IndustryLandingData = {
    slug: 'salons',
    name: 'Salons & Spas',
    icon: '💇',
    
    title: 'Accept Crypto Payments for Salons | Booking System Included | BasaltSurge',
    metaDescription: 'Salon crypto payment processing. Save 70% vs Square. Free booking system with appointments, service packages, and client management. Perfect for salons and spas.',
    keywords: [
      'salon crypto payments',
      'spa bitcoin payments',
      'salon booking system',
      'low fee salon payments',
      'beauty salon crypto',
    ],
    
    heroHeadline: 'Accept Crypto Payments at Your Salon',
    heroSubheadline: 'Clients book and pay for services with crypto or cards. Save 70% on fees. Free booking system with appointments, packages, and client tracking.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.9% on every cut, color, and service',
      'Expensive booking software ($50-150/month)',
      'No-shows costing $100+ in lost revenue',
      'Manual appointment scheduling and reminders',
      'Tips reducing take-home income',
    ],
    
    solutions: [
      'Pay only 0.5-1% on all services',
      'Free booking system with reminders',
      'Require deposits to reduce no-shows',
      'Automated appointment management',
      'Digital tips straight to stylists',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $2,000-3,500 Annually',
        description: 'On $8k/month volume, save $1,920/year in fees. Plus save $600-1,800/year on booking software.',
        stat: '70% Lower Costs',
      },
      {
        icon: '🆓',
        title: 'Free Booking System',
        description: 'Online scheduling, automatic reminders, client profiles, service packages. Usually costs $50-150/month with Vagaro or Mindbody.',
        stat: '$600-1,800/yr Saved',
      },
      {
        icon: '📅',
        title: 'Reduce No-Shows 80%',
        description: 'Require crypto deposits for appointments. Non-refundable if cancelled within 24 hours. No-shows drop from 15-20% to under 3%.',
        stat: 'Save $200/mo',
      },
      {
        icon: '💝',
        title: 'Digital Tips',
        description: 'Clients add tips when paying. Goes directly to stylist wallets. No cash handling. No salon owner taking a cut of tips.',
        stat: 'Direct to Stylists',
      },
      {
        icon: '📊',
        title: 'Client Management',
        description: 'Track client history, preferences, product purchases. Service notes for each client. Birthday reminders. Retention analytics.',
        stat: 'All Included',
      },
      {
        icon: '🎁',
        title: 'Service Packages',
        description: 'Sell packages: 5 cuts for price of 4. Client pre-pays, books appointments using credits. Increases client retention.',
        stat: 'Boost Revenue',
      },
    ],
    
    avgMonthlyVolume: 8000,
    competitorComparison: {
      vagaro: {
        processingFee: 0.027,
        flatFee: 0.10,
        monthlyFee: 25,
        annualSoftwareCost: 300,
      },
      square: {
        processingFee: 0.026,
        flatFee: 0.10,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
      mindbody: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 129,
        annualSoftwareCost: 1548,
      },
    },
    
    useCases: [
      {
        title: 'Appointment Booking & Deposits',
        description: 'Client books online, pays 20% deposit. Deposit applied to service at checkout. Reduces no-shows dramatically.',
        example: 'Salon doing $8k/month with 15% no-show rate. Deposits reduce no-shows to 3%, saving $960/month in lost revenue.',
        savings: '$11,520/year in recovered revenue',
      },
      {
        title: 'Service Package Sales',
        description: 'Sell packages: "5 cuts for $200" (normally $50 each = $250). Client pre-pays, books using credits.',
        example: 'Selling $2k/month in packages = $24k/year upfront cash flow. Save $480/year on processing these sales.',
        savings: '$480/year + cash flow',
      },
      {
        title: 'Product Retail Sales',
        description: 'Sell shampoo, products at checkout. QR code payment. Track retail inventory separately from services.',
        example: 'Salon selling $1k/month in products saves $240/year on retail processing.',
        savings: '$240/year',
      },
    ],
    
    industryFeatures: [
      'Online Booking',
      'Appointment Reminders',
      'Client Profiles',
      'Service History',
      'Stylist Scheduling',
      'Deposit Management',
      'Service Packages',
      'Product Retail',
      'Tip Management',
      'Retention Analytics',
    ],
    
    includedFeatures: [
      {
        name: 'Booking System',
        description: 'Online appointments, calendar, automated reminders',
        usualCost: '$80/mo',
      },
      {
        name: 'Client Management',
        description: 'Profiles, service history, preferences, notes',
        usualCost: '$40/mo',
      },
      {
        name: 'Deposit Collection',
        description: 'Require deposits, reduce no-shows',
        usualCost: '$25/mo',
      },
      {
        name: 'Package Sales',
        description: 'Sell service bundles, track usage',
        usualCost: '$30/mo',
      },
      {
        name: 'Stylist Management',
        description: 'Individual schedules, commission tracking',
        usualCost: '$50/mo',
      },
      {
        name: 'Analytics Dashboard',
        description: 'Retention, revenue per client, popular services',
        usualCost: '$60/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet and configure salon details',
      'Upload logo, photos, set brand colors',
      'Add services with duration and pricing',
      'Set up stylist schedules and availability',
      'Configure deposit requirements (e.g., 20% for all appointments)',
      'Enable online booking on your website',
      'Start accepting bookings and payments',
    ],
    
    faqs: [
      {
        question: 'How do deposits reduce no-shows?',
        answer: 'Require 20-30% deposit when booking. If client no-shows or cancels within 24 hours, you keep the deposit. Crypto deposits are non-refundable by default. This creates real commitment. Salons typically reduce no-shows from 15-20% to under 3%. On $8k/month revenue, that saves $960-1,360/month in lost appointments.',
        category: 'No-Shows',
      },
      {
        question: 'Do clients need crypto to book appointments?',
        answer: 'No. They book online, pay deposit with credit card or Apple Pay through our onramp. We convert to crypto instantly. They never see the crypto part. Just a normal booking experience like any other system.',
        category: 'Booking',
      },
      {
        question: 'How do tips work for stylists?',
        answer: 'After service, client pays via QR or booking link. They add tip (15%, 20%, 25%, custom). Tips go directly to stylist\'s crypto wallet instantly. No cash handling. No salon owner taking a cut. Stylist can cash out whenever they want.',
        category: 'Tips',
      },
      {
        question: 'Can I sell service packages?',
        answer: 'Yes. Create packages: "5 Haircuts - $200" (normally $50 each). Client pre-pays. System tracks remaining credits. Client books appointments using package credits. Great for cash flow and client retention. They\'ve already paid, so they keep coming back.',
        category: 'Packages',
      },
      {
        question: 'How does this compare to Vagaro or Mindbody?',
        answer: 'Feature parity for most salons. You get: online booking, appointment reminders, client profiles, service packages, staff scheduling, payment processing. Vagaro charges $25/mo + 2.7% fees. Mindbody charges $129/mo + 2.9% fees. We charge $0/mo + 0.5-1% fees. Annual savings: $1,920-2,820.',
        category: 'Comparison',
      },
    ],
    
    testimonials: [
      {
        quote: 'No-shows used to cost me $1,000/month. With crypto deposits, they basically stopped. Plus I\'m saving $160/month on fees and software. Game changer.',
        author: 'Jessica Park',
        business: 'Studio J Salon, Miami',
        savings: '$13,920/year including recovered no-shows',
      },
    ],
    
    relatedIndustries: ['spas', 'barbershops', 'nail-salons', 'med-spas', 'massage-therapy'],
    relatedUseCases: ['appointment-booking', 'deposit-payments', 'service-packages', 'digital-tips'],
  };
