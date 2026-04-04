import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import sharp from "sharp";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get("wallet")?.toLowerCase();

        if (!wallet) return NextResponse.json({ error: "Wallet required" }, { status: 400 });

        const container = await getContainer("portalpay"); // we usually do "Shop" or default? Let's check getContainer usage. Wait, getContainer doesn't take args by default, it uses standard database.

        // Actually the db usage is `const container = await getContainer();`
        const dbContainer = await getContainer();
        
        // Fetch specific config
        // In Cosmos, we need to know the document ID to patch it perfectly.
        // Usually, shop config ID is 'shop:config'.
        const { resources } = await dbContainer.items.query({
            query: "SELECT * FROM c WHERE c.id='shop:config' AND c.wallet=@w",
            parameters: [{ name: "@w", value: wallet }]
        }).fetchAll();

        const shopConfig = resources[0];

        if (!shopConfig) return NextResponse.json({ error: "Shop config not found" }, { status: 404 });
        if (!shopConfig.theme?.brandLogoUrl) return NextResponse.json({ error: "No logo URL defined in theme" }, { status: 400 });
        if (shopConfig.thermalLogoPayload) return NextResponse.json({ message: "Payload already exists" }, { status: 200 });

        console.log(`[ThermalCompiler] Downloading logo for ${wallet}...`);
        const response = await fetch(shopConfig.theme.brandLogoUrl);
        if (!response.ok) throw new Error("Failed to fetch image from URL");
        
        const arrayBuffer = await response.arrayBuffer();
        
        console.log(`[ThermalCompiler] Processing image with Sharp...`);
        const targetWidth = 384; // Standard 80mm width for aesthetic logos (48 bytes wide)
        
        const { data: pixelData, info } = await sharp(Buffer.from(arrayBuffer))
            .resize(targetWidth)
            .flatten({ background: { r: 255, g: 255, b: 255 } }) // Make transparent white
            .greyscale() // Convert to 1 channel grayscale
            .raw()
            .toBuffer({ resolveWithObject: true });

        const h = info.height;
        const widthBytes = targetWidth / 8;
        const rasterBuffer = Buffer.alloc(h * widthBytes);

        // Convert pixels to 1bpp matrix (MSB Left)
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < widthBytes; x++) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const pixelIndex = (y * targetWidth) + (x * 8 + bit);
                    const brightness = pixelData[pixelIndex]; // Grayscale 0-255
                    if (brightness < 160) {
                        // Pixel is dark enough to burn onto thermal paper
                        byte |= (1 << (7 - bit));
                    }
                }
                rasterBuffer[(y * widthBytes) + x] = byte;
            }
        }

        // GS v 0 format
        const m = 0x00; // Normal mode
        const header = Buffer.from([
            0x1D, 0x76, 0x30, m,
            widthBytes & 0xFF, (widthBytes >> 8) & 0xFF,
            h & 0xFF, (h >> 8) & 0xFF
        ]);

        const fullSequence = Buffer.concat([header, rasterBuffer]);
        const base64Payload = fullSequence.toString('base64');
        
        console.log(`[ThermalCompiler] Payload generated: ${base64Payload.length} base64 chars. Surgically patching DB...`);
        
        // Surgical patch to strictly avoid overwriting any concurrent branding changes
        await dbContainer.item("shop:config", wallet).patch([
            { op: "set", path: "/thermalLogoPayload", value: base64Payload }
        ]);

        return NextResponse.json({ ok: true, message: "Compiled and patched successfully." });
    } catch (e: any) {
        console.error("[ThermalCompiler] Error:", e);
        return NextResponse.json({ error: e.message || "Compilation failed" }, { status: 500 });
    }
}
