/**
 * Industry Pack Definitions
 * Defines templates, sample inventory, and configurations for each industry type
 */

export type IndustryPackType = 'general' | 'restaurant' | 'retail' | 'hotel' | 'freelancer' | 'publishing';

// Restaurant-specific types
export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelect?: number;
  maxSelect?: number;
  modifiers: Modifier[];
};

export type Modifier = {
  id: string;
  name: string;
  priceAdjustment: number;
  default?: boolean;
};

export type RestaurantItem = {
  modifierGroups?: ModifierGroup[];
  dietaryTags?: string[];
  spiceLevel?: number;
  prepTime?: string;
  calories?: number;
  ingredients?: string;
};

// Retail-specific types
export type VariationGroup = {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  required: boolean;
  values: string[];
};

export type ProductVariant = {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  priceAdjustment: number;
  stockQty: number;
  images?: string[];
};

export type RetailItem = {
  variationGroups?: VariationGroup[];
  variants?: ProductVariant[];
};

// Hotel-specific types
export type HotelRoom = {
  id: string;
  roomNumber: string;
  typeId: string;
  status: 'available' | 'occupied' | 'housekeeping' | 'maintenance';
  currentBooking?: {
    guestWallet: string;
    checkIn: number;
    checkOut: number;
    receiptId: string;
  };
  lastStatusChange: number;
  notes?: string;
};

export type HotelRoomType = {
  rooms: HotelRoom[];
  maxOccupancy: number;
  amenities?: string[];
};

// Freelancer-specific types
export type ServicePricing = {
  type: 'hourly' | 'project' | 'package' | 'retainer';
  amount: number;
  minHours?: number;
  billingCycle?: 'monthly' | 'quarterly';
};

export type ServiceAddOn = {
  id: string;
  name: string;
  price: number;
  description?: string;
};

export type FreelanceService = {
  pricing: ServicePricing;
  deliveryTime: string;
  revisionsIncluded: number;
  serviceCategory: string;
  skillLevel: string;
  deliverables?: string[];
  requirements?: string[];
  addOns?: ServiceAddOn[];
};

// Publishing-specific types
export type BookItem = {
  author: string;
  pages?: number;
  publisher?: string;
  publicationDate?: string;
  isbn?: string;
  genre?: string;
  language?: string;
  format?: 'pdf';
  fileUrl?: string;
  coverUrl?: string; // Tall aspect ratio
  previewUrl?: string;
  drmEnabled?: boolean;
  series?: {
    name: string;
    order: number;
  };
  contentDisclosures?: {
    adult?: boolean;
    violence?: boolean;
    aiGenerated?: boolean;
  };
};

// Industry Pack definition
export type IndustryPack = {
  id: IndustryPackType;
  name: string;
  description: string;
  appDescription?: string;
  icon: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    arrangement: 'grid' | 'featured_first' | 'groups' | 'carousel';
  };
  categories: string[];
  sampleItems: any[];
  analyticsConfig: {
    kpis: string[];
    metrics: string[];
  };
};

// Preset variation groups for retail
export const RETAIL_VARIATION_PRESETS = {
  size: {
    name: 'Size',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '1X', '2X', '3X', '4X'],
  },
  color: {
    name: 'Color',
    values: ['White', 'Black', 'Navy', 'Gray', 'Red', 'Blue', 'Green', 'Pink', 'Purple', 'Brown', 'Custom'],
  },
  material: {
    name: 'Material',
    values: ['Cotton', 'Polyester', 'Wool', 'Silk', 'Leather', 'Denim', 'Linen', 'Blend'],
  },
  style: {
    name: 'Style',
    values: ['Regular', 'Slim', 'Relaxed', 'Athletic', 'Oversized'],
  },
};

// Industry Pack definitions
export const INDUSTRY_PACKS: Record<IndustryPackType, IndustryPack> = {
  general: {
    id: 'general',
    name: 'General Store',
    description: 'Flexible setup for any type of business without industry-specific features',
    appDescription: 'Universal Point of Sale (POS) for retail and service businesses.',
    icon: '◉',
    theme: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#22c55e',
      accentColor: '#f59e0b',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      arrangement: 'grid',
    },
    categories: ['Products', 'Services', 'Featured', 'Sale'],
    sampleItems: [],
    analyticsConfig: {
      kpis: ['Total Sales', 'Order Volume', 'Average Order Value', 'Customer Retention'],
      metrics: ['Sales Trends', 'Popular Items', 'Revenue Growth', 'Customer Activity'],
    },
  },

  restaurant: {
    id: 'restaurant',
    name: 'Restaurant & Cafe',
    description: 'Menu items with modifiers, dietary tags, and prep times',
    appDescription: 'Full-scale POS with Table Management, Kitchen Display System (KDS), and Order Modifiers.',
    icon: '⚑',
    theme: {
      primaryColor: '#DC2626',
      secondaryColor: '#F59E0B',
      accentColor: '#10B981',
      fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif',
      arrangement: 'groups',
    },
    categories: ['Appetizers', 'Entrees', 'Sides', 'Desserts', 'Beverages', 'Specials'],
    sampleItems: [
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with classic Caesar dressing, parmesan, and croutons',
        basePrice: 12,
        category: 'Appetizers',
        dietaryTags: ['Vegetarian'],
        spiceLevel: 0,
        prepTime: '5-10 min',
        calories: 320,
        ingredients: 'Romaine lettuce, Caesar dressing, parmesan cheese, croutons',
        modifierGroups: [
          {
            id: 'protein',
            name: 'Add Protein',
            required: false,
            maxSelect: 1,
            modifiers: [
              { id: 'chicken', name: 'Grilled Chicken', priceAdjustment: 5, default: false },
              { id: 'salmon', name: 'Grilled Salmon', priceAdjustment: 8, default: false },
              { id: 'shrimp', name: 'Shrimp', priceAdjustment: 7, default: false },
            ],
          },
        ],
      },
      {
        name: 'Grilled Salmon',
        description: 'Atlantic salmon fillet with seasonal vegetables and lemon butter sauce',
        basePrice: 28,
        category: 'Entrees',
        dietaryTags: ['Gluten-Free'],
        spiceLevel: 1,
        prepTime: '15-20 min',
        calories: 520,
        ingredients: 'Atlantic salmon, seasonal vegetables, lemon butter sauce, herbs',
        modifierGroups: [
          {
            id: 'sides',
            name: 'Choose Side',
            required: true,
            minSelect: 1,
            maxSelect: 1,
            modifiers: [
              { id: 'rice', name: 'Jasmine Rice', priceAdjustment: 0, default: true },
              { id: 'mashed', name: 'Mashed Potatoes', priceAdjustment: 0, default: false },
              { id: 'salad', name: 'House Salad', priceAdjustment: 0, default: false },
            ],
          },
        ],
      },
      {
        name: 'Classic Burger',
        description: 'Angus beef patty with lettuce, tomato, onion, and pickles',
        basePrice: 16,
        category: 'Entrees',
        spiceLevel: 1,
        prepTime: '10-15 min',
        calories: 680,
        modifierGroups: [
          {
            id: 'cheese',
            name: 'Add Cheese',
            required: false,
            maxSelect: 2,
            modifiers: [
              { id: 'cheddar', name: 'Cheddar', priceAdjustment: 1.5, default: false },
              { id: 'swiss', name: 'Swiss', priceAdjustment: 1.5, default: false },
              { id: 'blue', name: 'Blue Cheese', priceAdjustment: 2, default: false },
            ],
          },
          {
            id: 'extras',
            name: 'Add Extras',
            required: false,
            maxSelect: 5,
            modifiers: [
              { id: 'bacon', name: 'Bacon', priceAdjustment: 2, default: false },
              { id: 'avocado', name: 'Avocado', priceAdjustment: 1.5, default: false },
              { id: 'egg', name: 'Fried Egg', priceAdjustment: 1, default: false },
              { id: 'mushrooms', name: 'Sautéed Mushrooms', priceAdjustment: 1.5, default: false },
            ],
          },
        ],
      },
      {
        name: 'Tiramisu',
        description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone',
        basePrice: 9,
        category: 'Desserts',
        dietaryTags: ['Vegetarian'],
        prepTime: '5 min',
        calories: 380,
      },
      {
        name: 'Craft Beer Selection',
        description: 'Rotating selection of local craft beers',
        basePrice: 7,
        category: 'Beverages',
        prepTime: '2 min',
        modifierGroups: [
          {
            id: 'size',
            name: 'Size',
            required: true,
            minSelect: 1,
            maxSelect: 1,
            modifiers: [
              { id: 'draft', name: 'Draft (16oz)', priceAdjustment: 0, default: true },
              { id: 'bottle', name: 'Bottle (12oz)', priceAdjustment: -1, default: false },
              { id: 'pitcher', name: 'Pitcher (64oz)', priceAdjustment: 18, default: false },
            ],
          },
        ],
      },
    ],
    analyticsConfig: {
      kpis: ['Table Turnover Rate', 'Peak Hours', 'Popular Dishes', 'Average Check Size'],
      metrics: ['Orders by Time of Day', 'Category Performance', 'Modifier Popularity', 'Prep Time Efficiency'],
    },
  },

  retail: {
    id: 'retail',
    name: 'Retail & Apparel',
    description: 'Products with variations like size, color, and custom attributes',
    appDescription: 'Retail POS with Inventory Variants, Barcode Scanning, and Stock Management.',
    icon: '◆',
    theme: {
      primaryColor: '#6366F1',
      secondaryColor: '#EC4899',
      accentColor: '#14B8A6',
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      arrangement: 'grid',
    },
    categories: ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Shoes', 'Sale'],
    sampleItems: [
      {
        name: 'Classic White Tee',
        description: 'Premium cotton t-shirt with a comfortable fit',
        basePrice: 29,
        category: 'Tops',
        variationGroups: [
          { id: 'size', name: 'Size', type: 'preset', required: true, values: ['S', 'M', 'L', 'XL', 'XXL'] },
        ],
      },
      {
        name: 'Slim Fit Jeans',
        description: 'Stretch denim jeans with a modern slim fit',
        basePrice: 79,
        category: 'Bottoms',
        variationGroups: [
          { id: 'size', name: 'Size', type: 'preset', required: true, values: ['28', '30', '32', '34', '36', '38'] },
          { id: 'color', name: 'Color', type: 'preset', required: true, values: ['Dark Wash', 'Light Wash', 'Black'] },
        ],
      },
      {
        name: 'Leather Jacket',
        description: 'Genuine leather jacket with classic styling',
        basePrice: 249,
        category: 'Outerwear',
        variationGroups: [
          { id: 'size', name: 'Size', type: 'preset', required: true, values: ['S', 'M', 'L', 'XL'] },
        ],
      },
      {
        name: 'Canvas Sneakers',
        description: 'Comfortable canvas sneakers for everyday wear',
        basePrice: 59,
        category: 'Shoes',
        variationGroups: [
          { id: 'size', name: 'Size', type: 'preset', required: true, values: ['7', '8', '9', '10', '11', '12'] },
          { id: 'color', name: 'Color', type: 'preset', required: true, values: ['White', 'Black', 'Navy'] },
        ],
      },
    ],
    analyticsConfig: {
      kpis: ['Inventory Turnover', 'Size Distribution', 'Color Preferences', 'Return Rate'],
      metrics: ['Best Sellers by Category', 'Seasonal Trends', 'Variant Performance', 'Stock Alerts'],
    },
  },

  hotel: {
    id: 'hotel',
    name: 'Hotel & Accommodation',
    description: 'Room types with availability tracking and booking management',
    appDescription: 'Property Management System (PMS) with Room Inventory, Housekeeping, and Guest Booking Engine.',
    icon: '▣',
    theme: {
      primaryColor: '#0EA5E9',
      secondaryColor: '#8B5CF6',
      accentColor: '#F59E0B',
      fontFamily: 'Merriweather, Georgia, Cambria, Times New Roman, Times, serif',
      arrangement: 'featured_first',
    },
    categories: ['Standard Rooms', 'Deluxe Rooms', 'Suites', 'Services', 'Experiences'],
    sampleItems: [
      {
        name: 'Standard Queen Room',
        description: 'Comfortable room with queen bed, WiFi, and city view',
        pricePerNight: 149,
        category: 'Standard Rooms',
        maxOccupancy: 2,
        amenities: ['WiFi', 'TV', 'Mini-fridge', 'Coffee Maker', 'City View'],
        rooms: [
          { roomNumber: '101', status: 'available' },
          { roomNumber: '102', status: 'available' },
          { roomNumber: '103', status: 'available' },
          { roomNumber: '201', status: 'available' },
          { roomNumber: '202', status: 'available' },
        ],
      },
      {
        name: 'Deluxe King Room',
        description: 'Spacious room with king bed, work desk, and premium amenities',
        pricePerNight: 199,
        category: 'Deluxe Rooms',
        maxOccupancy: 2,
        amenities: ['WiFi', 'Smart TV', 'Mini-bar', 'Coffee Maker', 'Work Desk', 'Premium Bedding'],
        rooms: [
          { roomNumber: '301', status: 'available' },
          { roomNumber: '302', status: 'available' },
          { roomNumber: '303', status: 'available' },
        ],
      },
      {
        name: 'Ocean View Suite',
        description: 'Luxury suite with ocean view, separate living area, and balcony',
        pricePerNight: 399,
        category: 'Suites',
        maxOccupancy: 4,
        amenities: ['WiFi', 'Smart TV', 'Mini-bar', 'Kitchenette', 'Balcony', 'Ocean View', 'Living Area', 'Premium Bedding'],
        rooms: [
          { roomNumber: 'Suite 1', status: 'available' },
          { roomNumber: 'Suite 2', status: 'available' },
        ],
      },
      {
        name: 'Spa Package',
        description: 'Full body massage and facial treatment',
        basePrice: 89,
        category: 'Services',
        stockQty: -1,
      },
      {
        name: 'Airport Shuttle',
        description: 'Round-trip airport transportation',
        basePrice: 25,
        category: 'Services',
        stockQty: -1,
      },
    ],
    analyticsConfig: {
      kpis: ['Occupancy Rate', 'RevPAR', 'Average Length of Stay', 'Room Type Popularity'],
      metrics: ['Booking Trends', 'Housekeeping Efficiency', 'Revenue by Room Type', 'Seasonal Patterns'],
    },
  },

  freelancer: {
    id: 'freelancer',
    name: 'Freelancer & Services',
    description: 'Service packages with flexible pricing and deliverables',
    appDescription: 'Service Business Manager for Invoicing, Project Tracking, and Client Retainers.',
    icon: '◈',
    theme: {
      primaryColor: '#7C3AED',
      secondaryColor: '#F59E0B',
      accentColor: '#10B981',
      fontFamily: 'Space Grotesk, Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif',
      arrangement: 'featured_first',
    },
    categories: ['Design', 'Development', 'Writing', 'Marketing', 'Consulting', 'Photography', 'Video'],
    sampleItems: [
      {
        name: 'Logo Design Package',
        description: 'Professional logo design with multiple concepts and revisions',
        category: 'Design',
        pricing: { type: 'project', amount: 499 },
        deliveryTime: '5-7 days',
        revisionsIncluded: 3,
        skillLevel: 'Expert',
        deliverables: ['3 Initial Concepts', 'Vector Files (AI, EPS)', 'PNG & JPG Files', 'Brand Guidelines PDF'],
        addOns: [
          { id: 'brand-guide', name: 'Extended Brand Guide', price: 199, description: 'Complete brand identity guidelines' },
          { id: 'social-kit', name: 'Social Media Kit', price: 149, description: 'Templates for all social platforms' },
        ],
      },
      {
        name: 'Website Development',
        description: 'Custom responsive website built with modern technologies',
        category: 'Development',
        pricing: { type: 'project', amount: 2999 },
        deliveryTime: '2-3 weeks',
        revisionsIncluded: 2,
        skillLevel: 'Expert',
        deliverables: ['Responsive Design', 'CMS Integration', 'SEO Optimization', 'Performance Optimization', 'Documentation'],
        requirements: ['Content provided by client', 'Brand assets', 'Hosting account access'],
        addOns: [
          { id: 'ecommerce', name: 'E-commerce Integration', price: 999, description: 'Full shopping cart functionality' },
          { id: 'maintenance', name: 'Monthly Maintenance', price: 299, description: 'Updates and support' },
        ],
      },
      {
        name: 'Social Media Management',
        description: 'Complete social media management across all platforms',
        category: 'Marketing',
        pricing: { type: 'retainer', amount: 899, billingCycle: 'monthly' },
        deliveryTime: 'Ongoing',
        revisionsIncluded: 0,
        skillLevel: 'Expert',
        deliverables: ['Content Calendar', 'Daily Posts', 'Engagement Management', 'Monthly Analytics Report'],
      },
      {
        name: 'Hourly Consulting',
        description: 'Expert consultation on business strategy and growth',
        category: 'Consulting',
        pricing: { type: 'hourly', amount: 150, minHours: 2 },
        deliveryTime: 'Flexible scheduling',
        revisionsIncluded: 0,
        skillLevel: 'Specialist',
        addOns: [
          { id: 'recording', name: 'Session Recording', price: 50, description: 'Video recording of consultation' },
          { id: 'summary', name: 'Written Summary', price: 75, description: 'Detailed notes and action items' },
        ],
      },
      {
        name: 'Professional Headshots',
        description: 'Professional photography session with retouching',
        category: 'Photography',
        pricing: { type: 'package', amount: 199 },
        deliveryTime: '3-5 days',
        revisionsIncluded: 1,
        skillLevel: 'Expert',
        deliverables: ['30-minute session', '5 retouched images', 'High-resolution files', 'Print release'],
      },
    ],
    analyticsConfig: {
      kpis: ['Project Completion Rate', 'Average Project Value', 'Repeat Client Rate', 'Service Mix'],
      metrics: ['Revenue by Service Type', 'Delivery Time Performance', 'Add-on Conversion', 'Client Satisfaction'],
    },
  },

  publishing: {
    id: 'publishing',
    name: 'Publishing & Bookstore',
    description: 'Digital books, series management, and author tools',
    appDescription: "Digital Bookstore & Writer's Workshop with Manuscript Management and Reader Integration.",
    icon: '📖',
    theme: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      accentColor: '#0EA5E9',
      fontFamily: 'Crimson Pro, Georgia, Times New Roman, serif',
      arrangement: 'featured_first',
    },
    categories: ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Romance', 'Mystery', 'Educational', 'Comics'],
    sampleItems: [
      {
        name: 'The Neon Horizon',
        description: 'A cyberpunk thriller set in the underbelly of Neo-Tokyo.',
        basePrice: 14.99,
        category: 'Sci-Fi',
        author: 'Kaelo Ryker',
        pages: 342,
        language: 'English',
        format: 'pdf',
        drmEnabled: true,
        series: { name: 'The Neon Saga', order: 1 },
        contentDisclosures: { adult: false, violence: true, aiGenerated: false },
      },
      {
        name: 'Echoes of the Void',
        description: 'Deep space exploration goes wrong when the crew discovers they are not alone.',
        basePrice: 9.99,
        category: 'Sci-Fi',
        author: 'Elena Vance',
        pages: 280,
        language: 'English',
        format: 'pdf',
        drmEnabled: false,
        contentDisclosures: { adult: false, violence: true, aiGenerated: false },
      },
      {
        name: 'Algorithmic Soul',
        description: 'Can an AI truly fall in love? A philosophical journey into the machine mind.',
        basePrice: 12.50,
        category: 'Non-Fiction',
        author: 'Dr. Aris Thorne',
        pages: 415,
        language: 'English',
        format: 'pdf',
        drmEnabled: true,
        contentDisclosures: { adult: false, violence: false, aiGenerated: true },
      },
      {
        name: 'Shadows of Aethoria',
        description: 'An epic fantasy involving dragons, magic, and a betrayal that shook the kingdom.',
        basePrice: 19.99,
        category: 'Fantasy',
        author: 'Lianna Frost',
        pages: 560,
        language: 'English',
        format: 'pdf',
        drmEnabled: true,
        series: { name: 'Chronicles of Aethoria', order: 1 },
        contentDisclosures: { adult: false, violence: true, aiGenerated: false },
      },
      {
        name: 'Quantum Cooking',
        description: 'Recipes that transcend space and time. Literally.',
        basePrice: 24.99,
        category: 'Educational',
        author: 'Chef X',
        pages: 120,
        language: 'English',
        format: 'pdf',
        drmEnabled: false,
        contentDisclosures: { adult: false, violence: false, aiGenerated: false },
      },
    ],
    analyticsConfig: {
      kpis: ['Total Readers', 'Books Sold', 'Series Completion Rate', 'Avg Reading Time'],
      metrics: ['Genre Popularity', 'Pre-order Conversions', 'Reader Retention', 'Review Sentiment'],
    },
  },
};

export function getIndustryPack(type: IndustryPackType): IndustryPack | null {
  return INDUSTRY_PACKS[type] || null;
}

export function getAllIndustryPacks(): IndustryPack[] {
  return Object.values(INDUSTRY_PACKS);
}
