import { IndustryLandingData } from '../types';

export const mobilePhoneRepair: IndustryLandingData = {
  // Basics
  slug: 'mobile-phone-repair',
  name: 'Mobile Phone Repair Shops',
  icon: '📱',

  // SEO
  title: 'Crypto Payments for Mobile Phone Repair Shops | BasaltSurge',
  metaDescription:
    'Accept crypto payments for diagnostics, parts, and repairs. Track IMEI, warranty notes, parts tags, and split payouts between owner and technician with BasaltSurge.',
  keywords: [
    'phone repair crypto payments',
    'mobile repair shop payments',
    'diagnostic deposit QR',
    'IMEI tracking',
    'warranty repairs',
    'parts tagging',
    'technician owner split payouts',
    'offline payment support',
    'developing markets',
    'repair tickets',
  ],

  // Hero Section
  heroHeadline: 'Frictionless Payments for Mobile Phone Repair',
  heroSubheadline:
    'Take diagnostic deposits, tag parts to tickets, track IMEI and warranties, and split payouts between owner and technician automatically — all with ultra-low fees.',
  heroCTA: {
    primary: 'Get Started Free',
    primaryLink: '/admin',
    secondary: 'Explore Shop Presets',
    secondaryLink: '/shop',
  },

  // Value Props
  painPoints: [
    'Lost repair tickets and unclear diagnostics charges',
    'Parts procurement delays and mismatched stock',
    'No clear IMEI/warranty tracking across repairs',
    'Cash-based deposits with no audit trail',
    'Manual payout splits between owner and technician',
    'Inconsistent customer communication and approvals',
    'High fees on small payments and deposits',
    'Limited offline support when networks drop',
  ],
  solutions: [
    'QR-based diagnostic deposits with itemized tickets',
    'Parts tagging and cost attribution to repair orders',
    'IMEI capture, warranty notes, and service history',
    'Split payouts routed automatically on settlement',
    'Automated notifications for approvals and ready pickup',
    'Offline tally with sync-on-connection and audit exports',
    'Transparent receipts with serials and parts references',
  ],

  // Benefits
  benefits: [
    {
      icon: '🔧',
      title: 'Diagnostic Deposits via QR',
      description:
        'Generate a QR for diagnostics and intake fees, linked to the repair ticket and IMEI for a verifiable audit trail.',
      stat: 'Reduce intake disputes by 60%',
    },
    {
      icon: '🧾',
      title: 'Ticket-Based Parts Tagging',
      description:
        'Attach parts and labor directly to a repair ticket. Track stock movements and ensure correct invoicing.',
      stat: 'Eliminate 80% of stock mismatches',
    },
    {
      icon: '📇',
      title: 'IMEI & Warranty Tracking',
      description:
        'Store IMEI and warranty notes on each job. Export histories for vendors or customers on request.',
      stat: 'Cut warranty escalations by 40%',
    },
    {
      icon: '🤝',
      title: 'Split Payouts Owner/Technician',
      description:
        'Define configurable splits per service type. Settlement pays out shares instantly with clear statements.',
      stat: 'Save 2 hours/week on manual splits',
    },
    {
      icon: '📶',
      title: 'Offline First',
      description:
        'Record payments and approvals even without connectivity. Sync and reconcile automatically when back online.',
      stat: '100% continuity during outages',
    },
    {
      icon: '💸',
      title: 'Ultra-Low Fees',
      description:
        'Pay 0.5–1% per transaction with no monthly fees. Perfect for small deposits and staged payments.',
      stat: '70%+ savings vs legacy processors',
    },
  ],

  // Cost Comparison
  avgMonthlyVolume: 6000,
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
      title: 'Diagnostics Intake & Deposit',
      description:
        'Create a QR deposit for diagnostics tied to the repair ticket and IMEI. Customer gets a receipt; shop gets a verifiable audit reference.',
      example:
        'Customer pays $10 deposit via QR; ticket #R-1432 stores IMEI and issue notes; tech starts diagnostics immediately.',
      savings: 'Avoids chargebacks and intake disputes',
    },
    {
      title: 'Parts Order & Install',
      description:
        'Add parts to the ticket as they are ordered and installed. Cost and margin are tracked against the job automatically.',
      example:
        'New screen and adhesive logged to ticket; final invoice reconciles deposit + parts + labor; split payouts calculated.',
      savings: 'Prevents margin leakage and stock loss',
    },
    {
      title: 'Warranty & IMEI History',
      description:
        'Store warranty terms and past repairs per IMEI. Customers and vendors can access history for faster approvals.',
      example:
        'A 90-day warranty replacement is approved using stored IMEI history and prior notes, with no paper chase.',
    },
    {
      title: 'Owner/Technician Split Payout',
      description:
        'Define split rules per service type (diagnostics, screen, battery, water damage). Settlement distributes shares automatically.',
      example:
        'Technician receives 40% of labor at settlement; owner gets the remaining shares with parts and fees reconciled.',
      savings: 'Removes manual reconciliation effort',
    },
  ],

  // Features
  industryFeatures: [
    'Repair tickets with QR deposits',
    'IMEI capture and warranty notes',
    'Parts tagging and stock reconciliation',
    'Technician/owner split payouts',
    'Staged payments (diagnostics -> parts -> completion)',
    'Customer approvals and ready-for-pickup alerts',
    'Offline mode with sync-on-connection',
    'Exportable audit logs and job histories',
    'Multi-branch support with shared stock',
  ],
  includedFeatures: [
    {
      name: 'QR Deposits & Intakes',
      description: 'Generate scannable QR codes for diagnostics and intake fees tied to ticket and IMEI.',
      usualCost: '$99/yr',
    },
    {
      name: 'Repair Ticketing',
      description: 'Structured tickets with statuses, approvals, and notifications.',
      usualCost: '$149/yr',
    },
    {
      name: 'IMEI & Warranty Tracking',
      description: 'Attach IMEI, serials, and warranty terms to each job.',
      usualCost: '$79/yr',
    },
    {
      name: 'Split Payouts',
      description: 'Automated owner/technician splits with clear statements.',
      usualCost: '$120/yr',
    },
    {
      name: 'Offline Tally',
      description: 'Record payments and approvals offline; sync when online.',
      usualCost: '$59/yr',
    },
    {
      name: 'Audit & Exports',
      description: 'CSV/JSON exports of tickets, payments, and stock movements.',
      usualCost: '$49/yr',
    },
  ],

  // Setup Steps
  setupSteps: [
    'Create your shop and branches in /admin',
    'Configure service presets (diagnostics, screen, battery)',
    'Set split rules for technician/owner per service type',
    'Enable IMEI capture and warranty fields in ticket settings',
    'Connect wallet for settlement payouts',
    'Print QR tent cards for intake and pickup counters',
  ],

  // FAQ
  faqs: [
    {
      question: 'How do deposits work for diagnostics?',
      answer:
        'Generate a QR linked to the repair ticket and IMEI. Once paid, the deposit appears on the ticket with a receipt reference for audit trails.',
      category: 'Payments',
    },
    {
      question: 'Can I split payouts automatically?',
      answer:
        'Yes. Define percentage splits per service type. Settlement distributes shares to owner and technician automatically.',
      category: 'Payouts',
    },
    {
      question: 'Do you support offline payments?',
      answer:
        'Yes. Intake and approvals can be recorded offline. When connectivity returns, all records are synced and reconciled.',
      category: 'Offline',
    },
    {
      question: 'Can I export job histories with IMEI?',
      answer:
        'You can export detailed histories per IMEI including notes, parts, labor, and warranty terms as CSV or JSON.',
      category: 'Audit',
    },
    {
      question: 'How are parts tracked to tickets?',
      answer:
        'Parts are tagged to the active ticket with cost attribution and stock reconciliation. Final invoice combines deposit, parts, and labor.',
      category: 'Inventory',
    },
    {
      question: 'Are fees predictable for small shops?',
      answer:
        'Yes. Fees are 0.5–1% per transaction with no monthly charges, ideal for small deposits and staged payments.',
      category: 'Pricing',
    },
  ],

  // Social Proof
  testimonials: [
    {
      quote:
        'Deposits and IMEI tracking in one flow changed our intake process overnight. Fewer disputes, faster approvals.',
      author: 'Amina K.',
      business: 'FixIt Mobile – Nairobi',
      savings: 'Saved 65% on fees',
    },
    {
      quote:
        'Automated technician splits removed our weekly reconciliation headache. Parts tagging also tightened stock control.',
      author: 'Luis R.',
      business: 'TecnoCare – Lima',
    },
  ],

  // Related
  relatedIndustries: ['hardware-shops', 'auto-repair', 'freelancers', 'retail', 'community-pharmacies'],
  relatedUseCases: ['qr-deposits', 'split-payments', 'inventory-tagging', 'warranty-management'],
};
