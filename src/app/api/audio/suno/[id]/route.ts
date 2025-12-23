import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

function sanitizeId(id: string): string {
  return (id || "").replace(/[^A-Za-z0-9_-]/g, "");
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const p = (ctx.params as any)?.then ? await (ctx.params as Promise<{ id: string }>) : (ctx.params as { id: string });
  const id = sanitizeId(p?.id || "");
  if (!id) return new Response("Bad Request", { status: 400 });
  const range = req.headers.get('range') || undefined;

  const src = `https://suno.com/api/audio/${id}.mp3`;
  const res = await fetch(src, {
    headers: range ? { Range: range } : undefined,
  });

  const status = res.status;
  const headers = new Headers();
  const ct = res.headers.get('content-type') || 'audio/mpeg';
  const cr = res.headers.get('content-range');
  const cl = res.headers.get('content-length');
  headers.set('Content-Type', ct);
  if (cr) headers.set('Content-Range', cr);
  if (cl) headers.set('Content-Length', cl);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Disposition', `inline; filename="${id}.mp3"`);

  return new Response(res.body, { status, headers });
}


