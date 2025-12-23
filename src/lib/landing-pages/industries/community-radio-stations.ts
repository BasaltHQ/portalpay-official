import { IndustryLandingData } from '../types';

export const communityRadioStations: IndustryLandingData = {
  // Basics
  slug: 'community-radio-stations',
  name: 'Community Radio Stations',
  icon: '📻',

  // SEO
  title: 'Crypto Payments for Community Radio Stations | PortalPay',
  metaDescription:
    'Accept donations, sponsorships, and airtime payments. Run fund drives, split payouts for shows, and handle offline pledges with PortalPay for community radio.',
  keywords: [
    'community radio payments',
    'radio donations crypto',
    'airtime sponsorship invoicing',
    'listener contributions',
    'fund drive QR',
    'offline pledge tracking',
    'show revenue splits',
    'developing countries community radio',
  ],

  // Hero
  heroHeadline: 'Keep Local Voices On Air with Modern Payments',
  heroSubheadline:
    'Take listener contributions, sell airtime packages, and settle sponsorships with ultra-low fees. Split funds across shows and producers automatically.',
  heroCTA: {
    primary: 'Launch a Fund Drive',
    primaryLink: '/admin',
    secondary: 'See Pricing Comparison',
    secondaryLink: '/terminal',
  },

  // Value Props
  painPoints: [
    'Irregular cash donations with no audit trail',
    'Complex sponsorship invoicing and receipting',
    'Manual revenue sharing across shows and hosts',
    'Connectivity drops during live fund drives',
    'High fees eroding small listener contributions',
    'No simple way to accept international support',
  ],
  solutions: [
    'QR codes for on-air fund drives with real-time tally',
    'Itemized airtime packages and sponsor invoicing',
    'Automatic split payouts to shows, producers, and station ops',
    'Offline-first pledge capture with sync when online',
    '0.5–1% fees with no monthly charges for small donations',
    'Cross-border contributions with transparent receipts',
  ],

  // Benefits
  benefits: [
    {
      icon: '📡',
      title: 'On-Air Fund Drive QR',
      description:
        'Display a QR for donations during broadcasts. See contribution tallies live on a dashboard.',
      stat: 'Boost drive conversions by 35%',
    },
    {
      icon: '🧾',
      title: 'Sponsor Invoicing',
      description:
        'Create airtime packages with impressions and flight dates. Bill sponsors and issue receipts instantly.',
      stat: 'Cut billing time by 70%',
    },
    {
      icon: '🤝',
      title: 'Revenue Splits',
      description:
        'Auto-split revenue between station ops, show hosts, and producers at settlement.',
      stat: 'Zero manual reconciliation',
    },
    {
      icon: '🌐',
      title: 'Cross-Border Support',
      description:
        'Accept international contributions without complicated bank setups.',
      stat: 'Donors in 40+ countries',
    },
    {
      icon: '📶',
      title: 'Offline Pledges',
      description:
        'Capture pledges during outages; sync and reconcile when connected.',
      stat: '100% continuity',
    },
    {
      icon: '📊',
      title: 'Transparent Reporting',
      description:
        'Export donation and sponsor reports for boards and grant applications.',
      stat: 'Minutes, not days',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 8000,
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
      title: 'Live Fund Drive',
      description:
        'Announce a QR on-air. Listeners scan and donate; the studio sees a live tally and recent donors.',
      example:
        'During the morning show, listeners scan the QR and contribute $2–$10 each, instantly acknowledged on-air.',
      savings: 'Eliminates cash counting errors',
    },
    {
      title: 'Airtime Package for Local Clinic',
      description:
        'Create a 4-week sponsorship package. Invoice the clinic and issue a receipt upon payment.',
      example:
        'Clinic pays for prime-time slots; the system schedules reminders and exports a report of impressions.',
    },
    {
      title: 'Show Revenue Splits',
      description:
        'Define a 60/30/10 split across station ops, host, and producer for a weekly program.',
      example:
        'At settlement, funds are distributed to each party automatically with a statement.',
      savings: 'Removes manual spreadsheets',
    },
  ],

  // Features
  industryFeatures: [
    'On-air QR donations with live tally',
    'Sponsorship and airtime invoicing',
    'Show-level revenue split rules',
    'Offline pledge capture and sync',
    'Cross-border contribution support',
    'Exportable donor and sponsor reports',
  ],
  includedFeatures: [
    {
      name: 'Donation QR & Tally',
      description: 'Generate QR codes for drives with real-time dashboards.',
      usualCost: '$99/yr',
    },
    {
      name: 'Sponsor Billing',
      description: 'Create packages, send invoices, and issue receipts.',
      usualCost: '$149/yr',
    },
    {
      name: 'Split Payouts',
      description: 'Automatic distribution to hosts, producers, and the station.',
      usualCost: '$120/yr',
    },
    {
      name: 'Offline Mode',
      description: 'Capture pledges during outages; sync later.',
      usualCost: '$59/yr',
    },
    {
      name: 'Reports & Exports',
      description: 'Download CSV/JSON for board and grant reporting.',
      usualCost: '$49/yr',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create your station profile in /admin',
    'Add shows and assign host/producer roles',
    'Set split rules for each program',
    'Define airtime packages and sponsor pricing',
    'Print the donation QR for studio and events',
    'Connect wallet for settlement payouts',
  ],

  // FAQ
  faqs: [
    {
      question: 'Can we show a live donation tally during broadcasts?',
      answer:
        'Yes. The dashboard updates in real time as donations arrive, even from international contributors.',
      category: 'Donations',
    },
    {
      question: 'How are sponsorships billed?',
      answer:
        'Create an airtime package and send an invoice link. Sponsors pay via portal and receive an instant receipt.',
      category: 'Sponsorship',
    },
    {
      question: 'Do you support offline pledges?',
      answer:
        'Yes. Pledges can be recorded offline and reconciled when back online. QR can also encode offline pledge references.',
      category: 'Offline',
    },
    {
      question: 'Can we split revenue across shows automatically?',
      answer:
        'Define split rules per show. At settlement, funds are distributed to all parties with statements.',
      category: 'Payouts',
    },
    {
      question: 'Are small donations economical?',
      answer:
        'Yes. Fees are 0.5–1% with no monthly charges, ideal for $1–$5 contributions.',
      category: 'Pricing',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Our first QR-driven fund drive doubled participation. The split payouts to hosts and producers are effortless.',
      author: 'Benta M.',
      business: 'Radio Umoja – Kisumu',
      savings: 'Saved 68% on fees',
    },
    {
      quote:
        'Sponsorship invoicing and donation exports made our board reporting trivial.',
      author: 'Rafael T.',
      business: 'FM Comunitaria – Córdoba',
    },
  ],

  // Related
  relatedIndustries: ['street-musicians', 'freelancers', 'retail'],
  relatedUseCases: ['donations', 'subscription-payments', 'event-ticketing', 'split-payments'],
};
