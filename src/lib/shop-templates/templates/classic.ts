/**
 * Classic Template
 *
 * The default template — clean, professional, balanced layout.
 * Full-width hero with "Discover the Ultimate Collection" heading,
 * northern-lights-style background, and "SHOP NOW" CTA.
 * 3-column "FEATURED PRODUCTS" grid with product images, star ratings,
 * prices, and "ADD TO CART" buttons on dark cards.
 * "CUSTOMER REVIEWS" section with avatar + name + date + stars + text.
 * Compact footer with Shop, About, Contact, FAQ, Terms links.
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
      heading: 'Discover the Ultimate Collection',
      subheading: 'Premium gear for modern explorers. Elevate your everyday essentials.',
      height: 'large',
      textAlignment: 'center',
      ctaText: 'SHOP NOW',
      ctaLink: '#products',
      showLogo: true,
      showRating: false,
      showDescription: false,
      overlayOpacity: 40,
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
      id: uid('ann'),
      type: 'announcement',
      settings: { text: 'Free shipping on orders over $50!', icon: '*' },
    }],
  },
  {
    id: uid('featured'),
    type: 'featured-collection',
    visible: true,
    settings: {
      heading: 'FEATURED PRODUCTS',
      productsPerRow: 3,
      maxProducts: 6,
      showPrice: true,
      showRating: true,
      showAddToCart: true,
      viewAllLink: true,
    },
  },
  {
    id: uid('products'),
    type: 'product-grid',
    visible: true,
    settings: {
      heading: 'Our Products',
      columns: 3,
      productsPerPage: '12',
      enableFilters: true,
      enableSort: true,
      enableSearch: true,
      showPrice: true,
      showRating: true,
      showAddToCart: true,
      showDiscountBadge: true,
      paginationType: 'load-more',
      viewMode: 'grid',
      cardSize: 'medium',
    },
  },
  {
    id: uid('testimonials'),
    type: 'testimonials',
    visible: true,
    settings: {
      heading: 'CUSTOMER REVIEWS',
      source: 'auto',
      style: 'cards',
      maxReviews: 3,
      showRating: true,
      showDate: true,
    },
  },
  {
    id: uid('newsletter'),
    type: 'newsletter',
    visible: false,
    settings: {
      heading: 'Stay in the Loop',
      subtext: 'Subscribe to get special offers and updates.',
      buttonText: 'Subscribe',
      style: 'inline',
    },
  },
];

const productPageSections: SectionConfig[] = [
  {
    id: uid('product-hero'),
    type: 'hero',
    visible: false,
    settings: { height: 'small' },
  },
  {
    id: uid('product-related'),
    type: 'featured-collection',
    visible: true,
    settings: {
      heading: 'You May Also Like',
      productsPerRow: 3,
      maxProducts: 3,
      showPrice: true,
      showRating: true,
      showAddToCart: true,
    },
  },
  {
    id: uid('product-reviews'),
    type: 'testimonials',
    visible: true,
    settings: {
      heading: 'Customer Reviews',
      source: 'auto',
      style: 'cards',
      maxReviews: 6,
      showRating: true,
      showDate: true,
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
      showRating: true,
      showAddToCart: true,
      showDiscountBadge: true,
      paginationType: 'load-more',
    },
  },
];

const classicTemplate: ShopTemplate = {
  id: 'classic',
  name: 'Classic',
  description: 'A clean, balanced storefront — versatile and professional. The default template with hero, product grid, reviews, and footer.',
  thumbnail: '/templates/classic-preview.png',
  category: 'general',
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
        showPaymentIcons: true,
        copyrightText: '© {year} {shopName}. All rights reserved.',
        showPoweredBy: true,
        columns: 5,
        links: ['Shop', 'About', 'Contact', 'FAQ', 'Terms'],
      },
    },
  },

  theme: {
    colors: {
      primary: '#0ea5e9',
      secondary: '#22c55e',
      accent: '#f59e0b',
      background: '#0a0a0a',
      surface: '#111111',
      text: '#f5f5f5',
      textMuted: '#a3a3a3',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      baseSize: 16,
      headingWeight: 700,
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
    'hero', 'slideshow', 'featured-collection', 'product-grid',
    'collection-list', 'rich-text', 'image-with-text', 'video',
    'gallery', 'testimonials', 'newsletter', 'announcement-bar',
    'multicolumn', 'collapsible-content', 'contact-form',
    'countdown-timer', 'custom-html', 'social-links', 'footer',
  ],
  requiredSections: ['product-grid'],
};

registerTemplate(classicTemplate);
export default classicTemplate;
