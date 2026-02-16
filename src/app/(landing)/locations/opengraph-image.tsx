import { generateLocationsOgImage } from '@/app/api/og-image/locations/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Crypto Payment Locations';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/jpeg';

export default async function Image() {
  try {
    return await generateLocationsOgImage();
  } catch (error) {
    console.error('OG image generation error (locations browse):', error);
    return new Response(null, {
      status: 500,
      statusText: 'OG Generation Failed',
    });
  }
}
