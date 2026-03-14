'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function ImageWithTextSection({ sectionConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const imagePos = s.imagePosition || 'left';
  const imageWidth = parseInt(s.imageWidth || '50');

  return (
    <section style={{ maxWidth: 'var(--tmpl-max-width, 1200px)', margin: '0 auto', padding: '3rem 1.5rem', backgroundColor: s.backgroundColor || undefined }}>
      <div style={{ display: 'flex', flexDirection: imagePos === 'right' ? 'row-reverse' : 'row', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: `0 0 ${imageWidth}%`, maxWidth: `${imageWidth}%`, minWidth: 280 }}>
          {s.image ? <img src={s.image} alt={s.heading || ''} style={{ width: '100%', borderRadius: 'var(--tmpl-border-radius)', display: 'block' }} /> : <div style={{ paddingBottom: '75%', backgroundColor: 'var(--tmpl-surface)', borderRadius: 'var(--tmpl-border-radius)' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          {s.heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.5rem', marginBottom: '1rem' }}>{s.heading}</h2>}
          {s.text && <div dangerouslySetInnerHTML={{ __html: s.text }} style={{ color: 'var(--tmpl-text-muted)', lineHeight: 1.7 }} />}
          {s.ctaText && <a href={s.ctaLink || '#'} style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--tmpl-primary)', color: '#fff', borderRadius: 'var(--tmpl-border-radius)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>{s.ctaText}</a>}
        </div>
      </div>
    </section>
  );
}
