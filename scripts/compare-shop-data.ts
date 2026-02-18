
import { CosmosClient } from "@azure/cosmos";
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const WALLET_A = "0x2F2cE02f7CDBb6922c6D276043F5b17427ec31E9".toLowerCase(); // Working
const WALLET_B = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a".toLowerCase(); // Broken

const DB_ID = process.env.COSMOS_PAYPORTAL_DB_ID || process.env.COSMOS_DB_ID || "payportal";
const CONTAINER_ID = process.env.COSMOS_PAYPORTAL_CONTAINER_ID || process.env.COSMOS_CONTAINER_ID || "payportal_events";
const CONN_STRING = process.env.COSMOS_CONNECTION_STRING || process.env.AZURE_COSMOS_CONNECTION_STRING || "";

if (!CONN_STRING) {
    console.error("No Cosmos Connection String found!");
    process.exit(1);
}

const client = new CosmosClient(CONN_STRING);

async function main() {
    console.log("Connecting to Cosmos...");
    const database = client.database(DB_ID);
    const container = database.container(CONTAINER_ID);

    console.log(`Fetching configs for Working Wallet: ${WALLET_A}`);
    const { resources: docsA } = await container.items
        .query({
            query: "SELECT * FROM c WHERE c.wallet = @wallet AND (c.type = 'shop_config' OR c.type = 'site_config')",
            parameters: [{ name: "@wallet", value: WALLET_A }]
        })
        .fetchAll();

    console.log(`Fetching configs for Broken Wallet: ${WALLET_B}`);
    const { resources: docsB } = await container.items
        .query({
            query: "SELECT * FROM c WHERE c.wallet = @wallet AND (c.type = 'shop_config' OR c.type = 'site_config')",
            parameters: [{ name: "@wallet", value: WALLET_B }]
        })
        .fetchAll();

    const output = {
        working: docsA,
        broken: docsB
    };

    fs.writeFileSync('comparison.json', JSON.stringify(output, null, 2));
    console.log("Wrote comparison.json");
}

main().catch(console.error);
