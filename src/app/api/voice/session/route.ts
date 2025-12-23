import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWallet } from "@/lib/auth";
import { getContainer } from "@/lib/cosmos";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({} as any));
        const authed = await getAuthenticatedWallet(req);
        const headerWallet = String(req.headers.get('x-wallet') || '').toLowerCase();
        const bodyWallet = String(body.wallet || '').toLowerCase();
        const wallet = String(authed || headerWallet || bodyWallet || '').toLowerCase();
        const {
            AZURE_OPENAI_ENDPOINT,
            AZURE_OPENAI_API_KEY,
            AZURE_OPENAI_REALTIME_DEPLOYMENT,
            AZURE_OPENAI_REALTIME_API_VERSION,
            AZURE_OPENAI_REALTIME_SESSIONS_URL,
            AZURE_OPENAI_REALTIME_WEBRTC_URL,
            AZURE_OPENAI_RESOURCE_ENDPOINT,
        } = process.env as Record<string, string | undefined>;

        if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_REALTIME_DEPLOYMENT || !AZURE_OPENAI_REALTIME_API_VERSION) {
            return NextResponse.json({ error: "Azure OpenAI environment variables are not set." }, { status: 500 });
        }

        const voice = String(body?.voice || "marin");

		// Apply usage limits (configurable via env). Supports disabling gating for development.
		try {
			const gatingDisabled = String(process.env.VOICE_GATING_DISABLED || "").trim() === "1";
			if (gatingDisabled) {
				// If gating disabled, allow long sessions (default 8 hours) without creating a usage doc.
				(req as any).__voiceBudgetSec = Number(process.env.VOICE_MAX_SESSION_SEC?.trim() || "") || 8 * 60 * 60;
			} else {
			const isAuthenticated = !!authed && typeof authed === "string" && authed.length > 0;
			const ip = ((req as any).ip || req.headers.get("x-forwarded-for") || "").toString().split(",")[0].trim();
			const ua = String(req.headers.get("user-agent") || "");
			const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 32);
			const walletKey = isAuthenticated ? String(authed).toLowerCase() : `anon:${hash(`${ip}|${ua}`)}`;
			const now = Date.now();
			const day = new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD UTC
			const container = await getContainer();

			// Caps configurable via env; relaxed defaults for development
			const DAILY_CAP_AUTH = Number(process.env.VOICE_DAILY_CAP_AUTH?.trim() || "") || 8 * 60 * 60; // 8 hours daily cap for authenticated (override via VOICE_DAILY_CAP_AUTH)
			const PER_SESSION_CAP_AUTH = Number(process.env.VOICE_PER_SESSION_CAP_AUTH?.trim() || "") || 4 * 60 * 60; // 4 hours per session reservation (override via VOICE_PER_SESSION_CAP_AUTH)
			const PER_SESSION_CAP_ANON = Number(process.env.VOICE_PER_SESSION_CAP_ANON?.trim() || "") || 2 * 60 * 60; // 2 hours per session for anonymous (override via VOICE_PER_SESSION_CAP_ANON)

			let budgetSec = PER_SESSION_CAP_ANON;
			if (isAuthenticated) {
				const query = {
					query: "SELECT c.seconds, c.kind FROM c WHERE c.wallet = @w AND c.type = @t AND c.day = @d AND c.finalized = true",
					parameters: [
						{ name: "@w", value: walletKey },
						{ name: "@t", value: "usage" },
						{ name: "@d", value: day },
					],
				} as { query: string; parameters: { name: string; value: string }[] };
				const { resources } = await container.items.query(query).fetchAll();
				let usedToday = 0;
				for (const r of resources as any[]) {
					const sec = Math.max(0, Number(r?.seconds || 0));
					const kind = String(r?.kind || "");
					const cap = kind === "auth" ? PER_SESSION_CAP_AUTH : PER_SESSION_CAP_ANON;
					// Clamp any prior session reservations to their per-session cap to avoid accidental exhaustion
					usedToday += Math.min(sec, cap);
				}
				const remaining = Math.max(0, DAILY_CAP_AUTH - usedToday);
				if (remaining <= 0) {
					return NextResponse.json({ error: "limit_reached", kind: "authenticated_daily", used: usedToday, limit: DAILY_CAP_AUTH, day }, { status: 429 });
				}
				// Reserve up to per-session cap, not the entire remaining budget
				budgetSec = Math.min(remaining, PER_SESSION_CAP_AUTH);
			} else {
				// Unauthenticated sessions: fixed 60 seconds
				budgetSec = PER_SESSION_CAP_ANON;
			}

			// Pre-allocate usage reservation for budgeting; mark as not finalized
			const usageDoc = {
				id: `usage:${walletKey}:${now}`,
				wallet: walletKey,
				type: "usage",
				seconds: budgetSec,
				day,
				createdAt: now,
				kind: isAuthenticated ? "auth" : "anon",
				finalized: false,
			};
			try { 
				await container.items.create(usageDoc as any); 
				(req as any).__voiceUsageDocId = usageDoc.id;
			} catch {}
			// Attach budget info for client to enforce max duration
			(req as any).__voiceBudgetSec = budgetSec;
			}
		} catch (e: any) {
			return NextResponse.json({ error: "limit_check_failed", reason: e?.message || "unavailable" }, { status: 503 });
		}
        const baseEndpoint = AZURE_OPENAI_ENDPOINT.endsWith("/") ? AZURE_OPENAI_ENDPOINT : AZURE_OPENAI_ENDPOINT + "/";
        // Determine OpenAI resource endpoint to call for sessions
        // Priority:
        // 1) AZURE_OPENAI_RESOURCE_ENDPOINT (explicit)
        // 2) Derived from Cognitive Services host (resource.openai.azure.com)
        // 3) Fallback to provided AZURE_OPENAI_ENDPOINT
        let openaiBaseEndpoint = (AZURE_OPENAI_RESOURCE_ENDPOINT && AZURE_OPENAI_RESOURCE_ENDPOINT.length > 0)
            ? (AZURE_OPENAI_RESOURCE_ENDPOINT.endsWith("/") ? AZURE_OPENAI_RESOURCE_ENDPOINT : AZURE_OPENAI_RESOURCE_ENDPOINT + "/")
            : baseEndpoint;
        if (!AZURE_OPENAI_RESOURCE_ENDPOINT) {
            try {
                const u = new URL(baseEndpoint);
                if (u.host.endsWith(".cognitiveservices.azure.com")) {
                    const resource = u.host.split(".")[0];
                    openaiBaseEndpoint = `https://${resource}.openai.azure.com/`;
                }
            } catch {}
        }
		// Try multiple api-version values and endpoint shapes to avoid 404 across Azure variants
		const apiVersions = [
			String(AZURE_OPENAI_REALTIME_API_VERSION || "").trim(),
			"2025-04-01-preview",
			"2024-10-01-preview",
			"2024-08-01-preview",
			"2024-06-01-preview",
		].filter(Boolean);
		const candidateSessions: string[] = [];
		if (AZURE_OPENAI_REALTIME_SESSIONS_URL && AZURE_OPENAI_REALTIME_SESSIONS_URL.length > 0) {
			candidateSessions.push(AZURE_OPENAI_REALTIME_SESSIONS_URL);
		}
		for (const v of apiVersions) {
			// Try OpenAI resource host first (preferred when a Cognitive Services endpoint was provided)
			// Azure preview sample favors /openai/realtimeapi/sessions; try it first
			candidateSessions.push(`${openaiBaseEndpoint}openai/realtimeapi/sessions?api-version=${v}`);
			candidateSessions.push(`${openaiBaseEndpoint}openai/v1/realtime/sessions?api-version=${v}`);
			candidateSessions.push(`${openaiBaseEndpoint}openai/realtime/sessions?api-version=${v}`);
			candidateSessions.push(`${openaiBaseEndpoint}openai/deployments/${AZURE_OPENAI_REALTIME_DEPLOYMENT}/sessions?api-version=${v}`);

			// Then try the provided endpoint host
			candidateSessions.push(`${baseEndpoint}openai/realtimeapi/sessions?api-version=${v}`);
			candidateSessions.push(`${baseEndpoint}openai/v1/realtime/sessions?api-version=${v}`);
			candidateSessions.push(`${baseEndpoint}openai/realtime/sessions?api-version=${v}`);
			candidateSessions.push(`${baseEndpoint}openai/deployments/${AZURE_OPENAI_REALTIME_DEPLOYMENT}/sessions?api-version=${v}`);
		}

		let response: Response | null = null;
		let lastErrorText: string | null = null;
		let usedSessionUrl: string | null = null;
		let usedApiVersion: string | null = null;
		for (const url of candidateSessions) {
			// Track which api-version is being used for diagnostics
			const verMatch = url.match(/api-version=([^&]+)/);
			const ver = verMatch ? verMatch[1] : undefined;

			response = await fetch(url, {
				method: "POST",
				headers: {
					"api-key": AZURE_OPENAI_API_KEY,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: AZURE_OPENAI_REALTIME_DEPLOYMENT,
					voice: voice || "marin",
					instructions: (typeof body?.instructions === "string" && body.instructions.trim().length > 0)
						? body.instructions
						: [
							"System Persona: Varuni — a concise, helpful ecommerce voice assistant for this shop.",
							"- Speak clearly and briefly; prioritize actionable responses.",
							"- Use tools to answer shop details, ratings, inventory queries, and manipulate the cart.",
							"- Confirm cart changes explicitly with item name and quantity.",
							"- Only call owner analytics when the user is the merchant owner; otherwise provide high-level guidance without private metrics.",
							"- When unsure, ask a short clarifying question."
						].join(" ")
				}),
			});
			if (response.ok) { usedSessionUrl = url; usedApiVersion = ver || null; break; }
			try { lastErrorText = await response.text(); } catch { lastErrorText = null; }
		}

        if (!response || !response.ok) {
            return NextResponse.json(
                {
                    error: "Azure session failed",
                    reason: lastErrorText || "unknown",
                    attemptedUrls: candidateSessions,
                    baseEndpoint,
                    openaiBaseEndpoint
                },
                { status: (response && response.status) || 502 }
            );
        }

		const data = await response.json();
		const budgetSec = (req as any).__voiceBudgetSec ?? (authed ? 30 * 60 : 5 * 60);
		return NextResponse.json({
			...data,
			maxDurationSec: budgetSec,
			usageDocId: (req as any).__voiceUsageDocId,
			sessionEndpointUsed: usedSessionUrl || undefined,
			sessionApiVersionUsed: usedApiVersion || undefined
		});
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
	}
}
