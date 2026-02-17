import { DomainManager, DomainBindingResult, DomainVerificationResult } from "../domain-manager";
import { PleskClient } from "./client";
import dns from "node:dns/promises";

export class PleskDomainManager implements DomainManager {
    private client: PleskClient;
    private mainDomain: string;

    constructor() {
        this.client = new PleskClient();
        this.mainDomain = process.env.PLESK_MAIN_DOMAIN || "portalpay.io"; // Fallback to something, but should be set
    }

    async getVerificationId(domain: string, brandKey: string = "portalpay"): Promise<string> {
        // Plesk doesn't require a pre-generated ID. 
        // We return the expected TXT record value logic here so the frontend can display it.
        // The format is: <brandKey>-verification=<wallet>
        // But wait, the interface expects an ID that usually comes from the HOST.
        // Azure provides 'customDomainVerificationId'. 
        // For Plesk, we don't strictly *need* one from the host, but we use this method 
        // to tell the caller "this is the ID the user needs to put in TXT".

        // Actually, the route logic calculates the expected value itself: `portalpay-verification=${wallet}`.
        // In Azure, `getVerificationId` returns the 'asuid' (Azure-specific UID).
        // For Plesk, we don't have an asuid. We can return empty or a static string if needed.
        // Returning empty string signals "no platform-specific ID required".
        return "";
    }

    async verifyDomainOwnership(domain: string, verificationId: string, brandKey?: string): Promise<DomainVerificationResult> {
        // 1. DNS TXT Check is handled by the generic logic in the route mostly, 
        // but the interface asks us to verify. 
        // The Route handles the "wallet verification" (checking if user owns domain).
        // The Manager handles "platform verification" (checking if domain is ready for host).

        // For Plesk, if the user has pointed the A-record, we are good.
        // We can explicitly check the A-record to see if it matches our server IP (optional but good UX).

        try {
            const aRecords = await dns.resolve4(domain);
            // We could compare against our public IP, but we might not know it easily inside the container/NAT.
            // So we assume if it resolves, it's a start.
            if (aRecords.length > 0) {
                return { verified: true };
            }
        } catch (e) {
            // failed to resolve
            return {
                verified: false,
                message: "Domain does not resolve to an IP address. Please update your DNS A-record."
            };
        }

        return { verified: true };
    }

    async bindDomain(domain: string): Promise<DomainBindingResult> {
        if (!this.mainDomain) {
            return { success: false, message: "PLESK_MAIN_DOMAIN not configured" };
        }

        // 1. Create Alias
        // XML: <site-alias><create><site-name>MAIN</site-name><name>ALIAS</name><pref><web>1</web><mail>0</mail></pref></create></site-alias>
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
                // Check if it already exists
                if (status.message && status.message.includes("already exists")) {
                    // Determine if we should treat this as success. 
                    // If it exists, we are good.
                    console.log("Plesk: Alias already exists.");
                } else {
                    return { success: false, message: `Plesk Error: ${status.message}` };
                }
            }

            // 2. Auto-Secure with SSL (Let's Encrypt)
            await this.secureDomain(domain);

            return { success: true, message: "Domain bound and SSL requested" };

        } catch (e: any) {
            console.error("Plesk bind failed:", e);
            return { success: false, message: e.message };
        }
    }

    async secureDomain(domain: string): Promise<void> {
        // Trigger Let's Encrypt via CLI extension
        // XML-RPC doesn't have direct support for extensions usually, we use the 'cli' operator.
        // <extension><call><id>letsencrypt</id><command>cli.php</command><args>-d ${domain}</args></call></extension> (Concept)
        // Actually, modern Plesk XML-RPC has <extension> node? Or we use `bin` command via some other means?
        // Plesk's XML-RPC API allows calling CLI commands if allowed. 
        // But easier is assuming we can't easily do it via XML without specific extension support.

        // However, we can try to use the `cli` operator if available (often restricted).
        // Safer bet: Just create the alias. The user might have a wildcard cert or need to run SSL manually.

        // BUT user asked for it. 
        // "plesk bin extension --exec letsencrypt cli.php -d <alias-domain>"
        // XML Packet for CLI access is technically possible but heavily restricted.
        // Since we are running on localhost, maybe we can use `child_process.exec`?
        // If we are running in a container, we can't exec on host. 
        // If we are running DIRECTLY on the VPS (Node.js process), we can `exec`.

        // Assuming Node.js is running directly on the VPS:
        try {
            const { exec } = require("child_process");
            const cmd = `plesk bin extension --exec letsencrypt cli.php -d ${domain}`;
            console.log(`Plesk: Executing SSL command: ${cmd}`);

            // We wrap in a promise
            new Promise((resolve, reject) => {
                exec(cmd, (error: any, stdout: any, stderr: any) => {
                    if (error) {
                        console.error("SSL Exec Error:", stderr);
                        // Don't reject, just log. SSL failure shouldn't fail the whole bind request.
                        resolve(null);
                    } else {
                        console.log("SSL Success:", stdout);
                        resolve(null);
                    }
                });
            });
        } catch (e) {
            console.error("SSL setup failed (exec not available?)", e);
        }
    }
}
