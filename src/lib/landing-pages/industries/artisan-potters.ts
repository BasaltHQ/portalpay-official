import { IndustryLandingData } from '../types';

export const artisanPotters: IndustryLandingData = {
  // Basics
  slug: 'artisan-potters',
  name: 'Artisan Potters',
  icon: '🫙',

  // SEO
  title: 'Crypto Payments for Artisan Potters | PortalPay',
  metaDescription:
    'Accept deposits for custom pottery, track kiln batches and glazing, tag materials to orders, and split payouts for studio assistants with ultra-low fees.',
  keywords: [
    'artisan pottery payments',
    'kiln batch tracking',
    'glaze and clay tagging',
    'custom order deposits',
    'studio assistant splits',
    'offline workshop sales',
    'craft markets developing countries',
  ],

  // Hero Section
  heroHeadline: 'From Clay to Client — Seamless Payments for Potters',
  heroSubheadline:
    'Take deposits for custom orders, tag materials and kiln batches to tickets, and settle split payouts for studio assistants automatically.',
  heroCTA: {
    primary: 'Open Your Studio',
    primaryLink: '/admin',
    secondary: 'Browse Craft Presets',
    secondaryLink: '/shop',
  },

  // Value Props
  painPoints: [
    'Unclear deposits and scope changes for custom pieces',
    'Material costs (clay, glaze, firing) not tracked to orders',
    'Kiln batch schedules cause communication gaps',
    'Manual payout splits with studio assistants/apprentices',
    'Cash handling at markets with no audit trail',
    'Connectivity drops in rural craft fairs',
  ],
  solutions: [
    'QR-based deposits tied to order tickets',
    'Material and firing tags attributed to each order',
    'Kiln batch scheduling with pickup notifications',
    'Split payouts to studio and assistants on settlement',
    'Offline sale capture at markets; sync when online',
    'Transparent receipts with itemized materials and labor',
  ],

  // Benefits
  benefits: [
    {
      icon: '💳',
      title: 'Custom Order Deposits',
      description:
        'Collect deposits via QR linked to order tickets with size, design, and delivery notes.',
      stat: 'Reduce cancellations by 40%',
    },
    {
      icon: '🧪',
      title: 'Material Tagging',
      description:
        'Attribute clay, glaze, and firing charges to each ticket for clear costs and margins.',
      stat: 'Stops 60% of margin leakage',
    },
    {
      icon: '🔥',
      title: 'Kiln Batch Scheduling',
      description:
        'Plan firing runs, auto-notify customers for pickups, and export batch logs.',
      stat: 'Improve on-time pickups by 35%',
    },
    {
      icon: '🤝',
      title: 'Assistant Split Payouts',
      description:
        'Define splits for glazing, trimming, and packaging work. Settlement distributes shares instantly.',
      stat: 'Eliminates weekly reconciliation',
    },
    {
      icon: '🪧',
      title: 'Market-Ready',
      description:
        'Sell at fairs with QR receipts that list materials and care instructions.',
      stat: 'Boost trust with buyers',
    },
    {
      icon: '📶',
      title: 'Offline First',
      description:
        'Record sales in low-connectivity areas. Sync and reconcile when back online.',
      stat: '100% continuity',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 4000,
  competitorComparison: {
    'Legacy Processor': {
      processingFee: 0.029,
      flatFee: 0.3,
      monthlyFee: 25,
      annualSoftwareCost: 240,
    },
    'Bank POS': {
      processingFee: 0.025,
      flatFee: 0.15,
      monthlyFee: 15,
      annualSoftwareCost: 120,
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
      title: 'Custom Dinnerware Set',
      description:
        'Collect a deposit and tag materials (stoneware clay, matte glaze) to the ticket. Schedule firing and pickup.',
      example:
        'Client pays $50 deposit; ticket shows materials and firing date; assistant shares calculated at settlement.',
      savings: 'Reduces disputes and rework',
    },
    {
      title: 'Craft Market Sales',
      description:
        'Sell bowls and vases at a weekend market. Receipts include care notes and material sources.',
      example:
        'Buyer scans QR for a medium bowl; receipt lists clay, glaze, and kiln batch reference for authenticity.',
      savings: 'Eliminates cash counting errors',
    },
    {
      title: 'Studio Assistant Splits',
      description:
        'Set split rules for trimming and glazing work. Settlement distributes shares automatically.',
      example:
        'Assistant receives 25% of glazing labor at settlement with a statement.',
      savings: 'Removes manual split paperwork',
    },
  ],

  // Features
  industryFeatures: [
    'Order tickets with deposits',
    'Clay/glaze/firing tagging',
    'Kiln batch scheduling and logs',
    'Assistant split payouts',
    'Offline sales capture and sync',
    'Care notes and authenticity receipts',
  ],
  includedFeatures: [
    {
      name: 'QR Deposits',
      description: 'Collect deposits tied to order tickets and materials.',
      usualCost: '$99/yr',
    },
    {
      name: 'Material Tagging',
      description: 'Attribute clay, glaze, and firing costs per order.',
      usualCost: '$79/yr',
    },
    {
      name: 'Split Payouts',
      description: 'Automatic distribution to studio assistants and apprentices.',
      usualCost: '$120/yr',
    },
    {
      name: 'Offline Mode',
      description: 'Capture sales in rural areas and sync later.',
      usualCost: '$59/yr',
    },
    {
      name: 'Batch & Care Exports',
      description: 'Export kiln logs and care notes as CSV/JSON.',
      usualCost: '$49/yr',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create your studio profile in /admin',
    'Add material presets for clay and glaze',
    'Configure kiln batch schedules',
    'Set split rules for assistants and apprentices',
    'Print QR tent cards for markets and studio',
    'Connect wallet for settlement payouts',
  ],

  // FAQ
  faqs: [
    {
      question: 'Can deposits be tied to specific materials?',
      answer:
        'Yes. Deposits and follow-up payments can itemize clay, glaze, and firing costs per ticket.',
      category: 'Deposits',
    },
    {
      question: 'Do you support kiln batch scheduling?',
      answer:
        'Add firing dates to tickets and export batch logs. Customers are notified when items are ready.',
      category: 'Scheduling',
    },
    {
      question: 'Can assistants receive automatic splits?',
      answer:
        'Define split rules for specific tasks. Settlement distributes shares with statements.',
      category: 'Payouts',
    },
    {
      question: 'Will this work at rural craft fairs?',
      answer:
        'Yes. Sales and approvals can be recorded offline and synced when connectivity returns.',
      category: 'Offline',
    },
    {
      question: 'Are small sales affordable to process?',
      answer:
        'Fees are 0.5–1% with no monthly charges, ideal for low-cost craft items.',
      category: 'Pricing',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Material tagging and kiln logs on receipts wowed our customers. Assistant splits are now automatic.',
      author: 'Zanele M.',
      business: 'Clay & Kiln Studio – Bulawayo',
      savings: 'Saved 64% on fees',
    },
    {
      quote:
        'Deposits and pickup notifications reduced cancellations and clutter.',
      author: 'Jibril A.',
      business: 'Sahel Pottery – Kano',
    },
  ],

  // Related
  relatedIndustries: ['hardware-shops', 'community-tailors', 'retail'],
  relatedUseCases: ['qr-deposits', 'split-payments', 'inventory-tagging', 'offline-mode'],
};
