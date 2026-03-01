require('dotenv').config({ path: '.env.local' });
const { getContainer } = require('./src/lib/cosmos');

async function main() {
    try {
        console.log("Fetching container...");
        const c = await getContainer();
        console.log("Reading site:config:basaltsurge...");
        const wallet = "0x6c28067a2d4f10013fbbb8534acd76ab43a4ff9f";
        const { resource: perMerchant } = await c.item("site:config:basaltsurge", wallet).read();
        console.log("--- RAW PER-MERCHANT DOC ---");
        console.log(JSON.stringify(perMerchant, null, 2));

        console.log("Reading legacy site:config...");
        const { resource: legacyDoc } = await c.item("site:config", wallet).read();
        console.log("--- RAW LEGACY DOC ---");
        console.log(JSON.stringify(legacyDoc, null, 2));

    } catch (e) {
        console.error(e);
    }
}
main();
