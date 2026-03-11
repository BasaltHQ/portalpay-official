import "dotenv/config";
import { MongoClient } from "mongodb";

async function run() {
  const uri = process.env.MONGODB_CONNECTION_STRING || process.env.DB_CONNECTION_STRING;
  if (!uri) {
    console.error("No MongoDB URI found in env");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.DB_NAME || "basalt-dev";
  const db = client.db(dbName);
  const collectionName = process.env.DB_COLLECTION || "brands";
  const coll = db.collection(collectionName);
  
  const resource = await coll.findOne({ id: "brand:config", wallet: "xoinpay" });
  if (!resource) {
    console.log("Xoinpay brand config not found in DB.");
    process.exit(1);
  }

  console.log("Old Config:", JSON.stringify(resource.logos, null, 2));

  const update = {
    ...resource,
    logos: {
      ...resource.logos,
      app: "/brands/xoinpay/Xoinpay%20transparent%20logo.png",
      symbol: "/brands/xoinpay/Xoinpay%20Logo%20Icon.png",
      favicon: "/brands/xoinpay/icon.png",
    }
  };

  await coll.replaceOne({ _id: resource._id }, update);
  console.log("Successfully updated Xoinpay logos to use URL-encoded public paths.");
  
  const updated = await coll.findOne({ id: "brand:config", wallet: "xoinpay" });
  console.log("New Config:", JSON.stringify(updated.logos, null, 2));
  
  await client.close();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
