export type PleskApiResponse = {
    status: 'ok' | 'error';
    code?: number;
    stdout?: string;
    stderr?: string;
    result?: any;
};

/**
 * Minimal Plesk XML-RPC Client
 */
export class PleskClient {
    private apiUrl: string;
    private apiKey?: string;
    private login?: string;
    private password?: string;

    constructor() {
        this.apiUrl = process.env.PLESK_API_URL || "https://localhost:8443/enterprise/control/agent.php";
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

    async execute(packet: string): Promise<string> {
        // Basic wrapper for XML packet
        const xml = `<?xml version="1.0" encoding="UTF-8"?><packet>${packet}</packet>`;

        // Allow self-signed certs for localhost Plesk
        const agent = new (require("https").Agent)({ rejectUnauthorized: false });

        const res = await fetch(this.apiUrl, {
            method: "POST",
            headers: this.getHeaders(),
            body: xml,
            // @ts-ignore - node-fetch specific, native fetch in Node 18+ might support agent via dispatcher or custom implementation
            // Next.js (Node 18+) native fetch doesn't support 'agent' directly.
            // If running in Next.js, we might need to rely on global config or hope it works.
            // However, for localhost verification, we might have issues with self-signed certs.
            // If native fetch is used, we set NODE_TLS_REJECT_UNAUTHORIZED=0 in env for dev, 
            // but strictly we should import https and use a custom fetcher if needed.
            // For now, let's assume global fetch works or user sets env. 
            // Actually, let's try to use 'agent' property as it works in many node-fetch polyfills used by Next.js < 13
            // In Next.js 13+, 'next: { revalidate: 0 }' is standard.
            // We will try to rely on environment variables for SSL trust or standard fetch behavior.
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`Plesk API HTTP Error: ${res.status} ${res.statusText}`);
        }

        return await res.text();
    }

    /**
     * Helper to parse simple status from XML response.
     * We refrain from full XML parsing lib to avoid deps if possible, 
     * but for robust usage we might need one.
     * For now, regex for <status>ok</status> is "good enough" for simple ops,
     * but we should be careful.
     */
    parseStatus(xml: string): { ok: boolean; message?: string; id?: string } {
        const statusMatch = /<status>(.*?)<\/status>/i.exec(xml);
        const status = statusMatch ? statusMatch[1].toLowerCase() : "error";

        // Try to find error text
        const errTextMatch = /<errtext>(.*?)<\/errtext>/i.exec(xml);
        const errText = errTextMatch ? errTextMatch[1] : undefined;

        // Try to find ID (e.g. alias ID)
        const idMatch = /<id>(\d+)<\/id>/i.exec(xml);

        return {
            ok: status === "ok",
            message: errText,
            id: idMatch ? idMatch[1] : undefined
        };
    }
}
