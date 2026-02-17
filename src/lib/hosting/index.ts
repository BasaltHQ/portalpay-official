import { DomainManager } from "./domain-manager";
import { AzureDomainManager } from "./azure/manager";
import { PleskDomainManager } from "./plesk/manager";

export * from "./domain-manager";

export class DomainManagerFactory {
    static getManager(): DomainManager {
        const provider = (process.env.HOSTING_PROVIDER || "azure").toLowerCase();

        if (provider === "plesk") {
            return new PleskDomainManager();
        }

        return new AzureDomainManager();
    }
}
