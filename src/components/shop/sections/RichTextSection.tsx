'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function RichTextSection({ sectionConfig }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const content = s.content || '';
  const alignment = s.alignment || 'left';
  const maxWidthMap: Record<string, string> = { narrow: '640px', medium: '800px', wide: '1000px', full: '100%' };
  const maxWidth = maxWidthMap[s.maxWidth || 'medium'] || '800px';
  const paddingY = s.paddingY ?? 40;
  const bg = s.backgroundColor || 'transparent';

  return (
    <section style={{ backgroundColor: bg !== 'transparent' ? bg : undefined, padding: `${paddingY}px 1.5rem` }}>
      <div style={{ maxWidth, margin: '0 auto', textAlign: alignment as any }} dangerouslySetInnerHTML={{ __html: content }} />
    </section>
  );
}
