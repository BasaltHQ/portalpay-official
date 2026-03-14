/**
 * Minimal Template
 *
 * Ultra-clean, product-focused design with lots of negative space.
 * Dark background, muted gray tones, barely-there borders.
 * Centered hero with thin typography — "ELEVATE THE ORDINARY."
 * 3-column product grid with small cards (no buttons, prices only).
 * Sparse footer: brand name + year + minimal links.
 */

import { registerTemplate } from '../registry';
import type { ShopTemplate, SectionConfig } from '../types';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const homePageSections: SectionConfig[] = [
  {
    id: uid('hero'),
    type: 'hero',
    visible: true,
    settings: {
      heading: 'ELEVATE THE ORDINARY.',
      subheading: 'A selection of refined objects for intentional living.\n\nMinimalist essentials curated for simplicity and quality.\nExplore our collection.',
      height: 'medium',
      textAlignment: 'center',
      ctaText: 'DISCOVER THE CURATION',
      ctaLink: '#products',
      showLogo: false,
      showRating: false,
      showDescription: false,
      overlayOpacity: 0,
    },
  },
  {
    id: uid('products'),
    type: 'product-grid',
    visible: true,
    settings: {
      heading: '',
      columns: 3,
      productsPerPage: '6',
      enableFilters: false,
      enableSort: false,
      enableSearch: false,
      showPrice: true,
      showRating: false,
      showAddToCart: false,
      showDiscountBadge: false,
      paginationType: 'load-more',
      viewMode: 'grid',
      cardSize: 'medium',
    },
  },
  {
    id: uid('rich-text'),
    type: 'rich-text',
    visible: true,
    settings: {
      content: '<p>Objects chosen for their form, function, and quiet beauty. Nothing more, nothing less.</p>',
      alignment: 'center',
      maxWidth: 'small',
      paddingY: 80,
    },
  },
  {
    id: uid('newsletter'),
    type: 'newsletter',
    visible: true,
    settings: {
      heading: 'Stay Updated',
      subtext: 'New arrivals and curated selections, delivered occasionally.',
      buttonText: 'Subscribe',
      style: 'inline',
    },
  },
];

const productPageSections: SectionConfig[] = [
  {
    id: uid('related'),
    type: 'featured-collection',
    visible: true,
    settings: {
      heading: 'More Products',
      productsPerRow: 3,
      maxProducts: 3,
      showPrice: true,
      showAddToCart: false,
    },
  },
];

const collectionPageSections: SectionConfig[] = [
  {
    id: uid('coll-grid'),
    type: 'product-grid',
    visible: true,
    settings: {
      columns: 3,
      productsPerPage: '24',
      enableFilters: true,
      enableSort: true,
      showPrice: true,
      showRating: false,
      showAddToCart: false,
      paginationType: 'infinite',
    },
  },
];

const minimalTemplate: ShopTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean and focused — let your products speak for themselves. Refined objects, intentional living.',
  thumbnail: '/templates/minimal-preview.png',
  category: 'minimal',
  author: 'PortalPay',
  version: '1.0.0',

  pages: {
    home: homePageSections,
    product: productPageSections,
    collection: collectionPageSections,
  },

  globalSections: {
    footer: {
      id: uid('footer'),
      type: 'footer',
      visible: true,
      settings: {
        showSocialLinks: false,
        showPaymentIcons: false,
        copyrightText: 'MINIMAL (c) {year} | Terms | Contact | Shipping',
        showPoweredBy: false,
        columns: 1,
      },
    },
  },

  theme: {
    colors: {
      primary: '#a3a3a3',
      secondary: '#525252',
      accent: '#d4d4d4',
      background: '#171717',
      surface: '#262626',
      text: '#e5e5e5',
      textMuted: '#737373',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      baseSize: 15,
      headingWeight: 300,
      bodyWeight: 300,
      lineHeight: 1.6,
    },
    layout: {
      maxWidth: 1200,
      borderRadius: 'none',
      cardStyle: 'flat',
      spacing: 'spacious',
      productImageRatio: '1:1',
    },
    effects: {
      animations: false,
      parallax: false,
      darkMode: true,
      glassmorph: false,
    },
  },

  supportedSections: [
    'hero', 'product-grid', 'collection-list', 'rich-text',
    'image-with-text', 'gallery', 'newsletter',
    'collapsible-content', 'social-links', 'footer',
  ],
  requiredSections: ['product-grid'],
};

registerTemplate(minimalTemplate);
export default minimalTemplate;
