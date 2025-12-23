"use client";

/**
 * Retail Variant Selector Component
 * 
 * Product variation selection UI for retail items.
 * Supports:
 * - Variation groups (Size, Color, Material, etc.)
 * - Swatch display for colors
 * - Button display for sizes
 * - Dropdown display for other variants
 * - Stock availability per variant
 * - Price adjustments per variant
 */

import React, { useMemo, useCallback } from "react";
import { Check, AlertCircle } from "lucide-react";
import {
  RetailVariationGroup,
  RetailProductVariant,
  RetailItemAttributes,
  SelectedVariant,
  calculateRetailItemTotal,
} from "@/types/inventory";
import { SectionCard, SectionHeader } from "./shared";

// =============================================================================
// TYPES
// =============================================================================

export interface RetailVariantSelectorProps {
  /** Variation groups to display */
  variationGroups: RetailVariationGroup[];
  /** Pre-computed variants with inventory */
  variants?: RetailProductVariant[];
  /** Currently selected attributes */
  selectedAttributes: Record<string, string>;
  /** Callback when selection changes */
  onSelect: (attributes: Record<string, string>) => void;
  /** Primary brand color */
  primaryColor?: string;
  /** Item attributes for additional info */
  itemAttributes?: RetailItemAttributes;
  /** Base price for calculations */
  basePrice?: number;
}

// =============================================================================
// COLOR MAP FOR SWATCHES
// =============================================================================

const COLOR_MAP: Record<string, string> = {
  'White': '#ffffff',
  'Black': '#000000',
  'Navy': '#001f3f',
  'Gray': '#808080',
  'Grey': '#808080',
  'Red': '#ef4444',
  'Blue': '#3b82f6',
  'Green': '#22c55e',
  'Pink': '#ec4899',
  'Purple': '#a855f7',
  'Brown': '#92400e',
  'Beige': '#d4b896',
  'Tan': '#d2b48c',
  'Orange': '#f97316',
  'Yellow': '#eab308',
  'Cream': '#fffdd0',
  'Olive': '#808000',
  'Maroon': '#800000',
  'Teal': '#14b8a6',
  'Coral': '#ff7f50',
  'Burgundy': '#800020',
  'Charcoal': '#36454f',
  'Silver': '#c0c0c0',
  'Gold': '#ffd700',
  'Rose Gold': '#b76e79',
};

function getColorValue(colorName: string): string {
  // Check direct mapping
  if (COLOR_MAP[colorName]) return COLOR_MAP[colorName];
  
  // Check case-insensitive
  const lower = colorName.toLowerCase();
  for (const [name, value] of Object.entries(COLOR_MAP)) {
    if (name.toLowerCase() === lower) return value;
  }
  
  // If it looks like a hex code, use it
  if (colorName.startsWith('#')) return colorName;
  
  // Default to a neutral gray
  return '#9ca3af';
}

// =============================================================================
// SWATCH SELECTOR COMPONENT
// =============================================================================

interface SwatchSelectorProps {
  group: RetailVariationGroup;
  selectedValue?: string;
  onSelect: (value: string) => void;
  isValueAvailable: (value: string) => boolean;
  primaryColor?: string;
}

function SwatchSelector({ group, selectedValue, onSelect, isValueAvailable, primaryColor }: SwatchSelectorProps) {
  const accentColor = primaryColor || '#0ea5e9';
  
  return (
    <div className="flex flex-wrap gap-2">
      {group.values.map(value => {
        const isSelected = selectedValue === value;
        const isAvailable = isValueAvailable(value);
        const bgColor = getColorValue(value);
        const isLight = bgColor === '#ffffff' || bgColor === '#fffdd0';
        
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            disabled={!isAvailable}
            className={`relative h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all ${
              !isAvailable ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'
            }`}
            style={{ 
              backgroundColor: bgColor, 
              borderColor: isSelected ? accentColor : (isLight ? '#d1d5db' : bgColor),
              boxShadow: isSelected ? `0 0 0 2px ${accentColor}40` : 'none',
            }}
            title={value}
          >
            {isSelected && (
              <Check className={`h-5 w-5 ${isLight ? 'text-gray-800' : 'text-white'}`} />
            )}
            {!isAvailable && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-gray-400 rotate-45 transform origin-center" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// BUTTON SELECTOR COMPONENT
// =============================================================================

interface ButtonSelectorProps {
  group: RetailVariationGroup;
  selectedValue?: string;
  onSelect: (value: string) => void;
  isValueAvailable: (value: string) => boolean;
  primaryColor?: string;
}

function ButtonSelector({ group, selectedValue, onSelect, isValueAvailable, primaryColor }: ButtonSelectorProps) {
  const accentColor = primaryColor || '#0ea5e9';
  
  return (
    <div className="flex flex-wrap gap-2">
      {group.values.map(value => {
        const isSelected = selectedValue === value;
        const isAvailable = isValueAvailable(value);
        const priceAdj = group.priceAdjustments?.[value];
        
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            disabled={!isAvailable}
            className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition-all ${
              !isAvailable ? 'opacity-30 cursor-not-allowed line-through' : 'hover:bg-muted'
            }`}
            style={{ 
              borderColor: isSelected ? accentColor : '#d1d5db',
              backgroundColor: isSelected ? accentColor : 'transparent',
              color: isSelected ? 'white' : 'inherit',
            }}
          >
            {value}
            {priceAdj !== undefined && priceAdj !== 0 && (
              <span className={`ml-1 text-xs ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                {priceAdj > 0 ? '+' : ''}${priceAdj.toFixed(2)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// DROPDOWN SELECTOR COMPONENT
// =============================================================================

interface DropdownSelectorProps {
  group: RetailVariationGroup;
  selectedValue?: string;
  onSelect: (value: string) => void;
  isValueAvailable: (value: string) => boolean;
}

function DropdownSelector({ group, selectedValue, onSelect, isValueAvailable }: DropdownSelectorProps) {
  return (
    <select
      value={selectedValue || ''}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full h-10 px-3 border rounded-md bg-background text-sm"
    >
      <option value="">Select {group.name}</option>
      {group.values.map(value => {
        const isAvailable = isValueAvailable(value);
        const priceAdj = group.priceAdjustments?.[value];
        
        return (
          <option key={value} value={value} disabled={!isAvailable}>
            {value}
            {priceAdj !== undefined && priceAdj !== 0 && ` (${priceAdj > 0 ? '+' : ''}$${priceAdj.toFixed(2)})`}
            {!isAvailable && ' - Out of Stock'}
          </option>
        );
      })}
    </select>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RetailVariantSelector({
  variationGroups,
  variants,
  selectedAttributes,
  onSelect,
  primaryColor,
  itemAttributes,
  basePrice,
}: RetailVariantSelectorProps) {
  
  // Sort groups by sortOrder
  const sortedGroups = useMemo(() => 
    [...variationGroups].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [variationGroups]
  );
  
  // Handle attribute selection
  const handleSelect = useCallback((groupId: string, value: string) => {
    onSelect({ ...selectedAttributes, [groupId]: value });
  }, [selectedAttributes, onSelect]);
  
  // Check if a value is available (has stock in at least one matching variant)
  const isValueAvailable = useCallback((groupId: string, value: string): boolean => {
    if (!variants?.length) return true;
    
    // Build test attributes with this value
    const testAttrs = { ...selectedAttributes, [groupId]: value };
    
    // Check if any variant matches and has stock
    return variants.some(v => {
      const matches = Object.entries(testAttrs).every(
        ([key, val]) => !val || v.attributes[key] === val
      );
      return matches && v.stockQty > 0;
    });
  }, [variants, selectedAttributes]);
  
  // Find matching variant for current selection
  const matchingVariant = useMemo(() => {
    if (!variants?.length) return null;
    
    // All groups must have a selection
    const allSelected = sortedGroups.every(g => 
      !g.required || selectedAttributes[g.id]
    );
    if (!allSelected) return null;
    
    return variants.find(v => 
      Object.entries(selectedAttributes).every(
        ([key, value]) => !value || v.attributes[key] === value
      )
    );
  }, [variants, selectedAttributes, sortedGroups]);
  
  // Calculate price adjustment
  const priceAdjustment = useMemo(() => {
    if (matchingVariant) return matchingVariant.priceAdjustment;
    
    // Sum adjustments from variation groups
    let total = 0;
    for (const group of sortedGroups) {
      const value = selectedAttributes[group.id];
      if (value && group.priceAdjustments?.[value]) {
        total += group.priceAdjustments[value];
      }
    }
    return total;
  }, [matchingVariant, sortedGroups, selectedAttributes]);
  
  // Calculate total price
  const total = useMemo(() => {
    if (basePrice === undefined) return null;
    return basePrice + priceAdjustment;
  }, [basePrice, priceAdjustment]);
  
  // Check if selection is complete
  const isComplete = useMemo(() => {
    return sortedGroups.every(g => !g.required || selectedAttributes[g.id]);
  }, [sortedGroups, selectedAttributes]);
  
  return (
    <div className="space-y-4">
      {/* Item info from attributes */}
      {itemAttributes && (
        <div className="space-y-2 text-sm text-muted-foreground">
          {itemAttributes.brand && (
            <div>Brand: <span className="font-medium text-foreground">{itemAttributes.brand}</span></div>
          )}
          {itemAttributes.materials && itemAttributes.materials.length > 0 && (
            <div>Material: {itemAttributes.materials.join(', ')}</div>
          )}
        </div>
      )}
      
      {/* Variation groups */}
      {sortedGroups.map(group => {
        const selectedValue = selectedAttributes[group.id];
        const hasError = group.required && !selectedValue;
        
        return (
          <div key={group.id}>
            <SectionHeader
              title={group.name}
              required={group.required}
              error={hasError ? `Select ${group.name.toLowerCase()}` : undefined}
            />
            
            {group.displayType === 'swatch' ? (
              <SwatchSelector
                group={group}
                selectedValue={selectedValue}
                onSelect={(value) => handleSelect(group.id, value)}
                isValueAvailable={(value) => isValueAvailable(group.id, value)}
                primaryColor={primaryColor}
              />
            ) : group.displayType === 'button' ? (
              <ButtonSelector
                group={group}
                selectedValue={selectedValue}
                onSelect={(value) => handleSelect(group.id, value)}
                isValueAvailable={(value) => isValueAvailable(group.id, value)}
                primaryColor={primaryColor}
              />
            ) : (
              <DropdownSelector
                group={group}
                selectedValue={selectedValue}
                onSelect={(value) => handleSelect(group.id, value)}
                isValueAvailable={(value) => isValueAvailable(group.id, value)}
              />
            )}
          </div>
        );
      })}
      
      {/* Variant info */}
      {matchingVariant && (
        <div className="text-sm space-y-1">
          <div className="text-muted-foreground">
            SKU: <span className="font-mono">{matchingVariant.sku}</span>
          </div>
          
          {matchingVariant.stockQty > 0 && matchingVariant.stockQty < 10 && (
            <div className="flex items-center gap-1 text-orange-500">
              <AlertCircle className="h-4 w-4" />
              Only {matchingVariant.stockQty} left in stock
            </div>
          )}
          
          {matchingVariant.stockQty === 0 && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-4 w-4" />
              Out of stock
            </div>
          )}
        </div>
      )}
      
      {/* Price display */}
      {total !== null && isComplete && (
        <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            {priceAdjustment !== 0 ? 'Adjusted Price' : 'Price'}
          </span>
          <div className="text-right">
            <span className="text-lg font-bold">${total.toFixed(2)}</span>
            {priceAdjustment !== 0 && basePrice !== undefined && (
              <div className="text-xs text-muted-foreground">
                Base ${basePrice.toFixed(2)} {priceAdjustment > 0 ? '+' : ''} ${priceAdjustment.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// VALIDATION HELPER
// =============================================================================

/**
 * Validate that all required variation groups have selections
 */
export function validateRetailVariants(
  variationGroups: RetailVariationGroup[],
  selectedAttributes: Record<string, string>,
  variants?: RetailProductVariant[]
): { valid: boolean; errors: Record<string, string>; variant?: RetailProductVariant } {
  const errors: Record<string, string> = {};
  
  for (const group of variationGroups) {
    if (group.required && !selectedAttributes[group.id]) {
      errors[group.id] = `Please select a ${group.name.toLowerCase()}`;
    }
  }
  
  // Find matching variant
  let matchingVariant: RetailProductVariant | undefined;
  if (variants?.length && Object.keys(errors).length === 0) {
    matchingVariant = variants.find(v => 
      Object.entries(selectedAttributes).every(
        ([key, value]) => !value || v.attributes[key] === value
      )
    );
    
    if (matchingVariant && matchingVariant.stockQty === 0) {
      errors['_variant'] = 'Selected variant is out of stock';
    }
  }
  
  return { valid: Object.keys(errors).length === 0, errors, variant: matchingVariant };
}

/**
 * Convert selected attributes to SelectedVariant for cart
 */
export function buildSelectedVariant(
  selectedAttributes: Record<string, string>,
  variant?: RetailProductVariant,
  variationGroups?: RetailVariationGroup[]
): SelectedVariant | undefined {
  if (Object.keys(selectedAttributes).length === 0) return undefined;
  
  if (variant) {
    return {
      variantId: variant.id,
      sku: variant.sku,
      attributes: selectedAttributes,
      priceAdjustment: variant.priceAdjustment,
    };
  }
  
  // Calculate price adjustment from groups if no variant
  let priceAdjustment = 0;
  if (variationGroups) {
    for (const group of variationGroups) {
      const value = selectedAttributes[group.id];
      if (value && group.priceAdjustments?.[value]) {
        priceAdjustment += group.priceAdjustments[value];
      }
    }
  }
  
  return {
    variantId: Object.values(selectedAttributes).join('-'),
    sku: Object.values(selectedAttributes).join('-'),
    attributes: selectedAttributes,
    priceAdjustment,
  };
}
