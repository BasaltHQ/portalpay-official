/**
 * Centralized utility for dynamic branding content transformation.
 * Used to replace platform-specific text (PortalPay, BasaltSurge, API URLs)
 * with partner-branded equivalents in partner containers.
 */

// Note: partner detection now uses brand.key instead of isPartnerContext()
import { BrandConfig } from "@/config/brands";
import { getBaseUrl } from "@/lib/base-url";

/**
 * Transform content to replace platform branding with partner branding.
 * This handles:
 * - "PortalPay" → partner brand name
 * - "BasaltSurge" → partner brand name  
 * - "api.pay.ledger1.ai/portalpay" → partner API URL
 * - "pay.ledger1.ai" → partner app URL
 * 
 * @param content - Raw content string (markdown, text, etc.)
 * @param brand - Brand configuration with name and appUrl
 * @returns Transformed content with partner branding
 */
export function dePortalContent(content: string, brand: BrandConfig): string {
    if (!content) return content;
    // Detect partner by brand key - platform brands don't need transformation
    const isPlatformBrand = ['portalpay', 'basaltsurge'].includes((brand.key || '').toLowerCase());
    if (isPlatformBrand) return content;

    const partnerName = brand.name;
    const partnerKey = brand.key?.toLowerCase() || "partner";

    // Get the partner's base URL (app domain)
    // Prefer brand.appUrl if set, otherwise use current origin
    const partnerAppUrl = brand.appUrl || getBaseUrl();

    // Remove protocol for domain-only replacements
    const partnerDomain = partnerAppUrl.replace(/^https?:\/\//, "");

    // Build partner API URL pattern
    // Partner API is typically at: api.{partner-domain}/{brand-key}
    // If partner uses custom API, brand.appUrl should reflect that
    const partnerApiDomain = `api.${partnerDomain}`;
    const partnerApiPath = `${partnerApiDomain}/${partnerKey}`;

    return content
        // Replace brand names
        .replaceAll("PortalPay", partnerName)
        .replaceAll("BasaltSurge", partnerName)
        // Replace API URLs - full path first, then domain
        .replaceAll("api.pay.ledger1.ai/portalpay", partnerApiPath)
        .replaceAll("api.surge.basalthq.com/basaltsurge", partnerApiPath)
        .replaceAll("api.pay.ledger1.ai", partnerApiDomain)
        .replaceAll("api.surge.basalthq.com", partnerApiDomain)
        // Replace app URLs
        .replaceAll("pay.ledger1.ai", partnerDomain)
        .replaceAll("surge.basalthq.com", partnerDomain);
}

/**
 * Simple brand name replacement for use in components.
 * Use this when you only need name replacement without URL transformation.
 */
export function dePortalName(text: string, brandName: string, brandKey?: string): string {
    if (!text) return text;
    // Platform brands don't need transformation
    const isPlatformBrand = ['portalpay', 'basaltsurge'].includes((brandKey || '').toLowerCase());
    if (isPlatformBrand) return text;

    return text
        .replaceAll("PortalPay", brandName)
        .replaceAll("BasaltSurge", brandName);
}
