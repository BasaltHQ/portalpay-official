import { DomainManager, DomainBindingResult, DomainVerificationResult } from "../domain-manager";
import dns from "node:dns/promises";

/**
 * Manages custom domains via Cloudflare for SaaS (Custom Hostnames).
 *
 * Flow:
 * 1. Merchant CNAMEs their domain to surge.basalthq.com
 * 2. We verify the CNAME via DNS lookup
 * 3. We call Cloudflare API to add the custom hostname
 * 4. Cloudflare provisions SSL and routes traffic to the fallback origin
 * 5. Plesk/nginx sees surge.basalthq.com → routes to Node.js app
 * 6. Proxy middleware handles routing based on the actual Host header
 */
export class CloudflareDomainManager implements DomainManager {
    private apiToken: string;
    private zoneId: string;
    private cnameTarget: string;

    constructor() {
        this.apiToken = process.env.CLOUDFLARE_API_TOKEN || "";
        this.zoneId = process.env.CLOUDFLARE_ZONE_ID || "";
        this.cnameTarget = process.env.PLESK_MAIN_DOMAIN || "surge.basalthq.com";
    }

    async getVerificationId(domain: string, brandKey: string = "basaltsurge"): Promise<string> {
        // No platform-specific verification ID. Merchants CNAME to surge.basalthq.com.
        return "";
    }

    async verifyDomainOwnership(domain: string, verificationId: string, brandKey?: string): Promise<DomainVerificationResult> {
        const expectedTarget = this.cnameTarget.toLowerCase().replace(/\.$/, "");

        try {
            // Try CNAME resolution first (preferred for subdomains)
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
            try {
                const aRecords = await dns.resolve4(domain);
                if (aRecords.length > 0) {
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
        // Debug: trace what the VPS is actually reading from env vars
        const tokenLen = this.apiToken?.length || 0;
        const tokenPreview = tokenLen > 6
            ? `${this.apiToken.substring(0, 3)}...${this.apiToken.substring(tokenLen - 3)} (len=${tokenLen})`
            : `(empty or too short, len=${tokenLen})`;
        console.log(`Cloudflare bindDomain: token=${tokenPreview}, zoneId=${this.zoneId?.substring(0, 8)}..., domain=${domain}`);

        if (!this.apiToken || !this.zoneId) {
            return { success: false, message: "CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID not configured" };
        }

        try {
            // Check if hostname already exists
            const findRes = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/custom_hostnames?hostname=${encodeURIComponent(domain)}`,
                {
                    headers: {
                        "Authorization": `Bearer ${this.apiToken}`,
                    },
                }
            );
            const findData = await findRes.json();
            console.log(`Cloudflare findHostname response: status=${findRes.status}, success=${findData.success}, errors=${JSON.stringify(findData.errors)}`);

            if (!findData.success) {
                // If even the LIST call fails, return full error details
                const fullErr = JSON.stringify(findData.errors || findData);
                return { success: false, message: `Cloudflare Error: ${fullErr}` };
            }

            if (findData.result?.length > 0) {
                const existing = findData.result[0];
                console.log(`Cloudflare: Custom hostname ${domain} already exists (id=${existing.id}, status=${existing.status})`);
                return {
                    success: true,
                    message: `Custom hostname already registered (status: ${existing.status})`
                };
            }

            // Create the custom hostname
            console.log(`Cloudflare: Creating custom hostname ${domain}...`);
            const res = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/custom_hostnames`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.apiToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        hostname: domain,
                        ssl: {
                            method: "http",
                            type: "dv",
                            settings: {
                                min_tls_version: "1.2",
                            },
                        },
                    }),
                }
            );

            const data = await res.json();

            if (!data.success) {
                const fullErr = JSON.stringify(data.errors || data);
                console.error(`Cloudflare: Failed to create custom hostname: ${fullErr}`);
                return { success: false, message: `Cloudflare Error: ${fullErr}` };
            }

            const hostnameId = data.result?.id;
            const sslStatus = data.result?.ssl?.status || "pending";
            console.log(`Cloudflare: Custom hostname created (id=${hostnameId}, ssl=${sslStatus})`);

            return {
                success: true,
                message: `Domain registered with Cloudflare (SSL: ${sslStatus}). SSL will be provisioned automatically.`
            };
        } catch (e: any) {
            console.error("Cloudflare bind failed:", e);
            return { success: false, message: `Cloudflare API error: ${e.message}` };
        }
    }

    async secureDomain(domain: string): Promise<void> {
        // SSL is handled automatically by Cloudflare — nothing to do here.
        console.log(`Cloudflare: SSL for ${domain} is managed automatically by Cloudflare for SaaS.`);
    }

    /**
     * Remove a custom hostname from Cloudflare (for domain unbinding).
     */
    async unbindDomain(domain: string): Promise<DomainBindingResult> {
        if (!this.apiToken || !this.zoneId) {
            return { success: false, message: "CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID not configured" };
        }

        try {
            const existing = await this.findCustomHostname(domain);
            if (!existing) {
                return { success: true, message: "Custom hostname not found (already removed)" };
            }

            const res = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/custom_hostnames/${existing.id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${this.apiToken}`,
                    },
                }
            );

            const data = await res.json();
            if (!data.success) {
                const errors = data.errors?.map((e: any) => e.message).join("; ") || "Unknown error";
                return { success: false, message: `Cloudflare Error: ${errors}` };
            }

            console.log(`Cloudflare: Custom hostname ${domain} removed`);
            return { success: true, message: "Custom hostname removed from Cloudflare" };
        } catch (e: any) {
            console.error("Cloudflare unbind failed:", e);
            return { success: false, message: `Cloudflare API error: ${e.message}` };
        }
    }

    /**
     * Get the status of a custom hostname (SSL, ownership verification, etc.)
     */
    async getHostnameStatus(domain: string): Promise<{ active: boolean; sslStatus: string; status: string } | null> {
        const existing = await this.findCustomHostname(domain);
        if (!existing) return null;

        return {
            active: existing.status === "active",
            sslStatus: existing.ssl?.status || "unknown",
            status: existing.status,
        };
    }

    /**
     * Find an existing custom hostname by domain name.
     */
    private async findCustomHostname(domain: string): Promise<any | null> {
        try {
            const res = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/custom_hostnames?hostname=${encodeURIComponent(domain)}`,
                {
                    headers: {
                        "Authorization": `Bearer ${this.apiToken}`,
                    },
                }
            );

            const data = await res.json();
            if (data.success && data.result?.length > 0) {
                return data.result[0];
            }
            return null;
        } catch (e: any) {
            console.error(`Cloudflare: Error searching for hostname ${domain}:`, e.message);
            return null;
        }
    }
}
