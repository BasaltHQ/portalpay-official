
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const API_BASE = "https://api.elevenlabs.io/v1";

async function main() {
    console.log("🧪 Testing Agent Creation with Tools...");

    // Basic client tool definition
    const tools = [{
        type: "client",
        name: "testClientTool",
        description: "A test client tool",
        parameters: { type: "object", properties: {} },
        expects_response: true
    }];

    // Helper to attempt creation with a specific payload structure
    async function tryCreate(payload: any, label: string) {
        console.log(`\n🧪 Attempt: ${label}`);
        const res = await fetch(`${API_BASE}/convai/agents/create`, {
            method: "POST",
            headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.log(`❌ Failed (${res.status}):`, await res.text());
            return;
        }

        const data = await res.json();
        console.log(`✅ Created Agent ID: ${data.agent_id}`);

        // Verify persistence
        const check = await fetch(`${API_BASE}/convai/agents/${data.agent_id}`, { headers: { "xi-api-key": ELEVENLABS_API_KEY } });
        const checkData = await check.json();
        const cfg = checkData.conversation_config;

        console.log(`   Config Tools:`, JSON.stringify(cfg.tools || [], null, 0));
        console.log(`   Config ClientTools:`, JSON.stringify(cfg.client_tools || [], null, 0));
    }

    // 1. tools inside conversation_config
    await tryCreate({
        name: "Test Agent Tools " + Date.now(),
        conversation_config: {
            tts: { voice_id: "cgSgspJ2msm6clMCkdW9", model_id: "eleven_turbo_v2" },
            agent: { prompt: { prompt: "You are a test agent." }, first_message: "Hello", language: "en" },
            tools: tools
        }
    }, "tools inside conversation_config");

    // 2. client_tools inside conversation_config
    await tryCreate({
        name: "Test Agent ClientTools " + Date.now(),
        conversation_config: {
            tts: { voice_id: "cgSgspJ2msm6clMCkdW9", model_id: "eleven_turbo_v2" },
            agent: { prompt: { prompt: "You are a test agent." }, first_message: "Hello", language: "en" },
            client_tools: tools
        }
    }, "client_tools inside conversation_config");

    // 3. client_tools at ROOT (unlikely but checking)
    await tryCreate({
        name: "Test Agent RootClientTools " + Date.now(),
        conversation_config: {
            tts: { voice_id: "cgSgspJ2msm6clMCkdW9", model_id: "eleven_turbo_v2" },
            agent: { prompt: { prompt: "You are a test agent." }, first_message: "Hello", language: "en" },
        },
        client_tools: tools
    }, "client_tools at ROOT");
}

main();
