import { NextResponse } from "next/server";

export async function GET() {
  // Static fallback x402 discovery document
  // Points to the dedicated x402-gated endpoints that always
  // enforce 402 payment challenges. The standard /api/orders and
  // /api/apim-management/subscriptions remain for POS/browser flows.
  return NextResponse.json({
    version: 1,
    resources: ["POST /api/x402/orders", "POST /api/x402/subscribe"]
  }, {
    headers: {
      "Link": "</openapi.json>; rel=\"service-desc\"",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET"
    }
  });
}
