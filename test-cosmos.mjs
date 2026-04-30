import { CosmosClient } from "@azure/cosmos";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const client = new CosmosClient({ endpoint, key });
const databaseId = "PortalPayDB";
const containerId = "skynetpod";

async function main() {
    const c = client.database(databaseId).container(containerId);
    const { resources } = await c.items.query("SELECT c.id, c.type, c.brandKey, c.slug, c.wallet, c.name, c.categoryConfig FROM c WHERE c.type = 'shop_config' OR c.type = 'site_config'").fetchAll();
    console.log(JSON.stringify(resources, null, 2));
}

main().catch(console.error);
