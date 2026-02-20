
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const API_BASE = "https://api.elevenlabs.io/v1";

async function main() {
    console.log("🛠️ Creating a Standalone Tool (Client)...");

    const toolPayload = {
        name: "test_client_tool_" + Date.now(),
        type: "client",
        tool_config: {
            type: "client",
            name: "test_client_tool_" + Date.now(),
            description: "A test client tool created via API",
            expects_response: true,
            parameters: {
                type: "object",
                properties: {
                    arg1: {
                        type: "string",
                        description: "A test argument"
                    }
                }
            }
        }
    };

    console.log("Payload:", JSON.stringify(toolPayload, null, 2));

    const res = await fetch(`${API_BASE}/convai/tools`, {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(toolPayload)
    });

    if (!res.ok) {
        console.error(`❌ Creation failed (${res.status}):`, await res.text());
        return;
    }

    const data = await res.json();
    console.log("✅ Response:", JSON.stringify(data, null, 2));
    console.log(`✅ Created Tool ID: ${data.tool_id || data.id}`);
}

main();
