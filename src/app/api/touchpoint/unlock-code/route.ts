import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getContainer } from "@/lib/cosmos";
import { requireThirdwebAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(obj: any, init?: { status?: number; headers?: Record<string, string> }) {
    try {
        const s = JSON.stringify(obj);
        const len = new TextEncoder().encode(s).length;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        };
        headers["Content-Length"] = String(len);
        return new NextResponse(s, { status: init?.status ?? 200, headers });
    } catch {
        return NextResponse.json(obj, init as any);
    }
}

/**
 * Hash an unlock code for secure storage
 * Uses SHA-256 with a prefix salt to prevent rainbow table attacks
 */
function hashUnlockCode(code: string): string {
    const salt = "touchpoint_unlock_v1:";
    return crypto.createHash("sha256").update(salt + code).digest("hex");
}

/**
 * PATCH /api/touchpoint/unlock-code
 * 
 * Admin-only endpoint to update the unlock code for a device.
 * Allows changing unlock code without full re-provisioning.
 * 
 * Body:
 * {
 *   "installationId": "uuid-v4",
 *   "unlockCode": "1234"  // 4-8 digit PIN
 * }
 */
export async function PATCH(req: NextRequest) {
    try {
        // Auth: Admin or Superadmin only
        const caller = await requireThirdwebAuth(req).catch(() => null as any);
        const roles = Array.isArray(caller?.roles) ? caller.roles : [];
        if (!roles.includes("admin") && !roles.includes("superadmin")) {
            return json({ error: "forbidden" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({} as any));

        const installationId = String(body?.installationId || "").trim();
        if (!installationId) {
            return json({ error: "installation_id_required" }, { status: 400 });
        }

        const unlockCode = String(body?.unlockCode || "").trim();
        // Unlock code must be 4-8 digits
        if (!/^\d{4,8}$/.test(unlockCode)) {
            return json({
                error: "invalid_unlock_code",
                message: "unlockCode must be 4-8 digits"
            }, { status: 400 });
        }

        // Create deterministic ID (same as provision endpoint)
        const hash = crypto.createHash("sha256").update(installationId).digest("hex").slice(0, 48);
        const id = `touchpoint_${hash}`;
        const wallet = `touchpoint:${hash}`;

        const dbId = String(process.env.COSMOS_PAYPORTAL_DB_ID || "payportal");
        const containerId = "payportal_events";
        const container = await getContainer(dbId, containerId);

        // Fetch existing document
        const { resource } = await container.item(id, wallet).read();

        if (!resource || resource.type !== "touchpoint_device") {
            return json({
                error: "device_not_found",
                message: "Device not configured. Provision device first."
            }, { status: 404 });
        }

        // Update the unlock code hash
        const unlockCodeHash = hashUnlockCode(unlockCode);
        const updated = {
            ...resource,
            unlockCodeHash,
            unlockCodeUpdatedAt: new Date().toISOString(),
            unlockCodeUpdatedBy: caller.wallet,
        };

        await container.item(id, wallet).replace(updated as any);

        return json({
            ok: true,
            installationId,
            message: "Unlock code updated successfully",
        });
    } catch (e: any) {
        console.error("[touchpoint/unlock-code] Error:", e);
        return json({ error: "update_failed", message: e?.message || String(e) }, { status: 500 });
    }
}
