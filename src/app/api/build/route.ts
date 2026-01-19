import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Capitalize the first letter of a string (for App Name)
 */
function capitalizeFirst(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * POST /api/build
 * 
 * Triggers GitHub Actions workflow to build a branded APK.
 * The workflow compiles the APK with the brand's icon and endpoint,
 * then uploads it to Azure Blob Storage.
 * 
 * Body:
 * {
 *   "brandKey": "xoinpay",      // Required: Brand folder name
 *   "endpoint": "https://..."   // Optional: Base domain for the APK
 * }
 * 
 * Returns:
 * {
 *   "message": "Build started...",
 *   "downloadUrl": "https://..."  // Expected APK location after build completes
 * }
 */
export async function POST(req: NextRequest) {
    try {
        // 1. Validate admin auth
        const caller = await requireThirdwebAuth(req).catch(() => null as any);
        const roles = Array.isArray(caller?.roles) ? caller.roles : [];
        if (!roles.includes("admin") && !roles.includes("superadmin")) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // 2. Parse request body
        const body = await req.json().catch(() => ({} as any));

        const brandKey = String(body?.brandKey || "").toLowerCase().trim();
        if (!brandKey) {
            return NextResponse.json({ error: "brandKey is required" }, { status: 400 });
        }

        // 3. Generate appName from brandKey (capitalize first letter)
        const appName = capitalizeFirst(brandKey);

        // 4. Generate baseDomain from endpoint or default
        let baseDomain = String(body?.endpoint || "").trim();
        if (!baseDomain) {
            // Default domain pattern
            baseDomain = brandKey === "surge" || brandKey === "basaltsurge"
                ? "https://surge.basaltsurge.com"
                : `https://${brandKey}.azurewebsites.net`;
        } else if (!baseDomain.startsWith("http://") && !baseDomain.startsWith("https://")) {
            baseDomain = `https://${baseDomain}`;
        }

        // Validate URL
        try {
            new URL(baseDomain);
        } catch {
            return NextResponse.json({ error: "Invalid endpoint URL" }, { status: 400 });
        }

        // 5. Check for required environment variables
        const githubPat = process.env.GITHUB_PAT;
        if (!githubPat) {
            console.error("[/api/build] GITHUB_PAT environment variable is not set");
            return NextResponse.json({ error: "Server configuration error: GitHub PAT not configured" }, { status: 500 });
        }

        // 6. Trigger GitHub Actions workflow
        const repoOwner = "Ledger1-ai";
        const repoName = "portalpay-official";
        const workflowFile = "build-client-apk.yml";
        const ref = "main"; // Branch to run the workflow on

        const githubApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowFile}/dispatches`;

        console.log(`[/api/build] Triggering workflow for brand: ${brandKey}, appName: ${appName}, baseDomain: ${baseDomain}`);

        const response = await fetch(githubApiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${githubPat}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ref,
                inputs: {
                    brandKey,
                    appName,
                    baseDomain,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[/api/build] GitHub API error: ${response.status} - ${errorText}`);

            if (response.status === 401) {
                return NextResponse.json({ error: "GitHub authentication failed. Check GITHUB_PAT." }, { status: 500 });
            }
            if (response.status === 404) {
                return NextResponse.json({ error: "Workflow not found. Ensure build-client-apk.yml exists." }, { status: 500 });
            }

            return NextResponse.json({ error: `Failed to trigger build: ${response.status}` }, { status: 500 });
        }

        // 7. Build expected download URL
        // The workflow uploads to: portalpay container with brands/ prefix
        // Path: brands/{brandKey}-touchpoint-signed.apk
        const storageAccount = process.env.AZURE_BLOB_ACCOUNT_NAME || "engram1";
        const container = process.env.PP_APK_CONTAINER || "portalpay";
        const prefix = process.env.PP_APK_BLOB_PREFIX || "brands";
        const blobName = `${prefix}/${brandKey}-touchpoint-signed.apk`;

        // Use CDN URL if available, otherwise direct blob URL
        const publicBaseUrl = process.env.AZURE_BLOB_PUBLIC_BASE_URL;
        const downloadUrl = publicBaseUrl
            ? `${publicBaseUrl}/${container}/${blobName}`
            : `https://${storageAccount}.blob.core.windows.net/${container}/${blobName}`;

        console.log(`[/api/build] Workflow triggered successfully. Expected APK at: ${downloadUrl}`);

        return NextResponse.json({
            ok: true,
            message: `Build started for ${appName}! Your APK will be ready in approximately 2 minutes.`,
            brandKey,
            appName,
            baseDomain,
            downloadUrl,
            estimatedTime: "~2 minutes",
        });

    } catch (e: any) {
        console.error("[/api/build] Error:", e);
        return NextResponse.json({ error: "Build trigger failed", message: e?.message || String(e) }, { status: 500 });
    }
}