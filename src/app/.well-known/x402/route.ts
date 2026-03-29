import { NextResponse } from "next/server";

export async function GET() {
  // Static fallback x402 discovery document
  // This satisfies crawlers that check the .well-known standard for UCP
  // before parsing the full OpenAPI document. By exposing POST /api/orders
  // and POST /api/apim-management/subscriptions, we identify the primary 
  // routes designated for Agentic Payments (quote and fixed pricing).
  return NextResponse.json({
    version: 1,
    resources: ["POST /api/orders", "POST /api/apim-management/subscriptions"]
  }, {
    headers: {
      "Link": "</openapi.yaml>; rel=\"service-desc\"",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET"
    }
  });
}
