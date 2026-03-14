'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function FeaturedCollectionSection({ sectionConfig, items, theme, onAddToCart, onSelectItem }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const heading = s.heading || 'Featured Products';
  const perRow = s.productsPerRow || 4;
  const maxProducts = s.maxProducts || 8;
  const showPrice = s.showPrice !== false;
  const showAddToCart = s.showAddToCart !== false;

  // For now, show first N items (collection filtering will come in Phase 2)
  const displayItems = items.slice(0, maxProducts);

  return (
    <section style={{ maxWidth: 'var(--tmpl-max-width, 1200px)', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.5rem' }}>{heading}</h2>
        {s.viewAllLink && <a href="#products" style={{ color: 'var(--tmpl-primary)', fontSize: '0.875rem', textDecoration: 'none' }}>View All →</a>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${perRow}, 1fr)`, gap: '1rem' }}>
        {displayItems.map(item => (
          <div key={item.id} onClick={() => onSelectItem(item)} style={{ backgroundColor: 'var(--tmpl-surface)', borderRadius: 'var(--tmpl-border-radius)', overflow: 'hidden', cursor: 'pointer', border: theme.layout.cardStyle === 'bordered' ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
            {item.images?.[0] && <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />}
            <div style={{ padding: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
              {showPrice && <span style={{ fontWeight: 700, color: 'var(--tmpl-primary)', fontSize: '1rem' }}>${item.priceUsd.toFixed(2)}</span>}
              {showAddToCart && <button onClick={(e) => { e.stopPropagation(); onAddToCart(item.id); }} style={{ display: 'block', width: '100%', marginTop: '0.5rem', padding: '0.4rem', backgroundColor: 'var(--tmpl-primary)', color: '#fff', border: 'none', borderRadius: 'var(--tmpl-border-radius)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Add to Cart</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
