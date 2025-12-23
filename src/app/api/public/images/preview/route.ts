import { NextRequest, NextResponse } from "next/server";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import crypto from "node:crypto";
import { rateLimitOrThrow, rateKey } from "@/lib/security";

export const runtime = "nodejs";

/**
 * GET /api/public/images/preview?url={imageUrl}
 * Server-side fetch of a remote image for client-side preview without persisting to storage.
 * - Avoids CORS issues by proxying through same-origin
 * - Enforces size and content-type checks
 * - Returns raw image bytes with appropriate Content-Type
 */
function isProbablyImage(contentType: string | null | undefined): boolean {
  const ct = String(contentType || "").toLowerCase();
  return ct.startsWith("image/");
}

async function fetchUrlBuffer(url: string): Promise<{ buffer: Buffer; contentType: string | null }> {
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
            "User-Agent": "PayPortal/PreviewProxy/1.0",
          },
        },
        (res) => {
          const status = res.statusCode || 0;
          if (status >= 300 && status < 400 && res.headers.location) {
            try {
              const loc = res.headers.location as string;
              const nextUrl = new URL(loc, url).toString();
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
          let total = 0;
          res.on("data", (d) => {
            const b = Buffer.isBuffer(d) ? d : Buffer.from(d);
            total += b.length;
            // Enforce 10MB cap
            if (total > 10_000_000) {
              try { res.destroy(); } catch {}
              reject(new Error("too_large"));
              return;
            }
            chunks.push(b);
          });
          res.on("end", () => {
            if (!isProbablyImage(ct)) {
              reject(new Error("unsupported_content_type"));
              return;
            }
            const buf = Buffer.concat(chunks);
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

export async function GET(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    // Basic rate limiting by IP
    try {
      rateLimitOrThrow(req, rateKey(req, "public_image_preview"), 20, 60_000);
    } catch (e: any) {
      const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
      return new NextResponse(JSON.stringify({ error: e?.message || "rate_limited", resetAt, correlationId }), {
        status: e?.status || 429,
        headers: {
          "Content-Type": "application/json",
          "x-correlation-id": correlationId,
          "x-ratelimit-reset": resetAt ? String(resetAt) : "",
        },
      });
    }

    const url = String(req.nextUrl.searchParams.get("url") || "").trim();
    if (!url) {
      return new NextResponse(JSON.stringify({ error: "url_required", correlationId }), {
        status: 400,
        headers: { "Content-Type": "application/json", "x-correlation-id": correlationId },
      });
    }
    const { buffer, contentType } = await fetchUrlBuffer(url);
    // Use Uint8Array to satisfy BodyInit typings for NextResponse
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Length": String(buffer.length),
        "x-correlation-id": correlationId,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    const msg = e?.message || "failed";
    let status = 500;
    if (msg.includes("too_large")) status = 413;
    else if (msg.includes("unsupported_content_type")) status = 415;
    else if (msg.startsWith("fetch_failed_")) status = 502;
    return new NextResponse(JSON.stringify({ error: msg, correlationId }), {
      status,
      headers: { "Content-Type": "application/json", "x-correlation-id": correlationId },
    });
  }
}
