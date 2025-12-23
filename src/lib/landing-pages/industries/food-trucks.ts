import { IndustryLandingData } from '../types';

export const foodTrucks: IndustryLandingData = {
    slug: 'food-trucks',
    name: 'Food Trucks',
    icon: '🚚',
    
    title: 'Accept Crypto Payments for Food Trucks | Mobile POS | PortalPay',
    metaDescription: 'Food truck crypto payment processing. Save 70% vs Square. Free mobile POS with offline mode, location tracking, and menu management. Perfect for mobile vendors.',
    keywords: [
      'food truck crypto payments',
      'mobile vendor bitcoin',
      'food truck payment processor',
      'offline mobile pos',
      'street food crypto',
    ],
    
    heroHeadline: 'Accept Crypto Payments at Your Food Truck',
    heroSubheadline: 'Customers scan QR to pay anywhere you park. Save 70% on fees. Free mobile POS with offline mode, location tracking, and menu management.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.6-2.9% plus internet fees for mobile readers',
      'Square mobile reader costs $49-79 per device',
      'Unreliable internet at outdoor locations',
      'Managing inventory across multiple locations',
      'Payment terminals dying during busy service',
    ],
    
    solutions: [
      'Pay only 0.5-1% per transaction',
      'Works on any phone/tablet - no hardware needed',
      'Offline mode syncs when back online',
      'Track inventory and sales by location',
      'QR codes never run out of battery',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $1,200-2,000 Annually',
        description: 'On $5k/month volume, save $1,200/year in fees vs Square. No hardware costs or mobile reader fees.',
        stat: '70% Lower Fees',
      },
      {
        icon: '📱',
        title: 'Works on Any Device',
        description: 'Use your existing phone or tablet. Display QR code or show to customers. No $49-79 Square readers. No charging cables.',
        stat: '$0 Hardware',
      },
      {
        icon: '🔌',
        title: 'Offline Mode Included',
        description: 'Bad signal at the park? Keep accepting payments. Transactions sync automatically when you get back online.',
        stat: 'Never Miss Sales',
      },
      {
        icon: '📍',
        title: 'Location Tracking',
        description: 'Track sales by location. See which spots perform best. Plan your route based on real data. Optimize for maximum revenue.',
        stat: 'Smart Routing',
      },
      {
        icon: '⚡',
        title: 'Lightning Fast',
        description: 'During lunch rush, every second counts. Customer scans QR, pays in 10 seconds, done. No swiping, no PIN entry, no receipt printing.',
        stat: '10-Second Checkout',
      },
      {
        icon: '🌍',
        title: 'Perfect for Events',
        description: 'Festivals, concerts, farmers markets. Accept payments anywhere. No wifi needed. Track event performance separately.',
        stat: 'Unlimited Events',
      },
    ],
    
    avgMonthlyVolume: 5000,
    competitorComparison: {
      square: {
        processingFee: 0.026,
        flatFee: 0.10,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
      clover: {
        processingFee: 0.023,
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
    },
    
    useCases: [
      {
        title: 'Lunch Rush at Business Parks',
        description: 'Park near offices. Workers scan QR, order, pay in 10 seconds. Serve more customers faster during short lunch window.',
        example: 'Truck doing $5k/month saves $1,200/year on fees, serves 20% more customers due to speed.',
        savings: '$1,200/year + more revenue',
      },
      {
        title: 'Festival & Event Circuit',
        description: 'Weekend festivals often have poor cell service. Offline mode keeps you selling. Sync sales when you leave.',
        example: 'Vendor at 2 festivals/month doing $2k/event saves $480/year, never misses sales due to connectivity.',
        savings: '$480/year',
      },
      {
        title: 'Multi-Location Route',
        description: 'Track sales at each location. Tuesday at Park A = $400, Wednesday at Park B = $600. Optimize your schedule.',
        example: 'Truck with 5-day route improves revenue 15% by identifying and focusing on best locations.',
        savings: '$900/year in optimized sales',
      },
    ],
    
    industryFeatures: [
      'Mobile POS',
      'Offline Mode',
      'Location Tracking',
      'Route Planning',
      'Quick-Serve Menu',
      'Real-Time Inventory',
      'Event Management',
      'Weather-Based Analytics',
      'Customer Frequency',
      'Peak Time Tracking',
    ],
    
    includedFeatures: [
      {
        name: 'Offline Mode',
        description: 'Accept payments without internet, sync later',
        usualCost: '$40/mo',
      },
      {
        name: 'Location Analytics',
        description: 'Track sales by spot, identify best locations',
        usualCost: '$50/mo',
      },
      {
        name: 'Mobile Inventory',
        description: 'Track stock on the go, know when to restock',
        usualCost: '$30/mo',
      },
      {
        name: 'Event Tracking',
        description: 'Separate reporting for festivals, farmers markets',
        usualCost: '$25/mo',
      },
      {
        name: 'Quick Menu',
        description: 'Fast-service optimized menu, large buttons',
        usualCost: '$20/mo',
      },
      {
        name: 'Multi-Device Sync',
        description: 'Use multiple tablets, data syncs across all',
        usualCost: '$60/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet and set up food truck profile',
      'Add logo, truck name, and photos of food',
      'Build simple menu optimized for mobile ordering',
      'Test offline mode in airplane mode',
      'Print laminated QR code for display',
      'Add your locations and schedule',
      'Start serving - works anywhere you park',
    ],
    
    faqs: [
      {
        question: 'How does offline mode work?',
        answer: 'Turn on offline mode before going to location with poor signal. Customers still scan QR and pay (their phones have data). Transactions store locally on your device. When you get back to wifi, everything syncs automatically to your dashboard. You never miss a sale due to bad cell service.',
        category: 'Technical',
      },
      {
        question: 'Do I need to buy card readers or special hardware?',
        answer: 'No! Just use your existing phone or tablet. Display QR code on screen or print a laminated QR tent card. Customers scan with their phones to pay. No Square readers ($49-79), no battery charging, no Bluetooth pairing. Way simpler.',
        category: 'Hardware',
      },
      {
        question: 'What if customers don\'t have crypto?',
        answer: 'They pay with regular credit card or Apple Pay through QR code. Our onramp handles it instantly. 99% of your customers will never know crypto is involved. They just see a normal payment screen. You get the low fees of crypto.',
        category: 'Payments',
      },
      {
        question: 'Can I track which locations make the most money?',
        answer: 'Yes! Tag each transaction with location. Dashboard shows: Monday at Business Park = $520, Tuesday at University = $680, etc. Use this data to plan your weekly route. Focus on highest-revenue spots. Optimize for weather and events.',
        category: 'Analytics',
      },
      {
        question: 'How fast is checkout during lunch rush?',
        answer: 'About 10 seconds total. Customer scans QR while you\'re making their order. They select item, pay, done. No fumbling with cards, no PIN entry, no receipt printing. Faster than Square or traditional terminals. Serve more customers per hour.',
        category: 'Speed',
      },
    ],
    
    testimonials: [
      {
        quote: 'No more Square readers dying during lunch rush. QR codes never run out of battery. Plus I\'m saving $100/month on fees. Best switch I made.',
        author: 'Carlos Mendez',
        business: 'Taco Express Truck, LA',
        savings: '$1,200/year',
      },
    ],
    
    relatedIndustries: ['restaurants', 'cafes', 'catering', 'street-food', 'mobile-vendors'],
    relatedUseCases: ['mobile-payments', 'offline-mode', 'qr-code-payments', 'location-tracking'],
  };
