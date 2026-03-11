import "dotenv/config";
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

async function setCors() {
  const s3 = new S3Client({
    region: process.env.S3_REGION || "us-west-or",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    // Force path style for OVH
    forcePathStyle: true,
  });

  const bucket = process.env.S3_BUCKET_NAME!;

  try {
    console.log(`Setting CORS for bucket: ${bucket} at ${process.env.S3_ENDPOINT}`);
    const res = await s3.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD"],
            AllowedOrigins: [
              "http://localhost:3000",
              "http://localhost:3001",
              "https://xpaypass.com",
              "https://www.xpaypass.com",
              "https://portalpay.io",
              "https://www.portalpay.io",
              "https://basalthq.com",
              "https://www.basalthq.com",
              "https://terminal.portalpay.io"
            ],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000
          }
        ]
      }
    }));
    console.log("CORS Configuration applied successfully:", res);
  } catch (error) {
    console.error("Failed to set CORS:", error);
  }
}

setCors();
