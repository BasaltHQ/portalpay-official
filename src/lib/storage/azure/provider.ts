import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { StorageProvider } from "../provider";

export class AzureStorageProvider implements StorageProvider {
    private connectionString: string;
    private defaultContainer: string;

    constructor() {
        this.connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING as string;
        // Default fallback if path doesn't specify container (should match existing app default)
        this.defaultContainer = process.env.PP_APK_CONTAINER || "uploads";
    }

    private getClient(containerName: string): ContainerClient {
        if (!this.connectionString) throw new Error("AZURE_STORAGE_CONNECTION_STRING is missing");
        const blobServiceClient = BlobServiceClient.fromConnectionString(this.connectionString);
        return blobServiceClient.getContainerClient(containerName);
    }

    private parsePath(path: string): { container: string; blob: string } {
        // Expects "container/blob/path..." or just "blob/path..." (using default)
        // To be safe and explicit, calls should include container.
        // If path starts with slash, remove it.
        const clean = path.startsWith("/") ? path.substring(1) : path;
        const parts = clean.split("/");

        // If only one part, assumes it's in default container.
        if (parts.length === 1) {
            return { container: this.defaultContainer, blob: parts[0] };
        }

        // First part is container
        return { container: parts[0], blob: parts.slice(1).join("/") };
    }

    async upload(path: string, data: Buffer | string | Blob | ArrayBuffer, contentType: string): Promise<string> {
        const { container, blob } = this.parsePath(path);
        const containerClient = this.getClient(container);
        const blockBlobClient = containerClient.getBlockBlobClient(blob);

        // Ensure container exists
        await containerClient.createIfNotExists({ access: 'blob' });

        let buffer: Buffer;
        if (Buffer.isBuffer(data)) {
            buffer = data;
        } else if (typeof data === 'string') {
            buffer = Buffer.from(data);
        } else if (data instanceof ArrayBuffer) {
            buffer = Buffer.from(data);
        } else {
            // Blob case - simplistic handling for Node env
            buffer = Buffer.from(await (data as any).arrayBuffer());
        }

        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: contentType }
        });

        return blockBlobClient.url;
    }

    async getUrl(path: string): Promise<string> {
        const { container, blob } = this.parsePath(path);
        const containerClient = this.getClient(container);
        const blockBlobClient = containerClient.getBlockBlobClient(blob);
        return blockBlobClient.url;
    }

    async delete(path: string): Promise<void> {
        const { container, blob } = this.parsePath(path);
        const containerClient = this.getClient(container);
        const blockBlobClient = containerClient.getBlockBlobClient(blob);
        await blockBlobClient.deleteIfExists();
    }

    async exists(path: string): Promise<boolean> {
        const { container, blob } = this.parsePath(path);
        const containerClient = this.getClient(container);
        const blockBlobClient = containerClient.getBlockBlobClient(blob);
        return await blockBlobClient.exists();
    }

    async download(path: string): Promise<Buffer> {
        const { container, blob } = this.parsePath(path);
        const containerClient = this.getClient(container);
        const blockBlobClient = containerClient.getBlockBlobClient(blob);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);

        if (!downloadBlockBlobResponse.readableStreamBody) {
            throw new Error("Failed to download blob");
        }

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of downloadBlockBlobResponse.readableStreamBody) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
}
