import { notFound } from 'next/navigation';
import { isPartnerContext } from '@/lib/env';

// Re-export metadata from metadata.ts so Next.js picks it up
// (page.tsx is "use client" and cannot export generateMetadata)
export { generateMetadata } from './metadata';

/**
 * Platform-only gate: the /partners page is a BasaltSurge marketing page
 * for the partner program. Partner containers should NOT serve this page.
 */
export default function PartnersLayout({ children }: { children: React.ReactNode }) {
    if (isPartnerContext()) {
        notFound();
    }
    return <>{children}</>;
}
