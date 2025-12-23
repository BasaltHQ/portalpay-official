//src/app/api/proxy-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy API for fetching PDFs from external URLs
 * This bypasses CORS restrictions for PDF.js
 */
export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    // Validate URL is from allowed domains
    const allowedDomains = [
        "portalpay-b6hqctdfergaadct.z02.azurefd.net",
        "ledger1blob.blob.core.windows.net",
        "portalpayblob.blob.core.windows.net",
    ];

    try {
        const parsedUrl = new URL(url);
        const isAllowed = allowedDomains.some(domain => parsedUrl.hostname.endsWith(domain));

        if (!isAllowed) {
            return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
        }

        // Fetch the PDF
        const response = await fetch(url, {
            headers: {
                "Accept": "application/pdf",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch PDF: ${response.status}` },
                { status: response.status }
            );
        }

        const pdfBuffer = await response.arrayBuffer();

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Length": String(pdfBuffer.byteLength),
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (e: any) {
        console.error("[proxy-pdf] Error:", e);
        return NextResponse.json({ error: e.message || "Failed to proxy PDF" }, { status: 500 });
    }
}
