'use client';

/**
 * SectionRenderProps — Standardized props interface for all section components.
 * 
 * Every section component receives this exact interface. Section-specific
 * settings come via sectionConfig.settings.
 */

import type { SectionConfig } from '@/lib/shop-templates/types';
import type { InventoryItem } from '@/types/inventory';

/** Resolved theme tokens computed from template theme + merchant overrides */
export interface ResolvedTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseSize: number;
    headingWeight: number;
    bodyWeight: number;
    lineHeight: number;
  };
  layout: {
    maxWidth: number;
    borderRadius: string;
    cardStyle: string;
    spacing: string;
    productImageRatio: string;
  };
  effects: {
    animations: boolean;
    parallax: boolean;
    darkMode: boolean;
    glassmorph: boolean;
  };
}

export interface SectionRenderProps {
  /** This section's configuration (type, settings, blocks) */
  sectionConfig: SectionConfig;
  /** Full shop configuration */
  shopConfig: any;
  /** Resolved theme tokens */
  theme: ResolvedTheme;
  /** All inventory items */
  items: InventoryItem[];
  /** All collections for this shop */
  collections: any[];
  /** All reviews for this shop */
  reviews: any[];
  /** Merchant wallet address */
  merchantWallet: string;
  /** Shop URL slug */
  slug: string;
  /** Whether this is a preview render (e.g. in wizard or editor) */
  isPreview: boolean;
  /** Whether the visual editor is active (shows edit handles) */
  isEditing: boolean;

  // --- Callbacks ---
  onAddToCart: (itemId: string, qty?: number, modifiers?: any) => void;
  onSelectItem: (item: InventoryItem) => void;
  onNavigate: (path: string) => void;
}
