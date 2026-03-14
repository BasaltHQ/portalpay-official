'use client';
import React, { useState, useEffect } from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function CountdownTimerSection({ sectionConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const targetDate = s.targetDate ? new Date(s.targetDate).getTime() : 0;
  const [timeLeft, setTimeLeft] = useState(Math.max(0, targetDate - Date.now()));

  useEffect(() => {
    if (!targetDate) return;
    const t = setInterval(() => setTimeLeft(Math.max(0, targetDate - Date.now())), 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  const expired = timeLeft <= 0 && targetDate > 0;
  const d = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft % 86400000) / 3600000);
  const m = Math.floor((timeLeft % 3600000) / 60000);
  const sec = Math.floor((timeLeft % 60000) / 1000);

  const boxStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: 'var(--tmpl-surface)', borderRadius: 'var(--tmpl-border-radius)', minWidth: 80 };

  return (
    <section style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: s.backgroundColor || undefined }}>
      {s.heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.5rem', marginBottom: '1.5rem' }}>{s.heading}</h2>}
      {expired ? (
        <p style={{ fontSize: '1.1rem', color: 'var(--tmpl-text-muted)' }}>{s.expiredMessage || 'This offer has ended!'}</p>
      ) : !targetDate ? (
        <p style={{ color: 'var(--tmpl-text-muted)' }}>Set a target date</p>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['Days', d], ['Hours', h], ['Min', m], ['Sec', sec]].map(([label, val]) => (
            <div key={label as string} style={boxStyle}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--tmpl-primary)', fontVariantNumeric: 'tabular-nums' }}>{String(val).padStart(2, '0')}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--tmpl-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
            </div>
          ))}
        </div>
      )}
      {s.ctaText && !expired && <a href={s.ctaLink || '#'} style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 2rem', backgroundColor: 'var(--tmpl-primary)', color: '#fff', borderRadius: 'var(--tmpl-border-radius)', fontWeight: 600, textDecoration: 'none' }}>{s.ctaText}</a>}
    </section>
  );
}
