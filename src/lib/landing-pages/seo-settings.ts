/**
 * SEO Page Settings Utilities
 * Provides server-side functions to check if landing pages are enabled/disabled
 */

import { getContainer } from "@/lib/cosmos";
import { getBrandKey } from "@/config/brands";
import { isPartnerContext } from "@/lib/env";

// Document ID pattern: seo:pages:<brandKey>
function getDocId(brandKey: string): string {
  const key = String(brandKey || "portalpay").toLowerCase();
  return `seo:pages:${key}`;
}

export interface SEOPagesSettings {
  pageStatuses: Record<string, { enabled: boolean }>;
  templates: {
    industries: Record<string, string>;
    comparisons: Record<string, string>;
    locations: Record<string, string>;
  };
}

/**
 * Fetch SEO page settings from Cosmos DB
 * Returns null if document doesn't exist or on error
 */
export async function getSEOPagesSettings(brandKeyOverride?: string): Promise<SEOPagesSettings | null> {
  try {
    let brandKey = brandKeyOverride;
    if (!brandKey) {
      try { brandKey = getBrandKey(); } catch { brandKey = "portalpay"; }
    }
    brandKey = String(brandKey || "portalpay").toLowerCase();

    const docId = getDocId(brandKey);
    const c = await getContainer();
    const { resource } = await c.item(docId, docId).read<any>();

    if (resource) {
      // Normalize pageStatuses
      const pageStatuses: Record<string, { enabled: boolean }> = {};
      if (resource.pageStatuses && typeof resource.pageStatuses === "object") {
        for (const [key, value] of Object.entries(resource.pageStatuses)) {
          if (typeof value === "object" && value !== null) {
            pageStatuses[key] = { enabled: (value as any).enabled !== false };
          }
        }
      }

      // Normalize templates
      const templates: SEOPagesSettings["templates"] = {
        industries: {},
        comparisons: {},
        locations: {},
      };

      if (resource.templates && typeof resource.templates === "object") {
        for (const category of ["industries", "comparisons", "locations"] as const) {
          const categoryTemplates = resource.templates[category];
          if (categoryTemplates && typeof categoryTemplates === "object") {
            for (const [key, value] of Object.entries(categoryTemplates)) {
              if (typeof value === "string") {
                templates[category][key] = value;
              }
            }
          }
        }
      }

      return { pageStatuses, templates };
    }
    return null;
  } catch (err: any) {
    // Document not found or connection error - return null
    if (err?.code === 404 || err?.message?.includes("NotFound")) {
      return null;
    }
    console.error("[seo-settings] Error fetching settings:", err);
    return null;
  }
}

/**
 * Check if a specific page is enabled
 * Page keys follow the format: "industry-<slug>", "comparison-<slug>", "location-<slug>"
 * (matching the admin panel's page.id format)
 * 
 * Default behavior:
 * - If no SEO settings document exists, all pages are ENABLED by default
 * - If the page key doesn't exist in settings, it's ENABLED by default
 * - Only explicitly disabled pages (enabled: false) return false
 * 
 * IMPORTANT: On platform container, landing pages should always be enabled by default.
 * Partners may have their own SEO settings that disable certain pages.
 */
export async function isPageEnabled(
  pageType: 'industry' | 'comparison' | 'location',
  slug: string,
  brandKeyOverride?: string
): Promise<boolean> {
  // Match admin panel's page ID format: "industry-slug", "comparison-slug", "location-slug"
  const pageKey = `${pageType}-${slug}`;
  
  try {
    // Determine brand key for debugging
    let brandKey = brandKeyOverride;
    if (!brandKey) {
      try { brandKey = getBrandKey(); } catch { brandKey = "portalpay"; }
    }
    brandKey = String(brandKey || "portalpay").toLowerCase();
    
    console.log(`[seo-settings] Checking page: ${pageKey} for brand: ${brandKey}`);
    
    const settings = await getSEOPagesSettings(brandKeyOverride);
    
    // No settings document - default to enabled
    if (!settings) {
      console.log(`[seo-settings] No settings document found for brand: ${brandKey} - defaulting to enabled`);
      return true;
    }

    console.log(`[seo-settings] Found settings with ${Object.keys(settings.pageStatuses).length} page statuses`);
    
    const status = settings.pageStatuses[pageKey];

    // No explicit setting for this page - default to enabled
    if (!status) {
      console.log(`[seo-settings] No status entry for ${pageKey} - defaulting to enabled`);
      return true;
    }

    // Log the actual status
    console.log(`[seo-settings] Page ${pageKey} status:`, JSON.stringify(status));

    // Log for debugging when a page is disabled
    if (!status.enabled) {
      console.log(`[seo-settings] Page ${pageKey} is explicitly disabled`);
    } else {
      console.log(`[seo-settings] Page ${pageKey} is enabled`);
    }

    return status.enabled;
  } catch (err) {
    // On any error, default to enabled to avoid breaking pages
    console.error(`[seo-settings] Error checking page ${pageKey}:`, err);
    return true;
  }
}

/**
 * Get all enabled industry slugs
 */
export async function getEnabledIndustrySlugs(
  allSlugs: string[],
  brandKeyOverride?: string
): Promise<string[]> {
  const settings = await getSEOPagesSettings(brandKeyOverride);

  // No settings document - all pages enabled
  if (!settings) {
    return allSlugs;
  }

  return allSlugs.filter((slug) => {
    const pageKey = `industry-${slug}`;
    const status = settings.pageStatuses[pageKey];
    // Default to enabled if no explicit setting
    return !status || status.enabled;
  });
}

/**
 * Get all enabled comparison slugs
 */
export async function getEnabledComparisonSlugs(
  allSlugs: string[],
  brandKeyOverride?: string
): Promise<string[]> {
  const settings = await getSEOPagesSettings(brandKeyOverride);

  if (!settings) {
    return allSlugs;
  }

  return allSlugs.filter((slug) => {
    const pageKey = `comparison-${slug}`;
    const status = settings.pageStatuses[pageKey];
    return !status || status.enabled;
  });
}

/**
 * Get all enabled location slugs
 */
export async function getEnabledLocationSlugs(
  allSlugs: string[],
  brandKeyOverride?: string
): Promise<string[]> {
  const settings = await getSEOPagesSettings(brandKeyOverride);

  if (!settings) {
    return allSlugs;
  }

  return allSlugs.filter((slug) => {
    const pageKey = `location-${slug}`;
    const status = settings.pageStatuses[pageKey];
    return !status || status.enabled;
  });
}
