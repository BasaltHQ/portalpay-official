import type { Metadata } from "next";
import { getContainer } from "@/lib/cosmos";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://portalpay.app";
const DEFAULT_WIDGET_ID = "CBFCIBAA3AAABLblqZhAHRCQTck4tBTVuSFpOBUyzpaX3Pwfl4C7LnOMuF3NAsQix9gPj1Ei-619ikHBIyTI*";

export const metadata: Metadata = {
  title: "Custom Partner Agreement | PortalPay",
  description: "Sign your custom PortalPay Partner Services Agreement with negotiated terms. Enterprise partnership with tailored pricing and features.",
  openGraph: {
    type: "website",
    url: `${BASE_URL}/msas`,
    title: "Custom Partner Agreement | PortalPay",
    siteName: "PortalPay",
    description: "Sign your custom PortalPay Partner Services Agreement with negotiated terms. Enterprise partnership with tailored pricing and features.",
    locale: "en_US",
    images: [
      {
        url: `${BASE_URL}/PortalPay.png`,
        width: 1200,
        height: 630,
        alt: "PortalPay Custom Partner Agreement",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Partner Agreement | PortalPay",
    description: "Sign your custom PortalPay Partner Services Agreement with negotiated terms. Enterprise partnership with tailored pricing and features.",
    images: [`${BASE_URL}/PortalPay.png`],
  },
};

async function getWidgetId(): Promise<string> {
  try {
    const container = await getContainer();
    const { resource } = await container.item("contract-widgets", "platform_config").read();
    if (resource?.config?.msas?.widgetId) {
      return resource.config.msas.widgetId;
    }
  } catch {
    // Fall back to default if not found
  }
  return DEFAULT_WIDGET_ID;
}

export default async function MSASpecialPage() {
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
