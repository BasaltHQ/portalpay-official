
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { request as httpsRequest } from "node:https";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";
import { auditEvent } from "@/lib/audit";
import { requireThirdwebAuth } from "@/lib/auth";

/**
 * Generic file upload endpoint for authenticated users (Writer's Workshop, etc.)
 * - Accepts multipart FormData "file" (single or multiple)
 * - Stores under uploads/files/{uuid}.{ext}
 * - Returns: { ok: true, files: [{ url, name, sizeBytes, contentType }], errors: [] }
 */
export const runtime = "nodejs";

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

function getAccountCreds(): { accountName: string; accountKey: string } {
    const fromConn = parseAzureConnString(process.env.AZURE_BLOB_CONNECTION_STRING);
    const accountName = process.env.AZURE_BLOB_ACCOUNT_NAME || fromConn.accountName || "";
    const accountKey = process.env.AZURE_BLOB_ACCOUNT_KEY || fromConn.accountKey || "";
    if (!accountName || !accountKey) {
        throw new Error("azure_creds_missing");
    }
    return { accountName, accountKey };
}

function buildBlobUrl(accountName: string, container: string, blobName: string): string {
    return `https://${accountName}.blob.core.windows.net/${container}/${blobName}`;
}

async function uploadBlobSharedKey(
    accountName: string,
    accountKey: string,
    container: string,
    blobName: string,
    contentType: string,
    body: Buffer
): Promise<void> {
    const xmsVersion = "2021-12-02";
    const xmsDate = new Date().toUTCString();
    const contentLength = body.length;

    const canonHeaders =
        `x-ms-blob-type:BlockBlob\n` +
        `x-ms-date:${xmsDate}\n` +
        `x-ms-version:${xmsVersion}\n`;

    const canonResource = `/${accountName}/${container}/${blobName}`;

    const stringToSign =
        `PUT\n` +
        `\n` +
        `\n` +
        `${contentLength}\n` +
        `\n` +
        `${contentType}\n` +
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

    await new Promise<void>((resolve, reject) => {
        const options = {
            hostname: `${accountName}.blob.core.windows.net`,
            path: `/${container}/${blobName}`,
            method: "PUT",
            headers: {
                "x-ms-blob-type": "BlockBlob",
                "x-ms-date": xmsDate,
                "x-ms-version": xmsVersion,
                "Content-Type": contentType,
                "Content-Length": contentLength,
                Authorization: auth,
            },
        };
        const req = httpsRequest(options, (res) => {
            const status = res.statusCode || 0;
            if (status >= 200 && status < 300) {
                resolve();
            } else {
                reject(new Error(`azure_put_failed_${status}`));
            }
        });
        req.on("error", (err) => reject(err));
        req.write(body);
        req.end();
    });
}

function getExtension(mime: string, originalName: string): string {
    if (mime === "application/pdf") return "pdf";
    if (mime === "application/epub+zip") return "epub";
    if (mime === "text/plain") return "txt";
    const parts = originalName.split(".");
    if (parts.length > 1) return parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "");
    return "bin";
}

async function fileToBuffer(file: File): Promise<{ buffer: Buffer; contentType: string; name: string }> {
    const ab = await file.arrayBuffer();
    return { buffer: Buffer.from(ab), contentType: file.type || "application/octet-stream", name: file.name };
}

export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        // Authenticated users only for generic file uploads
        await requireThirdwebAuth(req);
        requireCsrf(req);

        // Rate limit
        try {
            rateLimitOrThrow(req, rateKey(req, "file_upload"), 20, 60_000);
        } catch (e: any) {
            return NextResponse.json({ error: "rate_limited" }, { status: 429 });
        }

        const form = await req.formData().catch(() => null);
        if (!form) {
            return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
        }

        const inputs = form.getAll("file").filter(Boolean) as File[];
        if (inputs.length === 0) {
            return NextResponse.json({ error: "no_files" }, { status: 400 });
        }

        // Limit to 3 files
        const toProcess = inputs.slice(0, 3);
        const containerName = process.env.AZURE_BLOB_CONTAINER || "uploads";
        const { accountName, accountKey } = getAccountCreds();

        const out: Array<{ url: string; name: string; sizeBytes: number; contentType: string }> = [];
        const errors: Array<{ name: string; error: string }> = [];

        for (const file of toProcess) {
            try {
                const { buffer, contentType, name } = await fileToBuffer(file);

                // Size Check (max 50MB for books)
                if (buffer.length > 50 * 1024 * 1024) {
                    throw new Error("file_too_large_max_50mb");
                }

                const id = crypto.randomUUID().replace(/-/g, "");
                const ext = getExtension(contentType, name);
                const blobName = `files/${id}.${ext}`;

                await uploadBlobSharedKey(accountName, accountKey, containerName, blobName, contentType, buffer);

                const storageUrl = buildBlobUrl(accountName, containerName, blobName);
                const publicBase = process.env.AZURE_BLOB_PUBLIC_BASE_URL;
                let finalUrl = storageUrl;

                if (publicBase) {
                    try {
                        const u = new URL(storageUrl);
                        finalUrl = `${publicBase}${u.pathname}`;
                    } catch { }
                }

                out.push({
                    url: finalUrl,
                    name: name,
                    sizeBytes: buffer.length,
                    contentType
                });

            } catch (e: any) {
                errors.push({ name: file.name, error: e.message || String(e) });
            }
        }

        return NextResponse.json({ ok: true, files: out, errors });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
    }
}
