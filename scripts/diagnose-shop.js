
const { CosmosClient } = require("@azure/cosmos");
const path = require("path");
const fs = require("fs");

// Manually parse .env because dotenv might not be working as expected with the path or encoding
// Or just rely on process.env being set if run in a context where it's already loaded?
// But standalone scripts usually need to load it.

const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
    const envConfig = require("dotenv").parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const connectionString = process.env.COSMOS_CONNECTION_STRING || process.env.AZURE_COSMOS_CONNECTION_STRING;
if (!connectionString) {
    console.error("Error: COSMOS_CONNECTION_STRING is not set in .env");
    process.exit(1);
}

const dbId = process.env.COSMOS_PAYPORTAL_DB_ID || process.env.COSMOS_DB_ID || "payportal";
const containerId = process.env.COSMOS_PAYPORTAL_CONTAINER_ID || process.env.COSMOS_CONTAINER_ID || "payportal_events";

async function main() {
    console.log(`Connecting to Cosmos DB: ${dbId} / ${containerId}`);
    const client = new CosmosClient(connectionString);
    const database = client.database(dbId);
    const container = database.container(containerId);

    const slug = "jbxoinpay";
    console.log(`Querying for shop slug: ${slug}`);

    // Query by slug
    const { resources: shops } = await container.items
        .query({
            query: "SELECT * FROM c WHERE c.slug = @slug OR (c.customDomain = @slug AND c.customDomainVerified = true)",
            parameters: [{ name: "@slug", value: slug }]
        })
        .fetchAll();

    console.log(`Found ${shops.length} shop(s) matching slug '${slug}'`);

    if (shops.length === 0) {
        console.log("No shop found!");
    } else {
        shops.forEach((shop, index) => {
            console.log(`\n--- Shop #${index + 1} ---`);
            console.log(`ID: ${shop.id}`);
            console.log(`BrandKey: ${shop.brandKey}`);
            console.log(`Wallet: ${shop.wallet}`);
            console.log(`Theme present: ${!!shop.theme}`);
            if (shop.theme) {
                console.log("Theme details:", JSON.stringify(shop.theme, null, 2));
            }
            console.log("Full Document:", JSON.stringify(shop, null, 2));
        });
    }
}

main().catch((err) => {
    console.error("Error running script:", err);
    process.exit(1);
});
