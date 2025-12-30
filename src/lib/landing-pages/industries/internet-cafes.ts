import { IndustryLandingData } from '../types';

export const internetCafes: IndustryLandingData = {
  // Basics
  slug: 'internet-cafes',
  name: 'Internet Cafés',
  icon: '🖥️',

  // SEO
  title: 'Crypto Payments for Internet Cafés | BasaltSurge',
  metaDescription:
    'Sell time vouchers via QR, manage printing and peripherals, track session usage, and split payouts for attendants. Offline-first with ultra-low fees.',
  keywords: [
    'internet cafe crypto',
    'time vouchers QR',
    'printing payments',
    'gaming station fees',
    'attendant split payouts',
    'offline session tracking',
    'developing markets internet cafe',
  ],

  // Hero
  heroHeadline: 'Tap-to-Start Sessions, QR to Pay — Simple.',
  heroSubheadline:
    'Prepaid time vouchers, consumables tracking, and instant split payouts to owners and attendants. Works even when the network is flaky.',
  heroCTA: {
    primary: 'Create Time Vouchers',
    primaryLink: '/admin',
    secondary: 'Browse Café Presets',
    secondaryLink: '/shop',
  },

  // Value Props
  painPoints: [
    'Manual timing for sessions and disputes over minutes used',
    'Cash handling for small prints and accessories',
    'No clear attribution for assistant tips and commissions',
    'Connectivity issues interrupting payment and session logging',
    'High fees eroding micro-transactions like 10–30 minute sessions',
  ],
  solutions: [
    'QR-based prepaid time vouchers with auto session start/stop',
    'Itemized printing, scanning, headset, and station add-ons',
    'Configurable splits for owner/attendant and station commissions',
    'Offline session logging and payment capture with sync on reconnect',
    'Transparent receipts suitable for schools and training centers',
  ],

  // Benefits
  benefits: [
    {
      icon: '⏱️',
      title: 'Prepaid Time Vouchers',
      description:
        'Sell 10/30/60 minute vouchers via QR with automatic session timing and pause/extend.',
      stat: 'Cut session disputes by 70%',
    },
    {
      icon: '🖨️',
      title: 'Consumables Tracking',
      description:
        'Charge per page, per scan, or per print job with simple add-ons linked to sessions.',
      stat: 'Reduce cash leakage by 60%',
    },
    {
      icon: '🤝',
      title: 'Split Payouts',
      description:
        'Share revenue between owner and attendants or station monitors automatically at settlement.',
      stat: 'Zero manual reconciliation',
    },
    {
      icon: '📶',
      title: 'Offline First',
      description:
        'Log sessions and payments even without connectivity. Sync and reconcile when back online.',
      stat: '100% continuity',
    },
    {
      icon: '🎮',
      title: 'Gaming & VIP Stations',
      description:
        'Set premium rates and bundles for gaming rigs, keyboards, and headsets.',
      stat: 'Boost ARPU by 25%',
    },
    {
      icon: '📈',
      title: 'Usage Analytics',
      description:
        'Export session summaries for training partners, schools, or NGOs.',
      stat: 'Minutes, not days',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 5000,
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
      title: 'Student Session Packs',
      description:
        'Sell discounted session bundles for students and trainees with auto-timing and usage history.',
      example:
        'Student buys 10x30min pack via QR; sessions auto-track; printing billed as add-ons.',
      savings: 'Removes cash handling overhead',
    },
    {
      title: 'Document Printing & Scans',
      description:
        'Charge per page and scan as add-ons to a session or standalone queue with receipt references.',
      example:
        'Customer prints 8 pages and scans 2 documents; QR receipt shows itemization for reimbursement.',
      savings: 'Prevents under-billing',
    },
    {
      title: 'Attendant Commission Splits',
      description:
        'Define a split for session revenue; settlement distributes shares to attendants automatically.',
      example:
        'Attendant receives 20% of session revenue at settlement with a clear statement.',
      savings: 'Eliminates manual payout calculation',
    },
  ],

  // Features
  industryFeatures: [
    'QR prepaid time vouchers',
    'Auto session timing and extensions',
    'Printing/scanning add-ons per session',
    'Owner/attendant split payouts',
    'Offline logging and sync',
    'Usage analytics and exports',
  ],
  includedFeatures: [
    {
      name: 'Time Voucher QR',
      description: 'Create and sell 10/30/60 minute vouchers with auto timing.',
      usualCost: '$99/yr',
    },
    {
      name: 'Add-ons & Peripherals',
      description: 'Track printing, scanning, and accessories per session.',
      usualCost: '$79/yr',
    },
    {
      name: 'Split Payouts',
      description: 'Automate commissions for attendants and station monitors.',
      usualCost: '$120/yr',
    },
    {
      name: 'Offline Mode',
      description: 'Capture sessions and payments during outages; sync later.',
      usualCost: '$59/yr',
    },
    {
      name: 'Reports & Exports',
      description: 'Download CSV/JSON for schools and training partners.',
      usualCost: '$49/yr',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create your café profile and stations in /admin',
    'Configure session lengths and voucher pricing',
    'Add printing/scanning add-ons and rates',
    'Set split rules for owner and attendants',
    'Print QR tent cards for cashier and station areas',
    'Connect wallet for settlement payouts',
  ],

  // FAQ
  faqs: [
    {
      question: 'How do prepaid vouchers start sessions?',
      answer:
        'Scanning the QR creates a session entry with start/end timestamps. Extensions can be added with another QR.',
      category: 'Sessions',
    },
    {
      question: 'Can we charge for printing and peripherals?',
      answer:
        'Yes. Add-ons are itemized and attached to the active session or billed standalone.',
      category: 'Add-ons',
    },
    {
      question: 'Do you support offline logging?',
      answer:
        'Yes. Sessions and payments can be recorded offline and sync when connectivity is restored.',
      category: 'Offline',
    },
    {
      question: 'Can attendants receive automatic commissions?',
      answer:
        'Define split rules by station or product. Settlement distributes shares to attendants with statements.',
      category: 'Payouts',
    },
    {
      question: 'Are micro-transactions affordable?',
      answer:
        'Fees are 0.5–1% with no monthly charges, ideal for short sessions and small prints.',
      category: 'Pricing',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Time vouchers and printing add-ons made our cashier flow painless. The attendant splits save us hours each week.',
      author: 'Samuel O.',
      business: 'LinkUp Café – Accra',
      savings: 'Saved 66% on fees',
    },
    {
      quote:
        'Offline logging kept us running during network drops. Exported reports impressed our training partners.',
      author: 'Dewi A.',
      business: 'Koneksi Lab – Yogyakarta',
    },
  ],

  // Related
  relatedIndustries: ['retail', 'freelancers', 'community-radio-stations'],
  relatedUseCases: ['qr-vouchers', 'split-payments', 'offline-mode', 'usage-analytics'],
};
