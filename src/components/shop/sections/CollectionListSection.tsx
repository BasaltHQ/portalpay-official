'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function CollectionListSection({ sectionConfig, collections, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const heading = s.heading || 'Shop by Category';
  const columns = s.columns || 3;
  const imageRatio = s.imageRatio || '1:1';
  const titlePosition = s.titlePosition || 'below';
  const paddingBottom = imageRatio === '1:1' ? '100%' : imageRatio === '3:4' ? '133%' : '56.25%';

  return (
    <section style={{ maxWidth: 'var(--tmpl-max-width, 1200px)', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.5rem', marginBottom: '1.5rem' }}>{heading}</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1rem' }}>
        {(collections.length > 0 ? collections : [{ title: 'Collection 1', handle: '#' }, { title: 'Collection 2', handle: '#' }, { title: 'Collection 3', handle: '#' }]).map((coll: any, i: number) => (
          <div key={coll.handle || i} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--tmpl-border-radius)', cursor: 'pointer', backgroundColor: 'var(--tmpl-surface)' }}>
            <div style={{ paddingBottom, position: 'relative' }}>
              {coll.image && <img src={coll.image} alt={coll.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              {titlePosition === 'overlay' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', color: '#fff', fontWeight: 600, fontSize: '1.1rem', fontFamily: 'var(--tmpl-heading-font)' }}>{coll.title}</div>}
            </div>
            {titlePosition === 'below' && <div style={{ padding: '0.75rem', textAlign: 'center' }}><h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{coll.title}</h3></div>}
          </div>
        ))}
      </div>
    </section>
  );
}
