'use client';

/**
 * SectionPreview — Theme-aware visual preview renderers.
 *
 * Uses REAL inventory images from the shop when available.
 * Falls back to generative CSS mesh gradients (no stock photos).
 * Each template applies its own CSS filter (e.g. grayscale for Minimal).
 */

import React, { useMemo } from 'react';
import type { SectionConfig } from '@/lib/shop-templates/types';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

interface ThemeTypo {
  headingFont?: string;
  bodyFont?: string;
  headingWeight?: number;
  bodyWeight?: number;
  baseSize?: number;
  lineHeight?: number;
}

export interface ShopData {
  shopName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  items: any[];
}

export interface SectionPreviewProps {
  section: SectionConfig;
  isSelected: boolean;
  onClick: () => void;
  templateId?: string;
  shopData?: ShopData;
  theme?: {
    colors: ThemeColors;
    typography?: ThemeTypo;
  };
}

/* ══════════════════════════════════════
   Generative Mesh Gradient Placeholder
   ====================================== */

// Per-template color palettes for mesh gradients
const MESH_PALETTES: Record<string, string[][]> = {
  minimal: [
    ['#2a2a2a', '#3d3d3d', '#1a1a1a', '#333'],
    ['#3a3a3a', '#252525', '#404040', '#1f1f1f'],
    ['#2f2f2f', '#444', '#1e1e1e', '#353535'],
  ],
  classic: [
    ['#0f2027', '#203a43', '#2c5364', '#1a3a4a'],
    ['#1a1a2e', '#16213e', '#0f3460', '#1a365d'],
    ['#1b2838', '#27374D', '#1e3a5f', '#2c3e50'],
  ],
  boutique: [
    ['#2d1b00', '#4a2c0a', '#1a0f00', '#3d2810'],
    ['#1f1510', '#3a261a', '#0d0906', '#2c1f14'],
    ['#2a1a0e', '#462d18', '#1c1008', '#352312'],
  ],
  editorial: [
    ['#f5e6d3', '#e8d5c0', '#dfc8b0', '#f0dcc8'],
    ['#efe0cc', '#e2d0bb', '#d8c4aa', '#ebd8c3'],
    ['#f2e3d0', '#e5d3be', '#dcc6ae', '#eeddcb'],
  ],
  portfolio: [
    ['#0f172a', '#1e293b', '#1a2744', '#162032'],
    ['#0d1321', '#1b2740', '#132038', '#0a1020'],
    ['#111c30', '#1f2f4a', '#152540', '#0e1828'],
  ],
  showcase: [
    ['#030712', '#111827', '#0a0f1a', '#080d18'],
    ['#050a14', '#0f1724', '#070c16', '#0d1420'],
    ['#040810', '#10182a', '#080e1c', '#0c1322'],
  ],
  menu: [
    ['#1c1917', '#292524', '#1f1b18', '#2d2826'],
    ['#201d1a', '#2e2a27', '#1a1715', '#332f2c'],
    ['#1e1a17', '#2b2723', '#1c1916', '#302c28'],
  ],
};

const DEFAULT_PALETTE = MESH_PALETTES.classic;

// CSS filters per template for product images
const TEMPLATE_FILTERS: Record<string, string> = {
  minimal: 'saturate(0) brightness(0.85) contrast(1.1)',
  boutique: 'saturate(0.85) contrast(1.05)',
  editorial: 'saturate(0.9) brightness(1.05)',
  portfolio: 'none',
  classic: 'none',
  showcase: 'none',
  menu: 'none',
};

function MeshGradient({ seed, palette, className, style }: {
  seed: number;
  palette: string[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const bg = useMemo(() => {
    const s = seed;
    const p1 = `${20 + (s * 17) % 60}% ${20 + (s * 31) % 60}%`;
    const p2 = `${50 + (s * 23) % 40}% ${10 + (s * 41) % 70}%`;
    const p3 = `${10 + (s * 13) % 70}% ${60 + (s * 37) % 30}%`;
    const p4 = `${60 + (s * 19) % 30}% ${40 + (s * 29) % 50}%`;
    return [
      `radial-gradient(ellipse at ${p1}, ${palette[0]} 0%, transparent 55%)`,
      `radial-gradient(ellipse at ${p2}, ${palette[1]} 0%, transparent 55%)`,
      `radial-gradient(ellipse at ${p3}, ${palette[2] || palette[0]} 0%, transparent 45%)`,
      `radial-gradient(ellipse at ${p4}, ${palette[3] || palette[1]} 0%, transparent 50%)`,
    ].join(', ');
  }, [seed, palette]);

  return <div className={className} style={{ ...style, background: bg }} />;
}

/** Renders either a real product image or a mesh gradient fallback */
function ProductImage({ src, alt, seed, templateId, theme, className, style }: {
  src?: string;
  alt?: string;
  seed: number;
  templateId?: string;
  theme?: SectionPreviewProps['theme'];
  className?: string;
  style?: React.CSSProperties;
}) {
  const c = theme?.colors;
  const filter = TEMPLATE_FILTERS[templateId || ''] || 'none';
  const palettes = MESH_PALETTES[templateId || ''] || DEFAULT_PALETTE;
  const palette = palettes[seed % palettes.length];

  if (src) {
    return (
      <img
        src={src}
        alt={alt || ''}
        className={className}
        style={{ ...style, filter, objectFit: 'cover' }}
        loading="lazy"
      />
    );
  }

  // Mesh gradient fallback
  return <MeshGradient seed={seed} palette={palette} className={className} style={style} />;
}

/* ══════════════════════════════════════
   Mock product names (no images — just names/prices)
   ====================================== */

const TEMPLATE_PRODUCTS: Record<string, { name: string; price: string; rating: number }[]> = {
  minimal: [
    { name: 'Aethel Chair', price: '$1,250', rating: 5 },
    { name: 'Sola Vase', price: '$95', rating: 5 },
    { name: 'Dusk Candle', price: '$55', rating: 4 },
    { name: 'Linen Throw', price: '$190', rating: 5 },
    { name: 'Kanso Mirror', price: '$340', rating: 5 },
    { name: 'Form Bowl', price: '$78', rating: 4 },
  ],
  classic: [
    { name: 'Voyager Backpack', price: '$149.00', rating: 4.8 },
    { name: 'Chronograph Watch', price: '$199.00', rating: 4.8 },
    { name: 'Alpine Jacket', price: '$279.00', rating: 4.5 },
    { name: 'Studio Headphones', price: '$329.00', rating: 4.8 },
    { name: 'Aviator Sunglasses', price: '$119.00', rating: 4.5 },
    { name: 'Performance Sneakers', price: '$189.00', rating: 4.7 },
  ],
  boutique: [
    { name: 'Amber Necklace', price: '$4,950', rating: 5 },
    { name: 'Silk Gown', price: '$3,200', rating: 5 },
    { name: 'Rose Gold Cuff', price: '$1,800', rating: 5 },
    { name: 'Velvet Clutch', price: '$890', rating: 4 },
    { name: 'Diamond Earrings', price: '$2,400', rating: 5 },
    { name: 'Cashmere Wrap', price: '$650', rating: 5 },
  ],
  editorial: [
    { name: 'Astrid Boots', price: '$210', rating: 5 },
    { name: 'Silk Blouse', price: '$120', rating: 4 },
    { name: 'Gold Hoops', price: '$85', rating: 5 },
    { name: 'Velvet Gown', price: '$340', rating: 5 },
    { name: 'Pendant Necklace', price: '$65', rating: 4 },
    { name: 'Midnight Blazer', price: '$280', rating: 5 },
  ],
  portfolio: [
    { name: 'Nebula Dreams', price: '$450', rating: 5 },
    { name: 'Midnight Echoes', price: '$85', rating: 5 },
    { name: 'Ceramic Form #4', price: '$210', rating: 5 },
    { name: 'Forest Solitude', price: '$110', rating: 4 },
    { name: 'Handmade Sculpture', price: '$380', rating: 5 },
    { name: 'Abstract Study', price: '$175', rating: 5 },
  ],
  showcase: [
    { name: 'CHRONO X1 Watch', price: '$599.00', rating: 5 },
    { name: 'Aero Earbuds', price: '$28.00', rating: 4.8 },
    { name: 'Neo Backpack', price: '$29.90', rating: 4.5 },
    { name: 'Skymaster Drone', price: '$899.00', rating: 5 },
    { name: 'Smart Camera', price: '$449.00', rating: 4.8 },
    { name: 'Stealth Speaker', price: '$159.00', rating: 4.7 },
  ],
  menu: [
    { name: 'Smoked Pork Sliders', price: '$16', rating: 5 },
    { name: 'Signature Ribeye', price: '$36', rating: 5 },
    { name: 'Chocolate Lava Cake', price: '$14', rating: 5 },
    { name: 'Crispy Calamari', price: '$14', rating: 4 },
    { name: 'Pan-Seared Salmon', price: '$28', rating: 5 },
    { name: 'Truffle Pasta', price: '$24', rating: 5 },
  ],
};

const DEFAULT_PRODUCTS = TEMPLATE_PRODUCTS.classic;

interface ProductData { name: string; price: string; rating: number; img?: string }

function getProducts(templateId?: string, shopData?: ShopData): ProductData[] {
  // Real inventory items take priority
  if (shopData?.items && shopData.items.length > 0) {
    return shopData.items.map(it => ({
      name: it.name || 'Product',
      price: `$${(it.priceUsd ?? 0).toFixed(2)}`,
      rating: 4.5 + Math.random() * 0.5,
      img: (it.images && it.images.length > 0) ? it.images[0] : undefined,
    }));
  }
  // Template mock names (no images — mesh gradients used)
  return (TEMPLATE_PRODUCTS[templateId || ''] || DEFAULT_PRODUCTS).map(p => ({ ...p, img: undefined }));
}

const REVIEWS = [
  { name: 'Sarah J.', date: '3/14/2025', rating: 5, text: 'Absolutely love it! Sleek design and durable. Highly recommended.' },
  { name: 'Michael B.', date: '3/11/2025', rating: 5, text: 'Incredible quality. Perfect for daily use and travel.' },
  { name: 'Emily L.', date: '3/10/2025', rating: 4, text: 'Excellent quality and fast shipping! Great customer service.' },
];

/* ══════════════════════════════════════
   Template navbar configs
   ====================================== */

const TEMPLATE_NAVS: Record<string, { brand: string; links: string[] }> = {
  minimal:   { brand: 'MINIMAL', links: ['SHOP', 'CURATED', 'JOURNAL', 'ACCOUNT', 'CART (0)'] },
  classic:   { brand: 'AURORA', links: ['SHOP', 'COLLECTIONS', 'ABOUT', 'CONTACT'] },
  boutique:  { brand: 'AUREA', links: ['COLLECTIONS', 'JEWELRY', 'APPAREL', 'ARTISAN', 'JOURNAL'] },
  editorial: { brand: 'THE EDITORIAL', links: ['SHOP', 'STORIES', 'ARTICLES', 'MOSAIC', 'ABOUT'] },
  portfolio: { brand: 'Creative Pulse', links: ['HOME', 'PORTFOLIO', 'STORE', 'ABOUT', 'CONTACT'] },
  showcase:  { brand: 'Showcase', links: ['SHOP', 'COLLECTIONS', 'DEALS', 'ABOUT'] },
  menu:      { brand: 'THE GRILLEHOUSE', links: ['HOME', 'MENU', 'ORDER ONLINE', 'GALLERY', 'CONTACT'] },
};

/* ══════════════════════════════════════
   Helpers
   ====================================== */

function Stars({ rating, color }: { rating: number; color?: string }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 8, color: i <= Math.round(rating) ? (color || '#f59e0b') : '#374151' }}>&#9733;</span>
      ))}
      <span className="text-[7px] ml-0.5" style={{ color: color ? `${color}88` : '#9ca3af' }}>{rating}</span>
    </div>
  );
}

/* ══════════════════════════════════════
   Navbar Chrome
   ====================================== */

export function NavbarPreview({ templateId, theme, shopData }: { templateId?: string; theme?: SectionPreviewProps['theme']; shopData?: ShopData }) {
  const c = theme?.colors;
  const t = theme?.typography;
  const nav = TEMPLATE_NAVS[templateId || ''] || { brand: 'Store', links: ['Shop', 'About', 'Contact'] };
  const brandName = shopData?.shopName || nav.brand;
  const sep = templateId === 'minimal' ? ' / ' : '';

  return (
    <div className="flex items-center justify-between px-5 py-3 rounded-t-lg" style={{
      backgroundColor: c?.surface || '#111',
      borderBottom: `1px solid ${c?.text || '#fff'}10`,
    }}>
      {shopData?.logoUrl ? (
        <img src={shopData.logoUrl} alt={brandName} style={{ height: 20, objectFit: 'contain' }} />
      ) : (
        <p style={{
          color: c?.text || '#fff',
          fontFamily: t?.headingFont || 'Inter',
          fontWeight: t?.headingWeight || 600,
          letterSpacing: templateId === 'editorial' ? '0.05em' : '0.1em',
          fontSize: templateId === 'editorial' ? 14 : 11,
          margin: 0,
        }}>
          {brandName}
        </p>
      )}
      <div className="flex items-center gap-0">
        {nav.links.map((link, i) => (
          <React.Fragment key={link}>
            {sep && i > 0 && <span className="text-[8px]" style={{ color: c?.textMuted || '#666' }}>{sep}</span>}
            <span className={`text-[8px] ${sep ? '' : 'mx-2'}`} style={{ color: c?.textMuted || '#888', fontFamily: t?.bodyFont, letterSpacing: '0.05em' }}>
              {link}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Section Renderers
   ====================================== */

function HeroPreview({ section, theme, templateId }: { section: SectionConfig; theme?: SectionPreviewProps['theme']; templateId?: string }) {
  const s = section.settings;
  const c = theme?.colors;
  const t = theme?.typography;
  const align = s.textAlignment || 'center';
  const h = s.height === 'fullscreen' ? 260 : s.height === 'large' ? 200 : s.height === 'small' ? 110 : 150;
  const bgColor = c?.background || '#0a0a0a';
  const isMinimal = templateId === 'minimal';
  const isBoutique = templateId === 'boutique';

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ height: h, backgroundColor: bgColor }}>
      {s.overlayOpacity > 0 && <div className="absolute inset-0 bg-black" style={{ opacity: s.overlayOpacity / 100 }} />}
      <div className={`relative h-full flex flex-col justify-center px-8 ${
        align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left'
      }`}>
        <h2 style={{
          color: c?.text || '#fff',
          fontFamily: t?.headingFont || 'Inter',
          fontWeight: t?.headingWeight || 700,
          fontSize: isMinimal ? 24 : isBoutique ? 20 : 18,
          lineHeight: 1.1,
          letterSpacing: isMinimal ? '-0.01em' : isBoutique ? '0.02em' : 'normal',
          margin: 0,
        }}>
          {s.heading || 'Welcome to Our Store'}
        </h2>
        <p style={{
          color: c?.textMuted || '#9ca3af',
          fontFamily: t?.bodyFont || 'Inter',
          fontWeight: t?.bodyWeight || 400,
          fontSize: isMinimal ? 10 : 9,
          marginTop: 8,
          maxWidth: 280,
          lineHeight: 1.5,
          whiteSpace: 'pre-line' as const,
        }}>
          {s.subheading || 'Discover amazing products'}
        </p>
        {s.ctaText && (
          <button style={{
            marginTop: 14,
            padding: '6px 20px',
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: '0.08em',
            borderRadius: isMinimal ? 0 : 4,
            backgroundColor: isMinimal ? 'transparent' : (c?.primary || '#10b981'),
            color: isMinimal ? (c?.text || '#fff') : '#fff',
            border: isMinimal ? `1px solid ${c?.textMuted || '#555'}` : 'none',
            cursor: 'default',
          }}>
            {s.ctaText}
          </button>
        )}
      </div>
    </div>
  );
}

function ProductGridPreview({ section, theme, templateId, shopData }: { section: SectionConfig; theme?: SectionPreviewProps['theme']; templateId?: string; shopData?: ShopData }) {
  const s = section.settings;
  const c = theme?.colors;
  const t = theme?.typography;
  const cols = Math.min(s.columns || 3, 4);
  const count = Math.min(parseInt(s.productsPerPage) || 6, 6);
  const products = getProducts(templateId, shopData).slice(0, count);

  return (
    <div className="space-y-3">
      {s.heading && (
        <h3 style={{
          color: c?.primary || '#0ea5e9', fontFamily: t?.headingFont, fontWeight: t?.headingWeight || 700,
          fontSize: 11, letterSpacing: '0.1em', textAlign: 'center' as const, textTransform: 'uppercase' as const, margin: 0,
        }}>{s.heading}</h3>
      )}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {products.map((p, i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: c?.surface || '#111', border: `1px solid ${c?.text || '#fff'}10` }}>
            <div className="aspect-square overflow-hidden">
              <ProductImage src={p.img} alt={p.name} seed={i + 1} templateId={templateId} theme={theme} className="w-full h-full" />
            </div>
            <div className="p-2 space-y-0.5">
              {s.showRating && <Stars rating={p.rating} color={c?.accent} />}
              <p className="text-[9px] font-semibold truncate" style={{ color: c?.text || '#f5f5f5', fontFamily: t?.bodyFont, margin: 0 }}>{p.name}</p>
              {s.showPrice && <p className="text-[9px] font-bold" style={{ color: c?.primary || '#10b981', margin: 0 }}>{p.price}</p>}
              {s.showAddToCart && (
                <button className="w-full mt-1 py-1 text-[7px] font-bold uppercase tracking-wide" style={{
                  color: c?.primary || '#10b981', border: `1px solid ${c?.primary || '#10b981'}40`,
                  backgroundColor: `${c?.primary || '#10b981'}10`, borderRadius: 4, cursor: 'default',
                }}>Add to Cart</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedCollectionPreview({ section, theme, templateId, shopData }: { section: SectionConfig; theme?: SectionPreviewProps['theme']; templateId?: string; shopData?: ShopData }) {
  const s = section.settings;
  const c = theme?.colors;
  const t = theme?.typography;
  const cols = Math.min(s.productsPerRow || 4, 4);
  const count = Math.min(s.maxProducts || 4, 6);

  return (
    <div className="space-y-3">
      {s.heading && (
        <h3 style={{ color: c?.primary || '#0ea5e9', fontFamily: t?.headingFont, fontWeight: t?.headingWeight || 700, fontSize: 11, textAlign: 'center' as const, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: 0 }}>
          {s.heading}
        </h3>
      )}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {getProducts(templateId, shopData).slice(0, count).map((p, i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ backgroundColor: c?.surface || '#111', border: `1px solid ${c?.text || '#fff'}10` }}>
            <div className="aspect-square overflow-hidden">
              <ProductImage src={p.img} alt={p.name} seed={i + 10} templateId={templateId} theme={theme} className="w-full h-full" />
            </div>
            <div className="p-1.5">
              <p className="text-[8px] font-medium truncate" style={{ color: c?.text || '#fff', fontFamily: t?.bodyFont, margin: 0 }}>{p.name}</p>
              {s.showPrice && <p className="text-[8px]" style={{ color: c?.primary || '#10b981', margin: 0 }}>{p.price}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsPreview({ section, theme }: { section: SectionConfig; theme?: SectionPreviewProps['theme'] }) {
  const s = section.settings;
  const c = theme?.colors;
  const t = theme?.typography;

  return (
    <div className="space-y-3">
      {s.heading && <h3 style={{ color: c?.primary || '#0ea5e9', fontFamily: t?.headingFont, fontWeight: t?.headingWeight || 700, fontSize: 11, textAlign: 'center' as const, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: 0 }}>{s.heading}</h3>}
      <div className="grid grid-cols-3 gap-2">
        {REVIEWS.map((r, i) => (
          <div key={i} className="rounded-lg p-3" style={{ backgroundColor: c?.surface || '#111', border: `1px solid ${c?.text || '#fff'}10` }}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-full" style={{ background: `linear-gradient(135deg, ${c?.primary || '#b45309'}, ${c?.secondary || '#78350f'})` }} />
              <div>
                <p className="text-[8px] font-bold" style={{ color: c?.text || '#fff', margin: 0 }}>{r.name}</p>
                {s.showDate && <p className="text-[7px]" style={{ color: c?.textMuted || '#666', margin: 0 }}>{r.date}</p>}
              </div>
            </div>
            {s.showRating && <Stars rating={r.rating} color={c?.accent} />}
            <p className="text-[7px] mt-1.5 leading-relaxed" style={{ color: c?.textMuted || '#999', margin: 0 }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageWithTextPreview({ section, theme, templateId }: { section: SectionConfig; theme?: SectionPreviewProps['theme']; templateId?: string }) {
  const s = section.settings;
  const c = theme?.colors;
  const t = theme?.typography;
  const imgRight = s.imagePosition === 'right';

  return (
    <div className={`flex gap-4 items-center ${imgRight ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className="flex-1">
        <h3 style={{ color: c?.text || '#fff', fontFamily: t?.headingFont, fontWeight: t?.headingWeight || 700, fontSize: 13, margin: 0 }}>{s.heading || 'About Us'}</h3>
        <div className="text-[9px] mt-2 leading-relaxed" style={{ color: c?.textMuted || '#999', fontFamily: t?.bodyFont }} dangerouslySetInnerHTML={{ __html: s.text || '<p>Description text goes here.</p>' }} />
      </div>
      <div className="rounded-lg overflow-hidden" style={{ width: `${parseInt(s.imageWidth || '50')}%`, minHeight: 100 }}>
        <ProductImage seed={42} templateId={templateId} theme={theme} className="w-full h-full" style={{ minHeight: 100 }} />
      </div>
    </div>
  );
}

function SlideshowPreview({ section, theme, templateId }: { section: SectionConfig; theme?: SectionPreviewProps['theme']; templateId?: string }) {
  const slides = section.blocks || [];
  const first = slides[0]?.settings || {};
  const c = theme?.colors;
  const t = theme?.typography;
  const palettes = MESH_PALETTES[templateId || ''] || DEFAULT_PALETTE;

  return (
    <div className="relative h-52 rounded-lg overflow-hidden">
      <MeshGradient seed={99} palette={palettes[0]} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      <div className="relative h-full flex flex-col justify-center px-8">
        <h2 style={{ color: c?.text || '#fff', fontFamily: t?.headingFont, fontWeight: t?.headingWeight || 700, fontSize: 18, lineHeight: 1.2, margin: 0 }}>{first.heading || 'Slide Heading'}</h2>
        <p className="text-[9px] mt-1" style={{ color: `${c?.text || '#fff'}aa`, margin: 0 }}>{first.subheading || 'Subtitle text'}</p>
        {first.ctaText && <button className="mt-3 px-4 py-1.5 text-[8px] font-bold rounded text-white" style={{ backgroundColor: c?.primary || '#0ea5e9', cursor: 'default' }}>{first.ctaText}</button>}
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {(slides.length > 0 ? slides : [1]).map((_: any, i: number) => <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/30'}`} />)}
      </div>
    </div>
  );
}

function CollectionListPreview({ section, theme, templateId }: { section: SectionConfig; theme?: SectionPreviewProps['theme']; templateId?: string }) {
  const s = section.settings;
  const c = theme?.colors;
  const t = theme?.typography;
  const cols = s.columns || 3;
  const names = ['New Arrivals', 'Best Sellers', 'On Sale'];
  const palettes = MESH_PALETTES[templateId || ''] || DEFAULT_PALETTE;

  return (
    <div className="space-y-3">
      {s.heading && <h3 style={{ color: c?.text || '#fff', fontFamily: t?.headingFont, fontWeight: t?.headingWeight || 700, fontSize: 12, textAlign: 'center' as const, margin: 0 }}>{s.heading}</h3>}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {names.slice(0, cols).map((name, i) => (
          <div key={i} className="aspect-[4/3] rounded-lg relative overflow-hidden">
            <MeshGradient seed={i + 20} palette={palettes[i % palettes.length]} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-3">
              <p className="text-[10px] font-bold uppercase" style={{ color: c?.text || '#fff', margin: 0 }}>{name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryPreview({ section, theme, templateId }: { section: SectionConfig; theme?: SectionPreviewProps['theme']; templateId?: string }) {
  const s = section.settings;
  const c = theme?.colors;
  const t = theme?.typography;
  const cols = s.columns || 3;
  const palettes = MESH_PALETTES[templateId || ''] || DEFAULT_PALETTE;

  return (
    <div className="space-y-3">
      {s.heading && <h3 style={{ color: c?.text || '#fff', fontFamily: t?.headingFont, fontWeight: t?.headingWeight || 700, fontSize: 12, textAlign: 'center' as const, margin: 0 }}>{s.heading}</h3>}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <div key={i} className="aspect-square rounded overflow-hidden">
            <MeshGradient seed={i + 50} palette={palettes[i % palettes.length]} className="w-full h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterPreview({ section, theme }: { section: SectionConfig; theme?: SectionPreviewProps['theme'] }) {
  const s = section.settings;
  const c = theme?.colors;
  return (
    <div className="text-center py-5 space-y-2">
      <h3 className="text-xs font-bold" style={{ color: c?.text || '#fff', margin: 0 }}>{s.heading || 'Newsletter'}</h3>
      <p className="text-[8px]" style={{ color: c?.textMuted || '#999', margin: 0 }}>{s.subtext || 'Subscribe for updates'}</p>
      <div className="flex gap-1.5 justify-center max-w-xs mx-auto">
        <div className="flex-1 h-7 rounded text-[8px] flex items-center px-2" style={{ backgroundColor: c?.surface || '#111', border: `1px solid ${c?.text || '#fff'}15`, color: c?.textMuted || '#666' }}>
          email@example.com
        </div>
        <button className="px-4 h-7 rounded text-[8px] font-bold text-white" style={{ backgroundColor: c?.primary || '#10b981', cursor: 'default' }}>
          {s.buttonText || 'Subscribe'}
        </button>
      </div>
    </div>
  );
}

function RichTextPreview({ section, theme }: { section: SectionConfig; theme?: SectionPreviewProps['theme'] }) {
  const s = section.settings;
  const c = theme?.colors;
  return (
    <div className={`py-5 ${s.alignment === 'center' ? 'text-center' : s.alignment === 'right' ? 'text-right' : 'text-left'}`}>
      <div className="text-[9px] leading-relaxed max-w-md mx-auto" style={{ color: c?.textMuted || '#999' }} dangerouslySetInnerHTML={{ __html: s.content || '<p>Rich text content</p>' }} />
    </div>
  );
}

function MulticolumnPreview({ section, theme }: { section: SectionConfig; theme?: SectionPreviewProps['theme'] }) {
  const s = section.settings;
  const c = theme?.colors;
  const blocks = section.blocks || [];
  const items = blocks.length > 0 ? blocks : [
    { settings: { heading: 'Feature 1', text: 'Description' } },
    { settings: { heading: 'Feature 2', text: 'Description' } },
    { settings: { heading: 'Feature 3', text: 'Description' } },
  ];

  return (
    <div className="space-y-3">
      {s.heading && <h3 className="text-xs font-bold text-center" style={{ color: c?.text || '#fff', margin: 0 }}>{s.heading}</h3>}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((block: any, i: number) => (
          <div key={i} className="text-center p-3 rounded-lg" style={{ backgroundColor: c?.surface || '#111', border: `1px solid ${c?.text || '#fff'}10` }}>
            <div className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: `${c?.primary || '#10b981'}20`, color: c?.primary || '#10b981' }}>
              {i + 1}
            </div>
            <p className="text-[9px] font-bold" style={{ color: c?.text || '#fff', margin: 0 }}>{block.settings.heading}</p>
            <p className="text-[7px] mt-0.5" style={{ color: c?.textMuted || '#999', margin: 0 }}>{block.settings.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactFormPreview({ section, theme }: { section: SectionConfig; theme?: SectionPreviewProps['theme'] }) {
  const s = section.settings;
  const c = theme?.colors;
  return (
    <div className="space-y-3 max-w-sm mx-auto">
      {s.heading && <h3 className="text-xs font-bold text-center" style={{ color: c?.text || '#fff', margin: 0 }}>{s.heading}</h3>}
      {s.description && <p className="text-[8px] text-center" style={{ color: c?.textMuted || '#999', margin: 0 }}>{s.description}</p>}
      <div className="space-y-1.5">
        {['Name', 'Email', ...(s.showPhone ? ['Phone'] : []), ...(s.showSubject ? ['Subject'] : [])].map(f => (
          <div key={f} className="h-7 rounded text-[8px] flex items-center px-3" style={{ backgroundColor: c?.surface || '#111', border: `1px solid ${c?.text || '#fff'}15`, color: c?.textMuted || '#666' }}>{f}</div>
        ))}
        <div className="h-16 rounded text-[8px] px-3 pt-2" style={{ backgroundColor: c?.surface || '#111', border: `1px solid ${c?.text || '#fff'}15`, color: c?.textMuted || '#666' }}>Message</div>
        <button className="w-full py-2 rounded text-[8px] font-bold text-white" style={{ backgroundColor: c?.primary || '#10b981', cursor: 'default' }}>{s.submitText || 'Send'}</button>
      </div>
    </div>
  );
}

function CountdownPreview({ section, theme }: { section: SectionConfig; theme?: SectionPreviewProps['theme'] }) {
  const c = theme?.colors;
  return (
    <div className="text-center py-5 space-y-3">
      <h3 className="text-sm font-bold uppercase" style={{ color: c?.text || '#fff', margin: 0 }}>{section.settings.heading || 'Limited Time Deal'}</h3>
      <div className="flex justify-center gap-4">
        {[{ v: '03', l: 'Days' }, { v: '14', l: 'Hrs' }, { v: '45', l: 'Mins' }, { v: '21', l: 'Secs' }].map(t => (
          <div key={t.l} className="text-center">
            <div className="text-xl font-bold font-mono" style={{ color: c?.primary || '#06b6d4' }}>{t.v}</div>
            <div className="text-[7px] uppercase" style={{ color: c?.textMuted || '#666' }}>{t.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnouncementBarPreview({ section, theme }: { section: SectionConfig; theme?: SectionPreviewProps['theme'] }) {
  const text = section.blocks?.[0]?.settings?.text || 'Announcement';
  const c = theme?.colors;
  return (
    <div className="py-2 px-4 rounded text-center" style={{ backgroundColor: `${c?.primary || '#10b981'}15`, border: `1px solid ${c?.primary || '#10b981'}30` }}>
      <p className="text-[9px] font-medium" style={{ color: c?.primary || '#10b981', margin: 0 }}>{text}</p>
    </div>
  );
}

function FooterPreview({ section, theme, shopData }: { section: SectionConfig; theme?: SectionPreviewProps['theme']; shopData?: ShopData }) {
  const s = section.settings;
  const c = theme?.colors;
  const name = shopData?.shopName || 'Store';
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: c?.surface || '#111', border: `1px solid ${c?.text || '#fff'}10` }}>
      <div className="flex items-center justify-center gap-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${c?.text || '#fff'}08` }}>
        {['Shop', 'About', 'Contact', 'FAQ', 'Terms'].map(link => (
          <span key={link} className="text-[8px]" style={{ color: c?.textMuted || '#666' }}>{link}</span>
        ))}
      </div>
      <p className="text-[7px] text-center" style={{ color: c?.textMuted || '#555', margin: 0 }}>
        {s.copyrightText?.replace('{year}', '2025').replace('{shopName}', name) || `\u00A9 2025 ${name}`}
      </p>
    </div>
  );
}

function VideoPreview({ section, theme, templateId }: { section: SectionConfig; theme?: SectionPreviewProps['theme']; templateId?: string }) {
  const c = theme?.colors;
  const palettes = MESH_PALETTES[templateId || ''] || DEFAULT_PALETTE;
  return (
    <div className="rounded-lg overflow-hidden relative aspect-video">
      <MeshGradient seed={77} palette={palettes[0]} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${c?.primary || '#fff'}cc` }}>
          <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
    </div>
  );
}

function GenericPreview({ section, theme }: { section: SectionConfig; theme?: SectionPreviewProps['theme'] }) {
  const c = theme?.colors;
  return (
    <div className="py-8 text-center rounded-lg" style={{ border: `1px dashed ${c?.text || '#fff'}15` }}>
      <p className="text-[10px] capitalize" style={{ color: c?.textMuted || '#666', margin: 0 }}>{section.type.replace(/-/g, ' ')}</p>
    </div>
  );
}

/* ══════════════════════════════════════
   Renderer map & main export
   ====================================== */

type RendererFn = React.FC<{ section: SectionConfig; theme?: SectionPreviewProps['theme']; templateId?: string; shopData?: ShopData }>;

const RENDERERS: Record<string, RendererFn> = {
  'hero': HeroPreview,
  'product-grid': ProductGridPreview,
  'featured-collection': FeaturedCollectionPreview,
  'testimonials': TestimonialsPreview,
  'image-with-text': ImageWithTextPreview,
  'slideshow': SlideshowPreview,
  'collection-list': CollectionListPreview,
  'gallery': GalleryPreview,
  'newsletter': NewsletterPreview,
  'rich-text': RichTextPreview,
  'multicolumn': MulticolumnPreview,
  'contact-form': ContactFormPreview,
  'countdown-timer': CountdownPreview,
  'announcement-bar': AnnouncementBarPreview,
  'footer': FooterPreview,
  'video': VideoPreview,
};

export default function SectionPreview({ section, isSelected, onClick, theme, templateId, shopData }: SectionPreviewProps) {
  const Renderer = RENDERERS[section.type] || GenericPreview;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-emerald-500/40 bg-emerald-500/[0.02] shadow-lg shadow-emerald-500/5'
          : 'border-transparent hover:border-white/10'
      }`}
    >
      <div className="p-3">
        <Renderer section={section} theme={theme} templateId={templateId} shopData={shopData} />
      </div>
    </div>
  );
}
