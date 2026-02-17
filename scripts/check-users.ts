
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function listUsersWithPhones() {
    try {
        const container = await getContainer();
        // Check for users created in the last 15 minutes
        const fifteenMinutesAgo = Math.floor(Date.now() / 1000) - (15 * 60);
        // Cosmos DB _ts is in seconds

        console.log(`Searching for users created since timestamp ${fifteenMinutesAgo}...`);

        const { resources: users } = await container.items
            .query({
                query: "SELECT c.id, c.wallet, c.phone, c.email, c.firstSeen, c._ts FROM c WHERE c.type = 'user' AND c._ts > @limit",
                parameters: [{ name: "@limit", value: fifteenMinutesAgo }]
            })
            .fetchAll();

        console.log(`Found ${users.length} users.`);
        console.table(users);

    } catch (error) {
        console.error("Error querying Cosmos:", error);
    }
}

listUsersWithPhones();
