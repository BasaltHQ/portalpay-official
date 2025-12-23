import { Metadata } from 'next';
import { getBrandConfig } from '@/config/brands';
import { getBaseUrl } from '@/lib/base-url';
import { isPartnerContext } from '@/lib/env';
import ComparisonsClient from './ComparisonsClient';

export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig();
  const BASE_URL = isPartnerContext() ? getBaseUrl() : 'https://pay.ledger1.ai';
  const title = `${brand.name} vs Competitors | Compare Payment Processors`;
  const description = `Compare ${brand.name} with Stripe, Square, PayPal, Toast, and other payment processors. See how you can save 70%+ on fees with instant settlement and crypto payments.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/vs`,
      siteName: brand.name,
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/vs`,
    },
  };
}

export default function ComparisonsIndexPage() {
  return <ComparisonsClient />;
}
