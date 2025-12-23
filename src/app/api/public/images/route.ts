import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import crypto from "node:crypto";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";
import { auditEvent } from "@/lib/audit";

/**
 * Public image upload endpoint for unauthenticated users.
 * - Accepts multipart FormData "file" and/or "url"
 * - Optimizes images to WebP
 * - Generates a thumbnail
 * - Stores under uploads/public/{uuid}.webp and {uuid}_thumb.webp
 * - Returns: { ok: true, images: [{ url, thumbUrl, width, height, sizeBytes }], errors: [] }
 */
export const runtime = "nodejs";

// Azure Shared Key (REST) helpers to avoid AbortSignal issues in Azure environment
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

/**
 * Build a minimal ICO file containing a single 256x256 PNG image.
 * Modern ICO supports PNG-compressed images; this wraps the PNG bytes with ICO headers.
 */
function buildIcoFromPng(pngBuf: Buffer): Buffer {
  const size = pngBuf.length;
  const header = Buffer.alloc(6 + 16);
  // ICONDIR
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(1, 4); // count: 1 image
  // ICONDIRENTRY
  header.writeUInt8(0, 6); // width: 256 encoded as 0
  header.writeUInt8(0, 7); // height: 256 encoded as 0
  header.writeUInt8(0, 8); // color count
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bit count
  header.writeUInt32LE(size, 14); // bytes in resource
  header.writeUInt32LE(6 + 16, 18); // offset to image data
  return Buffer.concat([header, pngBuf]);
}

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    // Security: CSRF and IP-based rate limiting (no auth required)
    requireCsrf(req);
    try {
      rateLimitOrThrow(req, rateKey(req, "public_image_upload"), 10, 60_000);
    } catch (e: any) {
      const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
      try {
        await auditEvent(req, {
          who: "",
          roles: [],
          what: "public_image_upload",
          target: "public",
          correlationId,
          ok: false,
          metadata: { error: e?.message || "rate_limited", resetAt }
        });
      } catch {}
      return NextResponse.json(
        { error: e?.message || "rate_limited", resetAt, correlationId },
        { status: e?.status || 429, headers: { "x-correlation-id": correlationId, "x-ratelimit-reset": resetAt ? String(resetAt) : "" } }
      );
    }

    const contentType = String(req.headers.get("content-type") || "").toLowerCase();
    let requestTarget = "";
    const inputs: Array<{ kind: "file" | "url"; file?: File; url?: string; target?: string }> = [];

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      requestTarget = typeof body?.target === "string" ? String(body.target) : "";
      const bodyUrls: string[] = Array.isArray(body?.urls)
        ? body.urls.map((u: any) => String(u)).filter(Boolean)
        : body?.url
        ? [String(body.url)]
        : [];
      for (const u of bodyUrls) inputs.push({ kind: "url", url: u, target: requestTarget });
    } else {
      const form = await req.formData();
      requestTarget = String(form.get("target") || "").trim();
      const files = form.getAll("file").filter(Boolean) as File[];
      const urls = form.getAll("url").filter(Boolean).map((u) => String(u)) as string[];
      for (const f of files) inputs.push({ kind: "file", file: f, target: requestTarget });
      for (const u of urls) inputs.push({ kind: "url", url: u, target: requestTarget });
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
        const baseName = id;

        const ctLower = String(ct || "").toLowerCase();
        const isFaviconTarget = requestTarget === "logo_favicon";
        const isIco =
          ctLower.includes("image/x-icon") ||
          ctLower.includes("image/vnd.microsoft.icon") ||
          (item.kind === "url" && typeof item.url === "string" && item.url.toLowerCase().endsWith(".ico"));
        const isPngForFavicon =
          isFaviconTarget &&
          (ctLower.includes("image/png") ||
            (item.kind === "url" && typeof item.url === "string" && item.url.toLowerCase().endsWith(".png")));

        let hiBuf: Buffer;
        let thumbBuf: Buffer;
        let hiInfo: any = { width: 0, height: 0, size: buf.length };
        let hiBlobName: string;
        let thumbBlobName: string;
        let hiContentType: string;

        if (isIco) {
          // Pass-through ICO without sharp processing; upload original bytes
          hiBuf = buf;
          thumbBuf = buf; // use same bytes for thumbnail to satisfy client contracts
          hiBlobName = `public/${baseName}.ico`;
          thumbBlobName = `public/${baseName}_thumb.ico`;
          hiContentType = ctLower.includes("image/vnd.microsoft.icon") ? "image/vnd.microsoft.icon" : "image/x-icon";
        } else if (isPngForFavicon) {
          // Convert PNG favicon to ICO (256x256 PNG wrapped in ICO container)
          try {
            const resizedPng = await sharp(buf)
              .rotate()
              .resize({ width: 256, height: 256, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .png({ quality: 100 })
              .toBuffer();
            const ico = buildIcoFromPng(resizedPng);
            hiBuf = ico;
            thumbBuf = ico;
            hiBlobName = `public/${baseName}.ico`;
            thumbBlobName = `public/${baseName}_thumb.ico`;
            hiContentType = "image/x-icon";
            hiInfo = { width: 256, height: 256, size: ico.length };
          } catch (e: any) {
            throw new Error(`stage:png_to_ico ${e?.message || String(e)}`);
          }
        } else {
          // High-res: max 1500x1500, preserve aspect, optimize to webp
          const hiRes = sharp(buf)
            .rotate()
            .resize({ width: 1500, height: 1500, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 });

          try {
            const res = await hiRes.toBuffer({ resolveWithObject: true });
            hiBuf = res.data;
            hiInfo = res.info;
          } catch (e: any) {
            throw new Error(`stage:sharp_hi ${e?.message || String(e)}`);
          }

          try {
            thumbBuf = await sharp(buf)
              .rotate()
              .resize({ width: 256, height: 256, fit: "cover", position: "center" })
              .webp({ quality: 80 })
              .toBuffer();
          } catch (e: any) {
            throw new Error(`stage:sharp_thumb ${e?.message || String(e)}`);
          }

          hiBlobName = `public/${baseName}.webp`;
          thumbBlobName = `public/${baseName}_thumb.webp`;
          hiContentType = "image/webp";
        }

        const { accountName, accountKey } = getAccountCreds();

        try {
          await uploadBlobSharedKey(accountName, accountKey, containerName, hiBlobName, hiContentType, hiBuf);
        } catch (e: any) {
          throw new Error(`stage:azure_upload_hi ${e?.message || String(e)}`);
        }
        try {
          await uploadBlobSharedKey(
            accountName,
            accountKey,
            containerName,
            thumbBlobName,
            hiContentType === "image/x-icon" ? hiContentType : "image/webp",
            thumbBuf
          );
        } catch (e: any) {
          throw new Error(`stage:azure_upload_thumb ${e?.message || String(e)}`);
        }

        const storageHi = buildBlobUrl(accountName, containerName, hiBlobName);
        const storageThumb = buildBlobUrl(accountName, containerName, thumbBlobName);
        const publicBase = process.env.AZURE_BLOB_PUBLIC_BASE_URL;
        const relHi = (() => {
          try {
            if (publicBase) {
              const u = new URL(storageHi);
              return `${publicBase}${u.pathname}`;
            }
          } catch {}
          return storageHi;
        })();
        const relThumb = (() => {
          try {
            if (publicBase) {
              const u = new URL(storageThumb);
              return `${publicBase}${u.pathname}`;
            }
          } catch {}
          return storageThumb;
        })();

        out.push({
          url: relHi,
          thumbUrl: relThumb,
          width: Number(hiInfo.width || 0),
          height: Number(hiInfo.height || 0),
          sizeBytes: Number(hiInfo.size || buf.length || 0),
        });
      } catch (_e: any) {
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
          who: "",
          roles: [],
          what: "public_image_upload",
          target: "public",
          correlationId,
          ok: false,
          metadata: { errors }
        });
      } catch {}
      return NextResponse.json(
        { error: "processing_failed", errors, correlationId },
        { status: 400, headers: { "x-correlation-id": correlationId } }
      );
    }

    try {
      await auditEvent(req, {
        who: "",
        roles: [],
        what: "public_image_upload",
        target: "public",
        correlationId,
        ok: true,
        metadata: { count: out.length, errors }
      });
    } catch {}
    return NextResponse.json({ ok: true, images: out, errors, correlationId }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    try {
      console.error(`[public/images] ${correlationId} error`, {
        name: e?.name,
        message: e?.message || String(e),
        stack: e?.stack,
      });
    } catch {}
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
          details.hint = "AbortSignal mismatch (undici/fetch vs AbortController).";
        }
        resp.details = details;
      }
    } catch {}
    try {
      await auditEvent(req, {
        who: "",
        roles: [],
        what: "public_image_upload",
        target: undefined,
        correlationId,
        ok: false,
        metadata: resp.details
      });
    } catch {}
    return NextResponse.json(resp, { status, headers: { "x-correlation-id": correlationId } });
  }
}
