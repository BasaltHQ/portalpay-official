/**
 * Showcase Template
 * 
 * Immersive, full-screen hero with gallery sections.
 * Maps to the current "maximalist" layout mode aesthetic.
 */

import { registerTemplate } from '../registry';
import type { ShopTemplate, SectionConfig } from '../types';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const showcaseTemplate: ShopTemplate = {
  id: 'showcase',
  name: 'Showcase',
  description: 'Bold and immersive — full-screen imagery with dramatic presentation.',
  thumbnail: '/templates/showcase-preview.png',
  category: 'general',
  author: 'PortalPay',
  version: '1.0.0',

  pages: {
    home: [
      {
        id: uid('slideshow'),
        type: 'slideshow',
        visible: true,
        settings: {
          autoplay: true,
          speed: 6,
          showArrows: true,
          showDots: true,
          height: 'fullscreen',
          transition: 'fade',
        },
        blocks: [
          {
            id: uid('slide1'),
            type: 'slide',
            settings: {
              heading: 'Discover Our Collection',
              subheading: 'Premium products for discerning customers',
              ctaText: 'Shop Now',
              ctaLink: '#products',
              textPosition: 'center',
            },
          },
        ],
      },
      {
        id: uid('featured'),
        type: 'featured-collection',
        visible: true,
        settings: {
          heading: 'Featured',
          productsPerRow: 3,
          maxProducts: 6,
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
          heading: 'Our Story',
          text: '<p>We believe in quality, craftsmanship, and creating products that make a difference.</p>',
          imagePosition: 'left',
          imageWidth: '50',
        },
      },
      {
        id: uid('gallery'),
        type: 'gallery',
        visible: true,
        settings: {
          heading: 'Lookbook',
          columns: 3,
          aspectRatio: '3:4',
          enableLightbox: true,
          gap: 4,
        },
      },
      {
        id: uid('products'),
        type: 'product-grid',
        visible: true,
        settings: {
          heading: 'All Products',
          columns: 3,
          productsPerPage: '12',
          enableFilters: true,
          enableSort: true,
          showPrice: true,
          showRating: true,
          showAddToCart: true,
          showDiscountBadge: true,
          paginationType: 'load-more',
          viewMode: 'grid',
          cardSize: 'large',
        },
      },
      {
        id: uid('testimonials'),
        type: 'testimonials',
        visible: true,
        settings: {
          heading: 'What People Are Saying',
          source: 'auto',
          style: 'carousel',
          maxReviews: 8,
          showRating: true,
        },
      },
    ],
    product: [
      {
        id: uid('related'),
        type: 'featured-collection',
        visible: true,
        settings: {
          heading: 'You Might Also Like',
          productsPerRow: 4,
          maxProducts: 4,
          showPrice: true,
          showAddToCart: true,
        },
      },
      {
        id: uid('reviews'),
        type: 'testimonials',
        visible: true,
        settings: {
          heading: 'Reviews',
          source: 'auto',
          style: 'cards',
          maxReviews: 6,
        },
      },
    ],
    collection: [
      {
        id: uid('coll-grid'),
        type: 'product-grid',
        visible: true,
        settings: {
          columns: 3,
          productsPerPage: '12',
          enableFilters: true,
          enableSort: true,
          showPrice: true,
          showRating: true,
          showAddToCart: true,
          paginationType: 'load-more',
          cardSize: 'large',
        },
      },
    ],
  },

  globalSections: {
    announcementBar: {
      id: uid('announcement'),
      type: 'announcement-bar',
      visible: true,
      settings: {
        dismissible: true,
        autoRotate: true,
        rotateSpeed: 5,
      },
      blocks: [{
        id: uid('ann1'),
        type: 'announcement',
        settings: { text: 'New arrivals every week — Free shipping on orders over $100', icon: '' },
      }],
    },
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
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#f59e0b',
      background: '#030712',
      surface: '#111827',
      text: '#f9fafb',
      textMuted: '#9ca3af',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      baseSize: 16,
      headingWeight: 700,
      bodyWeight: 400,
      lineHeight: 1.6,
    },
    layout: {
      maxWidth: 1600,
      borderRadius: 'lg',
      cardStyle: 'shadow',
      spacing: 'spacious',
      productImageRatio: '3:4',
    },
    effects: {
      animations: true,
      parallax: true,
      darkMode: true,
      glassmorph: true,
    },
  },

  supportedSections: [
    'hero', 'slideshow', 'featured-collection', 'product-grid',
    'collection-list', 'rich-text', 'image-with-text', 'video',
    'gallery', 'testimonials', 'newsletter', 'announcement-bar',
    'multicolumn', 'collapsible-content', 'contact-form',
    'countdown-timer', 'custom-html', 'social-links', 'footer',
    'brand-list', 'before-after',
  ],
  requiredSections: ['product-grid'],
};

registerTemplate(showcaseTemplate);
export default showcaseTemplate;
