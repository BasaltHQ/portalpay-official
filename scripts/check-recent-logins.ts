
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function checkRecentLogins() {
    try {
        const container = await getContainer();

        // Check last 60 minutes
        const oneHourAgoMs = Date.now() - (60 * 60 * 1000);
        const oneHourAgoSec = Math.floor(oneHourAgoMs / 1000);

        console.log(`Searching for activity since ${new Date(oneHourAgoMs).toISOString()}...`);

        const { resources: items } = await container.items
            .query({
                query: `
                SELECT c.id, c.type, c.wallet, c.phone, c.email, c.firstSeen, c.lastSeen, c._ts 
                FROM c 
                WHERE 
                    (c.type = 'user' AND c.lastSeen > @limitMs) 
                    OR 
                    (c.type = 'client_request' AND c._ts > @limitSec)
            `,
                parameters: [
                    { name: "@limitMs", value: oneHourAgoMs },
                    { name: "@limitSec", value: oneHourAgoSec }
                ]
            })
            .fetchAll();

        console.log(`Found ${items.length} active items.`);
        console.log(JSON.stringify(items, null, 2));

    } catch (error) {
        console.error("Error querying Cosmos:", error);
    }
}

checkRecentLogins();
