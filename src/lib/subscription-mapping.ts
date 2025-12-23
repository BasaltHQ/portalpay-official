import { getContainer } from "@/lib/cosmos";

export type SubscriptionDoc = {
  id: string;
  type: "apim_subscription";
  subscriptionId: string;
  wallet: string;
  scopes: string[];
  ipAllowlist?: string[];
  status?: "active" | "revoked" | "expired";
  createdAt?: number;
  updatedAt?: number;
};

function isHexAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(String(addr || "").trim());
}

export function normalizeHex(addr: string): string {
  const a = String(addr || "").toLowerCase();
  return isHexAddress(a) ? a : "";
}

export async function getSubscriptionDocsForWallet(wallet: string): Promise<SubscriptionDoc[]> {
  const w = normalizeHex(wallet);
  if (!w) return [];
  const container = await getContainer();
  const spec = {
    query:
      "SELECT c.id, c.type, c.subscriptionId, c.wallet, c.scopes, c.ipAllowlist, c.status, c.createdAt, c.updatedAt FROM c WHERE c.type='apim_subscription' AND c.wallet=@w AND IS_DEFINED(c.subscriptionId)",
    parameters: [{ name: "@w", value: w }],
  } as { query: string; parameters: { name: string; value: any }[] };
  const { resources } = await container.items.query(spec).fetchAll();
  const rows = Array.isArray(resources) ? (resources as SubscriptionDoc[]) : [];
  return rows.map((r) => ({
    ...r,
    wallet: normalizeHex(r.wallet),
    scopes: (Array.isArray(r.scopes) ? r.scopes.map((s) => String(s)) : []).concat(
      // Backfill ensures dashboard shows correct effective scopes
      ["receipts:read", "receipts:write", "orders:create", "inventory:read", "inventory:write"].filter(
        (s) => !Array.isArray(r.scopes) || !r.scopes.includes(s)
      )
    ),
  }));
}

export async function getSubscriptionDocById(subId: string): Promise<SubscriptionDoc | null> {
  const s = String(subId || "").trim();
  if (!s) return null;
  const container = await getContainer();
  const spec = {
    query:
      "SELECT TOP 1 c.id, c.type, c.subscriptionId, c.wallet, c.scopes, c.ipAllowlist, c.status, c.createdAt, c.updatedAt FROM c WHERE c.type='apim_subscription' AND c.subscriptionId=@s AND IS_DEFINED(c.wallet)",
    parameters: [{ name: "@s", value: s }],
  } as { query: string; parameters: { name: string; value: any }[] };
  const { resources } = await container.items.query(spec).fetchAll();
  const row = Array.isArray(resources) && resources.length ? (resources[0] as SubscriptionDoc) : null;
  if (!row) return null;
  row.wallet = normalizeHex(row.wallet);
  row.scopes = Array.isArray(row.scopes) ? row.scopes.map((x) => String(x)) : [];
  const backfill = ["receipts:read", "receipts:write", "orders:create", "inventory:read", "inventory:write"];
  for (const b of backfill) {
    if (!row.scopes.includes(b)) {
      row.scopes.push(b);
    }
  }
  return row;
}

export async function upsertSubscriptionMapping(
  subscriptionId: string,
  wallet: string,
  scopes: string[] = ["receipts:read", "receipts:write", "orders:create", "inventory:read", "inventory:write"],
  status: "active" | "revoked" | "expired" = "active"
): Promise<SubscriptionDoc> {
  const w = normalizeHex(wallet);
  if (!w) throw new Error("invalid_wallet");
  const s = String(subscriptionId || "").trim();
  if (!s) throw new Error("invalid_subscription_id");

  const now = Date.now();
  const doc: SubscriptionDoc = {
    id: `apim_subscription|${s}`,
    type: "apim_subscription",
    subscriptionId: s,
    wallet: w,
    scopes: scopes.map((x) => String(x)),
    status,
    updatedAt: now,
    createdAt: now,
  };

  const container = await getContainer();
  const { resource } = await container.items.upsert(doc, { disableAutomaticIdGeneration: true });
  // Return the document we upserted to satisfy TypeScript and ensure required fields are present
  return doc;
}

export async function assertSubscriptionOwnershipOrThrow(subId: string, wallet: string): Promise<SubscriptionDoc> {
  const w = normalizeHex(wallet);
  if (!w) throw new Error("unauthorized");

  const doc = await getSubscriptionDocById(subId);
  if (!doc || !doc.wallet || doc.wallet !== w) {
    const e: any = new Error("forbidden");
    e.status = 403;
    throw e;
  }

  // Auto-gate by monthly expiry based on createdAt (30 days)
  const now = Date.now();
  const createdAt = Number(doc.createdAt || 0) || 0;
  const expiresAt = createdAt ? createdAt + 30 * 24 * 60 * 60 * 1000 : 0;
  const isExpired = expiresAt ? now >= expiresAt : false;

  if (isExpired || (doc.status && doc.status !== "active")) {
    // Try to persist status transition to "expired" if applicable
    try {
      if (isExpired && doc.status !== "expired") {
        const container = await getContainer();
        await container.items.upsert(
          {
            ...doc,
            status: "expired",
            updatedAt: now,
          },
          { disableAutomaticIdGeneration: true }
        );
      }
    } catch {
      // ignore persistence errors; still gate access
    }
    const e: any = new Error("forbidden");
    e.status = 403;
    throw e;
  }

  return doc;
}
