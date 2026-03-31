
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

import { StorageFactory } from "@/lib/storage";

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

        const form = await req.formData().catch((err) => {
            console.error("[UploadsPOST] FormData parsing failed:", err);
            return null;
        });
        if (!form) {
            return NextResponse.json({ error: "invalid_form_data", details: "Failed to parse stream (likely hit 10MB size limit)" }, { status: 400 });
        }

        const inputs = form.getAll("file").filter(Boolean) as File[];
        if (inputs.length === 0) {
            return NextResponse.json({ error: "no_files" }, { status: 400 });
        }

        // Limit to 3 files
        const toProcess = inputs.slice(0, 3);
        const containerName = process.env.AZURE_BLOB_CONTAINER || "uploads";
        const storage = StorageFactory.getProvider();

        const out: any[] = [];
        const errors: any[] = [];

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

                const finalUrl = await storage.upload(`${containerName}/${blobName}`, buffer, contentType);

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
