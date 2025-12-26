require('dotenv').config({ path: '.env.local' });
const { CosmosClient } = require("@azure/cosmos");

async function run() {
    const conn = process.env.COSMOS_CONNECTION_STRING || process.env.AZURE_COSMOS_CONNECTION_STRING;
    if (!conn) { console.error("No COSMOS_CONNECTION_STRING"); return; }

    const client = new CosmosClient(conn);
    // Log endpoint to verify we are hitting remote
    console.log("Endpoint:", (await client.getDatabaseAccount()).address); // or client.endpoint url

    const dbId = "payportal";
    const containerId = "payportal_events";

    console.log(`Connecting to ${dbId}/${containerId}...`);
    const c = client.database(dbId).container(containerId);

    const target = "0x5e034bdeb2c24996c89c942c38c7990a3b221e0b".toLowerCase();

    const querySpec = {
        query: `
      SELECT * FROM c 
      WHERE 
        LOWER(c.wallet) = @target 
        OR LOWER(c.splitAddress) = @target
        OR LOWER(c.split.address) = @target
        OR c.id = @target
    `,
        parameters: [
            { name: "@target", value: target }
        ]
    };

    try {
        const { resources } = await c.items.query(querySpec).fetchAll();
        if (resources.length > 0) {
            console.log(`FOUND ${resources.length} MATCHES for ${target}:`);
            resources.forEach(r => {
                console.log(`\n--- ID: ${r.id} | Partition: ${r.wallet} ---`);
                console.log(JSON.stringify(r, null, 2));
            });
        } else {
            console.log(`NO MATCHES found for ${target} in ${containerId}`);
        }
    } catch (e) {
        console.error("Query Error:", e.message);
    }
}

run();
