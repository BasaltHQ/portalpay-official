/**
 * Inventory Schema Migration Utilities
 * 
 * This module provides version detection and migration functions for inventory item attributes.
 * It ensures backward compatibility with legacy schema formats while allowing seamless upgrades
 * to the new typed industry attributes system.
 */

import type {
  IndustryAttributes,
  RestaurantItemAttributes,
  RestaurantModifierGroup,
  RestaurantModifier,
  RetailItemAttributes,
  RetailVariationGroup,
  HotelRoomTypeAttributes,
  FreelancerServiceAttributes,
} from "@/types/inventory";
import type { IndustryPackType } from "@/lib/industry-packs";

// =============================================================================
// SCHEMA VERSION CONSTANTS
// =============================================================================

export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Schema version history:
 * - v1 (legacy): Flat attributes stored directly on item, no type discriminator
 * - v2 (current): Typed attributes with { type, data } structure
 */

// =============================================================================
// LEGACY SCHEMA TYPES (for detection and migration)
// =============================================================================

/**
 * Legacy Restaurant schema (v1)
 * Stored modifier groups without the new nested modifier structure
 */
interface LegacyRestaurantAttributes {
  modifierGroups?: Array<{
    id: string;
    name: string;
    required: boolean;
    minSelect?: number;
    maxSelect?: number;
    modifiers: Array<{
      id: string;
      name: string;
      priceAdjustment: number;
    }>;
  }>;
  dietaryTags?: string[];
  spiceLevel?: number;
  prepTime?: string;
  calories?: number;
  ingredients?: string;
}

/**
 * Legacy Retail schema (v1)
 */
interface LegacyRetailAttributes {
  variationGroups?: Array<{
    id: string;
    name: string;
    values: string[];
    priceAdjustments?: Record<string, number>;
  }>;
  variants?: Array<{
    id: string;
    sku?: string;
    attributes: Record<string, string>;
    priceAdjustment: number;
    stockQty?: number;
  }>;
  brand?: string;
}

/**
 * Legacy Hotel schema (v1)
 */
interface LegacyHotelAttributes {
  rooms?: Array<{
    id: string;
    roomNumber: string;
    status?: string;
  }>;
  maxOccupancy?: number;
  amenities?: string[];
  pricePerNight?: number;
  bedConfiguration?: Array<{
    type: string;
    count: number;
  }>;
}

/**
 * Legacy Freelancer schema (v1)
 */
interface LegacyFreelancerAttributes {
  pricing?: {
    type?: string;
    amount?: number;
    minHours?: number;
    rushMultiplier?: number;
  };
  deliveryTime?: string;
  revisionsIncluded?: number;
  serviceCategory?: string;
  skillLevel?: string;
  deliverables?: string[];
  addOns?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

// =============================================================================
// SCHEMA VERSION DETECTION
// =============================================================================

export interface SchemaVersionInfo {
  version: number;
  isLegacy: boolean;
  migratable: boolean;
  issues: string[];
}

/**
 * Detect the schema version of an inventory item's attributes
 */
export function detectSchemaVersion(
  attributes: unknown,
  industryPack?: IndustryPackType
): SchemaVersionInfo {
  // No attributes = current version (empty)
  if (!attributes || (typeof attributes === 'object' && Object.keys(attributes).length === 0)) {
    return { version: CURRENT_SCHEMA_VERSION, isLegacy: false, migratable: false, issues: [] };
  }

  const attrs = attributes as Record<string, unknown>;

  // Check for v2 structure (has 'type' and 'data' fields)
  if ('type' in attrs && 'data' in attrs) {
    const type = attrs.type as string;
    const validTypes = ['restaurant', 'retail', 'hotel', 'freelancer', 'general'];
    
    if (validTypes.includes(type)) {
      return { version: CURRENT_SCHEMA_VERSION, isLegacy: false, migratable: false, issues: [] };
    }
  }

  // It's a legacy schema (v1) - detect which type and validate
  const issues: string[] = [];
  
  if (!industryPack || industryPack === 'general') {
    // Can't determine the target type without industry pack
    issues.push('No industry pack specified - unable to determine migration target');
    return { version: 1, isLegacy: true, migratable: false, issues };
  }

  // Validate based on industry pack
  switch (industryPack) {
    case 'restaurant':
      if ('modifierGroups' in attrs || 'dietaryTags' in attrs || 'spiceLevel' in attrs || 'prepTime' in attrs) {
        return { version: 1, isLegacy: true, migratable: true, issues: [] };
      }
      break;
    case 'retail':
      if ('variationGroups' in attrs || 'variants' in attrs || 'brand' in attrs) {
        return { version: 1, isLegacy: true, migratable: true, issues: [] };
      }
      break;
    case 'hotel':
      if ('rooms' in attrs || 'maxOccupancy' in attrs || 'amenities' in attrs || 'pricePerNight' in attrs) {
        return { version: 1, isLegacy: true, migratable: true, issues: [] };
      }
      break;
    case 'freelancer':
      if ('pricing' in attrs || 'deliveryTime' in attrs || 'serviceCategory' in attrs) {
        return { version: 1, isLegacy: true, migratable: true, issues: [] };
      }
      break;
  }

  // Unknown structure
  issues.push('Attributes structure does not match any known schema');
  return { version: 0, isLegacy: true, migratable: false, issues };
}

// =============================================================================
// MIGRATION FUNCTIONS
// =============================================================================

/**
 * Migrate legacy restaurant attributes to v2 schema
 */
function migrateRestaurantAttributes(legacy: LegacyRestaurantAttributes): IndustryAttributes {
  const modifierGroups: RestaurantModifierGroup[] = (legacy.modifierGroups || []).map((group) => ({
    id: group.id,
    name: group.name,
    required: group.required,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    selectionType: group.maxSelect === 1 ? 'single' : 'multiple',
    modifiers: (group.modifiers || []).map((mod): RestaurantModifier => ({
      id: mod.id,
      name: mod.name,
      priceAdjustment: mod.priceAdjustment,
      available: true,
    })),
  }));

  const data: RestaurantItemAttributes = {
    modifierGroups: modifierGroups.length > 0 ? modifierGroups : undefined,
    dietaryTags: legacy.dietaryTags,
    spiceLevel: legacy.spiceLevel,
    prepTime: legacy.prepTime,
    calories: legacy.calories,
    ingredients: legacy.ingredients,
  };

  return { type: 'restaurant', data };
}

/**
 * Migrate legacy retail attributes to v2 schema
 */
function migrateRetailAttributes(legacy: LegacyRetailAttributes): IndustryAttributes {
  const variationGroups: RetailVariationGroup[] = (legacy.variationGroups || []).map((group) => ({
    id: group.id,
    name: group.name,
    type: 'preset' as const,
    required: true,
    values: group.values || [],
    priceAdjustments: group.priceAdjustments,
    displayType: group.name.toLowerCase().includes('color') ? 'swatch' : 'button',
  }));

  const data: RetailItemAttributes = {
    variationGroups: variationGroups.length > 0 ? variationGroups : undefined,
    variants: (legacy.variants || []).map((v) => ({
      id: v.id,
      sku: v.sku || v.id,
      attributes: v.attributes,
      priceAdjustment: v.priceAdjustment,
      stockQty: v.stockQty ?? 0,
    })),
    brand: legacy.brand,
  };

  return { type: 'retail', data };
}

/**
 * Migrate legacy hotel attributes to v2 schema
 */
function migrateHotelAttributes(legacy: LegacyHotelAttributes): IndustryAttributes {
  const data: HotelRoomTypeAttributes = {
    rooms: (legacy.rooms || []).map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      typeId: 'default',
      status: (room.status as 'available' | 'occupied' | 'maintenance') || 'available',
      lastStatusChange: Date.now(),
    })),
    maxOccupancy: legacy.maxOccupancy ?? 2,
    amenities: legacy.amenities,
    pricePerNight: legacy.pricePerNight,
    bedConfiguration: (legacy.bedConfiguration || []).map((bed) => ({
      type: bed.type as 'king' | 'queen' | 'double' | 'twin' | 'single',
      count: bed.count,
    })),
  };

  return { type: 'hotel', data };
}

/**
 * Migrate legacy freelancer attributes to v2 schema
 */
function migrateFreelancerAttributes(legacy: LegacyFreelancerAttributes): IndustryAttributes {
  const data: FreelancerServiceAttributes = {
    pricing: {
      type: (legacy.pricing?.type as 'hourly' | 'project' | 'package') || 'project',
      amount: legacy.pricing?.amount ?? 0,
      minHours: legacy.pricing?.minHours,
      rushMultiplier: legacy.pricing?.rushMultiplier,
    },
    deliveryTime: legacy.deliveryTime || '1 week',
    revisionsIncluded: legacy.revisionsIncluded ?? 1,
    serviceCategory: legacy.serviceCategory || 'General',
    skillLevel: (legacy.skillLevel as 'beginner' | 'intermediate' | 'expert') || 'intermediate',
    deliverables: legacy.deliverables,
    addOns: (legacy.addOns || []).map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: addon.price,
    })),
  };

  return { type: 'freelancer', data };
}

/**
 * Migrate any legacy attributes to the current v2 schema
 */
export function migrateAttributes(
  attributes: unknown,
  industryPack: IndustryPackType
): IndustryAttributes | null {
  if (!attributes || typeof attributes !== 'object') {
    return null;
  }

  const attrs = attributes as Record<string, unknown>;

  // Already v2 schema
  if ('type' in attrs && 'data' in attrs) {
    return attrs as IndustryAttributes;
  }

  // Migrate based on industry pack
  switch (industryPack) {
    case 'restaurant':
      return migrateRestaurantAttributes(attrs as LegacyRestaurantAttributes);
    case 'retail':
      return migrateRetailAttributes(attrs as LegacyRetailAttributes);
    case 'hotel':
      return migrateHotelAttributes(attrs as LegacyHotelAttributes);
    case 'freelancer':
      return migrateFreelancerAttributes(attrs as LegacyFreelancerAttributes);
    case 'general':
    default:
      return { type: 'general', data: attrs };
  }
}

// =============================================================================
// REVERSE MIGRATION (for edit forms that use legacy format)
// =============================================================================

/**
 * Extract legacy-format attributes from v2 schema for edit forms
 * This is useful when the edit UI still uses the old format
 */
export function extractLegacyFormat(attributes: IndustryAttributes | undefined): Record<string, unknown> | null {
  if (!attributes) return null;

  switch (attributes.type) {
    case 'restaurant': {
      const data = attributes.data;
      return {
        modifierGroups: (data.modifierGroups || []).map((g) => ({
          id: g.id,
          name: g.name,
          required: g.required,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          modifiers: (g.modifiers || []).map((m) => ({
            id: m.id,
            name: m.name,
            priceAdjustment: m.priceAdjustment,
          })),
        })),
        dietaryTags: data.dietaryTags || [],
        spiceLevel: data.spiceLevel || 0,
        prepTime: data.prepTime || '',
        calories: data.calories,
        ingredients: data.ingredients || '',
      };
    }
    case 'retail': {
      const data = attributes.data;
      return {
        variationGroups: (data.variationGroups || []).map((g) => ({
          id: g.id,
          name: g.name,
          values: g.values,
          priceAdjustments: g.priceAdjustments,
        })),
        variants: data.variants || [],
        brand: data.brand || '',
      };
    }
    case 'hotel': {
      const data = attributes.data;
      return {
        rooms: (data.rooms || []).map((r) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          status: r.status,
        })),
        maxOccupancy: data.maxOccupancy,
        amenities: data.amenities || [],
        pricePerNight: data.pricePerNight,
        bedConfiguration: data.bedConfiguration,
      };
    }
    case 'freelancer': {
      const data = attributes.data;
      return {
        pricing: data.pricing,
        deliveryTime: data.deliveryTime,
        revisionsIncluded: data.revisionsIncluded,
        serviceCategory: data.serviceCategory,
        skillLevel: data.skillLevel,
        deliverables: data.deliverables || [],
        addOns: data.addOns || [],
      };
    }
    case 'general':
    default:
      return attributes.data as Record<string, unknown>;
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate migrated attributes
 */
export function validateMigratedAttributes(attributes: IndustryAttributes): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (attributes.type) {
    case 'restaurant': {
      const data = attributes.data;
      if (data.modifierGroups) {
        data.modifierGroups.forEach((group, i) => {
          if (!group.name) {
            warnings.push(`Modifier group ${i + 1} has no name`);
          }
          if (group.required && (!group.modifiers || group.modifiers.length === 0)) {
            errors.push(`Required modifier group "${group.name || i + 1}" has no modifiers`);
          }
        });
      }
      break;
    }
    case 'retail': {
      const data = attributes.data;
      if (data.variationGroups && data.variationGroups.length > 0) {
        if (!data.variants || data.variants.length === 0) {
          warnings.push('Variation groups defined but no variants generated');
        }
      }
      break;
    }
    case 'hotel': {
      const data = attributes.data;
      if (!data.maxOccupancy || data.maxOccupancy < 1) {
        errors.push('Hotel room must have a maximum occupancy of at least 1');
      }
      break;
    }
    case 'freelancer': {
      const data = attributes.data;
      if (!data.pricing || data.pricing.amount <= 0) {
        errors.push('Freelancer service must have a valid pricing amount');
      }
      if (!data.deliveryTime) {
        warnings.push('No delivery time specified');
      }
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// BATCH MIGRATION HELPER
// =============================================================================

export interface MigrationReport {
  totalItems: number;
  migrated: number;
  skipped: number;
  failed: number;
  details: Array<{
    itemId: string;
    status: 'migrated' | 'skipped' | 'failed';
    reason?: string;
  }>;
}

/**
 * Generate a migration report for a list of items
 * This doesn't actually migrate - it reports what would happen
 */
export function generateMigrationReport(
  items: Array<{
    id: string;
    industryPack?: IndustryPackType;
    attributes?: unknown;
  }>
): MigrationReport {
  const report: MigrationReport = {
    totalItems: items.length,
    migrated: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const item of items) {
    const versionInfo = detectSchemaVersion(item.attributes, item.industryPack);

    if (!versionInfo.isLegacy) {
      report.skipped++;
      report.details.push({
        itemId: item.id,
        status: 'skipped',
        reason: 'Already using current schema',
      });
    } else if (versionInfo.migratable) {
      report.migrated++;
      report.details.push({
        itemId: item.id,
        status: 'migrated',
      });
    } else {
      report.failed++;
      report.details.push({
        itemId: item.id,
        status: 'failed',
        reason: versionInfo.issues.join('; '),
      });
    }
  }

  return report;
}
