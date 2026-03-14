'use client';

/**
 * TemplateRenderer — Orchestrates page rendering for Advanced mode shops.
 * 
 * 1. Resolves template from shopConfig.templateId
 * 2. Resolves page type (home / product / collection / custom)
 * 3. Gets sections list from shopConfig overrides or template defaults
 * 4. Renders visible sections in order via SectionSwitch
 * 5. Injects CSS custom properties from template theme + merchant overrides
 */

import React, { useMemo } from 'react';
import SectionSwitch from './SectionSwitch';
import type { ResolvedTheme } from '../sections/SectionRenderProps';
import type { SectionConfig, TemplateTheme } from '@/lib/shop-templates/types';
import { getTemplate } from '@/lib/shop-templates/registry';
import type { InventoryItem } from '@/types/inventory';

export type StorefrontPageType = 'home' | 'product' | 'collection' | 'custom';

interface TemplateRendererProps {
  /** Which page type we're rendering */
  pageType: StorefrontPageType;
  /** Full shop config (includes templateId, theme overrides, sections overrides) */
  shopConfig: any;
  /** Inventory items to display */
  items: InventoryItem[];
  /** Collections for this shop */
  collections: any[];
  /** Reviews for this shop */
  reviews: any[];
  /** Merchant wallet */
  merchantWallet: string;
  /** Shop slug */
  slug: string;
  /** Override sections (e.g. from a custom page) */
  customSections?: SectionConfig[];
  /** Preview mode */
  isPreview?: boolean;
  /** Editor mode */
  isEditing?: boolean;

  // Callbacks
  onAddToCart: (itemId: string, qty?: number, modifiers?: any) => void;
  onSelectItem: (item: InventoryItem) => void;
  onNavigate: (path: string) => void;
}

/** Merge template theme with merchant overrides */
function resolveTheme(templateTheme: TemplateTheme, shopConfig: any): ResolvedTheme {
  const merchantColors = shopConfig?.theme || {};
  
  return {
    colors: {
      primary: merchantColors.primaryColor || templateTheme.colors.primary,
      secondary: merchantColors.secondaryColor || templateTheme.colors.secondary,
      accent: templateTheme.colors.accent,
      background: templateTheme.colors.background,
      surface: templateTheme.colors.surface,
      text: templateTheme.colors.text,
      textMuted: templateTheme.colors.textMuted,
    },
    typography: { ...templateTheme.typography },
    layout: { ...templateTheme.layout },
    effects: { ...templateTheme.effects },
  };
}

/** Get sections for the current page type */
function resolveSections(
  pageType: StorefrontPageType,
  shopConfig: any,
  templateId: string,
  customSections?: SectionConfig[]
): SectionConfig[] {
  // Custom sections override everything (e.g. custom CMS pages)
  if (customSections) return customSections;

  // Check if shop config has per-page section overrides
  const configPages = shopConfig?.pages;
  if (configPages && configPages[pageType]?.sections) {
    return configPages[pageType].sections;
  }

  // Fall back to template defaults
  const template = getTemplate(templateId);
  if (template) {
    const defaultPages = template.pages[pageType as keyof typeof template.pages];
    if (defaultPages) return defaultPages;
  }

  // Last resort: empty
  return [];
}

/** Generate CSS custom properties from resolved theme */
function themeToCSS(theme: ResolvedTheme): React.CSSProperties {
  return {
    '--tmpl-primary': theme.colors.primary,
    '--tmpl-secondary': theme.colors.secondary,
    '--tmpl-accent': theme.colors.accent,
    '--tmpl-bg': theme.colors.background,
    '--tmpl-surface': theme.colors.surface,
    '--tmpl-text': theme.colors.text,
    '--tmpl-text-muted': theme.colors.textMuted,
    '--tmpl-heading-font': theme.typography.headingFont,
    '--tmpl-body-font': theme.typography.bodyFont,
    '--tmpl-base-size': `${theme.typography.baseSize}px`,
    '--tmpl-heading-weight': theme.typography.headingWeight,
    '--tmpl-body-weight': theme.typography.bodyWeight,
    '--tmpl-line-height': theme.typography.lineHeight,
    '--tmpl-max-width': `${theme.layout.maxWidth}px`,
    '--tmpl-border-radius': theme.layout.borderRadius === 'none' ? '0' :
      theme.layout.borderRadius === 'sm' ? '4px' :
      theme.layout.borderRadius === 'md' ? '8px' :
      theme.layout.borderRadius === 'lg' ? '12px' : '9999px',
  } as React.CSSProperties;
}

export default function TemplateRenderer({
  pageType,
  shopConfig,
  items,
  collections,
  reviews,
  merchantWallet,
  slug,
  customSections,
  isPreview = false,
  isEditing = false,
  onAddToCart,
  onSelectItem,
  onNavigate,
}: TemplateRendererProps) {
  const templateId = shopConfig?.templateId || 'classic';
  const template = getTemplate(templateId);

  const resolvedTheme = useMemo(() => {
    if (!template) return null;
    return resolveTheme(template.theme, shopConfig);
  }, [template, shopConfig]);

  const sections = useMemo(() => {
    return resolveSections(pageType, shopConfig, templateId, customSections);
  }, [pageType, shopConfig, templateId, customSections]);

  if (!template || !resolvedTheme) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
        Template &quot;{templateId}&quot; not found.
      </div>
    );
  }

  const visibleSections = sections.filter(s => s.visible);

  return (
    <div
      className="template-renderer"
      style={{
        ...themeToCSS(resolvedTheme),
        backgroundColor: 'var(--tmpl-bg)',
        color: 'var(--tmpl-text)',
        fontFamily: 'var(--tmpl-body-font), system-ui, sans-serif',
        fontSize: 'var(--tmpl-base-size)',
        fontWeight: resolvedTheme.typography.bodyWeight,
        lineHeight: resolvedTheme.typography.lineHeight,
        minHeight: '100vh',
      }}
    >
      {visibleSections.map((sectionConfig) => (
        <div
          key={sectionConfig.id}
          className={`template-section template-section--${sectionConfig.type}`}
          data-section-id={sectionConfig.id}
          data-section-type={sectionConfig.type}
        >
          <SectionSwitch
            sectionConfig={sectionConfig}
            shopConfig={shopConfig}
            theme={resolvedTheme}
            items={items}
            collections={collections}
            reviews={reviews}
            merchantWallet={merchantWallet}
            slug={slug}
            isPreview={isPreview}
            isEditing={isEditing}
            onAddToCart={onAddToCart}
            onSelectItem={onSelectItem}
            onNavigate={onNavigate}
          />
        </div>
      ))}
    </div>
  );
}
