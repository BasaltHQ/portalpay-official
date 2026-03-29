const { CosmosClient } = require("@azure/cosmos");
require("dotenv").config({ path: ".env.local" });

async function getReceipt() {
    const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
    const database = client.database(process.env.COSMOS_DB_NAME || "portalpay_db");
    const container = database.container(process.env.COSMOS_CONTAINER_NAME || "items");
    
    // The user's screenshot shows ticket "#700175"
    const receiptId = "receipt:700175";
    
    const querySpec = {
        query: "SELECT c.id, c.receiptId, c.status, c.kitchenStatus, c.totalUsd FROM c WHERE c.type = 'receipt' AND (c.receiptId = '700175' OR c.id = 'receipt:700175')",
    };
    
    try {
        const { resources } = await container.items.query(querySpec).fetchAll();
        if (resources.length > 0) {
            console.log("RECEIPT FOUND:", JSON.stringify(resources, null, 2));
        } else {
            console.log("RECEIPT NOT FOUND FOR " + receiptId);
        }
    } catch (e) {
        console.error("error!", e.message);
    }
}

getReceipt();
