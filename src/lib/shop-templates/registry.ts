/**
 * Shop Template Registry
 * 
 * Central registry for templates and section definitions.
 * Templates self-register by importing this module and calling registerTemplate().
 * Section definitions likewise self-register via registerSection().
 */

import type { ShopTemplate, SectionDefinition, ShopSectionType, TemplateCategory } from './types';

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

const TEMPLATE_REGISTRY = new Map<string, ShopTemplate>();

/** Register a template definition */
export function registerTemplate(template: ShopTemplate): void {
  if (TEMPLATE_REGISTRY.has(template.id)) {
    console.warn(`[ShopTemplateRegistry] Template "${template.id}" already registered, overwriting.`);
  }
  TEMPLATE_REGISTRY.set(template.id, template);
}

/** Get a template by ID */
export function getTemplate(id: string): ShopTemplate | null {
  return TEMPLATE_REGISTRY.get(id) || null;
}

/** Get all registered templates */
export function getAllTemplates(): ShopTemplate[] {
  return Array.from(TEMPLATE_REGISTRY.values());
}

/** Get templates filtered by category */
export function getTemplatesByCategory(category: TemplateCategory): ShopTemplate[] {
  return getAllTemplates().filter(t => t.category === category);
}

/** Get the default template (used when no templateId is set on Advanced mode) */
export function getDefaultTemplate(): ShopTemplate {
  return getTemplate('classic')!;
}

// =============================================================================
// SECTION DEFINITION REGISTRY
// =============================================================================

const SECTION_REGISTRY = new Map<ShopSectionType, SectionDefinition>();

/** Register a section definition */
export function registerSection(definition: SectionDefinition): void {
  if (SECTION_REGISTRY.has(definition.type)) {
    console.warn(`[ShopTemplateRegistry] Section "${definition.type}" already registered, overwriting.`);
  }
  SECTION_REGISTRY.set(definition.type, definition);
}

/** Get a section definition by type */
export function getSectionDefinition(type: ShopSectionType): SectionDefinition | null {
  return SECTION_REGISTRY.get(type) || null;
}

/** Get all registered section definitions */
export function getAllSectionDefinitions(): SectionDefinition[] {
  return Array.from(SECTION_REGISTRY.values());
}

// =============================================================================
// TEMPLATE RESOLVER — Maps legacy layoutMode to template
// =============================================================================

/**
 * Resolves a templateId from a shop config, considering legacy layout modes.
 * Used by the storefront to determine which template to render.
 * 
 * - If templateId is explicitly set → use it
 * - If no templateId → return null (use Basic mode / legacy ShopClient)
 */
export function resolveTemplateId(config: { templateId?: string; theme?: { layoutMode?: string } }): string | null {
  if (config.templateId) {
    return config.templateId;
  }
  // No templateId = Basic mode (legacy ShopClient renders)
  return null;
}
