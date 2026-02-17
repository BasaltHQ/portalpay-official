import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth, assertOwnershipOrAdmin } from "@/lib/auth";
import sharp from "sharp";
import { requireCsrf, rateLimitOrThrow, rateKey } from "@/lib/security";
import { auditEvent } from "@/lib/audit";
import crypto from "node:crypto";
import { storage } from "@/lib/azure-storage"; // Uses StorageFactory

export const runtime = "nodejs";

function toBase64(u8: Uint8Array): string {
  if (typeof Buffer !== "undefined") return Buffer.from(u8).toString("base64");
  let binary = "";
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
  // @ts-ignore
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  // @ts-ignore
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const wallet = String(req.nextUrl.searchParams.get("wallet") || "").toLowerCase();
    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const container = await getContainer();

    // Prefer user's profile doc pfpUrl (blob/AFD URL) and redirect to it
    try {
      const userId = `${wallet}:user`;
      const { resource: user } = await container.item(userId, wallet).read<any>();
      const pfpUrl = String(user?.pfpUrl || "");
      if (pfpUrl) {
        return NextResponse.redirect(pfpUrl, { status: 307 });
      }
    } catch { }

    // Fallback to legacy pfp doc: if blobUrl present, redirect; else serve base64
    const id = `${wallet}:pfp`;
    let pfpData: any = undefined;
    try {
      const { resource } = await container.item(id, wallet).read<any>();
      pfpData = resource;
    } catch { }

    if (pfpData?.blobUrl) {
      return NextResponse.redirect(String(pfpData.blobUrl), { status: 307 });
    }
    if (pfpData?.data) {
      const binary = fromBase64(String(pfpData.data));
      const type = String(pfpData.contentType || "image/png");
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(binary);
          controller.close();
        },
      });
      return new NextResponse(stream, {
        headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400, transform-max-age=86400" },
      });
    }

    // No PFP found: return generated mesh gradient SVG
    const svg = generateMeshGradient(wallet);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: any) {
    // On any error, also fallback to mesh gradient to prevent 500s on images
    try {
      const wallet = String(req.nextUrl.searchParams.get("wallet") || "0x00").toLowerCase();
      const svg = generateMeshGradient(wallet);
      return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml" } });
    } catch {
      return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
    }
  }
}

function generateMeshGradient(wallet: string): string {
  // Deterministic seed from wallet
  let hash = 0;
  for (let i = 0; i < wallet.length; i++) {
    hash = wallet.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate 4 vibrant colors
  const h1 = Math.abs(hash % 360);
  const h2 = Math.abs((hash >> 3) % 360);
  const h3 = Math.abs((hash >> 6) % 360);
  const h4 = Math.abs((hash >> 9) % 360);

  const c1 = `hsl(${h1}, 85%, 65%)`;
  const c2 = `hsl(${h2}, 90%, 60%)`;
  const c3 = `hsl(${h3}, 80%, 55%)`;
  const c4 = `hsl(${h4}, 75%, 50%)`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
    </filter>
    <clipPath id="circle">
      <circle cx="128" cy="128" r="128" />
    </clipPath>
  </defs>
  <g clip-path="url(#circle)">
    <rect width="256" height="256" fill="${c1}" />
    <circle cx="0" cy="0" r="160" fill="${c2}" filter="url(#blur)" opacity="0.7" />
    <circle cx="256" cy="0" r="160" fill="${c3}" filter="url(#blur)" opacity="0.7" />
    <circle cx="256" cy="256" r="160" fill="${c4}" filter="url(#blur)" opacity="0.7" />
    <circle cx="0" cy="256" r="160" fill="${c1}" filter="url(#blur)" opacity="0.7" />
  </g>
</svg>`;
}

export async function POST(req: NextRequest) {
  try {
    const correlationId = crypto.randomUUID();
    // Accept either multipart/form-data (preferred) or JSON with { dataUrl }
    const contentType = req.headers.get("content-type") || "";
    let wallet = "";
    let fileBytes: Uint8Array | null = null;
    let mime = "image/png";
    if (/multipart\/form-data/i.test(contentType)) {
      const fd = await req.formData();
      wallet = String((fd.get("wallet") || wallet || "")).toLowerCase();
      const f = fd.get("file");
      if (f && typeof f === "object" && "arrayBuffer" in f) {
        const blob = f as File;
        mime = blob.type || mime;
        const ab = await blob.arrayBuffer();
        fileBytes = new Uint8Array(ab);
      }
    } else {
      const j = await req.json().catch(() => ({}));
      wallet = String((j.wallet || wallet || "")).toLowerCase();
      const dataUrl = String(j.dataUrl || "");
      const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || "");
      if (m) {
        mime = m[1] || mime;
        fileBytes = fromBase64(m[2] || "");
      }
    }
    // Enforce CSRF, rate limit, and ownership/admin
    requireCsrf(req);
    const { wallet: callerWallet, roles } = await requireThirdwebAuth(req);
    try {
      rateLimitOrThrow(req, rateKey(req, "pfp_upload", callerWallet), 6, 60_000);
    } catch (e: any) {
      const resetAt = typeof e?.resetAt === "number" ? e.resetAt : undefined;
      try {
        await auditEvent(req, {
          who: callerWallet,
          roles,
          what: "pfp_upload",
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
    const targetWallet = wallet || callerWallet;
    if (!/^0x[a-f0-9]{40}$/i.test(targetWallet)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    assertOwnershipOrAdmin(callerWallet, targetWallet, isAdmin);
    wallet = targetWallet;
    if (!/^0x[a-f0-9]{40}$/i.test(wallet) || !fileBytes) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    // Enforce content-type and size limits (5MB pre-compression); SVG not allowed
    if (!/^image\//i.test(mime) || mime.toLowerCase() === "image/svg+xml") {
      return NextResponse.json({ error: "unsupported_content_type" }, { status: 415 });
    }
    if (fileBytes.byteLength > 5_000_000) {
      return NextResponse.json({ error: "too_large", maxBytes: 5_000_000 }, { status: 413 });
    }

    // Optimize avatar to square WebP 256x256
    const { data: webpBuf } = await sharp(Buffer.from(fileBytes))
      .rotate()
      .resize({ width: 256, height: 256, fit: "cover", position: "center" })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });

    // Upload using Storage Provider
    const containerName = process.env.AZURE_BLOB_CONTAINER || "uploads";
    const blobName = `${wallet}/pfp_${Date.now()}.webp`;
    const fullPath = `${containerName}/${blobName}`;

    // Upload returns the storage URL
    const storageUrl = await storage.upload(fullPath, webpBuf, "image/webp");

    // Public URL (optionally rewrite to Front Door or CDN)
    const publicBase = process.env.AZURE_BLOB_PUBLIC_BASE_URL;
    const url = (() => {
      try {
        if (publicBase) {
          // If we have a public base, we try to construct it.
          // IMPORTANT: storageUrl might be S3 URL or Azure URL. 
          // If migrating, user should ensure publicBase works for both or isn't used for S3 if S3 handles its own.
          // For now, if publicBase is set, we try to swap hostname.
          const u = new URL(storageUrl);
          return `${publicBase}${u.pathname}`;
        }
      } catch { }
      return storageUrl;
    })();

    // Persist references in Cosmos: pfp doc and user profile doc
    try {
      const container = await getContainer();
      // pfp doc (legacy-compatible but without base64)
      const id = `${wallet}:pfp`;
      const pfpDoc = {
        id,
        type: "pfp",
        wallet,
        contentType: "image/webp",
        size: Number(webpBuf.byteLength || 0),
        blobUrl: url,
        updatedAt: Date.now(),
      } as any;
      await container.items.upsert(pfpDoc);

      // Also set the user's profile pfpUrl to the blob/AFD URL
      try {
        const userId = `${wallet}:user`;
        const { resource } = await container.item(userId, wallet).read<any>();
        const next = {
          ...(resource || { id: userId, type: "user", wallet, firstSeen: Date.now() }),
          pfpUrl: url,
          lastSeen: Date.now(),
        };
        await container.items.upsert(next as any);
      } catch { }
    } catch (e: any) {
      // If Cosmos unavailable, still return URL (client can use it directly)
      try {
        await auditEvent(req, {
          who: callerWallet,
          roles,
          what: "pfp_upload",
          target: wallet,
          correlationId,
          ok: true,
          metadata: { degraded: true, reason: e?.message || "cosmos_unavailable" }
        });
      } catch { }
      return NextResponse.json(
        { ok: true, degraded: true, reason: e?.message || "cosmos_unavailable", url, correlationId },
        { headers: { "x-correlation-id": correlationId } }
      );
    }

    try {
      await auditEvent(req, {
        who: callerWallet,
        roles,
        what: "pfp_upload",
        target: wallet,
        correlationId,
        ok: true
      });
    } catch { }
    return NextResponse.json({ ok: true, url, correlationId }, { headers: { "x-correlation-id": correlationId } });
  } catch (e: any) {
    const msg = e?.message || "failed";

    // Determine appropriate HTTP status code based on error type
    let status = 500;
    if (msg === "unauthorized") {
      status = 401;
    } else if (msg === "forbidden" || msg === "bad_origin") {
      status = 403;
    } else if (msg === "rate_limited") {
      status = 429;
    } else if (msg === "invalid" || msg.includes("too_large") || msg.includes("unsupported_content_type")) {
      status = 400;
    }

    return NextResponse.json({ error: msg }, { status });
  }
}
