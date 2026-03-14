/**
 * Portfolio Template
 * 
 * Freelancer/services design — project showcase, skills display,
 * testimonials-forward, professional aesthetic.
 */

import { registerTemplate } from '../registry';
import type { ShopTemplate } from '../types';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const portfolioTemplate: ShopTemplate = {
  id: 'portfolio',
  name: 'Portfolio',
  description: 'Showcase your work and services — ideal for freelancers, agencies, and creatives.',
  thumbnail: '/templates/portfolio-preview.png',
  category: 'services',
  author: 'PortalPay',
  version: '1.0.0',

  pages: {
    home: [
      {
        id: uid('hero'),
        type: 'hero',
        visible: true,
        settings: {
          heading: 'PORTFOLIO: SHOWCASE & SHOP',
          subheading: 'A curated gallery of creative works, art prints, and handmade pieces.',
          height: 'medium',
          textAlignment: 'left',
          ctaText: 'View Services',
          ctaLink: '#products',
          showLogo: true,
          showRating: true,
          showDescription: true,
          overlayOpacity: 60,
        },
      },
      {
        id: uid('multicolumn'),
        type: 'multicolumn',
        visible: true,
        settings: {
          heading: 'What I Do',
          columnCount: 3,
          alignment: 'center',
        },
        blocks: [
          {
            id: uid('col1'),
            type: 'column',
            settings: { icon: '1', heading: 'Design', text: 'Beautiful, functional designs' },
          },
          {
            id: uid('col2'),
            type: 'column',
            settings: { icon: '2', heading: 'Development', text: 'Clean, performant code' },
          },
          {
            id: uid('col3'),
            type: 'column',
            settings: { icon: '3', heading: 'Strategy', text: 'Data-driven solutions' },
          },
        ],
      },
      {
        id: uid('gallery'),
        type: 'gallery',
        visible: true,
        settings: {
          heading: 'Recent Work',
          columns: 3,
          aspectRatio: '4:3',
          enableLightbox: true,
          gap: 8,
        },
      },
      {
        id: uid('products'),
        type: 'product-grid',
        visible: true,
        settings: {
          heading: 'Services & Packages',
          columns: 3,
          productsPerPage: '12',
          enableFilters: true,
          enableSort: false,
          showPrice: true,
          showRating: true,
          showAddToCart: true,
          showDiscountBadge: false,
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
          heading: 'Client Reviews',
          source: 'auto',
          style: 'cards',
          maxReviews: 6,
          showRating: true,
          showDate: true,
        },
      },
      {
        id: uid('contact'),
        type: 'contact-form',
        visible: true,
        settings: {
          heading: 'Let\'s Work Together',
          description: 'Tell me about your project and I\'ll get back to you within 24 hours.',
          submitText: 'Send Inquiry',
          showPhone: false,
          showSubject: true,
        },
      },
    ],
    product: [
      {
        id: uid('related'),
        type: 'featured-collection',
        visible: true,
        settings: {
          heading: 'Other Services',
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
          columns: 3,
          productsPerPage: '12',
          enableFilters: true,
          showPrice: true,
          showAddToCart: true,
          cardSize: 'large',
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
      primary: '#3b82f6',
      secondary: '#06b6d4',
      accent: '#8b5cf6',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
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
      borderRadius: 'lg',
      cardStyle: 'glass',
      spacing: 'comfortable',
      productImageRatio: '16:9',
    },
    effects: {
      animations: true,
      parallax: false,
      darkMode: true,
      glassmorph: true,
    },
  },

  supportedSections: [
    'hero', 'product-grid', 'featured-collection', 'rich-text',
    'image-with-text', 'video', 'gallery', 'testimonials',
    'newsletter', 'multicolumn', 'collapsible-content',
    'contact-form', 'social-links', 'footer', 'custom-html',
  ],
  requiredSections: ['product-grid'],
};

registerTemplate(portfolioTemplate);
export default portfolioTemplate;
