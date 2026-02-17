import { StorageFactory } from "./storage";

// Re-export types
export * from "./storage";

// Legacy exports for backward compatibility (where possible)
export function getAccountCreds(): { accountName: string; accountKey: string } {
    // This is specific to Azure. return empty or try to parse generic envs if needed.
    // Ideally, consumers should stop using this.
    return {
        accountName: process.env.AZURE_BLOB_ACCOUNT_NAME || "",
        accountKey: process.env.AZURE_BLOB_ACCOUNT_KEY || ""
    };
}

/**
 * @deprecated Use StorageProvider.delete() instead
 */
export async function deleteBlobSharedKey(blobUrl?: string): Promise<boolean> {
    if (!blobUrl) return false;
    // Map usage to StorageProvider
    const provider = StorageFactory.getProvider();

    // Attempt to extract path from URL
    try {
        const url = new URL(blobUrl);
        const path = url.pathname; // /container/blob
        if (path) {
            // StorageProvider expects just container/blob, possibly without leading slash depending on impl.
            // But existing implementations handle leading slash.
            await provider.delete(path);
            return true;
        }
    } catch (e) {
        console.error("Delete shim failed:", e);
    }
    return false;
}

// Global Storage Provider Instance
export const storage = StorageFactory.getProvider();
