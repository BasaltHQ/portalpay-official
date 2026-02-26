
import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireRole } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds

export async function POST(req: NextRequest) {
    try {
        await requireRole(req, "admin");

        const container = await getContainer();
        const results: any[] = [];
        const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";

        // Scrubbing helper
        const scrubObj = (obj: any): { touched: boolean, value: any } => {
            let touched = false;
            const scrub = (val: any): any => {
                if (typeof val === 'string') {
                    const replaced = val
                        .replace(/portalpay\.app/gi, 'basaltsurge.app')
                        .replace(/PortalPay/g, 'BasaltSurge')
                        .replace(/portalpay/g, 'basaltsurge');
                    if (replaced !== val) {
                        touched = true;
                        return replaced;
                    }
                    return val;
                }
                if (Array.isArray(val)) {
                    return val.map(scrub);
                }
                if (val && typeof val === 'object') {
                    const next: any = {};
                    for (const k in val) {
                        next[k] = scrub(val[k]);
                    }
                    return next;
                }
                return val;
            };
            return { touched, value: scrub(obj) };
        };

        // Helper to migrate a batch of documents
        const migrateDocs = async (docType: string, label: string) => {
            const querySpec = {
                query: `
                    SELECT * FROM c 
                    WHERE c.type = @docType 
                    AND (c.brandKey = 'portalpay' OR NOT IS_DEFINED(c.brandKey) OR c.brandKey = 'basaltsurge')
                `,
                parameters: [{ name: "@docType", value: docType }]
            };

            const { resources } = await container.items.query(querySpec).fetchAll();
            let updatedCount = 0;
            let idMigratedCount = 0;
            let skippedCount = 0;

            for (let doc of resources) {
                if (doc.wallet && (
                    doc.wallet === 'paynex' ||
                    doc.wallet === 'xoinpay' ||
                    doc.wallet === 'icunow-store'
                )) {
                    skippedCount++;
                    continue;
                }

                let needsUpsert = false;
                let oldId = doc.id;

                // 1. Update brandKey
                if (doc.brandKey !== 'basaltsurge') {
                    doc.brandKey = 'basaltsurge';
                    needsUpsert = true;
                }

                // 2. Content scrubbing
                const { touched, value } = scrubObj(doc);
                if (touched) {
                    doc = value;
                    needsUpsert = true;
                }

                // 3. ID transformation for site_config / shop_config
                let nextId = doc.id;
                if (docType === 'site_config' && doc.id === 'site:config') {
                    nextId = 'site:config:basaltsurge';
                } else if (docType === 'shop_config' && doc.id === 'shop:config') {
                    nextId = 'shop:config:basaltsurge';
                }

                if (nextId !== oldId) {
                    doc.id = nextId;
                    idMigratedCount++;
                    needsUpsert = true;

                    if (!dryRun) {
                        // For ID change, we MUST delete the old one
                        try {
                            // Cosmos DB delete requires partition key. Assuming wallet is PK for these types.
                            await container.item(oldId, doc.wallet || oldId).delete();
                        } catch (e: any) {
                            console.error(`Failed to delete legacy doc ${oldId}`, e.message);
                        }
                    }
                }

                if (needsUpsert) {
                    doc.updatedAt = Date.now();
                    doc._migration = "portalpay-to-basaltsurge-v2";
                    if (!dryRun) {
                        await container.items.upsert(doc);
                    }
                    updatedCount++;
                }
            }

            results.push({
                type: label,
                found: resources.length,
                updated: updatedCount,
                idMigrated: idMigratedCount,
                skipped: skippedCount
            });
        };

        await migrateDocs('shop_config', 'Shop Configurations');
        await migrateDocs('site_config', 'Site Configurations');
        await migrateDocs('receipt', 'Receipts/Orders');
        await migrateDocs('inventory_item', 'Inventory Items');

        // Special handling for Global Configs (partitioned by ID)
        const globalIds = ['site:config', 'shop:config', 'brand:config'];
        for (const id of globalIds) {
            try {
                const { resource: doc } = await container.item(id, id).read();
                if (doc && (doc.brandKey === 'portalpay' || !doc.brandKey)) {
                    doc.brandKey = 'basaltsurge';
                    const { touched, value } = scrubObj(doc);
                    let finalDoc = touched ? value : doc;
                    finalDoc.updatedAt = Date.now();
                    if (!dryRun) await container.items.upsert(finalDoc);
                    results.push({ msg: `Updated global ${id}` });
                }
            } catch { }
        }

        return NextResponse.json({
            success: true,
            dryRun,
            results
        });

    } catch (e: any) {
        console.error("Migration failed", e);
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
