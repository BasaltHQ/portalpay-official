/**
 * Industry Item Detail Component
 * 
 * This file re-exports the modular IndustryItemDetail component from the
 * industry/ folder. The component has been split into separate files for
 * better maintainability:
 * 
 * - industry/shared.tsx - Shared helper components
 * - industry/RestaurantModifierSelector.tsx - Toast-like modifier selection
 * - industry/RetailVariantSelector.tsx - Product variant selection
 * - industry/HotelBookingWidget.tsx - Room booking with dates and add-ons
 * - industry/FreelancerServiceConfig.tsx - Service configuration
 * - industry/IndustryItemDetail.tsx - Main wrapper component
 * 
 * @see src/components/shop/industry/ for individual component files
 */

// Re-export everything from the industry folder for backwards compatibility
export * from "./industry";
export { IndustryItemDetail } from "./industry";
export { type AddToCartConfig } from "./industry";
