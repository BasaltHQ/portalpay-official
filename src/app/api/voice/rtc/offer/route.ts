import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const sdp = String(body?.sdp || "");
    const voice = String(body?.voice || "marin");
    if (!sdp) {
      return NextResponse.json({ error: "missing_sdp" }, { status: 400 });
    }

    const {
      AZURE_OPENAI_ENDPOINT,
      AZURE_OPENAI_API_KEY,
      AZURE_OPENAI_REALTIME_DEPLOYMENT,
      AZURE_OPENAI_REALTIME_API_VERSION,
      AZURE_OPENAI_REALTIME_SESSIONS_URL,
      AZURE_OPENAI_REALTIME_WEBRTC_URL,
      AZURE_OPENAI_REALTIME_REGION,
    } = process.env as Record<string, string | undefined>;

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_REALTIME_DEPLOYMENT || !AZURE_OPENAI_REALTIME_API_VERSION) {
      return NextResponse.json({ error: "Azure OpenAI environment variables are not set." }, { status: 500 });
    }

    // Accept optional client-provided ephemeral session token to avoid creating a second session
    let token = String((body as any)?.token || "").trim();

    // 1) Create ephemeral session token
    const baseEndpoint = AZURE_OPENAI_ENDPOINT.endsWith("/") ? AZURE_OPENAI_ENDPOINT : AZURE_OPENAI_ENDPOINT + "/";
    // Derive OpenAI resource host if a Cognitive Services endpoint was provided
    let openaiBaseEndpoint = baseEndpoint;
    try {
      const u = new URL(baseEndpoint);
      if (u.host.endsWith(".cognitiveservices.azure.com")) {
        const resource = u.host.split(".")[0];
        openaiBaseEndpoint = `https://${resource}.openai.azure.com/`;
      }
    } catch {}

    // Try multiple api-version and endpoint shapes to avoid 404
    const apiVersions = [
      String(AZURE_OPENAI_REALTIME_API_VERSION || "").trim(),
      "2025-04-01-preview",
      "2024-10-01-preview",
      "2024-08-01-preview",
      "2024-06-01-preview",
    ].filter(Boolean);

    let usedSessionsUrl: string | null = null;

    if (!token) {
      const candidateSessions: string[] = [];
    if (AZURE_OPENAI_REALTIME_SESSIONS_URL && AZURE_OPENAI_REALTIME_SESSIONS_URL.length > 0) {
      candidateSessions.push(AZURE_OPENAI_REALTIME_SESSIONS_URL);
    }
    for (const v of apiVersions) {
      // Prefer OpenAI resource host first
      candidateSessions.push(`${openaiBaseEndpoint}openai/realtimeapi/sessions?api-version=${v}`);
      candidateSessions.push(`${openaiBaseEndpoint}openai/v1/realtime/sessions?api-version=${v}`);
      candidateSessions.push(`${openaiBaseEndpoint}openai/realtime/sessions?api-version=${v}`);
      candidateSessions.push(`${openaiBaseEndpoint}openai/deployments/${AZURE_OPENAI_REALTIME_DEPLOYMENT}/sessions?api-version=${v}`);
      // Then provided endpoint host
      candidateSessions.push(`${baseEndpoint}openai/realtimeapi/sessions?api-version=${v}`);
      candidateSessions.push(`${baseEndpoint}openai/v1/realtime/sessions?api-version=${v}`);
      candidateSessions.push(`${baseEndpoint}openai/realtime/sessions?api-version=${v}`);
      candidateSessions.push(`${baseEndpoint}openai/deployments/${AZURE_OPENAI_REALTIME_DEPLOYMENT}/sessions?api-version=${v}`);
    }

    let sessionRes: Response | null = null;
    let lastSessionError: string | null = null;
    for (const url of candidateSessions) {
      sessionRes = await fetch(url, {
        method: "POST",
        headers: {
          "api-key": AZURE_OPENAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AZURE_OPENAI_REALTIME_DEPLOYMENT,
          voice: voice || "marin",
          modalities: ["text", "audio"],
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
      if (sessionRes.ok) { usedSessionsUrl = url; break; }
      try { lastSessionError = await sessionRes.text(); } catch { lastSessionError = null; }
    }

    if (!sessionRes || !sessionRes.ok) {
      return NextResponse.json({ error: `session_failed`, reason: lastSessionError || "unknown", attemptedUrls: candidateSessions }, { status: (sessionRes && sessionRes.status) || 502 });
    }

    const sessionData = await sessionRes.json().catch(() => ({} as any));
    token = String(
      sessionData?.client_secret?.value ||
      sessionData?.client_secret ||
      sessionData?.secret ||
      sessionData?.token ||
      ""
    ).trim();

    if (!token) {
      return NextResponse.json({ error: "missing_ephemeral_token" }, { status: 500 });
    }
  } // end if (!token)

    // 2) Forward WebRTC offer to Azure and return the answer
    // Try multiple endpoint shapes to avoid 404 across Azure variants
    const candidateRealtime: string[] = [];
    const addModelParam = (url: string): string =>
      url + (url.includes("?") ? `&model=${AZURE_OPENAI_REALTIME_DEPLOYMENT}` : `?model=${AZURE_OPENAI_REALTIME_DEPLOYMENT}`);

    if (AZURE_OPENAI_REALTIME_WEBRTC_URL && AZURE_OPENAI_REALTIME_WEBRTC_URL.length > 0) {
      candidateRealtime.push(addModelParam(AZURE_OPENAI_REALTIME_WEBRTC_URL));
    }

    // Region-based preview endpoint (if provided): https://{region}.realtimeapi-preview.ai.azure.com/v1/realtimertc
    if (AZURE_OPENAI_REALTIME_REGION && AZURE_OPENAI_REALTIME_REGION.length > 0) {
      candidateRealtime.push(addModelParam(`https://${AZURE_OPENAI_REALTIME_REGION}.realtimeapi-preview.ai.azure.com/v1/realtimertc`));
    }

    // Fallbacks against resource endpoint
    candidateRealtime.push(addModelParam(`${baseEndpoint}openai/v1/realtime?api-version=${AZURE_OPENAI_REALTIME_API_VERSION}`));
    candidateRealtime.push(addModelParam(`${baseEndpoint}openai/realtime?api-version=${AZURE_OPENAI_REALTIME_API_VERSION}`));
    candidateRealtime.push(addModelParam(`${baseEndpoint}openai/deployments/${AZURE_OPENAI_REALTIME_DEPLOYMENT}/realtime?api-version=${AZURE_OPENAI_REALTIME_API_VERSION}`));

    let offerRes: Response | null = null;
    let lastOfferError: string | null = null;
    let usedRealtimeUrl: string | null = null;
    for (const url of candidateRealtime) {
      offerRes = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/sdp",
        },
        body: sdp,
      });
      if (offerRes.ok) { usedRealtimeUrl = url; break; }
      try { lastOfferError = await offerRes.text(); } catch { lastOfferError = null; }
    }

    if (!offerRes || !offerRes.ok) {
      return NextResponse.json({ error: "offer_failed", reason: lastOfferError || "unknown" }, { status: (offerRes && offerRes.status) || 502 });
    }

    const answerSdp = await offerRes.text();
    // Return SDP answer compatible with WebRTC setRemoteDescription
    return NextResponse.json({
      ok: true,
      answer: { type: "answer", sdp: answerSdp },
      realtimeEndpointUsed: usedRealtimeUrl || undefined,
      sessionsEndpointUsed: usedSessionsUrl || undefined
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
