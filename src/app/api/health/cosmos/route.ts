import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(_req: NextRequest) {
  try {
    const raw = process.env.COSMOS_CONNECTION_STRING
      || process.env.AZURE_COSMOS_CONNECTION_STRING
      || process.env.AZURE_COSMOSDB_CONNECTION_STRING
      || process.env.COSMOSDB_CONNECTION_STRING
      || "";

    const hasConn = !!raw;
    const looksMongo = /mongodb:\/\//i.test(raw) || /ApiKind=MongoDB/i.test(raw);
    const endpointMatch = /AccountEndpoint=([^;]+)/i.exec(raw || "");
    const endpoint = endpointMatch ? endpointMatch[1] : "";
    const masked = raw ? raw.replace(/(AccountKey=)[^;]+/i, "$1***") : "";

    let dbId = process.env.COSMOS_DB_ID || "cb_billing";
    let containerId = process.env.COSMOS_CONTAINER_ID || "events";

    let ping = "skipped";
    let ok = false;
    let error = "";
    try {
      const c = await getContainer(dbId, containerId);
      // Lightweight operation: read container properties
      const { resource } = await c.read();
      ping = resource?.id ? "ok" : "unknown";
      ok = true;
    } catch (e: any) {
      error = e?.message || String(e);
    }

    return NextResponse.json({
      ok,
      ping,
      env: {
        hasConn,
        looksMongo,
        endpoint,
        dbId,
        containerId,
        // include masked raw for quick validation without secrets
        connectionStringPreview: masked.slice(0, 80),
      },
      error: ok ? undefined : error,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown" }, { status: 500 });
  }
}


