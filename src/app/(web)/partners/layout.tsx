import { notFound } from 'next/navigation';
import Script from 'next/script';
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
    return (
        <>
            {/* LinkedIn Insight Tag — lead tracking for LinkedIn Ads */}
            <Script id="linkedin-partner" strategy="afterInteractive">{`
                _linkedin_partner_id = "8943644";
                window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            `}</Script>
            <Script id="linkedin-insight" strategy="afterInteractive">{`
                (function(l) {
                    if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                    window.lintrk.q=[]}
                    var s = document.getElementsByTagName("script")[0];
                    var b = document.createElement("script");
                    b.type = "text/javascript";b.async = true;
                    b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                    s.parentNode.insertBefore(b, s);
                })(window.lintrk);
            `}</Script>
            <noscript>
                <img height="1" width="1" style={{ display: 'none' }} alt="" src="https://px.ads.linkedin.com/collect/?pid=8943644&fmt=gif" />
            </noscript>
            {children}
        </>
    );
}
