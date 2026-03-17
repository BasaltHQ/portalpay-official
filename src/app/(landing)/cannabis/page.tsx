import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cannabis POS & Compliance | Free METRC + BioTrack Integration | BasaltSurge',
  description:
    'The first free, fully compliant cannabis POS solution. Native METRC v2 and BioTrack integration with 210+ API endpoints. Seed-to-sale tracking, audit reconciliation, and crypto payments — zero compliance fees.',
  openGraph: {
    title: 'Cannabis POS & Compliance | BasaltSurge',
    description: 'Free METRC + BioTrack integration. 23 states. 210+ endpoints. Zero compliance fees.',
    url: 'https://surge.basalthq.com/cannabis',
    siteName: 'BasaltSurge',
    type: 'website',
  },
  alternates: { canonical: 'https://surge.basalthq.com/cannabis' },
};

export { default } from './CannabisLandingClient';
