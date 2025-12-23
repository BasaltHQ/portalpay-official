import { NextRequest, NextResponse } from "next/server";
import { storeConversationMessage } from "@/lib/embeddings";
import { getAuthenticatedWallet } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authed = await getAuthenticatedWallet(req);
    const headerWallet = String((body.wallet || req.headers.get('x-wallet') || '')).toLowerCase();
    const wallet = (authed || headerWallet).toLowerCase();
    if (!authed || wallet !== (authed || '').toLowerCase()) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const role = body.role === 'assistant' ? 'assistant' : 'user';
    const text = String(body.text || '');
    const conversationId = body.conversationId ? String(body.conversationId) : undefined;
    const embed = body.embed !== false; // default true
    if (!/^0x[a-f0-9]{40}$/i.test(wallet) || !text) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
    const res = await storeConversationMessage({ wallet, role, text, conversationId, embed });
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


