const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');
async function run() {
    try {
        const envData = fs.readFileSync('.env.local', 'utf8');
        const matchKey = envData.match(/COSMOS_PAYPORTAL_KEY=([^\n]+)/);
        const matchEndpoint = envData.match(/COSMOS_PAYPORTAL_ENDPOINT=([^\n]+)/);
        if (!matchKey || !matchEndpoint) throw new Error('Missing credentials');
        const endpoint = matchEndpoint[1].trim();
        const key = matchKey[1].trim();
        const client = new CosmosClient({ endpoint, key });
        const container = client.database('payportal').container('payportal_events');
        const { resources } = await container.items.query(`SELECT * FROM c WHERE c.merchantWallet = '0x6c28067a2D4F10013FbBb8534aCd76Ab43A4fF9f' AND c.type = 'touchpoint_device'`).fetchAll();
        console.log(JSON.stringify(resources, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}
run();
