import { getContainer } from "@/lib/cosmos";
import crypto from "node:crypto";

export type AuditLogEntry = {
  id: string;
  wallet: "audit"; // Partition Key
  type: "audit_log";
  actor: string; // Wallet address of the admin (lowercased)
  action: string;
  details: any;
  createdAt: string;
};

// Flexible payload signature used by many API routes
export type AuditPayload = {
  who?: string; // wallet or identifier
  what?: string; // action name
  target?: string; // target wallet or resource
  correlationId?: string;
  ok?: boolean;
  roles?: string[];
  metadata?: any;
  [key: string]: any; // allow extra fields
};

function normalizeActor(input: unknown): string {
  try {
    if (typeof input === "string" && input) return input.toLowerCase();
    if (input && typeof input === "object") {
      const maybeWallet = (input as any).wallet;
      if (typeof maybeWallet === "string" && maybeWallet) return maybeWallet.toLowerCase();
    }
  } catch {}
  return "unknown";
}

export async function logAdminAction(actorIn: unknown, action: string, details: any) {
  try {
    const c = await getContainer();
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      wallet: "audit",
      type: "audit_log",
      actor: normalizeActor(actorIn),
      action,
      details,
      createdAt: new Date().toISOString()
    };
    await c.items.create(entry);
  } catch (e) {
    console.error("Failed to log admin action:", e);
    // Do not throw, logging failure shouldn't block the main action
  }
}

// Backward-compatible helper used widely in routes.
// Supports both signatures:
// 1) auditEvent(actor: string, action: string, details?: any)
// 2) auditEvent(req: NextRequest, payload: AuditPayload)
export async function auditEvent(arg1: unknown, arg2?: any, arg3?: any) {
  // If called with explicit actor/action
  if (typeof arg1 === "string" && typeof arg2 === "string") {
    return logAdminAction(arg1, arg2, arg3);
  }

  // Otherwise, treat as payload-style call: auditEvent(req, payload)
  const payload: AuditPayload = (arg2 && typeof arg2 === "object") ? arg2 : {};
  const actor = normalizeActor(payload.who ?? arg1);
  const action = typeof payload.what === "string" && payload.what ? payload.what : "event";
  const details = payload;
  return logAdminAction(actor, action, details);
}
