'use client';
import React, { useState } from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function CollapsibleContentSection({ sectionConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const items = sectionConfig.blocks || [];
  const allowMultiple = s.allowMultiple;
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(s.openFirst && items[0] ? [items[0].id] : []));

  const toggle = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { if (!allowMultiple) next.clear(); next.add(id); }
      return next;
    });
  };

  const borderStyle = s.style === 'cards' ? { backgroundColor: 'var(--tmpl-surface)', borderRadius: 'var(--tmpl-border-radius)', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' } : s.style === 'minimal' ? { borderBottom: '1px solid rgba(255,255,255,0.08)' } : { border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' };

  return (
    <section style={{ maxWidth: 'var(--tmpl-max-width, 800px)', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {s.heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>{s.heading}</h2>}
      <div style={s.style === 'bordered' ? { border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tmpl-border-radius)', overflow: 'hidden' } : {}}>
        {items.map((item, i) => (
          <div key={item.id} style={s.style === 'bordered' ? (i < items.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.08)' } : {}) : borderStyle}>
            <button onClick={() => toggle(item.id)} style={{ width: '100%', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'var(--tmpl-text)', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', fontWeight: 600 }}>
              {item.settings.question || 'Question'}
              <span style={{ transform: openIds.has(item.id) ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '0.8rem' }}>▼</span>
            </button>
            {openIds.has(item.id) && (
              <div style={{ padding: '0 1.25rem 1rem', color: 'var(--tmpl-text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: item.settings.answer || '' }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
