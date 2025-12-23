/**
 * Industry Pack Components
 * 
 * Each industry pack has its own specialized components for item configuration.
 * Import from this index for a unified API.
 */

// Shared types and helpers
export * from './shared';

// Restaurant Pack (Toast-like modifiers)
export { RestaurantModifierSelector } from './RestaurantModifierSelector';

// Retail Pack (Product variants)
export { RetailVariantSelector } from './RetailVariantSelector';

// Hotel Pack (Room booking)
export { HotelBookingWidget } from './HotelBookingWidget';

// Freelancer Pack (Service configuration)
export { FreelancerServiceConfig } from './FreelancerServiceConfig';

// Main industry item detail component
export { IndustryItemDetail, type AddToCartConfig } from './IndustryItemDetail';
