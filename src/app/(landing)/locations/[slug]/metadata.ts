import type { Metadata } from "next";
import { buildOgTwitterForRoute } from "@/lib/brand-meta";

/**
 * Location-specific landing metadata
 * - Aligns OG/Twitter fields with main landing page support
 * - Intentionally omits images so existing opengraph-image.tsx/twitter-image.tsx continue to drive previews
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = (params?.slug || "").toString();
  const pretty = slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const meta = await buildOgTwitterForRoute({
    path: `/locations/${slug}`,
    title: `Crypto Payments in ${pretty}`,
    description:
      `Accept multi-currency payments in ${pretty} on Base with instant receipts & QR terminals. Configure tax jurisdictions & components, manage inventory & orders, use reserve analytics & on-chain split releases, and run branded commerce.`,
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
