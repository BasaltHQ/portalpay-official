import type { Metadata } from "next";
import { buildOgTwitterForRoute } from "@/lib/brand-meta";

/**
 * Comparisons landing metadata (root of /vs)
 * - Aligns OG/Twitter fields with main landing page support
 * - Intentionally omits images so existing opengraph-image.tsx/twitter-image.tsx continue to drive previews
 */
export async function generateMetadata(): Promise<Metadata> {
  const meta = await buildOgTwitterForRoute({
    path: "/vs",
    title: "PortalPay Comparisons",
    description:
      "Compare PortalPay to legacy platforms. See how multi-currency payments on Base, instant receipts & QR terminals, inventory & orders, tax jurisdictions, reserve analytics, and on-chain split releases stack up.",
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
