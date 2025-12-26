require('dotenv').config({ path: '.env.local' });
const { CosmosClient } = require("@azure/cosmos");

async function run() {
    const conn = process.env.COSMOS_CONNECTION_STRING || process.env.AZURE_COSMOS_CONNECTION_STRING;
    if (!conn) { console.error("No COSMOS_CONNECTION_STRING"); return; }

    const client = new CosmosClient(conn);
    // HARDCODED to check if data lives here
    const dbId = "payportal";
    const containerId = "payportal_events";

    console.log(`Connecting to ${dbId}/${containerId}...`);
    const c = client.database(dbId).container(containerId);

    const wallet = "0x3204a162ed5Fe55A611861a8160851B9dFf0f57a".toLowerCase();

    console.log("--- GLOBAL ---");
    try {
        const { resource: global } = await c.item("site:config", "site:config").read();
        console.log("Global SplitAddr:", global?.splitAddress || global?.split?.address || "MISSING");
    } catch (e) { console.error("Global Error:", e.message); }

    console.log(`--- WALLET: ${wallet} ---`);
    try {
        const { resource: w } = await c.item("site:config", wallet).read();
        console.log("Local Found:", !!w);
        console.log("Local SplitAddr:", w?.splitAddress || w?.split?.address || "MISSING");
    } catch (e) { console.error("Local Error:", e.message); }
}

run();
