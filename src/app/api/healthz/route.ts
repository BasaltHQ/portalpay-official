import { NextResponse } from "next/server";

/**
 * Health check endpoint for Azure App Service / Container Apps
 * Returns 200 OK to indicate the app is running
 */
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: Date.now() }, { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
