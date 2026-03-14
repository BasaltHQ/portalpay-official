'use client';
import React, { useState } from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function ContactFormSection({ sectionConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return (
    <section style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--tmpl-primary)', fontWeight: 600, fontSize: '1.1rem' }}>{s.successMessage || 'Thank you!'}</p>
    </section>
  );

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.6rem 0.75rem', backgroundColor: 'var(--tmpl-surface)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--tmpl-border-radius)', color: 'var(--tmpl-text)', fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem' };

  return (
    <section style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1.5rem', backgroundColor: s.backgroundColor || undefined }}>
      {s.heading && <h2 style={{ fontFamily: 'var(--tmpl-heading-font)', fontWeight: theme.typography.headingWeight, fontSize: '1.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>{s.heading}</h2>}
      {s.description && <p style={{ color: 'var(--tmpl-text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>{s.description}</p>}
      <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
        <input type="text" placeholder="Name" required style={inputStyle} />
        <input type="email" placeholder="Email" required style={inputStyle} />
        {s.showPhone && <input type="tel" placeholder="Phone" style={inputStyle} />}
        {s.showSubject !== false && <input type="text" placeholder="Subject" style={inputStyle} />}
        <textarea placeholder="Message" required rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
        <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--tmpl-primary)', color: '#fff', border: 'none', borderRadius: 'var(--tmpl-border-radius)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>{s.submitText || 'Send Message'}</button>
      </form>
    </section>
  );
}
