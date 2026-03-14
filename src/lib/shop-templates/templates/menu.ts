/**
 * Menu Template
 * 
 * Restaurant/cafe design — category-grouped menu layout,
 * dietary tags, warm colors, and food-focused presentation.
 */

import { registerTemplate } from '../registry';
import type { ShopTemplate } from '../types';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const menuTemplate: ShopTemplate = {
  id: 'menu',
  name: 'Menu',
  description: 'Perfect for restaurants, cafes, and food businesses — category-grouped menu layout.',
  thumbnail: '/templates/menu-preview.png',
  category: 'restaurant',
  author: 'PortalPay',
  version: '1.0.0',

  pages: {
    home: [
      {
        id: uid('hero'),
        type: 'hero',
        visible: true,
        settings: {
          heading: 'THE GRILLEHOUSE',
          subheading: 'Crafted with passion. Fired to perfection.\nReservations & Online Ordering.',
          height: 'medium',
          textAlignment: 'center',
          ctaText: 'View Menu',
          ctaLink: '#products',
          showLogo: true,
          showRating: true,
          showDescription: true,
          overlayOpacity: 50,
        },
      },
      {
        id: uid('announcement'),
        type: 'announcement-bar',
        visible: true,
        settings: {
          dismissible: true,
          autoRotate: false,
        },
        blocks: [{
          id: uid('ann1'),
          type: 'announcement',
          settings: { text: 'Now accepting online orders! Free delivery on orders over $30.', icon: '' },
        }],
      },
      {
        id: uid('products'),
        type: 'product-grid',
        visible: true,
        settings: {
          heading: 'Our Menu',
          columns: 2,
          productsPerPage: '48',
          enableFilters: true,
          enableSort: false,
          enableSearch: true,
          showPrice: true,
          showRating: false,
          showAddToCart: true,
          showDiscountBadge: true,
          paginationType: 'load-more',
          viewMode: 'category',
          cardSize: 'medium',
        },
      },
      {
        id: uid('multicolumn'),
        type: 'multicolumn',
        visible: true,
        settings: {
          heading: 'Why Choose Us',
          columnCount: 3,
          alignment: 'center',
        },
        blocks: [
          {
            id: uid('col1'),
            type: 'column',
            settings: { icon: '1', heading: 'Fresh Ingredients', text: 'Locally sourced, organic ingredients' },
          },
          {
            id: uid('col2'),
            type: 'column',
            settings: { icon: '2', heading: 'Expert Chefs', text: 'Prepared by experienced culinary artists' },
          },
          {
            id: uid('col3'),
            type: 'column',
            settings: { icon: '3', heading: 'Fast Delivery', text: 'Hot food delivered to your door' },
          },
        ],
      },
      {
        id: uid('testimonials'),
        type: 'testimonials',
        visible: true,
        settings: {
          heading: 'What Our Guests Say',
          source: 'auto',
          style: 'carousel',
          maxReviews: 6,
          showRating: true,
        },
      },
      {
        id: uid('contact'),
        type: 'contact-form',
        visible: true,
        settings: {
          heading: 'Make a Reservation',
          description: 'Book your table or send us a message.',
          submitText: 'Send',
          showPhone: true,
          showSubject: false,
        },
      },
    ],
    product: [
      {
        id: uid('related'),
        type: 'featured-collection',
        visible: true,
        settings: {
          heading: 'You Might Also Enjoy',
          productsPerRow: 3,
          maxProducts: 3,
          showPrice: true,
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
          columns: 2,
          productsPerPage: '48',
          enableFilters: false,
          enableSort: false,
          showPrice: true,
          showAddToCart: true,
          viewMode: 'category',
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
        showPoweredBy: true,
        columns: 2,
      },
    },
  },

  theme: {
    colors: {
      primary: '#dc2626',
      secondary: '#ea580c',
      accent: '#f59e0b',
      background: '#1c1917',
      surface: '#292524',
      text: '#fafaf9',
      textMuted: '#a8a29e',
    },
    typography: {
      headingFont: 'Outfit',
      bodyFont: 'Inter',
      baseSize: 16,
      headingWeight: 600,
      bodyWeight: 400,
      lineHeight: 1.6,
    },
    layout: {
      maxWidth: 1200,
      borderRadius: 'md',
      cardStyle: 'bordered',
      spacing: 'comfortable',
      productImageRatio: '1:1',
    },
    effects: {
      animations: true,
      parallax: false,
      darkMode: true,
      glassmorph: false,
    },
  },

  supportedSections: [
    'hero', 'product-grid', 'featured-collection', 'rich-text',
    'image-with-text', 'gallery', 'testimonials', 'newsletter',
    'announcement-bar', 'multicolumn', 'collapsible-content',
    'contact-form', 'countdown-timer', 'social-links', 'footer',
    'video', 'map',
  ],
  requiredSections: ['product-grid'],
};

registerTemplate(menuTemplate);
export default menuTemplate;
