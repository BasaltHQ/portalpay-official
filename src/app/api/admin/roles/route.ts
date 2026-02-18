import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getAuthenticatedWallet } from "@/lib/auth";
import { resolveAdminRole } from "@/lib/authz";
import { getEnv } from "@/lib/env";
import { logAdminAction } from "@/lib/audit";

const DOC_ID = "admin_roles";
export const dynamic = 'force-dynamic';

function getBrandKey(req: NextRequest): string {
    const ct = String(process.env.NEXT_PUBLIC_CONTAINER_TYPE || process.env.CONTAINER_TYPE || "platform").toLowerCase();
    const envKey = String(process.env.BRAND_KEY || process.env.NEXT_PUBLIC_BRAND_KEY || "").toLowerCase();

    // Check header first (for multi-tenant platform hosting partners)
    const headerKey = req.headers.get("x-brand-key");
    if (headerKey) return headerKey.toLowerCase();

    if (ct === "partner") return envKey;
    return envKey || "basaltsurge";
}

export async function GET(req: NextRequest) {
    try {
        const wallet = await getAuthenticatedWallet(req);

        // Determine Context
        const brandKey = getBrandKey(req);
        const isPlatform = !brandKey || brandKey === 'portalpay' || brandKey === 'basaltsurge';
        const targetPartition = isPlatform ? "global" : brandKey;

        // Resolve Role in Context
        const role = await resolveAdminRole(wallet || undefined, targetPartition);
        const authorized = role === 'platform_super_admin' || role === 'platform_admin' || role === 'partner_admin' || role === 'partner_owner';

        if (!wallet || !authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const c = await getContainer();
        const { resource } = await c.item(DOC_ID, targetPartition).read();

        // Fallback / Bootstrap
        if (!resource || !Array.isArray(resource.admins)) {
            // For Platform: Return Env Admins
            if (isPlatform) {
                const env = getEnv();
                const owner = String(env.NEXT_PUBLIC_OWNER_WALLET || "").toLowerCase();
                const envAdmins = (env.ADMIN_WALLETS || []).map(a => String(a || "").toLowerCase());

                const bootstrapList = [];
                if (owner) bootstrapList.push({ wallet: owner, role: "platform_super_admin", name: "Owner" });
                envAdmins.forEach(a => {
                    if (a && a !== owner) bootstrapList.push({ wallet: a, role: "platform_super_admin", name: "Admin (Env)" });
                });
                return NextResponse.json({ admins: bootstrapList, source: "env" });
            }

            // For Partner: Return empty list (or could bootstrap from Owner if needed)
            // But we shouldn't automatically add the Owner to the DB list just by viewing, 
            // unless we want to show them effectively.
            return NextResponse.json({ admins: [], source: "empty" });
        }

        return NextResponse.json({ admins: resource.admins, source: "db" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const wallet = await getAuthenticatedWallet(req);

        // Determine Context
        const brandKey = getBrandKey(req);
        const isPlatform = !brandKey || brandKey === 'portalpay' || brandKey === 'basaltsurge';
        const targetPartition = isPlatform ? "global" : brandKey;

        // Resolve Role in Context - Must be allowed to EDIT
        const role = await resolveAdminRole(wallet || undefined, targetPartition);

        // Permissions:
        // Platform Super Admin: Can edit anything.
        // Platform Admin: Can edit Platform list (and maybe partner list? User said "allow platform level admins... to adjust it").
        // Partner Owner/Admin: Can edit THEIR OWN partner list.

        let canEdit = false;
        if (role === 'platform_super_admin') canEdit = true;
        if (role === 'platform_admin') canEdit = true; // Platform admins can edit any list
        if (!isPlatform && (role === 'partner_owner' || role === 'partner_admin')) canEdit = true;

        if (!wallet || !canEdit) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { admins } = body;

        if (!Array.isArray(admins)) {
            return NextResponse.json({ error: "Invalid body: admins must be an array" }, { status: 400 });
        }

        // Validation: Ensure at least one Super Admin remains (Platform Only)
        if (isPlatform) {
            const superAdmins = admins.filter((a: any) => a.role === "platform_super_admin");
            if (superAdmins.length === 0) {
                return NextResponse.json({ error: "Cannot remove the last Super Admin" }, { status: 400 });
            }
        }

        const doc = {
            id: DOC_ID,
            wallet: targetPartition, // Partition Key uses 'wallet' field on this doc type
            brandKey: targetPartition, // Store brandKey for clarity
            type: "admin_roles",
            updatedAt: new Date().toISOString(),
            updatedBy: wallet,
            admins: admins.map((a: any) => ({
                wallet: String(a.wallet || "").toLowerCase().trim(),
                role: String(a.role || (isPlatform ? "platform_admin" : "partner_admin")),
                name: String(a.name || "").slice(0, 100),
                email: String(a.email || "").slice(0, 100)
            })).filter((a: any) => /^0x[a-f0-9]{40}$/.test(a.wallet))
        };

        const c = await getContainer();

        // Fetch previous state for diffing
        const { resource: prevResource } = await c.item(DOC_ID, targetPartition).read();
        const oldAdmins = Array.isArray(prevResource?.admins) ? prevResource.admins : [];
        const oldMap = new Map<string, any>(oldAdmins.map((a: any) => [a.wallet.toLowerCase(), a]));

        // Upsert new state
        const { resource } = await c.items.upsert(doc);

        // Calculate Diff
        const newAdmins = resource?.admins || [];
        const newMap = new Map<string, any>(newAdmins.map((a: any) => [a.wallet.toLowerCase(), a]));
        const actorName = newMap.get(wallet.toLowerCase())?.name || oldMap.get(wallet.toLowerCase())?.name || wallet;

        const changes: string[] = [];

        // Check for additions and updates
        for (const [w, newUser] of newMap.entries()) {
            const oldUser = oldMap.get(w);
            if (!oldUser) {
                changes.push(`Added admin ${newUser.name || w} as ${formatRole(newUser.role)}`);
            } else {
                if (oldUser.role !== newUser.role) {
                    changes.push(`Changed role for ${newUser.name || w} from ${formatRole(oldUser.role)} to ${formatRole(newUser.role)}`);
                }
                if (oldUser.name !== newUser.name) {
                    changes.push(`Renamed admin ${w} from "${oldUser.name}" to "${newUser.name}"`);
                }
                if (oldUser.email !== newUser.email) {
                    changes.push(`Updated email for ${newUser.name || w}`);
                }
            }
        }

        // Check for removals
        for (const [w, oldUser] of oldMap.entries()) {
            if (!newMap.has(w)) {
                changes.push(`Removed admin ${oldUser.name || w}`);
            }
        }

        if (changes.length > 0) {
            logAdminAction(wallet, "update_admin_roles", {
                summary: `${changes.length} changes made`,
                changes,
                updatedBy: actorName,
                context: targetPartition
            });
        }

        return NextResponse.json({ success: true, admins: resource?.admins || [] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

function formatRole(r: string) {
    return r.replace(/_/g, ' ').replace('platform', '').trim();
}
