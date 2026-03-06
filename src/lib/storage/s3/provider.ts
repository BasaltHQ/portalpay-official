import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
// We don't use lib-storage for simple uploads to keep deps low, unless needed for multipart.
// Standard PutObject is usually fine for files < 5GB.
import { StorageProvider } from "../provider";

export class S3StorageProvider implements StorageProvider {
    private client: S3Client;
    private bucket: string;
    private endpoint: string;
    private region: string;
    private publicUrlBase: string;

    constructor() {
        this.region = process.env.S3_REGION || "us-east-1";
        this.endpoint = process.env.S3_ENDPOINT || "";
        this.bucket = process.env.S3_BUCKET_NAME || "basaltsurge";

        // For OVH/MinIO, the public URL might be different from the endpoint or constructed differently.
        // If S3_PUBLIC_URL is set, use it. Otherwise, try to construct it.
        this.publicUrlBase = process.env.S3_PUBLIC_URL || this.endpoint;

        if (!this.endpoint) {
            throw new Error("S3_ENDPOINT is required for S3 Storage Provider");
        }

        // The user explicitly requested to use the configured region from environment variables.
        this.client = new S3Client({
            region: this.region,
            // When using a custom endpoint, some AWS SDK versions ignore `forcePathStyle: false`
            // if the endpoint doesn't look like an AWS endpoint.
            // By putting the bucket in the endpoint or leaving it standard, we can handle it.
            // For OVH Cloud: `https://s3.us-west-or.io.cloud.ovh.us`
            // If we want virtual hosted URLs naturally from the SDK, we just provide the base endpoint.
            endpoint: this.endpoint,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY || "",
                secretAccessKey: process.env.S3_SECRET_KEY || ""
            },
            forcePathStyle: false, // Attempt to use Virtual-Hosted Style
        });
    }

    /**
     * Helper to clean up the path for S3.
     * We map the Azure container name directly to an S3 top-level folder
     * to maintain the same exact folder structure.
     */
    private toKey(path: string): string {
        return path.startsWith("/") ? path.substring(1) : path;
    }

    async upload(path: string, data: Buffer | string | Blob | ArrayBuffer, contentType: string): Promise<string> {
        const key = this.toKey(path);

        let body: Buffer;
        if (Buffer.isBuffer(data)) {
            body = data;
        } else if (typeof data === 'string') {
            body = Buffer.from(data);
        } else if (data instanceof ArrayBuffer) {
            body = Buffer.from(data);
        } else {
            body = Buffer.from(await (data as any).arrayBuffer());
        }

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
            ACL: 'public-read' // Assumes we want public access for these assets
        });

        await this.client.send(command);

        return this.getUrl(key);
    }

    async getUrl(path: string): Promise<string> {
        const key = this.toKey(path);
        // Construct public URL
        // If endpoint is https://s3.us-east-1.perf.cloud.ovh.us
        // And bucket is 'mybucket'
        // Virtual hosted style: https://mybucket.s3.us-east-1.perf.cloud.ovh.us/key
        // Path style: https://s3.us-east-1.perf.cloud.ovh.us/mybucket/key

        // We configured forcePathStyle: true, so the client treats it as path style.
        // However, for public access, it depends on how the user configured the bucket/DNS.
        // We will stick to Path Style for generic compatibility unless a dedicated S3_PUBLIC_URL_BASE is provided.

        if (process.env.S3_PUBLIC_URL_BASE) {
            // e.g. https://cdn.mydomain.com
            const cleanBase = process.env.S3_PUBLIC_URL_BASE.replace(/\/$/, "");
            return `${cleanBase}/${key}`;
        }

        // Use Virtual-Hosted Style URL construction
        // format: https://[bucket].[endpoint-hostname]/[key]
        const endpointUrl = new URL(this.endpoint);
        return `${endpointUrl.protocol}//${this.bucket}.${endpointUrl.hostname}/${key}`;
    }

    async delete(path: string): Promise<void> {
        const key = this.toKey(path);
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        await this.client.send(command);
    }

    async exists(path: string): Promise<boolean> {
        const key = this.toKey(path);
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key
            });
            await this.client.send(command);
            return true;
        } catch (e: any) {
            if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw e;
        }
    }

    async download(path: string): Promise<Buffer> {
        const key = this.toKey(path);
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });

        const response = await this.client.send(command);

        if (!response.Body) {
            throw new Error("Empty body in S3 response");
        }

        // response.Body is a stream in Node.js
        const stream = response.Body as any; // ReadableStream or IncomingMessage
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }

    async list(pathPrefix: string = ""): Promise<string[]> {
        const key = this.toKey(pathPrefix);

        // Dynamic import to keep init fast
        const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");

        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: key
        });

        const response = await this.client.send(command);
        const items: string[] = [];

        if (response.Contents) {
            for (const obj of response.Contents) {
                if (obj.Key) items.push(obj.Key);
            }
        }
        return items;
    }

    async getSignedUrl(path: string, expiresInSeconds: number = 3600): Promise<string> {
        const key = this.toKey(path);
        const { GetObjectCommand } = await import("@aws-sdk/client-s3");
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });

        // S3 Client must be initialized with region/cred for this to work
        let url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
        return url;
    }
}
