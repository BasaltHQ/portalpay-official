/**
 * Industry-Specific Inventory Types
 * 
 * This file defines comprehensive types for inventory items across different industry packs.
 * Each industry has specialized attributes that extend the base inventory item.
 */

import type { IndustryPackType } from "@/lib/industry-packs";

// Re-export for convenience
export type { IndustryPackType };

// =============================================================================
// BASE INVENTORY ITEM
// =============================================================================

export interface BaseInventoryItem {
  id: string;
  wallet: string;
  sku: string;
  name: string;
  priceUsd: number;
  currency: string;
  stockQty: number;
  category?: string;
  description?: string;
  tags?: string[];
  images?: string[];
  taxable?: boolean;
  costUsd?: number;
  jurisdictionCode?: string;
  industryPack?: IndustryPackType;
  /** If true, this item represents a recurring subscription */
  isSubscription?: boolean;
  /** Links to a subscription plan created in the Subscriptions panel */
  subscriptionPlanId?: string;
  createdAt: number;
  updatedAt: number;
  attributes?: IndustryAttributes;
}

// =============================================================================
// RESTAURANT INDUSTRY (Toast-like POS)
// =============================================================================

/**
 * Modifier - Individual customization option (like Toast)
 * Examples: "Extra Cheese", "No Onions", "Add Bacon"
 */
export interface RestaurantModifier {
  id: string;
  name: string;
  /** Price adjustment - positive for upcharge, negative for discount, 0 for no change */
  priceAdjustment: number;
  /** Whether this modifier is selected by default */
  default?: boolean;
  /** Whether this modifier is currently available */
  available?: boolean;
  /** Optional nested modifiers (for complex items) */
  nestedModifiers?: RestaurantModifier[];
  /** Sort order for display */
  sortOrder?: number;
}

/**
 * Modifier Group - Collection of related modifiers (like Toast's modifier groups)
 * Examples: "Size", "Protein", "Toppings", "Dressing", "Sides"
 */
export interface RestaurantModifierGroup {
  id: string;
  name: string;
  /** Whether a selection is required before adding to cart */
  required: boolean;
  /** Minimum number of selections (0 for optional groups) */
  minSelect?: number;
  /** Maximum number of selections (undefined = unlimited) */
  maxSelect?: number;
  /** Selection type for UI rendering */
  selectionType?: 'single' | 'multiple' | 'quantity';
  /** The modifiers in this group */
  modifiers: RestaurantModifier[];
  /** Sort order for display */
  sortOrder?: number;
}

/**
 * Restaurant Item Attributes - Full menu item configuration
 * Modeled after Toast POS menu structure
 */
export interface RestaurantItemAttributes {
  /** Modifier groups for customization */
  modifierGroups?: RestaurantModifierGroup[];
  /** Dietary tags for filtering and display */
  dietaryTags?: ('Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Dairy-Free' | 'Nut-Free' | 'Halal' | 'Kosher' | 'Organic' | string)[];
  /** Spice level 0-5 (0 = not spicy, 5 = extremely spicy) */
  spiceLevel?: number;
  /** Estimated preparation time */
  prepTime?: string;
  /** Calorie count */
  calories?: number;
  /** Ingredients list (for allergen info) */
  ingredients?: string;
  /** Allergen warnings */
  allergens?: string[];
  /** Whether this item can be made vegan/vegetarian on request */
  canBeModifiedFor?: ('vegetarian' | 'vegan' | 'gluten-free')[];
  /** Menu section for kitchen display */
  menuSection?: string;
  /** Printer routing for kitchen display system */
  printerGroup?: string;
  /** Course type for multi-course meals */
  courseType?: 'appetizer' | 'entree' | 'side' | 'dessert' | 'beverage';
  /** Whether item is available for online ordering */
  onlineOrderingEnabled?: boolean;
  /** Special time-based availability */
  availability?: {
    dayParts?: ('breakfast' | 'lunch' | 'dinner' | 'late-night')[];
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    startTime?: string; // HH:MM format
    endTime?: string; // HH:MM format
  };
  /** Nutritional information */
  nutrition?: {
    servingSize?: string;
    calories?: number;
    totalFat?: number;
    saturatedFat?: number;
    transFat?: number;
    cholesterol?: number;
    sodium?: number;
    totalCarbs?: number;
    dietaryFiber?: number;
    sugars?: number;
    protein?: number;
  };
}

// =============================================================================
// RETAIL INDUSTRY
// =============================================================================

/**
 * Variation Group - Product variations like Size, Color, Material
 */
export interface RetailVariationGroup {
  id: string;
  name: string;
  /** 'preset' uses predefined values, 'custom' allows freeform input */
  type: 'preset' | 'custom';
  /** Whether a selection is required */
  required: boolean;
  /** Available values for preset type */
  values: string[];
  /** Price adjustments per value */
  priceAdjustments?: Record<string, number>;
  /** Sort order for display */
  sortOrder?: number;
  /** Whether to show as swatches (for colors) or dropdown */
  displayType?: 'dropdown' | 'swatch' | 'button';
}

/**
 * Product Variant - Specific combination of variations with inventory tracking
 */
export interface RetailProductVariant {
  id: string;
  /** Unique SKU for this variant */
  sku: string;
  /** Variation attribute values */
  attributes: Record<string, string>;
  /** Price adjustment from base price */
  priceAdjustment: number;
  /** Specific stock quantity for this variant */
  stockQty: number;
  /** Variant-specific images */
  images?: string[];
  /** Barcode/UPC for this variant */
  barcode?: string;
  /** Weight for shipping calculations */
  weight?: number;
  /** Dimensions for shipping */
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: 'in' | 'cm';
  };
}

/**
 * Retail Item Attributes - Full product configuration
 */
export interface RetailItemAttributes {
  /** Variation groups for product customization */
  variationGroups?: RetailVariationGroup[];
  /** Pre-generated variants with inventory */
  variants?: RetailProductVariant[];
  /** Brand name */
  brand?: string;
  /** Manufacturer */
  manufacturer?: string;
  /** Model number */
  modelNumber?: string;
  /** Material composition */
  materials?: string[];
  /** Care instructions */
  careInstructions?: string;
  /** Country of origin */
  countryOfOrigin?: string;
  /** Warranty information */
  warranty?: {
    duration?: string;
    type?: string;
    description?: string;
  };
  /** Size chart reference */
  sizeChart?: {
    type?: 'clothing' | 'shoes' | 'accessories' | 'custom';
    unit?: string;
    chart?: Record<string, Record<string, string>>;
  };
  /** Return policy override */
  returnPolicy?: {
    returnable?: boolean;
    returnWindow?: number; // days
    conditions?: string;
  };
}

// =============================================================================
// HOTEL INDUSTRY
// =============================================================================

/**
 * Room Status - Current state of a hotel room
 */
export type HotelRoomStatus = 'available' | 'occupied' | 'housekeeping' | 'maintenance' | 'out-of-order' | 'reserved';

/**
 * Hotel Room - Individual room instance
 */
export interface HotelRoom {
  id: string;
  /** Room number or identifier */
  roomNumber: string;
  /** Reference to the room type */
  typeId: string;
  /** Current room status */
  status: HotelRoomStatus;
  /** Current or upcoming booking */
  currentBooking?: {
    guestWallet: string;
    guestName?: string;
    checkIn: number; // timestamp
    checkOut: number; // timestamp
    receiptId: string;
    specialRequests?: string;
    numberOfGuests?: number;
  };
  /** Timestamp of last status change */
  lastStatusChange: number;
  /** Room-specific notes */
  notes?: string;
  /** Floor number */
  floor?: number;
  /** View type */
  view?: 'ocean' | 'city' | 'garden' | 'pool' | 'mountain' | 'none';
  /** Connecting room numbers */
  connectingRooms?: string[];
  /** Accessibility features */
  accessibilityFeatures?: string[];
  /** Last cleaned timestamp */
  lastCleaned?: number;
  /** Housekeeping priority */
  housekeepingPriority?: 'normal' | 'high' | 'rush';
}

/**
 * Hotel Room Type Attributes - Room category configuration
 */
export interface HotelRoomTypeAttributes {
  /** Individual room instances */
  rooms?: HotelRoom[];
  /** Maximum occupancy (adults) */
  maxOccupancy: number;
  /** Maximum children */
  maxChildren?: number;
  /** Price per night (stored in priceUsd for base) */
  pricePerNight?: number;
  /** Room amenities */
  amenities?: string[];
  /** Bed configuration */
  bedConfiguration?: {
    type: 'king' | 'queen' | 'double' | 'twin' | 'single' | 'sofa-bed' | 'bunk';
    count: number;
  }[];
  /** Room size */
  roomSize?: {
    value: number;
    unit: 'sqft' | 'sqm';
  };
  /** Bathroom details */
  bathroom?: {
    type: 'full' | 'half' | 'shared';
    count: number;
    features?: string[];
  };
  /** Cancellation policy */
  cancellationPolicy?: {
    freeCancellationBefore?: number; // hours before check-in
    penaltyPercentage?: number;
    description?: string;
  };
  /** Check-in/check-out times */
  checkInTime?: string; // HH:MM format
  checkOutTime?: string; // HH:MM format
  /** Minimum/maximum stay */
  minNights?: number;
  maxNights?: number;
  /** Seasonal pricing adjustments */
  seasonalPricing?: {
    name: string;
    startDate: string; // MM-DD format
    endDate: string; // MM-DD format
    priceMultiplier: number;
  }[];
  /** Add-on services for this room type */
  availableAddOns?: {
    id: string;
    name: string;
    price: number;
    description?: string;
    perNight?: boolean;
  }[];
}

// =============================================================================
// FREELANCER/SERVICES INDUSTRY
// =============================================================================

/**
 * Service Pricing - How the service is priced
 */
export interface FreelancerServicePricing {
  /** Pricing model */
  type: 'hourly' | 'project' | 'package' | 'retainer' | 'milestone';
  /** Base amount (hourly rate, project price, etc.) */
  amount: number;
  /** Minimum hours for hourly pricing */
  minHours?: number;
  /** Maximum hours before project pricing kicks in */
  maxHours?: number;
  /** Billing cycle for retainers */
  billingCycle?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  /** Rush pricing multiplier */
  rushMultiplier?: number;
  /** Deposit percentage required */
  depositPercentage?: number;
}

/**
 * Service Add-On - Optional upgrades
 */
export interface FreelancerServiceAddOn {
  id: string;
  name: string;
  price: number;
  description?: string;
  /** Whether this is a one-time or recurring add-on */
  recurring?: boolean;
  /** Estimated additional time */
  additionalTime?: string;
}

/**
 * Milestone - Project milestones for milestone-based pricing
 */
export interface FreelancerMilestone {
  id: string;
  name: string;
  description?: string;
  /** Percentage of total price */
  percentage: number;
  /** Deliverables for this milestone */
  deliverables?: string[];
  /** Estimated duration */
  duration?: string;
}

/**
 * Freelancer Service Attributes - Full service configuration
 */
export interface FreelancerServiceAttributes {
  /** Pricing configuration */
  pricing: FreelancerServicePricing;
  /** Estimated delivery time */
  deliveryTime: string;
  /** Number of revisions included */
  revisionsIncluded: number;
  /** Additional revisions pricing */
  additionalRevisionPrice?: number;
  /** Service category */
  serviceCategory: string;
  /** Skill/expertise level */
  skillLevel: 'beginner' | 'intermediate' | 'expert' | 'specialist';
  /** What's included */
  deliverables?: string[];
  /** What the client needs to provide */
  requirements?: string[];
  /** Optional add-ons */
  addOns?: FreelancerServiceAddOn[];
  /** Project milestones (for milestone pricing) */
  milestones?: FreelancerMilestone[];
  /** Portfolio examples */
  portfolioItems?: {
    title: string;
    description?: string;
    imageUrl?: string;
    link?: string;
  }[];
  /** Tools/software used */
  toolsUsed?: string[];
  /** Languages supported */
  languages?: string[];
  /** Working hours/timezone */
  availability?: {
    timezone?: string;
    workingHours?: {
      start: string; // HH:MM
      end: string; // HH:MM
    };
    workingDays?: number[]; // 0-6, Sunday = 0
    responseTime?: string;
  };
  /** Terms and conditions */
  terms?: {
    cancellationPolicy?: string;
    refundPolicy?: string;
    copyrightTransfer?: boolean;
    ndaRequired?: boolean;
  };
}

// =============================================================================
// PUBLISHER INDUSTRY
// =============================================================================

/**
 * Publishing Format - The physical or digital format of the book
 */
export type PublishingFormat =
  | 'Hardcover'
  | 'Paperback'
  | 'Ebook'
  | 'Audiobook'
  | 'Magazine'
  | 'Journal'
  | 'Other';

/**
 * Book Condition - Used for physical books
 */
export type BookCondition =
  | 'New'
  | 'Like New'
  | 'Very Good'
  | 'Good'
  | 'Acceptable';

export interface PublishingItemAttributes {
  /** Book Title (often matches item name, but can be distinct) */
  title?: string;
  /** Author(s) */
  author?: string;
  /** Publisher Name */
  publisher?: string;
  /** ISBN-13 or ISBN-10 */
  isbn?: string;
  /** Publication Date */
  publicationDate?: string;
  /** Format (Hardcover, Paperback, etc.) */
  format?: PublishingFormat;
  /** Number of Pages */
  pageCount?: number;
  /** Language (ISO code or name) */
  language?: string;
  /** Edition (1st, 2nd, etc.) */
  edition?: string;
  /** Dimensions */
  dimensions?: {
    height?: number;
    width?: number;
    depth?: number;
    unit?: 'in' | 'cm';
  };
  /** Weight */
  weight?: number;
  /** Genre or Topic */
  genre?: string[];
  /** Condition (if selling used books) */
  condition?: BookCondition;
  /** Digital Download URL (for eBooks) */
  downloadUrl?: string;
  /** Preview URL (e.g., Google Books or first chapter) */
  previewUrl?: string;
  /** Whether DRM is enabled */
  drmEnabled?: boolean;
}

// =============================================================================
// UNION TYPES
// =============================================================================

/**
 * Industry-specific attributes union type
 * The attributes field on an inventory item will contain one of these based on industryPack
 */
export type IndustryAttributes =
  | { type: 'restaurant'; data: RestaurantItemAttributes }
  | { type: 'retail'; data: RetailItemAttributes }
  | { type: 'hotel'; data: HotelRoomTypeAttributes }
  | { type: 'freelancer'; data: FreelancerServiceAttributes }
  | { type: 'publishing'; data: PublishingItemAttributes }
  | { type: 'general'; data: Record<string, unknown> };

/**
 * Full inventory item with industry-specific attributes
 */
export interface InventoryItem extends BaseInventoryItem {
  attributes?: IndustryAttributes;
}

// =============================================================================
// CART ITEM WITH SELECTIONS
// =============================================================================

/**
 * Selected modifier for cart items
 */
export interface SelectedModifier {
  groupId: string;
  modifierId: string;
  name: string;
  priceAdjustment: number;
  quantity?: number; // for quantity-based modifiers
}

/**
 * Selected variant for cart items
 */
export interface SelectedVariant {
  variantId: string;
  sku: string;
  attributes: Record<string, string>;
  priceAdjustment: number;
}

/**
 * Cart item with selections
 */
export interface CartItem {
  itemId: string;
  quantity: number;
  /** Selected modifiers (restaurant) */
  selectedModifiers?: SelectedModifier[];
  /** Selected variant (retail) */
  selectedVariant?: SelectedVariant;
  /** Hotel booking details */
  bookingDetails?: {
    checkIn: number;
    checkOut: number;
    numberOfGuests: number;
    numberOfNights: number;
    roomNumber?: string;
    selectedAddOns?: string[];
    specialRequests?: string;
  };
  /** Freelancer service details */
  serviceDetails?: {
    selectedAddOns?: string[];
    projectDescription?: string;
    preferredDeliveryDate?: number;
    attachments?: string[];
  };
  /** Special instructions */
  specialInstructions?: string;
  /** Calculated line total (base + adjustments) */
  lineTotal: number;
}

// =============================================================================
// HELPER FUNCTIONS TYPE GUARDS
// =============================================================================

export function isRestaurantAttributes(attrs: IndustryAttributes | undefined): attrs is { type: 'restaurant'; data: RestaurantItemAttributes } {
  return attrs?.type === 'restaurant';
}

export function isRetailAttributes(attrs: IndustryAttributes | undefined): attrs is { type: 'retail'; data: RetailItemAttributes } {
  return attrs?.type === 'retail';
}

export function isHotelAttributes(attrs: IndustryAttributes | undefined): attrs is { type: 'hotel'; data: HotelRoomTypeAttributes } {
  return attrs?.type === 'hotel';
}

export function isFreelancerAttributes(attrs: IndustryAttributes | undefined): attrs is { type: 'freelancer'; data: FreelancerServiceAttributes } {
  return attrs?.type === 'freelancer';
}

export function isPublishingAttributes(attrs: IndustryAttributes | undefined): attrs is { type: 'publishing'; data: PublishingItemAttributes } {
  return attrs?.type === 'publishing';
}

/**
 * Calculate total price with modifiers (restaurant)
 */
export function calculateRestaurantItemTotal(
  basePrice: number,
  selectedModifiers: SelectedModifier[],
  quantity: number = 1
): number {
  const modifierTotal = selectedModifiers.reduce((sum, mod) => sum + (mod.priceAdjustment * (mod.quantity || 1)), 0);
  return (basePrice + modifierTotal) * quantity;
}

/**
 * Calculate total price with variant (retail)
 */
export function calculateRetailItemTotal(
  basePrice: number,
  selectedVariant: SelectedVariant | undefined,
  quantity: number = 1
): number {
  const adjustment = selectedVariant?.priceAdjustment || 0;
  return (basePrice + adjustment) * quantity;
}

/**
 * Calculate hotel booking total
 */
export function calculateHotelBookingTotal(
  pricePerNight: number,
  numberOfNights: number,
  selectedAddOns: { price: number; perNight?: boolean }[] = [],
  seasonalMultiplier: number = 1
): number {
  const roomTotal = pricePerNight * numberOfNights * seasonalMultiplier;
  const addOnsTotal = selectedAddOns.reduce((sum, addOn) => {
    return sum + (addOn.perNight ? addOn.price * numberOfNights : addOn.price);
  }, 0);
  return roomTotal + addOnsTotal;
}

/**
 * Calculate freelancer service total
 */
export function calculateFreelancerServiceTotal(
  pricing: FreelancerServicePricing,
  selectedAddOns: FreelancerServiceAddOn[] = [],
  hours?: number,
  isRush?: boolean
): number {
  let baseTotal: number;

  switch (pricing.type) {
    case 'hourly':
      const actualHours = Math.max(hours || pricing.minHours || 1, pricing.minHours || 1);
      baseTotal = pricing.amount * actualHours;
      break;
    case 'project':
    case 'package':
    case 'milestone':
      baseTotal = pricing.amount;
      break;
    case 'retainer':
      baseTotal = pricing.amount; // Monthly rate
      break;
    default:
      baseTotal = pricing.amount;
  }

  if (isRush && pricing.rushMultiplier) {
    baseTotal *= pricing.rushMultiplier;
  }

  const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);

  return baseTotal + addOnsTotal;
}
