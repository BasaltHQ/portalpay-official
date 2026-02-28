import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { request as httpsRequest } from "node:https";
import sharp from "sharp";
import { requireThirdwebAuth } from "@/lib/auth";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";
import { auditEvent } from "@/lib/audit";

// Use Node runtime to avoid undici AbortSignal issues
export const runtime = "nodejs";

function extFromMime(mime: string): string {
  if (!mime) return ".bin";
  if (mime === "image/png") return ".png";
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/jpg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/svg+xml") return ".svg";
  return ".bin";
}

import { StorageFactory } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    // Security guards: same-origin, auth, and rate limiting
    requireCsrf(req);
    const { wallet: callerWallet, roles } = await requireThirdwebAuth(req);
    try {
      rateLimitOrThrow(req, rateKey(req, "media_upload", callerWallet), 10, 60_000);
    } catch (e: any) {
      const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
      try {
        await auditEvent(req, {
          who: callerWallet,
          roles,
          what: "media_upload",
          target: callerWallet,
          correlationId,
          ok: false,
          metadata: { error: e?.message || "rate_limited", resetAt }
        });
      } catch { }
      return NextResponse.json(
        { error: e?.message || "rate_limited", resetAt, correlationId },
        { status: e?.status || 429, headers: { "x-correlation-id": correlationId, "x-ratelimit-reset": resetAt ? String(resetAt) : "" } }
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch (e: any) {
      throw new Error(`stage:form_data ${e?.message || String(e)}`);
    }
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "file field required (multipart/form-data)" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    const blob = file as File;
    const arrayBuffer = await blob.arrayBuffer();
    // Normalize to Node Buffer via Uint8Array to avoid ArrayBufferLike typing issues
    let buffer = Buffer.from(new Uint8Array(arrayBuffer));

    let mime = blob.type || "application/octet-stream";
    // Enforce size caps and compress images to WebP to optimize blob storage
    if (/^image\//i.test(mime)) {
      if (mime.toLowerCase() === "image/svg+xml") {
        return NextResponse.json(
          { error: "unsupported_content_type" },
          { status: 415, headers: { "x-correlation-id": correlationId } }
        );
      }
      // 10 MB cap for generic image uploads
      if (buffer.length > 10_000_000) {
        return NextResponse.json(
          { error: "too_large", maxBytes: 10_000_000 },
          { status: 413, headers: { "x-correlation-id": correlationId } }
        );
      }
      try {
        const res = await sharp(buffer)
          .rotate()
          .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true });
        buffer = Buffer.from(res.data);
        mime = "image/webp";
      } catch (e: any) {
        throw new Error(`stage:image_compress ${e?.message || String(e)}`);
      }
    } else {
      // Non-image uploads: still enforce a reasonable cap (10 MB)
      if (buffer.length > 10_000_000) {
        return NextResponse.json(
          { error: "too_large", maxBytes: 10_000_000 },
          { status: 413, headers: { "x-correlation-id": correlationId } }
        );
      }
    }

    const originalName = (blob as any).name || "upload";
    let ext =
      originalName && originalName.includes(".")
        ? "." + String(originalName).split(".").pop()
        : extFromMime(mime);
    if (mime === "image/webp") ext = ".webp";

    const filename = `${crypto.randomUUID()}${ext}`;
    const containerName = process.env.AZURE_BLOB_CONTAINER || "uploads";

    const storage = StorageFactory.getProvider();

    try {
      console.info(`[media/upload] ${correlationId} uploading`, {
        containerName,
        filename,
        mime,
        size: buffer.length,
      });
    } catch { }

    let url: string;
    try {
      url = await storage.upload(`${containerName}/${filename}`, buffer, mime);
    } catch (e: any) {
      throw new Error(`stage:storage_upload ${e?.message || String(e)}`);
    }

    try {
      await auditEvent(req, {
        who: callerWallet,
        roles,
        what: "media_upload",
        target: callerWallet,
        correlationId,
        ok: true,
        metadata: { filename, mime, size: buffer.length }
      });
    } catch { }
    return NextResponse.json({ url, correlationId }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    const msg = e?.message || String(e);
    try {
      console.error(`[media/upload] ${correlationId} error`, {
        name: e?.name,
        message: msg,
        stack: e?.stack,
      });
    } catch { }
    const resp: any = { error: msg, correlationId };

    // Determine appropriate HTTP status code based on error type
    let status = 500;
    if (msg === "unauthorized") {
      status = 401;
    } else if (msg === "forbidden" || msg === "bad_origin") {
      status = 403;
    } else if (msg === "rate_limited") {
      status = 429;
    } else if (msg.includes("too_large")) {
      status = 413;
    } else if (msg.includes("unsupported_content_type")) {
      status = 415;
    } else if (msg.includes("file field required")) {
      status = 400;
    }

    try {
      if (typeof msg === "string") {
        const details: any = { name: e?.name || null, stack: e?.stack || null };
        const m = /stage:([a-z_]+)/i.exec(msg);
        if (m) details.stage = m[1];
        if (msg.includes("AbortSignal")) {
          details.hint =
            "AbortSignal mismatch (undici/fetch vs AbortController). This route uses manual Azure Blob REST upload to avoid SDK paths.";
        }
        resp.details = details;
      }
    } catch { }
    try {
      await auditEvent(req, {
        who: "",
        roles: [],
        what: "media_upload",
        target: undefined,
        correlationId,
        ok: false,
        metadata: resp.details
      });
    } catch { }
    return NextResponse.json(resp, { status, headers: { "x-correlation-id": correlationId } });
  }
}
