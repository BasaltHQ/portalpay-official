/**
 * Template SDK — Types and utilities for building, validating, and distributing
 * third-party templates for the PortalPay Storefront Engine.
 *
 * This SDK enables an ecosystem similar to Shopify's Theme Store:
 * - Template authors can build templates using these contracts
 * - Templates are validated via manifest schema before publish
 * - Published templates land in the Template Store for merchants to install
 *
 * The manifest is declarative (JSON) so templates can be validated, previewed,
 * and installed without executing any code on the server.
 */

import type { SectionType, SectionSettingSchema, TemplateTheme } from './types';

// ─── Template Manifest ──────────────────────────────────────────────────────

/**
 * The complete manifest for a publishable template.
 * This is the contract between template authors and the platform.
 */
export interface TemplateManifest {
  /** Schema version — for future-proofing migrations */
  schemaVersion: '1.0';

  /** Unique identifier (lowercase, kebab-case), globally unique across the store */
  id: string;

  /** Display name */
  name: string;

  /** Short description (max 140 chars, shown in store listing) */
  description: string;

  /** Long-form description with markdown (shown on template detail page) */
  longDescription?: string;

  /** Template category */
  category: TemplateCategoryType;

  /** Tags for search/filtering */
  tags: string[];

  /** Author information */
  author: TemplateAuthor;

  /** Version using semver */
  version: string;

  /** Changelog entries */
  changelog?: ChangelogEntry[];

  /** Template engine compatibility */
  engine: {
    /** Minimum engine version this template supports */
    minVersion: string;
    /** Maximum engine version (optional) */
    maxVersion?: string;
  };

  /** Pricing */
  pricing: TemplatePricing;

  /** Preview assets for the store listing */
  preview: TemplatePreview;

  /** Theme configuration with all design tokens */
  theme: TemplateTheme;

  /** Page definitions — which sections appear on each page */
  pages: Record<string, TemplatePage>;

  /** Custom section definitions unique to this template */
  customSections?: CustomSectionDefinition[];

  /** Custom CSS that gets injected when this template is active */
  customCss?: string;

  /** Custom fonts to load */
  fonts?: FontDefinition[];

  /** Feature flags supported by this template */
  features?: TemplateFeatureFlags;

  /** Localization support */
  locales?: string[];

  /** Template regions/markets — controls availability in the store */
  regions?: string[];
}

// ─── Author ─────────────────────────────────────────────────────────────────

export interface TemplateAuthor {
  /** Author display name */
  name: string;

  /** Author email (for support) */
  email: string;

  /** Author website */
  url?: string;

  /** Author avatar URL */
  avatar?: string;

  /** Verified developer badge (set by platform, ignored in submissions) */
  verified?: boolean;

  /** Developer portfolio URL */
  portfolio?: string;

  /** Revenue share wallet address — royalties are paid here */
  walletAddress?: string;
}

// ─── Pricing ────────────────────────────────────────────────────────────────

export interface TemplatePricing {
  type: 'free' | 'one_time' | 'subscription';

  /** Price in USD (ignored for free) */
  priceUsd?: number;

  /** Subscription period (only for 'subscription' type) */
  period?: 'monthly' | 'yearly';

  /** Trial days for paid templates */
  trialDays?: number;

  /** Revenue share percentage to platform (default: 30%) */
  platformSharePercent?: number;
}

// ─── Preview Assets ─────────────────────────────────────────────────────────

export interface TemplatePreview {
  /** Primary screenshot (1200x800 recommended) */
  thumbnail: string;

  /** Full-page screenshots for the carousel */
  screenshots: string[];

  /** Demo store URL (if available) */
  demoUrl?: string;

  /** Short video preview URL */
  videoUrl?: string;

  /** Color swatches to show in store listing */
  colorSwatches: string[];
}

// ─── Pages ──────────────────────────────────────────────────────────────────

export interface TemplatePage {
  /** Human-readable page name */
  name: string;

  /** Sections on this page, in order */
  sections: TemplateSectionInstance[];
}

export interface TemplateSectionInstance {
  /** Unique ID within this template */
  id: string;

  /** Section type (must match a registered section or a customSection.type) */
  type: SectionType | string;

  /** Default settings for this section instance */
  settings: Record<string, any>;

  /** Whether this section can be removed by the merchant */
  locked?: boolean;

  /** Whether this section is visible by default */
  visible?: boolean;

  /** Default blocks for block-supporting sections */
  blocks?: Array<{
    type: string;
    settings: Record<string, any>;
  }>;
}

// ─── Custom Sections ────────────────────────────────────────────────────────

export interface CustomSectionDefinition {
  /** Section type identifier (must be unique within this template) */
  type: string;

  /** Display name */
  name: string;

  /** Description */
  description?: string;

  /** Icon (emoji or SVG) */
  icon?: string;

  /** Settings schema */
  settings: SectionSettingSchema[];

  /** Block types this section supports */
  blocks?: Array<{
    type: string;
    name: string;
    limit?: number;
    settings: SectionSettingSchema[];
  }>;

  /** Limit of instances per page */
  limit?: number;

  /**
   * The rendering component path relative to the template root.
   * Templates must provide a React component that implements SectionRenderProps.
   */
  componentPath: string;
}

// ─── Fonts ──────────────────────────────────────────────────────────────────

export interface FontDefinition {
  /** Font family name */
  family: string;

  /** Google Fonts URL or self-hosted URL */
  source: string;

  /** Weights to load */
  weights: number[];

  /** Whether to include italic variants */
  italic?: boolean;

  /** Display strategy */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

// ─── Feature Flags ──────────────────────────────────────────────────────────

export interface TemplateFeatureFlags {
  /** Supports right-to-left languages */
  rtlSupport?: boolean;

  /** Supports dark/light mode toggle */
  darkModeToggle?: boolean;

  /** Has built-in accessibility enhancements */
  accessibilityEnhanced?: boolean;

  /** Supports animation controls (reduce motion) */
  reduceMotionSupport?: boolean;

  /** Built-in SEO optimizations */
  seoOptimized?: boolean;

  /** Supports product Quick View */
  quickView?: boolean;

  /** Supports product Comparison */
  productComparison?: boolean;

  /** Has mega-menu navigation */
  megaMenu?: boolean;

  /** Built-in internationalization */
  i18n?: boolean;

  /** Supports sticky add-to-cart */
  stickyCart?: boolean;

  /** Supports infinite scroll */
  infiniteScroll?: boolean;

  /** Has built-in search with autocomplete */
  searchAutocomplete?: boolean;

  /** Supports product reviews inline */
  inlineReviews?: boolean;

  /** Has breadcrumb navigation */
  breadcrumbs?: boolean;

  /** Supports back-to-top button */
  backToTop?: boolean;

  /** Has social sharing buttons */
  socialSharing?: boolean;

  /** Supports currency converter */
  currencyConverter?: boolean;

  /** Has size guide popup */
  sizeGuide?: boolean;

  /** Supports wishlist */
  wishlist?: boolean;

  /** Has age verification gate */
  ageVerification?: boolean;

  /** Supports announcement bar with countdown */
  countdownAnnouncement?: boolean;
}

// ─── Changelog ──────────────────────────────────────────────────────────────

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

// ─── Categories ─────────────────────────────────────────────────────────────

export type TemplateCategoryType =
  | 'general'       // Universal e-commerce
  | 'minimal'       // Clean, product-focused
  | 'retail'        // Fashion, apparel, accessories
  | 'food'          // Restaurants, bakeries, food delivery
  | 'health'        // Wellness, supplements, fitness
  | 'digital'       // Digital products, downloads, SaaS
  | 'services'      // Freelancers, agencies, consulting
  | 'art'           // Artists, galleries, prints
  | 'electronics'   // Tech, gadgets, hardware
  | 'luxury'        // Premium goods, jewelry
  | 'handmade'      // Etsy-style craftwork
  | 'publishing'    // Books, magazines, content
  | 'automotive'    // Vehicles, parts, accessories
  | 'pet'           // Pet supplies, grooming
  | 'education'     // Courses, tutoring
  | 'nonprofit'     // Charities, fundraising
  | 'gaming'        // Gaming merchandise, virtual items
  | 'sports'        // Athletic gear, team stores
  | 'beauty'        // Cosmetics, skincare
  | 'home'          // Furniture, decor, home goods
  | 'b2b';          // Wholesale, bulk ordering

// ─── Store Listing ──────────────────────────────────────────────────────────

/** A template as it appears in the Template Store */
export interface StoreTemplateListing {
  id: string;
  name: string;
  description: string;
  category: TemplateCategoryType;
  tags: string[];
  author: TemplateAuthor;
  version: string;
  pricing: TemplatePricing;
  preview: TemplatePreview;
  features: TemplateFeatureFlags;

  /** Platform metrics */
  stats: {
    installs: number;
    activeInstalls: number;
    rating: number;
    reviewCount: number;
    lastUpdated: string;
    publishedAt: string;
  };

  /** Whether this is a featured/promoted template */
  featured?: boolean;

  /** Staff pick badge */
  staffPick?: boolean;

  /** Compatibility badge */
  mobileOptimized?: boolean;
}

// ─── Installation ───────────────────────────────────────────────────────────

/** Tracks what templates a merchant has installed */
export interface TemplateInstallation {
  /** Template manifest ID */
  templateId: string;

  /** Installed version */
  version: string;

  /** Merchant wallet address */
  merchantWallet: string;

  /** When installed */
  installedAt: string;

  /** When last updated */
  updatedAt?: string;

  /** License key (for paid templates) */
  licenseKey?: string;

  /** Whether updates are available */
  updateAvailable?: boolean;

  /** Available update version */
  latestVersion?: string;

  /** Custom overrides the merchant has made */
  overrides?: {
    theme?: Partial<TemplateTheme>;
    sections?: Record<string, Record<string, any>>;
  };
}

// ─── Validation ─────────────────────────────────────────────────────────────

export interface ManifestValidationResult {
  valid: boolean;
  errors: ManifestValidationError[];
  warnings: ManifestValidationWarning[];
}

export interface ManifestValidationError {
  path: string;
  message: string;
  code: 'MISSING_FIELD' | 'INVALID_TYPE' | 'INVALID_VALUE' | 'DUPLICATE_ID' | 'UNKNOWN_SECTION' | 'INCOMPATIBLE_ENGINE';
}

export interface ManifestValidationWarning {
  path: string;
  message: string;
  code: 'MISSING_PREVIEW' | 'NO_CHANGELOG' | 'LARGE_CSS' | 'MISSING_DESCRIPTION' | 'NO_DEMO_URL';
}

/**
 * Validates a template manifest before submission.
 * Returns errors and warnings.
 */
export function validateManifest(manifest: Partial<TemplateManifest>): ManifestValidationResult {
  const errors: ManifestValidationError[] = [];
  const warnings: ManifestValidationWarning[] = [];

  // Required fields
  const required: [string, any][] = [
    ['id', manifest.id],
    ['name', manifest.name],
    ['description', manifest.description],
    ['category', manifest.category],
    ['author', manifest.author],
    ['author.name', manifest.author?.name],
    ['author.email', manifest.author?.email],
    ['version', manifest.version],
    ['pricing', manifest.pricing],
    ['preview', manifest.preview],
    ['preview.thumbnail', manifest.preview?.thumbnail],
    ['theme', manifest.theme],
    ['pages', manifest.pages],
    ['pages.home', manifest.pages?.home],
  ];

  for (const [path, value] of required) {
    if (value === undefined || value === null || value === '') {
      errors.push({ path, message: `${path} is required`, code: 'MISSING_FIELD' });
    }
  }

  // ID format validation
  if (manifest.id && !/^[a-z0-9-]+$/.test(manifest.id)) {
    errors.push({ path: 'id', message: 'ID must be lowercase kebab-case (a-z, 0-9, hyphens)', code: 'INVALID_VALUE' });
  }

  // Version format
  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push({ path: 'version', message: 'Version must be semver (e.g., 1.0.0)', code: 'INVALID_VALUE' });
  }

  // Description length
  if (manifest.description && manifest.description.length > 140) {
    errors.push({ path: 'description', message: 'Description must be 140 characters or fewer', code: 'INVALID_VALUE' });
  }

  // Check for duplicate section IDs within pages
  if (manifest.pages) {
    for (const [pageName, page] of Object.entries(manifest.pages)) {
      const ids = new Set<string>();
      for (const section of page.sections || []) {
        if (ids.has(section.id)) {
          errors.push({ path: `pages.${pageName}.sections`, message: `Duplicate section ID: ${section.id}`, code: 'DUPLICATE_ID' });
        }
        ids.add(section.id);
      }
    }
  }

  // Warnings
  if (!manifest.preview?.screenshots?.length) {
    warnings.push({ path: 'preview.screenshots', message: 'No screenshots provided — strongly recommended for store listing', code: 'MISSING_PREVIEW' });
  }

  if (!manifest.changelog?.length) {
    warnings.push({ path: 'changelog', message: 'No changelog provided', code: 'NO_CHANGELOG' });
  }

  if (!manifest.preview?.demoUrl) {
    warnings.push({ path: 'preview.demoUrl', message: 'No demo URL — live demos increase installs by 3x', code: 'NO_DEMO_URL' });
  }

  if (manifest.longDescription === undefined) {
    warnings.push({ path: 'longDescription', message: 'No long description — detailed descriptions rank higher in search', code: 'MISSING_DESCRIPTION' });
  }

  if (manifest.customCss && manifest.customCss.length > 50_000) {
    warnings.push({ path: 'customCss', message: 'Custom CSS exceeds 50KB — consider optimization', code: 'LARGE_CSS' });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
