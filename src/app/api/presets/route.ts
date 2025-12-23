import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet } from "@/lib/auth";

type PresetDoc = {
  id: string;
  wallet: string;
  type: "presets";
  presets: any[];
  activeId?: string;
  updatedAt: number;
};

export async function GET(req: NextRequest) {
  try {
    // Accept either auth cookie or x-wallet header for reads
    const authed = await getAuthenticatedWallet(req);
    const headerWallet = String(req.headers.get("x-wallet") || "").toLowerCase();
    const wallet = (authed || headerWallet).toLowerCase();
    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const c = await getContainer();
    const id = `${wallet}:presets`;
    try {
      const { resource } = await c.item(id, wallet).read<PresetDoc>();
      const doc = (resource as PresetDoc | undefined) || ({ presets: [], activeId: "" } as any);
      return NextResponse.json({ presets: doc.presets || [], activeId: doc.activeId || "" });
    } catch {
      return NextResponse.json({ presets: [], activeId: "" });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Accept auth cookie if present; otherwise allow x-wallet header for client writes
    const authed = await getAuthenticatedWallet(req);
    const headerWallet = String(req.headers.get("x-wallet") || "").toLowerCase();
    const wallet = (authed || headerWallet).toLowerCase();
    if (!/^0x[a-f0-9]{40}$/i.test(wallet)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const presets = Array.isArray(body?.presets) ? body.presets : [];
    const activeId = typeof body?.activeId === "string" ? String(body.activeId).slice(0, 120) : undefined;
    const doc: PresetDoc = {
      id: `${wallet}:presets`,
      wallet,
      type: "presets",
      presets,
      activeId,
      updatedAt: Date.now(),
    };
    try {
      const c = await getContainer();
      await c.items.upsert(doc);
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      return NextResponse.json({ ok: true, degraded: true, reason: e?.message || "cosmos_unavailable" });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}


