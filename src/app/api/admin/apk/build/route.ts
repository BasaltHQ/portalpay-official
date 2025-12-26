import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
 * Check if a signed APK exists in blob storage for a given brand
 */
async function checkApkExists(brandKey: string): Promise<boolean> {
  try {
    const conn = String(process.env.AZURE_STORAGE_CONNECTION_STRING || "").trim();
    const container = String(process.env.PP_APK_CONTAINER || "apks").trim();
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
 * Check if brand source exists in the repository
 */
async function checkBrandSourceExists(brandKey: string): Promise<boolean> {
  // Check if there's a source directory for this brand
  // This would typically be in android/launcher/recovered/src-{brandKey}/
  // For now, we check known brands
  const knownBrands = ["portalpay", "basaltsurge", "paynex"];
  return knownBrands.includes(brandKey.toLowerCase());
}

/**
 * Trigger GitHub Actions workflow to build APK
 */
async function triggerGitHubWorkflow(brandKey: string): Promise<{
  success: boolean;
  runUrl?: string;
  error?: string;
}> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || "GenRevo89/portalpay";
  const workflowFile = process.env.APK_BUILD_WORKFLOW || "apk.yml";
  const ref = process.env.GITHUB_REF || "main";

  if (!token) {
    return { success: false, error: "GITHUB_TOKEN not configured" };
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return { success: false, error: "Invalid GITHUB_REPOSITORY format" };
  }

  try {
    // Trigger workflow dispatch
    const url = `https://api.github.com/repos/${owner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref,
        inputs: {
          brand_key: brandKey,
        },
      }),
    });

    if (response.status === 204) {
      // Successfully triggered - workflow runs are created asynchronously
      const runsUrl = `https://github.com/${owner}/${repoName}/actions/workflows/${workflowFile}`;
      return { success: true, runUrl: runsUrl };
    }

    // Try to get error details
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData?.message || `GitHub API returned ${response.status}`
    };
  } catch (e: any) {
    return { success: false, error: e?.message || "Failed to trigger workflow" };
  }
}

/**
 * Trigger Azure DevOps pipeline to build APK
 */
async function triggerAzurePipeline(brandKey: string): Promise<{
  success: boolean;
  runUrl?: string;
  error?: string;
}> {
  const pat = process.env.AZURE_DEVOPS_PAT;
  const org = process.env.AZURE_DEVOPS_ORG;
  const project = process.env.AZURE_DEVOPS_PROJECT;
  const pipelineId = process.env.APK_BUILD_PIPELINE_ID;

  if (!pat || !org || !project || !pipelineId) {
    return { success: false, error: "Azure DevOps not configured" };
  }

  try {
    const url = `https://dev.azure.com/${org}/${project}/_apis/pipelines/${pipelineId}/runs?api-version=7.1`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`:${pat}`).toString("base64")}`,
      },
      body: JSON.stringify({
        templateParameters: {
          brandKey,
        },
        variables: {
          BRAND_KEY: { value: brandKey },
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        runUrl: data?._links?.web?.href || `https://dev.azure.com/${org}/${project}/_build?definitionId=${pipelineId}`
      };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData?.message || `Azure DevOps API returned ${response.status}`
    };
  } catch (e: any) {
    return { success: false, error: e?.message || "Failed to trigger pipeline" };
  }
}

/**
 * POST /api/admin/apk/build
 * 
 * Trigger an APK build workflow for a brand.
 * 
 * Body:
 * {
 *   "brandKey": "xoinpay",
 *   "force": false  // optional: force rebuild even if APK exists
 * }
 * 
 * Response:
 * {
 *   "ok": true,
 *   "brandKey": "xoinpay",
 *   "triggered": "github" | "azure",
 *   "runUrl": "https://github.com/.../actions/...",
 *   "message": "Build triggered successfully"
 * }
 */
export async function POST(req: NextRequest) {
  // Auth: Admin or Superadmin only
  let caller: { wallet: string; roles: string[] };
  try {
    const c = await requireThirdwebAuth(req);
    const roles = Array.isArray(c?.roles) ? c.roles : [];
    if (!roles.includes("admin") && !roles.includes("superadmin")) {
      return json({ error: "forbidden" }, { status: 403 });
    }
    caller = { wallet: c.wallet, roles };
  } catch {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: { brandKey?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, { status: 400 });
  }

  const brandKey = String(body?.brandKey || "").toLowerCase().trim();
  const force = Boolean(body?.force);

  if (!brandKey) {
    return json({ error: "brandKey_required" }, { status: 400 });
  }

  // Check if APK already exists (unless force rebuild)
  if (!force) {
    const exists = await checkApkExists(brandKey);
    if (exists) {
      return json({
        ok: false,
        error: "apk_exists",
        message: `Signed APK already exists for brand '${brandKey}'. Use force=true to rebuild.`,
        brandKey,
      }, { status: 409 });
    }
  }

  // Check if we have source for this brand
  const hasSource = await checkBrandSourceExists(brandKey);
  if (!hasSource && !force) {
    return json({
      ok: false,
      error: "no_source",
      message: `No APK source found for brand '${brandKey}'. Only portalpay and paynex have pre-configured sources. For new brands, the base PortalPay APK should be used.`,
      brandKey,
      hint: "New brand APKs use the same PortalPay base APK. The brand is determined at runtime via the web app, not the APK itself.",
    });
  }

  // Try to trigger build via GitHub Actions first, then Azure DevOps
  const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const azureDevOpsPat = process.env.AZURE_DEVOPS_PAT;

  if (githubToken) {
    const result = await triggerGitHubWorkflow(brandKey);
    if (result.success) {
      return json({
        ok: true,
        brandKey,
        triggered: "github",
        runUrl: result.runUrl,
        message: `APK build workflow triggered for '${brandKey}'. The signed APK will be uploaded to blob storage when complete.`,
      });
    }
    // If GitHub fails and Azure is configured, try Azure
    if (!azureDevOpsPat) {
      return json({
        ok: false,
        error: "build_trigger_failed",
        message: result.error,
        brandKey,
      }, { status: 500 });
    }
  }

  if (azureDevOpsPat) {
    const result = await triggerAzurePipeline(brandKey);
    if (result.success) {
      return json({
        ok: true,
        brandKey,
        triggered: "azure",
        runUrl: result.runUrl,
        message: `APK build pipeline triggered for '${brandKey}'. The signed APK will be uploaded to blob storage when complete.`,
      });
    }
    return json({
      ok: false,
      error: "build_trigger_failed",
      message: result.error,
      brandKey,
    }, { status: 500 });
  }

  // No CI/CD configured
  return json({
    ok: false,
    error: "no_ci_configured",
    message: "No CI/CD system configured for APK builds. Set GITHUB_TOKEN or AZURE_DEVOPS_PAT environment variables.",
    brandKey,
    hint: "APK builds require CI/CD infrastructure with Java, Android SDK, and signing credentials. See docs/building-apk.md for setup instructions.",
  }, { status: 501 });
}

/**
 * GET /api/admin/apk/build?brandKey=xoinpay
 * 
 * Check build status and capabilities for a brand.
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
  const brandKey = url.searchParams.get("brandKey")?.toLowerCase().trim();

  // Check CI/CD capabilities
  const hasGitHub = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  const hasAzureDevOps = Boolean(process.env.AZURE_DEVOPS_PAT && process.env.AZURE_DEVOPS_ORG);
  const canBuild = hasGitHub || hasAzureDevOps;

  const response: any = {
    canBuild,
    ciSystems: {
      github: hasGitHub,
      azureDevOps: hasAzureDevOps,
    },
  };

  if (brandKey) {
    const [apkExists, hasSource] = await Promise.all([
      checkApkExists(brandKey),
      checkBrandSourceExists(brandKey),
    ]);

    response.brandKey = brandKey;
    response.apkExists = apkExists;
    response.hasSource = hasSource;
    response.canBuildBrand = canBuild && (hasSource || brandKey === "portalpay" || brandKey === "basaltsurge" || brandKey === "paynex");
  }

  return json(response);
}
