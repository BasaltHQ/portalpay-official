require('dotenv').config();
const { CosmosClient } = require('@azure/cosmos');

async function main() {
    const conn = process.env.COSMOS_CONNECTION_STRING || process.env.AZURE_COSMOS_CONNECTION_STRING || process.env.NEXT_PUBLIC_COSMOS_CONNECTION_STRING;
    if (!conn) {
        console.error("No connection string found in .env");
        process.exit(1);
    }

    const client = new CosmosClient(conn);
    const dbId = process.env.COSMOS_PAYPORTAL_DB_ID || process.env.COSMOS_DB_ID || "payportal";
    const containerId = process.env.COSMOS_PAYPORTAL_CONTAINER_ID || process.env.COSMOS_CONTAINER_ID || "payportal_events";

    console.log(`Connecting to ${dbId}/${containerId}...`);
    const container = client.database(dbId).container(containerId);

    const querySpec = {
        // Re-run the stat query
        query: "SELECT c.id, c.brandKey, c.type FROM c WHERE c.type = 'shop_config' OR c.type = 'site_config'"
    };

    try {
        const { resources } = await container.items.query(querySpec).fetchAll();
        console.log(`Found ${resources.length} config docs.`);

        let stats = { portalpay: 0, basaltsurge: 0, legacy: 0, other: 0 };

        for (const r of resources) {
            const bk = (r.brandKey || "").toLowerCase();
            if (bk === "portalpay") stats.portalpay++;
            else if (bk === "basaltsurge") stats.basaltsurge++;
            else if (!bk) stats.legacy++;
            else stats.other++;
        }

        console.log("Final Migration Stats:", stats);

        if (stats.portalpay === 0 && stats.legacy === 0) {
            console.log("SUCCESS: 0 Legacy/PortalPay docs remaining.");
        } else {
            console.log("WARNING: Some docs remain unmigrated.");
        }

    } catch (err) {
        console.error("Query failed:", err.message);
    }
}

main();
