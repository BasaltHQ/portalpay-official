'use client';

import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

/** HeroSection — Full-width banner with heading, subtext, and CTA */
export default function HeroSection({ sectionConfig, shopConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const heading = s.heading || shopConfig?.name || 'Welcome';
  const subheading = s.subheading || shopConfig?.description || shopConfig?.bio || '';
  const bgImage = s.backgroundImage || shopConfig?.theme?.coverImageUrl || '';
  const overlayOpacity = (s.overlayOpacity ?? 40) / 100;
  const height = s.height || 'large';
  const textAlign = s.textAlignment || 'center';
  const ctaText = s.ctaText;
  const ctaLink = s.ctaLink || '#products';
  const showLogo = s.showLogo !== false;
  const showDescription = s.showDescription !== false;
  const logoUrl = shopConfig?.theme?.brandLogoUrl;

  const heightMap: Record<string, string> = {
    small: '300px',
    medium: '450px',
    large: '600px',
    fullscreen: '100vh',
  };

  return (
    <section
      className="hero-section"
      style={{
        position: 'relative',
        minHeight: heightMap[height] || '450px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        overflow: 'hidden',
        padding: '3rem 2rem',
      }}
    >
      {/* Background image */}
      {bgImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
      )}
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
          zIndex: 1,
        }}
      />
      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 'var(--tmpl-max-width, 1200px)',
          width: '100%',
          margin: '0 auto',
          textAlign: textAlign as any,
        }}
      >
        {showLogo && logoUrl && (
          <img
            src={logoUrl}
            alt={shopConfig?.name || 'Store'}
            style={{
              maxHeight: 80,
              maxWidth: 200,
              marginBottom: '1rem',
              objectFit: 'contain',
              display: textAlign === 'center' ? 'block' : 'inline-block',
              marginLeft: textAlign === 'center' ? 'auto' : 0,
              marginRight: textAlign === 'center' ? 'auto' : 0,
            }}
          />
        )}
        <h1
          style={{
            fontFamily: 'var(--tmpl-heading-font, inherit)',
            fontWeight: theme.typography.headingWeight,
            fontSize: 'clamp(1.8rem, 4vw, 3.5rem)',
            lineHeight: 1.2,
            marginBottom: '0.75rem',
            color: '#fff',
          }}
        >
          {heading}
        </h1>
        {showDescription && subheading && (
          <p
            style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              color: 'rgba(255,255,255,0.85)',
              maxWidth: textAlign === 'center' ? '600px' : '500px',
              margin: textAlign === 'center' ? '0 auto 1.5rem' : '0 0 1.5rem',
              lineHeight: 1.6,
            }}
          >
            {subheading}
          </p>
        )}
        {ctaText && (
          <a
            href={ctaLink}
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              backgroundColor: 'var(--tmpl-primary, #0ea5e9)',
              color: '#fff',
              borderRadius: 'var(--tmpl-border-radius, 8px)',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              cursor: 'pointer',
            }}
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
