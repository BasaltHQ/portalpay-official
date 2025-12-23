import { NextRequest, NextResponse } from "next/server";

type Preview = {
  url: string;
  domain: string;
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
  favicon?: string;
  type?: string;
  oembed?: {
    type?: string;
    providerName?: string;
    authorName?: string;
    title?: string;
    thumbnailUrl?: string;
    html?: string;
  };
};

function isHttpUrl(u: URL): boolean {
  return u.protocol === "http:" || u.protocol === "https:";
}

function isLikelyUnsafeHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true;
  if (h.endsWith(".local")) return true;
  // Block simple RFC1918/Link-local IP literals
  const ipMatch = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [a, b] = [parseInt(ipMatch[1], 10), parseInt(ipMatch[2], 10)];
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
  }
  return false;
}

function absolutize(base: URL, maybe: string | undefined): string | undefined {
  try {
    if (!maybe) return undefined;
    const m = maybe.trim();
    if (!m) return undefined;
    // Already absolute
    try { const u = new URL(m); return u.href; } catch {}
    // Relative
    return new URL(m, base).href;
  } catch {
    return undefined;
  }
}

function extractMeta(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const metaRe = /<meta\s+[^>]*?(?:property|name)=["']([^"']+)["'][^>]*?content=["']([^"']+)["'][^>]*?>/gi;
    let m: RegExpExecArray | null;
    while ((m = metaRe.exec(html))) {
      const key = (m[1] || "").toLowerCase();
      const val = m[2] || "";
      if (key) out[key] = val;
    }
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) out["_title"] = titleMatch[1].trim();
    const faviconRe = /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
    const fav = faviconRe.exec(html);
    if (fav && fav[1]) out["_favicon"] = fav[1];
    const oembedRe = /<link[^>]+rel=["']alternate["'][^>]*type=["']application\/json\+oembed["'][^>]*href=["']([^"']+)["'][^>]*>/i;
    const oe = html.match(oembedRe);
    if (oe && oe[1]) out["_oembed"] = oe[1];
  } catch {}
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const raw = String(req.nextUrl.searchParams.get("url") || "").trim();
    if (!raw) return NextResponse.json({ error: "missing url" }, { status: 400 });
    let target: URL;
    try { target = new URL(raw); } catch { return NextResponse.json({ error: "invalid url" }, { status: 400 }); }
    if (!isHttpUrl(target)) return NextResponse.json({ error: "unsupported protocol" }, { status: 400 });
    if (isLikelyUnsafeHost(target.hostname)) return NextResponse.json({ error: "unsafe host" }, { status: 400 });

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 7000);
    let html = "";
    let finalUrl = target.href;
    try {
      const r = await fetch(target.href, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; cb-link-preview/1.0; +https://example.com)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      clearTimeout(to);
      finalUrl = r.url || finalUrl;
      const ct = String(r.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("text/html") && !ct.includes("xml")) {
        return NextResponse.json({ preview: { url: finalUrl, domain: new URL(finalUrl).hostname } as Preview });
      }
      html = await r.text();
    } catch {
      clearTimeout(to);
      return NextResponse.json({ preview: { url: target.href, domain: target.hostname } as Preview });
    }

    const base = new URL(finalUrl);
    const meta = extractMeta(html);
    const og = (k: string) => meta[`og:${k}`] || meta[`twitter:${k}`] || meta[k] || "";
    const title = og("title") || meta["_title"] || "";
    const description = og("description") || "";
    const siteName = og("site_name") || base.hostname;
    const imageRel = og("image") || "";
    const faviconRel = meta["_favicon"] || "/favicon.ico";
    const image = absolutize(base, imageRel);
    const favicon = absolutize(base, faviconRel);

    const resp: Preview = {
      url: base.href,
      domain: base.hostname,
      title: title || undefined,
      description: description || undefined,
      siteName: siteName || undefined,
      image: image,
      favicon: favicon,
      type: og("type") || undefined,
    };

    // Optional: oEmbed
    const oembedHref = meta["_oembed"];
    if (oembedHref) {
      try {
        const oeUrl = new URL(oembedHref, base);
        const oe = await fetch(oeUrl.href, { headers: { "User-Agent": "cb-link-preview/1.0" } }).then(r=>r.json());
        resp.oembed = {
          type: typeof oe?.type === "string" ? oe.type : undefined,
          providerName: typeof oe?.provider_name === "string" ? oe.provider_name : undefined,
          authorName: typeof oe?.author_name === "string" ? oe.author_name : undefined,
          title: typeof oe?.title === "string" ? oe.title : undefined,
          thumbnailUrl: typeof oe?.thumbnail_url === "string" ? absolutize(base, oe.thumbnail_url) : undefined,
          html: typeof oe?.html === "string" ? oe.html : undefined,
        };
        if (!resp.image && resp.oembed?.thumbnailUrl) resp.image = resp.oembed.thumbnailUrl;
        if (!resp.title && resp.oembed?.title) resp.title = resp.oembed.title;
      } catch {}
    }

    return NextResponse.json({ preview: resp });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


