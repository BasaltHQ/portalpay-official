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
        this.bucket = process.env.S3_BUCKET_NAME || "portalpay-storage";

        // For OVH/MinIO, the public URL might be different from the endpoint or constructed differently.
        // If S3_PUBLIC_URL is set, use it. Otherwise, try to construct it.
        this.publicUrlBase = process.env.S3_PUBLIC_URL || this.endpoint;

        if (!this.endpoint) {
            throw new Error("S3_ENDPOINT is required for S3 Storage Provider");
        }

        this.client = new S3Client({
            region: this.region,
            endpoint: this.endpoint,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY || "",
                secretAccessKey: process.env.S3_SECRET_KEY || ""
            },
            forcePathStyle: true, // Often needed for MinIO/compatible providers
        });
    }

    async upload(path: string, data: Buffer | string | Blob | ArrayBuffer, contentType: string): Promise<string> {
        const key = path.startsWith("/") ? path.substring(1) : path;

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
        const key = path.startsWith("/") ? path.substring(1) : path;
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
            return `${process.env.S3_PUBLIC_URL_BASE}/${key}`;
        }

        // Default to Path Style generic URL construction
        // ensure endpoint doesn't end with slash
        const base = this.endpoint.replace(/\/$/, "");
        return `${base}/${this.bucket}/${key}`;
    }

    async delete(path: string): Promise<void> {
        const key = path.startsWith("/") ? path.substring(1) : path;
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        await this.client.send(command);
    }

    async exists(path: string): Promise<boolean> {
        const key = path.startsWith("/") ? path.substring(1) : path;
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
        const key = path.startsWith("/") ? path.substring(1) : path;
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
}
