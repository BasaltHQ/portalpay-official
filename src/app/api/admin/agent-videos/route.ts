import { NextRequest, NextResponse } from "next/server";
import { requireThirdwebAuth } from "@/lib/auth";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";
import { auditEvent } from "@/lib/audit";
import { isPlatformSuperAdmin } from "@/lib/authz";
import { storage } from "@/lib/azure-storage";

function getExtension(mime: string, originalName: string): string {
    if (mime === "video/mp4") return "mp4";
    if (mime === "video/webm") return "webm";
    if (mime === "video/quicktime") return "mov";
    const parts = originalName.split(".");
    if (parts.length > 1) return parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "");
    return "bin";
}

// Enforce standard Node runtime
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const agentWallet = (req.headers.get("x-wallet") || "").toLowerCase();
        if (!agentWallet) {
            return NextResponse.json({ error: "missing_agent_wallet" }, { status: 401 });
        }
        
        const container = await getContainer();

        // Retrieve all agent videos globally
        const { resources: videos } = await container.items.query("SELECT * FROM c WHERE c.type = 'agent_Video' ORDER BY c.createdAt DESC").fetchAll();

        return NextResponse.json({ ok: true, videos });

    } catch (e: any) {
        console.error("[AgentVideosGET] Error:", e);
        return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { wallet } = await requireThirdwebAuth(req);
        
        // Safety wrapper since this is platform administration only
        const isSuperAdmin = isPlatformSuperAdmin(wallet);
        if (!isSuperAdmin) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
        
        console.log("[AgentVideosPOST] Content-Type:", req.headers.get("content-type"));

        const form = await req.formData().catch((err) => {
            console.error("[AgentVideosPOST] FormData parsing failed:", err);
            return null;
        });
        if (!form) return NextResponse.json({ error: "invalid_form_data", details: "Failed to parse stream" }, { status: 400 });

        const title = form.get("title")?.toString();
        const description = form.get("description")?.toString();
        const category = form.get("category")?.toString() || "General";
        const file = form.get("file") as File;

        if (!title || !file) {
            return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
        }

        const mime = file.type || "application/octet-stream";
        if (!mime.startsWith("video/")) {
            return NextResponse.json({ error: "invalid_content_type_must_be_video" }, { status: 400 });
        }

        const ab = await file.arrayBuffer();
        const buffer = Buffer.from(ab);

        // Upload using Storage Provider
        const containerName = process.env.AZURE_BLOB_CONTAINER || "uploads";
        const id = crypto.randomUUID().replace(/-/g, "");
        const ext = getExtension(mime, file.name);
        const blobName = `agent_videos/${id}_${crypto.randomBytes(4).toString("hex")}.${ext}`;

        const finalUrl = await storage.upload(`${containerName}/${blobName}`, buffer, mime);

        const container = await getContainer();
        const videoDoc = {
            id: `agent_Video_${id}`,
            wallet: wallet,
            type: "agent_Video",
            title: String(title).substring(0, 100).trim(),
            description: description ? String(description).substring(0, 500).trim() : "",
            category: String(category).trim(),
            url: finalUrl,
            duration: 0,
            createdBy: wallet,
            createdAt: new Date().toISOString()
        };

        await container.items.create(videoDoc);
        await auditEvent(req, { what: "agent_video_created", who: wallet, target: videoDoc.id });

        return NextResponse.json({ ok: true, video: videoDoc });

    } catch (e: any) {
        console.error("[AgentVideosPOST] Error:", e);
        return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { wallet } = await requireThirdwebAuth(req);
        
        // Administration authorization required to delete
        const isSuperAdmin = isPlatformSuperAdmin(wallet);
        if (!isSuperAdmin) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "missing_id" }, { status: 400 });
        }

        const container = await getContainer();

        try {
            await container.item(id, id).delete();
        } catch {
            // Assume missing partition key convention if direct drop fails
            const { resource } = await container.item(id).read();
            if (resource) await container.item(id, resource._partitionKey || undefined).delete();
        }

        await auditEvent(req, { what: "agent_video_deleted", who: wallet, target: id });

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        console.error("[AgentVideosDEL] Error:", e);
        return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { wallet } = await requireThirdwebAuth(req);
        
        const isSuperAdmin = isPlatformSuperAdmin(wallet);
        if (!isSuperAdmin) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const id = body.id;

        if (!id) {
            return NextResponse.json({ error: "missing_id" }, { status: 400 });
        }

        const container = await getContainer();

        // Unset any existing primary videos safely using standard upserts
        const { resources: primaryVids } = await container.items.query("SELECT * FROM c WHERE c.type = 'agent_Video' AND c.isPrimary = true").fetchAll();
        for (const pv of primaryVids) {
            if (pv.id !== id) {
                pv.isPrimary = false;
                await container.items.upsert(pv);
            }
        }

        // Resolve target video structure safely in memory
        const { resources: allVideos } = await container.items.query("SELECT * FROM c WHERE c.type = 'agent_Video'").fetchAll();
        const target = allVideos.find(v => String(v.id) === String(id) || String((v as any)._id) === String(id));

        if (!target) {
            return NextResponse.json({ 
                error: `System failed to locate video ID [${id}]. Available IDs in partition: ${allVideos.map(v => v.id).join(", ")}` 
            }, { status: 404 });
        }

        target.isPrimary = true;
        await container.items.upsert(target);

        await auditEvent(req, { what: "agent_video_set_primary", who: wallet, target: target.id });

        return NextResponse.json({ ok: true, video: target });

    } catch (e: any) {
        console.error("[AgentVideosPUT] Error:", e);
        return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
    }
}
