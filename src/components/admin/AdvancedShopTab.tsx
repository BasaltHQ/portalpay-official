'use client';

/**
 * AdvancedShopTab — Shopify-class storefront admin.
 *
 * Sidebar nav + deep panels for:
 *   Branding, Templates, Pages, Collections, Navigation, Design Tokens, Online Store Editor
 *
 * Branding writes to the SAME shop_config.theme fields as Basic mode so
 * useBrand() stays consistent regardless of which mode the merchant uses.
 */

import React, { useState, useMemo, useEffect } from 'react';
import ImageUploadField from '@/components/forms/ImageUploadField';
import { getAllTemplates, getTemplate } from '@/lib/shop-templates/registry';
import type { ShopTemplate, SectionConfig } from '@/lib/shop-templates/types';
import TemplateCustomizer from './TemplateCustomizer';
import '@/lib/shop-templates';
import PagesManager from './PagesManager';
import CollectionsManager from './CollectionsManager';
import NavigationBuilder from './NavigationBuilder';

/* ── SVG Icon Components (no emojis) ──────────────────────────────────── */

const Icon = ({ d, className = '' }: { d: string; className?: string }) => (
  <svg className={`w-4 h-4 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const BrandingIcon = () => <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />;
const TemplateIcon = () => <Icon d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />;
const PagesIcon = () => <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />;
const CollectionsIcon = () => <Icon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />;
const NavIcon = () => <Icon d="M4 6h16M4 12h16M4 18h16" />;
const DesignIcon = () => <Icon d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />;
const EditorIcon = () => <Icon d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />;
const CheckIcon = () => <Icon d="M5 13l4 4L19 7" className="text-emerald-400" />;

interface AdvancedShopTabProps {
  config: any;
  setConfig: (updater: ((prev: any) => any) | any) => void;
  wallet: string;
  brandKey: string;
  generateFavicon: (logoUrl: string) => void;
  onSave?: () => void;
  saving?: boolean;
}

export default function AdvancedShopTab({ config, setConfig, wallet, brandKey, generateFavicon, onSave, saving }: AdvancedShopTabProps) {
  const [activeSection, setActiveSection] = useState<string>('branding');
  const templates = useMemo(() => getAllTemplates(), []);
  const currentTemplateId = config?.templateId || '';
  const currentTemplate = currentTemplateId ? getTemplate(currentTemplateId) : null;
  const [customizing, setCustomizing] = useState(false);
  const [editableTemplate, setEditableTemplate] = useState<ShopTemplate | null>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // Fetch inventory on mount for previews
  useEffect(() => {
    if (!wallet) return;
    (async () => {
      try {
        const res = await fetch('/api/inventory', { headers: { 'x-wallet': wallet } });
        const data = await res.json();
        if (Array.isArray(data.items)) {
          setInventoryItems(data.items.filter((it: any) => !it.approvalStatus || it.approvalStatus === 'APPROVED').map((it: any) => ({
            ...it, id: it.id || it._id,
            priceUsd: it.priceUsd ?? it.price ?? it.msrp ?? 0,
            name: it.name || 'Unknown Item',
          })));
        }
      } catch (e) { console.error('Failed to load inventory for preview', e); }
    })();
  }, [wallet]);

  // Shop data for template previews
  const shopData = useMemo(() => ({
    shopName: config?.name || '',
    logoUrl: config?.theme?.brandLogoUrl || '',
    primaryColor: config?.theme?.primaryColor || '',
    secondaryColor: config?.theme?.secondaryColor || '',
    fontFamily: config?.theme?.fontFamily || 'Inter',
    items: inventoryItems,
  }), [config?.name, config?.theme, inventoryItems]);

  // When template changes, deep-clone it for editing
  const startCustomizing = (template: ShopTemplate) => {
    const clone: ShopTemplate = JSON.parse(JSON.stringify(template));
    setEditableTemplate(clone);
    setCustomizing(true);
  };

  const handleSectionsChange = (pageKey: string, sections: SectionConfig[]) => {
    if (!editableTemplate) return;
    setEditableTemplate(prev => prev ? {
      ...prev,
      pages: { ...prev.pages, [pageKey]: sections },
    } : null);
  };

  const handleGlobalSettingsChange = (path: string, value: any) => {
    if (!editableTemplate) return;
    const [group, key] = path.split('.');
    setEditableTemplate(prev => {
      if (!prev) return null;
      return {
        ...prev,
        theme: {
          ...prev.theme,
          [group]: {
            ...(prev.theme as any)[group],
            [key]: value,
          },
        },
      };
    });
  };

  // Design token state (extends beyond basic branding)
  const [designTokens, setDesignTokens] = useState({
    borderRadius: config?.theme?.borderRadius || '8',
    spacing: config?.theme?.spacing || '16',
    headingFont: config?.theme?.headingFont || config?.theme?.fontFamily || 'Inter',
    bodyFont: config?.theme?.bodyFont || config?.theme?.fontFamily || 'Inter',
    headingWeight: config?.theme?.headingWeight || '700',
    bodyWeight: config?.theme?.bodyWeight || '400',
    headingSize: config?.theme?.headingSize || '32',
    bodySize: config?.theme?.bodySize || '16',
    lineHeight: config?.theme?.lineHeight || '1.6',
    letterSpacing: config?.theme?.letterSpacing || '0',
    buttonRadius: config?.theme?.buttonRadius || '8',
    buttonPadding: config?.theme?.buttonPadding || '12 24',
    cardShadow: config?.theme?.cardShadow || 'sm',
    headerHeight: config?.theme?.headerHeight || '64',
    maxWidth: config?.theme?.maxWidth || '1280',
    accentColor: config?.theme?.accentColor || '#f59e0b',
    surfaceColor: config?.theme?.surfaceColor || '#ffffff',
    backgroundColor: config?.theme?.backgroundColor || '#f8fafc',
    textColor: config?.theme?.textColor || '#0f172a',
    mutedColor: config?.theme?.mutedColor || '#64748b',
    borderColor: config?.theme?.borderColor || '#e2e8f0',
    successColor: config?.theme?.successColor || '#22c55e',
    warningColor: config?.theme?.warningColor || '#eab308',
    errorColor: config?.theme?.errorColor || '#ef4444',
    overlayOpacity: config?.theme?.overlayOpacity || '50',
    animationSpeed: config?.theme?.animationSpeed || '200',
    headerStyle: config?.theme?.headerStyle || 'standard',
    footerColumns: config?.theme?.footerColumns || '4',
    productCardStyle: config?.theme?.productCardStyle || 'standard',
    gridColumns: config?.theme?.gridColumns || '4',
    imageAspectRatio: config?.theme?.imageAspectRatio || '1:1',
  });

  const navItems = [
    { key: 'branding', label: 'Branding', desc: 'Logo, colors, identity', icon: <BrandingIcon /> },
    { key: 'template', label: 'Templates', desc: 'Storefront layouts', icon: <TemplateIcon /> },
    { key: 'pages', label: 'Pages', desc: 'Custom storefront pages', icon: <PagesIcon /> },
    { key: 'collections', label: 'Collections', desc: 'Product groupings', icon: <CollectionsIcon /> },
    { key: 'navigation', label: 'Navigation', desc: 'Menus and links', icon: <NavIcon /> },
    { key: 'design', label: 'Design System', desc: 'Tokens, typography, layout', icon: <DesignIcon /> },
    { key: 'editor', label: 'Store Editor', desc: 'Visual page builder', icon: <EditorIcon /> },
  ];

  const FONT_OPTIONS = [
    'Inter', 'Outfit', 'Roboto', 'Poppins', 'Lato', 'Playfair Display',
    'Source Serif 4', 'Montserrat', 'Open Sans', 'Raleway', 'Merriweather',
    'DM Sans', 'Space Grotesk', 'Nunito', 'Work Sans', 'Barlow',
    'Manrope', 'Plus Jakarta Sans', 'Sora', 'Figtree',
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar Navigation ── */}
      <div className="w-60 shrink-0 border-r border-white/10 bg-black/20 flex flex-col h-full overflow-hidden">
        <div className="p-4 space-y-0.5 flex-1 overflow-y-auto">
        <div className="px-3 pb-3 mb-3 border-b border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Online Store</p>
        </div>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveSection(item.key)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 ${
              activeSection === item.key
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {item.icon}
            <div className="min-w-0">
              <span className="block font-medium leading-tight">{item.label}</span>
              <span className="block text-[10px] text-gray-500 leading-tight mt-0.5">{item.desc}</span>
            </div>
          </button>
        ))}
        </div>

        {/* Save button at sidebar bottom */}
        {onSave && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={onSave}
              disabled={saving}
              className="w-full px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Deploy'}
            </button>
          </div>
        )}
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 min-w-0 p-8 overflow-y-auto relative">

        {/* ===== BRANDING ===== */}
        {activeSection === 'branding' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Store Branding</h3>
              <p className="text-sm text-gray-400 mt-1.5">
                Identity settings that control the overall site theme. These fields are shared with Basic mode
                to ensure consistent branding across your entire platform.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Store Name</label>
                <input
                  type="text"
                  value={config.name || ''}
                  onChange={e => setConfig((prev: any) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:border-white/25 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Tagline</label>
                <input
                  type="text"
                  value={config.description || ''}
                  onChange={e => setConfig((prev: any) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:border-white/25 focus:outline-none transition-colors"
                  placeholder="Your store in one line"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="border-t border-white/5 pt-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-3">Brand Colors</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'primaryColor', label: 'Primary', fallback: '#0ea5e9' },
                  { key: 'secondaryColor', label: 'Secondary', fallback: '#22c55e' },
                ].map(color => (
                  <div key={color.key} className="space-y-1.5">
                    <label className="text-[10px] text-gray-500">{color.label}</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={(config.theme as any)?.[color.key] || color.fallback}
                        onChange={e => setConfig((prev: any) => ({
                          ...prev, theme: { ...prev.theme, [color.key]: e.target.value }
                        }))}
                        className="w-9 h-9 rounded-md border border-white/10 cursor-pointer bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={(config.theme as any)?.[color.key] || color.fallback}
                        onChange={e => setConfig((prev: any) => ({
                          ...prev, theme: { ...prev.theme, [color.key]: e.target.value }
                        }))}
                        className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm font-mono focus:border-white/25 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logo + Favicon */}
            <div className="border-t border-white/5 pt-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-3">Assets</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUploadField
                  label="Logo"
                  value={config.theme?.brandLogoUrl || ''}
                  onChange={(url) => {
                    const newUrl = String(url || '');
                    setConfig((prev: any) => ({
                      ...prev, theme: { ...prev.theme, brandLogoUrl: newUrl }
                    }));
                    if (newUrl && !config.theme?.brandFaviconUrl) generateFavicon(newUrl);
                  }}
                  target="brand_logo"
                  compact
                />
                <ImageUploadField
                  label="Favicon"
                  value={config.theme?.brandFaviconUrl || ''}
                  onChange={(url) => setConfig((prev: any) => ({
                    ...prev, theme: { ...prev.theme, brandFaviconUrl: String(url || '') }
                  }))}
                  target="brand_favicon"
                  compact
                  guidance="32x32 or 64x64 PNG"
                />
              </div>
            </div>

            {/* Typography */}
            <div className="border-t border-white/5 pt-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-3">Typography</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500">Heading Font</label>
                  <select
                    value={config.theme?.fontFamily || 'Inter'}
                    onChange={e => setConfig((prev: any) => ({
                      ...prev, theme: { ...prev.theme, fontFamily: e.target.value }
                    }))}
                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:border-white/25 focus:outline-none"
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-500">Body Font</label>
                  <select
                    value={config.theme?.bodyFont || config.theme?.fontFamily || 'Inter'}
                    onChange={e => setConfig((prev: any) => ({
                      ...prev, theme: { ...prev.theme, bodyFont: e.target.value }
                    }))}
                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm focus:border-white/25 focus:outline-none"
                  >
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TEMPLATES ===== */}
        {activeSection === 'template' && (
          customizing && editableTemplate ? (
            /* ── Full Template Customizer ── */
            <div className="-m-8 h-[calc(100%+4rem)]">
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/20 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomizing(false)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Templates
                  </button>
                  <span className="text-gray-600">|</span>
                  <p className="text-sm font-semibold text-white">Customizing: {editableTemplate.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCustomizing(false)}
                    className="text-[10px] px-3 py-1.5 text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Apply the customized template
                      setConfig((prev: any) => ({
                        ...prev,
                        templateId: editableTemplate.id,
                        customizedTemplate: editableTemplate,
                      }));
                      setCustomizing(false);
                    }}
                    className="text-[10px] px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors font-semibold"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
              <div className="h-[calc(100%-49px)]">
                <TemplateCustomizer
                  template={editableTemplate}
                  onSectionsChange={handleSectionsChange}
                  onGlobalSettingsChange={handleGlobalSettingsChange}
                  shopData={shopData}
                />
              </div>
            </div>
          ) : (
            /* ── Template Browser ── */
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Templates</h3>
                <p className="text-sm text-gray-400 mt-1.5">
                  Select a template to activate the advanced storefront engine. Each template includes
                  pre-built pages, sections, and design tokens — fully customizable via the no-code editor.
                </p>
              </div>

              {currentTemplate && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <CheckIcon />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-400">Active: {currentTemplate.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{currentTemplate.description}</p>
                  </div>
                  <button
                    onClick={() => startCustomizing(currentTemplate)}
                    className="text-xs px-3 py-1.5 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors font-medium"
                  >
                    Customize
                  </button>
                  <button
                    onClick={() => {
                      setConfig((prev: any) => {
                        const { templateId, customizedTemplate, ...rest } = prev;
                        return rest;
                      });
                      setEditableTemplate(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-400/20 rounded-lg transition-colors"
                  >
                    Deactivate
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map(tmpl => {
                  const isActive = currentTemplateId === tmpl.id;
                  const totalSections = Object.values(tmpl.pages).reduce((sum, page) => sum + page.length, 0);
                  const pageCount = Object.keys(tmpl.pages).length;
                  return (
                    <div
                      key={tmpl.id}
                      className={`rounded-xl border overflow-hidden transition-all group ${
                        isActive
                          ? 'border-emerald-500/40 ring-1 ring-emerald-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Preview image */}
                      <div className="aspect-[16/10] bg-black/40 overflow-hidden relative">
                        <img
                          src={tmpl.thumbnail || `/templates/${tmpl.id}-preview.png`}
                          alt={tmpl.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {isActive && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/90 text-white text-[9px] font-semibold rounded-full uppercase tracking-wide">
                            Active
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-sm font-semibold text-white">{tmpl.name}</p>
                          <p className="text-[10px] text-gray-300 mt-0.5">by {tmpl.author}</p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 bg-black/20">
                        <p className="text-[11px] text-gray-400 leading-relaxed">{tmpl.description}</p>

                        {/* Stats */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-gray-500">
                            {pageCount} pages
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-gray-500">
                            {totalSections} sections
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-gray-500">
                            {tmpl.supportedSections.length} section types
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-gray-500 capitalize">
                            {tmpl.category}
                          </span>
                        </div>

                        {/* Color palette */}
                        <div className="flex gap-1 mt-3">
                          {Object.values(tmpl.theme.colors).slice(0, 5).map((c, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-md border border-white/10"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {isActive ? (
                            <button
                              onClick={() => startCustomizing(tmpl)}
                              className="flex-1 text-xs px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors font-semibold"
                            >
                              Customize
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setConfig((prev: any) => ({ ...prev, templateId: tmpl.id }));
                                }}
                                className="flex-1 text-xs px-3 py-2 bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors font-medium"
                              >
                                Activate
                              </button>
                              <button
                                onClick={() => startCustomizing(tmpl)}
                                className="text-xs px-3 py-2 text-gray-400 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                Preview
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                  <p className="text-[11px] text-gray-500">
                    More templates coming soon via the Template Marketplace. Developers can build custom
                    templates using the <span className="text-gray-400 font-mono">template-sdk.ts</span> API.
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* ===== PAGES ===== */}
        {activeSection === 'pages' && <PagesManager />}

        {/* ===== COLLECTIONS ===== */}
        {activeSection === 'collections' && <CollectionsManager />}

        {/* ===== NAVIGATION ===== */}
        {activeSection === 'navigation' && <NavigationBuilder />}

        {/* ===== DESIGN SYSTEM ===== */}
        {activeSection === 'design' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Design System</h3>
              <p className="text-sm text-gray-400 mt-1.5">
                Fine-grained control over every visual aspect of your storefront. These tokens cascade
                across all pages and sections.
              </p>
            </div>

            {/* Color Palette */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Extended Palette</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'accentColor', label: 'Accent' },
                  { key: 'surfaceColor', label: 'Surface' },
                  { key: 'backgroundColor', label: 'Background' },
                  { key: 'textColor', label: 'Text' },
                  { key: 'mutedColor', label: 'Muted' },
                  { key: 'borderColor', label: 'Border' },
                  { key: 'successColor', label: 'Success' },
                  { key: 'warningColor', label: 'Warning' },
                  { key: 'errorColor', label: 'Error' },
                ].map(c => (
                  <div key={c.key} className="space-y-1">
                    <label className="text-[9px] text-gray-500">{c.label}</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="color"
                        value={(designTokens as any)[c.key]}
                        onChange={e => setDesignTokens(prev => ({ ...prev, [c.key]: e.target.value }))}
                        className="w-7 h-7 rounded border border-white/10 cursor-pointer bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={(designTokens as any)[c.key]}
                        onChange={e => setDesignTokens(prev => ({ ...prev, [c.key]: e.target.value }))}
                        className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography Tokens */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Typography</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Heading Font</label>
                  <select value={designTokens.headingFont} onChange={e => setDesignTokens(prev => ({ ...prev, headingFont: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Body Font</label>
                  <select value={designTokens.bodyFont} onChange={e => setDesignTokens(prev => ({ ...prev, bodyFont: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Heading Weight</label>
                  <select value={designTokens.headingWeight} onChange={e => setDesignTokens(prev => ({ ...prev, headingWeight: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {['300', '400', '500', '600', '700', '800', '900'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Body Weight</label>
                  <select value={designTokens.bodyWeight} onChange={e => setDesignTokens(prev => ({ ...prev, bodyWeight: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {['300', '400', '500', '600', '700'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Heading Size (px)</label>
                  <input type="number" value={designTokens.headingSize} onChange={e => setDesignTokens(prev => ({ ...prev, headingSize: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="16" max="72" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Body Size (px)</label>
                  <input type="number" value={designTokens.bodySize} onChange={e => setDesignTokens(prev => ({ ...prev, bodySize: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="12" max="24" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Line Height</label>
                  <input type="number" step="0.1" value={designTokens.lineHeight} onChange={e => setDesignTokens(prev => ({ ...prev, lineHeight: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="1" max="3" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Letter Spacing (em)</label>
                  <input type="number" step="0.01" value={designTokens.letterSpacing} onChange={e => setDesignTokens(prev => ({ ...prev, letterSpacing: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="-0.05" max="0.2" />
                </div>
              </div>
            </div>

            {/* Layout Tokens */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Layout</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Border Radius (px)</label>
                  <input type="number" value={designTokens.borderRadius} onChange={e => setDesignTokens(prev => ({ ...prev, borderRadius: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="0" max="24" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Base Spacing (px)</label>
                  <input type="number" value={designTokens.spacing} onChange={e => setDesignTokens(prev => ({ ...prev, spacing: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="4" max="32" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Max Width (px)</label>
                  <input type="number" value={designTokens.maxWidth} onChange={e => setDesignTokens(prev => ({ ...prev, maxWidth: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="960" max="1920" step="40" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Header Height (px)</label>
                  <input type="number" value={designTokens.headerHeight} onChange={e => setDesignTokens(prev => ({ ...prev, headerHeight: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="48" max="120" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Grid Columns</label>
                  <select value={designTokens.gridColumns} onChange={e => setDesignTokens(prev => ({ ...prev, gridColumns: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {['2', '3', '4', '5', '6'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Footer Columns</label>
                  <select value={designTokens.footerColumns} onChange={e => setDesignTokens(prev => ({ ...prev, footerColumns: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {['2', '3', '4', '5', '6'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Component Tokens */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Components</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Button Radius (px)</label>
                  <input type="number" value={designTokens.buttonRadius} onChange={e => setDesignTokens(prev => ({ ...prev, buttonRadius: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="0" max="99" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Card Shadow</label>
                  <select value={designTokens.cardShadow} onChange={e => setDesignTokens(prev => ({ ...prev, cardShadow: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {['none', 'sm', 'md', 'lg', 'xl'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Product Card</label>
                  <select value={designTokens.productCardStyle} onChange={e => setDesignTokens(prev => ({ ...prev, productCardStyle: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {['standard', 'minimal', 'overlay', 'bordered', 'floating'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Header Style</label>
                  <select value={designTokens.headerStyle} onChange={e => setDesignTokens(prev => ({ ...prev, headerStyle: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {['standard', 'centered', 'minimal', 'transparent', 'sticky'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Image Ratio</label>
                  <select value={designTokens.imageAspectRatio} onChange={e => setDesignTokens(prev => ({ ...prev, imageAspectRatio: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs">
                    {['1:1', '4:3', '3:4', '16:9', '2:3'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-gray-500">Animation (ms)</label>
                  <input type="number" step="50" value={designTokens.animationSpeed} onChange={e => setDesignTokens(prev => ({ ...prev, animationSpeed: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs" min="0" max="1000" />
                </div>
              </div>
            </div>

            {/* Token preview */}
            <div className="border-t border-white/5 pt-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-3">Preview</p>
              <div
                className="rounded-lg border border-white/10 p-4 space-y-3"
                style={{
                  fontFamily: designTokens.bodyFont,
                  fontSize: `${designTokens.bodySize}px`,
                  lineHeight: designTokens.lineHeight,
                  letterSpacing: `${designTokens.letterSpacing}em`,
                  borderRadius: `${designTokens.borderRadius}px`,
                  backgroundColor: designTokens.surfaceColor,
                  color: designTokens.textColor,
                }}
              >
                <h4 style={{
                  fontFamily: designTokens.headingFont,
                  fontWeight: Number(designTokens.headingWeight),
                  fontSize: `${Math.min(Number(designTokens.headingSize), 28)}px`,
                }}>
                  Heading Preview
                </h4>
                <p style={{ color: designTokens.mutedColor, fontSize: `${designTokens.bodySize}px` }}>
                  Body text preview with your selected typography tokens applied.
                </p>
                <div className="flex gap-2">
                  <button style={{
                    backgroundColor: config.theme?.primaryColor || '#0ea5e9',
                    color: '#fff',
                    borderRadius: `${designTokens.buttonRadius}px`,
                    padding: designTokens.buttonPadding.split(' ').map((v: string) => v + 'px').join(' '),
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                  }}>
                    Primary Button
                  </button>
                  <button style={{
                    backgroundColor: 'transparent',
                    color: designTokens.textColor,
                    borderRadius: `${designTokens.buttonRadius}px`,
                    padding: designTokens.buttonPadding.split(' ').map((v: string) => v + 'px').join(' '),
                    fontSize: '13px',
                    fontWeight: 500,
                    border: `1px solid ${designTokens.borderColor}`,
                  }}>
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== STORE EDITOR ===== */}
        {activeSection === 'editor' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Online Store Editor</h3>
              <p className="text-sm text-gray-400 mt-1.5">
                Visual drag-and-drop editor for customizing your storefront in real time.
                Select and rearrange sections, edit content inline, and preview across devices.
              </p>
            </div>

            {currentTemplateId ? (
              <div className="space-y-4">
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  {/* Editor toolbar */}
                  <div className="flex items-center justify-between bg-black/30 px-4 py-2 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <button className="w-7 h-7 rounded border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2" /></svg>
                        </button>
                        <button className="w-7 h-7 rounded border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" /></svg>
                        </button>
                        <button className="w-7 h-7 rounded border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="7" y="2" width="10" height="20" rx="2" /></svg>
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-500">|</span>
                      <p className="text-[10px] text-gray-400">Editing: Home Page</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-[10px] px-2.5 py-1 text-gray-400 border border-white/10 rounded hover:bg-white/5">Undo</button>
                      <button className="text-[10px] px-2.5 py-1 text-gray-400 border border-white/10 rounded hover:bg-white/5">Redo</button>
                    </div>
                  </div>

                  {/* Editor canvas placeholder */}
                  <div className="h-80 bg-gradient-to-b from-black/20 to-black/40 flex items-center justify-center">
                    <div className="text-center">
                      <EditorIcon />
                      <p className="text-xs text-gray-400 mt-3">Visual editor loading...</p>
                      <p className="text-[10px] text-gray-500 mt-1">Drag sections from the left panel to build your page</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/20 rounded-lg border border-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Sections</p>
                    <p className="text-sm font-semibold text-white">{currentTemplate?.pages?.home?.length || 0}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg border border-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Template</p>
                    <p className="text-sm font-semibold text-white">{currentTemplate?.name || '--'}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg border border-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Pages</p>
                    <p className="text-sm font-semibold text-white">{Object.keys(currentTemplate?.pages || {}).length}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                <TemplateIcon />
                <p className="text-xs text-gray-400 mt-3">Select a template first to access the visual editor</p>
                <button
                  onClick={() => setActiveSection('template')}
                  className="mt-3 text-[10px] px-3 py-1.5 bg-white/5 text-gray-300 rounded border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Browse Templates
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
