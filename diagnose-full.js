require('dotenv').config({ path: '.env.local' });
const { CosmosClient } = require("@azure/cosmos");

async function run() {
    const conn = process.env.COSMOS_CONNECTION_STRING || process.env.AZURE_COSMOS_CONNECTION_STRING;
    if (!conn) { console.error("No COSMOS_CONNECTION_STRING"); return; }

    const client = new CosmosClient(conn);
    const dbId = "payportal";
    const containerId = "payportal_events";

    console.log(`Connecting to ${dbId}/${containerId}...`);
    const c = client.database(dbId).container(containerId);

    const targetWallet = "0x3204a162ed5Fe55A611861a8160851B9dFf0f57a".toLowerCase();
    const sourceWallet = "0x5e034bdeb2c24996c89c942c38c7990a3b221e0b".toLowerCase();

    // 1. Dump Target Wallet Config
    console.log(`\n--- TARGET: ${targetWallet} ---`);
    try {
        const { resource } = await c.item("site:config", targetWallet).read();
        if (resource) {
            console.log("FOUND!");
            console.log(JSON.stringify(resource, null, 2));
        } else {
            console.log("MISSING");
        }
    } catch (e) { console.error("Error:", e.message); }

    // 2. Dump Source Wallet Config (0x5e03...)
    console.log(`\n--- SOURCE: ${sourceWallet} ---`);
    try {
        const { resource } = await c.item("site:config", sourceWallet).read();
        if (resource) {
            console.log("FOUND!");
            console.log(JSON.stringify(resource, null, 2));
        } else {
            console.log("MISSING");
        }
    } catch (e) { console.error("Error:", e.message); }

    // 3. Dump Global Site Config
    console.log(`\n--- GLOBAL: site:config ---`);
    try {
        const { resource } = await c.item("site:config", "site:config").read();
        if (resource) {
            console.log("FOUND!");
            console.log(JSON.stringify(resource, null, 2));
        } else {
            console.log("MISSING");
        }
    } catch (e) { console.error("Error:", e.message); }
}

run();
