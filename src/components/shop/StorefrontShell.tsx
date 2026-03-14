'use client';

/**
 * StorefrontShell — Persistent chrome around Advanced-mode shop pages.
 * 
 * Provides top navigation (logo, store name, nav menu, search, cart),
 * mobile drawer, and a slot for the TemplateRenderer content.
 */

import React, { useState } from 'react';

interface StorefrontShellProps {
  shopConfig: any;
  navigation?: any;
  cartItemCount?: number;
  onCartClick?: () => void;
  onSearchClick?: () => void;
  onNavigate?: (path: string) => void;
  children: React.ReactNode;
}

export default function StorefrontShell({
  shopConfig,
  navigation,
  cartItemCount = 0,
  onCartClick,
  onSearchClick,
  onNavigate,
  children,
}: StorefrontShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cfg = shopConfig || {};
  const theme = cfg.theme || {};
  const logoUrl = theme.brandLogoUrl;
  const shopName = cfg.name || 'Store';
  const navItems = navigation?.items || [];

  return (
    <div className="storefront-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--tmpl-bg, #0a0a0a)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--tmpl-max-width, 1200px)',
            margin: '0 auto',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Logo + Name */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => onNavigate?.('/')}
          >
            {logoUrl && (
              <img
                src={logoUrl}
                alt={shopName}
                style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 4 }}
              />
            )}
            <span
              style={{
                fontFamily: 'var(--tmpl-heading-font, inherit)',
                fontWeight: 600,
                fontSize: '1.1rem',
                color: 'var(--tmpl-text, #fff)',
              }}
            >
              {shopName}
            </span>
          </div>

          {/* Center: Navigation links (desktop) */}
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }} className="storefront-nav-desktop">
            {navItems.map((item: any) => (
              <a
                key={item.id}
                href={item.target || '#'}
                onClick={(e) => {
                  if (item.type !== 'link') {
                    e.preventDefault();
                    onNavigate?.(item.target || '/');
                  }
                }}
                style={{
                  color: 'var(--tmpl-text-muted, #999)',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right: Search + Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={onSearchClick}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--tmpl-text-muted, #999)',
                cursor: 'pointer',
                fontSize: '1.1rem',
              }}
              aria-label="Search"
            >
              🔍
            </button>
            <button
              onClick={onCartClick}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--tmpl-text, #fff)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                position: 'relative',
              }}
              aria-label="Cart"
            >
              🛒
              {cartItemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    backgroundColor: 'var(--tmpl-primary, #0ea5e9)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Hamburger for mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--tmpl-text, #fff)',
                cursor: 'pointer',
                fontSize: '1.25rem',
                display: 'none', // Shown via media query
              }}
              className="storefront-hamburger"
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 280,
              height: '100%',
              backgroundColor: 'var(--tmpl-bg, #0a0a0a)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              padding: '1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--tmpl-text)', cursor: 'pointer', fontSize: '1.5rem', marginBottom: '1rem' }}
            >
              ×
            </button>
            {navItems.map((item: any) => (
              <a
                key={item.id}
                href={item.target || '#'}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '0.75rem 0',
                  color: 'var(--tmpl-text, #fff)',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .storefront-nav-desktop { display: none !important; }
          .storefront-hamburger { display: block !important; }
        }
      `}</style>
    </div>
  );
}
