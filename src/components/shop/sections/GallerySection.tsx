'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function GallerySection({ sectionConfig }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const images = sectionConfig.blocks || [];
  const columns = s.columns || 3;
  const gap = s.gap ?? 8;
  const ratioMap: Record<string, string> = { '1:1': '100%', '3:4': '133%', '4:3': '75%', natural: 'auto' };
  const paddingBottom = ratioMap[s.aspectRatio || '1:1'] || '100%';

  return (
    <section style={{ maxWidth: 'var(--tmpl-max-width, 1200px)', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {s.heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>{s.heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
        {images.map((block) => (
          <div key={block.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--tmpl-border-radius)', backgroundColor: 'var(--tmpl-surface)' }}>
            {s.aspectRatio !== 'natural' ? (
              <div style={{ paddingBottom, position: 'relative' }}>
                {block.settings.image && <img src={block.settings.image} alt={block.settings.caption || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
            ) : (
              block.settings.image && <img src={block.settings.image} alt={block.settings.caption || ''} style={{ width: '100%', display: 'block' }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
