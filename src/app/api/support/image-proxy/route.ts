import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy endpoint to fetch images that may have CORS restrictions.
 * Returns image as base64 data URL that can be used directly in img src.
 * Used by the ImageMarkupModal to load images for annotation.
 */
export async function GET(req: NextRequest) {
    try {
        const url = req.nextUrl.searchParams.get("url");
        const format = req.nextUrl.searchParams.get("format") || "dataurl"; // "dataurl" or "binary"

        if (!url) {
            return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
        }

        // Validate it's a valid URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }

        // Only allow HTTPS URLs or localhost for development
        if (parsedUrl.protocol !== "https:" && !parsedUrl.hostname.includes("localhost")) {
            return NextResponse.json({ error: "Only HTTPS URLs are allowed" }, { status: 400 });
        }

        // Fetch the image with various headers to maximize compatibility
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "image/*,*/*;q=0.8",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status}` },
                { status: response.status }
            );
        }

        // Get the content type
        const contentType = response.headers.get("content-type") || "image/png";

        // Verify it's an image
        if (!contentType.startsWith("image/")) {
            return NextResponse.json({ error: "URL does not point to an image" }, { status: 400 });
        }

        // Get the image data as buffer
        const buffer = Buffer.from(await response.arrayBuffer());

        if (format === "binary") {
            // Return raw binary for direct image response
            return new NextResponse(buffer, {
                status: 200,
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        // Convert to base64 data URL
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${contentType};base64,${base64}`;

        return NextResponse.json({
            ok: true,
            dataUrl,
            contentType,
            size: buffer.length,
        });
    } catch (e: any) {
        console.error("[ImageProxy] Error:", e?.message || e);
        return NextResponse.json(
            { error: e?.message || "Failed to proxy image" },
            { status: 500 }
        );
    }
}
