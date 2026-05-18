import type { Metadata } from 'next';
import { buildOgTwitterForRoute } from '@/lib/brand-meta';

/**
 * Partners page metadata.
 * - Intentionally omits images so existing opengraph-image.tsx/twitter-image.tsx continue to drive previews
 */
export async function generateMetadata(): Promise<Metadata> {
  const meta = await buildOgTwitterForRoute({
    path: '/partners',
    title: 'Partner Program — BasaltSurge',
    description: 'Launch your brand on BasaltSurge with a dedicated whitelabel container. Full-stack crypto commerce: shops, receipts, QR terminals, on-chain settlement, and complete branding control.',
  });
  return {
    openGraph: {
      type: 'website',
      url: meta.openGraph?.url,
      title: meta.openGraph?.title,
      siteName: meta.openGraph?.siteName,
      description: meta.openGraph?.description,
      locale: meta.openGraph?.locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.twitter?.title,
      description: meta.twitter?.description,
      site: meta.twitter?.site,
      creator: meta.twitter?.creator,
    },
  };
}
