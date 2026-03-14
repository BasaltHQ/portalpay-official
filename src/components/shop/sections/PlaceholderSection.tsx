'use client';

import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

/** PlaceholderSection — Used for sections not yet implemented (map, brand-list, before-after) */
export default function PlaceholderSection({ sectionConfig }: SectionRenderProps) {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      border: '1px dashed rgba(255,255,255,0.15)',
      borderRadius: 8,
      margin: '1rem auto',
      maxWidth: 'var(--tmpl-max-width, 1200px)',
      color: 'var(--tmpl-text-muted, #888)',
    }}>
      <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
        {sectionConfig.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Section
      </p>
      <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
        Coming soon
      </p>
    </div>
  );
}
