import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID_CONCIERGE || "";
const API_BASE = "https://api.elevenlabs.io/v1";

/** All supported ElevenLabs Conversational AI languages */
const SUPPORTED_LANGUAGES = new Set([
    "en", "zh", "es", "hi", "pt", "fr", "de", "ja", "ar", "ko",
    "id", "it", "nl", "tr", "pl", "ru", "sv", "tl", "ms", "ro",
    "uk", "el", "cs", "da", "fi", "bg", "hr", "sk", "ta", "vi",
    "no", "hu", "pt-br", "fil", "af", "hy", "as", "az", "be", "bn",
    "bs", "ca", "et", "gl", "ka", "gu", "ha", "he", "is", "ga",
    "jv", "kn", "kk", "ky", "lv", "lt", "lb", "mk", "ml", "mr",
    "ne", "ps", "fa", "pa", "sr", "sd", "sl", "so", "sw", "te",
    "th", "ur", "cy",
]);

/** Human-readable language name lookup */
const LANGUAGE_NAMES: Record<string, string> = {
    en: "English", zh: "Chinese", es: "Spanish", hi: "Hindi", pt: "Portuguese",
    fr: "French", de: "German", ja: "Japanese", ar: "Arabic", ko: "Korean",
    id: "Indonesian", it: "Italian", nl: "Dutch", tr: "Turkish", pl: "Polish",
    ru: "Russian", sv: "Swedish", tl: "Tagalog", ms: "Malay", ro: "Romanian",
    uk: "Ukrainian", el: "Greek", cs: "Czech", da: "Danish", fi: "Finnish",
    bg: "Bulgarian", hr: "Croatian", sk: "Slovak", ta: "Tamil", vi: "Vietnamese",
    no: "Norwegian", hu: "Hungarian", "pt-br": "Brazilian Portuguese",
    fil: "Filipino", af: "Afrikaans", hy: "Armenian", as: "Assamese",
    az: "Azerbaijani", be: "Belarusian", bn: "Bengali", bs: "Bosnian",
    ca: "Catalan", et: "Estonian", gl: "Galician", ka: "Georgian", gu: "Gujarati",
    ha: "Hausa", he: "Hebrew", is: "Icelandic", ga: "Irish", jv: "Javanese",
    kn: "Kannada", kk: "Kazakh", ky: "Kyrgyz", lv: "Latvian", lt: "Lithuanian",
    lb: "Luxembourgish", mk: "Macedonian", ml: "Malayalam", mr: "Marathi",
    ne: "Nepali", ps: "Pashto", fa: "Persian", pa: "Punjabi", sr: "Serbian",
    sd: "Sindhi", sl: "Slovenian", so: "Somali", sw: "Swahili", te: "Telugu",
    th: "Thai", ur: "Urdu", cy: "Welsh",
};

/**
 * POST /api/voice/elevenlabs/language
 * Body: { language: "es" }
 *
 * Patches the ElevenLabs agent's language setting for multilingual support.
 */
export async function POST(req: NextRequest) {
    try {
        if (!ELEVENLABS_API_KEY || !AGENT_ID) {
            return NextResponse.json(
                { ok: false, error: "missing_config" },
                { status: 500 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const language = String(body?.language || "").toLowerCase().trim();

        if (!language || !SUPPORTED_LANGUAGES.has(language)) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "invalid_language",
                    supported: Array.from(SUPPORTED_LANGUAGES),
                },
                { status: 400 }
            );
        }

        // PATCH the agent's language
        const patchRes = await fetch(`${API_BASE}/convai/agents/${AGENT_ID}`, {
            method: "PATCH",
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                conversation_config: {
                    agent: {
                        language,
                    },
                },
            }),
        });

        if (!patchRes.ok) {
            const errText = await patchRes.text();
            console.error("[voice/language] PATCH failed:", errText);
            return NextResponse.json(
                { ok: false, error: "patch_failed", detail: errText },
                { status: 502 }
            );
        }

        const languageName = LANGUAGE_NAMES[language] || language;
        return NextResponse.json({
            ok: true,
            language,
            languageName,
            message: `Agent language switched to ${languageName} (${language}). The conversation must be restarted for the change to take effect.`,
        });
    } catch (err: any) {
        console.error("[voice/language] Error:", err);
        return NextResponse.json(
            { ok: false, error: err?.message || "unknown_error" },
            { status: 500 }
        );
    }
}
