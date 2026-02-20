/**
 * generate-agent-sounds.ts
 *
 * Pre-generates voice agent sound effects using the ElevenLabs Sound Effects API
 * and saves them as static audio files in /public/audio/.
 *
 * Usage:  npx tsx scripts/generate-agent-sounds.ts
 *
 * Sounds generated:
 *   1. agent-connect.mp3   – short, pleasant chime when the agent connects
 *   2. agent-thinking.mp3  – subtle ambient loop while the agent is making a tool call
 */
import "dotenv/config";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const API_BASE = "https://api.elevenlabs.io/v1";
const OUT_DIR = path.resolve(__dirname, "..", "public", "audio");

interface SoundDef {
    filename: string;
    text: string;
    duration_seconds: number;
    prompt_influence: number;
    loop?: boolean;
}

const SOUNDS: SoundDef[] = [
    {
        filename: "agent-connect.mp3",
        text: "Soft, friendly digital chime notification sound. Short crystalline bell tone, warm and welcoming, like a high-end app connection sound. Clean, modern, minimal.",
        duration_seconds: 1.5,
        prompt_influence: 0.5,
    },
    {
        filename: "agent-thinking.mp3",
        text: "Satisfying mechanical keyboard typing sounds. Cherry MX blue switches being pressed in a natural typing rhythm. Tactile clicky key presses with a pleasant resonance. Clean recording, no background noise.",
        duration_seconds: 10,
        prompt_influence: 0.6,
        loop: true,
    },
];

async function generateSound(def: SoundDef): Promise<Buffer> {
    console.log(`🎵 Generating "${def.filename}" (${def.duration_seconds}s)...`);
    console.log(`   Prompt: "${def.text}"`);

    const res = await fetch(`${API_BASE}/sound-generation`, {
        method: "POST",
        headers: {
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: def.text,
            duration_seconds: def.duration_seconds,
            prompt_influence: def.prompt_influence,
            // model_id: "eleven_text_to_sound_v2", // default
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to generate ${def.filename}: ${res.status} ${errText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function main() {
    if (!API_KEY) {
        console.error("❌ Missing ELEVENLABS_API_KEY in env");
        process.exit(1);
    }

    // Ensure output directory exists
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log(`📂 Output directory: ${OUT_DIR}\n`);

    for (const def of SOUNDS) {
        try {
            const audioBuffer = await generateSound(def);
            const outPath = path.join(OUT_DIR, def.filename);
            fs.writeFileSync(outPath, audioBuffer);
            console.log(`   ✅ Saved: ${outPath} (${(audioBuffer.length / 1024).toFixed(1)} KB)\n`);
        } catch (err: any) {
            console.error(`   ❌ Error: ${err.message}\n`);
        }
    }

    console.log("🎉 Done! Sound effects saved to /public/audio/");
}

main();
