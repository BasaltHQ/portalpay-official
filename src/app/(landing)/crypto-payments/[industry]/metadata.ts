import type { Metadata } from "next";
import { buildOgTwitterForRoute } from "@/lib/brand-meta";

/**
 * Industry-specific crypto payments landing metadata
 * - Aligns OG/Twitter fields with main landing page support
 * - Intentionally omits images so existing opengraph-image.tsx/twitter-image.tsx continue to drive previews
 */
export async function generateMetadata({ params }: { params: { industry: string } }): Promise<Metadata> {
  const industry = (params?.industry || "").toString();
  const pretty = industry.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const meta = await buildOgTwitterForRoute({
    path: `/crypto-payments/${industry}`,
    title: `Crypto Payments — ${pretty}`,
    description:
      `Accept crypto payments for ${pretty} on Base with instant receipts & QR terminals. Configure industry packs, inventory & orders, tax jurisdictions, reserve analytics, on-chain split releases, and branded commerce.`,
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
