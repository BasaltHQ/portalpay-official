
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID_CONCIERGE;

if (!ELEVENLABS_API_KEY || !AGENT_ID) {
    console.error("Missing env vars");
    process.exit(1);
}

const API_BASE = "https://api.elevenlabs.io/v1";

async function main() {
    console.log(`🔍 Inspecting Agent: ${AGENT_ID}`);
    const res = await fetch(`${API_BASE}/convai/agents/${AGENT_ID}`, {
        headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
        },
    });

    if (!res.ok) {
        console.error(`Error ${res.status}:`, await res.text());
        return;
    }

    const data = await res.json();
    console.log("Agent Name:", data.name);
    console.log("Full Config:", JSON.stringify(data.conversation_config, null, 2));
}

main();
