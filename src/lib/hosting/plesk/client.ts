import https from "node:https";
import { URL } from "node:url";

export type PleskApiResponse = {
    status: 'ok' | 'error';
    code?: number;
    stdout?: string;
    stderr?: string;
    result?: any;
};

/**
 * Minimal Plesk XML-RPC Client
 * Supports self-signed certs (common on localhost Plesk panels).
 */
export class PleskClient {
    private apiUrl: string;
    private apiKey?: string;
    private login?: string;
    private password?: string;

    constructor() {
        const base = process.env.PLESK_API_URL || "https://localhost:8443";
        // Ensure we always hit the XML-RPC agent endpoint
        this.apiUrl = base.replace(/\/+$/, "") + "/enterprise/control/agent.php";
        this.apiKey = process.env.PLESK_API_KEY;
        this.login = process.env.PLESK_LOGIN;
        this.password = process.env.PLESK_PASSWORD;
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "text/xml",
            "HTTP_PRETTY_PRINT": "TRUE",
        };

        if (this.apiKey) {
            headers["KEY"] = this.apiKey;
        } else if (this.login && this.password) {
            headers["HTTP_AUTH_LOGIN"] = this.login;
            headers["HTTP_AUTH_PASSWD"] = this.password;
        }

        return headers;
    }

    /**
     * Execute an XML-RPC packet against the Plesk API.
     * Uses Node.js https module directly to support self-signed certs on localhost.
     */
    async execute(packet: string): Promise<string> {
        const xml = `<?xml version="1.0" encoding="UTF-8"?><packet>${packet}</packet>`;
        const parsed = new URL(this.apiUrl);

        const headers = this.getHeaders();
        headers["Content-Length"] = String(Buffer.byteLength(xml, "utf-8"));

        return new Promise<string>((resolve, reject) => {
            const options: https.RequestOptions = {
                hostname: parsed.hostname,
                port: parsed.port || 8443,
                path: parsed.pathname + parsed.search,
                method: "POST",
                headers,
                // Accept self-signed certs (Plesk default on localhost)
                rejectUnauthorized: false,
                timeout: 15_000,
            };

            const req = https.request(options, (res) => {
                const chunks: Buffer[] = [];
                res.on("data", (chunk: Buffer) => chunks.push(chunk));
                res.on("end", () => {
                    const body = Buffer.concat(chunks).toString("utf-8");
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new Error(`Plesk API HTTP Error: ${res.statusCode} ${res.statusMessage}`));
                    } else {
                        resolve(body);
                    }
                });
            });

            req.on("error", (err) => reject(new Error(`Plesk API request failed: ${err.message}`)));
            req.on("timeout", () => { req.destroy(); reject(new Error("Plesk API request timed out")); });
            req.write(xml);
            req.end();
        });
    }

    /**
     * Helper to parse simple status from XML response.
     * Uses regex extraction for lightweight parsing (no XML lib dependency).
     */
    parseStatus(xml: string): { ok: boolean; message?: string; id?: string } {
        const statusMatch = /<status>(.*?)<\/status>/i.exec(xml);
        const status = statusMatch ? statusMatch[1].toLowerCase() : "error";

        const errTextMatch = /<errtext>(.*?)<\/errtext>/i.exec(xml);
        const errText = errTextMatch ? errTextMatch[1] : undefined;

        const idMatch = /<id>(\d+)<\/id>/i.exec(xml);

        return {
            ok: status === "ok",
            message: errText,
            id: idMatch ? idMatch[1] : undefined
        };
    }
}
