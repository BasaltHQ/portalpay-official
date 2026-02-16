#!/usr/bin/env node
/**
 * backup-cosmos.js
 * ────────────────────────────────────────────────────────────────────────────
 * Full local backup of every database & container in the skynetpod Cosmos DB
 * account.  Outputs one JSON file per container under:
 *
 *   ./cosmos-backup/<timestamp>/<dbName>/<containerName>.json
 *
 * Usage:
 *   node scripts/backup-cosmos.js                  # uses .env.local
 *   COSMOS_CONNECTION_STRING="..." node scripts/backup-cosmos.js
 *
 * Requirements:  npm i @azure/cosmos dotenv
 * ────────────────────────────────────────────────────────────────────────────
 */

const { CosmosClient } = require("@azure/cosmos");
const fs = require("fs");
const path = require("path");

// ── Load env if available ────────────────────────────────────────────────────
try {
    require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
} catch {
    // dotenv not installed – rely on env vars being set
}

const CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING;
if (!CONNECTION_STRING) {
    console.error("❌  COSMOS_CONNECTION_STRING is not set. Aborting.");
    process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.resolve(__dirname, "..", "cosmos-backup", timestamp);

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function fetchAllItems(container) {
    const items = [];
    const queryIterator = container.items.readAll().fetchAll();
    const { resources } = await queryIterator;
    items.push(...resources);
    return items;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const client = new CosmosClient(CONNECTION_STRING);

    console.log("🔌  Connected to Cosmos DB account");
    console.log(`📂  Backup root: ${backupRoot}\n`);

    // 1. List all databases
    const { resources: databases } = await client.databases.readAll().fetchAll();
    console.log(`   Found ${databases.length} database(s):\n`);

    let totalContainers = 0;
    let totalDocuments = 0;

    for (const dbMeta of databases) {
        const dbName = dbMeta.id;
        const database = client.database(dbName);
        console.log(`   📁  Database: ${dbName}`);

        // 2. List all containers in this database
        const { resources: containers } = await database.containers.readAll().fetchAll();
        console.log(`       └─ ${containers.length} container(s)`);

        for (const contMeta of containers) {
            const contName = contMeta.id;
            const container = database.container(contName);

            process.stdout.write(`          └─ ${contName} ... `);

            try {
                const items = await fetchAllItems(container);
                totalDocuments += items.length;
                totalContainers++;

                // Write to file
                const outDir = path.join(backupRoot, dbName);
                ensureDir(outDir);
                const outFile = path.join(outDir, `${contName}.json`);
                fs.writeFileSync(outFile, JSON.stringify(items, null, 2), "utf-8");

                console.log(`${items.length} doc(s) ✅`);
            } catch (err) {
                console.log(`⚠️  ERROR: ${err.message}`);
            }
        }
        console.log();
    }

    console.log("────────────────────────────────────────────");
    console.log(`✅  Backup complete!`);
    console.log(`    ${databases.length} database(s), ${totalContainers} container(s), ${totalDocuments} document(s)`);
    console.log(`    Saved to: ${backupRoot}`);
}

main().catch((err) => {
    console.error("❌  Fatal error:", err);
    process.exit(1);
});
