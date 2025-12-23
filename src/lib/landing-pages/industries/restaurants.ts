import { IndustryLandingData } from '../types';

export const restaurants: IndustryLandingData = {
    slug: 'restaurants',
    name: 'Restaurants',
    icon: '🍽️',
    
    title: 'Accept Crypto Payments for Restaurants | 0.5-1% Fee | PortalPay',
    metaDescription: 'Restaurant crypto payment processing. Pay only 0.5-1% vs 2.9%+. Free POS with kitchen display, table management, menu builder. Accept cards without a bank account. Save $3,000+ annually.',
    keywords: [
      'restaurant crypto payments',
      'accept bitcoin restaurant',
      'crypto payment restaurant',
      'low fee restaurant pos',
      'qr code menu payments',
      'restaurant payment processor',
      'accept crypto no bank account',
    ],
    
    heroHeadline: 'Accept Crypto Payments at Your Restaurant',
    heroSubheadline: 'Customers scan QR codes on receipts and pay with crypto or cards. You save 70% on fees. Free POS with kitchen display, menu management, and analytics.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo Portal',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.9%+ in credit card processing fees',
      'Waiting 2-3 days for payment settlement',
      'Losing 1-2% to chargebacks and fraud',
      'Spending $165/mo+ per POS terminal (Toast, Square)',
      'Complex banking requirements for international merchants',
    ],
    
    solutions: [
      'Pay only 0.5-1% per transaction - save $3,000-5,000 annually',
      'Instant settlement to your crypto wallet',
      'Zero chargebacks with crypto finality',
      'Free restaurant POS with kitchen display, table management, modifiers',
      'Accept payments without a traditional bank account',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $3,000-5,000 Annually',
        description: 'Reduce processing fees from 2.9% to 0.5-1%. On $15k/month volume, save $3,900/year in fees alone. Plus save $1,980/year on POS software.',
        stat: '70% Lower Fees',
      },
      {
        icon: '🆓',
        title: 'Free Restaurant POS',
        description: 'Complete POS system included: kitchen display, table management, menu builder with modifiers, prep times, dietary tags. Usually costs $165/mo+ with Toast or Square.',
        stat: '$1,980/yr Saved',
      },
      {
        icon: '⚡',
        title: 'Instant Settlement',
        description: 'Funds available immediately in your crypto wallet. No more waiting 2-3 days for batch settlement. Use funds instantly or cash out when you want.',
        stat: 'Same-Day Access',
      },
      {
        icon: '🔒',
        title: 'Zero Chargebacks',
        description: 'Crypto transactions are final. No more losing 1-2% to fraudulent chargebacks. Save an additional $150-300/month on average.',
        stat: 'No Fraud Loss',
      },
      {
        icon: '🌍',
        title: 'No Bank Account Needed',
        description: 'Our onramp lets customers pay with cards or Apple Pay, instantly converted to crypto. Perfect for international merchants who struggle with traditional banking.',
        stat: 'Global Access',
      },
      {
        icon: '📊',
        title: 'Real-Time Analytics',
        description: 'Track sales, popular dishes, peak hours, and server performance. Built-in analytics that usually cost $50-100/month extra with other POS systems.',
        stat: 'All Included',
      },
    ],
    
    avgMonthlyVolume: 15000,
    competitorComparison: {
      toast: {
        processingFee: 0.0249,
        flatFee: 0.15,
        monthlyFee: 165,
        annualSoftwareCost: 1980,
      },
      square: {
        processingFee: 0.026,
        flatFee: 0.10,
        monthlyFee: 60,
        annualSoftwareCost: 720,
      },
      stripe: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 50,
        annualSoftwareCost: 600,
      },
    },
    
    useCases: [
      {
        title: 'QR Code Table Service',
        description: 'Print QR codes on guest checks. Customers scan with phone, pay with crypto wallet or card, and add tip - all in 30 seconds.',
        example: 'Casual dining restaurant processing $12k/month saves $2,640/year vs Square, plus $720/year on POS software.',
        savings: '$3,360/year',
      },
      {
        title: 'Fast-Casual Counter Service',
        description: 'Display QR code at checkout. Customer scans, pays, and receives digital receipt. Average transaction time: 15 seconds.',
        example: 'Fast-casual chain with 3 locations processing $40k/month total saves $11,520/year on fees, $5,940/year on software.',
        savings: '$17,460/year',
      },
      {
        title: 'Food Delivery Integration',
        description: 'Add QR codes to delivery receipts. Customers can pay delivery fees in crypto, tipping drivers directly without platform fees.',
        example: 'Restaurant doing $5k/month in delivery saves $1,440/year vs delivery platform processing.',
        savings: '$1,440/year',
      },
    ],
    
    industryFeatures: [
      'Kitchen Display System (KDS)',
      'Table Management',
      'Menu Builder with Categories',
      'Modifiers & Add-ons',
      'Dietary Tags & Allergen Info',
      'Prep Time Tracking',
      'Split Bill by Item or Guest',
      'Server Assignment',
      'Tip Management',
      'Inventory Tracking',
    ],
    
    includedFeatures: [
      {
        name: 'Kitchen Display System',
        description: 'Real-time order display for kitchen staff with prep timers',
        usualCost: '$50/mo',
      },
      {
        name: 'Table Management',
        description: 'Visual table layout, server sections, turn time tracking',
        usualCost: '$30/mo',
      },
      {
        name: 'Menu Builder',
        description: 'Unlimited items, categories, modifiers, and dietary tags',
        usualCost: '$40/mo',
      },
      {
        name: 'Sales Analytics',
        description: 'Real-time dashboard with sales trends, popular items, peak hours',
        usualCost: '$60/mo',
      },
      {
        name: 'Multi-Location Support',
        description: 'Manage multiple restaurants from one dashboard',
        usualCost: '$100/mo',
      },
      {
        name: 'White-Label Portal',
        description: 'Branded payment portal with your logo, colors, and style',
        usualCost: '$75/mo',
      },
    ],
    
    setupSteps: [
      'Connect your crypto wallet in Admin panel (or create new one)',
      'Upload restaurant logo, set brand colors, add menu background image',
      'Build your menu: add categories, dishes, modifiers (e.g., protein add-ons, sides)',
      'Set up kitchen display layout and table arrangement',
      'Configure tax rates and tip defaults (15%, 18%, 20%)',
      'Generate QR codes for tables or print on receipts',
      'Start accepting payments - customers pay with crypto or cards instantly',
    ],
    
    faqs: [
      {
        question: 'How do customers pay with crypto at my restaurant?',
        answer: 'Print a QR code on the check or display it at the counter. Customers scan with their phone and can pay three ways: (1) Directly with crypto from their wallet (USDC, USDT, Bitcoin, Ethereum, XRP), (2) With credit/debit card through our onramp (instantly converts to crypto), or (3) With Apple Pay or Google Pay. The entire process takes 10-30 seconds. They can add tip and get a digital receipt immediately.',
        category: 'Getting Started',
      },
      {
        question: 'Do customers need a crypto wallet or bank account?',
        answer: 'No! While crypto-savvy customers can pay directly from their wallets, anyone can pay using a credit card, debit card, Apple Pay, or Google Pay through our onramp system. We instantly convert their traditional payment to crypto. This means ALL your customers can pay, whether they own crypto or not.',
        category: 'Payments',
      },
      {
        question: 'How much can I really save compared to Square or Toast?',
        answer: 'On average, restaurants save 70-85% on total costs. Example: Restaurant processing $15,000/month with Toast pays $374 in fees + $165 monthly software = $539/mo ($6,468/year). With PortalPay: $75-150 in fees + $0 monthly = $75-150/mo ($900-1,800/year). Annual savings: $4,668-5,568. Plus you get better features completely free.',
        category: 'Pricing',
      },
      {
        question: 'Do I need a traditional bank account to use PortalPay?',
        answer: 'No! This is a major advantage for international restaurants or new businesses. You only need a crypto wallet (we can help you create one in minutes). Payments settle directly to your wallet. You can hold crypto, convert to stablecoins, or cash out to your local currency using any crypto exchange. This eliminates banking barriers for merchants worldwide.',
        category: 'Setup',
      },
      {
        question: 'What happens if a customer wants a refund?',
        answer: 'You have full control. Through the admin panel, you can issue refunds which are sent back to the customer\'s wallet. While crypto transactions are final, you as the merchant can always choose to refund. This actually protects YOU from fraudulent chargebacks that plague traditional processors.',
        category: 'Payments',
      },
      {
        question: 'Can I still accept regular credit cards?',
        answer: 'Yes! Through our onramp integration, customers can pay with any credit/debit card or Apple Pay. They don\'t need crypto - we handle the conversion instantly. You receive crypto (with its low fees), they pay however they want. Best of both worlds.',
        category: 'Features',
      },
      {
        question: 'Is the kitchen display system as good as Toast or Square?',
        answer: 'Yes, and in many ways better. Our KDS shows orders in real-time, tracks prep times, supports rush/fire orders, allows item modifications, and includes expo management. It\'s completely free and works on any tablet or screen. Toast charges $165/mo for similar features.',
        category: 'Features',
      },
      {
        question: 'How do split bills work?',
        answer: 'Incredibly easy. Generate one QR code for the table. First customer scans and selects their items (or even splits). QR code updates in real-time showing what\'s left. Next customer scans and pays their portion. Repeat until bill is settled. Or generate individual QR codes for each seat.',
        category: 'Features',
      },
      {
        question: 'What tokens/cryptocurrencies can customers use?',
        answer: 'We support USDC, USDT (stablecoins - always $1), cbBTC (Bitcoin), cbXRP (Ripple), and ETH (Ethereum) on the Base network. Most customers prefer stablecoins for instant, predictable payments. Plus anyone can pay with cards/Apple Pay through our onramp.',
        category: 'Technical',
      },
      {
        question: 'How fast is settlement compared to traditional processors?',
        answer: 'Instant. The crypto arrives in your wallet within seconds of the transaction. Compare to: Toast (2-3 business days), Square (1-2 business days), Stripe (2 business days). You can access your funds immediately, reinvest in supplies same-day, or hold as crypto.',
        category: 'Payments',
      },
      {
        question: 'Is this legal and compliant with regulations?',
        answer: 'Yes. We operate legally as a payment facilitator. Crypto payments are legal for businesses in the US and most countries. You still report revenue and pay taxes normally - crypto is just the payment method. We provide detailed transaction records for your accountant. No different than accepting any other form of payment.',
        category: 'Legal',
      },
      {
        question: 'What if crypto prices change while processing payment?',
        answer: 'We use stablecoins (USDC, USDT) pegged to the US dollar for this reason. $10 payment = $10 in stablecoins, always. If customers pay with Bitcoin or Ethereum, we can instantly convert to stablecoins for you. No volatility risk.',
        category: 'Technical',
      },
    ],
    
    testimonials: [
      {
        quote: 'We were paying Square $340/month in fees plus $60 for their restaurant POS. PortalPay cut our costs to under $100/month and gave us better features. The kitchen display is amazing.',
        author: 'Maria Chen',
        business: 'Fusion Bistro, San Francisco',
        savings: '$3,480/year',
      },
      {
        quote: 'As a new restaurant, getting approved for traditional payment processing was a nightmare. PortalPay let us start accepting payments in one day, no bank account needed. Now we save thousands on fees.',
        author: 'Carlos Rodriguez',
        business: 'Taqueria Moderna, Austin',
        savings: '$4,200/year',
      },
    ],
    
    relatedIndustries: ['cafes', 'bars', 'food-trucks', 'catering', 'bakeries', 'coffee-shops'],
    relatedUseCases: ['qr-code-payments', 'low-fee-processing', 'instant-settlement', 'split-bill-payments'],
  };
