import { IndustryLandingData } from '../types';

/**
 * High-Risk industries bundle
 * Exports IndustryLandingData objects tailored for high-risk merchant categories
 * Included: cannabis-dispensaries, liquor-stores, vape-tobacco-shops, adult-entertainment,
 * casinos-gambling, firearms-gun-shops, cbd-hemp-products, kratom-sellers, supplements-nutraceuticals,
 * payday-loans, check-cashing-money-services, bail-bonds, debt-collection, credit-repair,
 * ticket-brokers, travel-agencies, fantasy-sports, timeshares, high-ticket-coaching, online-gaming
 */

export const cannabisDispensaries: IndustryLandingData = {
  slug: 'cannabis-dispensaries',
  name: 'Cannabis Dispensaries',
  icon: '🌿',
  title: 'Accept Crypto Payments for Cannabis Dispensaries | Low Fees | Instant Settlement',
  metaDescription:
    'Cannabis dispensary crypto payment processing with instant settlement, low fees, QR checkout, and onramp. Reduce cash handling risk and banking friction.',
  keywords: [
    'cannabis payments',
    'dispensary crypto',
    'marijuana payment processor',
    'weed store POS',
    'low fee cannabis payments',
  ],
  heroHeadline: 'Accept Crypto at Your Dispensary',
  heroSubheadline:
    'Reduce cash handling, cut fees by 50-70%, and settle instantly. QR checkout, onramp for cards/Apple Pay, and audit-friendly receipts tailored to cannabis.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: [
    'Cash-heavy operations create security and reconciliation issues',
    'Card processors decline cannabis transactions or impose high-risk pricing',
    'Banking relationships are fragile and subject to policy changes',
    'Compliance documentation and age verification increase friction',
    'High processing fees eat into margins on regulated products',
  ],
  solutions: [
    '0.5-1% per transaction with instant settlement',
    'QR-based checkout with onramp (cards/Apple Pay) converted to stablecoins',
    'Audit-friendly, exportable receipts tied to SKUs',
    'Optional prompts for age verification notice on receipts',
    '24/7 settlement independent of banking hours',
  ],
  benefits: [
    { icon: '💰', title: '50-70% Fee Savings', description: 'Slash payment costs compared to high-risk card processors.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Eliminate bank delays and cash reconciliation complexity.', stat: 'Seconds' },
    { icon: '🧾', title: 'Audit-Friendly Receipts', description: 'Export clean line-item data for compliance and accounting.', stat: 'CSV/JSON' },
  ],
  avgMonthlyVolume: 60000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'In-Store QR Checkout', description: 'Display a QR for customers to pay with crypto or via onramp.', example: 'Customer scans, pays USDC; instant settlement and receipt.' },
    { title: 'Delivery Orders', description: 'Payment links for scheduled deliveries without cash handling.', example: 'Reduce driver risk and reconcile deposits digitally.' },
    { title: 'Pre-Order Deposits', description: 'Collect deposits for limited drops or bundles.', example: 'Reserve inventory and reduce cancellations.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports', 'SKU-Level Receipts', 'Age-Verification Notice'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast, compliant checkout for in-store purchases', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Accept cards/Apple Pay converted to stablecoins', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Revenue, item mix, and time-of-day insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON exports for audit and accounting', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add business profile and logo', 'Configure item SKUs', 'Enable onramp if needed', 'Share QR codes/links and start accepting payments'],
  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. They can pay by card/Apple Pay via onramp and we convert to stablecoins. Crypto-native customers can pay directly.' },
    { question: 'Is this compliant?', answer: 'We provide clean receipts and exports. Compliance requirements vary by jurisdiction; consult local regulations.' },
    { question: 'Age verification?', answer: 'You handle ID checks operationally. We can optionally show an age verification notice in receipts.' },
  ],
  testimonials: [{ quote: 'QR checkout cut our cash handling and costs immediately.', author: 'Manager', business: 'GreenLeaf Dispensary', savings: '50-70% fee savings' }],
  relatedIndustries: ['cbd-hemp-products', 'vape-tobacco-shops', 'retail'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'pre-order-deposits'],
};

export const liquorStores: IndustryLandingData = {
  slug: 'liquor-stores',
  name: 'Liquor Stores',
  icon: '🍾',
  title: 'Accept Crypto Payments for Liquor Stores | QR Checkout | Instant Settlement',
  metaDescription:
    'Liquor store crypto payment processing with instant settlement, QR checkout, and low fees. Reduce chargebacks and cash handling risk.',
  keywords: ['liquor store crypto', 'alcohol payments', 'bottle shop POS', 'qr checkout liquor', 'low fee payments'],
  heroHeadline: 'Crypto Payments for Liquor Stores',
  heroSubheadline:
    'Offer modern checkout with QR payments and instant settlement. Reduce fees and cash handling risk while keeping operations simple.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High card fees and disputes', 'Cash handling risk and reconciliation', 'Hardware costs for legacy POS', 'Banking delays on weekends/holidays'],
  solutions: ['0.5-1% per transaction', 'Instant settlement via stablecoins', 'No special hardware—phones/tablets work', 'Receipts and exports for bookkeeping'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Cut payment fees by 50-70% vs legacy processors.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately—even on weekends.', stat: '24/7' },
    { icon: '📊', title: 'Analytics & Exports', description: 'Track item mix and export for accounting.', stat: 'CSV/JSON' },
  ],
  avgMonthlyVolume: 30000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'In-Store QR Checkout', description: 'Customers pay in seconds via QR.', example: 'Whiskey bottle + mixers paid instantly; digital receipt saved.' },
    { title: 'Curbside Pickup', description: 'Share payment links ahead of pickup.', example: 'Reduce time in-store and improve flow.' },
    { title: 'Bulk Orders', description: 'Collect deposits for event orders.', example: 'Reserve inventory and settle instantly.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports', 'Inventory Basics'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Simple QR flow for customers', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Top items and revenue insights', usualCost: '$40/mo' },
    { name: 'Onramp', description: 'Cards/Apple Pay support via onramp', usualCost: '$50/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add items/SKUs', 'Enable onramp optionally', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. Onramp supports card/Apple Pay. Crypto-native customers can pay directly.' },
    { question: 'Age restrictions?', answer: 'Operational ID checks remain with the store. Receipts can note age-verification performed.' },
    { question: 'Hardware?', answer: 'Any smartphone/tablet is sufficient. No proprietary terminals required.' },
  ],
  testimonials: [{ quote: 'We cut payment costs and sped up checkout with QR.', author: 'Owner', business: 'Bottle Barn', savings: '50-70% fees saved' }],
  relatedIndustries: ['bars', 'retail', 'cbd-hemp-products'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'curbside-pickup'],
};

export const vapeTobaccoShops: IndustryLandingData = {
  slug: 'vape-tobacco-shops',
  name: 'Vape & Tobacco Shops',
  icon: '🚬',
  title: 'Accept Crypto Payments for Vape & Tobacco | Low Fees | Instant Settlement',
  metaDescription:
    'Vape and tobacco shop crypto payment processing with QR checkout, onramp, low fees, and instant settlement. Reduce declines and disputes.',
  keywords: ['vape shop crypto', 'tobacco payments', 'e-liquid POS', 'qr checkout vape', 'low fee payments'],
  heroHeadline: 'Crypto Payments for Vape/Tobacco',
  heroSubheadline:
    'Reduce declines and disputes with instant settlement and QR checkout. Onramp enables card/Apple Pay for customers without crypto.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High decline rates with card processors', 'Chargebacks on consumables', 'Hardware cost for terminals', 'Cash management overhead'],
  solutions: ['0.5-1% per transaction', 'On-chain finality reduces chargebacks', 'QR/pay-links via phone or tablet', 'Exportable receipts and item tracking'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save 50-70% vs card processors.', stat: '0.5-1% Fees' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce chargebacks and disputes with on-chain finality.', stat: 'Irrevocable' },
    { icon: '⚡', title: 'Fast Checkout', description: 'QR flows customers understand.', stat: '10s' },
  ],
  avgMonthlyVolume: 25000,
  competitorComparison: {
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'In-Store QR', description: 'Fast payment at the counter.', example: 'Customer pays for e-liquid and coils via QR.' },
    { title: 'Pickup Links', description: 'Prepay via link before pickup.', example: 'Reduce queue times and cash handling.' },
    { title: 'Bundle Deposits', description: 'Collect deposits for limited drops.', example: 'Allocate inventory fairly with instant settlement.' },
  ],
  industryFeatures: ['QR Code Payments', 'Onramp Support', 'Instant Settlement', 'Inventory Basics', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'One-tap QR payment flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Item and revenue insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV receipts and line items', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add SKUs', 'Enable onramp optionally', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Declines and risk?', answer: 'We reduce declines by supporting onramp and crypto. Settlement is instant and final on-chain.' },
    { question: 'Hardware?', answer: 'Use any smartphone or tablet—no special terminals required.' },
    { question: 'Refunds?', answer: 'Manage refunds in the dashboard, both onramp and crypto payments.' },
  ],
  testimonials: [{ quote: 'Lower fees and faster checkout helped margins.', author: 'Owner', business: 'Cloud Nine Vape', savings: '50-70% fees saved' }],
  relatedIndustries: ['liquor-stores', 'retail', 'cbd-hemp-products'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'curbside-pickup'],
};

export const adultEntertainment: IndustryLandingData = {
  slug: 'adult-entertainment',
  name: 'Adult Entertainment',
  icon: '🎭',
  title: 'Crypto Payments for Adult Entertainment | Reduce Chargebacks | Instant Settlement',
  metaDescription:
    'Adult entertainment payment processing via crypto and onramp. Lower fees, reduced chargebacks, instant settlement, and privacy-conscious receipts.',
  keywords: ['adult payments', 'high-risk processor', 'crypto adult entertainment', 'privacy receipts', 'low fee'],
  heroHeadline: 'Lower Fees & Fewer Chargebacks',
  heroSubheadline:
    'Accept crypto and onramp payments with instant settlement and privacy-conscious receipts. Reduce declines and disputes with on-chain finality.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High-risk pricing and frequent declines', 'Chargebacks on digital content/access', 'Banking friction and delays', 'Customer privacy concerns'],
  solutions: [
    '0.5-1% per transaction with instant settlement',
    'On-chain finality reduces chargebacks and fraud',
    'Privacy-conscious receipts (brand-only line items)',
    'Onramp for customers without crypto',
  ],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save 50-70% vs high-risk processors.', stat: '0.5-1% Fees' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes and chargebacks with on-chain finality.', stat: 'Irrevocable' },
    { icon: '🕒', title: 'Instant Settlement', description: 'Funds available immediately—even weekends.', stat: '24/7' },
  ],
  avgMonthlyVolume: 40000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Membership Access', description: 'Recurring stablecoin billing via onramp or crypto.', example: 'Lower fees on subscriptions.' },
    { title: 'Tip Jar / Live Events', description: 'QR tip links with instant settlement.', example: 'No chargeback exposure.' },
    { title: 'Digital Content', description: 'Payment links for PPV content.', example: 'Privacy-conscious receipts.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Privacy Receipts', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR payments', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Revenue and cohort insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV receipts and line items', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Brand your portal', 'Configure items/memberships', 'Enable onramp', 'Share QR/links'],
  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Privacy?', answer: 'We can use brand-only line items to minimize sensitive descriptors.' },
    { question: 'Chargebacks?', answer: 'On-chain finality reduces traditional chargeback exposure substantially.' },
  ],
  testimonials: [{ quote: 'Fees dropped and disputes fell off a cliff.', author: 'Director', business: 'StudioNova', savings: '50-70% fees saved' }],
  relatedIndustries: ['online-gaming', 'fantasy-sports', 'ticket-brokers'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'subscriptions'],
};

export const casinosGambling: IndustryLandingData = {
  slug: 'casinos-gambling',
  name: 'Casinos & Gambling',
  icon: '🎰',
  title: 'Crypto Payments for Casinos & Gambling | Instant Settlement | Lower Fees',
  metaDescription:
    'Casinos and gambling operators accept crypto and onramp payments with instant settlement and lower fees. Improve VIP deposits and payouts.',
  keywords: ['casino payments', 'crypto gambling', 'vip deposits', 'instant payout', 'high-risk processing'],
  heroHeadline: 'VIP Deposits & Instant Payouts',
  heroSubheadline:
    'Accept deposits and process payouts in minutes, not days. Lower fees vs wires and card rails and reduce operational friction.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['Wire delays for high-roller deposits', 'Card declines and high fees', 'International players and currency conversion', 'Banking hours restrict operations'],
  solutions: [
    'Stablecoin deposits settle instantly',
    '0.5-1% fees vs wire/card costs',
    'Cross-border friendly without FX loss',
    '24/7 processing including weekends',
  ],
  benefits: [
    { icon: '⚡', title: 'Instant Settlement', description: 'Deposits and payouts settle in minutes.', stat: 'Same-Day' },
    { icon: '💰', title: 'Lower Fees', description: 'Save vs wire and card processing.', stat: '0.5-1% Fees' },
    { icon: '🌍', title: 'Global Access', description: 'Accept international players with ease.', stat: 'No Borders' },
  ],
  avgMonthlyVolume: 120000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'VIP Deposit Links', description: 'Send deposit links for high rollers.', example: 'Funds settle instantly with on-chain proof.' },
    { title: 'Tournament Payouts', description: 'Process payouts in stablecoins.', example: 'No wire delays or bank holds.' },
    { title: 'International Players', description: 'Onramp supports cards and Apple Pay.', example: 'No FX conversion losses.' },
  ],
  industryFeatures: ['Instant Settlement', 'Onramp Support', 'Exportable Reports', '24/7 Processing'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast deposit via QR', usualCost: '$20/mo' },
    { name: 'Analytics', description: 'Deposit and payout insights', usualCost: '$40/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Brand portal', 'Configure deposit/payout flows', 'Enable onramp', 'Share QR/links'],
  faqs: [
    { question: 'Is crypto required?', answer: 'No. Onramp supports card and Apple Pay.' },
    { question: 'Compliance?', answer: 'Consult local regulations on gaming payments and reporting.' },
    { question: 'Settlement speed?', answer: 'Seconds to minutes depending on network conditions.' },
  ],
  testimonials: [{ quote: 'VIP deposits cleared in minutes vs days.', author: 'Manager', business: 'Royal Ace Casino', savings: 'Wire fees avoided' }],
  relatedIndustries: ['online-gaming', 'fantasy-sports', 'ticket-brokers'],
  relatedUseCases: ['instant-settlement', 'payouts', 'qr-code-payments'],
};

export const firearmsGunShops: IndustryLandingData = {
  slug: 'firearms-gun-shops',
  name: 'Firearms & Gun Shops',
  icon: '🎯',
  title: 'Crypto Payments for Firearms & Gun Shops | Lower Fees | Instant Settlement',
  metaDescription:
    'Firearms and gun shops accept crypto and onramp payments with instant settlement. Lower fees, audit-friendly receipts, and reduced declines.',
  keywords: ['firearms payments', 'gun shop crypto', 'high-risk processor', 'audit receipts', 'instant settlement'],
  heroHeadline: 'Accept Crypto with Audit-Friendly Receipts',
  heroSubheadline:
    'Lower fees and reduced declines on regulated items. Exportable receipts help with record-keeping; instant settlement improves cash flow.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High-risk pricing and declines', 'Bank friction and delays', 'Paper-heavy bookkeeping', 'Weekend settlement lag'],
  solutions: [
    '0.5-1% per transaction',
    'Onramp for card/Apple Pay',
    'Exportable line-item receipts for audits',
    '24/7 settlement including weekends',
  ],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save 50-70% vs legacy processing.', stat: '0.5-1% Fees' },
    { icon: '🧾', title: 'Audit Receipts', description: 'Export line items for compliance and records.', stat: 'CSV/JSON' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
  ],
  avgMonthlyVolume: 35000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'In-Store QR Checkout', description: 'Quick payment for accessories and parts.', example: 'Customer pays via QR and receives digital receipt.' },
    { title: 'Order Deposits', description: 'Collect deposits for special orders.', example: 'Reduce cancellations and improve planning.' },
    { title: 'Range Fees', description: 'QR pay at counter.', example: 'Instant settlement and simple reconciliation.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast QR flow customers understand', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Revenue and item insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV receipts and line items', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add SKUs', 'Enable onramp', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Compliance?', answer: 'Consult local/state/federal regulations. We provide clean receipts and exports.' },
    { question: 'Do customers need crypto?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Chargebacks?', answer: 'On-chain finality reduces chargeback exposure.' },
  ],
  testimonials: [{ quote: 'Instant settlement and cleaner records helped operations.', author: 'Owner', business: 'Precision Arms', savings: '50-70% fees saved' }],
  relatedIndustries: ['retail', 'cbd-hemp-products', 'liquor-stores'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'order-deposits'],
};

export const cbdHempProducts: IndustryLandingData = {
  slug: 'cbd-hemp-products',
  name: 'CBD & Hemp Products',
  icon: '🧴',
  title: 'Crypto Payments for CBD & Hemp | Reduce Declines | Instant Settlement',
  metaDescription:
    'CBD and hemp merchants accept crypto and onramp payments with instant settlement and lower fees. Reduce declines and export clean receipts.',
  keywords: ['cbd payments', 'hemp shop crypto', 'onramp cbd', 'low fee processor', 'instant settlement'],
  heroHeadline: 'Reduce Declines & Save on Fees',
  heroSubheadline:
    'Offer QR checkout and onramp to lower declines. Instant settlement improves cash flow; export receipts simplify bookkeeping.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High decline rates and risk pricing', 'Bank friction and delays', 'Manual record-keeping overhead'],
  solutions: ['0.5-1% per transaction', 'Onramp supports card/Apple Pay', 'Exportable receipts and line items', '24/7 settlement'],
  benefits: [
    { icon: '💳', title: 'Fewer Declines', description: 'Onramp and crypto reduce declines.', stat: 'Higher Approval' },
    { icon: '💰', title: 'Lower Fees', description: 'Save vs legacy processing.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
  ],
  avgMonthlyVolume: 25000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'In-Store QR', description: 'Fast checkout at the counter.', example: 'Customer pays for tinctures and lotions via QR.' },
    { title: 'Pickup Links', description: 'Prepay before pickup.', example: 'Reduce queue times and cash handling.' },
    { title: 'Subscriptions', description: 'Recurring stablecoin billing for refills.', example: 'Lower fees vs cards.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'One-tap QR payments', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Item and revenue insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add SKUs', 'Enable onramp', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Compliance?', answer: 'Local regulations vary. We provide clean receipts and exports.' },
    { question: 'Crypto required?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Fewer declines and lower fees improved margins.', author: 'Owner', business: 'PureLeaf CBD', savings: '50-70% fees saved' }],
  relatedIndustries: ['vape-tobacco-shops', 'liquor-stores', 'retail'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'subscriptions'],
};

export const kratomSellers: IndustryLandingData = {
  slug: 'kratom-sellers',
  name: 'Kratom Sellers',
  icon: '🍃',
  title: 'Crypto Payments for Kratom Sellers | Lower Fees | Exportable Receipts',
  metaDescription:
    'Kratom merchants accept crypto and onramp with instant settlement and lower fees. Export receipts for compliance and accounting.',
  keywords: ['kratom payments', 'high-risk processor', 'crypto kratom', 'export receipts', 'instant settlement'],
  heroHeadline: 'Accept Crypto & Reduce Costs',
  heroSubheadline:
    'Offer QR checkout and onramp. Lower fees vs legacy processors, export line-item receipts, and settle instantly.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['Risk pricing and frequent declines', 'Manual record-keeping', 'Bank delays and weekend settlement lag'],
  solutions: ['0.5-1% per transaction', 'Onramp supports cards', 'Exportable receipts and line items', '24/7 instant settlement'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save 50-70% on processing.', stat: '0.5-1% Fees' },
    { icon: '🧾', title: 'Exportable Receipts', description: 'Clean data for compliance/accounting.', stat: 'CSV/JSON' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
  ],
  avgMonthlyVolume: 18000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'In-Store QR', description: 'Counter checkout via QR.', example: 'Customer pays for powder and capsules instantly.' },
    { title: 'Pickup Links', description: 'Pay before pickup.', example: 'Improve flow and reduce cash handling.' },
    { title: 'Subscriptions', description: 'Recurring refills via stablecoins.', example: 'Lower fees vs cards.' },
  ],
  industryFeatures: ['QR Code Payments', 'Onramp Support', 'Instant Settlement', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast QR flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Item and revenue insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add SKUs', 'Enable onramp', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Compliance?', answer: 'Regulations vary by region. We provide clean receipts and exports.' },
    { question: 'Crypto required?', answer: 'No. Customers can pay via onramp.' },
    { question: 'Refunds?', answer: 'Process refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Lower fees and instant settlement helped cash flow.', author: 'Owner', business: 'KraLeaf Co.', savings: '50-70% fees saved' }],
  relatedIndustries: ['cbd-hemp-products', 'vape-tobacco-shops', 'retail'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'subscriptions'],
};

export const supplementsNutraceuticals: IndustryLandingData = {
  slug: 'supplements-nutraceuticals',
  name: 'Supplements & Nutraceuticals',
  icon: '💊',
  title: 'Crypto Payments for Supplements | Lower Fees | Fewer Chargebacks',
  metaDescription:
    'Supplements and nutraceuticals merchants accept crypto and onramp with instant settlement and lower fees. Reduce disputes on consumables.',
  keywords: ['supplement payments', 'nutraceuticals crypto', 'low fee processor', 'onramp'],
  heroHeadline: 'Lower Fees & Fewer Disputes',
  heroSubheadline:
    'Offer QR checkout and onramp for customers without crypto. Instant settlement and on-chain finality reduce disputes on consumables.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High fees and chargebacks on consumables', 'Banking delays and friction', 'Manual record keeping'],
  solutions: ['0.5-1% per transaction', 'On-chain finality reduces disputes', 'Exportable receipts for accounting', 'Onramp for cards'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save vs legacy processors.', stat: '0.5-1% Fees' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce chargebacks on consumables.', stat: 'Irrevocable' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
  ],
  avgMonthlyVolume: 28000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'In-Store QR', description: 'Scan and pay in seconds.', example: 'Customer pays for protein and vitamins via QR.' },
    { title: 'Pickup Links', description: 'Prepay for curbside pickup.', example: 'Speed up fulfillment.' },
    { title: 'Subscriptions', description: 'Recurring refills via stablecoins.', example: 'Lower fees than cards.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Item and revenue insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add SKUs', 'Enable onramp', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
    { question: 'Chargebacks?', answer: 'On-chain finality helps reduce disputes significantly.' },
  ],
  testimonials: [{ quote: 'Fewer disputes and lower fees helped margins.', author: 'Owner', business: 'PrimeSupp Co.', savings: '50-70% fees saved' }],
  relatedIndustries: ['retail', 'cbd-hemp-products', 'vape-tobacco-shops'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'subscriptions'],
};

export const paydayLoans: IndustryLandingData = {
  slug: 'payday-loans',
  name: 'Payday Loans',
  icon: '🏦',
  title: 'Crypto Payments for Payday Loans | Instant Settlement | Lower Fees',
  metaDescription:
    'Payday lenders accept crypto and onramp payments with instant settlement and lower fees. Improve disbursement and repayment flows.',
  keywords: ['payday lender payments', 'crypto loans', 'instant settlement', 'onramp'],
  heroHeadline: 'Instant Disbursement & Repayment',
  heroSubheadline:
    'Accept repayment via QR/onramp with instant settlement. Lower fees vs card rails; export receipts for compliance.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High fees on repayments', 'Settlement delays on weekends', 'Manual reconciliation overhead', 'Banking friction'],
  solutions: ['0.5-1% per transaction', '24/7 instant settlement', 'Exportable receipts and reports', 'Onramp for cards/Apple Pay'],
  benefits: [
    { icon: '⚡', title: 'Instant Settlement', description: 'Repayments settle in minutes.', stat: '24/7' },
    { icon: '💰', title: 'Lower Fees', description: 'Save materially vs cards.', stat: '0.5-1% Fees' },
    { icon: '📊', title: 'Clean Records', description: 'Export receipts for compliance.', stat: 'CSV/JSON' },
  ],
  avgMonthlyVolume: 90000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Repayment Links', description: 'Send repayment links via SMS/email.', example: 'Customers pay via onramp or crypto.' },
    { title: 'Branch QR', description: 'In-branch QR scanning for repayments.', example: 'Reduce wait times and reconcile digitally.' },
    { title: 'Disbursement Fees', description: 'Collect small fees instantly.', example: 'Simplify fee tracking.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast repayment via QR', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Repayment insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Brand portal', 'Configure repayment SKUs', 'Enable onramp', 'Share QR/links'],
  faqs: [
    { question: 'Compliance?', answer: 'Consult local regulations on lending and payment flows. We provide clean receipts and exports.' },
    { question: 'Do customers need crypto?', answer: 'No. Onramp supports card and Apple Pay.' },
    { question: 'Settlement speed?', answer: 'Seconds to minutes depending on network conditions.' },
  ],
  testimonials: [{ quote: 'Weekend settlement solved cash flow issues.', author: 'Director', business: 'QuickPay Loans', savings: 'Lower fees + faster settlement' }],
  relatedIndustries: ['check-cashing-money-services', 'bail-bonds', 'debt-collection'],
  relatedUseCases: ['instant-settlement', 'qr-code-payments', 'repayment-links'],
};

export const checkCashingMoneyServices: IndustryLandingData = {
  slug: 'check-cashing-money-services',
  name: 'Check Cashing & Money Services',
  icon: '💵',
  title: 'Crypto Payments for Check Cashing | Lower Fees | Instant Settlement',
  metaDescription:
    'Check cashing and money service businesses accept crypto/onramp payments with instant settlement and lower fees. Export receipts for compliance.',
  keywords: ['msb payments', 'check cashing crypto', 'instant settlement', 'low fee'],
  heroHeadline: 'Lower Fees & Faster Settlement',
  heroSubheadline:
    'Accept service fees via QR and onramp. Export receipts for compliance; instant settlement improves operations.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High fees on service charges', 'Settlement delays on weekends/holidays', 'Manual record-keeping for compliance'],
  solutions: ['0.5-1% per transaction', '24/7 settlement including weekends', 'Exportable receipts and reports', 'Onramp for cards/Apple Pay'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save vs card rails on service fees.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
    { icon: '🧾', title: 'Exportable Receipts', description: 'Clean records for compliance.', stat: 'CSV/JSON' },
  ],
  avgMonthlyVolume: 50000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Service Fee QR', description: 'Collect fees via QR on-site.', example: 'Faster checkout and settlement.' },
    { title: 'Bill Payments', description: 'Customers pay service fees online.', example: 'Onramp supports card/Apple Pay.' },
    { title: 'Payout Fees', description: 'Collect small fees instantly.', example: 'Simplify fee tracking and reconciliation.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Fee and revenue insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add fee SKUs', 'Enable onramp', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Compliance?', answer: 'Consult MSB regulations in your jurisdiction. We provide clean receipts and exports.' },
    { question: 'Crypto required?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Lower fees and instant settlement improved throughput.', author: 'Owner', business: 'FastCash MSB', savings: '50-70% fees saved' }],
  relatedIndustries: ['payday-loans', 'bail-bonds', 'debt-collection'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'service-fees'],
};

export const bailBonds: IndustryLandingData = {
  slug: 'bail-bonds',
  name: 'Bail Bonds',
  icon: '🪙',
  title: 'Crypto Payments for Bail Bonds | Instant Settlement | Lower Fees',
  metaDescription:
    'Bail bond agents accept crypto and onramp payments for premiums and collateral with instant settlement and lower fees. Export receipts for records.',
  keywords: ['bail bonds payments', 'crypto bail', 'instant settlement', 'low fee'],
  heroHeadline: 'Collect Premiums & Collateral Instantly',
  heroSubheadline:
    'Lower fees vs card rails and avoid wire delays. Instant settlement and clean receipts simplify operations.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High fees on urgent payments', 'Weekend/holiday banking delays', 'Manual record-keeping and reconciliation'],
  solutions: ['0.5-1% per transaction', '24/7 instant settlement', 'Exportable receipts and reports', 'Onramp for cards'],
  benefits: [
    { icon: '⚡', title: 'Instant Settlement', description: 'Premiums and collateral settle in minutes.', stat: '24/7' },
    { icon: '💰', title: 'Lower Fees', description: 'Save vs cards and wires.', stat: '0.5-1% Fees' },
    { icon: '🧾', title: 'Exportable Receipts', description: 'Clean records for case management.', stat: 'CSV/JSON' },
  ],
  avgMonthlyVolume: 65000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Premium Payments', description: 'QR/onramp payments at office.', example: 'Faster processing and reconciliation.' },
    { title: 'Collateral Deposits', description: 'Deposit links via SMS/email.', example: 'Instant settlement removes wire delays.' },
    { title: 'Remote Payments', description: 'Pay from phone anywhere.', example: 'Reduce in-person wait times.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'One-tap QR payment flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Case and payment insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add premium/collateral SKUs', 'Enable onramp', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Compliance?', answer: 'Consult local regulations for bail payments and record-keeping.' },
    { question: 'Crypto required?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Settlement speed?', answer: 'Seconds to minutes depending on network conditions.' },
  ],
  testimonials: [{ quote: 'Instant settlement made urgent cases smoother.', author: 'Agent', business: 'Freedom Bail', savings: 'Lower fees + faster cash flow' }],
  relatedIndustries: ['payday-loans', 'check-cashing-money-services', 'debt-collection'],
  relatedUseCases: ['instant-settlement', 'qr-code-payments', 'deposit-links'],
};

export const debtCollection: IndustryLandingData = {
  slug: 'debt-collection',
  name: 'Debt Collection',
  icon: '📩',
  title: 'Crypto Payments for Debt Collection | Lower Fees | Instant Settlement',
  metaDescription:
    'Collections agencies accept crypto and onramp payments with instant settlement and lower fees. Export receipts for audit and reporting.',
  keywords: ['collections payments', 'crypto collections', 'instant settlement', 'low fee'],
  heroHeadline: 'Lower Fees & Faster Settlement',
  heroSubheadline:
    'Accept payments via QR and onramp with instant settlement. Export receipts for audit and reporting.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High fees on small payments', 'Bank delays on weekends', 'Reconciliation overhead'],
  solutions: ['0.5-1% per transaction', '24/7 settlement', 'Exportable receipts', 'Onramp for cards'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save vs card rails on small payments.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
    { icon: '🧾', title: 'Clean Records', description: 'Export receipts for audit.', stat: 'CSV/JSON' },
  ],
  avgMonthlyVolume: 40000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'QR Payments', description: 'Pay at office or via link.', example: 'Instant settlement reduces lag.' },
    { title: 'Payment Plans', description: 'Recurring stablecoin billing.', example: 'Lower fees vs cards.' },
    { title: 'Remote Payments', description: 'Customers pay from phone anywhere.', example: 'Reduce call center load.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Payment insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add payment SKUs', 'Enable onramp', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Reporting?', answer: 'Export receipts to CSV/JSON for audit.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Lower fees on small payments improved recovery.', author: 'Director', business: 'Atlas Collections', savings: '50-70% fees saved' }],
  relatedIndustries: ['credit-repair', 'payday-loans', 'check-cashing-money-services'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'payment-plans'],
};

export const creditRepair: IndustryLandingData = {
  slug: 'credit-repair',
  name: 'Credit Repair',
  icon: '🧠',
  title: 'Crypto Payments for Credit Repair | Lower Fees | Instant Settlement',
  metaDescription:
    'Credit repair firms accept crypto and onramp payments with instant settlement and lower fees. Reduce disputes and export receipts.',
  keywords: ['credit repair payments', 'crypto credit repair', 'instant settlement', 'low fee'],
  heroHeadline: 'Lower Fees on Subscriptions & Plans',
  heroSubheadline:
    'Offer onramp and crypto for memberships. Instant settlement and clean receipts reduce disputes.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High fees on subscription plans', 'Chargebacks on services', 'Bank delays and friction'],
  solutions: ['0.5-1% per transaction', 'On-chain finality reduces disputes', 'Exportable receipts', 'Onramp for cards'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save vs legacy rails.', stat: '0.5-1% Fees' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes on services.', stat: 'Irrevocable' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
  ],
  avgMonthlyVolume: 22000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Membership Plans', description: 'Recurring stablecoin via onramp/crypto.', example: 'Lower fees on subscriptions.' },
    { title: 'Consultations', description: 'QR payments at office.', example: 'Instant settlement and receipts.' },
    { title: 'Digital Services', description: 'Pay links for reports and reviews.', example: 'Exportable receipts for records.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Subscription insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Configure memberships/services', 'Enable onramp', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Chargebacks?', answer: 'On-chain finality reduces chargeback exposure.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Subscriptions with lower fees improved margins.', author: 'Owner', business: 'ClearPath Credit', savings: '50-70% fees saved' }],
  relatedIndustries: ['debt-collection', 'payday-loans', 'check-cashing-money-services'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'subscriptions'],
};

export const ticketBrokers: IndustryLandingData = {
  slug: 'ticket-brokers',
  name: 'Ticket Brokers',
  icon: '🎟️',
  title: 'Crypto Payments for Ticket Brokers | Lower Fees | Instant Settlement',
  metaDescription:
    'Ticket brokers accept crypto and onramp payments with instant settlement and lower fees. Reduce disputes and speed up transfers.',
  keywords: ['ticket broker payments', 'crypto tickets', 'instant settlement', 'low fee'],
  heroHeadline: 'Faster Transfers & Lower Fees',
  heroSubheadline:
    'Accept payments via QR and onramp with instant settlement. Reduce disputes and export receipts.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High fees and disputes on digital goods', 'Bank delays on weekends', 'Manual reconciliation overhead'],
  solutions: ['0.5-1% per transaction', 'On-chain finality reduces disputes', 'Exportable receipts', 'Onramp for cards'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save vs legacy processors.', stat: '0.5-1% Fees' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce chargebacks on digital goods.', stat: 'Irrevocable' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
  ],
  avgMonthlyVolume: 30000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Digital Transfers', description: 'Pay links for ticket transfers.', example: 'Instant settlement reduces lag.' },
    { title: 'Bulk Orders', description: 'Collect deposits via QR.', example: 'Plan inventory and reduce risk.' },
    { title: 'Marketplace Fees', description: 'Collect fees instantly.', example: 'Export receipts for accounting.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast QR flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Order and fee insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Add SKUs', 'Enable onramp', 'Share QR/links', 'Accept payments'],
  faqs: [
    { question: 'Do customers need crypto?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Disputes?', answer: 'On-chain finality reduces chargebacks on digital goods.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Faster transfers and lower fees improved our flow.', author: 'Owner', business: 'PrimeTickets', savings: '50-70% fees saved' }],
  relatedIndustries: ['travel-agencies', 'fantasy-sports', 'online-gaming'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'deposits'],
};

export const travelAgencies: IndustryLandingData = {
  slug: 'travel-agencies',
  name: 'Travel Agencies',
  icon: '✈️',
  title: 'Crypto Payments for Travel Agencies | Cross-Border | Instant Settlement',
  metaDescription:
    'Travel agencies accept crypto and onramp payments with instant settlement. Perfect for cross-border bookings and deposits.',
  keywords: ['travel payments', 'crypto travel', 'cross-border booking', 'instant settlement'],
  heroHeadline: 'Cross-Border Bookings Without Friction',
  heroSubheadline:
    'Lower fees, instant settlement, and no FX loss. Accept deposits and balances via QR and onramp.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['FX conversion loss on international bookings', 'Wire/card delays and fees', 'Weekend settlement lag'],
  solutions: ['Stablecoins settle instantly', '0.5-1% fees vs wire/card', 'No FX loss with stablecoins', '24/7 processing'],
  benefits: [
    { icon: '🌍', title: 'Global Access', description: 'Accept payments from anywhere.', stat: 'No Borders' },
    { icon: '💰', title: 'Lower Fees', description: 'Save on deposits and balances.', stat: '0.5-1% Fees' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
  ],
  avgMonthlyVolume: 45000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Deposits', description: 'Collect booking deposits instantly.', example: 'No wire delay or FX loss.' },
    { title: 'Balance Payments', description: 'Pay final balances via link.', example: 'Instant settlement and receipts.' },
    { title: 'Group Tours', description: 'Collect per-person fees via QR.', example: 'Export receipts for accounting.' },
  ],
  industryFeatures: ['Instant Settlement', 'Onramp Support', 'Exportable Reports', '24/7 Processing'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast deposit via QR', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Booking and revenue insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Brand portal', 'Configure deposit/balance SKUs', 'Enable onramp', 'Share QR/links'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports card and Apple Pay.' },
    { question: 'Settlement speed?', answer: 'Seconds to minutes depending on network conditions.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'International deposits cleared instantly.', author: 'Agent', business: 'Skyline Travel', savings: 'FX loss avoided' }],
  relatedIndustries: ['ticket-brokers', 'fantasy-sports', 'online-gaming'],
  relatedUseCases: ['instant-settlement', 'deposits', 'balance-payments'],
};

export const fantasySports: IndustryLandingData = {
  slug: 'fantasy-sports',
  name: 'Fantasy Sports',
  icon: '🏈',
  title: 'Crypto Payments for Fantasy Sports | Entry Fees | Instant Payouts',
  metaDescription:
    'Fantasy sports platforms accept crypto and onramp payments for entry fees and payouts with instant settlement and lower fees.',
  keywords: ['fantasy sports payments', 'crypto entry fees', 'instant payouts', 'low fee'],
  heroHeadline: 'Instant Entry & Payouts',
  heroSubheadline:
    'Accept entry fees via QR/onramp and payout winners instantly via stablecoins. Lower fees vs card/wire.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['Card declines on entry fees', 'Wire delays on payouts', 'FX loss for international players'],
  solutions: ['Stablecoins settle instantly', 'Onramp supports card/Apple Pay', '0.5-1% fees and no FX loss'],
  benefits: [
    { icon: '⚡', title: 'Instant Settlement', description: 'Fees and payouts settle in minutes.', stat: '24/7' },
    { icon: '💰', title: 'Lower Fees', description: 'Save vs wires/cards.', stat: '0.5-1% Fees' },
    { icon: '🌍', title: 'Global Access', description: 'International players without friction.', stat: 'No Borders' },
  ],
  avgMonthlyVolume: 38000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Entry Fees', description: 'QR or link payments.', example: 'Instant settlement and receipt.' },
    { title: 'Payouts', description: 'Stablecoin payouts without wire delays.', example: 'Winners receive funds in minutes.' },
    { title: 'Subscriptions', description: 'Premium content memberships.', example: 'Lower fees vs cards.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast QR flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Entry and payout insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Configure fees/payout flows', 'Enable onramp', 'Share QR/links'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports card and Apple Pay.' },
    { question: 'Settlement speed?', answer: 'Seconds to minutes depending on network.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Instant payouts improved user satisfaction.', author: 'PM', business: 'ProDrafts', savings: 'Wires avoided + lower fees' }],
  relatedIndustries: ['online-gaming', 'ticket-brokers', 'casinos-gambling'],
  relatedUseCases: ['instant-settlement', 'payouts', 'subscriptions'],
};

export const timeshares: IndustryLandingData = {
  slug: 'timeshares',
  name: 'Timeshares',
  icon: '🏖️',
  title: 'Crypto Payments for Timeshares | Deposits | Cross-Border',
  metaDescription:
    'Timeshare operators accept crypto and onramp payments for deposits and dues with instant settlement and lower fees. Cross-border friendly.',
  keywords: ['timeshare payments', 'crypto deposits', 'instant settlement', 'cross-border'],
  heroHeadline: 'Instant Deposits & Cross-Border Payments',
  heroSubheadline:
    'Lower fees vs wires/cards. Instant settlement helps move deals faster; export receipts simplify accounting.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['Wire delays and FX loss', 'High card fees', 'Weekend settlement lag'],
  solutions: ['Stablecoins settle instantly', '0.5-1% fees', 'No FX loss on stablecoins', '24/7 processing'],
  benefits: [
    { icon: '⚡', title: 'Instant Settlement', description: 'Deposits and dues settle in minutes.', stat: '24/7' },
    { icon: '💰', title: 'Lower Fees', description: 'Save vs wire/card fees.', stat: '0.5-1% Fees' },
    { icon: '🌍', title: 'Global Access', description: 'International buyers without friction.', stat: 'No Borders' },
  ],
  avgMonthlyVolume: 55000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Deposits', description: 'Collect deposits instantly via link.', example: 'Move deals faster without wire delay.' },
    { title: 'Annual Dues', description: 'Recurring stablecoin billing.', example: 'Lower fees vs cards.' },
    { title: 'Upgrades', description: 'QR payments for upgrades.', example: 'Export receipts for records.' },
  ],
  industryFeatures: ['Instant Settlement', 'Onramp Support', 'Exportable Reports', '24/7 Processing'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast deposit via QR', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Booking and dues insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Configure deposit/dues SKUs', 'Enable onramp', 'Share QR/links'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports card and Apple Pay.' },
    { question: 'Settlement speed?', answer: 'Seconds to minutes depending on network.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Instant deposits sped up sales cycles.', author: 'Manager', business: 'Sunset Resorts', savings: 'Lower fees + faster closing' }],
  relatedIndustries: ['travel-agencies', 'ticket-brokers', 'real-estate'],
  relatedUseCases: ['instant-settlement', 'deposits', 'subscriptions'],
};

export const highTicketCoaching: IndustryLandingData = {
  slug: 'high-ticket-coaching',
  name: 'High-Ticket Coaching',
  icon: '🎓',
  title: 'Crypto Payments for High-Ticket Coaching | Lower Fees | Fewer Chargebacks',
  metaDescription:
    'Coaches and consultants accept crypto and onramp payments for high-ticket programs with instant settlement and lower fees. Reduce disputes.',
  keywords: ['coaching payments', 'crypto consulting', 'low fee', 'instant settlement'],
  heroHeadline: 'Lower Fees on High-Ticket Programs',
  heroSubheadline:
    'Accept payments via QR and onramp. Instant settlement and on-chain finality reduce disputes on services.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['High fees on large transactions', 'Chargebacks on services', 'Bank delays and friction'],
  solutions: ['0.5-1% per transaction', 'On-chain finality reduces disputes', 'Exportable receipts', 'Onramp supports cards'],
  benefits: [
    { icon: '💰', title: 'Lower Fees', description: 'Save materially vs legacy rails.', stat: '0.5-1% Fees' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes on services.', stat: 'Irrevocable' },
    { icon: '⚡', title: 'Instant Settlement', description: 'Funds available immediately.', stat: '24/7' },
  ],
  avgMonthlyVolume: 50000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Program Deposits', description: 'Collect deposits via QR.', example: 'Reduce cancellations and secure seats.' },
    { title: 'Plan Billing', description: 'Recurring stablecoin membership.', example: 'Lower fees vs cards.' },
    { title: 'Events/Retreats', description: 'Pay links for event fees.', example: 'Instant settlement and receipts.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Customer-friendly QR flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Program revenue insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Configure programs/memberships', 'Enable onramp', 'Share QR/links'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports cards and Apple Pay.' },
    { question: 'Chargebacks?', answer: 'On-chain finality reduces dispute exposure.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Lower fees on high-ticket programs made a big difference.', author: 'Coach', business: 'Elevate Coaching', savings: '50-70% fees saved' }],
  relatedIndustries: ['credit-repair', 'ticket-brokers', 'travel-agencies'],
  relatedUseCases: ['qr-code-payments', 'instant-settlement', 'subscriptions'],
};

export const onlineGaming: IndustryLandingData = {
  slug: 'online-gaming',
  name: 'Online Gaming',
  icon: '🎮',
  title: 'Crypto Payments for Online Gaming | Entry Fees | Instant Settlement',
  metaDescription:
    'Online gaming platforms accept crypto and onramp payments for entry fees and purchases with instant settlement and lower fees.',
  keywords: ['online gaming payments', 'crypto in-game', 'instant settlement', 'low fee'],
  heroHeadline: 'Instant Entry Fees & Purchases',
  heroSubheadline:
    'Accept QR/onramp payments for entry fees and purchases. Lower fees vs cards; instant settlement improves player experience.',
  heroCTA: { primary: 'Start Free', primaryLink: '/admin', secondary: 'See Pricing', secondaryLink: '/terminal' },
  painPoints: ['Card declines on entry fees', 'Chargebacks on digital goods', 'Wire delays on payouts'],
  solutions: ['Stablecoins settle instantly', 'On-chain finality reduces disputes', 'Onramp supports cards/Apple Pay'],
  benefits: [
    { icon: '⚡', title: 'Instant Settlement', description: 'Fees and purchases settle in minutes.', stat: '24/7' },
    { icon: '💰', title: 'Lower Fees', description: 'Save vs cards.', stat: '0.5-1% Fees' },
    { icon: '🔒', title: 'Final Settlement', description: 'Reduce disputes on digital goods.', stat: 'Irrevocable' },
  ],
  avgMonthlyVolume: 42000,
  competitorComparison: {
    stripe: { processingFee: 0.029, flatFee: 0.3, monthlyFee: 0, annualSoftwareCost: 0 },
    square: { processingFee: 0.026, flatFee: 0.1, monthlyFee: 0, annualSoftwareCost: 0 },
    paypal: { processingFee: 0.0349, flatFee: 0.49, monthlyFee: 0, annualSoftwareCost: 0 },
  },
  useCases: [
    { title: 'Entry Fees', description: 'QR or link payments.', example: 'Instant settlement and receipt.' },
    { title: 'In-Game Purchases', description: 'Stablecoin purchases and upgrades.', example: 'Lower fees vs cards.' },
    { title: 'Payouts', description: 'Stablecoin payouts without wire delays.', example: 'Players receive funds in minutes.' },
  ],
  industryFeatures: ['QR Code Payments', 'Instant Settlement', 'Onramp Support', 'Exportable Reports'],
  includedFeatures: [
    { name: 'QR Checkout', description: 'Fast QR flow', usualCost: '$20/mo' },
    { name: 'Onramp', description: 'Card/Apple Pay support', usualCost: '$50/mo' },
    { name: 'Analytics', description: 'Entry and purchase insights', usualCost: '$40/mo' },
    { name: 'Export', description: 'CSV/JSON receipts', usualCost: '$15/mo' },
  ],
  setupSteps: ['Create account', 'Configure fees/purchases', 'Enable onramp', 'Share QR/links'],
  faqs: [
    { question: 'Crypto required?', answer: 'No. Onramp supports card and Apple Pay.' },
    { question: 'Settlement speed?', answer: 'Seconds to minutes depending on network.' },
    { question: 'Refunds?', answer: 'Manage refunds in dashboard.', category: 'Operations' },
  ],
  testimonials: [{ quote: 'Lower fees and instant settlement boosted player satisfaction.', author: 'PM', business: 'HyperPlay', savings: 'Lower fees + faster settlement' }],
  relatedIndustries: ['fantasy-sports', 'casinos-gambling', 'ticket-brokers'],
  relatedUseCases: ['instant-settlement', 'payouts', 'subscriptions'],
};
