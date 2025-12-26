require('dotenv').config({ path: '.env.local' });
const { CosmosClient } = require("@azure/cosmos");

async function run() {
    const conn = process.env.COSMOS_CONNECTION_STRING || process.env.AZURE_COSMOS_CONNECTION_STRING;
    if (!conn) { console.error("No COSMOS_CONNECTION_STRING"); return; }

    const client = new CosmosClient(conn);
    const dbId = "payportal";

    console.log(`Connecting to database: ${dbId}...`);
    const db = client.database(dbId);
    const { resources: containers } = await db.containers.readAll().fetchAll();

    console.log("Found containers:", containers.map(c => c.id).join(", "));

    const wallet = "0x3204a162ed5Fe55A611861a8160851B9dFf0f57a".toLowerCase();

    for (const container of containers) {
        console.log(`\nChecking container: ${container.id}...`);
        try {
            const c = db.container(container.id);
            const { resource } = await c.item("site:config", wallet).read();
            if (resource) {
                console.log(`✅ FOUND site:config for wallet in ${container.id}!`);
                console.log("SplitAddr:", resource.splitAddress || resource.split?.address || "MISSING");
            } else {
                console.log(`❌ Not found in ${container.id}`);
            }

            // Check global too
            const { resource: global } = await c.item("site:config", "site:config").read();
            if (global) {
                console.log(`✅ FOUND GLOBAL site:config in ${container.id}`);
                console.log("Global SplitAddr:", global.splitAddress || global?.split?.address || "MISSING");
            }
        } catch (e) {
            console.error(`Error checking ${container.id}:`, e.message);
        }
    }
}

run();
