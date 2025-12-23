import { IndustryLandingData } from '../types';

export const gyms: IndustryLandingData = {
    slug: 'gyms',
    name: 'Gyms & Fitness Studios',
    icon: '💪',
    
    title: 'Accept Crypto Payments for Gyms | 0.5-1% Fee | Membership Billing',
    metaDescription: 'Gym crypto payment processing. Save 70% vs traditional processors. Free membership management. Recurring billing, check-ins, and class scheduling included. No bank account needed.',
    keywords: [
      'gym crypto payments',
      'fitness studio bitcoin',
      'gym membership billing',
      'low fee gym payments',
      'fitness subscription payments',
    ],
    
    heroHeadline: 'Accept Crypto for Gym Memberships',
    heroSubheadline: 'Members pay monthly subscriptions with crypto or cards. Save 70% on fees. Free membership management with recurring billing, check-ins, and class schedules.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.9% on every monthly membership',
      'Expensive gym management software ($100-300/month)',
      'Failed card payments losing members',
      'Complex billing for different membership tiers',
      'High churn from payment friction',
    ],
    
    solutions: [
      'Pay only 0.5-1% on subscriptions',
      'Free gym management software',
      'Never miss a payment with crypto autopay',
      'Flexible tier management included',
      'Reduce churn with seamless payments',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $3,000-6,000 Annually',
        description: 'On $15k/month recurring (100 members × $150), save $4,680/year in fees. Plus save $1,200-3,600/year on management software.',
        stat: '75% Lower Costs',
      },
      {
        icon: '🆓',
        title: 'Free Gym Management',
        description: 'Member profiles, recurring billing, class scheduling, check-in system, tier management. Usually $100-300/month.',
        stat: '$1,200-3,600/yr Saved',
      },
      {
        icon: '🔄',
        title: 'Never Miss a Payment',
        description: 'Crypto autopay never fails. No expired cards, insufficient funds, or bank declines. Members stay active longer. Reduce involuntary churn by 30-50%.',
        stat: '50% Less Churn',
      },
      {
        icon: '📱',
        title: 'Mobile Check-In',
        description: "Members scan QR to check in. Track attendance automatically. See who's active vs ghost members. Free feature that competitors charge $50/month for.",
        stat: 'All Included',
      },
      {
        icon: '🗓️',
        title: 'Class Scheduling',
        description: 'Members book classes via portal. Automatic capacity limits. Waitlist management. Instructor assignment. Class performance tracking.',
        stat: 'Unlimited Classes',
      },
      {
        icon: '🌍',
        title: 'No Bank Account Needed',
        description: 'Perfect for new gyms or international franchises. Members pay with cards via onramp. You receive crypto. No traditional banking required.',
        stat: 'Global Ready',
      },
    ],
    
    avgMonthlyVolume: 15000,
    competitorComparison: {
      mindbody: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 129,
        annualSoftwareCost: 1548,
      },
      'gym-master': {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 199,
        annualSoftwareCost: 2388,
      },
      stripe: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
    },
    
    useCases: [
      {
        title: 'Monthly Membership Billing',
        description: 'Recurring subscriptions in crypto stablecoins. Never expired cards. Members pay automatically. You get paid on time every month.',
        example: 'Gym with 100 members at $150/month saves $4,680/year on fees, $1,548/year on software.',
        savings: '$6,228/year',
      },
      {
        title: 'Class Pack Sales',
        description: 'Sell 5-pack, 10-pack, or 20-pack class bundles. Track usage automatically. Members scan QR to use credit. No punch cards.',
        example: 'Studio selling $5k/month in class packs saves $1,440/year vs traditional processing.',
        savings: '$1,440/year',
      },
      {
        title: 'Personal Training Add-Ons',
        description: 'Members add PT sessions to membership. Trainer scheduling and payment splits included. Track client progress.',
        example: 'Gym earning $3k/month in PT saves $900/year on processing, $600/year on scheduling software.',
        savings: '$1,500/year',
      },
    ],
    
    industryFeatures: [
      'Membership Management',
      'Recurring Billing',
      'Multi-Tier Subscriptions',
      'Check-In System',
      'Class Scheduling',
      'Capacity Management',
      'Trainer Assignment',
      'Attendance Tracking',
      'Member Portal',
      'Referral Tracking',
    ],
    
    includedFeatures: [
      {
        name: 'Membership Management',
        description: 'Member profiles, tier management, status tracking',
        usualCost: '$80/mo',
      },
      {
        name: 'Recurring Billing',
        description: 'Automatic monthly charges, failed payment recovery',
        usualCost: '$60/mo',
      },
      {
        name: 'Class Scheduling',
        description: 'Book classes, capacity limits, waitlist, instructor assignment',
        usualCost: '$70/mo',
      },
      {
        name: 'Check-In System',
        description: 'Mobile check-in, attendance tracking, activity reports',
        usualCost: '$50/mo',
      },
      {
        name: 'Analytics Dashboard',
        description: 'MRR, churn rate, attendance trends, class popularity',
        usualCost: '$80/mo',
      },
      {
        name: 'Multi-Location',
        description: 'Manage multiple gyms, consolidated reporting',
        usualCost: '$150/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet and configure gym details',
      'Upload logo, set brand colors',
      'Create membership tiers with pricing',
      'Set up class schedule and capacity',
      'Add trainers and assign to classes',
      'Generate QR codes for check-ins',
      'Import existing members or start fresh',
    ],
    
    faqs: [
      {
        question: 'How do members pay for gym memberships with crypto?',
        answer: 'Members can pay two ways: (1) Monthly recurring in stablecoins (USDC always worth $1) - they set it once and auto-pay monthly, or (2) Credit card via onramp - we convert to crypto instantly. They never see the crypto part, just a simple payment experience. Initial setup takes 2 minutes, then it\'s automatic every month.',
        category: 'Payments',
      },
      {
        question: 'What about failed payments for monthly memberships?',
        answer: 'This is where crypto shines. Traditional processors: expired cards (20% members per year), insufficient funds, bank declines. Crypto stablecoin payments never fail - the money is pre-authorized in their wallet. This reduces involuntary churn by 30-50%. Members who want to stay don\'t accidentally get cancelled due to payment issues.',
        category: 'Billing',
      },
      {
        question: 'Can I have different membership tiers (Basic, Premium, etc.)?',
        answer: 'Yes. Create unlimited tiers with different pricing, features, and class access. Basic: $50/month, gym only. Premium: $100/month, gym + classes. Platinum: $150/month, gym + classes + PT. System handles tiered access automatically. Upgrade/downgrade members easily. Track MRR by tier.',
        category: 'Features',
      },
      {
        question: 'How does the check-in system work?',
        answer: 'Members scan QR code at entrance with phone. Instant check-in recorded. You see: who\'s currently in gym, peak times, frequent vs ghost members. Trainer can see if their client checked in. Track member activity for engagement campaigns. This level of tracking usually costs $50/month extra with MindBody.',
        category: 'Features',
      },
      {
        question: 'Can members book classes online?',
        answer: 'Yes. Members see class schedule in their portal, book classes, see who\'s teaching, check capacity. System automatically limits bookings to room capacity. Manages waitlist if full. Sends reminders. Tracks attendance. Exactly like MindBody but free. MindBody charges $129/month for this.',
        category: 'Features',
      },
      {
        question: 'Do members need crypto wallets?',
        answer: 'No. While crypto enthusiasts can pay directly, 99% of members will pay with regular credit/debit card or Apple Pay. We convert to crypto instantly on the backend. They don\'t need to know anything about crypto. You get the benefits (low fees, no failed payments), they get familiar payment experience.',
        category: 'Payments',
      },
      {
        question: 'How much do I really save vs MindBody?',
        answer: 'Gym with 100 members at $150/month = $15,000 MRR. MindBody: $435 processing fees (2.9%) + $129 software = $564/mo ($6,768/year). PortalPay: $112.50 processing (0.75%) + $0 software = $112.50/mo ($1,350/year). Annual savings: $5,418. Plus reduce churn = more MRR retained.',
        category: 'Pricing',
      },
      {
        question: 'Can I split revenue with personal trainers automatically?',
        answer: 'Yes. Set split percentage per trainer. When member pays for PT session, revenue automatically splits on-chain. Trainer gets their share instantly in their wallet. No manual calculations. No payment delays. Much cleaner than traditional splits that require manual accounting.',
        category: 'Features',
      },
      {
        question: 'What if I have multiple gym locations?',
        answer: 'Multi-location management included free (competitors charge $150-300/month extra). See all locations in one dashboard. Members can use any location with roaming access. Transfer members between locations. Compare performance. Consolidated reporting across all gyms.',
        category: 'Scaling',
      },
      {
        question: 'Do I need a bank account to run my gym?',
        answer: 'No. Payments go to your crypto wallet. Hold as stablecoins or cash out to local currency. Perfect for new gyms without banking history, international franchises, or anyone who wants to avoid traditional banking hassles. This is revolutionary for fitness businesses worldwide.',
        category: 'Setup',
      },
    ],
    
    testimonials: [
      {
        quote: 'Migrated from MindBody and immediately saved $450/month. Zero failed payments now - members just stay active. ROI was instant.',
        author: 'Marcus Johnson',
        business: 'IronWorks Fitness, Denver',
        savings: '$5,400/year',
      },
    ],
    
    relatedIndustries: ['yoga-studios', 'martial-arts', 'crossfit', 'pilates', 'dance-studios'],
    relatedUseCases: ['recurring-billing', 'membership-management', 'class-scheduling', 'mobile-check-in'],
  };
