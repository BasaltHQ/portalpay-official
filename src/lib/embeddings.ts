import { getContainer } from "./cosmos";

type Embedder = {
  embed(texts: string[]): Promise<number[][]>;
};

let cachedEmbedder: Embedder | null = null;

async function createAzureEmbedder(): Promise<Embedder | null> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "";
  const key = process.env.AZURE_OPENAI_API_KEY || "";
  const deployment = process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT || process.env.AZURE_OPENAI_EMBEDDINGS_MODEL || "";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || process.env.AZURE_OPENAI_EMBEDDINGS_API_VERSION || "2023-05-15";
  if (!endpoint || !key || !deployment) return null;
  const url = `${endpoint}openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`;
  return {
    async embed(texts: string[]): Promise<number[][]> {
      if (!texts.length) return [];
      // Azure supports batch embedding via inputs array
      const body = { input: texts } as any;
      const r = await fetch(url, { method: "POST", headers: { "api-key": key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`embeddings_failed_${r.status}`);
      const j = await r.json().catch(() => ({}));
      const data = Array.isArray(j?.data) ? j.data : [];
      return data.map((d: any) => Array.isArray(d?.embedding) ? d.embedding : []);
    },
  } as Embedder;
}

export async function getEmbedder(): Promise<Embedder | null> {
  if (cachedEmbedder) return cachedEmbedder;
  const e = await createAzureEmbedder();
  cachedEmbedder = e;
  return e;
}

export async function storeConversationMessage(params: {
  wallet: string;
  role: "user" | "assistant";
  text: string;
  conversationId?: string;
  ts?: number;
  embed?: boolean;
}): Promise<{ ok: boolean; degraded?: boolean; id?: string } | { ok: true; degraded: true; reason: string }> {
  const wallet = (params.wallet || "").toLowerCase();
  if (!/^0x[a-f0-9]{40}$/i.test(wallet)) return { ok: true, degraded: true, reason: "invalid_wallet" } as any;
  const ts = params.ts || Date.now();
  const id = `${wallet}:conv:${params.conversationId || ts}:${ts}`;
  let embedding: number[] | undefined = undefined;
  if (params.embed) {
    try {
      const embedder = await getEmbedder();
      if (embedder) {
        const [vec] = await embedder.embed([params.text]);
        embedding = Array.isArray(vec) ? vec.slice(0, 1536) : undefined;
      }
    } catch {}
  }
  try {
    const container = await getContainer();
    const doc = {
      id,
      type: "conversation",
      wallet,
      role: params.role,
      text: params.text,
      ts,
      conversationId: params.conversationId || String(ts),
      embedding,
    } as any;
    await container.items.upsert(doc);
    return { ok: true, id } as any;
  } catch (e: any) {
    return { ok: true, degraded: true, reason: e?.message || "cosmos_unavailable" } as any;
  }
}

export async function computeTopTopicsForWallet(wallet: string): Promise<string[]> {
  try {
    const w = (wallet || "").toLowerCase();
    const container = await getContainer();
    // Fetch last 500 conversation entries with embeddings when available
    const query = { query: "SELECT c.text, c.embedding FROM c WHERE c.type = 'conversation' AND c.wallet = @w ORDER BY c.ts DESC", parameters: [{ name: "@w", value: w }] } as { query: string; parameters: { name: string; value: string }[] };
    const { resources } = await container.items.query(query).fetchAll();
    const rows = (resources as any[]).slice(0, 500);
    const withEmb = rows.filter(r => Array.isArray(r.embedding) && r.embedding.length > 0);
    if (withEmb.length >= 12) {
      // K-means (k=3) on embeddings
      const k = 3;
      const dim = withEmb[0].embedding.length;
      // Initialize centroids with first few vectors
      let centroids: number[][] = withEmb.slice(0, k).map(r => r.embedding.slice(0, dim));
      let assignments: number[] = new Array(withEmb.length).fill(0);
      function dist(a: number[], b: number[]): number { let s = 0; for (let i=0;i<dim;i++){ const d=a[i]-b[i]; s += d*d; } return s; }
      function mean(vectors: number[][]): number[] { const m = new Array(dim).fill(0); if (vectors.length===0) return m; for (const v of vectors){ for (let i=0;i<dim;i++) m[i]+=v[i]; } for (let i=0;i<dim;i++) m[i]/=vectors.length; return m; }
      for (let iter=0; iter<25; iter++) {
        let changed = false;
        // Assign
        for (let i=0;i<withEmb.length;i++) {
          const v = withEmb[i].embedding as number[];
          let best = 0; let bestD = Number.POSITIVE_INFINITY;
          for (let c=0;c<k;c++) { const d = dist(v, centroids[c]); if (d < bestD) { bestD = d; best = c; } }
          if (assignments[i] !== best) { assignments[i] = best; changed = true; }
        }
        // Update
        const groups: number[][][] = new Array(k).fill(null).map(()=>[] as number[][]);
        for (let i=0;i<withEmb.length;i++) groups[assignments[i]].push(withEmb[i].embedding as number[]);
        const next = centroids.map((_, idx) => mean(groups[idx]));
        centroids = next;
        if (!changed) break;
      }
      // Extract a keyword for each cluster from assigned texts
      const clusterTexts: string[][] = new Array(k).fill(null).map(()=>[] as string[]);
      for (let i=0;i<withEmb.length;i++) clusterTexts[assignments[i]].push(String(withEmb[i].text || ""));
      const topics = clusterTexts.map(texts => pickTopKeyword(texts)).filter(Boolean) as string[];
      // Ensure exactly 3 topics (pad/fallback if needed)
      if (topics.length >= 3) return topics.slice(0,3);
      const more = pickTopKeywords(rows.map(r=>String(r.text||"")), 6).filter(t => !topics.includes(t));
      return topics.concat(more).slice(0,3);
    }
    // Fallback: keyword frequency heuristic
    return pickTopKeywords(rows.map(r => String(r.text || "")), 3);
  } catch {
    return [];
  }
}

function pickTopKeyword(texts: string[]): string | null {
  const arr = pickTopKeywords(texts, 1);
  return arr[0] || null;
}

function pickTopKeywords(texts: string[], n: number): string[] {
  const freq = new Map<string, number>();
  const stop = new Set(["the","and","a","to","of","in","i","you","it","is","that","for","on","with","this","be","are","was","have","as","but","so","we","they","at","or","not","if","can","do","my","your","our","us","me","him","her","them","from","by","an","about","what","when","how","why","which","who","where","will","would","could","should","has","had","been","more","most","some","any","all","just","like"]);
  for (const t of texts) {
    const words = t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    for (const w2 of words) {
      if (stop.has(w2) || w2.length < 3) continue;
      freq.set(w2, (freq.get(w2) || 0) + 1);
    }
  }
  return Array.from(freq.entries()).sort((a,b)=>b[1]-a[1]).slice(0, n).map(([k]) => k);
}


