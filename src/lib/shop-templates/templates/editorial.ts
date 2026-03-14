/**
 * Editorial Template
 * 
 * Publishing/bookstore design — editorial layout with
 * serif headings, wide content areas, and reading-focused design.
 */

import { registerTemplate } from '../registry';
import type { ShopTemplate } from '../types';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const editorialTemplate: ShopTemplate = {
  id: 'editorial',
  name: 'Editorial',
  description: 'Publishing-focused design — ideal for bookstores, magazines, and content creators.',
  thumbnail: '/templates/editorial-preview.png',
  category: 'creative',
  author: 'PortalPay',
  version: '1.0.0',

  pages: {
    home: [
      {
        id: uid('hero'),
        type: 'hero',
        visible: true,
        settings: {
          heading: 'THE SEASON OF MIDNIGHT',
          subheading: 'Curated essentials for the modern aesthetic.\nDiscover our editorial picks.',
          height: 'medium',
          textAlignment: 'left',
          ctaText: 'Browse Catalog',
          ctaLink: '#products',
          showLogo: true,
          showRating: true,
          showDescription: true,
          overlayOpacity: 30,
        },
      },
      {
        id: uid('featured'),
        type: 'featured-collection',
        visible: true,
        settings: {
          heading: 'Editor\'s Picks',
          productsPerRow: 4,
          maxProducts: 4,
          showPrice: true,
          showRating: true,
          showAddToCart: true,
          viewAllLink: true,
        },
      },
      {
        id: uid('image-text'),
        type: 'image-with-text',
        visible: true,
        settings: {
          heading: 'About Our Catalog',
          text: '<p>Curated selections chosen by our editorial team, spanning genres and eras.</p>',
          imagePosition: 'left',
          imageWidth: '40',
        },
      },
      {
        id: uid('products'),
        type: 'product-grid',
        visible: true,
        settings: {
          heading: 'Full Catalog',
          columns: 4,
          productsPerPage: '24',
          enableFilters: true,
          enableSort: true,
          enableSearch: true,
          showPrice: true,
          showRating: true,
          showAddToCart: true,
          showDiscountBadge: true,
          paginationType: 'numbered',
          viewMode: 'grid',
          cardSize: 'medium',
        },
      },
      {
        id: uid('rich-text'),
        type: 'rich-text',
        visible: true,
        settings: {
          content: '<h3>Our Mission</h3><p>We believe in the power of the written word to inspire, educate, and transform. Every selection in our catalog is chosen with care and consideration.</p>',
          alignment: 'center',
          maxWidth: 'medium',
          paddingY: 64,
        },
      },
      {
        id: uid('newsletter'),
        type: 'newsletter',
        visible: true,
        settings: {
          heading: 'Get Our Newsletter',
          subtext: 'New titles, author interviews, and exclusive offers — delivered weekly.',
          buttonText: 'Subscribe',
          style: 'card',
        },
      },
    ],
    product: [
      {
        id: uid('related'),
        type: 'featured-collection',
        visible: true,
        settings: {
          heading: 'Similar Titles',
          productsPerRow: 4,
          maxProducts: 4,
          showPrice: true,
          showRating: true,
          showAddToCart: true,
        },
      },
    ],
    collection: [
      {
        id: uid('coll-grid'),
        type: 'product-grid',
        visible: true,
        settings: {
          columns: 4,
          productsPerPage: '24',
          enableFilters: true,
          enableSort: true,
          showPrice: true,
          showRating: true,
          showAddToCart: true,
          paginationType: 'numbered',
        },
      },
    ],
  },

  globalSections: {
    footer: {
      id: uid('footer'),
      type: 'footer',
      visible: true,
      settings: {
        showSocialLinks: true,
        showPaymentIcons: true,
        copyrightText: '© {year} {shopName}. All rights reserved.',
        showPoweredBy: true,
        columns: 3,
      },
    },
  },

  theme: {
    colors: {
      primary: '#92400e',
      secondary: '#78716c',
      accent: '#b45309',
      background: '#faf5ef',
      surface: '#ffffff',
      text: '#1c1917',
      textMuted: '#78716c',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Source Serif 4',
      baseSize: 17,
      headingWeight: 700,
      bodyWeight: 400,
      lineHeight: 1.75,
    },
    layout: {
      maxWidth: 1200,
      borderRadius: 'sm',
      cardStyle: 'bordered',
      spacing: 'spacious',
      productImageRatio: '3:4',
    },
    effects: {
      animations: false,
      parallax: false,
      darkMode: false,
      glassmorph: false,
    },
  },

  supportedSections: [
    'hero', 'featured-collection', 'product-grid', 'collection-list',
    'rich-text', 'image-with-text', 'video', 'testimonials',
    'newsletter', 'multicolumn', 'collapsible-content',
    'social-links', 'footer',
  ],
  requiredSections: ['product-grid'],
};

registerTemplate(editorialTemplate);
export default editorialTemplate;
