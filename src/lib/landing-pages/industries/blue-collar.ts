import { IndustryLandingData } from '../types';

/**
 * Blue-collar industries bundle
 * Exports 12 IndustryLandingData objects for local service trades
 */

export const plumbingServices: IndustryLandingData = {
  slug: 'plumbing-services',
  name: 'Plumbing Services',
  icon: '🚰',

  title: 'Accept Crypto Payments for Plumbing Services | PortalPay',
  metaDescription:
    'Plumbing services crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: [
    'plumbing crypto payments',
    'plumber bitcoin payments',
    'plumbing payment processor',
    'home services pos',
    'low fee payments',
  ],

  heroHeadline: 'Accept Crypto Payments for Plumbing Services',
  heroSubheadline:
    'Save 50-70% on fees vs traditional processors. QR code checkout, instant settlement, and modern POS features built for plumbing.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'See Pricing',
    secondaryLink: '/terminal',
  },

  painPoints: [
    'High processing fees on emergency calls and large invoices',
    'Chargebacks and disputes on completed service',
    'Upfront deposits for parts and special orders',
    'Manual paperwork and signatures',
    'Complex hardware setup for mobile teams',
  ],

  solutions: [
    'Pay only 0.5-1% per transaction',
    'On-chain final settlement reduces chargebacks',
    'Simple QR link for deposits and approvals',
    'Digital receipts and signatures from any device',
    'No special hardware required',
  ],

  benefits: [
    { icon: '💰', title: 'Lower Processing Fees', description: 'Typical savings of 50-70% vs legacy card processors.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Customers scan a QR and pay in seconds—even on-site.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce chargeback exposure with on-chain settlement.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 12000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Emergency Service QR Checkout', description: 'Generate a QR invoice on-site and get paid instantly.', example: 'Eliminate paper invoicing and long settlement times.' },
    { title: 'Deposit Collection', description: 'Collect deposits for parts orders upfront via link.', example: 'Avoid cancellations and restocking issues.' },
    { title: 'Recurring Maintenance Plans', description: 'Offer discounted service plans paid by stablecoin or onramp.', example: 'Reduce churn with scheduled checkups.' },
  ],

  industryFeatures: [
    'QR Code Payments',
    'Instant Settlement',
    'Simple Dashboard',
    'Real-Time Analytics',
    'Multi-Device Sync',
    'Inventory Basics',
    'Customer Loyalty',
    'Exportable Reports',
  ],

  includedFeatures: [
    { name: 'QR Checkout', description: 'One-tap QR payment flow customers already understand', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Real-time reporting on sales, items, and peak periods', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Use multiple tablets and phones with sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'Export CSV reports for tax/accounting', usualCost: '$15/mo' },
  ],

  setupSteps: [
    'Create your free PortalPay account',
    'Add business profile and logo',
    'Set up service items and rates',
    'Share QR codes and payment links',
    'Start accepting payments immediately',
  ],

  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. Customers can pay by card/Apple Pay via onramp, or directly with crypto if they prefer. You still get low fees.', category: 'Payments' },
    { question: 'Do I need new hardware?', answer: 'No. Use any phone or tablet and display QR codes. Works anywhere with internet.', category: 'Hardware' },
    { question: 'How do refunds work?', answer: 'Issue refunds from the dashboard for both onramp and crypto payments.', category: 'Operations' },
  ],

  testimonials: [
    { quote: 'Instant QR payments reduced our admin time and fees substantially.', author: 'Owner', business: 'RapidFlow Plumbing', savings: '50-70% fees saved' },
  ],

  relatedIndustries: ['hardware-shops', 'mobile-phone-repair', 'auto-repair'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const hvacServices: IndustryLandingData = {
  slug: 'hvac-services',
  name: 'HVAC Services',
  icon: '❄️',

  title: 'Accept Crypto Payments for HVAC Services | PortalPay',
  metaDescription:
    'HVAC services crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: [
    'hvac crypto payments',
    'heating cooling bitcoin payments',
    'hvac payment processor',
    'home services pos',
    'low fee payments',
  ],

  heroHeadline: 'Accept Crypto Payments for HVAC Services',
  heroSubheadline:
    'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features for heating and cooling.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: [
    'High fees on large install invoices',
    'Chargebacks on completed work',
    'Deposits needed for equipment orders',
    'Busy season scheduling and approvals',
    'Hardware costs for mobile techs',
  ],
  solutions: [
    'Pay only 0.5-1% per transaction',
    'Final settlement on-chain reduces chargebacks',
    'Deposit collection via QR or link',
    'Digital signatures for approvals',
    'No special hardware required',
  ],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save 50-70% vs legacy processors on similar volume.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'QR link payments anywhere, including on-site.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes with irrevocable settlement.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 18000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Seasonal Tune-Ups', description: 'Offer low-fee QR checkout for tune-ups and filters.', example: 'Faster queues in peak season.' },
    { title: 'Equipment Deposits', description: 'Collect deposits for furnace/AC units via link.', example: 'Order parts instantly without risk.' },
    { title: 'Maintenance Plans', description: 'Stablecoin or onramp billing for recurring plans.', example: 'Predictable revenue and lower costs.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Simple Dashboard', 'Real-Time Analytics', 'Multi-Device Sync', 'Customer Loyalty', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR payment flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Real-time reporting on services and peak periods', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Use multiple tech devices with sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'Export CSV reports', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Configure service items', 'Share QR codes/links', 'Start accepting payments'],
  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. They can pay via onramp card/Apple Pay or directly with crypto.' },
    { question: 'Mobile friendly?', answer: 'Yes. Works on any phone or tablet.' },
    { question: 'Refunds?', answer: 'Issue refunds from the dashboard.' },
  ],
  testimonials: [{ quote: 'Deposits by QR sped up installs and cut fees significantly.', author: 'Manager', business: 'Peak Comfort HVAC', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'auto-repair', 'retail'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const electricalContractors: IndustryLandingData = {
  slug: 'electrical-contractors',
  name: 'Electrical Contractors',
  icon: '🔌',

  title: 'Accept Crypto Payments for Electrical Contractors | PortalPay',
  metaDescription:
    'Electrical contractors crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['electrician crypto payments', 'electrical bitcoin payments', 'contractor payment processor', 'home services pos', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for Electrical Contractors',
  heroSubheadline: 'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features built for electrical pros.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High card fees on panel upgrades', 'Chargebacks on completed wiring jobs', 'Deposits for materials and EV charger installs', 'Manual signatures and paper approvals', 'Mobile device hardware costs'],
  solutions: ['0.5-1% per transaction', 'Final on-chain settlement reduces chargebacks', 'Deposit links with QR checkout', 'Digital receipts and signatures', 'No special hardware needed'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save 50-70% on processing costs.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'On-site QR payments.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes after completed work.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 15000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Panel Upgrades', description: 'Collect deposits with QR links.', example: 'Order materials immediately with low fees.' },
    { title: 'EV Charger Installs', description: 'QR invoice at job completion.', example: 'Fast payment on-site from customer phone.' },
    { title: 'Recurring Maintenance', description: 'Stablecoin billing for building maintenance.', example: 'Lower costs than wire transfers.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Multi-Device Sync', 'Exportable Reports', 'Simple Dashboard', 'Real-Time Analytics'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'One-tap QR payments', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Service reporting and trends', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Teams use multiple devices', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV exports for accounting', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Set up items/services', 'Share QR/links', 'Start accepting payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Customers can pay via onramp card/Apple Pay or directly with crypto.' },
    { question: 'Hardware?', answer: 'Any smartphone or tablet is sufficient.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard for all payments.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Panel upgrade deposits via QR simplified our workflow.', author: 'Owner', business: 'BrightSpark Electrical', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'auto-repair', 'retail'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const roofingContractors: IndustryLandingData = {
  slug: 'roofing-contractors',
  name: 'Roofing Contractors',
  icon: '🏠',

  title: 'Accept Crypto Payments for Roofing Contractors | PortalPay',
  metaDescription:
    'Roofing contractors crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['roofing crypto payments', 'roofer bitcoin payments', 'contractor payment processor', 'home services pos', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for Roofing Contractors',
  heroSubheadline: 'Save 50-70% on fees vs card processors. QR checkout, instant settlement, and modern POS features built for roofing.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High fees on large deposits', 'Risk of chargebacks after completion', 'Upfront material costs and scheduling', 'Manual contracts and signatures', 'Slow settlement on bank rails'],
  solutions: ['0.5-1% per transaction', 'Final settlement on-chain', 'Deposit collection via QR/links', 'Digital signatures and receipts', 'No special hardware'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save 50-70% on processing.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Instant deposit collection via QR.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes and chargebacks.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 25000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Deposit Collection', description: 'Collect job deposits via link.', example: 'Move faster on materials ordering.' },
    { title: 'On-Site Completion', description: 'QR invoice at job finish.', example: 'Customer pays instantly from phone.' },
    { title: 'Seasonal Promotions', description: 'Offer discounts with low-fee payments.', example: 'Increase acceptance for off-peak work.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Simple Dashboard', 'Real-Time Analytics', 'Multi-Device Sync', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Job performance metrics', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Team devices with sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV reports', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Configure service items', 'Share QR codes/links', 'Start accepting payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports card/Apple Pay/Google Pay.' },
    { question: 'Hardware?', answer: 'Any smartphone or tablet works.' },
    { question: 'Refunds?', answer: 'Process refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Deposits by QR and instant settlement improved cash flow.', author: 'Owner', business: 'Summit Roofing', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'real-estate', 'auto-repair'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const landscapingServices: IndustryLandingData = {
  slug: 'landscaping-services',
  name: 'Landscaping Services',
  icon: '🌿',

  title: 'Accept Crypto Payments for Landscaping Services | PortalPay',
  metaDescription:
    'Landscaping services crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['landscaping crypto payments', 'landscaper bitcoin payments', 'yard care payment processor', 'home services pos', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for Landscaping Services',
  heroSubheadline: 'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features made for landscapers.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High card fees on recurring plans', 'Disputes after services are rendered', 'Deposits for sod & materials', 'Manual scheduling and paper receipts', 'Hardware costs for field teams'],
  solutions: ['0.5-1% per transaction', 'Final on-chain settlement', 'Deposit collection via link', 'Digital receipts and signatures', 'No special hardware'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save significant fees on recurring and project work.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'QR payments on-site or via link.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes post-service.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 8000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Monthly Lawn Care', description: 'QR checkout at service or link billing.', example: 'Low-fee recurring payments.' },
    { title: 'Tree Trimming Deposits', description: 'Collect deposits to schedule heavy work.', example: 'Avoid cancellations and no-shows.' },
    { title: 'Sod Installation', description: 'Deposit via link before ordering materials.', example: 'Confident cash flow management.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Real-Time Analytics', 'Multi-Device Sync', 'Customer Loyalty', 'Exportable Reports', 'Simple Dashboard'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Service and revenue insights', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Crew device sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV reports for accounting', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Add service items/plans', 'Share QR codes and links', 'Accept payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Customers can pay via onramp by card/Apple Pay/Google Pay or directly with crypto.' },
    { question: 'Mobile-friendly?', answer: 'Yes. Works anywhere with internet.' },
    { question: 'Refunds?', answer: 'Issue refunds from dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Recurring plans with low fees boosted margins.', author: 'Owner', business: 'GreenWave Landscaping', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'retail', 'auto-repair'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const generalContractors: IndustryLandingData = {
  slug: 'general-contractors',
  name: 'General Contractors',
  icon: '🏗️',

  title: 'Accept Crypto Payments for General Contractors | PortalPay',
  metaDescription:
    'General contractors crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['general contractor crypto payments', 'construction bitcoin payments', 'contractor payment processor', 'home services pos', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for General Contractors',
  heroSubheadline: 'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features made for contractors.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High fees on large deposits', 'Chargebacks on completed milestones', 'Upfront material costs', 'Manual signatures and approvals', 'Slow settlement via bank rails'],
  solutions: ['0.5-1% per transaction', 'Final on-chain settlement', 'Deposit collection via QR/links', 'Digital signatures and receipts', 'No special hardware'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save materially on deposits/milestones.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Collect payments instantly via QR.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce dispute risk.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 45000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Project Deposits', description: 'Collect deposits upfront via link.', example: 'Order materials confidently.' },
    { title: 'Milestone Billing', description: 'QR invoice at milestone completion.', example: 'Reduce admin and settlement delays.' },
    { title: 'Permit & Fees', description: 'Collect smaller fees digitally.', example: 'Track all line items and receipts.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Simple Dashboard', 'Real-Time Analytics', 'Multi-Device Sync', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Project revenue insights', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Team device sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV reports', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Configure items & milestones', 'Share QR and links', 'Accept payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports card/Apple Pay/Google Pay.' },
    { question: 'Hardware?', answer: 'Any smartphone or tablet works.' },
    { question: 'Refunds?', answer: 'Process refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Milestone billing with low fees improved cash flow.', author: 'Owner', business: 'BuildRight Contractors', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'real-estate', 'retail'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const carpentry: IndustryLandingData = {
  slug: 'carpentry',
  name: 'Carpentry',
  icon: '🪚',

  title: 'Accept Crypto Payments for Carpentry | PortalPay',
  metaDescription:
    'Carpentry services crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['carpentry crypto payments', 'carpenter bitcoin payments', 'home services payment processor', 'pos for carpenters', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for Carpentry',
  heroSubheadline: 'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features for carpentry.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High fees on custom projects', 'Chargebacks after installation', 'Deposits for materials', 'Manual paper invoicing', 'Hardware costs for mobile teams'],
  solutions: ['0.5-1% per transaction', 'On-chain final settlement', 'Deposit links and QR checkout', 'Digital receipts and signatures', 'No special hardware'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save on high-ticket custom work.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Instant deposits via QR.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes post-installation.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 12000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Custom Cabinets', description: 'Collect deposits via link.', example: 'Order materials immediately.' },
    { title: 'On-Site Completion', description: 'QR invoice at job finish.', example: 'Customer pays from phone instantly.' },
    { title: 'Recurring Maintenance', description: 'Stablecoin billing for upkeep.', example: 'Predictable revenue with lower fees.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Simple Dashboard', 'Multi-Device Sync', 'Exportable Reports', 'Real-Time Analytics'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'One-tap QR payment flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Revenue and item insights', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Team devices with sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV reports', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Add service items', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports card/Apple Pay/Google Pay.' },
    { question: 'Hardware?', answer: 'Any smartphone or tablet works.' },
    { question: 'Refunds?', answer: 'Process refunds from dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Deposits by QR made custom jobs flow smoothly.', author: 'Owner', business: 'PrimeWood Carpentry', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'retail', 'auto-repair'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const painters: IndustryLandingData = {
  slug: 'painters',
  name: 'Painters',
  icon: '🎨',

  title: 'Accept Crypto Payments for Painters | PortalPay',
  metaDescription:
    'Painting services crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['painters crypto payments', 'painting bitcoin payments', 'home services payment processor', 'pos for painters', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for Painters',
  heroSubheadline: 'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features for painting services.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High fees on project deposits', 'Disputes after completion', 'Material deposits for paint and supplies', 'Manual invoicing and signatures', 'Hardware costs for crews'],
  solutions: ['0.5-1% per transaction', 'Final settlement on-chain', 'Deposit collection via QR/link', 'Digital receipts and signatures', 'No special hardware'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save significantly on project billing.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Instant deposit collection via QR.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce exposure to disputes.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 10000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Interior Room Paint', description: 'QR invoice on completion.', example: 'Fast payment from customer phone.' },
    { title: 'Exterior Deposit', description: 'Collect deposits upfront via link.', example: 'Order supplies and schedule confidently.' },
    { title: 'Whole House Projects', description: 'Milestone billing with QR checkout.', example: 'Reduce admin with digital receipts.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Simple Dashboard', 'Multi-Device Sync', 'Exportable Reports', 'Real-Time Analytics'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Project and revenue insights', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Crew devices with sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV reports', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Configure services', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports card/Apple Pay/Google Pay.' },
    { question: 'Hardware?', answer: 'Any smartphone or tablet works.' },
    { question: 'Refunds?', answer: 'Process refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Deposits and low fees improved our margins.', author: 'Owner', business: 'ColorCraft Painting', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'retail', 'auto-repair'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const pestControl: IndustryLandingData = {
  slug: 'pest-control',
  name: 'Pest Control',
  icon: '🐜',

  title: 'Accept Crypto Payments for Pest Control | PortalPay',
  metaDescription:
    'Pest control services crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['pest control crypto payments', 'exterminator bitcoin payments', 'home services payment processor', 'pos for pest control', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for Pest Control',
  heroSubheadline: 'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features for pest control.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High fees on recurring quarterly plans', 'Disputes after service completion', 'Manual invoicing for small jobs', 'Hardware costs for field techs', 'Slow settlement times'],
  solutions: ['0.5-1% per transaction', 'Final settlement on-chain', 'QR payments on-site or via link', 'Digital receipts and signatures', 'No special hardware'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save on recurring maintenance billing.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Instant payments via QR.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce chargeback exposure.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 6000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Ant Treatment', description: 'QR checkout on-site.', example: 'Quick payments at completion.' },
    { title: 'Termite Inspection', description: 'Link billing with digital receipts.', example: 'Simplify small job invoicing.' },
    { title: 'Quarterly Service Plans', description: 'Stablecoin or onramp billing for recurring plans.', example: 'Predictable revenue and lower fees.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Simple Dashboard', 'Real-Time Analytics', 'Multi-Device Sync', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Service and revenue insights', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Tech devices with sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV reports', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Configure services', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Customers can pay via onramp card/Apple Pay/Google Pay or directly with crypto.' },
    { question: 'Hardware?', answer: 'Any smartphone or tablet works.' },
    { question: 'Refunds?', answer: 'Process refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Recurring plans with low fees boosted margins.', author: 'Owner', business: 'Shield Pest Control', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'retail', 'mobile-phone-repair'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const locksmiths: IndustryLandingData = {
  slug: 'locksmiths',
  name: 'Locksmiths',
  icon: '🔑',

  title: 'Accept Crypto Payments for Locksmiths | PortalPay',
  metaDescription:
    'Locksmith services crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['locksmith crypto payments', 'locksmith bitcoin payments', 'home services payment processor', 'pos for locksmiths', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for Locksmiths',
  heroSubheadline: 'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features for locksmiths.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High fees on emergency calls', 'Disputes on completed unlocks', 'Manual invoicing for small jobs', 'Hardware costs for mobile techs', 'Slow settlement times'],
  solutions: ['0.5-1% per transaction', 'Final settlement on-chain', 'QR payments on-site or via link', 'Digital receipts and signatures', 'No special hardware'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save significantly on small jobs and emergency calls.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Instant payments via QR on-site.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes after service.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 5000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Emergency Lockout', description: 'QR checkout at completion.', example: 'Customer pays instantly from phone.' },
    { title: 'Rekey & Smart Locks', description: 'Link billing with digital receipts.', example: 'Track services and reduce admin.' },
    { title: 'Business Clients', description: 'Low-fee payments for contracted work.', example: 'Stablecoin settlement without wires.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Simple Dashboard', 'Real-Time Analytics', 'Multi-Device Sync', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Service and revenue insights', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Tech devices with sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV reports', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Configure services', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Customers can pay via onramp card/Apple Pay/Google Pay or directly with crypto.' },
    { question: 'Hardware?', answer: 'Any smartphone or tablet works.' },
    { question: 'Refunds?', answer: 'Process refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'On-site QR payments made emergency calls seamless.', author: 'Owner', business: 'KeyMasters Locksmith', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'retail', 'mobile-phone-repair'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const applianceRepair: IndustryLandingData = {
  slug: 'appliance-repair',
  name: 'Appliance Repair',
  icon: '🔧',

  title: 'Accept Crypto Payments for Appliance Repair | PortalPay',
  metaDescription:
    'Appliance repair crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['appliance repair crypto payments', 'repair bitcoin payments', 'home services payment processor', 'pos for appliance repair', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for Appliance Repair',
  heroSubheadline: 'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features for appliance repair.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High fees on small diagnostics and larger repairs', 'Disputes after service completion', 'Manual invoicing and receipts', 'Hardware costs for field techs', 'Slow settlement via bank rails'],
  solutions: ['0.5-1% per transaction', 'Final settlement on-chain', 'QR payments on-site or via link', 'Digital receipts and signatures', 'No special hardware'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save across diagnostics and repair tickets.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Instant payments via QR.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes after repairs.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 7000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Diagnostic Visits', description: 'QR checkout on-site.', example: 'Quick payments for small jobs.' },
    { title: 'Part Replacement', description: 'Link deposits for parts.', example: 'Order parts immediately with low fees.' },
    { title: 'Business Clients', description: 'Stablecoin billing for maintenance contracts.', example: 'Avoid wires and delays.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Simple Dashboard', 'Real-Time Analytics', 'Multi-Device Sync', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Service and revenue insights', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Tech devices with sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV reports', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Configure services', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Customers can pay via onramp card/Apple Pay/Google Pay or directly with crypto.' },
    { question: 'Hardware?', answer: 'Any smartphone or tablet works.' },
    { question: 'Refunds?', answer: 'Process refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Diagnostics and repairs run smoother with QR.', author: 'Owner', business: 'FixRight Appliances', savings: '50-70% fees saved' }],
  relatedIndustries: ['hardware-shops', 'retail', 'mobile-phone-repair'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};

export const cleaningServices: IndustryLandingData = {
  slug: 'cleaning-services',
  name: 'Cleaning Services',
  icon: '🧼',

  title: 'Accept Crypto Payments for Cleaning Services | PortalPay',
  metaDescription:
    'Cleaning services crypto payment processing with lower fees, instant settlement, and modern POS features. Switch from card processors and save.',
  keywords: ['cleaning services crypto payments', 'cleaners bitcoin payments', 'home services payment processor', 'pos for cleaners', 'low fee payments'],

  heroHeadline: 'Accept Crypto Payments for Cleaning Services',
  heroSubheadline: 'Save 50-70% on fees vs traditional processors. QR checkout, instant settlement, and modern POS features for cleaning businesses.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },

  painPoints: ['High fees on recurring weekly/monthly invoices', 'Disputes after completed cleans', 'Manual invoicing and receipts', 'Hardware costs for mobile teams', 'Slow settlement via bank rails'],
  solutions: ['0.5-1% per transaction', 'Final settlement on-chain', 'QR payments on-site or via link', 'Digital receipts and signatures', 'No special hardware'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save significantly on recurring billing.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Instant payments via QR.', stat: '10s Checkout' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes post-service.', stat: 'No Chargebacks' },
  ],

  avgMonthlyVolume: 8000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.10, monthlyFee: 0, annualSoftwareCost: 0 },
    clover: { processingFee: 0.023, flatFee: 0.10, monthlyFee: 60, annualSoftwareCost: 720 },
    stripe: { processingFee: 0.029, flatFee: 0.30, monthlyFee: 0, annualSoftwareCost: 0 },
  },

  useCases: [
    { title: 'Move-Out Cleaning', description: 'QR checkout at completion.', example: 'Customer pays instantly.' },
    { title: 'Weekly Cleaning', description: 'Link billing for recurring plans.', example: 'Predictable revenue with lower fees.' },
    { title: 'Deep Cleaning', description: 'QR payments for premium services.', example: 'Digital receipts and records.' },
  ],

  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Simple Dashboard', 'Real-Time Analytics', 'Multi-Device Sync', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Service and revenue insights', usualCost: '$40/mo' },
    { name: 'Multi-Device', description: 'Team devices with sync', usualCost: '$60/mo' },
    { name: 'Export', description: 'CSV reports', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile', 'Configure services', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Customers can pay via onramp card/Apple Pay/Google Pay or directly with crypto.' },
    { question: 'Hardware?', answer: 'Any smartphone or tablet works.' },
    { question: 'Refunds?', answer: 'Process refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Recurring plans with low fees boosted margins.', author: 'Owner', business: 'BrightClean Co.', savings: '50-70% fees saved' }],
  relatedIndustries: ['retail', 'hardware-shops', 'auto-repair'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'multi-device'],
};
