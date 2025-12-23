import type { Metadata } from "next";
import { buildOgTwitterForRoute } from "@/lib/brand-meta";

/**
 * Locations landing metadata
 * - Uses the same OG/Twitter fields (title/description/siteName/url/locale/card/etc.)
 * - Intentionally omits images so existing opengraph-image.tsx/twitter-image.tsx continue to drive previews
 */
export async function generateMetadata(): Promise<Metadata> {
  const meta = await buildOgTwitterForRoute({
    path: "/locations",
    title: "Crypto Payments by Location",
    description:
      "Explore PortalPay support across cities and regions: configure tax jurisdictions and components, generate instant receipts, and accept multi-currency payments on Base.",
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
