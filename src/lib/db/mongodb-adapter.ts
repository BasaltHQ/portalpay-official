/**
 * MongoDB adapter that exposes the same interface as Cosmos DB's Container.
 *
 * Goal: all 50+ files that call `getContainer()` continue to work unchanged.
 * The adapter translates Cosmos SDK calls into MongoDB driver calls at runtime.
 */

import { MongoClient, Collection, Db, Document, ObjectId } from "mongodb";
import { parseCosmosSql } from "./sql-parser";

// ── Connection pool ─────────────────────────────────────────────────────

let _client: MongoClient | null = null;

async function getMongoClient(uri: string): Promise<MongoClient> {
    // Simplified check: since the driver handles reconnection, we just check if the client is initialized.
    const isConnected = !!_client;

    if (!_client || !isConnected) {
        if (_client) {
            // Attempt to cleanly close the broken client before replacing
            _client.close().catch(() => { });
        }

        _client = new MongoClient(uri, {
            maxPoolSize: 20,
            minPoolSize: 2,
            retryWrites: true,
            retryReads: true,
        });
        await _client.connect();

        // Graceful shutdown
        const cleanup = async () => {
            if (_client) {
                await _client.close();
                _client = null;
            }
        };
        // Remove existing listeners to prevent leaks when replacing clients
        const events = ["SIGINT", "SIGTERM"];
        events.forEach(eventName => {
            process.removeAllListeners(eventName);
            process.on(eventName, cleanup);
        });
    }
    return _client;
}

// ── Types matching Cosmos SDK shapes ────────────────────────────────────

interface FeedResponse<T> {
    resources: T[];
    requestCharge: number;
    hasMoreResults: boolean;
}

interface ItemResponse<T> {
    resource: T | undefined;
    statusCode: number;
    requestCharge: number;
}

interface CosmosQuerySpec {
    query: string;
    parameters?: { name: string; value: any }[];
}

interface CosmosPatchOperation {
    op: "add" | "set" | "replace" | "remove" | "incr";
    path: string;
    value?: any;
}

// ── Item reference (container.item(id, pk)) ─────────────────────────────

class MongoItemReference {
    constructor(
        private collection: Collection<Document>,
        private id: string,
        private _partitionKey?: string
    ) { }

    /** Build the filter that mirrors Cosmos item(id, partitionKey) semantics */
    private buildFilter(): Document {
        const filter: Document = { id: this.id };
        // In Cosmos DB, the partition key maps to the `wallet` field.
        // Include it in the filter so we match the exact document, not just any
        // document that happens to share the same `id` across partitions.
        if (this._partitionKey) {
            filter.wallet = this._partitionKey;
        }
        return filter;
    }

    async read<T = any>(): Promise<ItemResponse<T>> {
        const filter = this.buildFilter();
        // Sort by updatedAt descending to prefer the most recently updated document.
        // After Cosmos→MongoDB migration, duplicate documents with the same {id, wallet}
        // can exist; this ensures we always get the freshest one.
        const doc = await this.collection.find(filter).sort({ updatedAt: -1 }).limit(1).next();
        if (!doc) {
            return { resource: undefined, statusCode: 404, requestCharge: 0 };
        }
        return {
            resource: mongoDocToCosmos(doc) as T,
            statusCode: 200,
            requestCharge: 0,
        };
    }

    async replace<T = any>(body: T): Promise<ItemResponse<T>> {
        const doc = cosmosDocToMongo(body as any);
        const filter = this.buildFilter();
        await this.collection.replaceOne(filter, doc, { upsert: false });
        return { resource: body, statusCode: 200, requestCharge: 0 };
    }

    async delete(): Promise<ItemResponse<any>> {
        const filter = this.buildFilter();
        await this.collection.deleteOne(filter);
        return { resource: undefined, statusCode: 204, requestCharge: 0 };
    }

    async patch<T = any>(operations: CosmosPatchOperation[]): Promise<ItemResponse<T>> {
        const update: Document = {};
        const setOps: Document = {};
        const unsetOps: Document = {};
        const incOps: Document = {};

        for (const op of operations) {
            // Cosmos patch paths start with / — convert to dot notation
            const field = op.path.replace(/^\//, "").replace(/\//g, ".");
            switch (op.op) {
                case "add":
                case "set":
                case "replace":
                    setOps[field] = op.value;
                    break;
                case "remove":
                    unsetOps[field] = "";
                    break;
                case "incr":
                    incOps[field] = op.value;
                    break;
            }
        }

        if (Object.keys(setOps).length) update.$set = setOps;
        if (Object.keys(unsetOps).length) update.$unset = unsetOps;
        if (Object.keys(incOps).length) update.$inc = incOps;

        const filter = this.buildFilter();
        const result = await this.collection.findOneAndUpdate(filter, update, {
            returnDocument: "after",
        });
        return {
            resource: result ? mongoDocToCosmos(result) as T : undefined,
            statusCode: 200,
            requestCharge: 0,
        };
    }
}

// ── Items interface (container.items) ───────────────────────────────────

class MongoItemsReference {
    constructor(private collection: Collection<Document>) { }

    query<T = any>(
        querySpec: CosmosQuerySpec | string
    ): {
        fetchAll: () => Promise<FeedResponse<T>>;
        fetchNext: () => Promise<FeedResponse<T>>;
    } {
        const spec =
            typeof querySpec === "string"
                ? { query: querySpec, parameters: [] }
                : querySpec;

        return {
            fetchAll: async (): Promise<FeedResponse<T>> => {
                const parsed = parseCosmosSql(spec.query, spec.parameters);

                if (parsed.isAggregate && parsed.pipeline.length > 0) {
                    const results = await this.collection
                        .aggregate(parsed.pipeline)
                        .toArray();
                    // COUNT → return as single number; SUM → return as single number
                    // Object agg → return the object
                    const resources = results.map((r) => {
                        if ("value" in r && Object.keys(r).length <= 2) {
                            // COUNT(1) or SUM — unwrap to just the value
                            return r.value as T;
                        }
                        // Object aggregation ({ totalSales, totalTips, count })
                        return r as T;
                    });
                    return {
                        resources: resources.length > 0 ? resources : [0 as any],
                        requestCharge: 0,
                        hasMoreResults: false,
                    };
                }

                let cursor = this.collection.find(parsed.filter);

                if (parsed.projection) {
                    cursor = cursor.project(parsed.projection);
                }

                if (Object.keys(parsed.sort).length > 0) {
                    cursor = cursor.sort(parsed.sort);
                }

                if (parsed.skip > 0) {
                    cursor = cursor.skip(parsed.skip);
                }

                if (parsed.limit > 0) {
                    cursor = cursor.limit(parsed.limit);
                }

                const docs = await cursor.toArray();
                const resources = docs.map((d) => mongoDocToCosmos(d) as T);

                return {
                    resources,
                    requestCharge: 0,
                    hasMoreResults: false,
                };
            },

            // Add fetchNext for compatibility
            async fetchNext(): Promise<FeedResponse<T>> {
                return (this as any).fetchAll();
            }
        };
    }

    async upsert<T = any>(body: T & { id?: string }): Promise<ItemResponse<T>> {
        const doc = cosmosDocToMongo(body as any);
        const id = body.id || (doc as any).id || (doc as any)._id;

        if (!id) {
            throw new Error("Upserted document must have an id");
        }

        // Use the business ID for upserting, keeping MongoDB's _id as internal
        await this.collection.updateOne(
            { id: id },
            { $set: doc },
            { upsert: true }
        );
        return {
            resource: { ...body } as T,
            statusCode: 200,
            requestCharge: 0,
        };
    }

    async create<T = any>(body: T & { id?: string }): Promise<ItemResponse<T>> {
        const doc = cosmosDocToMongo(body as any);
        await this.collection.insertOne(doc as any);
        return {
            resource: { ...body } as T,
            statusCode: 201,
            requestCharge: 0,
        };
    }

    /**
     * Batch operations — Cosmos uses this for transactional batches.
     * We simulate with individual operations (MongoDB transactions optional).
     */
    async batch(operations: any[]): Promise<any> {
        const results: any[] = [];
        for (const op of operations) {
            if (op.operationType === "Upsert") {
                results.push(await this.upsert(op.resourceBody));
            } else if (op.operationType === "Create") {
                results.push(await this.create(op.resourceBody));
            }
        }
        return { result: results };
    }
}

// ── Container adapter ───────────────────────────────────────────────────

export class MongoDBContainerAdapter {
    public items: MongoItemsReference;
    private collection: Collection<Document>;

    constructor(
        private db: Db,
        public readonly id: string
    ) {
        this.collection = db.collection(id);
        this.items = new MongoItemsReference(this.collection);
    }

    item(id: string, _partitionKey?: string): MongoItemReference {
        return new MongoItemReference(this.collection, id, _partitionKey);
    }
}

// ── Factory function (called from cosmos.ts) ────────────────────────────

const containerCache: Record<string, MongoDBContainerAdapter> = {};

export async function getMongoContainer(
    uri: string,
    dbName: string,
    collectionName: string
): Promise<MongoDBContainerAdapter> {
    const cacheKey = `${dbName}/${collectionName}`;
    if (containerCache[cacheKey]) return containerCache[cacheKey];

    const client = await getMongoClient(uri);
    const db = client.db(dbName);

    // Ensure collection exists
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
        await db.createCollection(collectionName);
    }

    const adapter = new MongoDBContainerAdapter(db, collectionName);
    containerCache[cacheKey] = adapter;
    return adapter;
}

// ── Document mapping helpers ────────────────────────────────────────────

/**
 * Convert a Cosmos-style document (with `id`) to MongoDB.
 * Leaves `id` intact and allows MongoDB to use its own `_id`.
 */
function cosmosDocToMongo(doc: Record<string, any>): Document {
    return { ...doc };
}

/**
 * Convert a MongoDB document back to Cosmos-style.
 * Strips the MongoDB-internal `_id` field.
 */
function mongoDocToCosmos(doc: Document): Record<string, any> {
    const { _id, ...rest } = doc;
    return rest;
}
