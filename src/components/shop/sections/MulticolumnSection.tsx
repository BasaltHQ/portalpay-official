'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function MulticolumnSection({ sectionConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const columns = sectionConfig.blocks || [];
  const alignment = s.alignment || 'center';

  return (
    <section style={{ maxWidth: 'var(--tmpl-max-width, 1200px)', margin: '0 auto', padding: '3rem 1.5rem', backgroundColor: s.backgroundColor || undefined }}>
      {s.heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>{s.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.columnCount || 3}, 1fr)`, gap: '1.5rem' }}>
        {columns.map(col => (
          <div key={col.id} style={{ textAlign: alignment as any }}>
            {col.settings.image ? <img src={col.settings.image} alt={col.settings.heading || ''} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--tmpl-border-radius)', marginBottom: '1rem' }} /> : col.settings.icon && <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{col.settings.icon}</div>}
            {col.settings.heading && <h3 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{col.settings.heading}</h3>}
            {col.settings.text && <p style={{ color: 'var(--tmpl-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{col.settings.text}</p>}
            {col.settings.linkText && <a href={col.settings.linkUrl || '#'} style={{ color: 'var(--tmpl-primary)', fontSize: '0.85rem', marginTop: '0.5rem', display: 'inline-block' }}>{col.settings.linkText} →</a>}
          </div>
        ))}
      </div>
    </section>
  );
}
