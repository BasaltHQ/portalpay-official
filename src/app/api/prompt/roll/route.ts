import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";

function fallbackPrompt(): string {
  const personas = [
    "You are Ada Gearheart, a Victorian-era inventor with a knack for whimsical contraptions and practical advice.",
    "You are Dr. Nova Quark, a cosmic cartographer who speaks in vivid stellar metaphors and crisp, actionable steps.",
    "You are Captain Bytebeard, a swashbuckling cyber‑pirate who helps users debug with charming bluntness and brevity.",
    "You are Hypatia of Alexandria (reimagined), a scholar who teaches by clear Socratic questions and structured summaries.",
    "You are Kettle the Kobold Librarian, genial and meticulous, who indexes every idea and cites sources plainly.",
  ];
  const p = personas[Math.floor(Math.random()*personas.length)];
  return [
    `${p}`,
    "Keep responses concise, specific, and helpful.",
    "Prefer numbered steps, short paragraphs, and precise terminology.",
    "Avoid roleplay unless explicitly requested; focus on utility first.",
    "When uncertain, ask one clarifying question before proceeding.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
    const key = process.env.AZURE_OPENAI_API_KEY || "";
    const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT || "";
    const apiVersion = process.env.AZURE_OPENAI_CHAT_API_VERSION || process.env.AZURE_OPENAI_API_VERSION || "2024-04-01-preview";

    if (!endpoint || !key || !deployment) {
      return NextResponse.json({ prompt: fallbackPrompt(), degraded: true });
    }

    // Preferred: Azure OpenAI SDK client (official Azure adapter)
    const client = new AzureOpenAI({
      endpoint: endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint,
      apiKey: key,
      apiVersion,
    } as any);
    const system = [
      "You generate a single, production-ready system prompt for an AI assistant persona.",
      "The persona should be a random figure from history, science, media, mythology, or a quirky original.",
      "OUTPUT RULES:",
      "- Output ONLY the system prompt text (no JSON, no preface).",
      "- 80-150 words; concise and actionable.",
      "- Include persona name, voice/tone, strengths, and 3-5 behavior rules.",
      "- Emphasize clarity, structure, and helpfulness over florid roleplay.",
    ].join("\n");
    const prefs: string[] = [];
    const theme = body.theme ? String(body.theme) : "";
    const archetype = body.archetype && body.archetype !== 'auto' ? `Archetype: ${String(body.archetype)}` : "";
    const tone = body.tone && body.tone !== 'auto' ? `Tone: ${String(body.tone)}` : "";
    const style = body.style && body.style !== 'auto' ? `Style: ${String(body.style)}` : "";
    const domain = body.domain && body.domain !== 'auto' ? `Primary domain: ${String(body.domain)}` : "";
    const quirk = body.quirk ? `Quirkiness: ${String(body.quirk)}` : "";
    const formatting = body.formatting && body.formatting !== 'auto' ? `Formatting preference: ${String(body.formatting)}` : "";
    const length = body.length && body.length !== 'auto' ? `Length: ${String(body.length)}` : "";
    for (const x of [archetype, tone, style, domain, quirk, formatting, length]) if (x) prefs.push(x);
    const user = [
      theme ? `Theme or vibe: ${theme}` : "Make it varied and surprising.",
      prefs.length ? `Preferences: ${prefs.join('; ')}` : "",
    ].filter(Boolean).join("\n");

    // Try Chat Completions via SDK
    let errorChat: any = null;
    try {
      const chat = await client.chat.completions.create({
        model: deployment,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        // temperature: 1.1,
        // max_tokens: 320,
      } as any);
      const prompt = chat?.choices?.[0]?.message?.content || "";
      if (prompt) return NextResponse.json({ prompt, via: "chat" });
    } catch (e: any) {
      errorChat = { status: e?.status, message: e?.message, error: e?.error || undefined };
      try { console.error("/api/prompt/roll chat error", { endpoint, deployment, apiVersion, err: errorChat }); } catch {}
    }
    // Fallback: Responses API via SDK
    let errorResponses: any = null;
    try {
      const resp2 = await client.responses.create({
        model: deployment,
        input: [
          { role: "system", content: [ { type: "text", text: system } ] },
          { role: "user", content: [ { type: "text", text: user } ] },
        ],
        temperature: 1.1,
        max_output_tokens: 320,
      } as any);
      const outText = (resp2 as any)?.output_text || (resp2 as any)?.output?.[0]?.content?.[0]?.text || "";
      const prompt = outText || fallbackPrompt();
      return NextResponse.json({ prompt, via: "responses" });
    } catch (e: any) {
      errorResponses = { status: e?.status, message: e?.message, error: e?.error || undefined };
      try { console.error("/api/prompt/roll responses error", { endpoint, deployment, apiVersion, err: errorResponses }); } catch {}
      // Return fallback with rich debug context
      return NextResponse.json({
        prompt: fallbackPrompt(),
        degraded: true,
        reason: 'sdk_failed',
        debug: {
          endpoint,
          deployment,
          apiVersion,
          hasKey: !!key,
          errorChat,
          errorResponses,
        },
      });
    }
  } catch (e: any) {
    return NextResponse.json({ prompt: fallbackPrompt(), degraded: true, reason: e?.message || "error" });
  }
}


