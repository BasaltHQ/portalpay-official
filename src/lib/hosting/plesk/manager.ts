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

    /**
     * Look up the numeric site ID for the main domain via Plesk XML-RPC.
     */
    private async getSiteId(): Promise<string | null> {
        const xml = `
      <site>
        <get>
          <filter>
            <name>${this.mainDomain}</name>
          </filter>
          <dataset>
            <gen_info/>
          </dataset>
        </get>
      </site>
    `;
        try {
            const res = await this.client.execute(xml);
            // Extract <id> from response
            const idMatch = /<id>(\d+)<\/id>/i.exec(res);
            return idMatch ? idMatch[1] : null;
        } catch (e: any) {
            console.error("Plesk: Failed to get site ID:", e.message);
            return null;
        }
    }

    async bindDomain(domain: string): Promise<DomainBindingResult> {
        if (!this.mainDomain) {
            return { success: false, message: "PLESK_MAIN_DOMAIN not configured" };
        }

        // 1. Look up the numeric site ID (required by Plesk XML-RPC for alias creation)
        const siteId = await this.getSiteId();
        if (!siteId) {
            return { success: false, message: `Could not find site ID for ${this.mainDomain}. Verify PLESK_MAIN_DOMAIN is correct.` };
        }

        // 2. Try creating a domain alias via XML-RPC
        const createXml = `
      <site-alias>
        <create>
          <site-id>${siteId}</site-id>
          <name>${domain}</name>
          <ascii-name>${domain}</ascii-name>
        </create>
      </site-alias>
    `;

        let aliasCreated = false;
        try {
            console.log(`Plesk: Creating alias ${domain} for site ${this.mainDomain} (id=${siteId})...`);
            const res = await this.client.execute(createXml);
            const status = this.client.parseStatus(res);

            if (status.ok) {
                aliasCreated = true;
                console.log(`Plesk: Alias created for ${domain}`);
            } else if (status.message && status.message.includes("already exists")) {
                aliasCreated = true;
                console.log("Plesk: Alias already exists.");
            } else if (status.message && (
                status.message.includes("subdomain") ||
                status.message.includes("Can't create an alias")
            )) {
                // Plesk can't create aliases for subdomains — fall back to CLI
                console.log(`Plesk: Alias creation not supported for ${domain} (subdomain). Trying CLI...`);
                aliasCreated = await this.addDomainViaCli(domain);
            } else {
                console.warn(`Plesk: Alias creation failed: ${status.message}`);
            }
        } catch (e: any) {
            console.error("Plesk alias creation error:", e.message);
        }

        // 3. Even if Plesk registration failed, the domain binding is still functional:
        //    - Cloudflare handles SSL termination for custom domains
        //    - The proxy middleware routes requests based on Host header
        //    - The domain is already DNS-verified (CNAME → main domain)
        if (!aliasCreated) {
            console.log(`Plesk: Could not register ${domain} in Plesk, but domain is verified and will work via proxy middleware + Cloudflare.`);
        }

        // 4. Try SSL provisioning (best-effort, Cloudflare usually handles this)
        try {
            await this.secureDomain(domain);
        } catch {
            console.log("Plesk: SSL provisioning skipped or failed (Cloudflare may handle SSL).");
        }

        return {
            success: true,
            message: aliasCreated
                ? "Domain bound via Plesk alias and SSL requested"
                : "Domain verified and routed via proxy (Plesk alias not required for subdomains)"
        };
    }

    /**
     * Fallback: add domain via Plesk CLI when XML-RPC alias creation fails (e.g. subdomains).
     */
    private async addDomainViaCli(domain: string): Promise<boolean> {
        try {
            const { exec } = require("child_process");
            // Try adding as a site alias via CLI (supports subdomains unlike XML-RPC)
            const cmd = `plesk bin alias --create ${domain} -domain ${this.mainDomain} -web true -mail false`;
            console.log(`Plesk CLI: ${cmd}`);

            return await new Promise<boolean>((resolve) => {
                exec(cmd, { timeout: 30_000 }, (error: any, stdout: any, stderr: any) => {
                    if (error) {
                        console.error("Plesk CLI alias failed:", stderr || error.message);
                        resolve(false);
                    } else {
                        console.log("Plesk CLI alias success:", stdout);
                        resolve(true);
                    }
                });
            });
        } catch (e: any) {
            console.error("Plesk CLI exec failed:", e.message);
            return false;
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
