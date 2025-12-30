import { IndustryLandingData } from '../types';

export const hotels: IndustryLandingData = {
    slug: 'hotels',
    name: 'Hotels',
    icon: '🏨',
    
    title: 'Hotel Crypto Payment Processing | PMS Included Free | BasaltSurge',
    metaDescription: 'Accept crypto payments for hotel bookings. 0.5-1% processing fee vs 2.9%+. Free PMS with room management, housekeeping, and guest profiles. No bank account required. Save $5,000+ yearly.',
    keywords: [
      'hotel crypto payments',
      'accept bitcoin hotels',
      'crypto hotel booking',
      'low fee hotel payments',
      'free hotel pms',
      'hotel payment processor',
      'accept payments no bank account',
    ],
    
    heroHeadline: 'Accept Crypto for Hotel Bookings',
    heroSubheadline: 'Guests pay with crypto or cards for rooms and services. Save 70% on processing fees. Free PMS with room management, housekeeping tracking, and booking system.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.9-3.5% on hotel bookings and deposits',
      'Expensive PMS software ($200-500/month)',
      'International guests dealing with currency conversion fees',
      'Chargebacks on no-show reservations',
      'Complex banking requirements for boutique hotels',
    ],
    
    solutions: [
      'Pay only 0.5-1% on all transactions - save $5,000+ annually',
      'Complete PMS included free: room management, housekeeping, booking system',
      'Accept payments from anywhere without currency conversion',
      'Crypto deposits are non-refundable by default (reduce no-shows)',
      'Operate internationally without traditional banking',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $5,000-8,000 Annually',
        description: 'Hotels processing $30k/month save $6,960/year on fees vs traditional processors. Plus save $2,400-6,000/year on PMS software.',
        stat: '75% Lower Costs',
      },
      {
        icon: '🆓',
        title: 'Free Hotel PMS',
        description: 'Complete property management system: room inventory, housekeeping status, booking calendar, guest profiles, check-in/out. Usually $200-500/month.',
        stat: '$2,400-6,000/yr Saved',
      },
      {
        icon: '🌍',
        title: 'True International Payments',
        description: 'Guests from any country pay with crypto - no currency conversion, no international fees, no declined cards. Perfect for tourist destinations.',
        stat: 'Zero FX Fees',
      },
      {
        icon: '🔒',
        title: 'Reduce No-Show Loss',
        description: 'Crypto deposits are final. No more losing revenue to guests who book but don\'t show. Reduce no-show rate from 10-15% to under 2%.',
        stat: 'Save $1,000+/mo',
      },
      {
        icon: '⚡',
        title: 'Instant Booking Confirmation',
        description: 'Payment clears in seconds. Instant confirmation for guests, immediate revenue for you. No waiting for payment authorization.',
        stat: '30-Second Bookings',
      },
      {
        icon: '📊',
        title: 'Occupancy Analytics',
        description: 'Track room performance, RevPAR, ADR, booking sources. Free analytics that competitors charge $100+/month for.',
        stat: 'All Included',
      },
    ],
    
    avgMonthlyVolume: 30000,
    competitorComparison: {
      cloudbeds: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 299,
        annualSoftwareCost: 3588,
      },
      'opera-cloud': {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 500,
        annualSoftwareCost: 6000,
      },
      stripe: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 100,
        annualSoftwareCost: 1200,
      },
    },
    
    useCases: [
      {
        title: 'Direct Booking with Crypto Deposit',
        description: 'Guest books on your website, pays deposit in crypto or via card. Non-refundable deposit reduces no-shows. Balance due at check-in.',
        example: '25-room boutique hotel processing $30k/month saves $6,960/year on fees, $3,588/year on PMS software.',
        savings: '$10,548/year',
      },
      {
        title: 'International Guest Bookings',
        description: 'Guests from any country pay without currency conversion fees. No declined international cards. Instant payment confirmation.',
        example: 'Resort with 40% international guests saves $8,000/year on FX fees and chargeback losses.',
        savings: '$8,000/year',
      },
      {
        title: 'In-Room Services & Minibar',
        description: 'Generate QR code for each room. Guests scan to pay for room service, minibar, spa services. Automatic room charge.',
        example: 'Hotel earning $5k/month in ancillary revenue saves $1,440/year on processing.',
        savings: '$1,440/year',
      },
    ],
    
    industryFeatures: [
      'Room Inventory Management',
      'Booking Calendar',
      'Housekeeping Status Board',
      'Guest Check-In/Check-Out',
      'Room Type & Rate Management',
      'Maintenance Scheduling',
      'Guest Profiles & History',
      'Reservation Management',
      'Occupancy Reports',
      'Revenue Management',
    ],
    
    includedFeatures: [
      {
        name: 'Property Management System',
        description: 'Complete PMS with all features hotels need',
        usualCost: '$299-500/mo',
      },
      {
        name: 'Booking Engine',
        description: 'Accept direct bookings on your website',
        usualCost: '$100/mo',
      },
      {
        name: 'Housekeeping Management',
        description: 'Visual status board, task assignment, cleaning schedules',
        usualCost: '$50/mo',
      },
      {
        name: 'Guest Portal',
        description: 'White-label portal for guests to view bookings and pay',
        usualCost: '$75/mo',
      },
      {
        name: 'Analytics Dashboard',
        description: 'RevPAR, ADR, occupancy trends, revenue reports',
        usualCost: '$100/mo',
      },
      {
        name: 'Multi-Property Support',
        description: 'Manage multiple hotels from one dashboard',
        usualCost: '$200/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet and configure basic hotel information',
      'Add your logo, brand colors, and property photos',
      'Set up room types (Standard, Deluxe, Suite) with rates',
      'Configure room inventory and availability calendar',
      'Set up housekeeping schedules and staff assignments',
      'Create booking policies and cancellation rules',
      'Generate payment links for direct bookings',
    ],
    
    faqs: [
      {
        question: 'How do guests pay for hotel bookings with crypto?',
        answer: 'Guests receive a payment link or scan a QR code. They can pay with crypto directly (USDC, Bitcoin, Ethereum) or use credit/debit card or Apple Pay through our onramp. Payment is instant, booking is confirmed immediately. They receive a digital confirmation and can access their booking details through your branded guest portal.',
        category: 'Payments',
      },
      {
        question: 'Do guests need a crypto wallet to book?',
        answer: 'No. While crypto-savvy travelers can pay directly with their wallets, any guest can pay using credit card, debit card, Apple Pay, or Google Pay. Our onramp instantly converts to crypto. This means you get low-fee crypto processing, they pay however they want.',
        category: 'Bookings',
      },
      {
        question: 'Can I require non-refundable deposits?',
        answer: 'Yes! This is actually a major advantage. Crypto payments are final by design. You can require a deposit that\'s non-refundable (with clear policies). This dramatically reduces no-shows. Many hotels reduce no-show rates from 10-15% to under 2%, saving thousands monthly.',
        category: 'Policies',
      },
      {
        question: 'How does this work for international guests?',
        answer: 'Perfect for international travelers. They pay in crypto (which is universal) without currency conversion fees or international transaction fees. Their credit cards don\'t get declined for foreign transactions. You receive payment instantly without FX losses. Both sides save money.',
        category: 'International',
      },
      {
        question: 'Do I need a bank account to run my hotel with BasaltSurge?',
        answer: 'No! This is revolutionary for boutique hotels and international properties. Payments go to your crypto wallet. Hold crypto, convert to stablecoins, or cash out to local currency via any exchange. No traditional banking relationship required. Perfect for properties in emerging markets or new hotels without banking history.',
        category: 'Setup',
      },
      {
        question: 'How does the PMS compare to Cloudbeds or Opera?',
        answer: 'Our PMS includes all core hotel management features: room inventory, housekeeping board, booking calendar, guest check-in/out, reporting. For most independent hotels (under 100 rooms), it has everything you need. Cloudbeds charges $299/mo, Opera $500+/mo. Ours is completely free.',
        category: 'Features',
      },
      {
        question: 'Can I manage multiple properties?',
        answer: 'Yes. The multi-property dashboard is included free. Manage multiple hotels, see consolidated reporting, transfer inventory, compare performance. Other PMSs charge $200-500/month extra for multi-property.',
        category: 'Features',
      },
      {
        question: 'What about refunds for cancellations?',
        answer: 'You have full control via admin panel. If a guest cancels within your cancellation policy, you can issue a refund to their wallet. The key advantage: YOU control refunds, not credit card companies. No chargebacks from guests who claim they didn\'t authorize the booking.',
        category: 'Policies',
      },
      {
        question: 'How do you calculate savings vs traditional processors?',
        answer: 'Example: Hotel processing $30k/month. Traditional (2.9% + 30¢ + $299/mo PMS): $870 fees + $299 PMS = $1,169/mo ($14,028/yr). BasaltSurge (0.75% avg): $225/mo + $0 PMS = $225/mo ($2,700/yr). Annual savings: $11,328. Real number depends on your volume and current processor.',
        category: 'Pricing',
      },
      {
        question: 'Is this legal for hotels to accept crypto?',
        answer: 'Yes. Hotels can legally accept crypto as payment in the US and most countries worldwide. It\'s treated like any other payment method for tax purposes. We provide detailed transaction records for accounting. Many hotels are already accepting crypto for bookings.',
        category: 'Legal',
      },
    ],
    
    testimonials: [
      {
        quote: 'We were paying Cloudbeds $299/month plus 2.9% on all bookings. BasaltSurge gave us a better PMS completely free and cut our processing to 0.7%. Saving over $10k/year.',
        author: 'David Park',
        business: 'Coastal Inn, San Diego',
        savings: '$10,800/year',
      },
    ],
    
    relatedIndustries: ['bnbs', 'vacation-rentals', 'hostels', 'resorts', 'motels'],
    relatedUseCases: ['crypto-deposits', 'international-payments', 'low-fee-processing', 'no-chargeback-payments'],
  };
