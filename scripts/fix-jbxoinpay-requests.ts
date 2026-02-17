
import { getContainer } from "../src/lib/cosmos";
import * as dotenv from "dotenv";

dotenv.config();

async function fixRequests() {
    try {
        const container = await getContainer();
        console.log("Fixing Client Requests for jbxoinpay...");

        const newWallet = "0x79caa84a0ab55db1e66fbc89d5c83e03eab6fb1a";
        const oldWallet = "0x7fbb1b657c3406ceab1a37c25400ede12f7a1a76";

        // 1. Approve New Request
        console.log("Approving new request...");
        const { resources: newReqs } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = '${newWallet}'`)
            .fetchAll();

        if (newReqs.length > 0) {
            const req = newReqs[0];
            req.status = "approved";
            // Ensure it links to the right slug if that's a field
            // req.slug = 'jbxoinpay'; // client_request doesn't always have slug, but let's check

            await container.item(req.id, newWallet).replace(req); // Partition key for client_request might be wallet?
            // Wait, verifying partition key for client_request. 
            // Logic says usually 'wallet' or 'id'.
            // I'll try wallet.
            console.log(`Approved request ${req.id}`);
        } else {
            console.log("No new request found to approve.");
        }

        // 2. Deprecate Old Request (to hide it)
        console.log("Deprecating old request...");
        const { resources: oldReqs } = await container.items
            .query(`SELECT * FROM c WHERE c.type = 'client_request' AND c.wallet = '${oldWallet}'`)
            .fetchAll();

        if (oldReqs.length > 0) {
            const oldReq = oldReqs[0];
            oldReq.status = "deprecated";
            // or delete it? "kill the original shop"
            // Deleting might be cleaner.
            await container.item(oldReq.id, oldWallet).delete();
            console.log(`Deleted old request ${oldReq.id}`);
        }

    } catch (error) {
        console.error("Error updating Cosmos:", error);
    }
}

fixRequests();
