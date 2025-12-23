import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // This is a placeholder for the Shopify App Proxy.
    // In a real implementation, this would handle requests proxied from the merchant's storefront.
    // It verifies the signature and returns Liquid or JSON content.

    return NextResponse.json({
        message: "Shopify App Proxy is working!",
        timestamp: new Date().toISOString()
    });
}

export async function POST(req: NextRequest) {
    return NextResponse.json({
        message: "Shopify App Proxy POST received",
        timestamp: new Date().toISOString()
    });
}
