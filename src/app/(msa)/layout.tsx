import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://portalpay.app";

export const metadata: Metadata = {
  title: "Partner Services Agreement | PortalPay",
  description: "Review and sign the PortalPay Partner Services Agreement. Become a PortalPay partner and gain access to our full-stack crypto commerce platform.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    url: `${BASE_URL}/msa`,
    title: "Partner Services Agreement | PortalPay",
    siteName: "PortalPay",
    description: "Review and sign the PortalPay Partner Services Agreement. Become a PortalPay partner and gain access to our full-stack crypto commerce platform.",
    locale: "en_US",
    images: [
      {
        url: `${BASE_URL}/PortalPay.png`,
        width: 1200,
        height: 630,
        alt: "PortalPay Partner Services Agreement",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner Services Agreement | PortalPay",
    description: "Review and sign the PortalPay Partner Services Agreement. Become a PortalPay partner and gain access to our full-stack crypto commerce platform.",
    images: [`${BASE_URL}/PortalPay.png`],
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
