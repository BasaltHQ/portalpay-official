import { IndustryLandingData } from '../types';

export const publishingBookstores: IndustryLandingData = {
    slug: 'publishing-bookstores',
    name: 'Publishing & Bookstores',
    icon: '📖',
    
    title: 'Accept Crypto Payments for Publishing & Bookstores | 0.5-1% Fee | BasaltSurge',
    metaDescription: 'Bookstore & publishing crypto payment processing. Pay only 0.5-1% vs 35%+ legacy publishing cuts. Direct reader royalties, USBN identifiers, free inventory system.',
    keywords: [
      'bookstore crypto payments',
      'publishing crypto payments',
      'accept bitcoin bookstore',
      'direct royalties publishing',
      'crypto payments for authors',
      'low fee payment processor bookstore',
      'crypto payments for publishers',
    ],
    
    heroHeadline: 'Direct Royalties for Authors & Booksellers',
    heroSubheadline: 'Stop donating 35-65% of your royalties to legacy platforms. Publish onchain, replace expensive ISBNs with USBNs ($0.002), and sell directly to readers with zero chargebacks.',
    heroCTA: {
      primary: 'Start Publishing Free',
      primaryLink: '/admin',
      secondary: 'View Example Store',
      secondaryLink: '/terminal',
    },
    
    painPoints: [
      'Losing 35% to 65% of revenue to legacy publishing platforms like Amazon',
      'Paying $250+ for a single ISBN identifier',
      'Waiting 60-90 days for royalty payouts',
      'Losing control over customer relationships and reader data',
      'No secondary market royalties for used book sales',
    ],
    
    solutions: [
      'Keep 99-99.5% of your revenue - save tens of thousands annually',
      'Replace ISBNs with onchain USBNs costing just $0.002',
      'Instant settlement of royalties directly to your wallet',
      'Direct-to-reader ownership and community building',
      'Programmable royalties on secondary market resale',
    ],
    
    benefits: [
      {
        icon: '💰',
        title: 'Keep 99.5% of Revenue',
        description: 'Reduce processing fees to just 0.5-1%. Instead of giving up 35% of your ebook sales to Amazon, keep almost everything you earn.',
        stat: '99.5% Revenue Retention',
      },
      {
        icon: '⚡',
        title: 'Instant Royalties',
        description: 'Funds are available immediately in your crypto wallet. No more waiting 60 to 90 days for quarterly or monthly royalty checks.',
        stat: 'Same-Day Access',
      },
      {
        icon: '📖',
        title: 'Free Bookstore POS',
        description: 'Complete digital and physical bookstore management. Manage inventory, series order, DRM settings, and content disclosures completely free.',
        stat: '$0 Monthly Fees',
      },
      {
        icon: '🔖',
        title: 'USBN Identifiers',
        description: 'Bypass the expensive ISBN monopoly. Our native Osiris USBN system provides permanent, onchain identifiers for fractions of a penny.',
        stat: 'Save $250 per Book',
      },
      {
        icon: '🔄',
        title: 'Secondary Market Royalties',
        description: 'With digital assets onchain, you can programmatically capture a percentage of every used book resale forever.',
        stat: 'Perpetual Income',
      },
      {
        icon: '🔒',
        title: 'Zero Chargebacks',
        description: 'Crypto transactions are final. Protect yourself from fraudulent chargebacks and payment disputes on digital downloads.',
        stat: 'No Fraud Loss',
      },
    ],
    
    avgMonthlyVolume: 5000,
    competitorComparison: {
      toast: {
        processingFee: 0.35,
        flatFee: 0.0,
        monthlyFee: 0,
        annualSoftwareCost: 0,
      },
      square: {
        processingFee: 0.026,
        flatFee: 0.10,
        monthlyFee: 29,
        annualSoftwareCost: 348,
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
        title: 'Independent Author Sales',
        description: 'Sell digital PDFs or EPUBs directly to readers through a branded portal. Customer pays in crypto or card, downloads instantly, and you get paid instantly.',
        example: 'An indie author selling 500 copies at $10 each keeps $4,950 instead of $3,500 on Amazon.',
        savings: '$1,450/month',
      },
      {
        title: 'Physical Bookstore POS',
        description: 'Display QR codes at checkout for physical books. Syncs directly with your inventory and provides a fast, contactless checkout experience.',
        example: 'A local bookstore processing $20k/month saves $4,800/year on processing fees compared to traditional POS systems.',
        savings: '$4,800/year',
      },
      {
        title: 'Serialized Fiction Subscriptions',
        description: 'Publish chapter-by-chapter and allow readers to micropay or subscribe with stablecoins with zero minimum transaction penalties.',
        example: 'A serialized fiction site saves 30% per micro-transaction compared to Stripe\'s $0.30 flat fee.',
        savings: '30% per transaction',
      },
    ],
    
    industryFeatures: [
      'Digital Delivery & DRM Options',
      'Series & Volume Management',
      'Author Royalty Splits',
      'Content Disclosures (Adult/Violence)',
      'USBN Onchain Identifiers',
      'Physical Inventory Tracking',
      'Pre-order Campaigns',
      'Direct Reader Analytics',
      'Micropayments Support',
      'Multi-format Support (PDF, EPUB, Audio)',
    ],
    
    includedFeatures: [
      {
        name: 'Digital Bookstore Portal',
        description: 'Branded storefront for selling physical and digital books directly',
        usualCost: '$29/mo',
      },
      {
        name: 'Author Split Payments',
        description: 'Automatically route percentages of sales to co-authors or editors',
        usualCost: '3% fee',
      },
      {
        name: 'USBN Generation',
        description: 'Create unique, verifiable onchain identifiers for your publications',
        usualCost: '$250/book',
      },
      {
        name: 'Reader Analytics',
        description: 'Track genre popularity, series completion rates, and reader retention',
        usualCost: '$49/mo',
      },
      {
        name: 'Inventory Management',
        description: 'Track physical stock across multiple locations or pop-up events',
        usualCost: '$79/mo',
      },
      {
        name: 'Micropayment Support',
        description: 'Process payments as small as $0.10 without losing margins to flat fees',
        usualCost: 'Not Possible',
      },
    ],
    
    setupSteps: [
      'Connect your wallet to the Admin panel to receive royalties',
      'Configure your publishing brand, logo, and author profile',
      'Upload your catalog (covers, PDFs, metadata, pricing)',
      'Generate free USBNs for your books to replace expensive ISBNs',
      'Set up royalty splits if you collaborate with editors or co-authors',
      'Share your storefront link directly with readers on social media',
      'Start collecting 99.5% of your sales instantly',
    ],
    
    faqs: [
      {
        question: 'Do my readers need to use crypto?',
        answer: 'No. While crypto-savvy readers can pay instantly from their wallets, any reader can use a credit card, debit card, or Apple Pay through our onramp. They pay in fiat, and it\'s instantly converted to stablecoins (USDC) in your wallet. You get the benefits of crypto rails without causing friction for normal readers.',
        category: 'Payments',
      },
      {
        question: 'What is a USBN?',
        answer: 'The USBN (Universal Standard Book Number) is our onchain alternative to the legacy ISBN system. Instead of paying $250 for a traditional ISBN, you mint a USBN for fractions of a penny ($0.002). It provides a permanent, cryptographic record of your book\'s metadata and authorship on the blockchain.',
        category: 'Features',
      },
      {
        question: 'How do royalty splits work?',
        answer: 'If you cowrite a book, work with an editor, or have an illustrator, you can set up onchain splits. For example, 80% to you, 20% to the illustrator. Every time a book is sold, the smart contract automatically divides the payment and sends it to both wallets instantly. No manual accounting needed.',
        category: 'Features',
      },
      {
        question: 'Can I sell both physical and digital books?',
        answer: 'Yes! You can manage physical inventory (like a traditional bookstore) and offer secure digital downloads (PDF, EPUB, Audio) all from the same unified dashboard.',
        category: 'Features',
      },
      {
        question: 'Why is it better than Amazon KDP?',
        answer: 'Amazon KDP takes between 35% and 65% of your royalties, pays you 60 days late, and completely owns the relationship with your reader. BasaltSurge takes 0.5%, pays you instantly, and lets you own your reader community and data directly.',
        category: 'Pricing',
      },
      {
        question: 'How do micropayments work for serialized fiction?',
        answer: 'Traditional processors like Stripe charge a flat $0.30 fee per transaction, making it impossible to sell a $0.50 chapter. With BasaltSurge, you pay a flat percentage (0.5%), meaning you can profitably sell chapters or articles for cents.',
        category: 'Payments',
      },
    ],
    
    testimonials: [
      {
        quote: 'Moving my serialized fantasy series off Amazon was terrifying, but BasaltSurge made it seamless. I\'m making double the revenue from half the readers, and the instant payouts changed my life.',
        author: 'Sarah Jenkins',
        business: 'Indie Fantasy Author',
        savings: '$2,100/month',
      },
      {
        quote: 'As a small indie bookstore, credit card fees were eating our margins. We put a QR code at the register, and now 30% of our customers pay via Apple Pay through the portal. The savings cover our electricity bill.',
        author: 'Marcus Vance',
        business: 'The Painted Page Bookstore',
        savings: '$3,800/year',
      },
    ],
    
    relatedIndustries: ['retail', 'freelancers', 'ecommerce', 'art-galleries', 'print-shops'],
    relatedUseCases: ['digital-downloads', 'micropayments', 'direct-to-consumer', 'low-fee-processing'],
  };
