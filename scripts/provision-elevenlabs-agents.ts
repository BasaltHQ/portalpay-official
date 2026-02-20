
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
import fetch from "node-fetch";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID_CONCIERGE || "";
const API_BASE = "https://api.elevenlabs.io/v1";

if (!ELEVENLABS_API_KEY) {
    console.error("❌ Missing ELEVENLABS_API_KEY");
    process.exit(1);
}
if (!AGENT_ID) {
    console.error("❌ Missing ELEVENLABS_AGENT_ID_CONCIERGE");
    process.exit(1);
}

// --- Defs ---

// Client Tools (Cart)
const CART_CLIENT_TOOLS = [
    {
        name: "addToCart",
        description: "Add an item to the customer's shopping cart. Always pass the item id. Default qty to 1 if not specified.",
        parameters: {
            type: "object",
            properties: {
                itemId: { type: "string", description: "The ID of the item to add" },
                quantity: { type: "number", description: "Quantity to add" },
                selectedModifiers: { type: "object", description: "Key-value pair of modifier IDs" },
                selectedVariant: { type: "object", description: "Selected variant object" }
            },
            required: ["itemId"]
        },
        expects_response: true
    },
    {
        name: "viewCart",
        description: "Get the current contents of the customer's cart.",
        parameters: { type: "object", properties: { dummy: { type: "string", description: "unused" } } },
        expects_response: true
    },
    // ... add others from original script if needed
];

// Server Tools (Webhooks)
const WEBHOOK_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://portalpay.io"; // Fallback
const SERVER_TOOLS = [
    {
        name: "getShopDetails",
        description: "Get the shop's name, description, bio, theme, and slug.",
        api_schema: {
            url: `${WEBHOOK_BASE}/api/agent/voice/call-tool`,
            method: "POST",
            request_body_schema: {
                type: "object",
                properties: {
                    slug: { type: "string", description: "The shop slug" }
                },
                required: ["slug"]
            }
        }
    },
    {
        name: "searchInventory",
        description: "Search for items in the shop's inventory.",
        api_schema: {
            url: `${WEBHOOK_BASE}/api/agent/voice/call-tool`,
            method: "POST",
            request_body_schema: {
                type: "object",
                properties: {
                    slug: { type: "string", description: "The shop slug" },
                    query: { type: "string", description: "Search query string" }
                },
                required: ["slug", "query"]
            }
        }
    }
];

// --- Logic ---

async function main() {
    console.log(`🚀 Reprovisioning Agent ${AGENT_ID} Tools...`);
    console.log(`Working with ${CART_CLIENT_TOOLS.length} client tools and ${SERVER_TOOLS.length} server tools.`);

    // 1. List existing tools
    console.log("\n🔍 Listing existing tools...");
    const listRes = await fetch(`${API_BASE}/convai/tools`, { headers: { "xi-api-key": ELEVENLABS_API_KEY } });
    const listData: any = await listRes.json();
    const existingTools = listData.tools || [];
    console.log(`Found ${existingTools.length} tools on account.`);

    // 2. Delete tools that match our target names (to ensure clean slate)
    const targetNames = new Set([...CART_CLIENT_TOOLS.map(t => t.name), ...SERVER_TOOLS.map(t => t.name)]);

    for (const tool of existingTools) {
        if (!tool || !tool.name) continue;
        // Check if name matches (nested in tool_config usually, but list returns top level too?)
        // List output showed top level name.
        if (targetNames.has(tool.name) || tool.name.startsWith("test_")) {
            console.log(`🗑️ Deleting old tool: ${tool.name} (${tool.id})`);
            await fetch(`${API_BASE}/convai/tools/${tool.id}`, {
                method: "DELETE",
                headers: { "xi-api-key": ELEVENLABS_API_KEY }
            });
        }
    }

    const newToolIds: string[] = [];

    // 3. Create Client Tools
    console.log("\n🛠️ Creating Client Tools...");
    for (const def of CART_CLIENT_TOOLS) {
        const payload = {
            name: def.name,
            type: "client",
            tool_config: {
                type: "client",
                name: def.name,
                description: def.description,
                expects_response: def.expects_response,
                parameters: {
                    type: "object",
                    required: def.parameters.required || [],
                    properties: def.parameters.properties
                    // Note: Ensure descriptions exist in properties!
                }
            }
        };

        const res = await fetch(`${API_BASE}/convai/tools`, {
            method: "POST",
            headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error(`❌ Failed to create ${def.name}:`, await res.text());
            continue;
        }
        const data: any = await res.json();
        const id = data.tool_id || data.id;
        console.log(`✅ Created ${def.name}: ${id}`);
        newToolIds.push(id);
    }

    // 4. Create Server Tools
    console.log("\n🛠️ Creating Server Tools...");
    for (const def of SERVER_TOOLS) {
        const payload = {
            name: def.name,
            type: "webhook",
            tool_config: {
                type: "webhook",
                name: def.name,
                description: def.description,
                api_schema: def.api_schema
            }
        };
        // Ensure api_schema has request_body_schema
        // (already defined in constant above)

        const res = await fetch(`${API_BASE}/convai/tools`, {
            method: "POST",
            headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error(`❌ Failed to create ${def.name}:`, await res.text());
            continue;
        }
        const data: any = await res.json();
        const id = data.tool_id || data.id;
        console.log(`✅ Created ${def.name}: ${id}`);
        newToolIds.push(id);
    }

    // 5. Link to Agent
    console.log(`\n🔗 Linking ${newToolIds.length} tools to agent ${AGENT_ID}...`);

    // We need to PATCH the agent
    const patchPayload = {
        conversation_config: {
            agent: {
                prompt: {
                    tool_ids: newToolIds
                }
            }
        }
    };

    const patchRes = await fetch(`${API_BASE}/convai/agents/${AGENT_ID}`, {
        method: "PATCH",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload)
    });

    if (!patchRes.ok) {
        console.error(`❌ Failed to patch agent:`, await patchRes.text());
        return;
    }
    const patchData = await patchRes.json();
    console.log("✅ Agent patched successfully!");
    console.log("New Tool IDs Config:", JSON.stringify(patchData.conversation_config?.agent?.tool_ids, null, 2));
}

main();
