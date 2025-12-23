import { NextRequest } from 'next/server';
import sseBus from '@/lib/services/sse-bus';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId') || '';
  if (!sessionId) return new Response('Missing sessionId', { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (data: any) => {
        if (closed) return;
        try {
          const line = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(line));
        } catch {}
      };
      const unsub = sseBus.subscribe(`chat:${sessionId}`, (evt) => send(evt));
      // Heartbeat
      const hb = setInterval(() => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(': keep-alive\n\n')); } catch {}
      }, 15000);
      // Initial hello
      send({ type: 'ready', ts: Date.now() });
      try { controller.enqueue(encoder.encode('\n')); } catch {}
      (controller as any)._cleanup = () => { try { clearInterval(hb); } catch {}; try { unsub(); } catch {}; closed = true; };
    },
    cancel(reason) {
      try { (this as any)._cleanup?.(); } catch {}
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  });
}

export const POST = async () => new Response('Method Not Allowed', { status: 405 });

