import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";
import { getContainer } from "@/lib/cosmos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Container/Image info returned to the UI
 */
interface ContainerInfo {
  id: string;
  name: string;
  brandKey: string;
  type: "containerapps" | "appservice" | "registry";
  image?: string;
  tag?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  url?: string;
  endpoint?: string; // The URL to embed in the APK for this brand
  hasSignedApk?: boolean;
  hasPackage?: boolean;
  packageUrl?: string;
  hasPartner?: boolean; // Whether this webapp has a matching partner in CosmosDB
  partnerInfo?: {
    brandKey: string;
    name?: string;
    appUrl?: string;
  };
}

/**
 * Partner brand info from CosmosDB
 */
interface PartnerBrand {
  brandKey: string;
  name?: string;
  appUrl?: string;
  hasWebapp?: boolean;
}

interface ListContainersResponse {
  containers: ContainerInfo[];
  registryImages: Array<{
    repository: string;
    tags: string[];
    latestTag?: string;
    latestDigest?: string;
    updatedAt?: string;
  }>;
  partners: PartnerBrand[];
  unmatchedPartners: PartnerBrand[]; // Partners without matching webapps
  error?: string;
}

function json(obj: any, init?: { status?: number; headers?: Record<string, string> }) {
  const s = JSON.stringify(obj);
  const len = new TextEncoder().encode(s).length;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Content-Length": String(len),
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    ...(init?.headers || {}),
  };
  return new NextResponse(s, { status: init?.status ?? 200, headers });
}

/**
 * List partner brands from CosmosDB
 * Partners are stored as brand_config documents with wallet = brandKey
 */
async function listPartnerBrands(): Promise<PartnerBrand[]> {
  const results: PartnerBrand[] = [];
  try {
    const c = await getContainer();
    // Query all brand_config docs
    const query = {
      query: "SELECT c.wallet, c.name, c.appUrl FROM c WHERE c.type = @type",
      parameters: [{ name: "@type", value: "brand_config" }],
    };
    const { resources } = await c.items.query<{ wallet: string; name?: string; appUrl?: string }>(query, { maxItemCount: 1000 }).fetchAll();
    
    for (const r of resources || []) {
      const brandKey = String(r.wallet || "").toLowerCase();
      if (brandKey) {
        results.push({
          brandKey,
          name: r.name,
          appUrl: r.appUrl,
        });
      }
    }
  } catch (e: any) {
    console.error("[listPartnerBrands] Error:", e?.message || e);
  }
  return results;
}

/**
 * Map webapp names to brand keys for APK purposes
 * Some webapps have names that differ from their APK brand key
 */
const WEBAPP_TO_BRAND_MAP: Record<string, string> = {
  "payportal": "portalpay", // webapp "payportal" uses APK brand "portalpay"
};

/**
 * List ALL App Service web apps in the specified resource group
 * This includes both container-based and non-container web apps.
 * Each web app can be a brand that needs an APK package.
 * 
 * The webapp NAME is used as the brandKey for matching against partners,
 * with special mappings for known exceptions (e.g., payportal → portalpay).
 */
async function listAppServiceApps(
  credential: any,
  subscription: string,
  resourceGroup: string
): Promise<{ results: ContainerInfo[]; error?: string }> {
  const results: ContainerInfo[] = [];
  try {
    const { WebSiteManagementClient } = await import("@azure/arm-appservice");
    console.log(`[listAppServiceApps] Listing webapps in subscription=${subscription}, resourceGroup=${resourceGroup}`);
    const client = new WebSiteManagementClient(credential, subscription);
    
    let count = 0;
    for await (const app of client.webApps.listByResourceGroup(resourceGroup)) {
      count++;
      // Skip function apps
      if (app.kind?.toLowerCase().includes("functionapp")) continue;
      
      // The webapp NAME is used as the base, but check for known mappings
      // e.g., webapp "payportal" = brandKey "portalpay" for APK purposes
      const webappName = app.name?.toLowerCase() || "";
      const brandKey = WEBAPP_TO_BRAND_MAP[webappName] || webappName;
      
      // Determine if it's a container-based app
      const isContainer = app.kind?.toLowerCase().includes("container") || 
                          app.siteConfig?.linuxFxVersion?.toLowerCase().startsWith("docker|");
      const image = isContainer ? (app.siteConfig?.linuxFxVersion?.replace(/^DOCKER\|/i, "") || "") : "";
      const tag = image ? (image.split(":")[1] || "latest") : "";
      
      // Construct the endpoint URL
      const endpoint = app.defaultHostName ? `https://${app.defaultHostName}` : undefined;
      
      results.push({
        id: app.id || app.name || "",
        name: app.name || "",
        brandKey,
        type: "appservice",
        image: image || undefined,
        tag: tag || undefined,
        status: app.state || "unknown",
        createdAt: app.lastModifiedTimeUtc?.toISOString(),
        updatedAt: app.lastModifiedTimeUtc?.toISOString(),
        url: endpoint,
        endpoint, // Store the endpoint URL for APK generation
      });
    }
    console.log(`[listAppServiceApps] Found ${count} webapps, returning ${results.length} after filtering`);
    return { results };
  } catch (e: any) {
    const errorMsg = e?.message || String(e);
    console.error("[listAppServiceApps] Error:", errorMsg);
    return { results: [], error: errorMsg };
  }
}

/**
 * List Container Apps in the specified resource group
 */
async function listContainerApps(
  credential: any,
  subscription: string,
  resourceGroup: string
): Promise<ContainerInfo[]> {
  const results: ContainerInfo[] = [];
  try {
    const { ContainerAppsAPIClient } = await import("@azure/arm-appcontainers");
    const client = new ContainerAppsAPIClient(credential, subscription);
    
    for await (const app of client.containerApps.listByResourceGroup(resourceGroup)) {
      // Extract brand key from env vars or name
      let brandKey = "";
      const containers = app.template?.containers || [];
      for (const c of containers) {
        const envVars = c.env || [];
        const bk = envVars.find((e: any) => e.name === "BRAND_KEY");
        if (bk?.value) {
          brandKey = String(bk.value).toLowerCase();
          break;
        }
      }
      
      if (!brandKey) {
        const match = app.name?.match(/^pp-(.+)$/i);
        brandKey = match?.[1]?.toLowerCase() || app.name?.toLowerCase() || "";
      }
      
      const image = containers[0]?.image || "";
      const tag = image.split(":")[1] || "latest";
      
      results.push({
        id: app.id || app.name || "",
        name: app.name || "",
        brandKey,
        type: "containerapps",
        image,
        tag,
        status: app.provisioningState || "unknown",
        createdAt: (app as any).systemData?.createdAt,
        updatedAt: (app as any).systemData?.lastModifiedAt,
        url: app.configuration?.ingress?.fqdn ? `https://${app.configuration.ingress.fqdn}` : undefined,
      });
    }
  } catch (e: any) {
    console.error("[listContainerApps] Error:", e?.message || e);
  }
  return results;
}

/**
 * List images and tags from Azure Container Registry
 */
async function listRegistryImages(
  credential: any,
  registryName: string
): Promise<Array<{ repository: string; tags: string[]; latestTag?: string; latestDigest?: string; updatedAt?: string }>> {
  const results: Array<{ repository: string; tags: string[]; latestTag?: string; latestDigest?: string; updatedAt?: string }> = [];
  
  try {
    const { ContainerRegistryClient } = await import("@azure/container-registry");
    const endpoint = `https://${registryName}`;
    const client = new ContainerRegistryClient(endpoint, credential);
    
    // List repositories
    for await (const repoName of client.listRepositoryNames()) {
      const repo = client.getRepository(repoName);
      const props = await repo.getProperties();
      
      // List tags for this repository
      const tags: string[] = [];
      let latestTag: string | undefined;
      let latestDigest: string | undefined;
      let latestDate: Date | undefined;
      
      // Note: getArtifact is used differently in newer SDK versions
      // We'll skip the artifact lookup and just use manifest properties
      
      for await (const manifest of repo.listManifestProperties()) {
        if (manifest.tags) {
          tags.push(...manifest.tags);
        }
        // Track the most recent manifest
        const manifestDate = manifest.lastUpdatedOn;
        if (!latestDate || (manifestDate && manifestDate > latestDate)) {
          latestDate = manifestDate;
          latestDigest = manifest.digest;
          latestTag = manifest.tags?.[0];
        }
      }
      
      results.push({
        repository: repoName,
        tags,
        latestTag,
        latestDigest,
        updatedAt: latestDate?.toISOString() || props.lastUpdatedOn?.toISOString(),
      });
    }
  } catch (e: any) {
    console.error("[listRegistryImages] Error:", e?.message || e);
  }
  
  return results;
}

/**
 * Check if a signed APK exists in blob storage for a given brand
 */
async function checkApkExists(brandKey: string): Promise<boolean> {
  try {
    const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "").trim();
    const container = String(process.env.PP_APK_CONTAINER || "portalpay").trim();
    const prefix = String(process.env.PP_APK_BLOB_PREFIX || "brands").trim().replace(/^\/+|\/+$/g, "");
    
    if (!conn) return false;
    
    const { BlobServiceClient } = await import("@azure/storage-blob");
    const bsc = BlobServiceClient.fromConnectionString(conn);
    const cont = bsc.getContainerClient(container);
    const blobName = prefix ? `${prefix}/${brandKey}-signed.apk` : `${brandKey}-signed.apk`;
    const blob = cont.getBlockBlobClient(blobName);
    
    return await blob.exists();
  } catch {
    return false;
  }
}

/**
 * Check if a package ZIP exists in blob storage for a given brand
 */
async function checkPackageExists(brandKey: string): Promise<{ exists: boolean; url?: string }> {
  try {
    const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_BLOB_CONNECTION_STRING || "").trim();
    const container = String(process.env.PP_PACKAGES_CONTAINER || "device-packages").trim();
    
    if (!conn) return { exists: false };
    
    const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = await import("@azure/storage-blob");
    const bsc = BlobServiceClient.fromConnectionString(conn);
    const cont = bsc.getContainerClient(container);
    const blobName = `${brandKey}/${brandKey}-installer.zip`;
    const blob = cont.getBlockBlobClient(blobName);
    
    const exists = await blob.exists();
    if (!exists) return { exists: false };
    
    // Generate SAS URL for download (valid for 1 hour)
    try {
      // Extract account name and key from connection string for SAS generation
      const accountMatch = conn.match(/AccountName=([^;]+)/i);
      const keyMatch = conn.match(/AccountKey=([^;]+)/i);
      if (accountMatch && keyMatch) {
        const sharedKeyCredential = new StorageSharedKeyCredential(accountMatch[1], keyMatch[1]);
        const sasToken = generateBlobSASQueryParameters({
          containerName: container,
          blobName,
          permissions: BlobSASPermissions.parse("r"),
          startsOn: new Date(),
          expiresOn: new Date(Date.now() + 3600 * 1000),
        }, sharedKeyCredential).toString();
        
        return { exists: true, url: `${blob.url}?${sasToken}` };
      }
    } catch {}
    
    return { exists: true };
  } catch {
    return { exists: false };
  }
}

/**
 * GET /api/admin/devices/containers
 * 
 * Lists deployed containers from:
 * - Azure App Service (Web Apps for Containers) in PortalPay resource group
 * - Azure Container Apps in PortalPay resource group  
 * - Azure Container Registry (thutilityco.azurecr.io) images/tags
 * 
 * Also checks for existing APKs and packages in blob storage.
 * 
 * Query params:
 * - resourceGroup: Override resource group (default: AZURE_RESOURCE_GROUP or "PortalPay")
 * - registry: Override registry (default: AZURE_CONTAINER_REGISTRY or "thutilityco.azurecr.io")
 */
export async function GET(req: NextRequest) {
  // Auth: Admin or Superadmin only
  try {
    const caller = await requireThirdwebAuth(req);
    const roles = Array.isArray(caller?.roles) ? caller.roles : [];
    if (!roles.includes("admin") && !roles.includes("superadmin")) {
      return json({ error: "forbidden" }, { status: 403 });
    }
  } catch {
    return json({ error: "unauthorized" }, { status: 401 });
  }
  
  const url = new URL(req.url);
  // Use AZURE_APP_SERVICE_RESOURCE_GROUP first (where webapps are deployed),
  // then fall back to AZURE_RESOURCE_GROUP, then default to "PortalPay"
  const resourceGroup = url.searchParams.get("resourceGroup") || 
                        process.env.AZURE_APP_SERVICE_RESOURCE_GROUP ||
                        process.env.AZURE_RESOURCE_GROUP || 
                        "PortalPay";
  const registryName = url.searchParams.get("registry") || 
                       process.env.AZURE_CONTAINER_REGISTRY || 
                       "thutilityco.azurecr.io";
  const subscription = process.env.AZURE_SUBSCRIPTION_ID || "";
  
  if (!subscription) {
    return json({ 
      error: "missing_config", 
      message: "AZURE_SUBSCRIPTION_ID is required",
      containers: [],
      registryImages: []
    }, { status: 400 });
  }
  
  try {
    const { DefaultAzureCredential } = await import("@azure/identity");
    const credential = new DefaultAzureCredential();
    
    // Fetch from all sources in parallel
    const [appServiceResult, containerApps, registryImages, partnerBrands] = await Promise.all([
      listAppServiceApps(credential, subscription, resourceGroup),
      listContainerApps(credential, subscription, resourceGroup),
      listRegistryImages(credential, registryName.replace(/\.azurecr\.io$/, "")),
      listPartnerBrands(),
    ]);
    
    // Log if there was an error fetching app service apps
    if (appServiceResult.error) {
      console.warn(`[GET /api/admin/devices/containers] App Service error: ${appServiceResult.error}`);
    }
    
    // Combine and dedupe containers
    const allContainers = [...appServiceResult.results, ...containerApps];
    
    // Create a map of partner brands by brandKey for quick lookup
    const partnerMap = new Map<string, PartnerBrand>();
    for (const p of partnerBrands) {
      partnerMap.set(p.brandKey.toLowerCase(), p);
    }
    
    // Track which webapps exist (by brandKey)
    const webappBrandKeys = new Set<string>();
    for (const c of allContainers) {
      if (c.brandKey) {
        webappBrandKeys.add(c.brandKey.toLowerCase());
      }
    }
    
    // Enrich with APK, package status, and partner matching
    const enrichedContainers = await Promise.all(
      allContainers.map(async (c) => {
        const [hasSignedApk, packageInfo] = await Promise.all([
          checkApkExists(c.brandKey),
          checkPackageExists(c.brandKey),
        ]);
        
        // Check if this webapp has a matching partner in CosmosDB
        const partner = partnerMap.get(c.brandKey.toLowerCase());
        
        return {
          ...c,
          hasSignedApk,
          hasPackage: packageInfo.exists,
          packageUrl: packageInfo.url,
          hasPartner: !!partner,
          partnerInfo: partner ? {
            brandKey: partner.brandKey,
            name: partner.name,
            appUrl: partner.appUrl,
          } : undefined,
        };
      })
    );
    
    // Sort by updatedAt descending (most recent first)
    enrichedContainers.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Enrich partners with hasWebapp flag
    const enrichedPartners: PartnerBrand[] = partnerBrands.map(p => ({
      ...p,
      hasWebapp: webappBrandKeys.has(p.brandKey.toLowerCase()),
    }));
    
    // Find partners without matching webapps
    const unmatchedPartners = enrichedPartners.filter(p => !p.hasWebapp);
    
    const response: ListContainersResponse & { _debug?: any } = {
      containers: enrichedContainers,
      registryImages,
      partners: enrichedPartners,
      unmatchedPartners,
      // Include debug info when containers are empty
      _debug: enrichedContainers.length === 0 ? {
        subscription: subscription ? `${subscription.slice(0, 8)}...` : "(missing)",
        resourceGroup,
        appServiceError: appServiceResult.error || null,
        appServiceCount: appServiceResult.results.length,
        containerAppsCount: containerApps.length,
      } : undefined,
    };
    
    return json(response);
  } catch (e: any) {
    console.error("[GET /api/admin/devices/containers] Error:", e?.message || e);
    return json({ 
      error: "fetch_failed", 
      message: e?.message || "Failed to fetch containers",
      containers: [],
      registryImages: []
    }, { status: 500 });
  }
}
