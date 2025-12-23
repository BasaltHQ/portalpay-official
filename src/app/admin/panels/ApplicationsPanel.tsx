"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";

type PartnerApplication = {
  id: string;
  wallet: string; // partition key = brandKey candidate
  type: "partner_application";
  brandKey: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  appUrl?: string;
  partnerFeeBps?: number;
  defaultMerchantFeeBps?: number;
  partnerWallet?: string;
  colors?: { primary?: string; accent?: string };
  logos?: { app?: string; favicon?: string; symbol?: string; footer?: string };
  meta?: { ogTitle?: string; ogDescription?: string };
  notes?: string;
  status: "submitted" | "reviewing" | "approved" | "rejected";
  createdAt: number;
  updatedAt?: number;
  approvedAt?: number;
  approvedBy?: string;
};

export default function ApplicationsPanel() {
  const account = useActiveAccount();
  // Platform-only: hide Applications panel in partner containers
  const containerType = String(process.env.NEXT_PUBLIC_CONTAINER_TYPE || "platform").toLowerCase();
  if (containerType === "partner") {
    return (
      <div className="glass-pane rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Applications</h2>
        </div>
        <div className="microtext text-muted-foreground">
          This section is available only in the Platform container. Partner containers do not include Applications or Partners admin panels.
        </div>
      </div>
    );
  }
  const [items, setItems] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Details viewer state
  const [detail, setDetail] = useState<PartnerApplication | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit images state
  const [editApp, setEditApp] = useState<PartnerApplication | null>(null);
  const [editLogos, setEditLogos] = useState<{ app?: string; favicon?: string; symbol?: string; footer?: string }>({});
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setInfo("");
      const r = await fetch("/api/platform/partners/applications", {
        cache: "no-store",
        credentials: "include",
      });
      const j = await r.json().catch(() => ({}));
      const arr = Array.isArray(j?.applications) ? j.applications : [];
      // Sort newest first by createdAt
      arr.sort((a: any, b: any) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
      setItems(arr);
      if (j?.degraded) {
        setError(j?.reason || "Cosmos unavailable; using degraded data");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [account?.address]);

  async function view(id: string) {
    try {
      setError("");
      setInfo("");
      setDetailLoading(true);
      const r = await fetch(`/api/platform/partners/applications/${encodeURIComponent(id)}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.error) {
        setError(j?.error || "Failed to load application details");
        setDetail(null);
        return;
      }
      const app = j?.application as PartnerApplication | undefined;
      if (app && typeof app === "object") {
        setDetail(app);
      } else {
        setError("Invalid application details");
        setDetail(null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load application details");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function approve(id: string) {
    try {
      setError("");
      setInfo("");
      const r = await fetch(`/api/platform/partners/applications/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet": account?.address || "",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ action: "approve" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.error) {
        setError(j?.error || "Failed to approve application");
        return;
      }
      setInfo(`Approved ${id}. Brand ${String(j?.brandKey || "")} ensured in index and config updated.`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Approve failed");
    }
  }

  async function syncBrandConfig(id: string) {
    try {
      setError("");
      setInfo("");
      const r = await fetch(`/api/platform/partners/applications/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet": account?.address || "",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ action: "sync" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.error) {
        setError(j?.error || "Failed to sync branding from application");
        return;
      }
      setInfo(`Synced branding for ${id}. Brand ${String(j?.brandKey || "")} config refreshed from application.`);
      // reload items so details reflect any changes
      await load();
    } catch (e: any) {
      setError(e?.message || "Sync failed");
    }
  }
  
  function startEdit(app: PartnerApplication) {
    setEditApp(app);
    setEditError("");
    setEditLogos({ ...(app.logos || {}) });
  }

  async function uploadLogo(kind: "app" | "favicon" | "symbol" | "footer", file: File) {
    try {
      setEditError("");
      setEditBusy(true);
      const fd = new FormData();
      fd.append("file", file);
      const target =
        kind === "app"
          ? "logo_app"
          : kind === "favicon"
          ? "logo_favicon"
          : kind === "symbol"
          ? "logo_symbol"
          : "logo_footer";
      fd.append("target", target);
      const r = await fetch("/api/public/images", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        body: fd,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.error || !Array.isArray(j?.images) || j.images.length === 0) {
        throw new Error(j?.error || "Upload failed");
      }
      const url = String(j.images[0]?.url || "");
      if (!url) throw new Error("No URL returned");
      setEditLogos((prev) => ({ ...(prev || {}), [kind]: url }));
    } catch (e: any) {
      setEditError(e?.message || "Upload failed");
    } finally {
      setEditBusy(false);
    }
  }

  async function saveEdit() {
    if (!editApp) return;
    try {
      setEditError("");
      setEditBusy(true);
      const r = await fetch(`/api/platform/partners/applications/${encodeURIComponent(editApp.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet": account?.address || "",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          action: "update",
          updates: { logos: editLogos },
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.error) {
        setEditError(j?.error || "Failed to update application");
        return;
      }
      setInfo(`Updated images for ${editApp.brandKey}.`);
      const current = editApp;
      setEditApp(null);
      await load();
      if (detail?.id === current.id) {
        await view(current.id);
      }
    } catch (e: any) {
      setEditError(e?.message || "Update failed");
    } finally {
      setEditBusy(false);
    }
  }

  async function reject(id: string) {
    try {
      setError("");
      setInfo("");
      const r = await fetch(`/api/platform/partners/applications/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet": account?.address || "",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ action: "reject" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.error) {
        setError(j?.error || "Failed to reject application");
        return;
      }
      setInfo(`Rejected ${id}.`);
      await load();
    } catch (e: any) {
      setError(e?.message || "Reject failed");
    }
  }

  return (
    <div className="glass-pane rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Applications</h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-md border text-sm" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            className="px-3 py-1.5 rounded-md border text-sm"
            onClick={async () => {
              try {
                setError("");
                setInfo("");
                const approved = (items || []).filter((it) => String(it.status || "").toLowerCase() === "approved");
                for (const it of approved) {
                  try {
                    const r = await fetch(`/api/platform/partners/applications/${encodeURIComponent(it.id)}`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                        "x-wallet": account?.address || "",
                      },
                      credentials: "include",
                      cache: "no-store",
                      body: JSON.stringify({ action: "sync" }),
                    });
                    await r.json().catch(() => ({}));
                  } catch {}
                }
                setInfo(`Synced ${approved.length} approved application${approved.length === 1 ? "" : "s"} into brand configs.`);
                await load();
              } catch (e: any) {
                setError(e?.message || "Bulk sync failed");
              }
            }}
            title="Re-apply branding from all approved applications into brand configs"
          >
            Sync All Approved
          </button>
        </div>
      </div>
      <div className="microtext text-muted-foreground">
        Review partner applications submitted from the public /partners page. Approving will create the brand key in the index and apply the provided config (branding, wallet, fees). Once approved, the brand appears in the Partners panel for container deployment.
      </div>
      {error && <div className="microtext text-red-500">{error}</div>}
      {info && <div className="microtext text-green-600">{info}</div>}

      {editApp && (
        <div className="rounded-md border p-4 bg-foreground/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">
              Edit Images — <span className="font-mono">{editApp.brandKey}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 rounded-md border text-xs"
                onClick={() => setEditApp(null)}
                disabled={editBusy}
                title="Cancel image edits"
              >
                Cancel
              </button>
              <button
                className="px-2 py-1 rounded-md border text-xs"
                onClick={saveEdit}
                disabled={editBusy}
                title="Save image URLs to application"
              >
                {editBusy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          {editError && <div className="microtext text-red-500 mt-2">{editError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <div className="rounded-md border p-2">
              <div className="microtext text-muted-foreground">App</div>
              {editLogos?.app ? (
                <div className="mt-1 space-y-1">
                  <img src={editLogos.app} alt="App Logo" className="max-h-16 object-contain" />
                  <div className="microtext font-mono truncate">{editLogos.app}</div>
                </div>
              ) : <div className="microtext">—</div>}
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-xs"
                onChange={(e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) uploadLogo("app", f);
                  (e.target as HTMLInputElement).value = "";
                }}
                disabled={editBusy}
                title="Upload App Logo"
              />
            </div>
            <div className="rounded-md border p-2">
              <div className="microtext text-muted-foreground">Favicon</div>
              {editLogos?.favicon ? (
                <div className="mt-1 space-y-1">
                  <img src={editLogos.favicon} alt="Favicon" className="max-h-16 object-contain" />
                  <div className="microtext font-mono truncate">{editLogos.favicon}</div>
                </div>
              ) : <div className="microtext">—</div>}
              <input
                type="file"
                accept="image/*,.ico"
                className="mt-2 block w-full text-xs"
                onChange={(e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) uploadLogo("favicon", f);
                  (e.target as HTMLInputElement).value = "";
                }}
                disabled={editBusy}
                title="Upload Favicon"
              />
            </div>
            <div className="rounded-md border p-2">
              <div className="microtext text-muted-foreground">Symbol</div>
              {editLogos?.symbol ? (
                <div className="mt-1 space-y-1">
                  <img src={editLogos.symbol} alt="Symbol" className="max-h-16 object-contain" />
                  <div className="microtext font-mono truncate">{editLogos.symbol}</div>
                </div>
              ) : <div className="microtext">—</div>}
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-xs"
                onChange={(e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) uploadLogo("symbol", f);
                  (e.target as HTMLInputElement).value = "";
                }}
                disabled={editBusy}
                title="Upload Symbol"
              />
            </div>
            <div className="rounded-md border p-2">
              <div className="microtext text-muted-foreground">Footer</div>
              {editLogos?.footer ? (
                <div className="mt-1 space-y-1">
                  <img src={editLogos.footer} alt="Footer" className="max-h-16 object-contain" />
                  <div className="microtext font-mono truncate">{editLogos.footer}</div>
                </div>
              ) : <div className="microtext">—</div>}
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-xs"
                onChange={(e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (f) uploadLogo("footer", f);
                  (e.target as HTMLInputElement).value = "";
                }}
                disabled={editBusy}
                title="Upload Footer"
              />
            </div>
          </div>
          <div className="microtext text-muted-foreground mt-2">
            Favicon uploads accept ICO directly or PNG (PNG is converted to .ico automatically).
          </div>
        </div>
      )}

      {/* Details viewer */}
      {detail && (
        <div className="rounded-md border p-4 bg-foreground/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">
              Application — <span className="font-mono">{detail.brandKey}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="microtext px-2 py-0.5 rounded-full border bg-foreground/10">
                {detail.status} • {new Date(Number(detail.createdAt || 0)).toLocaleString()}
              </span>
              <button
                className="px-2 py-1 rounded-md border text-xs"
                onClick={() => setDetail(null)}
                title="Close details"
              >
                Close
              </button>
            </div>
          </div>
          {detailLoading ? (
            <div className="microtext text-muted-foreground mt-2">Loading…</div>
          ) : (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="microtext text-muted-foreground">Company</div>
                <div className="text-sm">{detail.companyName || "—"}</div>
              </div>
              <div>
                <div className="microtext text-muted-foreground">Contact</div>
                <div className="text-sm">
                  {[detail.contactName, detail.contactEmail].filter(Boolean).join(" • ") || "—"}
                </div>
              </div>
              <div>
                <div className="microtext text-muted-foreground">App URL</div>
                <div className="text-sm">
                  {detail.appUrl ? (
                    <a href={detail.appUrl} className="underline" target="_blank" rel="noopener noreferrer">
                      {detail.appUrl}
                    </a>
                  ) : "—"}
                </div>
              </div>
              <div>
                <div className="microtext text-muted-foreground">Fees (bps)</div>
                <div className="text-sm">
                  Partner: {typeof detail.partnerFeeBps === "number" ? detail.partnerFeeBps : 0} •
                  Merchant: {typeof detail.defaultMerchantFeeBps === "number" ? detail.defaultMerchantFeeBps : 0}
                </div>
              </div>
              <div>
                <div className="microtext text-muted-foreground">Partner Wallet</div>
                <div className="text-sm font-mono">{detail.partnerWallet || "—"}</div>
              </div>
              <div>
                <div className="microtext text-muted-foreground">Colors</div>
                <div className="flex items-center gap-2">
                  {detail.colors?.primary ? (
                    <span className="inline-block w-5 h-5 rounded" style={{ backgroundColor: detail.colors.primary }} title={`Primary ${detail.colors.primary}`} />
                  ) : null}
                  {detail.colors?.accent ? (
                    <span className="inline-block w-5 h-5 rounded" style={{ backgroundColor: detail.colors.accent }} title={`Accent ${detail.colors.accent}`} />
                  ) : null}
                  {!detail.colors?.primary && !detail.colors?.accent ? <span className="microtext">—</span> : null}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="microtext text-muted-foreground">Logos</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                  <div className="rounded-md border p-2">
                    <div className="microtext text-muted-foreground">App</div>
                    {detail.logos?.app ? (
                      <div className="mt-1 space-y-1">
                        <img src={detail.logos.app} alt="App Logo" className="max-h-16 object-contain" />
                        <div className="microtext font-mono truncate">{detail.logos.app}</div>
                      </div>
                    ) : <div className="microtext">—</div>}
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="microtext text-muted-foreground">Favicon</div>
                    {detail.logos?.favicon ? (
                      <div className="mt-1 space-y-1">
                        <img src={detail.logos.favicon} alt="Favicon" className="max-h-16 object-contain" />
                        <div className="microtext font-mono truncate">{detail.logos.favicon}</div>
                      </div>
                    ) : <div className="microtext">—</div>}
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="microtext text-muted-foreground">Symbol</div>
                    {detail.logos?.symbol ? (
                      <div className="mt-1 space-y-1">
                        <img src={detail.logos.symbol} alt="Symbol" className="max-h-16 object-contain" />
                        <div className="microtext font-mono truncate">{detail.logos.symbol}</div>
                      </div>
                    ) : <div className="microtext">—</div>}
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="microtext text-muted-foreground">Footer</div>
                    {detail.logos?.footer ? (
                      <div className="mt-1 space-y-1">
                        <img src={detail.logos.footer} alt="Footer" className="max-h-16 object-contain" />
                        <div className="microtext font-mono truncate">{detail.logos.footer}</div>
                      </div>
                    ) : <div className="microtext">—</div>}
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="microtext text-muted-foreground">Meta</div>
                <div className="text-sm">
                  {detail.meta?.ogTitle || detail.meta?.ogDescription
                    ? [detail.meta?.ogTitle, detail.meta?.ogDescription].filter(Boolean).join(" • ")
                    : "—"}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="microtext text-muted-foreground">Notes</div>
                <div className="text-sm whitespace-pre-wrap">{detail.notes || "—"}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-foreground/5">
              <th className="text-left px-3 py-2 font-medium">Brand Key</th>
              <th className="text-left px-3 py-2 font-medium">Company</th>
              <th className="text-left px-3 py-2 font-medium">Contact</th>
              <th className="text-left px-3 py-2 font-medium">App URL</th>
              <th className="text-left px-3 py-2 font-medium">Logo</th>
              <th className="text-left px-3 py-2 font-medium">Favicon</th>
              <th className="text-left px-3 py-2 font-medium">Partner Fee (bps)</th>
              <th className="text-left px-3 py-2 font-medium">Partner Wallet</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-left px-3 py-2 font-medium">Submitted</th>
              <th className="text-left px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((app) => {
              const submitted = new Date(Number(app.createdAt || 0)).toLocaleString();
              const contact = [app.contactName, app.contactEmail].filter(Boolean).join(" • ");
              const statusBadgeClass = (() => {
                switch (String(app.status || "").toLowerCase()) {
                  case "submitted":
                    return "bg-gray-100 text-gray-700 border-gray-200";
                  case "reviewing":
                    return "bg-blue-100 text-blue-700 border-blue-200";
                  case "approved":
                    return "bg-green-100 text-green-700 border-green-200";
                  case "rejected":
                    return "bg-red-100 text-red-700 border-red-200";
                  default:
                    return "bg-foreground/10 text-foreground/80 border-foreground/20";
                }
              })();
              return (
                <tr key={app.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{app.brandKey}</td>
                  <td className="px-3 py-2">{app.companyName || "—"}</td>
                  <td className="px-3 py-2">{contact || "—"}</td>
                  <td className="px-3 py-2">
                    {app.appUrl ? (
                      <a href={app.appUrl} className="underline" target="_blank" rel="noopener noreferrer">
                        {app.appUrl}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {app.logos?.app ? (
                      <div className="flex items-center gap-2">
                        <img src={app.logos.app} alt="Logo" className="h-6 w-auto object-contain rounded border" />
                        <span className="microtext font-mono truncate max-w-[160px]">{app.logos.app}</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {app.logos?.favicon ? (
                      <div className="flex items-center gap-2">
                        <img src={app.logos.favicon} alt="Favicon" className="h-6 w-6 object-contain rounded border" />
                        <span className="microtext font-mono truncate max-w-[160px]">{app.logos.favicon}</span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2">{typeof app.partnerFeeBps === "number" ? app.partnerFeeBps : 0}</td>
                  <td className="px-3 py-2 font-mono">{app.partnerWallet || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusBadgeClass}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{submitted}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 rounded-md border text-xs"
                        onClick={() => startEdit(app)}
                        title="Edit application images"
                      >
                        Edit
                      </button>
                      <button
                        className="px-2 py-1 rounded-md border text-xs"
                        onClick={() => view(app.id)}
                        title="View application details"
                      >
                        View
                      </button>
                      <button
                        className="px-2 py-1 rounded-md border text-xs"
                        onClick={() => syncBrandConfig(app.id)}
                        title="Sync branding from application into brand config"
                      >
                        Sync
                      </button>
                      <button
                        className="px-2 py-1 rounded-md border text-xs"
                        onClick={() => approve(app.id)}
                        disabled={String(app.status || "").toLowerCase() === "approved"}
                        title="Approve application: create brand key and persist config"
                      >
                        Approve
                      </button>
                      <button
                        className="px-2 py-1 rounded-md border text-xs"
                        onClick={() => reject(app.id)}
                        disabled={String(app.status || "").toLowerCase() === "rejected"}
                        title="Reject application"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!items || items.length === 0) && (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={11}>
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
