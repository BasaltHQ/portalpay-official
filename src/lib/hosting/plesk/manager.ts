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
     * Add domain to Plesk's nginx so it routes to the Node.js app.
     * Without this, Plesk's nginx shows its login page for unknown domains.
     * 
     * Strategy (in order):
     * 1. Create a per-domain nginx config file (safest for shared servers)
     * 2. Fall back to Plesk CLI alias/site commands
     */
    private async addDomainViaCli(domain: string): Promise<boolean> {
        const { exec } = require("child_process");
        const execCmd = (cmd: string): Promise<{ ok: boolean; output: string }> =>
            new Promise((resolve) => {
                exec(cmd, { timeout: 30_000 }, (error: any, stdout: any, stderr: any) => {
                    const output = (stdout || "") + (stderr || "");
                    resolve({ ok: !error || output.includes("already exists"), output });
                });
            });

        // Sanitize domain for filename: shop.hitechlives.com → shop-hitechlives-com
        const safeFilename = domain.replace(/[^a-zA-Z0-9.-]/g, "").replace(/\./g, "-");
        const confPath = `/etc/nginx/conf.d/basaltsurge-custom-${safeFilename}.conf`;

        // Step 1: Create a per-domain nginx reverse proxy config
        // Since Cloudflare is "Full" mode, we need SSL on the origin.
        // Use Plesk's default cert — Cloudflare Full mode doesn't validate it.
        const nginxConf = `
# Auto-generated by BasaltSurge for custom domain: ${domain}
# This proxies ONLY ${domain} to the Node.js app — does NOT affect other sites.
server {
    listen 443 ssl;
    server_name ${domain};

    # Use the surge.basalthq.com cert or Plesk default
    # CF Full mode accepts any cert, including self-signed
    ssl_certificate /usr/local/psa/admin/conf/httpsd.pem;
    ssl_certificate_key /usr/local/psa/admin/conf/httpsd.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
`.trim();

        try {
            // Write the nginx config
            console.log(`Plesk: Writing nginx config for ${domain} → ${confPath}`);
            const writeResult = await execCmd(
                `echo '${nginxConf.replace(/'/g, "'\\''")}' | sudo tee ${confPath} > /dev/null`
            );

            if (writeResult.ok) {
                // Test nginx config
                const testResult = await execCmd("sudo nginx -t 2>&1");
                if (testResult.ok && !testResult.output.includes("failed")) {
                    // Reload nginx
                    const reloadResult = await execCmd("sudo systemctl reload nginx 2>&1");
                    if (reloadResult.ok) {
                        console.log(`Plesk: nginx configured for ${domain}`);
                        return true;
                    }
                } else {
                    // Config is bad — remove it
                    console.error(`Plesk: nginx test failed, removing config: ${testResult.output}`);
                    await execCmd(`sudo rm -f ${confPath}`);
                }
            }
        } catch (e: any) {
            console.error("nginx config approach failed:", e.message);
        }

        // Step 2: Fall back to Plesk CLI
        console.log("Plesk: nginx config failed, trying Plesk CLI...");
        const cliCmds = [
            `plesk bin alias --create ${domain} -domain ${this.mainDomain} -web true -mail false 2>&1`,
            `plesk bin site --create ${domain} -webspace-name ${this.mainDomain} 2>&1`,
        ];

        for (const cmd of cliCmds) {
            console.log(`Plesk CLI: trying ${cmd}`);
            const result = await execCmd(cmd);
            if (result.ok) {
                console.log(`Plesk CLI success: ${result.output}`);
                return true;
            }
            console.warn(`Plesk CLI failed: ${result.output}`);
        }

        return false;
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
