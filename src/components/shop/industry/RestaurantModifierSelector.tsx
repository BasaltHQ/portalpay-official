"use client";

/**
 * Restaurant Modifier Selector Component
 * 
 * Toast POS-like modifier selection UI for restaurant menu items.
 * Supports:
 * - Required and optional modifier groups
 * - Single-select (radio) and multi-select (checkbox) groups
 * - Min/max selection constraints
 * - Price adjustments per modifier
 * - Dietary tags and spice level indicators
 */

import React, { useMemo, useCallback } from "react";
import { Check } from "lucide-react";
import {
  RestaurantModifierGroup,
  RestaurantModifier,
  RestaurantItemAttributes,
  SelectedModifier,
  calculateRestaurantItemTotal,
} from "@/types/inventory";
import {
  DietaryTag,
  SpiceLevelIndicator,
  SectionCard,
  PriceAdjustmentBadge,
} from "./shared";

// =============================================================================
// TYPES
// =============================================================================

export interface RestaurantModifierSelectorProps {
  /** Modifier groups to display */
  groups: RestaurantModifierGroup[];
  /** Currently selected modifiers */
  selectedModifiers: SelectedModifier[];
  /** Callback when selection changes */
  onSelect: (modifiers: SelectedModifier[]) => void;
  /** Primary brand color */
  primaryColor?: string;
  /** Item attributes for additional info display */
  itemAttributes?: RestaurantItemAttributes;
  /** Base price for total calculation */
  basePrice?: number;
}

// =============================================================================
// MODIFIER GROUP COMPONENT
// =============================================================================

interface ModifierGroupProps {
  group: RestaurantModifierGroup;
  selectedModifiers: SelectedModifier[];
  onToggle: (group: RestaurantModifierGroup, modifier: RestaurantModifier) => void;
  primaryColor?: string;
}

function ModifierGroup({ group, selectedModifiers, onToggle, primaryColor }: ModifierGroupProps) {
  const groupSelections = selectedModifiers.filter(m => m.groupId === group.id);
  const isValid = !group.required || groupSelections.length >= (group.minSelect || 1);
  const isSingleSelect = group.maxSelect === 1;
  const accentColor = primaryColor || '#0ea5e9';
  
  // Sort modifiers by sortOrder
  const sortedModifiers = useMemo(() => 
    [...group.modifiers]
      .filter(m => m.available !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [group.modifiers]
  );
  
  // Build requirement text
  const requirementText = useMemo(() => {
    const parts: string[] = [];
    if (group.required) {
      parts.push('Required');
    } else {
      parts.push('Optional');
    }
    if (group.minSelect && group.minSelect > 1) {
      parts.push(`Min ${group.minSelect}`);
    }
    if (group.maxSelect) {
      parts.push(`Max ${group.maxSelect}`);
    }
    return parts.join(' • ');
  }, [group.required, group.minSelect, group.maxSelect]);
  
  // Error message for invalid selections
  const errorMessage = useMemo(() => {
    if (!group.required) return null;
    const minRequired = group.minSelect || 1;
    if (groupSelections.length < minRequired) {
      return `Select ${minRequired === 1 ? 'one' : minRequired}`;
    }
    return null;
  }, [group.required, group.minSelect, groupSelections.length]);
  
  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold">{group.name}</h4>
          <p className="text-xs text-muted-foreground">
            {group.required ? (
              <span className="text-red-500 font-medium">Required</span>
            ) : (
              'Optional'
            )}
            {group.minSelect && group.minSelect > 1 && ` • Min ${group.minSelect}`}
            {group.maxSelect && ` • Max ${group.maxSelect}`}
          </p>
        </div>
        {!isValid && errorMessage && (
          <span className="text-xs text-red-500 font-medium">{errorMessage}</span>
        )}
      </div>
      
      <div className="space-y-1.5">
        {sortedModifiers.map(modifier => {
          const isSelected = groupSelections.some(m => m.modifierId === modifier.id);
          
          return (
            <button
              key={modifier.id}
              onClick={() => onToggle(group, modifier)}
              className={`w-full flex items-start justify-between p-2.5 rounded-md border-2 transition-all ${
                isSelected ? '' : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
              style={isSelected ? { 
                borderColor: accentColor, 
                backgroundColor: `${accentColor}10` 
              } : {}}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {/* Selection indicator */}
                <div 
                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isSingleSelect ? 'rounded-full' : 'rounded'} border-2 flex items-center justify-center transition-all`}
                  style={{ 
                    borderColor: isSelected ? accentColor : '#d1d5db', 
                    backgroundColor: isSelected ? accentColor : 'transparent' 
                  }}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                
                {/* Modifier name */}
                <span className="text-sm text-left line-clamp-2 min-w-0">{modifier.name}</span>
                
                {/* Default indicator */}
                {modifier.default && !isSelected && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">(default)</span>
                )}
              </div>
              
              {/* Price adjustment */}
              <PriceAdjustmentBadge amount={modifier.priceAdjustment} />
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RestaurantModifierSelector({
  groups,
  selectedModifiers,
  onSelect,
  primaryColor,
  itemAttributes,
  basePrice,
}: RestaurantModifierSelectorProps) {
  
  // Sort groups by sortOrder
  const sortedGroups = useMemo(() => 
    [...groups].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [groups]
  );
  
  // Handle modifier toggle
  const handleModifierToggle = useCallback((
    group: RestaurantModifierGroup, 
    modifier: RestaurantModifier
  ) => {
    const groupSelections = selectedModifiers.filter(m => m.groupId === group.id);
    const isSelected = groupSelections.some(m => m.modifierId === modifier.id);
    
    if (isSelected) {
      // Deselect modifier
      onSelect(selectedModifiers.filter(
        m => !(m.groupId === group.id && m.modifierId === modifier.id)
      ));
    } else {
      // Check if we need to replace (single select or at max)
      if (group.maxSelect && groupSelections.length >= group.maxSelect) {
        // Replace: remove oldest selection from this group, add new one
        const otherSelections = selectedModifiers.filter(m => m.groupId !== group.id);
        const newSelection: SelectedModifier = {
          groupId: group.id,
          modifierId: modifier.id,
          name: modifier.name,
          priceAdjustment: modifier.priceAdjustment,
        };
        onSelect([...otherSelections, newSelection]);
      } else {
        // Add to selections
        const newSelection: SelectedModifier = {
          groupId: group.id,
          modifierId: modifier.id,
          name: modifier.name,
          priceAdjustment: modifier.priceAdjustment,
        };
        onSelect([...selectedModifiers, newSelection]);
      }
    }
  }, [selectedModifiers, onSelect]);
  
  // Calculate validation state
  const { isValid, invalidGroups } = useMemo(() => {
    const invalid: string[] = [];
    for (const group of groups) {
      if (group.required) {
        const selections = selectedModifiers.filter(m => m.groupId === group.id);
        const minRequired = group.minSelect || 1;
        if (selections.length < minRequired) {
          invalid.push(group.id);
        }
      }
    }
    return { isValid: invalid.length === 0, invalidGroups: invalid };
  }, [groups, selectedModifiers]);
  
  // Calculate total with modifiers
  const total = useMemo(() => {
    if (basePrice === undefined) return null;
    return calculateRestaurantItemTotal(basePrice, selectedModifiers);
  }, [basePrice, selectedModifiers]);
  
  return (
    <div className="space-y-4">
      {/* Item attributes (dietary tags, spice level, etc.) */}
      {itemAttributes && (
        <div className="space-y-3">
          {/* Dietary tags */}
          {itemAttributes.dietaryTags && itemAttributes.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {itemAttributes.dietaryTags.map((tag, i) => (
                <DietaryTag key={i} tag={tag} />
              ))}
            </div>
          )}
          
          {/* Spice level */}
          {itemAttributes.spiceLevel !== undefined && itemAttributes.spiceLevel > 0 && (
            <SpiceLevelIndicator level={itemAttributes.spiceLevel} />
          )}
          
          {/* Prep time and calories */}
          {(itemAttributes.prepTime || itemAttributes.calories) && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {itemAttributes.prepTime && (
                <span>⏱️ {itemAttributes.prepTime}</span>
              )}
              {itemAttributes.calories && (
                <span>🔥 {itemAttributes.calories} cal</span>
              )}
            </div>
          )}
          
          {/* Allergens warning */}
          {itemAttributes.allergens && itemAttributes.allergens.length > 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400">
              ⚠️ Contains: {itemAttributes.allergens.join(', ')}
            </div>
          )}
        </div>
      )}
      
      {/* Modifier groups */}
      {sortedGroups.map(group => (
        <ModifierGroup
          key={group.id}
          group={group}
          selectedModifiers={selectedModifiers}
          onToggle={handleModifierToggle}
          primaryColor={primaryColor}
        />
      ))}
      
      {/* Running total display */}
      {total !== null && (
        <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
          <span className="text-sm font-medium">Item Total</span>
          <span className="text-lg font-bold">${total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// VALIDATION HELPER
// =============================================================================

/**
 * Validate that all required modifier groups have selections
 */
export function validateRestaurantModifiers(
  groups: RestaurantModifierGroup[],
  selectedModifiers: SelectedModifier[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  for (const group of groups) {
    if (group.required) {
      const selections = selectedModifiers.filter(m => m.groupId === group.id);
      const minRequired = group.minSelect || 1;
      
      if (selections.length < minRequired) {
        errors[group.id] = `Select at least ${minRequired} option${minRequired > 1 ? 's' : ''}`;
      }
    }
    
    // Check max selections
    if (group.maxSelect) {
      const selections = selectedModifiers.filter(m => m.groupId === group.id);
      if (selections.length > group.maxSelect) {
        errors[group.id] = `Select at most ${group.maxSelect} option${group.maxSelect > 1 ? 's' : ''}`;
      }
    }
  }
  
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Initialize default selections from modifier groups
 */
export function getDefaultModifierSelections(
  groups: RestaurantModifierGroup[]
): SelectedModifier[] {
  const defaults: SelectedModifier[] = [];
  
  for (const group of groups) {
    for (const modifier of group.modifiers) {
      if (modifier.default && modifier.available !== false) {
        defaults.push({
          groupId: group.id,
          modifierId: modifier.id,
          name: modifier.name,
          priceAdjustment: modifier.priceAdjustment,
        });
      }
    }
  }
  
  return defaults;
}
