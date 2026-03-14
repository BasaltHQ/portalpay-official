/**
 * Boutique Template
 * 
 * Luxury retail design — serif typography, elegant dark theme,
 * wide product imagery, and premium aesthetics.
 */

import { registerTemplate } from '../registry';
import type { ShopTemplate, SectionConfig } from '../types';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const boutiqueTemplate: ShopTemplate = {
  id: 'boutique',
  name: 'Boutique',
  description: 'Elegant luxury aesthetic — perfect for fashion, jewelry, and premium brands.',
  thumbnail: '/templates/boutique-preview.png',
  category: 'retail',
  author: 'PortalPay',
  version: '1.0.0',

  pages: {
    home: [
      {
        id: uid('hero'),
        type: 'hero',
        visible: true,
        settings: {
          heading: 'THE ART OF ELEGANCE',
          subheading: 'Curated luxury for the discerning collector.\nTimeless pieces, exquisite craftsmanship.',
          height: 'large',
          textAlignment: 'center',
          ctaText: 'Explore Collection',
          ctaLink: '#products',
          showLogo: false,
          showRating: false,
          showDescription: true,
          overlayOpacity: 30,
        },
      },
      {
        id: uid('collection-list'),
        type: 'collection-list',
        visible: true,
        settings: {
          heading: 'Shop by Category',
          columns: 3,
          imageRatio: '3:4',
          showTitle: true,
          showProductCount: false,
          titlePosition: 'overlay',
        },
      },
      {
        id: uid('featured'),
        type: 'featured-collection',
        visible: true,
        settings: {
          heading: 'New Arrivals',
          productsPerRow: 4,
          maxProducts: 8,
          showPrice: true,
          showRating: false,
          showAddToCart: false,
          viewAllLink: true,
        },
      },
      {
        id: uid('image-text'),
        type: 'image-with-text',
        visible: true,
        settings: {
          heading: 'Crafted with Care',
          text: '<p>Each piece is carefully selected to bring you the finest quality and timeless elegance.</p>',
          imagePosition: 'right',
          imageWidth: '60',
        },
      },
      {
        id: uid('products'),
        type: 'product-grid',
        visible: true,
        settings: {
          heading: 'All Products',
          columns: 4,
          productsPerPage: '16',
          enableFilters: true,
          enableSort: true,
          showPrice: true,
          showRating: false,
          showAddToCart: false,
          showDiscountBadge: true,
          paginationType: 'numbered',
          viewMode: 'grid',
          cardSize: 'medium',
        },
      },
      {
        id: uid('newsletter'),
        type: 'newsletter',
        visible: true,
        settings: {
          heading: 'Join Our World',
          subtext: 'Be the first to know about new collections and exclusive offers.',
          buttonText: 'Join',
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
          heading: 'Complete the Look',
          productsPerRow: 4,
          maxProducts: 4,
          showPrice: true,
          showAddToCart: false,
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
          productsPerPage: '16',
          enableFilters: true,
          enableSort: true,
          showPrice: true,
          showRating: false,
          showAddToCart: false,
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
        copyrightText: '© {year} {shopName}',
        showPoweredBy: false,
        columns: 4,
      },
    },
  },

  theme: {
    colors: {
      primary: '#b8860b',
      secondary: '#8b7355',
      accent: '#d4af37',
      background: '#0c0c0c',
      surface: '#1a1a1a',
      text: '#e8e0d4',
      textMuted: '#8b8178',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Lato',
      baseSize: 16,
      headingWeight: 400,
      bodyWeight: 300,
      lineHeight: 1.7,
    },
    layout: {
      maxWidth: 1400,
      borderRadius: 'none',
      cardStyle: 'flat',
      spacing: 'spacious',
      productImageRatio: '3:4',
    },
    effects: {
      animations: true,
      parallax: false,
      darkMode: true,
      glassmorph: false,
    },
  },

  supportedSections: [
    'hero', 'slideshow', 'featured-collection', 'product-grid',
    'collection-list', 'rich-text', 'image-with-text', 'video',
    'gallery', 'testimonials', 'newsletter', 'announcement-bar',
    'multicolumn', 'collapsible-content', 'social-links', 'footer',
  ],
  requiredSections: ['product-grid'],
};

registerTemplate(boutiqueTemplate);
export default boutiqueTemplate;
