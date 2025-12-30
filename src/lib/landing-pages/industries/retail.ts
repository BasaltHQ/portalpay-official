import { IndustryLandingData } from '../types';

export const retail: IndustryLandingData = {
    slug: 'retail',
    name: 'Retail Stores',
    icon: '🛍️',
    
    title: 'Accept Crypto Payments for Retail | 0.5-1% Fee | BasaltSurge',
    metaDescription: 'Retail crypto payment processing. Save 70% vs Square/Clover. Free POS with inventory, variations, and analytics. Accept cards without a bank account.',
    keywords: [
      'retail crypto payments',
      'accept bitcoin retail',
      'crypto payment pos',
      'low fee retail pos',
      'retail payment processor',
    ],
    
    heroHeadline: 'Accept Crypto Payments at Your Retail Store',
    heroSubheadline: 'Customers pay with crypto or cards at checkout. Save 70% on fees. Free POS with inventory management, product variations, and sales analytics.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.6-3.5% in card processing fees',
      'Expensive POS systems ($60-300/month)',
      'Complex inventory management software',
      'High monthly subscription costs',
      'Banking requirements for new stores',
    ],
    
    solutions: [
      'Pay only 0.5-1% per transaction',
      'Free retail POS with inventory tracking',
      'Product variations (size, color, etc.) included',
      'No monthly software fees',
      'Start accepting payments without a bank account',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $2,500-4,000 Annually',
        description: 'On $10k/month volume, save $2,880/year in fees vs Square. Plus save $720-3,600/year on POS software costs.',
        stat: '70% Lower Fees',
      },
      {
        icon: '🆓',
        title: 'Free Retail POS',
        description: 'Complete point of sale: inventory tracking, product variations (size/color), barcode scanning, sales reports. Usually costs $60-300/month.',
        stat: '$720-3,600/yr Saved',
      },
      {
        icon: '📦',
        title: 'Inventory Management',
        description: 'Track stock levels, low-stock alerts, purchase orders, multiple locations. Free features that competitors charge $50-100/month for.',
        stat: 'All Included',
      },
      {
        icon: '🎨',
        title: 'Product Variations',
        description: 'Handle size, color, material variations effortlessly. Each variant tracks separate inventory. Perfect for apparel and custom products.',
        stat: 'Unlimited SKUs',
      },
      {
        icon: '🌍',
        title: 'No Bank Account Needed',
        description: 'Customers pay with cards via onramp, converted to crypto instantly. Perfect for international stores or new businesses.',
        stat: 'Global Ready',
      },
      {
        icon: '📊',
        title: 'Sales Analytics',
        description: 'Track best sellers, inventory turnover, profit margins by product. Real-time dashboard with insights usually costing $75/month extra.',
        stat: 'Free Dashboard',
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
      clover: {
        processingFee: 0.023,
        flatFee: 0.10,
        monthlyFee: 100,
        annualSoftwareCost: 1200,
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
        title: 'Apparel Store with Variations',
        description: 'Sell clothing with multiple sizes and colors. Each variation tracks separate inventory. Customers pay at counter via QR code or tablet.',
        example: 'Boutique processing $8k/month saves $1,920/year on fees, $720/year on POS software.',
        savings: '$2,640/year',
      },
      {
        title: 'Multi-Location Retail Chain',
        description: 'Manage inventory across 3 locations. Transfer stock between stores. Consolidated reporting. Central payment processing.',
        example: 'Chain with $30k/month total volume saves $7,680/year on fees, $3,600/year on multi-location software.',
        savings: '$11,280/year',
      },
      {
        title: 'Pop-Up Shop or Market Vendor',
        description: 'Accept payments anywhere with tablet or phone. Offline mode for poor connectivity. Sync when back online.',
        example: 'Vendor doing $3k/month saves $720/year on fees, $720/year on mobile POS subscription.',
        savings: '$1,440/year',
      },
    ],
    
    industryFeatures: [
      'Inventory Management',
      'Product Variations (Size, Color, etc.)',
      'Barcode Scanning',
      'Low Stock Alerts',
      'Purchase Orders',
      'Multi-Location Support',
      'Sales Reports by Product',
      'Profit Margin Tracking',
      'Customer Profiles',
      'Gift Card Support',
    ],
    
    includedFeatures: [
      {
        name: 'Inventory Management',
        description: 'Real-time stock tracking, low-stock alerts, reorder points',
        usualCost: '$50/mo',
      },
      {
        name: 'Product Variations',
        description: 'Handle size, color, material variants with separate inventory',
        usualCost: '$30/mo',
      },
      {
        name: 'Multi-Location',
        description: 'Manage multiple stores, transfer inventory, consolidated reports',
        usualCost: '$100/mo',
      },
      {
        name: 'Sales Analytics',
        description: 'Best sellers, inventory turnover, profit margins, trends',
        usualCost: '$75/mo',
      },
      {
        name: 'Customer Database',
        description: 'Track purchase history, preferences, marketing campaigns',
        usualCost: '$40/mo',
      },
      {
        name: 'White-Label Portal',
        description: 'Branded checkout with your logo, colors, and style',
        usualCost: '$50/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet and configure store details',
      'Upload logo, set brand colors',
      'Add products with photos, prices, and descriptions',
      'Set up variations (sizes, colors) if needed',
      'Configure inventory and stock levels',
      'Generate QR codes for checkout or use tablet POS',
      'Start selling - customers pay with crypto or cards',
    ],
    
    faqs: [
      {
        question: 'How do customers pay at my retail store?',
        answer: 'Three options: (1) Display QR code at checkout - customers scan and pay with crypto wallet or card, (2) Use tablet POS - show amount, customer taps to pay, (3) Print QR on receipt - customer pays after leaving if desired. All methods accept crypto directly or credit/debit cards through our onramp. Average transaction time: 10-20 seconds.',
        category: 'Payments',
      },
      {
        question: 'Can I track inventory with different sizes and colors?',
        answer: 'Yes! Create product variations for size, color, material, style, etc. Each variation has its own SKU and inventory count. For example, a t-shirt in 5 sizes and 3 colors = 15 variations, each tracked separately. When a customer buys "Large Red", that specific variant inventory decreases. Low stock alerts work per-variant too.',
        category: 'Features',
      },
      {
        question: 'How much can I save compared to Square or Clover?',
        answer: 'Example: Retail store processing $10,000/month. Square charges $260 in fees + $60/mo software = $320/mo ($3,840/year). Clover charges $230 fees + $100/mo = $330/mo ($3,960/year). BasaltSurge charges $50-100 fees + $0/mo = $50-100/mo ($600-1,200/year). You save $2,640-3,360 annually. Actual savings scale with volume.',
        category: 'Pricing',
      },
      {
        question: 'Do I need a traditional bank account?',
        answer: 'No! This is perfect for new stores, international retailers, or anyone who has difficulty with traditional banking. Payments go directly to your crypto wallet. You can hold crypto, convert to stablecoins for stability, or cash out to local currency via any exchange. No bank account needed to start accepting payments.',
        category: 'Setup',
      },
      {
        question: 'What if I have multiple store locations?',
        answer: 'Our multi-location feature is included free (competitors charge $100-200/month). Manage all locations from one dashboard, transfer inventory between stores, see consolidated reporting, and individual performance metrics per location. Each location can have its own staff with appropriate access levels.',
        category: 'Features',
      },
      {
        question: 'Can customers still pay with regular credit cards?',
        answer: 'Absolutely! Through our onramp, customers can pay with any credit/debit card, Apple Pay, or Google Pay. We instantly convert it to crypto on the backend. They don\'t need a crypto wallet or even know it\'s crypto. You get the low fees of crypto processing, they pay however they want.',
        category: 'Payments',
      },
      {
        question: 'How does the inventory system compare to Square or Shopify?',
        answer: 'Full feature parity for most retail needs. Track stock levels, set low-stock alerts, create purchase orders, manage suppliers, handle returns/exchanges, and generate inventory reports. Square charges $60/mo for similar features, Shopify charges $79/mo. Ours is completely free.',
        category: 'Features',
      },
      {
        question: 'What about returns and exchanges?',
        answer: 'Handle returns through the admin panel. Issue refunds to customer wallets (if they paid with crypto) or to their original payment method (if they paid with card via onramp). Track return rates, reasons, and restocking. All return data appears in your analytics.',
        category: 'Operations',
      },
      {
        question: 'Can I use barcode scanners?',
        answer: 'Yes. Connect any standard USB or Bluetooth barcode scanner. Scan products to add to cart, check inventory, or perform stock counts. Set up barcodes when adding products, or import from existing system. Works with tablets, computers, or dedicated POS hardware.',
        category: 'Technical',
      },
      {
        question: 'How fast do I receive payment?',
        answer: 'Instant. Crypto arrives in your wallet within seconds of the transaction. Compare to: Square (1-2 days), Clover (2-3 days), Shopify Payments (2-3 days). You have immediate access to funds for restocking inventory or other needs. No waiting for batch processing.',
        category: 'Payments',
      },
    ],
    
    testimonials: [
      {
        quote: 'Switched from Square and immediately saved $220/month. The inventory system is actually better than what I was paying $60/month for. Best decision for my boutique.',
        author: 'Sarah Martinez',
        business: 'Boutique 28, Miami',
        savings: '$2,640/year',
      },
    ],
    
    relatedIndustries: ['boutiques', 'gift-shops', 'bookstores', 'electronics', 'sporting-goods'],
    relatedUseCases: ['qr-code-payments', 'low-fee-processing', 'inventory-management'],
  };
