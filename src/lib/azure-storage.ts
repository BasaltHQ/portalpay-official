import crypto from "node:crypto";
import { request as httpsRequest } from "node:https";

function parseAzureConnString(conn?: string): { accountName?: string; accountKey?: string } {
    try {
        const s = String(conn || "");
        const parts = s.split(";").map((p) => p.trim());
        const out: Record<string, string> = {};
        for (const p of parts) {
            const [k, v] = p.split("=");
            if (k && v) out[k] = v;
        }
        return { accountName: out["AccountName"], accountKey: out["AccountKey"] };
    } catch {
        return {};
    }
}

export function getAccountCreds(): { accountName: string; accountKey: string } {
    const fromConn = parseAzureConnString(process.env.AZURE_BLOB_CONNECTION_STRING);
    const accountName = process.env.AZURE_BLOB_ACCOUNT_NAME || fromConn.accountName || "";
    const accountKey = process.env.AZURE_BLOB_ACCOUNT_KEY || fromConn.accountKey || "";
    if (!accountName || !accountKey) {
        console.warn("Azure Storage Creds missing");
        return { accountName: "", accountKey: "" };
    }
    return { accountName, accountKey };
}

export async function deleteBlobSharedKey(blobUrl?: string): Promise<boolean> {
    if (!blobUrl) return false;
    try {
        const { accountName, accountKey } = getAccountCreds();
        if (!accountName || !accountKey) return false;

        let url: URL;
        try {
            url = new URL(blobUrl);
        } catch { return false; }

        // Blob URL: https://<account>.blob.core.windows.net/<container>/<blob>
        // Pathname: /<container>/<blob>
        const path = url.pathname;
        if (!path || path === "/") return false;

        // Remove leading slash for logic
        const relativePath = path.substring(1);
        const parts = relativePath.split('/');
        const container = parts[0];
        const blobName = parts.slice(1).join('/');

        if (!container || !blobName) return false;

        const xmsVersion = "2021-12-02";
        const xmsDate = new Date().toUTCString();

        const canonHeaders =
            `x-ms-date:${xmsDate}\n` +
            `x-ms-version:${xmsVersion}\n`;

        // Resource for signature: /accountname/container/blobname
        const canonResource = `/${accountName}/${container}/${blobName}`;

        const stringToSign =
            `DELETE\n` +
            `\n` +
            `\n` +
            `\n` +
            `\n` +
            `\n` +
            `\n` +
            `\n` +
            `\n` +
            `\n` +
            `\n` +
            `\n` +
            `${canonHeaders}` +
            `${canonResource}`;

        const key = Buffer.from(accountKey, "base64");
        const sig = crypto.createHmac("sha256", key).update(stringToSign, "utf8").digest("base64");
        const auth = `SharedKey ${accountName}:${sig}`;

        return new Promise<boolean>((resolve) => {
            const options = {
                hostname: `${accountName}.blob.core.windows.net`,
                path: `/${container}/${blobName}`,
                method: "DELETE",
                headers: {
                    "x-ms-date": xmsDate,
                    "x-ms-version": xmsVersion,
                    Authorization: auth,
                },
            };
            const req = httpsRequest(options, (res) => {
                const code = res.statusCode || 0;
                if (code >= 200 && code < 300) {
                    resolve(true);
                } else if (code === 404) {
                    resolve(true);
                } else {
                    console.error("Delete blob failed:", code, res.statusMessage);
                    resolve(false);
                }
            });
            req.on("error", (e) => {
                console.error("Delete blob network error:", e);
                resolve(false);
            });
            req.end();
        });

    } catch (e) {
        console.error("Exception deleting blob:", e);
        return false;
    }
}
