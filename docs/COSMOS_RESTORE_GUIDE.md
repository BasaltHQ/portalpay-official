# Cosmos DB Point-in-Time Restore Guide

## Situation
All merchant theme data (name, logo, colors) was lost when the backfill script overwrote site_config documents. The script used SELECT with specific fields and then upserted, losing all other fields.

## Prerequisites
- Continuous backup enabled on Cosmos DB account ✓
- Azure CLI or Azure Portal access
- Timestamp of when backfill script first ran

## Step 1: Determine Restore Timestamp

You need to restore to **just before** the first backfill script execution. Check:
- Terminal history for when you ran `node scripts/backfill-site-config-splits.js --fix`
- The script was likely run around: **2025-11-12 around 1:30-1:45 PM MST**
- Choose a restore time at least 5-10 minutes BEFORE that

Recommended restore timestamp: **2025-11-12 13:20:00 (1:20 PM MST)**

## Step 2: Initiate Restore via Azure Portal

1. Go to Azure Portal → Your Cosmos DB account
2. Navigate to **Backup & Restore** section
3. Click **Restore** button
4. Select **Point in time restore**
5. Configure restore:
   - **Restore timestamp**: Choose the timestamp from Step 1
   - **Location**: Same as source account
   - **Restore target**: Create new account (safer) or restore in place
   - **Account name**: `<your-account-name>-restored` (if creating new)
6. Click **Review + Create** → **Create**

Restore typically takes 10-30 minutes depending on data size.

## Step 3: Initiate Restore via Azure CLI (Alternative)

```bash
# Set variables
RESOURCE_GROUP="<your-resource-group>"
SOURCE_ACCOUNT="<your-cosmos-account-name>"
RESTORE_ACCOUNT="${SOURCE_ACCOUNT}-restored"
LOCATION="<your-location>"  # e.g., "eastus"
RESTORE_TIMESTAMP="2025-11-12T20:20:00Z"  # UTC time, adjust for timezone

# Initiate restore
az cosmosdb restore \
  --resource-group $RESOURCE_GROUP \
  --account-name $RESTORE_ACCOUNT \
  --location $LOCATION \
  --source-database-account-id "/subscriptions/<subscription-id>/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.DocumentDB/databaseAccounts/$SOURCE_ACCOUNT" \
  --restore-timestamp $RESTORE_TIMESTAMP

# Monitor restore status
az cosmosdb show \
  --resource-group $RESOURCE_GROUP \
  --name $RESTORE_ACCOUNT \
  --query provisioningState
```

## Step 4: Verify Restored Data

Once restore completes:

```bash
# Update connection to restored account temporarily
# In .env.local:
# COSMOS_ENDPOINT=https://<your-account-name>-restored.documents.azure.com:443/
# COSMOS_KEY=<restored-account-key>

# Run verification
node scripts/check-merchant-themes.js
```

Expected output:
```
Documents WITH theme data: 59
Documents WITHOUT theme data: 0
✓ All merchant themes intact.
```

## Step 5: Migration Strategy

### Option A: Switch to Restored Account (Recommended)

1. Update all connection strings to point to restored account
2. Delete corrupted original account after verification
3. Rename restored account to original name (requires support ticket)

### Option B: Copy Data Back to Original Account

Create a migration script to copy site_config documents from restored to original:

```javascript
// scripts/migrate-site-configs.js
const { CosmosClient } = require("@azure/cosmos");

async function migrate() {
  // Source (restored)
  const sourceClient = new CosmosClient({
    endpoint: process.env.SOURCE_COSMOS_ENDPOINT,
    key: process.env.SOURCE_COSMOS_KEY
  });
  const sourceContainer = sourceClient
    .database(process.env.COSMOS_DB)
    .container(process.env.COSMOS_CONTAINER);

  // Target (original)
  const targetClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
  });
  const targetContainer = targetClient
    .database(process.env.COSMOS_DB)
    .container(process.env.COSMOS_CONTAINER);

  // Query ALL site_config docs from restored
  const { resources } = await sourceContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.type = 'site_config'"
    })
    .fetchAll();

  console.log(`Migrating ${resources.length} documents...`);

  for (const doc of resources) {
    await targetContainer.items.upsert(doc);
    console.log(`✓ Migrated ${doc.id} for wallet ${doc.wallet}`);
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);
```

## Step 6: Fix the Backfill Script

Before running ANY backfill again, fix the script to preserve all fields:

```javascript
// In scripts/backfill-site-config-splits.js
const querySpec = {
  query: `
    SELECT *  // ← Changed from specific fields
    FROM c
    WHERE c.type = 'site_config'
  `,
};
```

The script should:
1. SELECT * to get complete documents
2. Only modify specific fields (splitAddress, split, brandKey)
3. Preserve all other fields (name, logo, colors, etc.)

## Step 7: Re-run Corrected Backfill

After restoration and fix:

```bash
# Dry run first
node scripts/backfill-site-config-splits.js --dry-run

# Apply fixes (will preserve theme data this time)
node scripts/backfill-site-config-splits.js --fix

# Verify themes still intact
node scripts/check-merchant-themes.js
```

## Timeline Summary

1. **Immediate**: Initiate restore (10-30 min)
2. **After restore**: Verify data integrity (5 min)
3. **Migration**: Copy or switch to restored account (15-60 min)
4. **Fix script**: Correct backfill logic (5 min)
5. **Re-backfill**: Apply split metadata fixes safely (5 min)

**Total estimated time**: 1-2 hours

## Important Notes

- Do NOT run any write operations on the corrupted account until restore completes
- Keep the restored account separate until verification is 100% complete
- Test the migration on a small subset first if using Option B
- Document the restore timestamp for audit purposes
- Consider adding automated backups before major data operations in the future

## Prevention for Future

1. Always SELECT * when reading documents for modification
2. Run dry-run audits before any bulk write operations
3. Test backfill scripts on test data first
4. Implement change tracking/audit logs
5. Consider using Cosmos DB Change Feed for safety net
