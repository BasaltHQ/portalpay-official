/**
 * Shop Template Framework — Public API
 * 
 * Re-exports all types, registry functions, section definitions,
 * and built-in templates from a single entry point.
 */

// Types
export type {
  ShopSectionType,
  SectionBlock,
  SectionConfig,
  SectionSettingSchema,
  SectionDefinition,
  TemplateTheme,
  TemplateThemeColors,
  TemplateThemeTypography,
  TemplateThemeLayout,
  TemplateThemeEffects,
  TemplateCategory,
  TemplatePages,
  TemplateGlobalSections,
  ShopTemplate,
  SharedBrandingConfig,
  Metafield,
  NavItem,
  ShopNavigation,
  CollectionRule,
  CollectionSortOrder,
  ShopCollection,
  ShopPage,
} from './types';

// Registry
export {
  registerTemplate,
  getTemplate,
  getAllTemplates,
  getTemplatesByCategory,
  getDefaultTemplate,
  registerSection,
  getSectionDefinition,
  getAllSectionDefinitions,
  resolveTemplateId,
} from './registry';

// Section definitions — self-register on import
import './sections/hero';
import './sections/slideshow';
import './sections/featured-collection';
import './sections/product-grid';
import './sections/collection-list';
import './sections/rich-text';
import './sections/image-with-text';
import './sections/video';
import './sections/gallery';
import './sections/testimonials';
import './sections/newsletter';
import './sections/announcement-bar';
import './sections/multicolumn';
import './sections/collapsible-content';
import './sections/contact-form';
import './sections/countdown-timer';
import './sections/custom-html';
import './sections/social-links';
import './sections/footer';

// Template definitions — self-register on import
import './templates/classic';
import './templates/minimal';
import './templates/showcase';
import './templates/boutique';
import './templates/menu';
import './templates/portfolio';
import './templates/editorial';
