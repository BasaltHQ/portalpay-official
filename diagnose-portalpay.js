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

    console.log(`\n--- site:config:portalpay ---`);
    try {
        const { resource } = await c.item("site:config:portalpay", "site:config:portalpay").read(); // ID=site:config:portalpay, Partition=site:config:portalpay? Or Partition=portalpay?
        // Try both partition keys just in case
        if (resource) {
            console.log("FOUND (Partition=self)!");
            console.log("SplitAddr:", resource.splitAddress || resource.split?.address || "MISSING");
        } else {
            console.log("MISSING (Partition=self)");
            // Try simple partition
            const { resource: r2 } = await c.item("site:config:portalpay", "portalpay").read();
            if (r2) {
                console.log("FOUND (Partition=portalpay)!");
                console.log("SplitAddr:", r2.splitAddress || r2.split?.address || "MISSING");
            } else {
                console.log("MISSING (Partition=portalpay)");
            }
        }
    } catch (e) { console.error("Error:", e.message); }
}

run();
