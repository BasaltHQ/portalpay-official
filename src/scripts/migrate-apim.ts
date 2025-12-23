import { loadEnvConfig } from "@next/env";
import path from "path";

// Load environment variables from .env.local, .env, etc.
loadEnvConfig(process.cwd());

import { getContainer } from "../lib/cosmos";
import { hashApiKey, encryptApiKey } from "../lib/apim/keys";
import { ApiKey } from "../lib/apim/types";
import { listSubscriptions, listSubscriptionSecrets } from "../lib/azure-management";
import { randomBytes } from "node:crypto";
import { getBrandKey } from "../config/brands";

async function run() {
    console.log("Starting APIM Migration...");

    // 1. Fetch from Azure
    console.log("Fetching subscriptions from Azure...");
    const response = await listSubscriptions();
    const subs = Array.isArray(response) ? response : (response.value || []);
    console.log(`Found ${subs.length} subscriptions.`);

    const container = await getContainer();
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const sub of subs) {
        try {
            console.log(`Processing: ${sub.displayName || sub.name} (${sub.name})`);

            // Query for existing subscription mapping
            const query = "SELECT * FROM c WHERE c.type = 'apim_subscription' AND c.subscriptionId = @sid";
            const { resources: existingDocs } = await container.items.query({
                query, parameters: [{ name: "@sid", value: sub.name }]
            }).fetchAll();

            const existingMapping = existingDocs[0];
            if (!existingMapping || !existingMapping.wallet) {
                console.warn(`  - Skipped: No local mapping for subscription ${sub.name}`);
                continue;
            }

            const secrets = await listSubscriptionSecrets(sub.name!);
            if (!secrets.primaryKey) {
                console.warn(`  - Skipped: No keys found`);
                continue;
            }

            const labelName = sub.displayName || sub.name || "Unknown";
            const keysToMigrate = [
                { key: secrets.primaryKey, label: `Migrated Primary (${labelName})` },
                { key: secrets.secondaryKey, label: `Migrated Secondary (${labelName})` }
            ];

            for (const item of keysToMigrate) {
                if (!item.key) continue;

                const hash = hashApiKey(item.key);
                const encryptedKey = encryptApiKey(item.key);

                // Check for existing to preserve ID
                const queryKey = "SELECT * FROM c WHERE c.type = 'api_key' AND c.keyHash = @hash";
                const { resources: existingKeys } = await container.items.query({
                    query: queryKey, parameters: [{ name: "@hash", value: hash }]
                }).fetchAll();

                const existingKey = existingKeys[0];
                const docId = existingKey ? existingKey.id : `key_migrated_${randomBytes(8).toString("hex")}`;

                // Create Migration Doc
                const doc: ApiKey = {
                    id: docId,
                    type: "api_key",
                    keyHash: hash,
                    encryptedKey: encryptedKey, // Add encryption
                    prefix: "sk_live_",
                    label: item.label,
                    ownerWallet: existingMapping.wallet.toLowerCase(),
                    brandKey: existingMapping.brandKey || getBrandKey().toLowerCase(),
                    plan: "starter",
                    rateLimit: { requests: 120, window: 60 }, // Set default safe limit
                    scopes: existingMapping.scopes || [],
                    isActive: true,
                    createdAt: existingKey?.createdAt || Date.now(),
                    migratedFrom: { source: "azure_apim", subscriptionId: sub.name! }
                };

                await container.items.upsert(doc);
                console.log(`  + Migrated/Updated: ${item.label}`);
                migrated++;
            }

        } catch (e: any) {
            console.error(`  ! Error processing ${sub.name}: ${e.message}`);
            errors++;
        }
    }

    console.log(`\nMigration Complete.`);
    console.log(`Total: ${subs.length}`);
    console.log(`Migrated/Updated Keys: ${migrated}`);
    console.log(`Errors: ${errors}`);
}

run().catch(console.error);
