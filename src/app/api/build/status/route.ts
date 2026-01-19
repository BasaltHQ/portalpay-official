import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/build/status?runId=12345
 * 
 * Check the status of a GitHub Actions workflow run.
 * 
 * Returns:
 * {
 *   "status": "queued" | "in_progress" | "completed",
 *   "conclusion": "success" | "failure" | "cancelled" | null,
 *   "message": "Human readable status message"
 * }
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Validate admin auth
        const caller = await requireThirdwebAuth(req).catch(() => null as any);
        const roles = Array.isArray(caller?.roles) ? caller.roles : [];
        if (!roles.includes("admin") && !roles.includes("superadmin")) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // 2. Get run ID from query params
        const { searchParams } = new URL(req.url);
        const runId = searchParams.get("runId");

        if (!runId) {
            return NextResponse.json({ error: "runId is required" }, { status: 400 });
        }

        // 3. Check for required environment variables
        const githubPat = process.env.GITHUB_PAT;
        if (!githubPat) {
            return NextResponse.json({ error: "Server configuration error: GitHub PAT not configured" }, { status: 500 });
        }

        // 4. Fetch workflow run status from GitHub
        const repoOwner = "Ledger1-ai";
        const repoName = "portalpay-official";
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs/${runId}`;

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${githubPat}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            // Don't cache this request
            cache: "no-store",
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({
                    error: "Workflow run not found",
                    status: "unknown",
                    conclusion: null,
                    message: "Could not find the build. It may still be starting up."
                }, { status: 404 });
            }
            return NextResponse.json({ error: `GitHub API error: ${response.status}` }, { status: 500 });
        }

        const run = await response.json();

        // 5. Map GitHub status to user-friendly message
        let message: string;
        let progress: number;

        switch (run.status) {
            case "queued":
                message = "Build queued, waiting for runner...";
                progress = 10;
                break;
            case "in_progress":
                message = "Building APK...";
                progress = 50;
                break;
            case "completed":
                if (run.conclusion === "success") {
                    message = "Build completed successfully! APK is ready for download.";
                    progress = 100;
                } else if (run.conclusion === "failure") {
                    message = "Build failed. Check GitHub Actions for details.";
                    progress = 100;
                } else if (run.conclusion === "cancelled") {
                    message = "Build was cancelled.";
                    progress = 100;
                } else {
                    message = `Build completed with status: ${run.conclusion}`;
                    progress = 100;
                }
                break;
            default:
                message = `Build status: ${run.status}`;
                progress = 25;
        }

        return NextResponse.json({
            ok: true,
            runId: run.id,
            status: run.status,
            conclusion: run.conclusion,
            message,
            progress,
            htmlUrl: run.html_url, // Link to GitHub Actions page
            createdAt: run.created_at,
            updatedAt: run.updated_at,
        });

    } catch (e: any) {
        console.error("[/api/build/status] Error:", e);
        return NextResponse.json({ error: "Status check failed", message: e?.message || String(e) }, { status: 500 });
    }
}
