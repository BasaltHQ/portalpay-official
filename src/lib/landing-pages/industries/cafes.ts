import { IndustryLandingData } from '../types';

export const cafes: IndustryLandingData = {
    slug: 'cafes',
    name: 'Cafes & Coffee Shops',
    icon: '☕',
    
    title: 'Accept Crypto Payments for Cafes | 0.5-1% Fee | PortalPay',
    metaDescription: 'Coffee shop crypto payment processing. Save 70% vs Square. Free POS with menu management, modifiers, and analytics. Perfect for cafes and coffee shops.',
    keywords: [
      'cafe crypto payments',
      'coffee shop bitcoin',
      'cafe payment processor',
      'low fee coffee shop pos',
    ],
    
    heroHeadline: 'Accept Crypto Payments at Your Cafe',
    heroSubheadline: 'Customers scan QR codes to pay for coffee and food. Save 70% on fees. Free POS with menu management, modifiers, and customer loyalty.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.6-2.9% on every coffee and pastry sale',
      'Square/Toast charging $60-165/month for basic POS',
      'Long lines during morning rush',
      'Tips reducing effective take-home revenue',
      'High cost to process small transactions',
    ],
    
    solutions: [
      'Pay only 0.5-1% per transaction',
      'Free cafe POS with favorites/modifiers',
      'QR code ordering reduces line wait time',
      'Digital tips go straight to staff wallets',
      'Perfect for $3-8 average transactions',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $1,800-2,500 Annually',
        description: 'On $7k/month volume (typical small cafe), save $1,680/year in fees vs Square. Plus save $720/year on POS software.',
        stat: '70% Lower Costs',
      },
      {
        icon: '🆓',
        title: 'Free Cafe POS',
        description: 'Menu with favorites, milk options, size selections, add-ons (extra shot, flavor). Usually costs $60-165/month with Square or Toast.',
        stat: '$720-1,980/yr Saved',
      },
      {
        icon: '⚡',
        title: 'Faster Checkout',
        description: 'Customer scans QR, selects items, pays - all on their phone while in line. Orders transmit to barista station instantly.',
        stat: '30% Faster Lines',
      },
      {
        icon: '💝',
        title: 'Digital Tips',
        description: 'Customers add tips when paying. Tips go directly to staff crypto wallets (or pooled and split). No tip jar, no cash handling.',
        stat: 'Direct to Staff',
      },
      {
        icon: '🌍',
        title: 'Tourist Friendly',
        description: 'International tourists pay without currency conversion or foreign transaction fees. Their home credit cards work via onramp.',
        stat: 'Zero FX Fees',
      },
      {
        icon: '📊',
        title: 'Sales Analytics',
        description: 'Track popular drinks, peak hours, barista performance, customer frequency. Optimize menu and staffing based on data.',
        stat: 'All Included',
      },
    ],
    
    avgMonthlyVolume: 7000,
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
      stripe: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
    },
    
    useCases: [
      {
        title: 'Morning Rush Efficiency',
        description: 'Customers order via QR while in line. Orders automatically transmit to bar. Pay before reaching counter. Reduces wait time by 30%.',
        example: 'Busy cafe doing $7k/month saves $1,680/year on fees, $720/year on POS, increases throughput.',
        savings: '$2,400/year + more customers',
      },
      {
        title: 'Coffee Subscription Model',
        description: 'Sell monthly unlimited coffee subscriptions. Customer pays once, scans QR daily for free drink. System tracks usage automatically.',
        example: '50 subscribers at $100/month = $5k recurring revenue with zero processing friction.',
        savings: '$1,200/year in fees',
      },
      {
        title: 'Artisan Roaster Direct Sales',
        description: 'Sell bags of beans alongside coffee drinks. Customers buy retail bags with same QR system. Track inventory of both beans and drinks.',
        example: 'Roaster doing $3k/month in retail beans saves $720/year on those sales alone.',
        savings: '$720/year',
      },
    ],
    
    industryFeatures: [
      'Menu with Favorites',
      'Milk Alternatives',
      'Size Options',
      'Flavor Shots & Add-ons',
      'Barista Order Screen',
      'Customer Name on Orders',
      'Tip Management',
      'Peak Hour Analytics',
      'Popular Items Tracking',
      'Customer Frequency Reports',
    ],
    
    includedFeatures: [
      {
        name: 'Cafe Menu System',
        description: 'Build menu with modifiers, favorites, seasonal specials',
        usualCost: '$40/mo',
      },
      {
        name: 'Order Display',
        description: 'Barista screen showing active orders, customer names, specs',
        usualCost: '$50/mo',
      },
      {
        name: 'Tip Management',
        description: 'Digital tips, split by shift, instant payout to staff',
        usualCost: '$30/mo',
      },
      {
        name: 'Customer Loyalty',
        description: 'Track regular customers, purchase frequency, favorites',
        usualCost: '$60/mo',
      },
      {
        name: 'Analytics Dashboard',
        description: 'Peak hours, popular drinks, barista efficiency, revenue trends',
        usualCost: '$50/mo',
      },
      {
        name: 'Multi-Location',
        description: 'Manage multiple cafe locations from one dashboard',
        usualCost: '$100/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet and configure cafe details',
      'Upload logo, set brand colors and theme',
      'Build menu: drinks, pastries, add-ons, modifiers',
      'Set up size options (Small, Medium, Large) and pricing',
      'Configure milk alternatives and extra shots',
      'Print QR codes for counter or table tent display',
      'Start serving - customers scan, order, and pay instantly',
    ],
    
    faqs: [
      {
        question: 'How do customers order coffee with crypto?',
        answer: 'Customer scans QR code displayed at counter or table. They see your menu on their phone, select drink and customize (size, milk, shots, flavors), add to cart, and pay with crypto wallet OR credit card (via onramp). Takes 20-30 seconds total. Order transmits instantly to barista screen with customer name and specifications. When drink is ready, call their name like normal.',
        category: 'Operations',
      },
      {
        question: 'Do customers need crypto to buy coffee?',
        answer: 'No! While crypto enthusiasts can pay directly with wallets, any customer can pay with regular credit/debit card, Apple Pay, or Google Pay through our onramp. We handle the crypto conversion instantly. To the customer, it feels like any other digital payment. You get the benefits of low-fee crypto processing.',
        category: 'Payments',
      },
      {
        question: 'How much faster is this than traditional POS?',
        answer: 'During rush hours, 30-40% faster. Traditional: Customer waits in line → Orders verbally → Cashier enters order → Customer pays → Moves to pickup. With PortalPay: Customer scans QR while in line → Orders on phone → Pays immediately → Order already at barista station when customer reaches counter. Eliminates the order+payment bottleneck.',
        category: 'Efficiency',
      },
      {
        question: 'How do tips work for baristas?',
        answer: 'Customers can add tip when paying (15%, 18%, 20%, or custom). Tips can go: (1) Directly to individual barista wallet, (2) Into shared tip pool split by hours worked, (3) Any custom split you configure. All automated, no cash counting at end of shift. Baristas can cash out whenever they want.',
        category: 'Tips',
      },
      {
        question: 'Can I handle seasonal menu changes easily?',
        answer: 'Yes. Add/remove items from menu in seconds through admin panel. Launch pumpkin spice lattes in fall, remove in spring. Update prices, add limited-time specials, feature new roasts. Changes appear instantly on customer-facing QR menu. No reprinting menus or POS reprogramming.',
        category: 'Features',
      },
      {
        question: 'What about tourists who don\'t have crypto?',
        answer: 'Perfect for tourist-heavy cafes! International credit cards work via our onramp with no foreign transaction fees (which banks typically charge 3%). A tourist from Japan can pay with their Japanese credit card, no currency conversion issues, no fees. Better experience than traditional payment for international customers.',
        category: 'International',
      },
      {
        question: 'Do I need a bank account to use this?',
        answer: 'No. This is revolutionary for new cafes or international locations. Payments go to your crypto wallet. Hold as stablecoins (always worth $1 USD), or cash out to local currency via any exchange. No traditional banking relationship required. Perfect for cafes in countries with difficult banking or new businesses without banking history.',
        category: 'Setup',
      },
      {
        question: 'Can I track which drinks are most popular?',
        answer: 'Yes. Analytics dashboard shows: most popular drinks, busiest hours, average ticket size, customer frequency, barista performance, inventory needs prediction. Use data to optimize menu, staffing, and inventory ordering. This level of analytics normally costs $50-100/month extra with Square or Toast.',
        category: 'Analytics',
      },
      {
        question: 'What if my cafe has multiple locations?',
        answer: 'Multi-location management is included free (Square charges $60-100/month per additional location). See consolidated reporting across all cafes, compare performance, transfer supplies/staff between locations, manage different menus per location if needed. All from one dashboard.',
        category: 'Scaling',
      },
      {
        question: 'How much do I really save vs Square?',
        answer: 'Typical small cafe: $7,000/month revenue. Square: $182 fees (2.6% + 10¢) + $60 POS = $242/mo ($2,904/year). PortalPay: $52.50 fees (0.75% avg) + $0 POS = $52.50/mo ($630/year). Annual savings: $2,274. Plus faster lines means more customers served during rush = additional revenue.',
        category: 'Pricing',
      },
    ],
    
    testimonials: [
      {
        quote: 'Switching from Square saved us $190/month and actually sped up our morning rush. Customers love ordering while in line. Game changer for a busy cafe.',
        author: 'Mike Chen',
        business: 'Roasted & Co., Seattle',
        savings: '$2,280/year',
      },
    ],
    
    relatedIndustries: ['restaurants', 'bakeries', 'juice-bars', 'ice-cream-shops', 'tea-shops'],
    relatedUseCases: ['qr-code-payments', 'mobile-ordering', 'low-fee-processing', 'digital-tips'],
  };
