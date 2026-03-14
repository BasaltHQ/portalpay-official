'use client';
import React, { useState, useEffect, useCallback } from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function SlideshowSection({ sectionConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const slides = sectionConfig.blocks || [];
  const autoplay = s.autoplay !== false;
  const speed = (s.speed || 5) * 1000;
  const showArrows = s.showArrows !== false;
  const showDots = s.showDots !== false;
  const height = s.height || 'large';
  const [current, setCurrent] = useState(0);

  const heightMap: Record<string, string> = { small: '300px', medium: '450px', large: '600px', fullscreen: '100vh' };

  const next = useCallback(() => setCurrent(p => (p + 1) % Math.max(slides.length, 1)), [slides.length]);
  const prev = useCallback(() => setCurrent(p => (p - 1 + slides.length) % Math.max(slides.length, 1)), [slides.length]);

  useEffect(() => {
    if (!autoplay || slides.length <= 1) return;
    const t = setInterval(next, speed);
    return () => clearInterval(t);
  }, [autoplay, speed, next, slides.length]);

  if (slides.length === 0) return <div style={{ height: heightMap[height], background: 'var(--tmpl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tmpl-text-muted)' }}>Add slides to your slideshow</div>;

  const slide = slides[current]?.settings || {};
  return (
    <section style={{ position: 'relative', height: heightMap[height] || '600px', overflow: 'hidden' }}>
      {slide.image && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${slide.image})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'opacity 0.6s' }} />}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: slide.textPosition === 'left' ? 'flex-start' : slide.textPosition === 'right' ? 'flex-end' : 'center', padding: '2rem' }}>
        <div style={{ textAlign: (slide.textPosition || 'center') as any, maxWidth: 600 }}>
          {slide.heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: 'clamp(1.5rem, 3vw, 3rem)', color: '#fff', marginBottom: '0.75rem' }}>{slide.heading}</h2>}
          {slide.subheading && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{slide.subheading}</p>}
          {slide.ctaText && <a href={slide.ctaLink || '#'} style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: 'var(--tmpl-primary)', color: '#fff', borderRadius: 'var(--tmpl-border-radius)', fontWeight: 600, textDecoration: 'none' }}>{slide.ctaText}</a>}
        </div>
      </div>
      {showArrows && slides.length > 1 && (<>
        <button onClick={prev} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 18 }}>‹</button>
        <button onClick={next} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 3, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 18 }}>›</button>
      </>)}
      {showDots && slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: 8 }}>
          {slides.map((_, i) => <button key={i} onClick={() => setCurrent(i)} style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', backgroundColor: i === current ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />)}
        </div>
      )}
    </section>
  );
}
