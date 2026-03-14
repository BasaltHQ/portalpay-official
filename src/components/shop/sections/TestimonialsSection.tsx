'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function TestimonialsSection({ sectionConfig, reviews, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const heading = s.heading || 'Customer Reviews';
  const style = s.style || 'cards';
  const maxReviews = s.maxReviews || 6;
  const showRating = s.showRating !== false;

  // Use real reviews when source is 'auto' or 'both'
  const autoReviews = (s.source !== 'manual' ? reviews.slice(0, maxReviews) : []).map((r: any) => ({
    quote: r.text || r.comment || r.content || '',
    author: r.name || r.author || 'Customer',
    rating: r.rating || 5,
  }));

  // Manual blocks
  const manualReviews = (s.source !== 'auto' ? (sectionConfig.blocks || []) : []).map(b => ({
    quote: b.settings.quote || '',
    author: b.settings.author || '',
    rating: b.settings.rating || 5,
  }));

  const allReviews = [...autoReviews, ...manualReviews].slice(0, maxReviews);
  if (allReviews.length === 0) return null;

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <section style={{ maxWidth: 'var(--tmpl-max-width, 1200px)', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>{heading}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: style === 'minimal' ? '1fr' : `repeat(auto-fill, minmax(280px, 1fr))`, gap: '1rem' }}>
        {allReviews.map((review, i) => (
          <div key={i} style={{
            padding: '1.25rem',
            backgroundColor: style === 'minimal' ? 'transparent' : 'var(--tmpl-surface)',
            borderRadius: 'var(--tmpl-border-radius)',
            border: style === 'cards' ? '1px solid rgba(255,255,255,0.1)' : 'none',
            borderBottom: style === 'minimal' ? '1px solid rgba(255,255,255,0.05)' : undefined,
          }}>
            {showRating && <div style={{ color: 'var(--tmpl-accent, #f59e0b)', fontSize: '0.9rem', marginBottom: '0.5rem', letterSpacing: 2 }}>{stars(review.rating)}</div>}
            <p style={{ color: 'var(--tmpl-text)', fontSize: '0.9rem', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '0.75rem' }}>&ldquo;{review.quote}&rdquo;</p>
            <p style={{ color: 'var(--tmpl-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>— {review.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
