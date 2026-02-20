/**
 * Patch the ElevenLabs agent's TTS to use a multilingual voice & model.
 *
 * ElevenLabs TTS models:
 *   - eleven_turbo_v2_5   → 32 languages, fast, good quality
 *   - eleven_multilingual_v2 → 29 languages, highest quality
 *
 * Popular multilingual voice IDs (from ElevenLabs library):
 *   - "EXAVITQu4vr4xnSDxMaL"  → Sarah (female, warm, professional)
 *   - "IKne3meq5aSn9XLyUdCD"  → Charlie (male, casual, natural)
 *   - "XB0fDUnXU5powFXDhCwa"  → Charlotte (female, warm, animated)
 *   - "pNInz6obpgDQGcFmaJgB"  → Adam (male, deep, narration)
 *   - "onwK4e9ZLuTAKqWW03F9"  → Daniel (male, British, authoritative)
 *   - "21m00Tcm4TlvDq8ikWAM"  → Rachel (female, calm, professional)
 *
 * Usage:  npx tsx scripts/patch-voice.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import fetch from "node-fetch";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID_CONCIERGE || "";
const API_BASE = "https://api.elevenlabs.io/v1";

if (!ELEVENLABS_API_KEY || !AGENT_ID) {
    console.error("❌ Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID_CONCIERGE");
    process.exit(1);
}

// ─── Configuration ───
// Change these to your preferred voice + model
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Sarah — multilingual, warm, professional
const MODEL_ID = "eleven_turbo_v2_5";      // 32 languages, fast

async function main() {
    // 1. First, get current agent config to see what's there
    console.log(`\n🔍 Fetching current agent config...`);
    const getRes = await fetch(`${API_BASE}/convai/agents/${AGENT_ID}`, {
        headers: { "xi-api-key": ELEVENLABS_API_KEY }
    });
    if (!getRes.ok) {
        console.error("❌ Failed to fetch agent:", await getRes.text());
        return;
    }
    const agent: any = await getRes.json();
    const currentTTS = agent?.conversation_config?.tts;
    console.log("Current TTS config:", JSON.stringify(currentTTS, null, 2));

    // 2. Patch the agent language + TTS model and voice
    // English agents are restricted to turbo/flash v2 only.
    // To use multilingual models, set language to "multi".
    console.log(`\n🌍 Switching agent language to "multi"...`);
    console.log(`🎤 Patching voice to ${VOICE_ID} with model ${MODEL_ID}...`);
    const patchRes = await fetch(`${API_BASE}/convai/agents/${AGENT_ID}`, {
        method: "PATCH",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
            conversation_config: {
                agent: {
                    language: "multi",
                },
                tts: {
                    model_id: MODEL_ID,
                    voice_id: VOICE_ID,
                }
            }
        })
    });

    if (!patchRes.ok) {
        console.error("❌ Failed to patch:", await patchRes.text());
        return;
    }
    const patched: any = await patchRes.json();
    const newTTS = patched?.conversation_config?.tts;
    console.log("✅ Updated TTS config:", JSON.stringify(newTTS, null, 2));
    console.log(`\n🌍 Agent now uses multilingual model: ${MODEL_ID}`);
    console.log(`🎤 Voice: ${VOICE_ID}`);
}

main();
