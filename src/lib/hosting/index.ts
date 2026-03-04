import { DomainManager } from "./domain-manager";
import { AzureDomainManager } from "./azure/manager";
import { PleskDomainManager } from "./plesk/manager";
import { CloudflareDomainManager } from "./cloudflare/manager";

export * from "./domain-manager";

export class DomainManagerFactory {
    static getManager(): DomainManager {
        // Prefer Cloudflare for SaaS when configured (handles custom domains via Cloudflare API)
        if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID) {
            return new CloudflareDomainManager();
        }

        const provider = (process.env.HOSTING_PROVIDER || "azure").toLowerCase();

        if (provider === "plesk") {
            return new PleskDomainManager();
        }

        return new AzureDomainManager();
    }
}
