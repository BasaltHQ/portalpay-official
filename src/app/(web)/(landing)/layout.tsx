import React from "react";
import type { Metadata } from "next";
import AcceptedServices from "@/components/landing/AcceptedServices";
import TechnologyPartners from "@/components/landing/TechnologyPartners";
import SiteFooter from "@/components/landing/SiteFooter";
import { getProductionBaseUrl } from "@/lib/base-url";

export const dynamic = "force-dynamic";

/**
 * Landing pages metadata - ensures metadataBase is never localhost.
 * This is critical because Next.js generates OG image URLs based on metadataBase.
 */
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getProductionBaseUrl();
  return {
    metadataBase: new URL(baseUrl),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <AcceptedServices />
        <TechnologyPartners />
      </div>
      <SiteFooter />
    </>
  );
}
