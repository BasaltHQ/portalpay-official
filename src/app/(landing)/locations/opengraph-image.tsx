import { ImageResponse } from 'next/og';
import { getInternalBaseUrl } from '@/lib/base-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Crypto Payment Locations';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/jpeg';

export default async function Image() {
  // Use internal URL if available (e.g. Docker), otherwise fallback to production URL for build time
  const internalUrl = process.env.INTERNAL_BASE_URL;
  const baseUrl = internalUrl || (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://surge.basalthq.com');

  try {
    // Fetch the generated OG image from the browse-level API route
    // Note: During build (SSG), we must use a fully qualified, accessible URL. 
    // If running in Vercel/CI without a running server, this fetch might fail unless pointing to a live URL.
    const ogImageRes = await fetch(`${baseUrl}/api/og-image/locations`, {
      cache: 'no-store',
    });

    if (ogImageRes.ok) {
      const imageBuffer = await ogImageRes.arrayBuffer();
      return new Response(imageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }
  } catch (error) {
    console.error('OG image fetch error (locations browse):', error);
  }

  // Fallback: return a simple error response
  return new Response(null, {
    status: 404,
    statusText: 'OG Image Not Found',
  });
}
