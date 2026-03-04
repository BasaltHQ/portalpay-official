// List S3 bucket contents to find APK files
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { config } = require("dotenv");
const path = require("path");

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const region = process.env.S3_REGION || "us-east-1";
const endpoint = process.env.S3_ENDPOINT || "";
const bucket = process.env.S3_BUCKET_NAME || "basaltsurge";
const accessKey = process.env.S3_ACCESS_KEY || "";
const secretKey = process.env.S3_SECRET_KEY || "";

console.log("Config:", { region, endpoint, bucket, hasKey: !!accessKey });

const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: false,
});

async function listAll() {
    let continuationToken;
    let total = 0;
    let apkRelated = [];
    do {
        const cmd = new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: 1000,
            ContinuationToken: continuationToken,
        });
        const res = await client.send(cmd);
        const contents = res.Contents || [];
        for (const obj of contents) {
            const key = obj.Key || "";
            total++;
            if (key.includes("apk") || key.includes("touchpoint") || key.includes("brands") || key.includes("portalpay") || key.includes("installer") || key.includes("signed")) {
                apkRelated.push(`  ${key}  (${obj.Size} bytes)`);
            }
        }
        continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    console.log("\n=== APK/Installer/Brand related files ===");
    if (apkRelated.length === 0) {
        console.log("  (none found)");
    } else {
        apkRelated.forEach(l => console.log(l));
    }
    console.log(`\nTotal objects in bucket '${bucket}': ${total}`);

    // Also list top-level prefixes
    const prefixCmd = new ListObjectsV2Command({ Bucket: bucket, Delimiter: "/", MaxKeys: 100 });
    const prefixRes = await client.send(prefixCmd);
    console.log("\n=== Top-level prefixes ===");
    (prefixRes.CommonPrefixes || []).forEach(p => console.log(`  ${p.Prefix}`));
    (prefixRes.Contents || []).forEach(o => console.log(`  [file] ${o.Key}`));
}

listAll().catch(e => { console.error("Error:", e.message); process.exit(1); });
