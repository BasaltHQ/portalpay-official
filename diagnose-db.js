require('dotenv').config({ path: '.env.local' });
const { CosmosClient } = require("@azure/cosmos");

async function run() {
    const conn = process.env.COSMOS_CONNECTION_STRING || process.env.AZURE_COSMOS_CONNECTION_STRING;
    if (!conn) { console.error("No COSMOS_CONNECTION_STRING"); return; }

    const client = new CosmosClient(conn);
    const dbId = process.env.COSMOS_DB_ID || "payportal";
    const containerId = process.env.COSMOS_CONTAINER_ID || "payportal_events";

    console.log(`Connecting to ${dbId}/${containerId}...`);
    const c = client.database(dbId).container(containerId);

    const wallet = "0x3204a162ed5Fe55A611861a8160851B9dFf0f57a".toLowerCase();

    // 1. Check Global Site Config
    console.log("--- GLOBAL ---");
    try {
        const { resource: global } = await c.item("site:config", "site:config").read();
        console.log("Global SplitAddr:", global?.splitAddress || global?.split?.address || "MISSING");
        if (global?.splitAddress) console.log("Global Addr:", global.splitAddress);
    } catch (e) { console.error("Global Error:", e.message); }

    // 2. Check Wallet Site Config (Legacy/PortalPay)
    console.log(`--- WALLET: ${wallet} ---`);
    try {
        const { resource: w } = await c.item("site:config", wallet).read();
        console.log("Local Found:", !!w);
        console.log("Local BrandKey:", w?.brandKey);
        console.log("Local SplitAddr:", w?.splitAddress || w?.split?.address || "MISSING");
        if (w) console.log("Local Full:", JSON.stringify(w, null, 2));
    } catch (e) { console.error("Local Error:", e.message); }

    // 3. Check Wallet Site Config (BasaltSurge)
    console.log(`--- BASALTSURGE: ${wallet} ---`);
    try {
        const { resource: b } = await c.item("site:config:basaltsurge", wallet).read();
        console.log("Basalt Found:", !!b);
        console.log("Basalt SplitAddr:", b?.splitAddress || b?.split?.address || "MISSING");
    } catch (e) { console.error("Basalt Error:", e.message); }
}

run();
