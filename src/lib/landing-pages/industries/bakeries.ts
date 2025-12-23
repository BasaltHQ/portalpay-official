import { IndustryLandingData } from '../types';

export const bakeries: IndustryLandingData = {
    slug: 'bakeries',
    name: 'Bakeries',
    icon: '🥖',
    
    title: 'Accept Crypto Payments for Bakeries | 0.5-1% Fee | PortalPay',
    metaDescription: 'Bakery crypto payment processing. Save 70% vs Square. Free POS with pre-orders, custom cakes, and inventory tracking. Perfect for retail bakeries.',
    keywords: [
      'bakery crypto payments',
      'accept bitcoin bakery',
      'bakery payment processor',
      'low fee bakery pos',
      'custom cake orders crypto',
    ],
    
    heroHeadline: 'Accept Crypto Payments at Your Bakery',
    heroSubheadline: 'Customers pay for pastries, custom cakes, and pre-orders with crypto or cards. Save 70% on fees. Free POS with inventory, pre-orders, and custom order management.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.6-2.9% on every sale including custom cake orders',
      'Expensive bakery POS systems ($60-120/month)',
      'Managing custom cake orders and pre-orders manually',
      'Tracking inventory for perishable goods',
      'Processing deposits for special orders',
    ],
    
    solutions: [
      'Pay only 0.5-1% per transaction',
      'Free bakery POS with custom order management',
      'Digital pre-order system with deposit collection',
      'Inventory tracking for ingredients and daily bakes',
      'Accept deposits without chargebacks',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $1,500-2,500 Annually',
        description: 'On $6k/month volume, save $1,440/year in fees vs Square. Plus save $720-1,440/year on POS and ordering software.',
        stat: '70% Lower Costs',
      },
      {
        icon: '🆓',
        title: 'Free Bakery POS',
        description: 'Complete system: daily inventory, custom orders, pre-order management, ingredient tracking. Usually costs $60-120/month.',
        stat: '$720-1,440/yr Saved',
      },
      {
        icon: '🎂',
        title: 'Custom Order Management',
        description: 'Customers submit custom cake requests online, pay deposit, track order status. You manage all special orders in one place.',
        stat: 'Unlimited Orders',
      },
      {
        icon: '📦',
        title: 'Inventory Tracking',
        description: 'Track daily bakes, ingredient usage, waste reduction. Low-stock alerts for flour, sugar, eggs. Plan production better.',
        stat: 'Reduce Waste 30%',
      },
      {
        icon: '🔒',
        title: 'No-Refund Deposits',
        description: 'Collect non-refundable deposits on custom orders. Crypto finality protects you from last-minute cancellations.',
        stat: 'Zero Cancellations',
      },
      {
        icon: '⚡',
        title: 'Pre-Order System',
        description: 'Customers order ahead for next-day pickup. You know exactly what to bake. Reduce waste, optimize production.',
        stat: 'All Included',
      },
    ],
    
    avgMonthlyVolume: 6000,
    competitorComparison: {
      square: {
        processingFee: 0.026,
        flatFee: 0.10,
        monthlyFee: 60,
        annualSoftwareCost: 720,
      },
      clover: {
        processingFee: 0.023,
        flatFee: 0.10,
        monthlyFee: 90,
        annualSoftwareCost: 1080,
      },
      shopify: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 79,
        annualSoftwareCost: 948,
      },
    },
    
    useCases: [
      {
        title: 'Custom Cake Orders',
        description: 'Customer submits design, you quote price, they pay 50% deposit in crypto. Balance due at pickup. Track all custom orders.',
        example: 'Bakery doing $2k/month in custom cakes saves $480/year on processing, eliminates cancelled orders.',
        savings: '$1,200/year',
      },
      {
        title: 'Daily Retail Sales',
        description: 'Display QR at register for walk-in customers. Scan items, customer pays. Track what sells best each day.',
        example: 'Shop doing $4k/month retail saves $960/year on fees, $720/year on POS software.',
        savings: '$1,680/year',
      },
      {
        title: 'Pre-Order & Catering',
        description: 'Customers pre-order online for events. Pay in advance. You know exactly what to bake.',
        example: 'Catering $1k/month in pre-orders saves $240/year, reduces waste by planning production.',
        savings: '$240/year + reduced waste',
      },
    ],
    
    industryFeatures: [
      'Custom Order Management',
      'Pre-Order System',
      'Inventory Tracking',
      'Daily Production Planning',
      'Ingredient Cost Tracking',
      'Recipe Management',
      'Waste Tracking',
      'Seasonal Item Scheduling',
      'Customer Preferences',
      'Pickup Time Slots',
    ],
    
    includedFeatures: [
      {
        name: 'Custom Order System',
        description: 'Manage custom cakes, special requests, design uploads',
        usualCost: '$40/mo',
      },
      {
        name: 'Pre-Order Management',
        description: 'Online ordering, pickup scheduling, payment collection',
        usualCost: '$50/mo',
      },
      {
        name: 'Inventory Tracking',
        description: 'Track ingredients, daily bakes, waste, reorder alerts',
        usualCost: '$30/mo',
      },
      {
        name: 'Recipe Costing',
        description: 'Calculate cost per item, track margins',
        usualCost: '$25/mo',
      },
      {
        name: 'Customer Database',
        description: 'Track preferences, allergies, favorite items',
        usualCost: '$30/mo',
      },
      {
        name: 'Analytics Dashboard',
        description: 'Best sellers, waste metrics, production efficiency',
        usualCost: '$40/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet and configure bakery details',
      'Upload logo, set brand colors, add photos',
      'Add menu items: pastries, bread, custom cakes',
      'Set up custom order form with design options',
      'Configure ingredient inventory and recipes',
      'Enable pre-order system with pickup times',
      'Display QR at register and accept online orders',
    ],
    
    faqs: [
      {
        question: 'How do customers order custom cakes with crypto?',
        answer: 'Customer visits your portal, fills out custom cake form (occasion, size, flavors, design notes, upload inspiration photos). You review request, provide quote. Customer pays 50% deposit with crypto or card via onramp. You bake the cake. Customer pays balance at pickup and leaves review. All managed in one system.',
        category: 'Custom Orders',
      },
      {
        question: 'Can I collect non-refundable deposits?',
        answer: 'Yes! This is crucial for custom orders. Set deposit percentage (typically 25-50%). Once customer pays deposit in crypto, it\'s final. If they cancel, you keep the deposit. This protects you from wasted ingredients and time. Traditional processors allow chargebacks - crypto doesn\'t.',
        category: 'Deposits',
      },
      {
        question: 'How does pre-ordering help reduce waste?',
        answer: 'Morning customers pre-order online for next-day pickup. You see exactly what to bake before starting production. Example: instead of baking 20 croissants hoping they sell, you bake exactly 15 that are pre-ordered plus 5 for walk-ins. Reduce waste 30-50%, save ingredient costs.',
        category: 'Operations',
      },
      {
        question: 'Do customers need crypto for daily purchases?',
        answer: 'No. Display QR at register. Customers scan and pay with credit card, debit card, or Apple Pay through our onramp. We convert to crypto instantly. They get normal payment experience, you get low fees. Crypto users can pay directly from wallets too.',
        category: 'Payments',
      },
      {
        question: 'Can I track ingredient costs and recipe margins?',
        answer: 'Yes. Enter ingredient costs (flour $5/lb, butter $8/lb). Build recipes (croissant uses 0.2lb flour, 0.1lb butter = $1.80 cost). System calculates margins automatically. See which items are most profitable. Adjust pricing based on real cost data.',
        category: 'Features',
      },
    ],
    
    testimonials: [
      {
        quote: 'Switched from Square and saved $140/month. The custom cake order system is a game-changer - no more text messages and confusion. Everything is organized.',
        author: 'Emma Thompson',
        business: 'Sweet Dreams Bakery, Portland',
        savings: '$1,680/year',
      },
    ],
    
    relatedIndustries: ['cafes', 'restaurants', 'catering', 'coffee-shops', 'ice-cream-shops'],
    relatedUseCases: ['pre-orders', 'custom-orders', 'low-fee-processing', 'inventory-management'],
  };
