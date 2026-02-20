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
    if (!_client) {
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
        process.on("SIGINT", cleanup);
        process.on("SIGTERM", cleanup);
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

    async read<T = any>(): Promise<ItemResponse<T>> {
        const filter: Document = { _id: this.id as any };
        const doc = await this.collection.findOne(filter);
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
        const filter: Document = { _id: this.id as any };
        await this.collection.replaceOne(filter, doc, { upsert: false });
        return { resource: body, statusCode: 200, requestCharge: 0 };
    }

    async delete(): Promise<ItemResponse<any>> {
        const filter: Document = { _id: this.id as any };
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

        const filter: Document = { _id: this.id as any };
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

    async query<T = any>(
        querySpec: CosmosQuerySpec | string
    ): Promise<{ fetchAll: () => Promise<FeedResponse<T>> }> {
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
        };
    }

    async upsert<T = any>(body: T & { id?: string }): Promise<ItemResponse<T>> {
        const doc = cosmosDocToMongo(body as any);
        const id = doc._id || new ObjectId().toHexString();
        doc._id = id;

        await this.collection.updateOne(
            { _id: id as any },
            { $set: doc },
            { upsert: true }
        );
        return {
            resource: { ...body, id: id } as T,
            statusCode: 200,
            requestCharge: 0,
        };
    }

    async create<T = any>(body: T & { id?: string }): Promise<ItemResponse<T>> {
        const doc = cosmosDocToMongo(body as any);
        if (!doc._id) {
            doc._id = new ObjectId().toHexString();
        }

        await this.collection.insertOne(doc as any);
        return {
            resource: { ...body, id: doc._id } as T,
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
 * Convert a Cosmos-style document (with `id`) to MongoDB (with `_id`).
 */
function cosmosDocToMongo(doc: Record<string, any>): Document {
    const { id, ...rest } = doc;
    return { _id: id ?? new ObjectId().toHexString(), ...rest };
}

/**
 * Convert a MongoDB document (with `_id`) back to Cosmos-style (with `id`).
 * Also strips MongoDB-internal fields.
 */
function mongoDocToCosmos(doc: Document): Record<string, any> {
    const { _id, ...rest } = doc;
    return { id: _id, ...rest };
}
