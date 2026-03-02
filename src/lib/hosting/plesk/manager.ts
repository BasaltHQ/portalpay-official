import { DomainManager, DomainBindingResult, DomainVerificationResult } from "../domain-manager";
import { PleskClient } from "./client";
import dns from "node:dns/promises";

export class PleskDomainManager implements DomainManager {
    private client: PleskClient;
    private mainDomain: string;

    constructor() {
        this.client = new PleskClient();
        this.mainDomain = process.env.PLESK_MAIN_DOMAIN || "portalpay.io";
    }

    async getVerificationId(domain: string, brandKey: string = "portalpay"): Promise<string> {
        // Plesk doesn't have an Azure-style "customDomainVerificationId" (asuid).
        // The TXT verification is wallet-based: `<brandKey>-verification=<wallet>`
        // which is handled by the route logic. Return empty to signal "no platform-specific ID".
        return "";
    }

    async verifyDomainOwnership(domain: string, verificationId: string, brandKey?: string): Promise<DomainVerificationResult> {
        // For Plesk, verify that the domain's CNAME points to our main domain.
        // This mirrors Azure's approach where CNAME → *.azurewebsites.net is required.
        // Here, CNAME → PLESK_MAIN_DOMAIN (e.g. surge.basalthq.com) is required.

        const expectedTarget = this.mainDomain.toLowerCase().replace(/\.$/, "");

        try {
            // Try CNAME resolution first (preferred for subdomains like shop.example.com)
            try {
                const cnameRecords = await dns.resolveCname(domain);
                if (cnameRecords.length > 0) {
                    const cname = cnameRecords[0].toLowerCase().replace(/\.$/, "");
                    if (cname === expectedTarget || cname.endsWith(`.${expectedTarget}`)) {
                        return { verified: true };
                    }
                    return {
                        verified: false,
                        message: `Domain CNAME points to "${cname}" but expected "${expectedTarget}". Update your CNAME record.`
                    };
                }
            } catch {
                // CNAME lookup failed — might be an apex domain using A-record
            }

            // Fallback: check A-record resolution (apex domains can't use CNAME)
            // If the domain resolves via A-record to any IP, accept it as verified.
            // The user is responsible for pointing it to the correct server.
            try {
                const aRecords = await dns.resolve4(domain);
                if (aRecords.length > 0) {
                    // A-record exists — accept. We can't easily know our own public IP
                    // from inside the process, so we trust the user configured it right.
                    return { verified: true };
                }
            } catch {
                // A-record also failed
            }

            return {
                verified: false,
                message: `Domain does not have a CNAME pointing to "${expectedTarget}". Add a CNAME record: ${domain} → ${expectedTarget}`
            };

        } catch (e: any) {
            return {
                verified: false,
                message: `DNS lookup failed: ${e.message}. Ensure your domain has a CNAME pointing to ${expectedTarget}.`
            };
        }
    }

    async bindDomain(domain: string): Promise<DomainBindingResult> {
        if (!this.mainDomain) {
            return { success: false, message: "PLESK_MAIN_DOMAIN not configured" };
        }

        // Create a domain alias in Plesk so the server accepts requests for this hostname
        const createXml = `
      <site-alias>
        <create>
          <site-name>${this.mainDomain}</site-name>
          <name>${domain}</name>
          <pref>
            <web>1</web>
            <mail>0</mail>
            <seo-redirect>0</seo-redirect>
          </pref>
        </create>
      </site-alias>
    `;

        try {
            console.log(`Plesk: Creating alias ${domain} for ${this.mainDomain}...`);
            const res = await this.client.execute(createXml);
            const status = this.client.parseStatus(res);

            if (!status.ok) {
                if (status.message && status.message.includes("already exists")) {
                    console.log("Plesk: Alias already exists.");
                } else {
                    return { success: false, message: `Plesk Error: ${status.message}` };
                }
            }

            // Auto-secure with Let's Encrypt
            await this.secureDomain(domain);

            return { success: true, message: "Domain bound and SSL requested" };

        } catch (e: any) {
            console.error("Plesk bind failed:", e);
            return { success: false, message: e.message };
        }
    }

    async secureDomain(domain: string): Promise<void> {
        // Trigger Let's Encrypt via Plesk CLI.
        // This works because the app runs directly on the VPS (not in a container).
        try {
            const { exec } = require("child_process");
            const cmd = `plesk bin extension --exec letsencrypt cli.php -d ${domain}`;
            console.log(`Plesk: Executing SSL command: ${cmd}`);

            await new Promise<void>((resolve) => {
                exec(cmd, { timeout: 60_000 }, (error: any, stdout: any, stderr: any) => {
                    if (error) {
                        console.error("Plesk SSL Error:", stderr || error.message);
                    } else {
                        console.log("Plesk SSL Success:", stdout);
                    }
                    resolve();
                });
            });
        } catch (e) {
            console.error("Plesk SSL setup failed:", e);
        }
    }
}
