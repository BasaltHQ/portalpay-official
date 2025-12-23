/**
 * Demo receipts for each industry
 * Each industry has 3-5 rotating receipt examples with items specific to that industry
 */

type DemoReceipt = {
  lineItems: { label: string; priceUsd: number; qty?: number }[];
  totalUsd: number;
};

export const INDUSTRY_DEMO_RECEIPTS: Record<string, DemoReceipt[]> = {
  'restaurants': [
    { lineItems: [{ label: 'Chicken Bowl', priceUsd: 10.99 }, { label: 'Tax', priceUsd: 0.99 }], totalUsd: 11.98 },
    { lineItems: [{ label: 'Burger & Fries', priceUsd: 14.50 }, { label: 'Tax', priceUsd: 1.31 }], totalUsd: 15.81 },
    { lineItems: [{ label: 'Pasta Carbonara', priceUsd: 16.00 }, { label: 'Tax', priceUsd: 1.44 }], totalUsd: 17.44 },
  ],
  'hotels': [
    { lineItems: [{ label: 'Room Night', priceUsd: 120.00 }, { label: 'Tax', priceUsd: 10.80 }], totalUsd: 130.80 },
    { lineItems: [{ label: 'Suite', priceUsd: 250.00 }, { label: 'Tax', priceUsd: 22.50 }], totalUsd: 272.50 },
    { lineItems: [{ label: 'Extended Stay (3 nights)', priceUsd: 330.00 }, { label: 'Tax', priceUsd: 29.70 }], totalUsd: 359.70 },
  ],
  'retail': [
    { lineItems: [{ label: 'T-Shirt', priceUsd: 24.99 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.24 },
    { lineItems: [{ label: 'Jeans', priceUsd: 59.99 }, { label: 'Tax', priceUsd: 5.40 }], totalUsd: 65.39 },
    { lineItems: [{ label: 'Sneakers', priceUsd: 89.00 }, { label: 'Tax', priceUsd: 8.01 }], totalUsd: 97.01 },
  ],
  'cafes': [
    { lineItems: [{ label: 'Cappuccino', priceUsd: 4.50 }, { label: 'Tax', priceUsd: 0.41 }], totalUsd: 4.91 },
    { lineItems: [{ label: 'Latte & Croissant', priceUsd: 8.00 }, { label: 'Tax', priceUsd: 0.72 }], totalUsd: 8.72 },
    { lineItems: [{ label: 'Cold Brew', priceUsd: 5.50 }, { label: 'Tax', priceUsd: 0.50 }], totalUsd: 6.00 },
  ],
  'bars': [
    { lineItems: [{ label: 'Craft Beer', priceUsd: 7.00 }, { label: 'Tax', priceUsd: 0.63 }], totalUsd: 7.63 },
    { lineItems: [{ label: 'Cocktail', priceUsd: 12.00 }, { label: 'Tax', priceUsd: 1.08 }], totalUsd: 13.08 },
    { lineItems: [{ label: 'Wine (Glass)', priceUsd: 9.00 }, { label: 'Tax', priceUsd: 0.81 }], totalUsd: 9.81 },
  ],
  'gyms': [
    { lineItems: [{ label: 'Day Pass', priceUsd: 15.00 }, { label: 'Tax', priceUsd: 1.35 }], totalUsd: 16.35 },
    { lineItems: [{ label: 'Personal Training', priceUsd: 60.00 }, { label: 'Tax', priceUsd: 5.40 }], totalUsd: 65.40 },
    { lineItems: [{ label: 'Monthly Membership', priceUsd: 49.00 }, { label: 'Tax', priceUsd: 4.41 }], totalUsd: 53.41 },
  ],
  'bakeries': [
    { lineItems: [{ label: 'Sourdough Loaf', priceUsd: 6.00 }, { label: 'Tax', priceUsd: 0.54 }], totalUsd: 6.54 },
    { lineItems: [{ label: 'Dozen Donuts', priceUsd: 12.00 }, { label: 'Tax', priceUsd: 1.08 }], totalUsd: 13.08 },
    { lineItems: [{ label: 'Custom Cake', priceUsd: 45.00 }, { label: 'Tax', priceUsd: 4.05 }], totalUsd: 49.05 },
  ],
  'food-trucks': [
    { lineItems: [{ label: 'Tacos (3)', priceUsd: 9.00 }, { label: 'Tax', priceUsd: 0.81 }], totalUsd: 9.81 },
    { lineItems: [{ label: 'BBQ Plate', priceUsd: 13.50 }, { label: 'Tax', priceUsd: 1.22 }], totalUsd: 14.72 },
    { lineItems: [{ label: 'Burrito Bowl', priceUsd: 11.00 }, { label: 'Tax', priceUsd: 0.99 }], totalUsd: 11.99 },
  ],
  'salons': [
    { lineItems: [{ label: 'Haircut', priceUsd: 35.00 }, { label: 'Tax', priceUsd: 3.15 }], totalUsd: 38.15 },
    { lineItems: [{ label: 'Color & Style', priceUsd: 95.00 }, { label: 'Tax', priceUsd: 8.55 }], totalUsd: 103.55 },
    { lineItems: [{ label: 'Manicure', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
  ],
  'freelancers': [
    { lineItems: [{ label: 'Web Design Project', priceUsd: 500.00 }, { label: 'Tax', priceUsd: 45.00 }], totalUsd: 545.00 },
    { lineItems: [{ label: 'Logo Design', priceUsd: 250.00 }, { label: 'Tax', priceUsd: 22.50 }], totalUsd: 272.50 },
    { lineItems: [{ label: 'Consulting (2 hours)', priceUsd: 200.00 }, { label: 'Tax', priceUsd: 18.00 }], totalUsd: 218.00 },
  ],
  'ecommerce': [
    { lineItems: [{ label: 'Wireless Headphones', priceUsd: 79.99 }, { label: 'Tax', priceUsd: 7.20 }], totalUsd: 87.19 },
    { lineItems: [{ label: 'Phone Case', priceUsd: 19.99 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.79 },
    { lineItems: [{ label: 'Smart Watch', priceUsd: 199.00 }, { label: 'Tax', priceUsd: 17.91 }], totalUsd: 216.91 },
  ],
  'medical': [
    { lineItems: [{ label: 'Consultation', priceUsd: 85.00 }, { label: 'Tax', priceUsd: 7.65 }], totalUsd: 92.65 },
    { lineItems: [{ label: 'Physical Therapy', priceUsd: 120.00 }, { label: 'Tax', priceUsd: 10.80 }], totalUsd: 130.80 },
    { lineItems: [{ label: 'Dental Cleaning', priceUsd: 95.00 }, { label: 'Tax', priceUsd: 8.55 }], totalUsd: 103.55 },
  ],
  'auto-repair': [
    { lineItems: [{ label: 'Oil Change', priceUsd: 45.00 }, { label: 'Tax', priceUsd: 4.05 }], totalUsd: 49.05 },
    { lineItems: [{ label: 'Brake Service', priceUsd: 250.00 }, { label: 'Tax', priceUsd: 22.50 }], totalUsd: 272.50 },
    { lineItems: [{ label: 'Tire Rotation', priceUsd: 35.00 }, { label: 'Tax', priceUsd: 3.15 }], totalUsd: 38.15 },
  ],
  'veterinarians': [
    { lineItems: [{ label: 'Checkup', priceUsd: 65.00 }, { label: 'Tax', priceUsd: 5.85 }], totalUsd: 70.85 },
    { lineItems: [{ label: 'Vaccination', priceUsd: 40.00 }, { label: 'Tax', priceUsd: 3.60 }], totalUsd: 43.60 },
    { lineItems: [{ label: 'Dental Cleaning', priceUsd: 150.00 }, { label: 'Tax', priceUsd: 13.50 }], totalUsd: 163.50 },
  ],
  'kirana-stores': [
    { lineItems: [{ label: 'Rice (5kg)', priceUsd: 8.00 }, { label: 'Tax', priceUsd: 0.72 }], totalUsd: 8.72 },
    { lineItems: [{ label: 'Lentils & Spices', priceUsd: 12.00 }, { label: 'Tax', priceUsd: 1.08 }], totalUsd: 13.08 },
    { lineItems: [{ label: 'Groceries', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
  ],
  'sari-sari-stores': [
    { lineItems: [{ label: 'Snacks & Drinks', priceUsd: 5.00 }, { label: 'Tax', priceUsd: 0.45 }], totalUsd: 5.45 },
    { lineItems: [{ label: 'Instant Noodles (10)', priceUsd: 8.50 }, { label: 'Tax', priceUsd: 0.77 }], totalUsd: 9.27 },
    { lineItems: [{ label: 'Household Items', priceUsd: 15.00 }, { label: 'Tax', priceUsd: 1.35 }], totalUsd: 16.35 },
  ],
  'street-food-vendors': [
    { lineItems: [{ label: 'Samosas (5)', priceUsd: 3.00 }, { label: 'Tax', priceUsd: 0.27 }], totalUsd: 3.27 },
    { lineItems: [{ label: 'Grilled Corn', priceUsd: 2.50 }, { label: 'Tax', priceUsd: 0.23 }], totalUsd: 2.73 },
    { lineItems: [{ label: 'Fresh Juice', priceUsd: 3.50 }, { label: 'Tax', priceUsd: 0.32 }], totalUsd: 3.82 },
  ],
  'boda-boda-operators': [
    { lineItems: [{ label: 'Ride (5km)', priceUsd: 2.00 }, { label: 'Tax', priceUsd: 0.18 }], totalUsd: 2.18 },
    { lineItems: [{ label: 'Delivery Service', priceUsd: 4.50 }, { label: 'Tax', priceUsd: 0.41 }], totalUsd: 4.91 },
    { lineItems: [{ label: 'Long Distance (20km)', priceUsd: 8.00 }, { label: 'Tax', priceUsd: 0.72 }], totalUsd: 8.72 },
  ],
  'market-stall-vendors': [
    { lineItems: [{ label: 'Fresh Vegetables', priceUsd: 6.00 }, { label: 'Tax', priceUsd: 0.54 }], totalUsd: 6.54 },
    { lineItems: [{ label: 'Fruits (3kg)', priceUsd: 10.00 }, { label: 'Tax', priceUsd: 0.90 }], totalUsd: 10.90 },
    { lineItems: [{ label: 'Eggs (Dozen)', priceUsd: 4.00 }, { label: 'Tax', priceUsd: 0.36 }], totalUsd: 4.36 },
  ],
  'water-kiosk-operators': [
    { lineItems: [{ label: 'Water (20L)', priceUsd: 0.50 }, { label: 'Tax', priceUsd: 0.05 }], totalUsd: 0.55 },
    { lineItems: [{ label: 'Monthly Supply', priceUsd: 15.00 }, { label: 'Tax', priceUsd: 1.35 }], totalUsd: 16.35 },
    { lineItems: [{ label: 'Bottled Water (24)', priceUsd: 8.00 }, { label: 'Tax', priceUsd: 0.72 }], totalUsd: 8.72 },
  ],
  'matatu-operators': [
    { lineItems: [{ label: 'Bus Fare', priceUsd: 1.50 }, { label: 'Tax', priceUsd: 0.14 }], totalUsd: 1.64 },
    { lineItems: [{ label: 'Long Route', priceUsd: 3.50 }, { label: 'Tax', priceUsd: 0.32 }], totalUsd: 3.82 },
    { lineItems: [{ label: 'Charter (2 hours)', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
  ],
  'community-tailors': [
    { lineItems: [{ label: 'Shirt Alteration', priceUsd: 8.00 }, { label: 'Tax', priceUsd: 0.72 }], totalUsd: 8.72 },
    { lineItems: [{ label: 'Custom Dress', priceUsd: 45.00 }, { label: 'Tax', priceUsd: 4.05 }], totalUsd: 49.05 },
    { lineItems: [{ label: 'Suit Tailoring', priceUsd: 120.00 }, { label: 'Tax', priceUsd: 10.80 }], totalUsd: 130.80 },
  ],
  'tuk-tuk-operators': [
    { lineItems: [{ label: 'Short Ride', priceUsd: 2.50 }, { label: 'Tax', priceUsd: 0.23 }], totalUsd: 2.73 },
    { lineItems: [{ label: 'City Tour', priceUsd: 15.00 }, { label: 'Tax', priceUsd: 1.35 }], totalUsd: 16.35 },
    { lineItems: [{ label: 'Airport Transfer', priceUsd: 20.00 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.80 },
  ],
  'fisherfolk-cooperatives': [
    { lineItems: [{ label: 'Fresh Fish (2kg)', priceUsd: 12.00 }, { label: 'Tax', priceUsd: 1.08 }], totalUsd: 13.08 },
    { lineItems: [{ label: 'Shrimp (1kg)', priceUsd: 18.00 }, { label: 'Tax', priceUsd: 1.62 }], totalUsd: 19.62 },
    { lineItems: [{ label: 'Mixed Seafood', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
  ],
  'smallholder-farmers': [
    { lineItems: [{ label: 'Organic Vegetables', priceUsd: 10.00 }, { label: 'Tax', priceUsd: 0.90 }], totalUsd: 10.90 },
    { lineItems: [{ label: 'Fresh Eggs (30)', priceUsd: 8.00 }, { label: 'Tax', priceUsd: 0.72 }], totalUsd: 8.72 },
    { lineItems: [{ label: 'Honey (1L)', priceUsd: 15.00 }, { label: 'Tax', priceUsd: 1.35 }], totalUsd: 16.35 },
  ],
  'street-musicians': [
    { lineItems: [{ label: 'Performance Tip', priceUsd: 5.00 }, { label: 'Tax', priceUsd: 0.45 }], totalUsd: 5.45 },
    { lineItems: [{ label: 'CD Album', priceUsd: 10.00 }, { label: 'Tax', priceUsd: 0.90 }], totalUsd: 10.90 },
    { lineItems: [{ label: 'Private Event', priceUsd: 100.00 }, { label: 'Tax', priceUsd: 9.00 }], totalUsd: 109.00 },
  ],
  'community-pharmacies': [
    { lineItems: [{ label: 'Prescription', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
    { lineItems: [{ label: 'OTC Medicine', priceUsd: 12.00 }, { label: 'Tax', priceUsd: 1.08 }], totalUsd: 13.08 },
    { lineItems: [{ label: 'Health Supplies', priceUsd: 35.00 }, { label: 'Tax', priceUsd: 3.15 }], totalUsd: 38.15 },
  ],
  'hardware-shops': [
    { lineItems: [{ label: 'Tools', priceUsd: 45.00 }, { label: 'Tax', priceUsd: 4.05 }], totalUsd: 49.05 },
    { lineItems: [{ label: 'Paint (5L)', priceUsd: 60.00 }, { label: 'Tax', priceUsd: 5.40 }], totalUsd: 65.40 },
    { lineItems: [{ label: 'Building Materials', priceUsd: 120.00 }, { label: 'Tax', priceUsd: 10.80 }], totalUsd: 130.80 },
  ],
  'street-barbers': [
    { lineItems: [{ label: 'Haircut', priceUsd: 3.00 }, { label: 'Tax', priceUsd: 0.27 }], totalUsd: 3.27 },
    { lineItems: [{ label: 'Shave & Cut', priceUsd: 5.00 }, { label: 'Tax', priceUsd: 0.45 }], totalUsd: 5.45 },
    { lineItems: [{ label: 'Hair Treatment', priceUsd: 8.00 }, { label: 'Tax', priceUsd: 0.72 }], totalUsd: 8.72 },
  ],
  'waste-pickers': [
    { lineItems: [{ label: 'Recyclables (10kg)', priceUsd: 5.00 }, { label: 'Tax', priceUsd: 0.45 }], totalUsd: 5.45 },
    { lineItems: [{ label: 'Metal Scrap', priceUsd: 12.00 }, { label: 'Tax', priceUsd: 1.08 }], totalUsd: 13.08 },
    { lineItems: [{ label: 'Bulk Collection', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
  ],
  'butcher-shops': [
    { lineItems: [{ label: 'Beef (1kg)', priceUsd: 12.00 }, { label: 'Tax', priceUsd: 1.08 }], totalUsd: 13.08 },
    { lineItems: [{ label: 'Chicken (2kg)', priceUsd: 15.00 }, { label: 'Tax', priceUsd: 1.35 }], totalUsd: 16.35 },
    { lineItems: [{ label: 'Mixed Cuts', priceUsd: 30.00 }, { label: 'Tax', priceUsd: 2.70 }], totalUsd: 32.70 },
  ],
  'mobile-money-agents': [
    { lineItems: [{ label: 'Cash In', priceUsd: 2.00 }, { label: 'Tax', priceUsd: 0.18 }], totalUsd: 2.18 },
    { lineItems: [{ label: 'Transfer Fee', priceUsd: 1.50 }, { label: 'Tax', priceUsd: 0.14 }], totalUsd: 1.64 },
    { lineItems: [{ label: 'Bill Payment', priceUsd: 1.00 }, { label: 'Tax', priceUsd: 0.09 }], totalUsd: 1.09 },
  ],
  'mobile-phone-repair': [
    { lineItems: [{ label: 'Screen Replacement', priceUsd: 45.00 }, { label: 'Tax', priceUsd: 4.05 }], totalUsd: 49.05 },
    { lineItems: [{ label: 'Battery Replacement', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
    { lineItems: [{ label: 'Software Fix', priceUsd: 15.00 }, { label: 'Tax', priceUsd: 1.35 }], totalUsd: 16.35 },
  ],
  'community-radio-stations': [
    { lineItems: [{ label: 'Ad Spot (30s)', priceUsd: 20.00 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.80 },
    { lineItems: [{ label: 'Sponsorship', priceUsd: 100.00 }, { label: 'Tax', priceUsd: 9.00 }], totalUsd: 109.00 },
    { lineItems: [{ label: 'Event Coverage', priceUsd: 150.00 }, { label: 'Tax', priceUsd: 13.50 }], totalUsd: 163.50 },
  ],
  'micro-grid-operators': [
    { lineItems: [{ label: 'Monthly Electric', priceUsd: 20.00 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.80 },
    { lineItems: [{ label: 'Connection Fee', priceUsd: 50.00 }, { label: 'Tax', priceUsd: 4.50 }], totalUsd: 54.50 },
    { lineItems: [{ label: 'Prepaid Units', priceUsd: 30.00 }, { label: 'Tax', priceUsd: 2.70 }], totalUsd: 32.70 },
  ],
  'internet-cafes': [
    { lineItems: [{ label: 'Internet (1 hour)', priceUsd: 2.00 }, { label: 'Tax', priceUsd: 0.18 }], totalUsd: 2.18 },
    { lineItems: [{ label: 'Printing (20 pages)', priceUsd: 5.00 }, { label: 'Tax', priceUsd: 0.45 }], totalUsd: 5.45 },
    { lineItems: [{ label: 'Day Pass', priceUsd: 10.00 }, { label: 'Tax', priceUsd: 0.90 }], totalUsd: 10.90 },
  ],
  'small-ferry-operators': [
    { lineItems: [{ label: 'Crossing', priceUsd: 3.00 }, { label: 'Tax', priceUsd: 0.27 }], totalUsd: 3.27 },
    { lineItems: [{ label: 'Round Trip', priceUsd: 5.00 }, { label: 'Tax', priceUsd: 0.45 }], totalUsd: 5.45 },
    { lineItems: [{ label: 'Island Tour', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
  ],
  'artisan-potters': [
    { lineItems: [{ label: 'Ceramic Bowl', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
    { lineItems: [{ label: 'Handmade Vase', priceUsd: 45.00 }, { label: 'Tax', priceUsd: 4.05 }], totalUsd: 49.05 },
    { lineItems: [{ label: 'Custom Pottery Set', priceUsd: 120.00 }, { label: 'Tax', priceUsd: 10.80 }], totalUsd: 130.80 },
  ],
  'village-savings-groups': [
    { lineItems: [{ label: 'Loan Fee', priceUsd: 5.00 }, { label: 'Tax', priceUsd: 0.45 }], totalUsd: 5.45 },
    { lineItems: [{ label: 'Membership', priceUsd: 10.00 }, { label: 'Tax', priceUsd: 0.90 }], totalUsd: 10.90 },
    { lineItems: [{ label: 'Share Purchase', priceUsd: 20.00 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.80 },
  ],
  'cryptid-tour-operators': [
    { lineItems: [{ label: 'Bigfoot Expedition', priceUsd: 75.00 }, { label: 'Tax', priceUsd: 6.75 }], totalUsd: 81.75 },
    { lineItems: [{ label: 'UFO Watch Night', priceUsd: 50.00 }, { label: 'Tax', priceUsd: 4.50 }], totalUsd: 54.50 },
    { lineItems: [{ label: 'Loch Ness Tour', priceUsd: 120.00 }, { label: 'Tax', priceUsd: 10.80 }], totalUsd: 130.80 },
  ],
  'real-estate': [
    { lineItems: [{ label: 'Property Down Payment', priceUsd: 50000.00 }, { label: 'Processing Fee', priceUsd: 500.00 }], totalUsd: 50500.00 },
    { lineItems: [{ label: 'Commercial Lease (1st Month)', priceUsd: 12000.00 }, { label: 'Security Deposit', priceUsd: 12000.00 }], totalUsd: 24000.00 },
    { lineItems: [{ label: 'Land Purchase', priceUsd: 150000.00 }, { label: 'Transfer Tax', priceUsd: 3000.00 }], totalUsd: 153000.00 },
  ],
  'venture-capital': [
    { lineItems: [{ label: 'Seed Round Investment', priceUsd: 500000.00 }, { label: 'Legal Fees', priceUsd: 5000.00 }], totalUsd: 505000.00 },
    { lineItems: [{ label: 'Series A Commitment', priceUsd: 2000000.00 }, { label: 'Due Diligence', priceUsd: 10000.00 }], totalUsd: 2010000.00 },
    { lineItems: [{ label: 'Bridge Financing', priceUsd: 250000.00 }, { label: 'Admin Fee', priceUsd: 2500.00 }], totalUsd: 252500.00 },
  ],
  'investment-funds': [
    { lineItems: [{ label: 'Mutual Fund Units', priceUsd: 100000.00 }, { label: 'Management Fee', priceUsd: 1000.00 }], totalUsd: 101000.00 },
    { lineItems: [{ label: 'ETF Purchase', priceUsd: 50000.00 }, { label: 'Trading Fee', priceUsd: 250.00 }], totalUsd: 50250.00 },
    { lineItems: [{ label: 'Hedge Fund Subscription', priceUsd: 1000000.00 }, { label: 'Performance Fee', priceUsd: 20000.00 }], totalUsd: 1020000.00 },
  ],
  'private-equity': [
    { lineItems: [{ label: 'Buyout Deal', priceUsd: 5000000.00 }, { label: 'Transaction Costs', priceUsd: 50000.00 }], totalUsd: 5050000.00 },
    { lineItems: [{ label: 'Growth Capital', priceUsd: 3000000.00 }, { label: 'Advisory Fee', priceUsd: 30000.00 }], totalUsd: 3030000.00 },
    { lineItems: [{ label: 'Distressed Asset', priceUsd: 1500000.00 }, { label: 'Legal Costs', priceUsd: 25000.00 }], totalUsd: 1525000.00 },
  ],
  'luxury-real-estate': [
    { lineItems: [{ label: 'Penthouse Down Payment', priceUsd: 500000.00 }, { label: 'Escrow Fee', priceUsd: 5000.00 }], totalUsd: 505000.00 },
    { lineItems: [{ label: 'Waterfront Villa', priceUsd: 2500000.00 }, { label: 'Transfer Tax', priceUsd: 50000.00 }], totalUsd: 2550000.00 },
    { lineItems: [{ label: 'Mountain Estate', priceUsd: 1200000.00 }, { label: 'Closing Costs', priceUsd: 24000.00 }], totalUsd: 1224000.00 },
  ],
  'aircraft-sales': [
    { lineItems: [{ label: 'Private Jet (Used)', priceUsd: 3500000.00 }, { label: 'Inspection & Fees', priceUsd: 35000.00 }], totalUsd: 3535000.00 },
    { lineItems: [{ label: 'Helicopter', priceUsd: 850000.00 }, { label: 'Registration', priceUsd: 8500.00 }], totalUsd: 858500.00 },
    { lineItems: [{ label: 'Fractional Share (1/4)', priceUsd: 1500000.00 }, { label: 'Management Fee', priceUsd: 15000.00 }], totalUsd: 1515000.00 },
  ],
  'yacht-brokers': [
    { lineItems: [{ label: 'Motor Yacht (60ft)', priceUsd: 1800000.00 }, { label: 'Brokerage Fee', priceUsd: 36000.00 }], totalUsd: 1836000.00 },
    { lineItems: [{ label: 'Sailing Yacht (80ft)', priceUsd: 3200000.00 }, { label: 'Survey & Insurance', priceUsd: 32000.00 }], totalUsd: 3232000.00 },
    { lineItems: [{ label: 'Superyacht (120ft)', priceUsd: 12000000.00 }, { label: 'Documentation', priceUsd: 120000.00 }], totalUsd: 12120000.00 },
  ],
  'art-galleries': [
    { lineItems: [{ label: 'Contemporary Painting', priceUsd: 250000.00 }, { label: 'Gallery Commission', priceUsd: 25000.00 }], totalUsd: 275000.00 },
    { lineItems: [{ label: 'Sculpture Collection', priceUsd: 500000.00 }, { label: 'Authentication', priceUsd: 5000.00 }], totalUsd: 505000.00 },
    { lineItems: [{ label: 'Limited Edition Print', priceUsd: 75000.00 }, { label: 'Framing & Shipping', priceUsd: 2500.00 }], totalUsd: 77500.00 },
  ],
  'rare-collectibles': [
    { lineItems: [{ label: 'Vintage Car (1960s)', priceUsd: 450000.00 }, { label: 'Appraisal', priceUsd: 4500.00 }], totalUsd: 454500.00 },
    { lineItems: [{ label: 'Rare Coin Collection', priceUsd: 125000.00 }, { label: 'Certification', priceUsd: 1250.00 }], totalUsd: 126250.00 },
    { lineItems: [{ label: 'Fine Wine Lot', priceUsd: 85000.00 }, { label: 'Storage & Insurance', priceUsd: 2550.00 }], totalUsd: 87550.00 },
  ],
  'jewelry-diamonds': [
    { lineItems: [{ label: 'Diamond Ring (5ct)', priceUsd: 350000.00 }, { label: 'Certification', priceUsd: 3500.00 }], totalUsd: 353500.00 },
    { lineItems: [{ label: 'Emerald Necklace', priceUsd: 180000.00 }, { label: 'Appraisal', priceUsd: 1800.00 }], totalUsd: 181800.00 },
    { lineItems: [{ label: 'Custom Watch', priceUsd: 95000.00 }, { label: 'Service Plan', priceUsd: 2850.00 }], totalUsd: 97850.00 },
  ],

  'plumbing-services': [
    { lineItems: [{ label: 'Emergency Leak Repair', priceUsd: 220.00 }, { label: 'Tax', priceUsd: 19.80 }], totalUsd: 239.80 },
    { lineItems: [{ label: 'Water Heater Installation', priceUsd: 1200.00 }, { label: 'Tax', priceUsd: 108.00 }], totalUsd: 1308.00 },
    { lineItems: [{ label: 'Drain Cleaning', priceUsd: 150.00 }, { label: 'Tax', priceUsd: 13.50 }], totalUsd: 163.50 },
  ],
  'hvac-services': [
    { lineItems: [{ label: 'AC Tune-Up', priceUsd: 120.00 }, { label: 'Tax', priceUsd: 10.80 }], totalUsd: 130.80 },
    { lineItems: [{ label: 'Furnace Replacement', priceUsd: 3200.00 }, { label: 'Tax', priceUsd: 288.00 }], totalUsd: 3488.00 },
    { lineItems: [{ label: 'Thermostat Install', priceUsd: 180.00 }, { label: 'Tax', priceUsd: 16.20 }], totalUsd: 196.20 },
  ],
  'electrical-contractors': [
    { lineItems: [{ label: 'Panel Upgrade', priceUsd: 1800.00 }, { label: 'Tax', priceUsd: 162.00 }], totalUsd: 1962.00 },
    { lineItems: [{ label: 'Outlet Rewiring', priceUsd: 250.00 }, { label: 'Tax', priceUsd: 22.50 }], totalUsd: 272.50 },
    { lineItems: [{ label: 'EV Charger Install', priceUsd: 1200.00 }, { label: 'Tax', priceUsd: 108.00 }], totalUsd: 1308.00 },
  ],
  'roofing-contractors': [
    { lineItems: [{ label: 'Roof Inspection', priceUsd: 175.00 }, { label: 'Tax', priceUsd: 15.75 }], totalUsd: 190.75 },
    { lineItems: [{ label: 'Shingle Repair', priceUsd: 850.00 }, { label: 'Tax', priceUsd: 76.50 }], totalUsd: 926.50 },
    { lineItems: [{ label: 'New Roof Deposit', priceUsd: 5000.00 }, { label: 'Tax', priceUsd: 450.00 }], totalUsd: 5450.00 },
  ],
  'landscaping-services': [
    { lineItems: [{ label: 'Lawn Care (Monthly)', priceUsd: 120.00 }, { label: 'Tax', priceUsd: 10.80 }], totalUsd: 130.80 },
    { lineItems: [{ label: 'Tree Trimming', priceUsd: 350.00 }, { label: 'Tax', priceUsd: 31.50 }], totalUsd: 381.50 },
    { lineItems: [{ label: 'Sod Installation', priceUsd: 1200.00 }, { label: 'Tax', priceUsd: 108.00 }], totalUsd: 1308.00 },
  ],
  'general-contractors': [
    { lineItems: [{ label: 'Kitchen Remodel Deposit', priceUsd: 8000.00 }, { label: 'Tax', priceUsd: 720.00 }], totalUsd: 8720.00 },
    { lineItems: [{ label: 'Bathroom Renovation', priceUsd: 12000.00 }, { label: 'Tax', priceUsd: 1080.00 }], totalUsd: 13080.00 },
    { lineItems: [{ label: 'Permit Management', priceUsd: 300.00 }, { label: 'Tax', priceUsd: 27.00 }], totalUsd: 327.00 },
  ],
  'carpentry': [
    { lineItems: [{ label: 'Custom Shelving', priceUsd: 650.00 }, { label: 'Tax', priceUsd: 58.50 }], totalUsd: 708.50 },
    { lineItems: [{ label: 'Door Installation', priceUsd: 250.00 }, { label: 'Tax', priceUsd: 22.50 }], totalUsd: 272.50 },
    { lineItems: [{ label: 'Built-in Cabinets Deposit', priceUsd: 2500.00 }, { label: 'Tax', priceUsd: 225.00 }], totalUsd: 2725.00 },
  ],
  'painters': [
    { lineItems: [{ label: 'Interior Room Paint', priceUsd: 400.00 }, { label: 'Tax', priceUsd: 36.00 }], totalUsd: 436.00 },
    { lineItems: [{ label: 'Exterior Touch-Up', priceUsd: 650.00 }, { label: 'Tax', priceUsd: 58.50 }], totalUsd: 708.50 },
    { lineItems: [{ label: 'Full House Painting Deposit', priceUsd: 3000.00 }, { label: 'Tax', priceUsd: 270.00 }], totalUsd: 3270.00 },
  ],
  'pest-control': [
    { lineItems: [{ label: 'Ant Treatment', priceUsd: 150.00 }, { label: 'Tax', priceUsd: 13.50 }], totalUsd: 163.50 },
    { lineItems: [{ label: 'Termite Inspection', priceUsd: 95.00 }, { label: 'Tax', priceUsd: 8.55 }], totalUsd: 103.55 },
    { lineItems: [{ label: 'Quarterly Service', priceUsd: 250.00 }, { label: 'Tax', priceUsd: 22.50 }], totalUsd: 272.50 },
  ],
  'locksmiths': [
    { lineItems: [{ label: 'Emergency Lockout', priceUsd: 95.00 }, { label: 'Tax', priceUsd: 8.55 }], totalUsd: 103.55 },
    { lineItems: [{ label: 'Rekey Locks (4)', priceUsd: 180.00 }, { label: 'Tax', priceUsd: 16.20 }], totalUsd: 196.20 },
    { lineItems: [{ label: 'Smart Lock Install', priceUsd: 220.00 }, { label: 'Tax', priceUsd: 19.80 }], totalUsd: 239.80 },
  ],
  'appliance-repair': [
    { lineItems: [{ label: 'Washer Repair', priceUsd: 180.00 }, { label: 'Tax', priceUsd: 16.20 }], totalUsd: 196.20 },
    { lineItems: [{ label: 'Refrigerator Service', priceUsd: 250.00 }, { label: 'Tax', priceUsd: 22.50 }], totalUsd: 272.50 },
    { lineItems: [{ label: 'Diagnostic Visit', priceUsd: 85.00 }, { label: 'Tax', priceUsd: 7.65 }], totalUsd: 92.65 },
  ],
  'cleaning-services': [
    { lineItems: [{ label: 'Move-Out Cleaning', priceUsd: 250.00 }, { label: 'Tax', priceUsd: 22.50 }], totalUsd: 272.50 },
    { lineItems: [{ label: 'Weekly Cleaning', priceUsd: 120.00 }, { label: 'Tax', priceUsd: 10.80 }], totalUsd: 130.80 },
    { lineItems: [{ label: 'Deep Cleaning', priceUsd: 300.00 }, { label: 'Tax', priceUsd: 27.00 }], totalUsd: 327.00 },
  ],

  // High-Risk Industries
  'cannabis-dispensaries': [
    { lineItems: [{ label: 'Flower (3.5g)', priceUsd: 35.00 }, { label: 'Tax', priceUsd: 3.15 }], totalUsd: 38.15 },
    { lineItems: [{ label: 'Pre-roll Pack', priceUsd: 25.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
    { lineItems: [{ label: 'Edible Gummies', priceUsd: 20.00 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.80 },
  ],
  'liquor-stores': [
    { lineItems: [{ label: 'Whiskey Bottle', priceUsd: 45.00 }, { label: 'Tax', priceUsd: 4.05 }], totalUsd: 49.05 },
    { lineItems: [{ label: 'Wine Case (6)', priceUsd: 90.00 }, { label: 'Tax', priceUsd: 8.10 }], totalUsd: 98.10 },
    { lineItems: [{ label: 'Craft Beer 6-Pack', priceUsd: 12.00 }, { label: 'Tax', priceUsd: 1.08 }], totalUsd: 13.08 },
  ],
  'vape-tobacco-shops': [
    { lineItems: [{ label: 'E-Liquid (60ml)', priceUsd: 15.00 }, { label: 'Coils (2)', priceUsd: 10.00 }, { label: 'Tax', priceUsd: 2.25 }], totalUsd: 27.25 },
    { lineItems: [{ label: 'Disposable Vape', priceUsd: 19.99 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.79 },
    { lineItems: [{ label: 'Pod Pack', priceUsd: 14.00 }, { label: 'Tax', priceUsd: 1.26 }], totalUsd: 15.26 },
  ],
  'adult-entertainment': [
    { lineItems: [{ label: 'Monthly Membership', priceUsd: 29.99 }, { label: 'Platform Fee', priceUsd: 1.00 }], totalUsd: 30.99 },
    { lineItems: [{ label: 'PPV Access', priceUsd: 14.99 }], totalUsd: 14.99 },
    { lineItems: [{ label: 'Live Event Tip', priceUsd: 10.00 }], totalUsd: 10.00 },
  ],
  'casinos-gambling': [
    { lineItems: [{ label: 'Tournament Buy-In', priceUsd: 200.00 }, { label: 'Processing Fee', priceUsd: 2.00 }], totalUsd: 202.00 },
    { lineItems: [{ label: 'Chip Purchase', priceUsd: 500.00 }], totalUsd: 500.00 },
    { lineItems: [{ label: 'Payout Fee', priceUsd: 5.00 }], totalUsd: 5.00 },
  ],
  'firearms-gun-shops': [
    { lineItems: [{ label: 'Range Fee', priceUsd: 20.00 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.80 },
    { lineItems: [{ label: 'Ammo (9mm, 50ct)', priceUsd: 19.99 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.79 },
    { lineItems: [{ label: 'Gun Case', priceUsd: 35.00 }, { label: 'Tax', priceUsd: 3.15 }], totalUsd: 38.15 },
  ],
  'cbd-hemp-products': [
    { lineItems: [{ label: 'CBD Oil (30ml)', priceUsd: 39.99 }, { label: 'Tax', priceUsd: 3.60 }], totalUsd: 43.59 },
    { lineItems: [{ label: 'Gummies (30ct)', priceUsd: 24.00 }, { label: 'Tax', priceUsd: 2.16 }], totalUsd: 26.16 },
    { lineItems: [{ label: 'Topical Cream', priceUsd: 29.00 }, { label: 'Tax', priceUsd: 2.61 }], totalUsd: 31.61 },
  ],
  'kratom-sellers': [
    { lineItems: [{ label: 'Kratom Powder (250g)', priceUsd: 29.99 }, { label: 'Tax', priceUsd: 2.70 }], totalUsd: 32.69 },
    { lineItems: [{ label: 'Capsules (120ct)', priceUsd: 34.00 }, { label: 'Tax', priceUsd: 3.06 }], totalUsd: 37.06 },
    { lineItems: [{ label: 'Sample Pack', priceUsd: 12.00 }, { label: 'Tax', priceUsd: 1.08 }], totalUsd: 13.08 },
  ],
  'supplements-nutraceuticals': [
    { lineItems: [{ label: 'Protein Powder', priceUsd: 49.99 }, { label: 'Tax', priceUsd: 4.50 }], totalUsd: 54.49 },
    { lineItems: [{ label: 'Multivitamin', priceUsd: 19.99 }, { label: 'Tax', priceUsd: 1.80 }], totalUsd: 21.79 },
    { lineItems: [{ label: 'Pre-Workout', priceUsd: 34.00 }, { label: 'Tax', priceUsd: 3.06 }], totalUsd: 37.06 },
  ],
  'payday-loans': [
    { lineItems: [{ label: 'Loan Repayment', priceUsd: 150.00 }, { label: 'Convenience Fee', priceUsd: 3.00 }], totalUsd: 153.00 },
    { lineItems: [{ label: 'Late Fee', priceUsd: 15.00 }], totalUsd: 15.00 },
    { lineItems: [{ label: 'Partial Repayment', priceUsd: 75.00 }], totalUsd: 75.00 },
  ],
  'check-cashing-money-services': [
    { lineItems: [{ label: 'Check Cashing Fee', priceUsd: 3.00 }], totalUsd: 3.00 },
    { lineItems: [{ label: 'Bill Pay Fee', priceUsd: 2.50 }], totalUsd: 2.50 },
    { lineItems: [{ label: 'Money Order Fee', priceUsd: 1.50 }], totalUsd: 1.50 },
  ],
  'bail-bonds': [
    { lineItems: [{ label: 'Premium Payment', priceUsd: 500.00 }, { label: 'Admin Fee', priceUsd: 20.00 }], totalUsd: 520.00 },
    { lineItems: [{ label: 'Collateral Deposit', priceUsd: 1000.00 }], totalUsd: 1000.00 },
    { lineItems: [{ label: 'Payment Plan', priceUsd: 250.00 }], totalUsd: 250.00 },
  ],
  'debt-collection': [
    { lineItems: [{ label: 'Debt Payment', priceUsd: 75.00 }], totalUsd: 75.00 },
    { lineItems: [{ label: 'Settlement Payment', priceUsd: 500.00 }], totalUsd: 500.00 },
    { lineItems: [{ label: 'Payment Plan Installment', priceUsd: 50.00 }], totalUsd: 50.00 },
  ],
  'credit-repair': [
    { lineItems: [{ label: 'Initial Consultation', priceUsd: 99.00 }], totalUsd: 99.00 },
    { lineItems: [{ label: 'Monthly Membership', priceUsd: 79.00 }], totalUsd: 79.00 },
    { lineItems: [{ label: 'Credit Report Review', priceUsd: 49.00 }], totalUsd: 49.00 },
  ],
  'ticket-brokers': [
    { lineItems: [{ label: 'Concert Tickets (2)', priceUsd: 250.00 }, { label: 'Service Fee', priceUsd: 15.00 }], totalUsd: 265.00 },
    { lineItems: [{ label: 'Sports Tickets', priceUsd: 180.00 }, { label: 'Service Fee', priceUsd: 10.00 }], totalUsd: 190.00 },
    { lineItems: [{ label: 'Theater Ticket', priceUsd: 95.00 }, { label: 'Service Fee', priceUsd: 5.00 }], totalUsd: 100.00 },
  ],
  'travel-agencies': [
    { lineItems: [{ label: 'Trip Deposit', priceUsd: 500.00 }], totalUsd: 500.00 },
    { lineItems: [{ label: 'Booking Fee', priceUsd: 25.00 }], totalUsd: 25.00 },
    { lineItems: [{ label: 'Final Balance', priceUsd: 1200.00 }], totalUsd: 1200.00 },
  ],
  'fantasy-sports': [
    { lineItems: [{ label: 'Entry Fee', priceUsd: 25.00 }], totalUsd: 25.00 },
    { lineItems: [{ label: 'Premium Membership', priceUsd: 9.99 }], totalUsd: 9.99 },
    { lineItems: [{ label: 'Payout Processing Fee', priceUsd: 2.00 }], totalUsd: 2.00 },
  ],
  'timeshares': [
    { lineItems: [{ label: 'Reservation Deposit', priceUsd: 1000.00 }], totalUsd: 1000.00 },
    { lineItems: [{ label: 'Annual Dues', priceUsd: 800.00 }], totalUsd: 800.00 },
    { lineItems: [{ label: 'Upgrade Fee', priceUsd: 250.00 }], totalUsd: 250.00 },
  ],
  'high-ticket-coaching': [
    { lineItems: [{ label: 'Program Deposit', priceUsd: 2000.00 }], totalUsd: 2000.00 },
    { lineItems: [{ label: 'Monthly Plan', priceUsd: 499.00 }], totalUsd: 499.00 },
    { lineItems: [{ label: 'Event Ticket', priceUsd: 299.00 }], totalUsd: 299.00 },
  ],
  'online-gaming': [
    { lineItems: [{ label: 'Entry Fee', priceUsd: 15.00 }], totalUsd: 15.00 },
    { lineItems: [{ label: 'In-Game Pack', priceUsd: 9.99 }], totalUsd: 9.99 },
    { lineItems: [{ label: 'Season Pass', priceUsd: 19.99 }], totalUsd: 19.99 },
  ],

  'lube-manufacturers': [
    { lineItems: [{ label: 'Private Label Batch Deposit', priceUsd: 2500.00 }, { label: 'Processing', priceUsd: 25.00 }], totalUsd: 2525.00 },
    { lineItems: [{ label: 'Bulk Order Balance', priceUsd: 12000.00 }, { label: 'Logistics Fee', priceUsd: 120.00 }], totalUsd: 12120.00 },
    { lineItems: [{ label: 'Trade Show Sample Kit', priceUsd: 199.00 }, { label: 'Tax', priceUsd: 17.91 }], totalUsd: 216.91 },
  ],

  'adult-novelty-retailers': [
    { lineItems: [{ label: 'Discreet Bundle', priceUsd: 89.00 }, { label: 'Tax', priceUsd: 8.01 }], totalUsd: 97.01 },
    { lineItems: [{ label: 'Gift Card', priceUsd: 50.00 }], totalUsd: 50.00 },
    { lineItems: [{ label: 'Subscription Refill', priceUsd: 29.99 }], totalUsd: 29.99 },
  ],

  'tattoo-piercing-studios': [
    { lineItems: [{ label: 'Booking Deposit', priceUsd: 100.00 }], totalUsd: 100.00 },
    { lineItems: [{ label: 'Flash Tattoo', priceUsd: 150.00 }, { label: 'Tax', priceUsd: 13.50 }], totalUsd: 163.50 },
    { lineItems: [{ label: 'Piercing + Jewelry', priceUsd: 85.00 }, { label: 'Tax', priceUsd: 7.65 }], totalUsd: 92.65 },
  ],

  'nightclubs': [
    { lineItems: [{ label: 'Cover Charge', priceUsd: 20.00 }], totalUsd: 20.00 },
    { lineItems: [{ label: 'VIP Table Deposit', priceUsd: 500.00 }], totalUsd: 500.00 },
    { lineItems: [{ label: 'Bar Round', priceUsd: 48.00 }, { label: 'Tax', priceUsd: 4.32 }], totalUsd: 52.32 },
  ],
};
