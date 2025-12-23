import { IndustryLandingData } from '../types';

export const veterinarians: IndustryLandingData = {
  slug: 'veterinarians',
  name: 'Veterinary Clinics',
  icon: '🐾',

  title: 'Accept Crypto Payments for Veterinarians | Deposits, Prescriptions, Boarding | PortalPay',
  metaDescription:
    'Veterinary crypto payment processing. Collect deposits, charge after-hours emergency care, and bill prescriptions with 0.5-1% fees vs 2.9%+. Free clinic management, appointment scheduling, and client portal.',
  keywords: [
    'veterinarian crypto payments',
    'pet clinic bitcoin',
    'vet appointment deposit',
    'low fee veterinary payment',
    'emergency vet payments',
  ],

  heroHeadline: 'Accept Crypto Payments for Pet Care',
  heroSubheadline:
    'Collect deposits for appointments, bill emergency visits instantly, and accept prescription payments with crypto or cards. Save 70% on fees. Free clinic tools included.',
  heroCTA: {
    primary: 'Start Free',
    primaryLink: '/admin',
    secondary: 'View Pricing',
    secondaryLink: '/terminal',
  },

  painPoints: [
    'High processing fees on routine visits and procedures',
    'No-shows for appointments without deposits',
    'After-hours emergency billing friction',
    'Prescription payments and refills tracking',
    'International clients or traveling pet owners facing card issues',
  ],

  solutions: [
    'Pay only 0.5-1% per transaction',
    'Collect non-refundable deposits in crypto to reduce no-shows',
    'Instant billing for emergencies with QR codes',
    'Streamlined prescription and refill payments',
    'Accept payments from any country with no FX fees',
  ],

  benefits: [
    {
      icon: '💰',
      title: 'Save $2,000-4,000 Annually',
      description:
        'On $12k/month revenue across routine visits and procedures, save $3,240/year vs 2.9% processors. Keep more of your clinic income.',
      stat: '70% Lower Fees',
    },
    {
      icon: '🔒',
      title: 'Reduce No-Shows',
      description:
        'Require crypto deposits for certain appointments (surgery consults, first-time clients). Deposits are final by default, dramatically lowering no-show rates.',
      stat: 'Up to 80% Fewer No-Shows',
    },
    {
      icon: '⚡',
      title: 'Instant Emergency Billing',
      description:
        'Generate room or case QR codes. Charge triage, diagnostics, and procedures instantly without waiting for card approvals.',
      stat: '30-Second Payments',
    },
    {
      icon: '💊',
      title: 'Prescription & Refill Payments',
      description:
        'Bill medications and refills through a client portal. Owners pay from their phone. Automated receipts and audit trail.',
      stat: 'Frictionless Refills',
    },
    {
      icon: '🌍',
      title: 'International Friendly',
      description:
        'Travelers and expats pay from anywhere without currency conversion problems. Ideal for clinics near tourist hubs.',
      stat: 'Zero FX Fees',
    },
    {
      icon: '🧾',
      title: 'Transparent Records',
      description:
        'Every payment has a tamper-proof on-chain record. Easy reconciliation and simplified financial audits.',
      stat: 'Built-In Compliance',
    },
  ],

  avgMonthlyVolume: 12000,
  competitorComparison: {
    square: {
      processingFee: 0.026,
      flatFee: 0.10,
      monthlyFee: 60,
      annualSoftwareCost: 720,
    },
    stripe: {
      processingFee: 0.029,
      flatFee: 0.30,
      monthlyFee: 0,
      annualSoftwareCost: 0,
    },
    avimark: {
      processingFee: 0.029,
      flatFee: 0.30,
      monthlyFee: 99,
      annualSoftwareCost: 1188,
    },
  },

  useCases: [
    {
      title: 'Appointment Deposits',
      description:
        'Collect deposits for surgery consults or specialty visits. Owners pay upfront. Fewer cancellations and better schedule utilization.',
      example:
        'Clinic with 40 specialty consults/month at $50 deposit reduces no-shows from 12 to 2, recovering $500+/month.',
      savings: '$6,000/year',
    },
    {
      title: 'Emergency Care Billing',
      description:
        'Generate a QR code for after-hours intake. Owners pay triage and diagnostics immediately. Avoid card declines and ensure fast care.',
      example:
        'ER clinic billing $8k/month in after-hours care reduces payment friction and saves ~70% on processing fees.',
      savings: '$1,680/year',
    },
    {
      title: 'Prescription Refills',
      description:
        'Send refill links via SMS/email. Owners pay from phone. Pickup or delivery options with automated receipts.',
      example:
        'Clinic processing $3k/month in prescriptions saves $864/year vs traditional processing and improves refill compliance.',
      savings: '$864/year',
    },
  ],

  industryFeatures: [
    'Appointment Scheduling',
    'Client & Pet Profiles',
    'Deposit Collection',
    'Procedures & Treatments',
    'Prescription Billing',
    'Kennel & Boarding',
    'Vaccination Records',
    'After-Hours Mode',
    'QR Room Billing',
    'Analytics & Reporting',
  ],

  includedFeatures: [
    {
      name: 'Client & Pet Profiles',
      description:
        'Track owner contact info, pet details, medical notes, vaccination records, and visit history',
      usualCost: '$40/mo',
    },
    {
      name: 'Appointment Scheduling',
      description:
        'Calendar with provider assignment, deposits, reminders, and no-show tracking',
      usualCost: '$60/mo',
    },
    {
      name: 'Prescription Billing',
      description:
        'Medication catalog, refill links, pickup/delivery workflows, and receipt generation',
      usualCost: '$50/mo',
    },
    {
      name: 'Kennel & Boarding',
      description:
        'Book boarding runs, track feeding/med schedules, and charge per-night rates',
      usualCost: '$45/mo',
    },
    {
      name: 'After-Hours Mode',
      description:
        'Simplified emergency intake with QR billing and immediate payment collection',
      usualCost: '$30/mo',
    },
    {
      name: 'Analytics Dashboard',
      description:
        'Revenue by service line, deposits vs no-shows, prescription margins, and provider performance',
      usualCost: '$75/mo',
    },
  ],

  setupSteps: [
    'Connect clinic wallet or create a new one in minutes',
    'Add providers, services, and pricing (visits, procedures, meds)',
    'Enable deposits for specific appointment types',
    'Configure after-hours intake with QR room codes',
    'Import existing clients or start fresh',
    'Share payment links for prescriptions and refills',
    'Start accepting payments instantly in clinic and online',
  ],

  faqs: [
    {
      question: 'Do pet owners need a crypto wallet to pay?',
      answer:
        'No. Most owners will pay with regular credit/debit cards or Apple Pay. Our onramp converts to crypto in the background. You get low fees and instant settlement, they get a familiar checkout.',
      category: 'Payments',
    },
    {
      question: 'Can I make appointment deposits non-refundable?',
      answer:
        'Yes. Crypto deposits are final by default, which helps reduce no-shows. You can still issue refunds via admin when appropriate.',
      category: 'Policies',
    },
    {
      question: 'How fast do payments clear?',
      answer:
        'Instantly. Crypto settles within seconds. Compare to 1-3 day delays with traditional processors. Ideal for emergency care and quick turnarounds.',
      category: 'Settlement',
    },
    {
      question: 'Can I track vaccinations and medical notes?',
      answer:
        'Yes. Client & Pet Profiles include vaccination records, medical notes, and visit history. Attach payments and invoices to each case for a complete audit trail.',
      category: 'Records',
    },
    {
      question: 'How do prescription refills work?',
      answer:
        'You set refill rules in the medication catalog. The system sends secure links by SMS/email. Owners pay from their phone and receive a digital receipt. Pickup or delivery options are configurable.',
      category: 'Prescriptions',
    },
  ],

  testimonials: [
    {
      quote:
        'Deposits cut our no-shows to almost zero. After-hours intake is smoother with instant payments. We’re saving hundreds per month on fees too.',
      author: 'Dr. Elena Ruiz',
      business: 'Paws & Claws Veterinary, Austin',
      savings: '$3,100/year',
    },
  ],

  relatedIndustries: ['medical', 'dentists', 'pharmacies', 'pet-boarding', 'groomers'],
  relatedUseCases: [
    'appointment-deposits',
    'emergency-intake',
    'prescription-billing',
    'instant-settlement',
  ],
};
