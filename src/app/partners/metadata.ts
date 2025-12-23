import type { Metadata } from 'next';
import { buildOgTwitterForRoute } from '@/lib/brand-meta';

export async function generateMetadata(): Promise<Metadata> {
  const meta = await buildOgTwitterForRoute({
    path: '/partners',
  });
  return {
    openGraph: {
      type: 'website',
      url: meta.openGraph?.url,
      title: meta.openGraph?.title,
      siteName: meta.openGraph?.siteName,
      description: meta.openGraph?.description,
      locale: meta.openGraph?.locale,
      images: meta.openGraph?.images,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.twitter?.title,
      description: meta.twitter?.description,
      site: meta.twitter?.site,
      creator: meta.twitter?.creator,
      images: meta.twitter?.images,
    },
  };
}
