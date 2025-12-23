import { IndustryLandingData } from '../types';

export const medical: IndustryLandingData = {
    slug: 'medical',
    name: 'Medical & Healthcare',
    icon: '⚕️',
    
    title: 'Accept Crypto Payments for Medical Practices | HIPAA Compliant | PortalPay',
    metaDescription: 'Medical practice crypto payments. 0.5-1% vs 2.9%. HIPAA compliant. Free practice management. Patient billing, appointments, no insurance needed. Perfect for global healthcare.',
    keywords: [
      'medical crypto payments',
      'healthcare bitcoin',
      'medical billing crypto',
      'telemedicine payments',
      'international patients payments',
    ],
    
    heroHeadline: 'Accept Crypto for Medical Services',
    heroSubheadline: 'Patients pay for consultations, procedures, prescriptions with crypto or cards. Save 70% on fees. Perfect for telemedicine and international patients.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.9% on patient payments and procedures',
      'Expensive practice management software',
      'International patients struggling with payment',
      'Insurance processing delays',
      'Medical tourism payment complications',
    ],
    
    solutions: [
      'Pay only 0.5-1% on all patient payments',
      'HIPAA-compliant payment processing',
      'Accept international patients easily',
      'Direct payment without insurance delays',
      'Perfect for telemedicine and medical tourism',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $4,000-8,000 Annually',
        description: 'On $25k/month patient revenue, save $6,960/year in processing fees. Plus save on practice management software.',
        stat: '70% Lower Fees',
      },
      {
        icon: '🌍',
        title: 'International Patients',
        description: 'Accept payments from patients worldwide. No currency conversion issues. Perfect for medical tourism and telemedicine.',
        stat: 'Global Access',
      },
      {
        icon: '🔒',
        title: 'HIPAA Compliant',
        description: 'Secure, private payment processing. Patient data protected. Meets all healthcare privacy regulations.',
        stat: 'Full Compliance',
      },
      {
        icon: '⚡',
        title: 'Instant Payment',
        description: 'No waiting for insurance companies. Patient pays, you receive funds instantly. Better cash flow for your practice.',
        stat: 'Same-Day Revenue',
      },
      {
        icon: '📱',
        title: 'Telemedicine Ready',
        description: 'Send payment links via telehealth platform. Patient pays online. Perfect for virtual consultations.',
        stat: 'Remote Payments',
      },
      {
        icon: '🏥',
        title: 'No Insurance Needed',
        description: 'Direct patient payments. Especially valuable for elective procedures, cosmetic services, and cash-only practices.',
        stat: 'Zero Hassle',
      },
    ],
    
    avgMonthlyVolume: 25000,
    competitorComparison: {
      square: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
      stripe: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
      'practice-fusion': {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 149,
        annualSoftwareCost: 1788,
      },
    },
    
    useCases: [
      {
        title: 'Medical Tourism',
        description: 'International patients travel for procedures. Pay deposits online, balance in person. No currency exchange complications.',
        example: 'Cosmetic surgery practice with 40% international patients saves $8,000/year on FX fees and processing.',
        savings: '$8,000/year',
      },
      {
        title: 'Telemedicine Consultations',
        description: 'Send payment link after virtual consultation. Patient pays instantly. Works globally for international consultations.',
        example: 'Telehealth practice doing $10k/month saves $2,880/year vs traditional processing.',
        savings: '$2,880/year',
      },
      {
        title: 'Elective Procedures',
        description: 'Cosmetic, dental, fertility treatments. Accept deposits to reserve appointments. Balance due before procedure.',
        example: 'Dental practice doing $15k/month in elective work saves $4,320/year.',
        savings: '$4,320/year',
      },
    ],
    
    industryFeatures: [
      'HIPAA-Compliant Processing',
      'Patient Billing Portal',
      'Appointment Scheduling',
      'Telemedicine Integration',
      'Payment Plans',
      'Insurance Alternative',
      'Prescription Payments',
      'Multi-Provider Support',
      'Deposit Collection',
      'International Patient Support',
    ],
    
    includedFeatures: [
      {
        name: 'HIPAA Compliance',
        description: 'Secure, private payment processing for healthcare',
        usualCost: '$100/mo',
      },
      {
        name: 'Patient Portal',
        description: 'View bills, make payments, download receipts',
        usualCost: '$60/mo',
      },
      {
        name: 'Appointment System',
        description: 'Schedule, reminders, deposit collection',
        usualCost: '$80/mo',
      },
      {
        name: 'Payment Plans',
        description: 'Set up installment plans for expensive procedures',
        usualCost: '$40/mo',
      },
      {
        name: 'Multi-Currency',
        description: 'Bill international patients in their currency',
        usualCost: '$30/mo',
      },
      {
        name: 'Telemedicine Links',
        description: 'Send payment links for virtual consultations',
        usualCost: '$50/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet and configure practice details',
      'Enable HIPAA-compliant mode',
      'Add providers and service pricing',
      'Set up patient billing portal',
      'Configure telemedicine payment links',
      'Create deposit options for procedures',
      'Start accepting patient payments globally',
    ],
    
    faqs: [
      {
        question: 'Is this HIPAA compliant for medical practices?',
        answer: 'Yes. We maintain full HIPAA compliance for healthcare payment processing. Patient payment data is encrypted, secure, and private. We provide Business Associate Agreements (BAA) for healthcare providers. All technical safeguards meet HIPAA requirements.',
        category: 'Compliance',
      },
      {
        question: 'How do international patients pay?',
        answer: 'Send them a payment link via email. They pay in their local currency with credit card or crypto. No currency conversion complications. Perfect for medical tourism - patients from any country can pay easily. Common for cosmetic surgery, dental work, fertility treatments.',
        category: 'International',
      },
      {
        question: 'Can this work for telemedicine?',
        answer: 'Perfect for telehealth. After virtual consultation, send payment link. Patient pays instantly. Works across borders - consult with patient in another country, accept payment immediately. Great for international medical consultations, second opinions, follow-ups.',
        category: 'Telemedicine',
      },
      {
        question: 'What about payment plans for expensive procedures?',
        answer: 'Set up installment plans easily. Patient pays deposit, then monthly installments. Automatic recurring payments. Common for cosmetic surgery, dental implants, fertility treatments. Crypto payments never fail (no expired cards), ensuring plan completion.',
        category: 'Payment Plans',
      },
      {
        question: 'Do patients need crypto wallets?',
        answer: 'No. Patients pay with regular credit card or Apple Pay. Our onramp handles conversion. They never see crypto. You get the benefits: low fees, instant settlement, global reach. Especially valuable for international patients.',
        category: 'Patients',
      },
    ],
    
    testimonials: [
      {
        quote: 'We do cosmetic procedures for international patients. Currency conversion was costing us thousands. PortalPay solved it - patients pay easily from any country, we save 70% on fees.',
        author: 'Dr. Sarah Kim',
        business: 'Aesthetic Medical Center, Seoul',
        savings: '$8,400/year',
      },
    ],
    
    relatedIndustries: ['dentists', 'veterinarians', 'pharmacies', 'medical-spas', 'mental-health'],
    relatedUseCases: ['telemedicine', 'international-patients', 'medical-tourism', 'payment-plans'],
  };
