import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getContainer } from "@/lib/cosmos";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";

export const runtime = "nodejs";


function absolutize(publicBase: string | undefined, storageUrl: string): string {
  try {
    if (publicBase) {
      const u = new URL(storageUrl);
      return `${publicBase}${u.pathname}`;
    }
  } catch { }
  return storageUrl;
}

async function fetchUrlBuffer(url: string): Promise<{ buffer: Buffer; contentType: string | null }> {
  if (url.startsWith("data:")) {
    // data:[<mediatype>][;base64],<data>
    const m = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
    if (!m) throw new Error("invalid_data_url");
    const mime = m[1] || "application/octet-stream";
    const isBase64 = !!m[2];
    const data = m[3] || "";
    const buffer = isBase64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data), "utf8");
    return { buffer, contentType: mime };
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

function isValidWallet(raw: string | null | undefined): string | null {
  const s = String(raw || "").toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(s) ? s : null;
}

async function makeIcon(buf: Buffer, size: number, shape: "round" | "square"): Promise<Buffer> {
  // Base square crop to PNG
  let icon = await sharp(buf)
    .rotate()
    .resize({ width: size, height: size, fit: "cover", position: "center" })
    .png()
    .toBuffer();

  if (shape === "round") {
    // Apply circular alpha mask via SVG and dest-in blend
    const svg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`;
    icon = await sharp(icon)
      .composite([{ input: Buffer.from(svg), blend: "dest-in" as any }])
      .png()
      .toBuffer();
  }
  return icon;
}

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  try {
    const contentType = req.headers.get("content-type") || "";
    const publicBase = process.env.AZURE_BLOB_PUBLIC_BASE_URL;
    const containerName = process.env.AZURE_BLOB_CONTAINER || "uploads";
    const walletHeader = isValidWallet(req.headers.get("x-wallet"));
    const url = new URL(req.url);
    const walletQuery = isValidWallet(url.searchParams.get("wallet"));
    const wallet = walletHeader || walletQuery || null;

    let logoBuf: Buffer | null = null;
    let shape: "round" | "square" = "square";

    if (/multipart\/form-data/i.test(contentType)) {
      const fd = await req.formData();
      const f = fd.get("file");
      const shp = String(fd.get("shape") || "").toLowerCase();
      if (shp === "round") shape = "round"; else shape = "square";
      if (f && typeof f === "object" && "arrayBuffer" in f) {
        const blob = f as File;
        const ab = await blob.arrayBuffer();
        logoBuf = Buffer.from(ab);
      }
      if (!logoBuf) {
        const srcUrl = String(fd.get("url") || "");
        if (srcUrl) {
          const got = await fetchUrlBuffer(srcUrl);
          logoBuf = got.buffer;
        }
      }
    } else {
      const j = await req.json().catch(() => ({}));
      const shp = String(j.shape || "").toLowerCase();
      if (shp === "round") shape = "round"; else shape = "square";
      const srcUrl = String(j.url || j.logoUrl || "");
      if (srcUrl) {
        const got = await fetchUrlBuffer(srcUrl);
        logoBuf = got.buffer;
      }
    }

    if (!logoBuf) {
      return NextResponse.json({ error: "logo_required" }, { status: 400 });
    }

    // Use Storage Provider
    const { storage } = await import("@/lib/azure-storage");


    // Helper to construct path: "uploads/favicons/..."
    const makePath = (name: string) => `${containerName}/${name}`;

    const basePath = wallet ? `favicons/${wallet}` : `favicons/global`;
    const ts = Date.now();

    // Generate icons
    const fav16 = await makeIcon(logoBuf, 16, shape);
    const fav32 = await makeIcon(logoBuf, 32, shape);
    const apple = await makeIcon(logoBuf, 180, shape); // Apple touch icon commonly 180x180

    // Upload PNGs
    const path16 = makePath(`${basePath}/favicon-16x16_${ts}.png`);
    const path32 = makePath(`${basePath}/favicon-32x32_${ts}.png`);
    const pathApple = makePath(`${basePath}/apple-touch-icon_${ts}.png`);

    const [url16Raw, url32Raw, urlAppleRaw] = await Promise.all([
      storage.upload(path16, fav16, "image/png"),
      storage.upload(path32, fav32, "image/png"),
      storage.upload(pathApple, apple, "image/png")
    ]);

    // Build single-image ICO (32x32) embedding PNG data per ICO spec
    function buildIcoFromPng(png: Buffer): Buffer {
      // ICONDIR (6 bytes): reserved(2)=0, type(2)=1, count(2)=1
      const header = Buffer.alloc(6);
      header.writeUInt16LE(0, 0);
      header.writeUInt16LE(1, 2);
      header.writeUInt16LE(1, 4);

      // ICONDIRENTRY (16 bytes)
      const entry = Buffer.alloc(16);
      entry.writeUInt8(32, 0); // width
      entry.writeUInt8(32, 1); // height
      entry.writeUInt8(0, 2); // color count
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(0, 4); // planes (0 for PNG)
      entry.writeUInt16LE(32, 6); // bit count (informational)
      entry.writeUInt32LE(png.length, 8); // bytes in resource
      entry.writeUInt32LE(6 + 16, 12); // image offset starts after header+entry

      return Buffer.concat([header, entry, png]);
    }

    const icoBuf = buildIcoFromPng(fav32);
    const pathIco = makePath(`${basePath}/favicon_${ts}.ico`);
    const urlIcoRaw = await storage.upload(pathIco, icoBuf, "image/x-icon");

    const url16 = absolutize(publicBase, url16Raw);
    const url32 = absolutize(publicBase, url32Raw);
    const urlApple = absolutize(publicBase, urlAppleRaw);
    const urlIco = absolutize(publicBase, urlIcoRaw);

    // Optionally persist brandFaviconUrl in site config if wallet provided
    let saved = false;
    try {
      if (wallet) {
        const c = await getContainer();
        const id = "site:config";
        const { resource } = await c.item(id, wallet).read<any>();
        const prev = resource || {};
        const next = {
          ...(prev || {}),
          id,
          wallet,
          type: "site_config",
          theme: {
            ...(prev?.theme || {}),
            brandFaviconUrl: url32,
            appleTouchIconUrl: urlApple,
          },
          updatedAt: Date.now(),
        };
        await c.items.upsert(next as any);
        saved = true;
      }
    } catch {
      // ignore, still return generated URLs
    }

    return NextResponse.json(
      {
        ok: true,
        favicon16: url16,
        favicon32: url32,
        faviconIco: urlIco,
        appleTouchIcon: urlApple,
        savedToConfig: saved,
      },
      { headers: { "x-correlation-id": correlationId } }
    );
  } catch (e: any) {
    const msg = e?.message || "failed";
    try {
      console.error(`[media/favicon] ${correlationId} error`, {
        name: e?.name,
        message: msg,
        stack: e?.stack,
      });
    } catch { }
    const resp: any = { error: msg, correlationId };
    try {
      if (typeof msg === "string") {
        const details: any = { name: e?.name || null, stack: e?.stack || null };
        const m = /stage:([a-z_]+)/i.exec(msg);
        if (m) details.stage = m[1];
        if (msg.includes("AbortSignal")) {
          details.hint = "AbortSignal mismatch (undici/fetch vs AbortController). Favicon route now uses node http/https for URL fetch.";
        }
        resp.details = details;
      }
    } catch { }
    return NextResponse.json(resp, { status: 500, headers: { "x-correlation-id": correlationId } });
  }
}
