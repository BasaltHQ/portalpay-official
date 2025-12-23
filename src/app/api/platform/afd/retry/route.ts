import { NextRequest, NextResponse } from "next/server";
import { DefaultAzureCredential } from "@azure/identity";
import { CdnManagementClient } from "@azure/arm-cdn";
import { WebSiteManagementClient } from "@azure/arm-appservice";
import { requireThirdwebAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RetryBody = {
  brandKey?: string;
  siteName?: string; // default pp-<brandKey>
  azure?: {
    subscriptionId?: string;
    afdProfileName?: string;
    resourceGroup?: string; // preferred RG for AFD profile
  };
};

/**
 * POST /api/platform/afd/retry
 * Admin-only endpoint to retry Azure Front Door (AFD) configuration for a brand/site
 * after a temporary service management block has been lifted.
 *
 * Body:
 * {
 *   "brandKey": "paynex",
 *   "siteName": "pp-paynex", // optional; defaults to pp-<brandKey>
 *   "azure": {
 *     "subscriptionId": "...", // optional; defaults to env AZURE_SUBSCRIPTION_ID
 *     "afdProfileName": "afd-portalpay-prod", // optional; defaults to env AZURE_AFD_PROFILE_NAME
 *     "resourceGroup": "PortalPay" // optional preferred RG for profile; defaults to env AZURE_AFD_RESOURCE_GROUP
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const caller = await requireThirdwebAuth(req);
    if (!Array.isArray((caller as any)?.roles) || !(caller as any).roles.includes("admin")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: RetryBody = {};
  try {
    body = await req.json();
  } catch {}

  const brandKey = String(body?.brandKey || "").trim().toLowerCase();
  const siteName = String(body?.siteName || (brandKey ? `pp-${brandKey}` : "")).trim();
  const subscription = String(body?.azure?.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID || "").trim();
  const afdProfile = String(body?.azure?.afdProfileName || process.env.AZURE_AFD_PROFILE_NAME || "").trim();

  // Prefer explicit AFD RG, otherwise fall back to App Service Plan RG (PortalPay) or generic deploy RG
  const configuredAfdRg = String(body?.azure?.resourceGroup || process.env.AZURE_AFD_RESOURCE_GROUP || process.env.AZURE_APP_SERVICE_RESOURCE_GROUP || process.env.AZURE_RESOURCE_GROUP || "").trim();

  const errors: string[] = [];
  if (!brandKey) errors.push("brandKey required");
  if (!siteName) errors.push("siteName required or provide brandKey");
  if (!subscription) errors.push("AZURE_SUBSCRIPTION_ID is required");
  if (!afdProfile) errors.push("AZURE_AFD_PROFILE_NAME is required");
  if (!configuredAfdRg) errors.push("AZURE_AFD_RESOURCE_GROUP or a valid resourceGroup is required");

  if (errors.length) {
    return NextResponse.json(
      { ok: false, error: "invalid_input", details: errors },
      { status: 400 }
    );
  }

  const progress: Array<{ step: string; ok: boolean; info?: any }> = [];

  try {
    const credential = new DefaultAzureCredential();
    const cdn = new CdnManagementClient(credential, subscription);
    progress.push({ step: "auth", ok: true });

    // Discover endpoint under profile - scan candidate RGs to find actual profile RG
    const tryRgs = Array.from(new Set([
      configuredAfdRg,
      String(process.env.AZURE_APP_SERVICE_RESOURCE_GROUP || "").trim() || undefined,
      "PortalPay",
      "rg-portalpay-prod"
    ].filter(Boolean))) as string[];

    let endpointName = String(process.env.AZURE_AFD_ENDPOINT_NAME || "").trim();
    let effectiveAfdRg: string = configuredAfdRg;

    if (!endpointName) {
      let foundEp: any = null;
      for (const rgCandidate of tryRgs) {
        try {
          const eps: any[] = [];
          for await (const ep of cdn.afdEndpoints.listByProfile(rgCandidate, afdProfile)) {
            eps.push(ep);
          }
          if (eps.length > 0) {
            foundEp = eps[0];
            effectiveAfdRg = rgCandidate;
            break;
          }
        } catch {
          // continue to next candidate
        }
      }
      endpointName = String(foundEp?.name || "");
    }

    if (!endpointName) {
      return NextResponse.json(
        { ok: false, error: "afd_endpoint_not_found", details: { profile: afdProfile, triedResourceGroups: tryRgs } },
        { status: 404 }
      );
    }

    // Compose names/host
    const ogName = `og-${brandKey}`;
    const originName = `origin-${siteName}`;
    const originHost = `${siteName}.azurewebsites.net`;

    // Create/Update Origin Group
    await cdn.afdOriginGroups.beginCreateAndWait(effectiveAfdRg, afdProfile, ogName, {
      healthProbeSettings: { probePath: "/", probeRequestType: "GET", probeProtocol: "Https", probeIntervalInSeconds: 240 } as any,
      loadBalancingSettings: { sampleSize: 4, successfulSamplesRequired: 3, additionalLatencyInMilliseconds: 50 } as any,
    } as any);
    progress.push({ step: "afd_origin_group", ok: true, info: { originGroup: ogName, rg: effectiveAfdRg, profile: afdProfile } });

    // Create/Update Origin
    await cdn.afdOrigins.beginCreateAndWait(effectiveAfdRg, afdProfile, ogName, originName, {
      hostName: originHost,
      httpPort: 80,
      httpsPort: 443,
      originHostHeader: originHost,
      enabledState: "Enabled",
      priority: 1,
      weight: 1000,
    } as any);
    progress.push({ step: "afd_origin", ok: true, info: { origin: originName, host: originHost } });

    // Create/Update Route (map default endpoint domain; custom domains can be bound later in DNS)
    const routeName = `route-${brandKey}`;
    await cdn.routes.beginCreateAndWait(effectiveAfdRg, afdProfile, endpointName, routeName, {
      originGroup: {
        id: `/subscriptions/${subscription}/resourceGroups/${effectiveAfdRg}/providers/Microsoft.Cdn/profiles/${afdProfile}/originGroups/${ogName}`,
      },
      patternsToMatch: ["/*"],
      supportedProtocols: ["Https"],
      httpsRedirect: "Enabled",
      forwardingProtocol: "HttpsOnly",
      compressionSettings: { isCompressionEnabled: true } as any,
      linkToDefaultDomain: "Enabled",
      enabledState: "Enabled",
    } as any);

    progress.push({
      step: "afd_route",
      ok: true,
      info: { route: routeName, endpoint: endpointName }
    });

    return NextResponse.json({
      ok: true,
      progress,
      result: {
        resourceGroup: effectiveAfdRg,
        profile: afdProfile,
        endpoint: endpointName,
        originGroup: ogName,
        origin: originName,
        route: routeName
      }
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || String(e),
      progress
    }, { status: 500 });
  }
}
