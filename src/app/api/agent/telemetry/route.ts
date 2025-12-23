import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type TelemetryEvent = {
  type: "tool_call_start" | "tool_call_result" | "data_channel_message";
  name?: string;
  requestId?: string;
  sessionId?: string;
  wallet?: string;
  args?: any;
  result?: { ok: boolean; data?: any; error?: string };
  meta?: any;
};

export async function POST(req: Request) {
  let evt: TelemetryEvent | any = {};
  try {
    evt = await req.json();
  } catch {
    evt = {};
  }
  const ts = new Date().toISOString();
  const { type, name, requestId, sessionId, wallet } = evt || {};
  const argsPreview =
    (() => {
      try {
        return JSON.stringify(evt?.args ?? {}).slice(0, 200);
      } catch {
        return "";
      }
    })();
  const resultPreview =
    (() => {
      try {
        return JSON.stringify(evt?.result ?? {}).slice(0, 200);
      } catch {
        return "";
      }
    })();

  // Server-side telemetry: shows in terminal logs
  console.log("[AgentTelemetry]", { ts, type, name, requestId, sessionId, wallet, argsPreview, resultPreview });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, status: "telemetry_endpoint_ready" });
}
