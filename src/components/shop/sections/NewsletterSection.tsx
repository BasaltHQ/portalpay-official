'use client';
import React, { useState } from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function NewsletterSection({ sectionConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const style = s.style || 'inline';

  const content = (
    <>
      <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.heading || 'Stay in the Loop'}</h2>
      {s.subtext && <p style={{ color: 'var(--tmpl-text-muted)', marginBottom: '1.25rem', maxWidth: 500, margin: '0 auto 1.25rem' }}>{s.subtext}</p>}
      {submitted ? (
        <p style={{ color: 'var(--tmpl-primary)', fontWeight: 600 }}>{s.successMessage || 'Thank you!'}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: style === 'stacked' ? 'column' : 'row', gap: '0.5rem', maxWidth: 480, margin: '0 auto' }}>
          <input type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, padding: '0.6rem 1rem', backgroundColor: 'var(--tmpl-surface)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--tmpl-border-radius)', color: 'var(--tmpl-text)', fontSize: '0.9rem', outline: 'none' }} />
          <button onClick={() => { if (email) setSubmitted(true); }} style={{ padding: '0.6rem 1.5rem', backgroundColor: 'var(--tmpl-primary)', color: '#fff', border: 'none', borderRadius: 'var(--tmpl-border-radius)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>{s.buttonText || 'Subscribe'}</button>
        </div>
      )}
    </>
  );

  return (
    <section style={{ textAlign: 'center', padding: style === 'card' ? '0 1.5rem 3rem' : '3rem 1.5rem', backgroundColor: s.backgroundColor || undefined }}>
      {style === 'card' ? (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '2.5rem', backgroundColor: 'var(--tmpl-surface)', borderRadius: 'var(--tmpl-border-radius)', border: '1px solid rgba(255,255,255,0.1)' }}>{content}</div>
      ) : content}
    </section>
  );
}
