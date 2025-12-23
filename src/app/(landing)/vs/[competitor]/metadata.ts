import type { Metadata } from "next";
import { buildOgTwitterForRoute } from "@/lib/brand-meta";

/**
 * Competitor-specific comparisons landing metadata
 * - Aligns OG/Twitter fields with main landing page support
 * - Intentionally omits images so existing opengraph-image.tsx/twitter-image.tsx continue to drive previews
 */
export async function generateMetadata({ params }: { params: { competitor: string } }): Promise<Metadata> {
  const competitor = (params?.competitor || "").toString();
  const pretty = competitor.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const meta = await buildOgTwitterForRoute({
    path: `/vs/${competitor}`,
    title: `PortalPay vs ${pretty}`,
    description:
      `See how PortalPay compares to ${pretty}: multi-currency payments on Base, instant receipts & QR terminals, inventory & orders, tax jurisdictions & components, reserve analytics, on-chain split releases, and branding/partner tools.`,
  });

  return {
    openGraph: {
      type: "website",
      url: meta.openGraph?.url,
      title: meta.openGraph?.title,
      siteName: meta.openGraph?.siteName,
      description: meta.openGraph?.description,
      locale: meta.openGraph?.locale,
      // images intentionally omitted to keep route-level image generation exactly as-is
    },
    twitter: {
      card: "summary_large_image",
      title: meta.twitter?.title,
      description: meta.twitter?.description,
      site: meta.twitter?.site,
      creator: meta.twitter?.creator,
      // images intentionally omitted to keep route-level image generation exactly as-is
    },
  };
}
