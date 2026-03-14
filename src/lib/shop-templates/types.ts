/**
 * Shop Template Framework — Core Type Definitions
 * 
 * This is the type system for the Shopify-competitive storefront engine.
 * Templates define page layouts using ordered lists of section configs.
 * Sections are the atomic UI building blocks (hero, product-grid, etc.).
 */

// =============================================================================
// SECTION TYPES
// =============================================================================

/** All available section types that can be placed on a storefront page */
export type ShopSectionType =
  | 'hero'                // Banner with logo, name, CTA
  | 'slideshow'           // Full-width rotating image carousel
  | 'featured-collection' // Showcase a specific collection
  | 'product-grid'        // Main catalog grid (filterable, sortable)
  | 'collection-list'     // Grid of collection cards
  | 'rich-text'           // Freeform markdown/HTML content
  | 'image-with-text'     // Split image + text block
  | 'video'               // Embedded video (YouTube, Vimeo, direct)
  | 'gallery'             // Image gallery / lookbook
  | 'testimonials'        // Customer reviews / social proof
  | 'newsletter'          // Email signup CTA
  | 'announcement-bar'    // Top-of-page dismissible banner
  | 'multicolumn'         // 2-4 column content blocks
  | 'collapsible-content' // FAQ-style accordion
  | 'contact-form'        // Contact / inquiry form
  | 'map'                 // Embedded Google Maps
  | 'brand-list'          // Logo scroller for partners/brands
  | 'countdown-timer'     // Sale/launch countdown
  | 'before-after'        // Before/after image slider
  | 'custom-html'         // Raw HTML/CSS block (advanced)
  | 'social-links'        // Social media buttons
  | 'footer';             // Configurable footer

// =============================================================================
// SECTION CONFIG — Stored in the shop_config document per-page
// =============================================================================

/** A single block within a section (e.g. a slide inside a slideshow) */
export interface SectionBlock {
  id: string;
  type: string;
  settings: Record<string, any>;
}

/** Per-section configuration stored in the shop_config document */
export interface SectionConfig {
  /** Unique instance ID (uuid) */
  id: string;
  /** Section type from ShopSectionType */
  type: ShopSectionType;
  /** Whether this section is visible on the storefront */
  visible: boolean;
  /** Section-specific settings (typed per section definition) */
  settings: Record<string, any>;
  /** Sub-blocks within this section (e.g. slides, columns) */
  blocks?: SectionBlock[];
}

// =============================================================================
// SECTION SCHEMA — Defines what settings a section accepts
// =============================================================================

/** Schema for a single setting field in a section's settings panel */
export interface SectionSettingSchema {
  key: string;
  type: 'text' | 'textarea' | 'richtext' | 'number' | 'range'
    | 'color' | 'image' | 'url' | 'select' | 'checkbox'
    | 'collection' | 'product' | 'page';
  label: string;
  default?: any;
  /** For 'select' type — available options */
  options?: { label: string; value: string }[];
  /** For 'range'/'number' types */
  min?: number;
  max?: number;
  step?: number;
  /** Helper text shown below the field */
  info?: string;
}

/** Full definition of a section type — used by the editor to render settings */
export interface SectionDefinition {
  type: ShopSectionType;
  name: string;
  description: string;
  /** Lucide icon name for the section picker */
  icon: string;
  /** Settings schema for the section's settings panel */
  settings: SectionSettingSchema[];
  /** Block types this section supports (e.g. slideshow has slides) */
  blocks?: {
    type: string;
    name: string;
    settings: SectionSettingSchema[];
    limit?: number;
  }[];
  /** Maximum instances of this section per page */
  maxPerPage?: number;
  /** Named presets for this section */
  presets?: { name: string; settings: Record<string, any> }[];
}

// =============================================================================
// TEMPLATE THEME — Design token system
// =============================================================================

export interface TemplateThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface TemplateThemeTypography {
  headingFont: string;
  bodyFont: string;
  baseSize: number;        // px
  headingWeight: number;
  bodyWeight: number;
  lineHeight: number;
}

export interface TemplateThemeLayout {
  maxWidth: number;           // px (1200, 1400, 1600, 9999 for full)
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  cardStyle: 'flat' | 'bordered' | 'shadow' | 'glass';
  spacing: 'compact' | 'comfortable' | 'spacious';
  productImageRatio: '1:1' | '3:4' | '4:3' | '16:9' | 'natural';
}

export interface TemplateThemeEffects {
  animations: boolean;
  parallax: boolean;
  darkMode: boolean;
  glassmorph: boolean;
}

export interface TemplateTheme {
  colors: TemplateThemeColors;
  typography: TemplateThemeTypography;
  layout: TemplateThemeLayout;
  effects: TemplateThemeEffects;
}

// =============================================================================
// TEMPLATE DEFINITION — The top-level template object
// =============================================================================

export type TemplateCategory = 'general' | 'restaurant' | 'retail' | 'creative' | 'services' | 'minimal';

/** Page-specific section configurations within a template */
export interface TemplatePages {
  /** Home page sections */
  home: SectionConfig[];
  /** Product detail page sections */
  product: SectionConfig[];
  /** Collection listing page sections */
  collection: SectionConfig[];
}

/** Global sections that persist across all pages */
export interface TemplateGlobalSections {
  /** Header/announcement bar config */
  announcementBar?: SectionConfig;
  /** Footer config */
  footer?: SectionConfig;
}

/** A template defines a pre-configured arrangement of sections and theme */
export interface ShopTemplate {
  /** Unique template identifier (e.g. 'classic', 'boutique') */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Path to preview thumbnail image */
  thumbnail: string;
  /** Category for filtering in the template picker */
  category: TemplateCategory;
  /** Template author */
  author: string;
  /** Semver version */
  version: string;
  /** Default page sections */
  pages: TemplatePages;
  /** Global sections (header, footer) */
  globalSections: TemplateGlobalSections;
  /** Default theme/design tokens */
  theme: TemplateTheme;
  /** Which section types this template supports */
  supportedSections: ShopSectionType[];
  /** Sections that cannot be removed */
  requiredSections: ShopSectionType[];
}

// =============================================================================
// BRANDING CONFIG — Shared between Basic and Advanced modes
// =============================================================================

/**
 * Branding properties that are shared between the Basic tab's ShopConfigEditor
 * and the Advanced tab's branding section. These control the overall site theme
 * when a merchant is logged in (via useBrand context).
 * 
 * Both tabs write to the same underlying shop_config fields to ensure
 * consistency regardless of which mode the merchant uses.
 */
export interface SharedBrandingConfig {
  /** Shop display name */
  name: string;
  /** URL slug */
  slug: string;
  /** Shop description */
  description?: string;
  /** Brand logo URL */
  brandLogoUrl: string;
  /** Favicon URL */
  brandFaviconUrl: string;
  /** Primary brand color (used for --shop-primary and site theme) */
  primaryColor: string;
  /** Secondary brand color (used for --shop-secondary and site theme) */
  secondaryColor: string;
  /** Logo shape preference */
  logoShape?: 'square' | 'circle';
  /** Font family */
  fontFamily?: string;
}

// =============================================================================
// METAFIELDS — Generic key-value data on any resource
// =============================================================================

export interface Metafield {
  namespace: string;      // e.g. "custom", "seo", "shipping"
  key: string;            // e.g. "care_instructions"
  value: string;
  type: 'single_line_text' | 'multi_line_text' | 'number'
    | 'boolean' | 'date' | 'url' | 'color' | 'json' | 'rich_text';
}

// =============================================================================
// NAVIGATION
// =============================================================================

export interface NavItem {
  id: string;
  label: string;
  type: 'link' | 'collection' | 'page' | 'product' | 'dropdown';
  /** URL, handle, or item ID depending on type */
  target?: string;
  /** Child items for dropdown type (1 level deep) */
  children?: NavItem[];
}

export interface ShopNavigation {
  id: string;
  type: 'shop_navigation';
  wallet: string;
  shopSlug: string;
  location: 'main' | 'footer';
  items: NavItem[];
  updatedAt: number;
}

// =============================================================================
// COLLECTIONS
// =============================================================================

export interface CollectionRule {
  field: 'title' | 'category' | 'tag' | 'price' | 'vendor'
    | 'inventory_stock' | 'industry_pack';
  condition: 'equals' | 'not_equals' | 'contains' | 'not_contains'
    | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string;
}

export type CollectionSortOrder =
  | 'manual' | 'best-selling' | 'alpha-asc' | 'alpha-desc'
  | 'price-asc' | 'price-desc' | 'created-desc' | 'created-asc';

export interface ShopCollection {
  id: string;
  type: 'shop_collection';
  wallet: string;
  shopSlug: string;
  brandKey: string;
  handle: string;
  title: string;
  description?: string;
  image?: string;
  seo: { title?: string; description?: string };
  collectionType: 'manual' | 'smart';
  /** Manual collection: explicit item IDs */
  productIds?: string[];
  /** Smart collection: automated rules */
  rules?: {
    condition: 'all' | 'any';
    rules: CollectionRule[];
  };
  sortOrder: CollectionSortOrder;
  visible: boolean;
  createdAt: number;
  updatedAt: number;
  metafields?: Metafield[];
}

// =============================================================================
// SHOP PAGES (CMS)
// =============================================================================

export interface ShopPage {
  id: string;
  type: 'shop_page';
  wallet: string;
  shopSlug: string;
  brandKey: string;
  handle: string;
  title: string;
  sections: SectionConfig[];
  seo: { title?: string; description?: string; image?: string };
  visible: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  metafields?: Metafield[];
}
