import { StorageProvider } from "./provider";
import { HybridStorageProvider } from "./hybrid/provider";

export * from "./provider";

export class StorageFactory {
    static getProvider(): StorageProvider {
        // The HybridStorageProvider internally configures both S3 and Azure,
        // prioritizing S3 and falling back to Azure if S3 fails or is unconfigured.
        return new HybridStorageProvider();
    }
}
