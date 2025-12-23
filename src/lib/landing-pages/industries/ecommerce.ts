import { IndustryLandingData } from '../types';

export const ecommerce: IndustryLandingData = {
    slug: 'ecommerce',
    name: 'E-commerce Stores',
    icon: '🛒',
    
    title: 'Accept Crypto for E-commerce | Global Checkout | PortalPay',
    metaDescription: 'E-commerce crypto payments. Accept global orders instantly. 0.5-1% vs Shopify 2.9%. Free checkout widget. No chargebacks. International customers love it.',
    keywords: [
      'ecommerce crypto payments',
      'shopify crypto alternative',
      'accept bitcoin online store',
      'global ecommerce payments',
      'low fee payment gateway',
    ],
    
    heroHeadline: 'Accept Crypto in Your Online Store',
    heroSubheadline: 'Add crypto checkout in 5 minutes. Accept orders from anywhere. Save 70% on fees. Zero chargebacks. Perfect for international e-commerce.',
    heroCTA: {
      primary: 'Start Free',
      primaryLink: '/admin',
      secondary: 'Try Demo',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying 2.9% + 30¢ on every order',
      'Shopify/WooCommerce monthly fees adding up',
      'Losing 1-2% to chargebacks',
      'International orders declined or expensive',
      'Customers want crypto payment option',
    ],
    
    solutions: [
      'Pay only 0.5-1% per order',
      'Free checkout widget for any platform',
      'Zero chargebacks with crypto',
      'Accept from any country instantly',
      'Crypto enthusiasts love shopping with crypto',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Save $3,000-8,000 Annually',
        description: 'On $20k/month sales, save $5,760/year in processing fees vs Shopify Payments. Plus avoid chargeback losses.',
        stat: '70% Lower Fees',
      },
      {
        icon: '🌍',
        title: 'True Global Commerce',
        description: 'Sell to customers in any country. No declined international cards. No currency conversion issues. Instant payment.',
        stat: 'Zero Borders',
      },
      {
        icon: '🔒',
        title: 'Zero Chargebacks',
        description: 'Crypto transactions are final. No more losing 1-2% to fraudulent chargebacks. Especially important for digital products.',
        stat: 'No Fraud Loss',
      },
      {
        icon: '🚀',
        title: 'Tap Crypto Market',
        description: 'Crypto holders actively seek stores accepting crypto. Marketing opportunity. Stand out from competitors.',
        stat: 'New Customers',
      },
      {
        icon: '⚡',
        title: 'Instant Settlement',
        description: 'Funds in wallet immediately. Restock inventory same-day. No waiting 2-3 days for payment processing.',
        stat: 'Same-Day Cash',
      },
      {
        icon: '🔌',
        title: 'Easy Integration',
        description: 'Add to Shopify, WooCommerce, custom site in minutes. Checkout widget or API. Works with any e-commerce platform.',
        stat: '5-Min Setup',
      },
    ],
    
    avgMonthlyVolume: 20000,
    competitorComparison: {
      shopify: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 79,
        annualSoftwareCost: 948,
      },
      stripe: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
      paypal: {
        processingFee: 0.029,
        flatFee: 0.30,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
    },
    
    useCases: [
      {
        title: 'International Sales',
        description: 'Customer in Japan buys from your US store. Pays with crypto or card via onramp. No international fees. Instant confirmation.',
        example: 'Store with 30% international sales ($6k/month) saves $1,800/year on FX fees alone.',
        savings: '$1,800/year',
      },
      {
        title: 'Digital Products',
        description: 'Sell courses, ebooks, software. Zero chargeback risk. Customer pays, gets instant download. No more fraudulent refund requests.',
        example: 'Digital product store doing $10k/month saves $2,400/year on chargebacks (2%).',
        savings: '$2,400/year',
      },
      {
        title: 'High-Ticket Items',
        description: 'Luxury goods, electronics, jewelry. Large transactions benefit most from lower fees. Plus crypto buyers prefer expensive purchases in crypto.',
        example: 'Jewelry store averaging $500 orders, $15k/month, saves $4,320/year on processing.',
        savings: '$4,320/year',
      },
    ],
    
    industryFeatures: [
      'Checkout Widget',
      'Shopping Cart Integration',
      'Order Management',
      'Inventory Tracking',
      'Customer Accounts',
      'Discount Codes',
      'Shipping Integration',
      'Tax Calculation',
      'Multi-Currency Display',
      'Abandoned Cart Recovery',
    ],
    
    includedFeatures: [
      {
        name: 'Checkout Widget',
        description: 'Embeddable checkout for any website',
        usualCost: '$0 (built-in)',
      },
      {
        name: 'Order Management',
        description: 'Track orders, fulfillment, shipping',
        usualCost: '$30/mo',
      },
      {
        name: 'Inventory Sync',
        description: 'Real-time stock updates across all sales channels',
        usualCost: '$40/mo',
      },
      {
        name: 'Customer Portal',
        description: 'Order history, tracking, account management',
        usualCost: '$25/mo',
      },
      {
        name: 'Analytics Dashboard',
        description: 'Sales trends, conversion rates, customer insights',
        usualCost: '$50/mo',
      },
      {
        name: 'Multi-Currency',
        description: 'Display prices in 150+ currencies',
        usualCost: '$20/mo',
      },
    ],
    
    setupSteps: [
      'Connect wallet to receive payments',
      'Install checkout widget on your site (or use API)',
      'Configure product catalog and pricing',
      'Set up shipping zones and rates',
      'Enable crypto payment option at checkout',
      'Test order with crypto or card payment',
      'Start accepting orders from anywhere',
    ],
    
    faqs: [
      {
        question: 'How do I add crypto payments to my store?',
        answer: 'For Shopify: Install our app from App Store. For WooCommerce: Install plugin. For custom sites: Add our checkout widget (5 lines of code) or use API. Takes 5-10 minutes. Customers see "Pay with Crypto or Card" at checkout.',
        category: 'Setup',
      },
      {
        question: 'Do customers need crypto wallets to shop?',
        answer: 'No! While crypto enthusiasts can pay directly, any customer can pay with credit card or Apple Pay. Our onramp handles conversion instantly. Regular customers never know crypto is involved. You get the benefits (low fees, no chargebacks).',
        category: 'Customers',
      },
      {
        question: 'What about chargebacks on digital products?',
        answer: 'This is HUGE for digital product sellers. Traditional: customer buys course, downloads everything, then disputes charge. You lose money + product. With crypto: transactions are final. No chargebacks. Saves digital sellers 1-2% typically lost to fraud.',
        category: 'Chargebacks',
      },
      {
        question: 'How does this work for international customers?',
        answer: 'Perfect for global e-commerce. Customer in any country can pay. No international card declines. No currency conversion fees (which typically cost merchant 2-3%). Instant payment confirmation. Both you and customer save money.',
        category: 'International',
      },
      {
        question: 'Can I still use Shopify/WooCommerce?',
        answer: 'Yes! PortalPay works alongside your existing platform. Keep your store exactly as is. Just add crypto payment option. Or migrate to our hosted solution to save the $79/month Shopify fee too. Your choice.',
        category: 'Platform',
      },
    ],
    
    testimonials: [
      {
        quote: 'We sell digital courses. Chargebacks were costing us $2k/month. Switched high-ticket courses to crypto payment - chargebacks dropped to zero. Plus saving $400/month on fees.',
        author: 'Amanda Lee',
        business: 'Online Course Platform',
        savings: '$28,800/year including chargeback recovery',
      },
    ],
    
    relatedIndustries: ['dropshipping', 'digital-products', 'print-on-demand', 'subscription-boxes'],
    relatedUseCases: ['international-sales', 'no-chargebacks', 'digital-downloads', 'high-ticket'],
  };
