import { generateVsOgImage } from '@/app/api/og-image/vs/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Payment Processor Comparisons';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/jpeg';

export default async function Image() {
  try {
    return await generateVsOgImage();
  } catch (error) {
    console.error('OG image generation error (vs browse):', error);
    return new Response(null, {
      status: 500,
      statusText: 'OG Generation Failed',
    });
  }
}
