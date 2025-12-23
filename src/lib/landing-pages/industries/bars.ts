import { IndustryLandingData } from '../types';

export const bars: IndustryLandingData = {
    slug: 'bars',
    name: 'Bars & Nightclubs',
    icon: '🍺',
    
    title: 'Accept Crypto Payments for Bars | 0.5-1% Fee | PortalPay',
    metaDescription: 'Bar crypto payment processing. Save 70% vs Square. Free POS with tab management, happy hour pricing, and analytics. Perfect for bars, pubs, and nightclubs.',
    keywords: [
      'bar crypto payments',
      'nightclub bitcoin',
      'bar payment processor',
      'low fee bar pos',
      'tab management system',
    ],
    
    heroHeadline: 'Accept Crypto Payments at Your Bar',
    heroSubheadline: 'Customers open tabs and pay with crypto or cards. Save 70% on fees. Free POS with tab management, happy hour pricing, and split checks.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.6-2.9% on every drink and tab',
      'Expensive POS systems with tab management',
      'Frequent credit card chargebacks from drunk customers',
      'Tips reducing take-home revenue',
      'High fraud rates on open tabs',
    ],
    
    solutions: [
      'Pay only 0.5-1% per transaction',
      'Free bar POS with tab management',
      'Zero chargebacks with crypto',
      'Digital tips straight to bartenders',
      'Prevent walkouts with prepaid tabs',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $2,000-4,000 Annually',
        description: 'On $10k/month volume, save $2,400/year in fees vs Square. Plus save $720-1,980/year on POS software.',
        stat: '70% Lower Costs',
      },
      {
        icon: '🆓',
        title: 'Free Bar POS',
        description: 'Tab management, happy hour pricing, drink modifiers, bartender assignment. Usually costs $60-165/month.',
        stat: '$720-1,980/yr Saved',
      },
      {
        icon: '🔒',
        title: 'Zero Chargebacks',
        description: 'Drunk customers can\'t dispute charges next morning. Crypto is final. Save 2-3% typically lost to chargebacks.',
        stat: 'No Fraud Loss',
      },
      {
        icon: '💝',
        title: 'Digital Tips',
        description: 'Customers tip when closing tab. Tips go directly to bartender wallets. No cash handling or tip pooling disputes.',
        stat: 'Direct to Staff',
      },
      {
        icon: '⚡',
        title: 'Prevent Walkouts',
        description: 'Require prepaid tabs with crypto. Card saved on file won\'t work - customer must pay upfront. Eliminates tab walkouts.',
        stat: 'Zero Walkouts',
      },
      {
        icon: '📊',
        title: 'Peak Hour Analytics',
        description: 'Track busiest times, top drinks, bartender performance. Optimize staffing and inventory based on real data.',
        stat: 'All Included',
      },
    ],
    
    avgMonthlyVolume: 10000,
    competitorComparison: {
      square: {
        processingFee: 0.026,
        flatFee: 0.10,
        monthlyFee: 60,
        annualSoftwareCost: 720,
      },
      toast: {
        processingFee: 0.0249,
        flatFee: 0.15,
        monthlyFee: 165,
        annualSoftwareCost: 1980,
      },
      clover: {
        processingFee: 0.023,
        flatFee: 0.10,
        monthlyFee: 100,
        annualSoftwareCost: 1200,
      },
    },
    
    useCases: [
      {
        title: 'Tab Management',
        description: 'Open tabs with QR scan. Add drinks throughout night. Customer closes tab via QR when leaving. Automatic tip prompt.',
        example: 'Busy bar doing $12k/month saves $2,640/year on fees, $720/year on POS, eliminates $300/month in walkouts.',
        savings: '$7,200/year',
      },
      {
        title: 'Happy Hour Pricing',
        description: 'Automatic price changes during happy hour. Schedule by day/time. No manual menu updates. Prevents pricing errors.',
        example: 'Bar with daily happy hour saves staff time and eliminates pricing mistakes that cost $200/month.',
        savings: '$2,400/year',
      },
      {
        title: 'Nightclub Cover Charges',
        description: 'Customers pay cover charge via QR at door. Wristband or stamp for re-entry. Track attendance automatically.',
        example: 'Nightclub collecting $3k/month in cover saves $720/year vs Square processing.',
        savings: '$720/year',
      },
    ],
    
    industryFeatures: [
      'Tab Management',
      'Happy Hour Scheduling',
      'Drink Modifiers',
      'Bartender Assignment',
      'Tip Management',
      'Age Verification Tracking',
      'Cover Charge Collection',
      'Peak Hour Analytics',
      'Drink Inventory',
      'Split Check by Person',
    ],
    
    includedFeatures: [
      {
        name: 'Tab Management',
        description: 'Open/close tabs, add drinks, prevent walkouts',
        usualCost: '$40/mo',
      },
      {
        name: 'Happy Hour Pricing',
        description: 'Automatic price changes by schedule',
        usualCost: '$30/mo',
      },
      {
        name: 'Bartender Performance',
        description: 'Track sales by bartender, tip earnings, efficiency',
        usualCost: '$50/mo',
      },
      {
        name: 'Drink Analytics',
        description: 'Popular drinks, peak hours, inventory needs',
        usualCost: '$60/mo',
      },
      {
        name: 'Split Checks',
        description: 'Split tabs by person or item easily',
        usualCost: '$20/mo',
      },
      {
        name: 'Multi-Location',
        description: 'Manage multiple bars from one dashboard',
        usualCost: '$100/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet and configure bar details',
      'Upload logo, set brand colors',
      'Build drink menu with categories and pricing',
      'Set up happy hour schedules',
      'Configure modifiers (rocks, neat, mixer options)',
      'Set up bartender stations and assignments',
      'Display QR codes at bar or on receipts',
    ],
    
    faqs: [
      {
        question: 'How do customers pay for drinks at the bar?',
        answer: 'Two options: (1) Pay per drink - customer scans QR after ordering, pays immediately. Takes 15 seconds. (2) Open tab - customer scans QR to open tab, bartender adds drinks throughout night, customer scans to close tab when leaving. Can pay with crypto wallet or card via onramp. Tips included when closing tab.',
        category: 'Payments',
      },
      {
        question: 'How does this prevent tab walkouts?',
        answer: 'Option 1: Require prepaid tabs - customer must pay first before opening tab (like prepaying for gas). Option 2: Crypto tab holds - we hold stablecoins when tab opens, settle when they close. Traditional credit card "hold" amounts don\'t work because customer can still dispute. With crypto, the hold is real money.',
        category: 'Fraud Prevention',
      },
      {
        question: 'What about chargebacks from drunk customers?',
        answer: 'This is a HUGE problem with traditional payment processors. Customers get drunk, rack up tab, wake up next day and dispute charges. With crypto payments, transactions are final. Customer can\'t chargeback. This alone saves bars 2-3% that\'s typically lost to chargebacks. On $10k/month, that\'s $200-300/month saved.',
        category: 'Fraud Prevention',
      },
      {
        question: 'How do tips work for bartenders?',
        answer: 'When customer closes tab, they add tip (15%, 18%, 20%, custom). Tips go: (1) Directly to bartender crypto wallet, or (2) Pooled and split by hours worked. All automatic. No cash counting. No tip disputes. Bartenders can cash out anytime. Much cleaner than traditional tip pooling.',
        category: 'Tips',
      },
      {
        question: 'Can I schedule happy hour pricing automatically?',
        answer: 'Yes. Set up schedules: Monday-Friday 4-7pm, certain drinks 50% off. System automatically updates prices. No need to manually change POS prices twice a day. Eliminates human error of forgetting to switch prices back. Can have different schedules for different days.',
        category: 'Features',
      },
      {
        question: 'Do customers need crypto to buy drinks?',
        answer: 'No. While crypto enthusiasts can pay directly, any customer can pay with credit/debit card or Apple Pay. Our onramp converts to crypto instantly. Customer experience is identical to traditional payment. You get low-fee crypto processing, they pay however they want.',
        category: 'Payments',
      },
      {
        question: 'How much do I really save vs Square?',
        answer: 'Typical bar: $10,000/month revenue. Square: $260 fees (2.6% + 10¢) + $60 POS = $320/mo ($3,840/year). PortalPay: $75 fees (0.75%) + $0 POS = $75/mo ($900/year). Annual savings: $2,940. Plus eliminate $300/month in chargebacks = extra $3,600/year. Total savings: $6,540/year.',
        category: 'Pricing',
      },
      {
        question: 'Can I track which drinks are most popular?',
        answer: 'Yes. Analytics show: top drinks by volume and revenue, busiest hours (staff accordingly), slowest times (cut staff), bartender performance (drinks/hour, average ticket, tips earned). Use this data to optimize inventory ordering, staffing schedules, and menu offerings.',
        category: 'Analytics',
      },
      {
        question: 'What if I have multiple locations?',
        answer: 'Multi-location management included free. See all bars in one dashboard. Compare performance. Manage different menus per location. Transfer inventory. Train staff at one location, deploy everywhere. Square charges $60+ per additional location. Ours is free.',
        category: 'Scaling',
      },
      {
        question: 'Do I need a bank account?',
        answer: 'No. Payments go to your crypto wallet. Hold as stablecoins (always worth $1 USD) or cash out to local currency. Perfect for new bars or international locations. No traditional banking required. This is revolutionary for bars in countries with difficult banking or new venues without banking history.',
        category: 'Setup',
      },
    ],
    
    testimonials: [
      {
        quote: 'Switching from Square saved us $270/month and eliminated chargebacks completely. The tab management is actually better. Best decision we made.',
        author: 'Jake Morrison',
        business: 'The Rusty Nail, Austin',
        savings: '$3,240/year + zero chargebacks',
      },
    ],
    
    relatedIndustries: ['restaurants', 'cafes', 'nightclubs', 'breweries', 'wine-bars'],
    relatedUseCases: ['tab-management', 'digital-tips', 'no-chargeback-payments', 'split-checks'],
  };
