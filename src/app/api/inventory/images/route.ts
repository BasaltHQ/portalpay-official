import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import crypto from "node:crypto";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { requireThirdwebAuth, assertOwnershipOrAdmin } from "@/lib/auth";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";
import { auditEvent } from "@/lib/audit";

// Azure helpers removed in favor of StorageProvider


export const runtime = "nodejs";

/**
 * Upload and optimize inventory images to Azure Blob Storage.
 * - Auth required: uses authenticated wallet for scoping
 * - Accepts either multipart files (field: "file") or remote URLs (field: "url")
 * - Produces:
 *   - High-res WebP capped at 1500x1500 (fit inside, preserve aspect, quality ~82)
 *   - Thumbnail WebP 256x256 (cover, center crop, quality ~80)
 * - Saves under blob path: {container}/{wallet}/{uuid}.webp and {uuid}_thumb.webp
 * - Returns array of { url, thumbUrl, width, height, sizeBytes }
 */
function isProbablyImage(contentType: string | null | undefined): boolean {
  const ct = String(contentType || "").toLowerCase();
  return ct.startsWith("image/");
}

function parseDataUrlBuffer(url: string): { buffer: Buffer; contentType: string | null } {
  // data:[<mediatype>][;base64],<data>
  const m = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!m) throw new Error("invalid_data_url");
  const mime = m[1] || "application/octet-stream";
  const isBase64 = !!m[2];
  const data = m[3] || "";
  const buffer = isBase64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data), "utf8");
  return { buffer, contentType: mime };
}

async function fetchUrlBuffer(url: string): Promise<{ buffer: Buffer; contentType: string | null }> {
  if (url.startsWith("data:")) {
    return parseDataUrlBuffer(url);
  }
  return await new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const isHttps = u.protocol === "https:";
      const req = (isHttps ? httpsRequest : httpRequest)(
        {
          hostname: u.hostname,
          path: u.pathname + (u.search || ""),
          protocol: u.protocol,
          port: u.port || (isHttps ? 443 : 80),
          method: "GET",
          headers: {
            Accept: "image/*,*/*",
            "User-Agent": "PayPortal/1.0",
          },
        },
        (res) => {
          const status = res.statusCode || 0;
          if (status >= 300 && status < 400 && res.headers.location) {
            try {
              const loc = res.headers.location as string;
              const nextUrl = new URL(loc, url).toString();
              // follow one redirect recursively
              fetchUrlBuffer(nextUrl).then(resolve).catch(reject);
              return;
            } catch (e) {
              reject(e);
              return;
            }
          }
          if (status < 200 || status >= 300) {
            reject(new Error(`fetch_failed_${status}`));
            return;
          }
          const ct = (res.headers["content-type"] as string | undefined) || null;
          const chunks: Buffer[] = [];
          res.on("data", (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
          res.on("end", () => {
            const buf = Buffer.concat(chunks);
            if (!isProbablyImage(ct)) {
              reject(new Error("unsupported_content_type"));
              return;
            }
            resolve({ buffer: buf, contentType: ct });
          });
        }
      );
      req.on("error", (err) => reject(err));
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function fileToBuffer(file: File): Promise<{ buffer: Buffer; contentType: string | null }> {
  const ab = await file.arrayBuffer();
  return { buffer: Buffer.from(ab), contentType: file.type || null };
}



export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    requireCsrf(req);
    const { wallet: callerWallet, roles } = await requireThirdwebAuth(req);
    try {
      rateLimitOrThrow(req, rateKey(req, "image_upload", callerWallet), 10, 60_000);
    } catch (e: any) {
      const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
      try {
        await auditEvent(req, {
          who: callerWallet,
          roles,
          what: "inventory_image_upload",
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
    const isAdmin = Array.isArray(roles) && roles.includes("admin");

    const url = new URL(req.url);
    const queryWallet = String(url.searchParams.get("wallet") || "").toLowerCase();
    let wallet = queryWallet || callerWallet;
    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
      wallet = callerWallet;
    }
    assertOwnershipOrAdmin(callerWallet, wallet, isAdmin);

    const contentType = String(req.headers.get("content-type") || "").toLowerCase();
    const inputs: Array<{ kind: "file" | "url"; file?: File; url?: string }> = [];

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      const bodyUrls: string[] = Array.isArray(body?.urls)
        ? body.urls.map((u: any) => String(u)).filter(Boolean)
        : body?.url
          ? [String(body.url)]
          : [];
      for (const u of bodyUrls) inputs.push({ kind: "url", url: u });
    } else {
      const form = await req.formData();
      const files = form.getAll("file").filter(Boolean) as File[];
      const urls = form.getAll("url").filter(Boolean).map((u) => String(u)) as string[];
      for (const f of files) inputs.push({ kind: "file", file: f });
      for (const u of urls) inputs.push({ kind: "url", url: u });
    }

    if (inputs.length === 0) {
      return NextResponse.json(
        { error: "no_inputs" },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    // Limit total processed to 3 per request
    const toProcess = inputs.slice(0, 3);

    const out: Array<{ url: string; thumbUrl: string; width: number; height: number; sizeBytes: number }> = [];
    const errors: Array<{ kind: "file" | "url"; source: string; error: string }> = [];

    const containerName = process.env.AZURE_BLOB_CONTAINER || "uploads";
    // Check storage availability
    const { storage } = await import("@/lib/azure-storage");

    try {
      console.info(`[inventory/images] ${correlationId} begin`, {
        wallet,
        inputsCount: inputs.length,
        toProcessCount: toProcess.length,
        containerName,
      });
    } catch { }

    for (const item of toProcess) {
      try {
        let buf: Buffer;
        let ct: string | null = null;
        if (item.kind === "file" && item.file) {
          const got = await fileToBuffer(item.file);
          buf = got.buffer;
          ct = got.contentType;
        } else if (item.kind === "url" && item.url) {
          const got = await fetchUrlBuffer(item.url);
          buf = got.buffer;
          ct = got.contentType;
        } else {
          continue;
        }

        // Basic content type and size validation
        if (!isProbablyImage(ct) || (String(ct || "").toLowerCase() === "image/svg+xml")) {
          throw new Error("unsupported_content_type");
        }
        if (buf.length > 10_000_000) {
          throw new Error("too_large");
        }

        const id = crypto.randomUUID().replace(/-/g, "");
        const baseName = id; // webp filenames

        // High-res: max 1500x1500, preserve aspect, optimize
        const hiRes = sharp(buf)
          .rotate()
          .resize({ width: 1500, height: 1500, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 });

        let hiBuf: Buffer;
        let hiInfo: any;
        try {
          const res = await hiRes.toBuffer({ resolveWithObject: true });
          hiBuf = res.data;
          hiInfo = res.info;
        } catch (e: any) {
          throw new Error(`stage:sharp_hi ${e?.message || String(e)}`);
        }

        // Thumbnail: square cover 256x256
        let thumbBuf: Buffer;
        try {
          thumbBuf = await sharp(buf)
            .rotate()
            .resize({ width: 256, height: 256, fit: "cover", position: "center" })
            .webp({ quality: 80 })
            .toBuffer();
        } catch (e: any) {
          throw new Error(`stage:sharp_thumb ${e?.message || String(e)}`);
        }

        const hiBlobInfo = `${containerName}/${wallet}/${baseName}.webp`;
        const thumbBlobInfo = `${containerName}/${wallet}/${baseName}_thumb.webp`;

        try {
          console.info(`[inventory/images] ${correlationId} uploading`, {
            wallet,
            hiBlobInfo,
            thumbBlobInfo,
            hiSize: hiBuf.length,
            thumbSize: thumbBuf.length,
          });
        } catch { }

        let storageHi: string;
        let storageThumb: string;

        try {
          storageHi = await storage.upload(hiBlobInfo, hiBuf, "image/webp");
        } catch (e: any) {
          throw new Error(`stage:upload_hi ${e?.message || String(e)}`);
        }
        try {
          storageThumb = await storage.upload(thumbBlobInfo, thumbBuf, "image/webp");
        } catch (e: any) {
          throw new Error(`stage:upload_thumb ${e?.message || String(e)}`);
        }

        const publicBase = process.env.AZURE_BLOB_PUBLIC_BASE_URL;
        const relHi = (() => {
          try {
            if (publicBase) {
              const u = new URL(storageHi);
              return `${publicBase}${u.pathname}`;
            }
          } catch { }
          return storageHi;
        })();
        const relThumb = (() => {
          try {
            if (publicBase) {
              const u = new URL(storageThumb);
              return `${publicBase}${u.pathname}`;
            }
          } catch { }
          return storageThumb;
        })();

        out.push({
          url: relHi,
          thumbUrl: relThumb,
          width: Number(hiInfo.width || 0),
          height: Number(hiInfo.height || 0),
          sizeBytes: Number(hiInfo.size || 0),
        });

        try {
          console.info(`[inventory/images] ${correlationId} uploaded`, {
            wallet,
            hiBlobName,
            thumbBlobName,
            publicHi: relHi,
            publicThumb: relThumb,
          });
        } catch { }
      } catch (_e: any) {
        try {
          console.error(`[inventory/images] ${correlationId} item_error`, {
            kind: item.kind,
            source: item.kind === "file" ? "file" : String(item.url || ""),
            name: _e?.name,
            message: _e?.message || String(_e),
            stack: _e?.stack,
          });
        } catch { }
        errors.push({
          kind: item.kind,
          source: item.kind === "file" ? "file" : String(item.url || ""),
          error: _e?.message || String(_e),
        });
        continue;
      }
    }

    if (out.length === 0) {
      try {
        await auditEvent(req, {
          who: callerWallet,
          roles,
          what: "inventory_image_upload",
          target: wallet,
          correlationId,
          ok: false,
          metadata: { errors }
        });
      } catch { }
      return NextResponse.json(
        { error: "processing_failed", errors, correlationId },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    try {
      await auditEvent(req, {
        who: callerWallet,
        roles,
        what: "inventory_image_upload",
        target: wallet,
        correlationId,
        ok: true,
        metadata: { count: out.length, errors }
      });
    } catch { }
    return NextResponse.json({ ok: true, images: out, errors, correlationId }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    try {
      console.error(`[inventory/images] ${correlationId} error`, {
        name: e?.name,
        message: e?.message || String(e),
        stack: e?.stack,
      });
    } catch { }
    const msg = e?.message || "failed";
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
    } else if (msg.includes("no_inputs") || msg.includes("processing_failed")) {
      status = 400;
    }

    // Include diagnostic details and stage if present
    try {
      if (typeof msg === "string") {
        const details: any = { name: e?.name || null, stack: e?.stack || null };
        const m = /stage:([a-z_]+)/i.exec(msg);
        if (m) details.stage = m[1];
        if (msg.includes("AbortSignal")) {
          details.hint = "AbortSignal mismatch (undici/fetch vs AbortController). We removed fetch for URL inputs and added stages to pinpoint source.";
        }
        resp.details = details;
      }
    } catch { }
    try {
      await auditEvent(req, {
        who: "",
        roles: [],
        what: "inventory_image_upload",
        target: undefined,
        correlationId,
        ok: false,
        metadata: resp.details
      });
    } catch { }
    return NextResponse.json(resp, { status, headers: { "x-correlation-id": correlationId } });
  }
}
