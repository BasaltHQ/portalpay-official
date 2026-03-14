'use client';

/**
 * SectionSwitch — Dynamic dispatch component.
 * 
 * Maps SectionConfig.type → lazy-loaded React component.
 * This is the single point where new section components are registered.
 */

import React, { Suspense, lazy } from 'react';
import type { SectionRenderProps } from '../sections/SectionRenderProps';
import type { ShopSectionType } from '@/lib/shop-templates/types';

// Lazy-load all section components for code splitting
const sectionComponents: Record<ShopSectionType, React.LazyExoticComponent<React.ComponentType<SectionRenderProps>>> = {
  'hero': lazy(() => import('../sections/HeroSection')),
  'slideshow': lazy(() => import('../sections/SlideshowSection')),
  'featured-collection': lazy(() => import('../sections/FeaturedCollectionSection')),
  'product-grid': lazy(() => import('../sections/ProductGridSection')),
  'collection-list': lazy(() => import('../sections/CollectionListSection')),
  'rich-text': lazy(() => import('../sections/RichTextSection')),
  'image-with-text': lazy(() => import('../sections/ImageWithTextSection')),
  'video': lazy(() => import('../sections/VideoSection')),
  'gallery': lazy(() => import('../sections/GallerySection')),
  'testimonials': lazy(() => import('../sections/TestimonialsSection')),
  'newsletter': lazy(() => import('../sections/NewsletterSection')),
  'announcement-bar': lazy(() => import('../sections/AnnouncementBarSection')),
  'multicolumn': lazy(() => import('../sections/MulticolumnSection')),
  'collapsible-content': lazy(() => import('../sections/CollapsibleContentSection')),
  'contact-form': lazy(() => import('../sections/ContactFormSection')),
  'countdown-timer': lazy(() => import('../sections/CountdownTimerSection')),
  'custom-html': lazy(() => import('../sections/CustomHtmlSection')),
  'social-links': lazy(() => import('../sections/SocialLinksSection')),
  'footer': lazy(() => import('../sections/FooterSection')),
  // Placeholder mappings for future sections
  'map': lazy(() => import('../sections/PlaceholderSection')),
  'brand-list': lazy(() => import('../sections/PlaceholderSection')),
  'before-after': lazy(() => import('../sections/PlaceholderSection')),
};

interface SectionSwitchProps extends SectionRenderProps {}

function SectionLoadingFallback() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.3 }}>
      <div style={{ width: 24, height: 24, margin: '0 auto', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

export default function SectionSwitch(props: SectionSwitchProps) {
  const { sectionConfig } = props;
  const SectionComponent = sectionComponents[sectionConfig.type];

  if (!SectionComponent) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div style={{ padding: '1rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, margin: '1rem 0', textAlign: 'center', color: '#888', fontSize: 12 }}>
          Unknown section type: <code>{sectionConfig.type}</code>
        </div>
      );
    }
    return null;
  }

  return (
    <Suspense fallback={<SectionLoadingFallback />}>
      <SectionComponent {...props} />
    </Suspense>
  );
}
