import type { Metadata } from "next";
import { getContainer } from "@/lib/cosmos";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://portalpay.app";
const DEFAULT_WIDGET_ID = "CBFCIBAA3AAABLblqZhAcvuUre-Wl9SplRpshpIXktBmcqH0bX_pANw6g4h-3k1aNaWOvcg_KApu-1KAFPMs*";

export const metadata: Metadata = {
  title: "Standard Partner Agreement | PortalPay",
  description: "Sign the standard PortalPay Partner Services Agreement. Join our partner network with enterprise-grade crypto payment infrastructure.",
  openGraph: {
    type: "website",
    url: `${BASE_URL}/msa`,
    title: "Standard Partner Agreement | PortalPay",
    siteName: "PortalPay",
    description: "Sign the standard PortalPay Partner Services Agreement. Join our partner network with enterprise-grade crypto payment infrastructure.",
    locale: "en_US",
    images: [
      {
        url: `${BASE_URL}/PortalPay.png`,
        width: 1200,
        height: 630,
        alt: "PortalPay Partner Agreement",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Standard Partner Agreement | PortalPay",
    description: "Sign the standard PortalPay Partner Services Agreement. Join our partner network with enterprise-grade crypto payment infrastructure.",
    images: [`${BASE_URL}/PortalPay.png`],
  },
};

async function getWidgetId(): Promise<string> {
  try {
    const container = await getContainer();
    const { resource } = await container.item("contract-widgets", "platform_config").read();
    if (resource?.config?.msa?.widgetId) {
      return resource.config.msa.widgetId;
    }
  } catch {
    // Fall back to default if not found
  }
  return DEFAULT_WIDGET_ID;
}

export default async function MSAPage() {
  const widgetId = await getWidgetId();

  return (
    <div className="min-h-screen w-full">
      <iframe
        src={`https://na2.documents.adobe.com/public/esignWidget?wid=${widgetId}&hosted=false`}
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0, overflow: "hidden", minHeight: "500px", minWidth: "600px", height: "100vh" }}
      />
    </div>
  );
}
