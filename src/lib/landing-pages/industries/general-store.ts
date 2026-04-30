import { IndustryLandingData } from '../types';

export const generalStore: IndustryLandingData = {
    slug: 'general-store',
    name: 'General Store & Retail',
    icon: '🏪',
    
    title: 'Accept Crypto Payments for General Stores | 0.5-1% Fee | BasaltSurge',
    metaDescription: 'General store crypto payment processing. Pay only 0.5-1% vs 2.9%+. Universal point of sale with inventory, products, and services management.',
    keywords: [
      'general store crypto payments',
      'accept bitcoin retail',
      'universal pos system',
      'crypto payments for small business',
      'low fee payment processor',
      'crypto payments retail',
    ],
    
    heroHeadline: 'Universal Point of Sale for Any Business',
    heroSubheadline: 'Accept global stablecoins or credit cards effortlessly. Stop paying 2.9% + 30¢. Get a free universal POS with built-in inventory and product management.',
    heroCTA: {
      primary: 'Start Saving Now',
      primaryLink: '/admin',
      secondary: 'View Demo POS',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Paying high flat fees (2.9% + 30¢) that eat into small transaction margins',
      'Expensive, clunky POS hardware that locks you into long-term contracts',
      'Waiting days for payment settlement to hit your bank account',
      'Chargeback fraud from disputed credit card transactions',
      'Paying extra monthly fees for basic inventory tracking',
    ],
    
    solutions: [
      'Flat 0.5-1% processing fee with zero minimum transaction penalties',
      'Use any tablet, phone, or laptop as your POS terminal for free',
      'Instant same-day settlement directly to your secure wallet',
      'Crypto transactions are final, eliminating fraudulent chargebacks',
      'Free unlimited product and service inventory management',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Stop Losing Margins',
        description: 'Reduce processing fees from 2.9% + 30¢ down to a simple 0.5-1%. On a $5 item, legacy fees take 9%. With BasaltSurge, you pay pennies.',
        stat: '70%+ Lower Fees',
      },
      {
        icon: '⚡',
        title: 'Instant Settlement',
        description: 'Funds are available immediately in your wallet. No more waiting 2-3 business days or dealing with weekend settlement delays.',
        stat: 'Same-Day Access',
      },
      {
        icon: '📱',
        title: 'Free Universal POS',
        description: 'Complete point of sale system included completely free. Manage products, services, and inventory from any browser or device.',
        stat: '$0 Monthly Fees',
      },
      {
        icon: '🌍',
        title: 'Global Payment Onramp',
        description: 'Customers don\'t need crypto. They can pay via Apple Pay, Google Pay, or Credit Card, and it instantly settles as stablecoins in your wallet.',
        stat: 'Zero Friction',
      },
      {
        icon: '🔒',
        title: 'Zero Chargebacks',
        description: 'Protect your business from fraud. Crypto transactions are mathematically final, meaning you never lose inventory to chargeback scams.',
        stat: '100% Secure',
      },
      {
        icon: '📊',
        title: 'Real-Time Analytics',
        description: 'Track sales trends, popular items, and revenue growth with our built-in real-time analytics dashboard.',
        stat: 'Data Included',
      },
    ],
    
    avgMonthlyVolume: 10000,
    competitorComparison: {
      toast: {
        processingFee: 0.0249,
        flatFee: 0.15,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
      square: {
        processingFee: 0.026,
        flatFee: 0.10,
        monthlyFee: 0,
        annualSoftwareCost: 0,
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
        title: 'Small Ticket Retailers',
        description: 'Selling coffee, snacks, or convenience items? The 30¢ flat fee from legacy processors destroys your margin on a $3 sale. BasaltSurge\'s flat percentage saves you instantly.',
        example: 'A convenience store processing 1,000 $5 transactions saves $300 a month just by eliminating the flat fee.',
        savings: '$3,600/year',
      },
      {
        title: 'Pop-up Shops & Markets',
        description: 'Don\'t rent expensive hardware. Generate a QR code on your phone, or print it out on a sign. Customers scan to pay directly from their device.',
        example: 'A farmer\'s market vendor processing $5k/month avoids buying a $299 terminal and saves $1,200/year on fees.',
        savings: '$1,200/year',
      },
      {
        title: 'Service & Repair Shops',
        description: 'Invoice customers digitally and let them pay via secure link before picking up their item. Perfect for electronics repair, alterations, or general services.',
        example: 'A phone repair shop doing $15k/month saves $4,500 annually in processing fees.',
        savings: '$4,500/year',
      },
    ],
    
    industryFeatures: [
      'Universal POS Terminal',
      'Product & Inventory Tracking',
      'Service Management',
      'Digital Receipts',
      'Dynamic QR Codes',
      'Tipping & Tax Calculation',
      'Real-Time Analytics',
      'Multi-Employee Access',
      'No Hardware Required',
      'Instant Crypto Conversion',
    ],
    
    includedFeatures: [
      {
        name: 'Universal POS',
        description: 'A responsive, lightning-fast point of sale that works on any tablet or smartphone',
        usualCost: '$49/mo',
      },
      {
        name: 'Inventory Management',
        description: 'Track stock levels, set low-stock alerts, and manage product variants',
        usualCost: '$30/mo',
      },
      {
        name: 'Analytics Dashboard',
        description: 'Detailed insights into your sales volume, popular items, and customer retention',
        usualCost: '$20/mo',
      },
      {
        name: 'Customer Loyalty',
        description: 'Reward repeat customers with points, discounts, and XP automatically',
        usualCost: '$50/mo',
      },
      {
        name: 'Digital Invoicing',
        description: 'Send professional invoices via email or text that customers can pay instantly',
        usualCost: '$15/mo',
      },
      {
        name: 'Multi-Location Support',
        description: 'Manage multiple storefronts or pop-up tents from a single centralized dashboard',
        usualCost: '$30/mo',
      },
    ],
    
    setupSteps: [
      'Connect your wallet to the Admin panel to receive your funds',
      'Configure your store name, logo, brand colors, and tax rate',
      'Add your products or services to the inventory system',
      'Generate a static QR code for your counter, or use the live POS terminal',
      'Customers scan the code and pay using Apple Pay, Cards, or Crypto',
      'Funds arrive in your wallet instantly. No holds, no delays.',
    ],
    
    faqs: [
      {
        question: 'What if my customers don\'t have crypto?',
        answer: 'They don\'t need it! Our checkout flow includes a seamless fiat onramp. A customer can tap "Apple Pay" or enter their credit card. They pay in regular dollars, and our system instantly converts it to stablecoins (USDC) that settle in your wallet. It\'s exactly like a normal checkout for them.',
        category: 'Payments',
      },
      {
        question: 'Do I need to buy a specific card reader or terminal?',
        answer: 'No hardware required. You can run the BasaltSurge POS on any iPad, Android tablet, or smartphone you already own. Customers simply scan the QR code generated on your screen to pay.',
        category: 'Setup',
      },
      {
        question: 'Are stablecoins really stable?',
        answer: 'Yes. We process payments using USDC and USDT, which are digital dollars backed 1:1 by cash and US treasury bonds. $100 in USDC is always worth $100. There is no volatility risk like there is with Bitcoin or Ethereum.',
        category: 'Payments',
      },
      {
        question: 'How do I cash out to my bank account?',
        answer: 'Since you receive stablecoins directly to your wallet, you have total control. You can hold them, use them to pay suppliers, or send them to an exchange (like Coinbase or Kraken) to cash out to your local bank account at any time.',
        category: 'Payments',
      },
      {
        question: 'Are there really no monthly fees?',
        answer: 'Correct. Our universal POS, inventory management, and analytics are 100% free. We only charge a flat 0.5% to 1% fee on the transactions we process. If you don\'t make sales, you don\'t pay a dime.',
        category: 'Pricing',
      },
      {
        question: 'Is this legal for my business?',
        answer: 'Absolutely. Accepting digital currency is completely legal in the US and most countries. You simply report your revenue in USD for tax purposes, just like you would with cash or credit card sales. Our system provides detailed exportable reports for your accountant.',
        category: 'Legal',
      },
    ],
    
    testimonials: [
      {
        quote: 'We sell a lot of $3 and $4 items. Square\'s 30¢ flat fee was absolutely killing us. Switching to a flat 0.5% means we actually keep the money we make. The setup took literally 10 minutes.',
        author: 'David R.',
        business: 'Cornerstone Market',
        savings: '$4,100/year',
      },
      {
        quote: 'I run a mobile detailing business. Being able to just pull up a QR code on my phone and have the customer pay with Apple Pay right in their driveway is a game changer. And the money is in my wallet instantly.',
        author: 'Sarah M.',
        business: 'Elite Auto Detailing',
        savings: '$2,800/year',
      },
    ],
    
    relatedIndustries: ['retail', 'freelancers', 'ecommerce', 'street-food-vendors', 'hardware-shops'],
    relatedUseCases: ['low-fee-processing', 'instant-settlement', 'qr-code-payments', 'digital-invoicing'],
  };
