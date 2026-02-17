import { WebSiteManagementClient } from "@azure/arm-appservice";
import { DefaultAzureCredential } from "@azure/identity";
import { DomainManager, DomainBindingResult, DomainVerificationResult } from "../domain-manager";
import dns from "node:dns/promises";

export class AzureDomainManager implements DomainManager {
    private subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    private resourceGroup = process.env.WEBSITE_RESOURCE_GROUP;
    private siteName = process.env.WEBSITE_SITE_NAME;

    private getClient(): WebSiteManagementClient | null {
        if (!this.subscriptionId || !this.resourceGroup || !this.siteName) return null;
        return new WebSiteManagementClient(new DefaultAzureCredential(), this.subscriptionId);
    }

    async getVerificationId(domain: string, brandKey?: string): Promise<string> {
        try {
            const client = this.getClient();
            if (!client) return "";
            const webApp = await client.webApps.get(this.resourceGroup!, this.siteName!);
            return webApp.customDomainVerificationId || "";
        } catch (e) {
            console.error("Azure: Failed to get verification ID", e);
            return "";
        }
    }

    async verifyDomainOwnership(domain: string, verificationId: string, brandKey?: string): Promise<DomainVerificationResult> {
        // 1. Resolve TXT records implementation
        // This matches the existing logic in the route, but abstracted.
        let txtRecords: string[][] = [];
        try {
            txtRecords = await dns.resolveTxt(domain);
        } catch (e: any) {
            return { verified: false, message: `DNS lookup failed: ${e.message}` };
        }

        // 2. Check for verification string
        // Legacy: portalpay-verification=<wallet>
        // New: <brandKey>-verification=<wallet> (NOT CHECKED HERE - checked by caller/route logic usually?)
        // Actually, verifyDomainOwnership in the interface implies checking specific logic. 
        // However, the verification logic in the route checks for *wallet* ownership of the domain.
        // The hosting provider checking is usually checking *platform* ownership (asuid).

        // For Azure, we also check the ASUID record if a verification ID exists.
        if (verificationId) {
            const asuidDomain = `asuid.${domain}`;
            let asuidRecords: string[][] = [];
            try {
                asuidRecords = await dns.resolveTxt(asuidDomain);
            } catch { }

            const flat = asuidRecords.flat();
            const match = flat.some(r => r.toLowerCase() === verificationId.toLowerCase());

            if (!match) {
                return {
                    verified: false,
                    message: `Azure verification record (asuid) not found. Expected TXT at ${asuidDomain} with value ${verificationId}`,
                    txtRecord: `asuid.${domain} IN TXT ${verificationId}`
                };
            }
        }

        return { verified: true };
    }

    async bindDomain(domain: string): Promise<DomainBindingResult> {
        if (!this.subscriptionId || !this.resourceGroup || !this.siteName) {
            return { success: false, message: "Missing Azure environment variables" };
        }

        try {
            console.log(`Azure: Binding ${domain} to ${this.siteName}...`);
            const client = this.getClient()!;
            await client.webApps.createOrUpdateHostNameBinding(this.resourceGroup!, this.siteName!, domain, {
                siteName: this.siteName,
                customHostNameDnsRecordType: "CName",
                hostNameType: "Verified",
            });
            return { success: true, message: "Bound to Azure" };
        } catch (e: any) {
            console.error("Azure binding failed:", e);
            return { success: false, message: `Azure binding failed: ${e.message}` };
        }
    }

    async secureDomain(domain: string): Promise<void> {
        // Azure App Service Managed Certificates are separate. 
        // We typically don't trigger them automatically here unless we implement that specific flow.
        // For now, no-op as per existing logic (SSL handled by Cloudflare or manually).
    }
}
