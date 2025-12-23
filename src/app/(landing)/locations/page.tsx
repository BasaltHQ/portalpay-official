import type { Metadata } from 'next';
import LocationsClient from './LocationsClient';
import { getBrandConfig } from '@/config/brands';
import { getBaseUrl } from '@/lib/base-url';
import { isPartnerContext } from '@/lib/env';

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig();
  const BASE_URL = isPartnerContext() ? getBaseUrl() : 'https://pay.ledger1.ai';
  const dePortal = (s: string) => (isPartnerContext() ? s.replaceAll('PortalPay', brand.name) : s);
  const title = `Locations | ${brand.name}`;
  const description = dePortal('Browse crypto payment landing pages by city. Explore local context, relevant industries, and how PortalPay helps businesses accept digital payments.');
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/locations`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/locations`,
      type: 'website',
      siteName: brand.name,
    },
  };
}

export default function LocationsIndexPage() {
  return <LocationsClient />;
}
