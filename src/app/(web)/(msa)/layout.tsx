import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://portalpay.app";

export const metadata: Metadata = {
  title: "Partner Services Agreement | BasaltSurge",
  description: "Review and sign the BasaltSurge Partner Services Agreement. Become a BasaltSurge partner and gain access to our full-stack crypto commerce platform.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/msa`,
    title: "Partner Services Agreement | BasaltSurge",
    siteName: "BasaltSurge",
    description: "Review and sign the BasaltSurge Partner Services Agreement. Become a BasaltSurge partner and gain access to our full-stack crypto commerce platform.",
    locale: "en_US",
    images: [
      {
        url: `${BASE_URL}/BasaltSurgeWideD.png`,
        width: 1200,
        height: 630,
        alt: "BasaltSurge Partner Services Agreement",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner Services Agreement | BasaltSurge",
    description: "Review and sign the BasaltSurge Partner Services Agreement. Become a BasaltSurge partner and gain access to our full-stack crypto commerce platform.",
    images: [`${BASE_URL}/BasaltSurgeWideD.png`],
  },
};

/**
 * Minimal layout for MSA signing pages - no navbar, no footer, just the iframe
 */
export default function MSALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white">
      {children}
    </div>
  );
}
