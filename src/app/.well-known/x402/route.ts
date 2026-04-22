import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host") || "surge.basalthq.com"}`).replace(/\/$/, "");
  
  return NextResponse.json({
    version: 1,
    resources: []
  }, {
    headers: {
      "Link": `<${baseUrl}/openapi.json>; rel="service-desc"`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET"
    }
  });
}
