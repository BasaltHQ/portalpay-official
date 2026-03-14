'use client';
import React, { useState, useEffect, useCallback } from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function AnnouncementBarSection({ sectionConfig }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const announcements = sectionConfig.blocks || [];
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const next = useCallback(() => setCurrent(p => (p + 1) % Math.max(announcements.length, 1)), [announcements.length]);

  useEffect(() => {
    if (!s.autoRotate || announcements.length <= 1) return;
    const t = setInterval(next, (s.rotateSpeed || 5) * 1000);
    return () => clearInterval(t);
  }, [s.autoRotate, s.rotateSpeed, next, announcements.length]);

  if (dismissed || announcements.length === 0) return null;
  const ann = announcements[current]?.settings || {};

  return (
    <div style={{ backgroundColor: s.backgroundColor || 'var(--tmpl-primary)', color: s.textColor || '#fff', padding: '0.5rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
      {ann.icon && <span>{ann.icon}</span>}
      {ann.link ? <a href={ann.link} style={{ color: 'inherit', textDecoration: 'underline' }}>{ann.text}</a> : <span>{ann.text}</span>}
      {s.dismissible && <button onClick={() => setDismissed(true)} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}>×</button>}
    </div>
  );
}
