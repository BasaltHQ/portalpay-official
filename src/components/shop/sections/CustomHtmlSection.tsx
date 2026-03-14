'use client';
import React, { useId } from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function CustomHtmlSection({ sectionConfig }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const scopeId = useId().replace(/:/g, '-');
  const maxWidthMap: Record<string, string> = { narrow: '640px', medium: '800px', wide: '1000px', full: '100%' };
  const maxW = maxWidthMap[s.maxWidth || 'full'] || '100%';

  return (
    <section style={{ maxWidth: maxW, margin: '0 auto' }}>
      {s.css && <style>{`.custom-section-${scopeId} { ${s.css} }`}</style>}
      <div className={`custom-section-${scopeId}`} dangerouslySetInnerHTML={{ __html: s.html || '' }} />
    </section>
  );
}
