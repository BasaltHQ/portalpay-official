import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { computeTopTopicsForWallet } from "@/lib/embeddings";

export async function GET(req: NextRequest) {
  try {
    const w = String((req.nextUrl.searchParams.get('wallet') || req.headers.get('x-wallet') || '')).toLowerCase();
    if (!/^0x[a-f0-9]{40}$/i.test(w)) return NextResponse.json({ topics: [], languages: [] });
    try {
      const container = await getContainer();
      const id = `${w}:user`;
      let topics: string[] = [];
      let languages: string[] = [];
      try {
        const { resource } = await container.item(id, w).read<any>();
        const metrics = resource?.metrics || {};
        // Treat domains as topics for the public page
        if (metrics?.domains && typeof metrics.domains === 'object') {
          topics = Object.entries(metrics.domains).sort((a: any, b: any) => Number(b[1]||0) - Number(a[1]||0)).map(([k]) => String(k)).slice(0, 5);
        }
        if (metrics?.languages && typeof metrics.languages === 'object') {
          languages = Object.entries(metrics.languages).sort((a: any, b: any) => Number(b[1]||0) - Number(a[1]||0)).map(([k]) => String(k)).slice(0, 5);
        }
      } catch {}
      // Do NOT fallback to embeddings: if no domains tracked yet, return empty
      return NextResponse.json({ topics, languages });
    } catch (e: any) {
      return NextResponse.json({ topics: [], languages: [], degraded: true, reason: e?.message || 'cosmos_unavailable' });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


