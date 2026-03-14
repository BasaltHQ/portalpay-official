'use client';
import React from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

export default function FooterSection({ sectionConfig, shopConfig, theme }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const linkColumns = sectionConfig.blocks || [];
  const year = new Date().getFullYear();
  const shopName = shopConfig?.name || 'Store';
  const copyright = (s.copyrightText || '© {year} {shopName}').replace('{year}', String(year)).replace('{shopName}', shopName);

  return (
    <footer style={{ backgroundColor: s.backgroundColor || 'var(--tmpl-surface)', padding: '3rem 1.5rem 1.5rem', marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ maxWidth: 'var(--tmpl-max-width, 1200px)', margin: '0 auto' }}>
        {linkColumns.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.columns || 3}, 1fr)`, gap: '2rem', marginBottom: '2rem' }}>
            {linkColumns.map(col => {
              const links = (col.settings.links || '').split('\n').map((l: string) => l.trim()).filter(Boolean).map((l: string) => {
                const [label, url] = l.split('|');
                return { label: label?.trim(), url: url?.trim() || '#' };
              });
              return (
                <div key={col.id}>
                  {col.settings.heading && <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--tmpl-text)' }}>{col.settings.heading}</h3>}
                  {links.map((link: any, i: number) => <a key={i} href={link.url} style={{ display: 'block', color: 'var(--tmpl-text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem', textDecoration: 'none' }}>{link.label}</a>)}
                </div>
              );
            })}
          </div>
        )}
        {s.showPaymentIcons && (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem', fontSize: '1.25rem', opacity: 0.5 }}>
            💳 🏦 🪙
          </div>
        )}
        <div style={{ textAlign: 'center', color: 'var(--tmpl-text-muted)', fontSize: '0.75rem' }}>
          <p>{copyright}</p>
          {s.showPoweredBy && <p style={{ marginTop: '0.25rem', opacity: 0.5 }}>Powered by PortalPay</p>}
        </div>
      </div>
    </footer>
  );
}
