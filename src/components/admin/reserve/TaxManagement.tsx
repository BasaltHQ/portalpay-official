"use client";

import React, { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { createPortal } from "react-dom";
import { Wand2, Plus } from "lucide-react";

type TaxCatalogEntry = {
  code: string;
  name: string;
  rate: number;
  country?: string;
  type?: string;
  components?: { code: string; name: string; rate: number }[];
};

export function TaxManagement() {
  const account = useActiveAccount();
  const [catalog, setCatalog] = useState<TaxCatalogEntry[]>([]);
  const [configJurisdictions, setConfigJurisdictions] = useState<TaxCatalogEntry[]>([]);
  const [provider, setProvider] = useState<{ name?: string; apiKeySet?: boolean }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [zip, setZip] = useState("");
  const [zipRate, setZipRate] = useState<number | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipMeta, setZipMeta] = useState<{ state?: string; region_name?: string } | null>(null);
  const [defaultJurisdictionCode, setDefaultJurisdictionCode] = useState<string>("");

  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [customComponents, setCustomComponents] = useState<Array<{ code: string; name: string; ratePct: string }>>([
    { code: "SALES", name: "Sales Tax", ratePct: "" },
  ]);
  const [customError, setCustomError] = useState("");

  useEffect(() => {
    try {
      if (customOpen) {
        setTimeout(() => {
          try {
            (document.getElementById("custom-jurisdiction-name") as HTMLInputElement | null)?.focus();
          } catch { }
        }, 0);
      }
    } catch { }
  }, [customOpen]);

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      const cfgRes = await fetch("/api/site/config", { headers: { "x-wallet": account?.address || "" } });
      const cfg = await cfgRes.json().catch(() => ({}));
      const tc = (cfg?.config?.taxConfig || {}) as { jurisdictions?: TaxCatalogEntry[]; provider?: { name?: string; apiKeySet?: boolean } };
      setConfigJurisdictions(Array.isArray(tc.jurisdictions) ? tc.jurisdictions : []);
      setProvider(tc.provider || {});
      setDefaultJurisdictionCode(typeof (tc as any)?.defaultJurisdictionCode === "string" ? (tc as any).defaultJurisdictionCode : "");

      const catRes = await fetch("/api/tax/catalog");
      const cat = await catRes.json().catch(() => ({}));
      setCatalog(Array.isArray(cat?.jurisdictions) ? cat.jurisdictions : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load tax data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [account?.address]);

  async function addJurisdiction(j: TaxCatalogEntry) {
    try {
      setError("");
      const next = [...configJurisdictions.filter((x) => x.code !== j.code), j];
      const r = await fetch("/api/site/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet": account?.address || "" },
        body: JSON.stringify({ taxConfig: { jurisdictions: next, provider } }),
      });
      const jx = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(jx?.error || "Failed to add jurisdiction");
        return;
      }
      setConfigJurisdictions(next);
    } catch (e: any) {
      setError(e?.message || "Failed to add jurisdiction");
    }
  }

  async function removeJurisdiction(code: string) {
    try {
      setError("");
      const next = configJurisdictions.filter((x) => x.code !== code);
      const r = await fetch("/api/site/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet": account?.address || "" },
        body: JSON.stringify({ taxConfig: { jurisdictions: next, provider } }),
      });
      const jx = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(jx?.error || "Failed to remove jurisdiction");
        return;
      }
      setConfigJurisdictions(next);
    } catch (e: any) {
      setError(e?.message || "Failed to remove jurisdiction");
    }
  }

  async function setProviderName(name: string) {
    try {
      const nextProv = { ...provider, name };
      const r = await fetch("/api/site/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet": account?.address || "" },
        body: JSON.stringify({ taxConfig: { jurisdictions: configJurisdictions, provider: nextProv } }),
      });
      const jx = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(jx?.error || "Failed to set provider");
        return;
      }
      setProvider(nextProv);
    } catch (e: any) {
      setError(e?.message || "Failed to set provider");
    }
  }

  async function setDefaultJurisdiction(code: string) {
    try {
      const nextCode = (code || "").slice(0, 16);
      const r = await fetch("/api/site/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet": account?.address || "" },
        body: JSON.stringify({ taxConfig: { jurisdictions: configJurisdictions, provider, defaultJurisdictionCode: nextCode } }),
      });
      const jx = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(jx?.error || "Failed to set default jurisdiction");
        return;
      }
      setDefaultJurisdictionCode(nextCode);
    } catch (e: any) {
      setError(e?.message || "Failed to set default jurisdiction");
    }
  }

  async function lookupZipRate() {
    try {
      setZipLoading(true);
      setError("");
      setZipRate(null);
      setZipMeta(null);
      const zipTrim = String(zip || "").trim();
      if (!zipTrim) {
        setError("Enter a ZIP/Postal code");
        return;
      }
      // Use backend proxy to avoid CORS issues with external Tax Rates API
      const res = await fetch(`/api/tax/lookup?zip=${encodeURIComponent(zipTrim)}`);
      const j = await res.json().catch(() => ({}));

      if (!j.ok) {
        setError(j?.error === "rate_not_found" ? "Rate not found for ZIP" : (j?.error || "Failed to lookup ZIP"));
        setZipRate(null);
        return;
      }

      const rate = Number(j?.rate ?? j?.data?.combined_rate ?? 0);
      if (!Number.isFinite(rate) || rate <= 0) {
        setError("Rate not found for ZIP");
        setZipRate(null);
        return;
      }
      setZipRate(Math.min(1, rate));
      const st = typeof j?.data?.state === "string" ? j.data.state : undefined;
      const rn = typeof j?.data?.region_name === "string" ? j.data.region_name : undefined;
      setZipMeta({ state: st, region_name: rn });
    } catch (e: any) {
      setError(e?.message || "Failed to lookup ZIP");
      setZipRate(null);
      setZipMeta(null);
    } finally {
      setZipLoading(false);
    }
  }


  function genCodeFromName(n: string): string {
    const slug = String(n || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const base = `CUS-${slug}`.slice(0, 16);
    const existing = new Set<string>([...configJurisdictions, ...catalog].map((x) => String(x.code || "")));
    if (!existing.has(base)) return base;
    let code = base;
    let i = 0;
    while (existing.has(code) && i < 100) {
      const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2);
      code = `${base.slice(0, Math.max(0, 16 - 3))}-${suffix}`;
      i++;
    }
    return code.slice(0, 16);
  }

  function totalCustomRateFraction(): number {
    try {
      const sum = (customComponents || []).reduce((s, c) => s + Math.max(0, Math.min(100, Number(c.ratePct || 0))) / 100, 0);
      return Math.max(0, Math.min(1, sum));
    } catch {
      return 0;
    }
  }

  async function saveCustomJurisdiction() {
    try {
      setCustomError("");
      const name = String(customName || "").trim();
      if (!name) {
        setCustomError("Enter a jurisdiction name");
        return;
      }
      const comps = (customComponents || []).map((c) => ({
        code: String(c.code || "").toUpperCase().slice(0, 16),
        name: String(c.name || "").trim().slice(0, 80),
        rate: Math.max(0, Math.min(1, Number(c.ratePct || 0) / 100)),
      })).filter((c) => c.code && c.name && Number.isFinite(c.rate));
      if (!comps.length) {
        setCustomError("Add at least one tax component with a valid rate");
        return;
      }
      const rate = Math.max(0, Math.min(1, comps.reduce((s, c) => s + (Number(c.rate) || 0), 0)));
      const rawCode = String(customCode || "").toUpperCase().replace(/[^A-Z0-9-]+/g, "-").slice(0, 16);
      const code = rawCode || genCodeFromName(name);
      await addJurisdiction({ code, name: name.slice(0, 80), rate, components: comps });
      setCustomOpen(false);
      setCustomName("");
      setCustomCode("");
      setCustomComponents([{ code: "SALES", name: "Sales Tax", ratePct: "" }]);
    } catch (e: any) {
      setCustomError(e?.message || "Failed to save custom jurisdiction");
    }
  }

  return (
    <div className="glass-pane rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tax Management</h3>
        <button className="px-2 py-1 rounded-md border text-xs" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <div className="microtext text-muted-foreground">
        Provider: <input
          className="inline-block h-7 px-2 py-1 border rounded-md bg-background text-xs ml-1"
          placeholder="TaxJar / Avalara / Custom"
          value={provider?.name || ""}
          onChange={(e) => setProviderName(e.target.value)}
        />
        <span className="ml-2 badge-soft">{provider?.apiKeySet ? "API Key Set" : "No API Key"}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-md border p-3">
          <div className="text-sm font-medium mb-2">Configured Jurisdictions</div>
          <div className="space-y-2">
            {(configJurisdictions || []).map((j) => (
              <div key={j.code} className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <div className="text-sm font-semibold">{j.name}</div>
                  <div className="microtext text-muted-foreground">{j.code} • {Math.round(j.rate * 10000) / 100}%</div>
                </div>
                <button className="px-2 py-1 rounded-md border text-xs" onClick={() => removeJurisdiction(j.code)}>Remove</button>
              </div>
            ))}
            {(configJurisdictions || []).length === 0 && (
              <div className="microtext text-muted-foreground">No jurisdictions configured yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-md border p-3">
          <div className="text-sm font-medium mb-2">Compact Tax Setup</div>
          <div className="space-y-3">
            <div>
              <label className="microtext text-muted-foreground">ZIP/Postal Code Lookup</label>
              <div className="mt-1 flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  className="flex-1 h-9 px-3 py-1 border rounded-md bg-background"
                  placeholder="e.g., 90210, SW1A 1AA"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
                <button
                  className="px-3 py-1.5 rounded-md border text-sm w-full sm:w-auto"
                  onClick={lookupZipRate}
                  disabled={zipLoading}
                >
                  {zipLoading ? "Looking up…" : "Lookup"}
                </button>
              </div>
              {zipRate !== null && (
                <div className="microtext text-muted-foreground mt-1 flex flex-col sm:flex-row items-stretch gap-2">
                  <span>Rate: {Math.round((zipRate || 0) * 10000) / 100}%</span>
                  <button
                    className="px-3 py-1.5 rounded-md border text-sm flex items-center w-full sm:w-auto"
                    onClick={() => {
                      const zipTrim = String(zip || "").trim();
                      const st = zipMeta?.state ? String(zipMeta.state).toUpperCase() : "";
                      const rn = zipMeta?.region_name ? String(zipMeta.region_name) : "";
                      const codeBase = st ? `US-${st}-${zipTrim}` : `US-${zipTrim}`;
                      const code = codeBase.slice(0, 16);
                      const nameBase = rn ? `${rn} (${st || "US"})` : `Postal ${zipTrim}`;
                      const name = nameBase.slice(0, 80);
                      addJurisdiction({ code, name, rate: Math.max(0, Math.min(1, zipRate || 0)) });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Jurisdiction
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="microtext text-muted-foreground">Popular Jurisdiction Presets</label>
              <div className="mt-1 flex flex-col sm:flex-row items-stretch gap-2">
                <select className="w-full sm:w-64 h-9 px-3 py-1 border rounded-md bg-background truncate" id="tax-preset-select">
                  {(catalog || []).map((j) => (
                    <option key={j.code} value={j.code}>{j.name} ({Math.round(j.rate * 10000) / 100}%)</option>
                  ))}
                </select>
                <button
                  className="px-3 py-1.5 rounded-md border text-sm flex items-center w-full sm:w-auto"
                  onClick={() => {
                    const sel = document.getElementById("tax-preset-select") as HTMLSelectElement | null;
                    const code = sel?.value || "";
                    const found = (catalog || []).find((x) => x.code === code);
                    if (found) addJurisdiction(found);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Selected
                </button>
              </div>
              {(catalog || []).length === 0 && (
                <div className="microtext text-muted-foreground mt-1">Presets unavailable</div>
              )}
            </div>

            <div>
              <label className="microtext text-muted-foreground">Custom Jurisdiction Builder</label>
              <div className="mt-1 flex flex-col sm:flex-row items-stretch gap-2">
                <button
                  className="px-3 py-1.5 rounded-md border text-sm flex items-center w-full sm:w-auto"
                  onClick={() => setCustomOpen(true)}
                  type="button"
                >
                  <Wand2 className="h-4 w-4 mr-1" /> Build Custom Jurisdiction
                </button>
              </div>
              <div className="microtext text-muted-foreground mt-1">
                Define a custom jurisdiction by combining multiple tax components (e.g., sales + excise).
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border p-3">
        <div className="text-sm font-medium mb-2">Default Jurisdiction</div>
        <div className="microtext text-muted-foreground mb-2">
          Current: {defaultJurisdictionCode ? defaultJurisdictionCode : "None"}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <select
            className="flex-1 h-9 px-3 py-1 border rounded-md bg-background"
            value={defaultJurisdictionCode}
            onChange={(e) => setDefaultJurisdictionCode(e.target.value)}
          >
            <option value="">Select jurisdiction…</option>
            {(configJurisdictions || []).map((j) => (
              <option key={j.code} value={j.code}>
                {j.name} ({Math.round(j.rate * 10000) / 100}%)
              </option>
            ))}
          </select>
          <button
            className="px-3 py-1.5 rounded-md border text-sm w-full sm:w-auto"
            onClick={() => setDefaultJurisdiction(defaultJurisdictionCode)}
            disabled={!defaultJurisdictionCode}
          >
            Save Default
          </button>
        </div>
        <div className="microtext text-muted-foreground mt-1">
          This sets your default tax jurisdiction used when generating orders.
        </div>
      </div>

      <div className="microtext text-muted-foreground">
        Rates auto‑update via provider when configured. Catalog is a bootstrap reference; integrate a certified tax engine for production.
      </div>

      {error && <div className="microtext text-red-500">{error}</div>}

      {customOpen && typeof window !== "undefined"
        ? createPortal(
          <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
            <div className="w-full max-w-2xl rounded-md border bg-background p-4 relative">
              <button
                onClick={() => setCustomOpen(false)}
                className="absolute right-2 top-2 h-8 w-8 rounded-full border bg-white text-black shadow-sm flex items-center justify-center"
                title="Close"
                aria-label="Close custom jurisdiction builder"
              >
                ✕
              </button>
              <div className="text-lg font-semibold mb-2">Build Custom Jurisdiction</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="microtext text-muted-foreground">Name</label>
                  <input
                    id="custom-jurisdiction-name"
                    className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
                    placeholder="e.g., Springfield (IL) Cannabis"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="microtext text-muted-foreground">Code (optional)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      className="flex-1 h-9 px-3 py-1 border rounded-md bg-background font-mono"
                      placeholder="Auto-generated if empty"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      maxLength={16}
                    />
                    <button
                      type="button"
                      className="h-9 w-9 rounded-md border flex items-center justify-center hover:bg-foreground/5"
                      onClick={() => setCustomCode(genCodeFromName(customName))}
                      title="Auto-generate code from name"
                      aria-label="Auto-generate code"
                    >
                      <Wand2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="microtext text-muted-foreground mt-1">Max 16 chars. Allowed: A-Z, 0-9, dash. Example: CUS-SPRINGFIELD</div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="microtext text-muted-foreground">Tax Components</label>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-md border text-xs flex items-center"
                      onClick={() =>
                        setCustomComponents((prev) => [...prev, { code: "", name: "", ratePct: "" }])
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Component
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {customComponents.map((c, idx) => (
                      <div key={idx} className="rounded-md border p-2 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <input
                          className="md:col-span-2 h-8 px-2 py-1 border rounded-md bg-background font-mono"
                          placeholder="Code"
                          value={c.code}
                          onChange={(e) =>
                            setCustomComponents((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, code: e.target.value.toUpperCase().slice(0, 16) } : x))
                            )
                          }
                          maxLength={16}
                          title="Component code"
                        />
                        <input
                          className="md:col-span-6 h-8 px-2 py-1 border rounded-md bg-background"
                          placeholder="Component name"
                          value={c.name}
                          onChange={(e) =>
                            setCustomComponents((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                            )
                          }
                          title="Component name"
                        />
                        <div className="col-span-12 md:col-span-2 flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            className="h-8 w-full px-2 py-1 border rounded-md bg-background text-right"
                            placeholder="%"
                            value={c.ratePct}
                            onChange={(e) =>
                              setCustomComponents((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, ratePct: e.target.value } : x))
                              )
                            }
                            title="Rate (%)"
                          />
                        </div>
                        {idx > 0 ? (
                          <div className="col-span-12 md:col-span-2 flex md:justify-end justify-start mt-1 md:mt-0">
                            <button
                              type="button"
                              className="h-8 px-2 rounded-md border text-xs"
                              onClick={() =>
                                setCustomComponents((prev) => prev.filter((_x, i) => i !== idx))
                              }
                              aria-label="Remove component"
                              title="Remove"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="col-span-12 md:col-span-2" />
                        )}
                      </div>
                    ))}
                    {customComponents.length === 0 && (
                      <div className="microtext text-muted-foreground">No components yet. Add at least one.</div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 rounded-md border p-2">
                  <div className="flex items-center justify-between">
                    <span className="microtext text-muted-foreground">Total Rate</span>
                    <span className="text-sm font-semibold">
                      {Math.round(totalCustomRateFraction() * 10000) / 100}%
                    </span>
                  </div>
                  <div className="microtext text-muted-foreground">Computed as the sum of component rates, clamped to 100%.</div>
                </div>
              </div>
              {customError && <div className="microtext text-red-500 mt-2">{customError}</div>}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button className="px-3 py-1.5 rounded-md border text-sm" onClick={() => setCustomOpen(false)}>Cancel</button>
                <button className="px-3 py-1.5 rounded-md border text-sm" onClick={saveCustomJurisdiction}>
                  Save Jurisdiction
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}
    </div>
  );
}
