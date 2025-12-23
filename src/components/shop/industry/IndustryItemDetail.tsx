"use client";

/**
 * Industry Item Detail Component
 * 
 * Main wrapper component that renders the appropriate industry-specific
 * configuration UI based on the item's industry pack type.
 * 
 * Supports:
 * - Restaurant: Toast-like modifier selection
 * - Retail: Product variant selection
 * - Hotel: Room booking with dates and add-ons
 * - Freelancer: Service configuration with pricing options
 * - General: Basic item display
 */

import React, { useState, useMemo, useCallback } from "react";
import { X, ShoppingCart, Plus, Minus, Image as ImageIcon } from "lucide-react";
import type { IndustryPackType } from "@/lib/industry-packs";
import {
  RestaurantItemAttributes,
  RestaurantModifierGroup,
  RetailItemAttributes,
  RetailVariationGroup,
  RetailProductVariant,
  HotelRoomTypeAttributes,
  FreelancerServiceAttributes,
  SelectedModifier,
  SelectedVariant,
  isRestaurantAttributes,
  isRetailAttributes,
  isHotelAttributes,
  isFreelancerAttributes,
  calculateRestaurantItemTotal,
  calculateRetailItemTotal,
} from "@/types/inventory";
import { AddToCartConfig } from "./shared";
import { 
  RestaurantModifierSelector, 
  getDefaultModifierSelections,
  validateRestaurantModifiers,
} from "./RestaurantModifierSelector";
import { 
  RetailVariantSelector, 
  validateRetailVariants,
  buildSelectedVariant,
} from "./RetailVariantSelector";
import { HotelBookingWidget, HotelBookingDetails, validateHotelBooking } from "./HotelBookingWidget";
import { FreelancerServiceConfig, FreelancerServiceDetails, validateFreelancerService } from "./FreelancerServiceConfig";
import { QuantitySelector } from "./shared";

// Re-export AddToCartConfig for consumers
export type { AddToCartConfig };

// =============================================================================
// TYPES
// =============================================================================

interface IndustryItemDetailProps {
  /** The item to display */
  item: {
    id: string;
    name: string;
    description?: string;
    priceUsd: number;
    images?: string[];
    industryPack?: IndustryPackType;
    attributes?: any; // Will be cast based on industryPack
  };
  /** Primary brand color */
  primaryColor?: string;
  /** Secondary brand color */
  secondaryColor?: string;
  /** Callback when item is added to cart */
  onAddToCart: (config: AddToCartConfig) => void;
  /** Callback to close the detail view */
  onClose?: () => void;
  /** Whether to show in modal mode */
  isModal?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseAttributes<T>(item: IndustryItemDetailProps['item']): T | undefined {
  if (!item.attributes) return undefined;
  
  // Handle typed attributes format
  if (item.attributes.type && item.attributes.data) {
    return item.attributes.data as T;
  }
  
  // Handle raw attributes
  return item.attributes as T;
}

// =============================================================================
// IMAGE COVER HEADER COMPONENT
// =============================================================================

interface ImageCoverHeaderProps {
  images?: string[];
  name: string;
  price: number;
  priceSuffix?: string;
  primaryColor?: string;
  onClose?: () => void;
}

function ImageCoverHeader({ images, name, price, priceSuffix, primaryColor, onClose }: ImageCoverHeaderProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const accentColor = primaryColor || '#0ea5e9';
  const hasImage = images && images.length > 0;
  
  return (
    <div className="relative flex-shrink-0">
      {/* Cover image or placeholder */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {hasImage ? (
          <img
            src={images[selectedIndex]}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {/* Item name and price overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">{name}</h2>
          <div className="mt-1 flex items-baseline gap-1">
            <span 
              className="text-2xl font-bold drop-shadow-lg"
              style={{ color: accentColor }}
            >
              ${price.toFixed(2)}
            </span>
            {priceSuffix && (
              <span className="text-sm text-white/80">{priceSuffix}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Thumbnail strip for multiple images */}
      {hasImage && images.length > 1 && (
        <div className="flex gap-1.5 p-2 bg-muted/50 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`w-12 h-12 rounded overflow-hidden shrink-0 border-2 transition-all ${
                i === selectedIndex ? '' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              style={i === selectedIndex ? { borderColor: accentColor } : {}}
            >
              <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// GENERAL ITEM COMPONENT (for non-specific industry packs)
// =============================================================================

interface GeneralItemProps {
  item: IndustryItemDetailProps['item'];
  quantity: number;
  onQuantityChange: (qty: number) => void;
}

function GeneralItem({ item, quantity, onQuantityChange }: GeneralItemProps) {
  return (
    <div className="space-y-4">
      {item.description && (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      )}
      
      <div>
        <label className="text-sm font-medium mb-2 block">Quantity</label>
        <QuantitySelector
          value={quantity}
          min={1}
          onChange={onQuantityChange}
        />
      </div>
      
      <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
        <span className="text-sm font-medium">Total</span>
        <span className="text-lg font-bold">${(item.priceUsd * quantity).toFixed(2)}</span>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function IndustryItemDetail({
  item,
  primaryColor,
  secondaryColor,
  onAddToCart,
  onClose,
  isModal = true,
}: IndustryItemDetailProps) {
  const accentColor = primaryColor || '#0ea5e9';
  
  // State for different industry types
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [selectedVariantAttrs, setSelectedVariantAttrs] = useState<Record<string, string>>({});
  const [bookingDetails, setBookingDetails] = useState<HotelBookingDetails | null>(null);
  const [serviceDetails, setServiceDetails] = useState<FreelancerServiceDetails | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Parse attributes based on industry pack
  const restaurantAttrs = useMemo(() => {
    if (item.industryPack === 'restaurant') {
      return parseAttributes<RestaurantItemAttributes>(item);
    }
    return undefined;
  }, [item]);
  
  const retailAttrs = useMemo(() => {
    if (item.industryPack === 'retail') {
      return parseAttributes<RetailItemAttributes>(item);
    }
    return undefined;
  }, [item]);
  
  const hotelAttrs = useMemo(() => {
    if (item.industryPack === 'hotel') {
      return parseAttributes<HotelRoomTypeAttributes>(item);
    }
    return undefined;
  }, [item]);
  
  const freelancerAttrs = useMemo(() => {
    if (item.industryPack === 'freelancer') {
      return parseAttributes<FreelancerServiceAttributes>(item);
    }
    return undefined;
  }, [item]);
  
  // Initialize default modifiers for restaurant
  React.useEffect(() => {
    if (restaurantAttrs?.modifierGroups) {
      const defaults = getDefaultModifierSelections(restaurantAttrs.modifierGroups);
      setSelectedModifiers(defaults);
    }
  }, [restaurantAttrs]);
  
  // Calculate line total based on industry pack
  const lineTotal = useMemo(() => {
    switch (item.industryPack) {
      case 'restaurant':
        return calculateRestaurantItemTotal(item.priceUsd, selectedModifiers, quantity);
      
      case 'retail': {
        const variant = retailAttrs?.variants?.find(v => 
          Object.entries(selectedVariantAttrs).every(
            ([key, value]) => v.attributes[key] === value
          )
        );
        const selectedVariant = variant ? {
          variantId: variant.id,
          sku: variant.sku,
          attributes: selectedVariantAttrs,
          priceAdjustment: variant.priceAdjustment,
        } : buildSelectedVariant(selectedVariantAttrs, undefined, retailAttrs?.variationGroups);
        return calculateRetailItemTotal(item.priceUsd, selectedVariant, quantity);
      }
      
      case 'hotel':
        return bookingDetails?.total || item.priceUsd;
      
      case 'freelancer':
        return serviceDetails?.total || item.priceUsd;
      
      default:
        return item.priceUsd * quantity;
    }
  }, [item, selectedModifiers, selectedVariantAttrs, bookingDetails, serviceDetails, quantity, retailAttrs]);
  
  // Validate based on industry pack
  const { valid: isValid, errors } = useMemo(() => {
    switch (item.industryPack) {
      case 'restaurant':
        if (restaurantAttrs?.modifierGroups) {
          return validateRestaurantModifiers(restaurantAttrs.modifierGroups, selectedModifiers);
        }
        return { valid: true, errors: {} };
      
      case 'retail':
        if (retailAttrs?.variationGroups) {
          return validateRetailVariants(
            retailAttrs.variationGroups,
            selectedVariantAttrs,
            retailAttrs.variants
          );
        }
        return { valid: true, errors: {} };
      
      case 'hotel':
        if (hotelAttrs) {
          if (!bookingDetails) {
            return { valid: false, errors: { booking: 'Please select dates' } };
          }
          return validateHotelBooking(hotelAttrs, bookingDetails);
        }
        return { valid: true, errors: {} };
      
      case 'freelancer':
        if (freelancerAttrs) {
          return validateFreelancerService(freelancerAttrs, serviceDetails || {});
        }
        return { valid: true, errors: {} };
      
      default:
        return { valid: true, errors: {} };
    }
  }, [item.industryPack, restaurantAttrs, retailAttrs, hotelAttrs, freelancerAttrs, selectedModifiers, selectedVariantAttrs, bookingDetails, serviceDetails]);
  
  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (!isValid) return;
    
    const config: AddToCartConfig = {
      itemId: item.id,
      quantity,
      lineTotal,
      specialInstructions: specialInstructions || undefined,
    };
    
    switch (item.industryPack) {
      case 'restaurant':
        config.selectedModifiers = selectedModifiers.length > 0 ? selectedModifiers : undefined;
        break;
      
      case 'retail': {
        const variant = retailAttrs?.variants?.find(v => 
          Object.entries(selectedVariantAttrs).every(
            ([key, value]) => v.attributes[key] === value
          )
        );
        config.selectedVariant = buildSelectedVariant(selectedVariantAttrs, variant, retailAttrs?.variationGroups);
        break;
      }
      
      case 'hotel':
        if (bookingDetails) {
          config.bookingDetails = {
            checkIn: bookingDetails.checkIn,
            checkOut: bookingDetails.checkOut,
            numberOfGuests: bookingDetails.numberOfGuests,
            numberOfNights: bookingDetails.numberOfNights,
            roomNumber: bookingDetails.roomNumber,
            selectedAddOns: bookingDetails.selectedAddOns,
            specialRequests: bookingDetails.specialRequests,
          };
        }
        break;
      
      case 'freelancer':
        if (serviceDetails) {
          config.serviceDetails = {
            selectedAddOns: serviceDetails.selectedAddOns,
            projectDescription: serviceDetails.projectDescription,
            preferredDeliveryDate: serviceDetails.preferredDeliveryDate,
          };
        }
        break;
    }
    
    onAddToCart(config);
  }, [item, quantity, lineTotal, specialInstructions, selectedModifiers, selectedVariantAttrs, bookingDetails, serviceDetails, isValid, onAddToCart, retailAttrs]);
  
  // Render industry-specific content
  const renderIndustryContent = () => {
    switch (item.industryPack) {
      case 'restaurant':
        return restaurantAttrs?.modifierGroups && restaurantAttrs.modifierGroups.length > 0 ? (
          <RestaurantModifierSelector
            groups={restaurantAttrs.modifierGroups}
            selectedModifiers={selectedModifiers}
            onSelect={setSelectedModifiers}
            primaryColor={primaryColor}
            itemAttributes={restaurantAttrs}
            basePrice={item.priceUsd}
          />
        ) : (
          <GeneralItem item={item} quantity={quantity} onQuantityChange={setQuantity} />
        );
      
      case 'retail':
        return retailAttrs?.variationGroups && retailAttrs.variationGroups.length > 0 ? (
          <RetailVariantSelector
            variationGroups={retailAttrs.variationGroups}
            variants={retailAttrs.variants}
            selectedAttributes={selectedVariantAttrs}
            onSelect={setSelectedVariantAttrs}
            primaryColor={primaryColor}
            itemAttributes={retailAttrs}
            basePrice={item.priceUsd}
          />
        ) : (
          <GeneralItem item={item} quantity={quantity} onQuantityChange={setQuantity} />
        );
      
      case 'hotel':
        return hotelAttrs ? (
          <HotelBookingWidget
            attributes={hotelAttrs}
            basePrice={item.priceUsd}
            onBookingChange={setBookingDetails}
            primaryColor={primaryColor}
          />
        ) : (
          <GeneralItem item={item} quantity={quantity} onQuantityChange={setQuantity} />
        );
      
      case 'freelancer':
        return freelancerAttrs ? (
          <FreelancerServiceConfig
            attributes={freelancerAttrs}
            basePrice={item.priceUsd}
            onConfigChange={setServiceDetails}
            primaryColor={primaryColor}
          />
        ) : (
          <GeneralItem item={item} quantity={quantity} onQuantityChange={setQuantity} />
        );
      
      default:
        return <GeneralItem item={item} quantity={quantity} onQuantityChange={setQuantity} />;
    }
  };
  
  // Show quantity selector for certain industry types
  const showQuantitySelector = !['hotel', 'freelancer'].includes(item.industryPack || '');
  
  // Generate price suffix based on industry pack
  const priceSuffix = useMemo(() => {
    if (item.industryPack === 'hotel') return '/night';
    if (item.industryPack === 'freelancer' && freelancerAttrs) {
      return `/${freelancerAttrs.pricing.type === 'hourly' ? 'hr' : 'project'}`;
    }
    return undefined;
  }, [item.industryPack, freelancerAttrs]);
  
  const content = (
    <div className="flex flex-col h-full">
      {/* Image Cover Header with Name & Price */}
      <ImageCoverHeader
        images={item.images}
        name={item.name}
        price={item.priceUsd}
        priceSuffix={priceSuffix}
        primaryColor={primaryColor}
        onClose={onClose}
      />
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description (for restaurant and retail) */}
        {item.description && ['restaurant', 'retail', 'general'].includes(item.industryPack || 'general') && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}
        
        {/* Industry-specific content */}
        {renderIndustryContent()}
        
        {/* Quantity selector (for applicable industries) */}
        {showQuantitySelector && (item.industryPack === 'restaurant' || item.industryPack === 'retail') && (
          <div>
            <label className="text-sm font-medium mb-2 block">Quantity</label>
            <QuantitySelector
              value={quantity}
              min={1}
              onChange={setQuantity}
            />
          </div>
        )}
        
        {/* Special instructions (for restaurant) */}
        {item.industryPack === 'restaurant' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Special Instructions</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any allergies or special requests?"
              className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
              rows={2}
            />
          </div>
        )}
      </div>
      
      {/* Footer with Add to Cart button */}
      <div className="p-4 border-t bg-background">
        <button
          onClick={handleAddToCart}
          disabled={!isValid}
          className={`w-full h-12 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
            isValid 
              ? 'hover:opacity-90 active:scale-[0.98]' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          style={{ backgroundColor: isValid ? accentColor : '#9ca3af' }}
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Add to Cart</span>
          <span className="font-bold">${lineTotal.toFixed(2)}</span>
        </button>
        
        {!isValid && Object.keys(errors).length > 0 && (
          <p className="text-xs text-red-500 text-center mt-2">
            {Object.values(errors)[0]}
          </p>
        )}
      </div>
    </div>
  );
  
  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div 
          className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }
  
  return content;
}
