import { StorageProvider } from "../provider";
import { AzureStorageProvider } from "../azure/provider";
import { S3StorageProvider } from "../s3/provider";
import { debug } from "@/lib/logger";

export class HybridStorageProvider implements StorageProvider {
    private s3: S3StorageProvider | null = null;
    private azure: AzureStorageProvider | null = null;

    constructor() {
        try {
            this.s3 = new S3StorageProvider();
            debug("HybridStorage", "S3 provider initialized");
        } catch (e: any) {
            console.warn("[HybridStorage] S3 provider failed to initialize:", e.message);
        }

        try {
            this.azure = new AzureStorageProvider();
            debug("HybridStorage", "Azure provider initialized");
        } catch (e: any) {
            console.warn("[HybridStorage] Azure provider failed to initialize:", e.message);
        }

        if (!this.s3 && !this.azure) {
            throw new Error("[HybridStorage] Both S3 and Azure providers failed to initialize.");
        }
    }

    async upload(path: string, data: Buffer | string | Blob | ArrayBuffer, contentType: string): Promise<string> {
        let s3Error: Error | null = null;
        if (this.s3) {
            try {
                return await this.s3.upload(path, data, contentType);
            } catch (e: any) {
                console.warn(`[HybridStorage] S3 upload failed for ${path}, falling back to Azure:`, e.message);
                s3Error = e;
            }
        }

        if (this.azure) {
            try {
                return await this.azure.upload(path, data, contentType);
            } catch (e: any) {
                console.error(`[HybridStorage] Azure upload also failed for ${path}:`, e.message);
                throw e; // Both failed or S3 was unconfigured and Azure failed
            }
        }

        throw s3Error || new Error("[HybridStorage] No storage providers available for upload.");
    }

    async getUrl(path: string): Promise<string> {
        if (this.s3 && await this.s3.exists(path)) {
            return this.s3.getUrl(path);
        }
        if (this.azure && await this.azure.exists(path)) {
            return this.azure.getUrl(path);
        }
        // Default to returning S3 URL if neither exists (or we can't tell),
        // or Azure if S3 isn't configured at all.
        if (this.s3) return this.s3.getUrl(path);
        if (this.azure) return this.azure.getUrl(path);
        throw new Error("[HybridStorage] No storage providers available.");
    }

    async delete(path: string): Promise<void> {
        // Attempt to delete from both just in case
        let deleted = false;
        if (this.s3) {
            try {
                await this.s3.delete(path);
                deleted = true;
            } catch (e) {
                debug("HybridStorage", `S3 delete failed or skipped for ${path}`);
            }
        }
        if (this.azure) {
            try {
                await this.azure.delete(path);
                deleted = true;
            } catch (e) {
                debug("HybridStorage", `Azure delete failed or skipped for ${path}`);
            }
        }
        if (!deleted) throw new Error(`[HybridStorage] Failed to delete ${path} from any provider`);
    }

    async exists(path: string): Promise<boolean> {
        if (this.s3 && await this.s3.exists(path)) return true;
        if (this.azure && await this.azure.exists(path)) return true;
        return false;
    }

    async download(path: string): Promise<Buffer> {
        if (this.s3 && await this.s3.exists(path)) {
            return this.s3.download(path);
        }
        if (this.azure && await this.azure.exists(path)) {
            return this.azure.download(path);
        }
        throw new Error(`[HybridStorage] File ${path} not found in any provider for download.`);
    }

    async list(pathPrefix?: string): Promise<string[]> {
        // You might want to union the lists, but for now we'll prioritize S3 and then append Azure
        const items = new Set<string>();
        if (this.s3) {
            try {
                const s3Items = await this.s3.list(pathPrefix);
                s3Items.forEach(i => items.add(i));
            } catch (e) { }
        }
        if (this.azure) {
            try {
                const azureItems = await this.azure.list(pathPrefix);
                azureItems.forEach(i => items.add(i));
            } catch (e) { }
        }
        return Array.from(items);
    }

    async getSignedUrl(path: string, expiresInSeconds?: number): Promise<string> {
        if (this.s3 && await this.s3.exists(path)) {
            return this.s3.getSignedUrl(path, expiresInSeconds);
        }
        if (this.azure && await this.azure.exists(path)) {
            return this.azure.getSignedUrl(path, expiresInSeconds);
        }
        // Default to returning S3 URL if neither exists yet (pre-signing for upload)
        if (this.s3) return this.s3.getSignedUrl(path, expiresInSeconds);
        if (this.azure) return this.azure.getSignedUrl(path, expiresInSeconds);
        throw new Error("[HybridStorage] No storage providers available.");
    }
}
