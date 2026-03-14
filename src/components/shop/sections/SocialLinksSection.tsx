'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

const platformIcons: Record<string, string> = {
  instagram: '📷', twitter: '𝕏', facebook: '📘', tiktok: '🎵',
  youtube: '▶️', linkedin: '💼', pinterest: '📌', discord: '💬',
  telegram: '✈️', website: '🌐',
};

export default function SocialLinksSection({ sectionConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const platforms = sectionConfig.blocks || [];
  const size = s.size === 'large' ? '2.5rem' : s.size === 'small' ? '1.5rem' : '2rem';
  const isButtons = s.style === 'buttons';

  return (
    <section style={{ textAlign: (s.alignment || 'center') as any, padding: '2rem 1.5rem' }}>
      {s.heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.25rem', marginBottom: '1rem' }}>{s.heading}</h2>}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: s.alignment === 'left' ? 'flex-start' : s.alignment === 'right' ? 'flex-end' : 'center', flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <a key={p.id} href={p.settings.url || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: isButtons ? '0.5rem 1rem' : '0.5rem', fontSize: size, backgroundColor: isButtons ? 'var(--tmpl-surface)' : 'transparent', border: isButtons ? '1px solid rgba(255,255,255,0.15)' : 'none', borderRadius: 'var(--tmpl-border-radius)', textDecoration: 'none', color: 'var(--tmpl-text)', transition: 'opacity 0.2s' }}>
            <span>{platformIcons[p.settings.platform] || '🔗'}</span>
            {isButtons && <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{p.settings.platform}</span>}
          </a>
        ))}
      </div>
    </section>
  );
}
