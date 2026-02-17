import { StorageProvider } from "./provider";
import { AzureStorageProvider } from "./azure/provider";
import { S3StorageProvider } from "./s3/provider";

export * from "./provider";

export class StorageFactory {
    static getProvider(): StorageProvider {
        const providerType = (process.env.STORAGE_PROVIDER || "azure").toLowerCase();

        if (providerType === "s3" || providerType === "ovh" || providerType === "minio") {
            return new S3StorageProvider();
        }

        return new AzureStorageProvider();
    }
}
