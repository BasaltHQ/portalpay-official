"use client";

import React, { useEffect, useState, lazy, Suspense } from "react";
import { useActiveAccount } from "thirdweb/react";
import { createPortal } from "react-dom";
import { Wand2, Plus } from "lucide-react";

const Form1099DAPanel = lazy(() => import("@/components/reports/Form1099DAPanel"));

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
  const [activeIndustryPack, setActiveIndustryPack] = useState<string>('general');
  const [cannabisState, setCannabisState] = useState<string | null>(null);

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
      
      setActiveIndustryPack(cfg?.config?.industryPack || 'general');
      const ip = (cfg?.config as any)?.industryParams?.cannabisCompliance;
      if (ip?.activeProvider) {
          const sc = ip.activeProvider === 'metrc' ? ip.metrc?.stateCode : ip.activeProvider === 'biotrack' ? ip.biotrack?.stateCode : null;
          setCannabisState(sc);
      } else {
          setCannabisState(null);
      }

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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      {/* Header Area */}
      <div className="md:col-span-12 flex items-center justify-between shrink-0 mb-2">
        <div>
           <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[var(--pp-secondary)]" /> 
             Tax Management
           </h3>
           <div className="text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-1">Configure automated routing or custom jurisdictions.</div>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/[0.05] hover:bg-foreground/[0.06] hover:border-foreground/10 text-[9px] uppercase font-bold tracking-wider transition-all shadow-sm" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh Config"}
        </button>
      </div>

      <div className="md:col-span-12 rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <label className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-2 block ml-1">Compliance Provider</label>
          <div className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider ml-1">TaxJar, Avalara, or Custom Integrations</div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <input
            className="w-full sm:w-64 h-12 px-4 rounded-xl bg-foreground/[0.03] border border-foreground/5 focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs md:text-sm font-medium"
            placeholder="TaxJar / Avalara / Custom"
            value={provider?.name || ""}
            onChange={(e) => setProviderName(e.target.value)}
          />
          <span className={`px-5 py-3.5 rounded-xl text-[9px] font-bold uppercase tracking-wider shrink-0 w-full sm:w-auto text-center ${provider?.apiKeySet ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
            {provider?.apiKeySet ? "API Linked" : "No API"}
          </span>
        </div>
      </div>

      {/* Split View */}
      <div className="md:col-span-12 lg:col-span-6 flex flex-col h-full min-h-[400px]">
        <div className="rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 h-full shadow-sm flex flex-col">
          <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-6">Configured Jurisdictions</div>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
            {(configJurisdictions || []).map((j) => (
              <div key={j.code} className="flex items-center justify-between rounded-2xl bg-foreground/[0.03] border border-foreground/[0.05] p-4 group hover:bg-foreground/[0.04] transition-colors">
                <div>
                  <div className="text-sm font-semibold text-foreground/90">{j.name}</div>
                  <div className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider mt-1.5">{j.code} • <span className="text-[var(--pp-secondary)]">{Math.round(j.rate * 10000) / 100}%</span></div>
                </div>
                <button className="px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-[9px] font-bold uppercase tracking-wider text-red-400 transition-colors opacity-80 group-hover:opacity-100" onClick={() => removeJurisdiction(j.code)}>Remove</button>
              </div>
            ))}
            {(configJurisdictions || []).length === 0 && (
              <div className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider p-8 text-center rounded-2xl border border-dashed border-foreground/10 flex items-center justify-center h-32">No jurisdictions configured yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="md:col-span-12 lg:col-span-6 flex flex-col h-full">
        <div className="rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 h-full shadow-sm">
          <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-6">Compact Tax Setup</div>
          <div className="space-y-8">
            <div>
              <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2.5 block ml-1">ZIP/Postal Code Lookup</label>
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <input
                  className="flex-1 h-12 px-4 rounded-xl bg-foreground/[0.03] border border-foreground/5 focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs font-medium"
                  placeholder="e.g., 90210, SW1A 1AA"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
                <button
                  className="px-6 py-3 rounded-xl bg-foreground/[0.03] border border-foreground/[0.05] hover:bg-foreground/[0.06] text-[9px] font-bold uppercase tracking-wider transition-all w-full sm:w-auto shadow-sm"
                  onClick={lookupZipRate}
                  disabled={zipLoading}
                >
                  {zipLoading ? "Looking up…" : "Lookup"}
                </button>
              </div>
              {zipRate !== null && (
                <div className="mt-3 flex flex-col sm:flex-row items-stretch gap-3 p-3.5 bg-foreground/[0.03] rounded-2xl border border-foreground/[0.05]">
                  <span className="flex-1 flex items-center text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 pl-2">Rate: <b className="ml-1 text-foreground">{Math.round((zipRate || 0) * 10000) / 100}%</b></span>
                  <button
                    className="px-5 py-2.5 rounded-xl bg-[var(--pp-secondary)] hover:bg-[var(--pp-secondary)]/90 text-white text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center w-full sm:w-auto shadow-[0_0_15px_var(--pp-secondary)]/20"
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
                    <Plus className="h-3 w-3 mr-1.5" /> Add Jurisdiction
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2.5 block ml-1">Popular Jurisdiction Presets</label>
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <select className="flex-1 h-12 px-4 rounded-xl bg-foreground/[0.03] border border-foreground/5 focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs font-medium truncate" id="tax-preset-select">
                  {(catalog || []).map((j) => (
                    <option key={j.code} value={j.code}>{j.name} ({Math.round(j.rate * 10000) / 100}%)</option>
                  ))}
                </select>
                <button
                  className="px-6 py-3 rounded-xl bg-[var(--pp-secondary)] hover:bg-[var(--pp-secondary)]/90 text-white text-[9px] font-bold uppercase tracking-wider shadow-[0_0_15px_var(--pp-secondary)]/20 flex items-center justify-center w-full sm:w-auto transition-all"
                  onClick={() => {
                    const sel = document.getElementById("tax-preset-select") as HTMLSelectElement | null;
                    const code = sel?.value || "";
                    const found = (catalog || []).find((x) => x.code === code);
                    if (found) addJurisdiction(found);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1.5" /> Add Selected
                </button>
              </div>
              {(catalog || []).length === 0 && (
                <div className="text-[8px] md:text-[9px] text-muted-foreground/50 uppercase font-bold tracking-wider mt-2 ml-2">Presets unavailable</div>
              )}
            </div>

            <div>
              <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2.5 block ml-1">Custom Jurisdiction Builder</label>
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <button
                  className="px-6 py-3.5 rounded-xl bg-foreground/[0.03] border border-foreground/[0.05] hover:bg-foreground/[0.06] text-[9px] font-bold uppercase tracking-wider flex items-center justify-center w-full sm:w-auto transition-all text-foreground/80 shadow-sm"
                  onClick={() => setCustomOpen(true)}
                  type="button"
                >
                  <Wand2 className="h-3.5 w-3.5 mr-2 text-[var(--pp-secondary)]" /> Build Custom Jurisdiction
                </button>
              </div>
              <div className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider mt-2.5 ml-2 max-w-sm leading-relaxed">
                Define a custom jurisdiction by combining multiple tax components (e.g., sales + excise).
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-12 rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-2 block ml-1">Default Jurisdiction</div>
          <div className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider ml-1">
            Current: <span className="text-[var(--pp-secondary)] ml-1">{defaultJurisdictionCode ? defaultJurisdictionCode : "None"}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
          <select
            className="w-full md:w-64 h-12 px-4 rounded-xl bg-foreground/[0.03] border border-foreground/5 focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs font-medium"
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
            className="px-6 py-3 rounded-xl bg-[var(--pp-secondary)] hover:bg-[var(--pp-secondary)]/90 text-white text-[9px] font-bold uppercase tracking-wider shadow-[0_0_15px_var(--pp-secondary)]/20 transition-all w-full sm:w-auto"
            onClick={() => setDefaultJurisdiction(defaultJurisdictionCode)}
            disabled={!defaultJurisdictionCode}
          >
            Save Default
          </button>
        </div>
      </div>

      {activeIndustryPack === 'cannabis' && (
        <div className="md:col-span-12 rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.02] p-6 md:p-8 mt-2 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          <label className="text-[10px] md:text-xs uppercase font-bold tracking-[0.2em] text-emerald-400 block mb-2 relative z-10 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Cannabis Compliance Taxation
          </label>
          <div className="text-[8px] md:text-[9px] text-emerald-500/70 uppercase font-bold tracking-wider mb-6 relative z-10 max-w-3xl leading-relaxed">
            Your store is operating under the Cannabis Industry Pack. Tax policies are automatically configured to comply with state requirements. 
            Do NOT add excise taxes manually to your regular tax catalog.
          </div>
          {cannabisState === 'IL' ? (
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/10 relative z-10">
              <h4 className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-emerald-300 mb-4 border-b border-emerald-500/20 pb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> State Active: Illinois
              </h4>
              <p className="text-[8px] md:text-[9px] uppercase font-bold tracking-wider text-emerald-100/50 mb-4">Automated item-level THC potency excise tracking is initialized.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex justify-between items-center bg-foreground/[0.02] p-3 rounded-xl border border-emerald-500/5"><span className="text-[9px] uppercase font-bold tracking-wider text-emerald-300/80">&lt; 35% THC Flower &amp; Extracts</span><span className="text-xs font-mono font-bold text-emerald-400">10% Excise</span></div>
                <div className="flex justify-between items-center bg-foreground/[0.02] p-3 rounded-xl border border-emerald-500/5"><span className="text-[9px] uppercase font-bold tracking-wider text-emerald-300/80">&ge; 35% THC Extracts</span><span className="text-xs font-mono font-bold text-emerald-400">25% Excise</span></div>
                <div className="flex justify-between items-center bg-foreground/[0.02] p-3 rounded-xl border border-emerald-500/5 md:col-span-2"><span className="text-[9px] uppercase font-bold tracking-wider text-emerald-300/80">Infused Edibles/Liquids</span><span className="text-xs font-mono font-bold text-emerald-400">20% Excise</span></div>
              </div>
            </div>
          ) : cannabisState ? (
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/10 relative z-10">
              <h4 className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-emerald-300 mb-4 border-b border-emerald-500/20 pb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> State Active: {cannabisState}
              </h4>
              <p className="text-[8px] md:text-[9px] uppercase font-bold tracking-wider text-emerald-100/50 leading-relaxed max-w-4xl">
                Configure standard state-level cannabis excise taxes inside your jurisdictions catalog below. 
                They will automatically apply uniformly at checkout for any items marked 'Cannabis'. 
                Additional POS dynamic rate overrides are not strictly required for {cannabisState} standard operations.
              </p>
            </div>
          ) : (
            <div className="bg-amber-500/[0.03] border border-amber-500/20 p-6 rounded-2xl mt-4 relative z-10 shadow-sm">
              <h4 className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-amber-500 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Compliance Link Required
              </h4>
              <p className="text-[8px] md:text-[9px] uppercase font-bold tracking-wider text-amber-500/70 leading-relaxed max-w-3xl">
                No active compliance provider is configured. Go to Cannabis Integrations in your site config and link METRC or BioTrack to designate your active state and initialize automated taxation.
              </p>
            </div>
          )}
        </div>
      )}

      {activeIndustryPack !== 'cannabis' && (
        <div className="md:col-span-12 text-[8px] md:text-[9px] text-muted-foreground/40 uppercase font-bold tracking-[0.15em] mt-4 border-t border-foreground/5 pt-6 text-center">
          Looking for automated compliant taxation? Switch your store to the Cannabis Industry Pack in Advanced Settings to activate METRC/BioTrack native tax routing.
        </div>
      )}

      {error && <div className="md:col-span-12 text-[10px] uppercase font-bold tracking-wider text-red-500 mt-2">{error}</div>}

      {customOpen && typeof window !== "undefined"
        ? createPortal(
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-foreground/[0.05] bg-[#0a0a0a] p-8 relative shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--pp-secondary)] opacity-10 blur-[80px] pointer-events-none" />
              <button
                onClick={() => setCustomOpen(false)}
                className="absolute right-6 top-6 h-10 w-10 rounded-full border border-foreground/10 bg-foreground/[0.02] hover:bg-foreground/5 text-muted-foreground hover:text-foreground shadow-sm flex items-center justify-center transition-all z-10"
                title="Close"
                aria-label="Close custom jurisdiction builder"
              >
                ✕
              </button>
              <div className="text-xs md:text-sm uppercase font-bold tracking-[0.2em] text-foreground mb-8 flex items-center gap-2 relative z-10">
                 <div className="w-2 h-2 rounded-full bg-[var(--pp-secondary)]" />
                 Build Custom Jurisdiction
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="md:col-span-2">
                  <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2 block ml-1">Name</label>
                  <input
                    id="custom-jurisdiction-name"
                    className="w-full h-12 px-4 rounded-xl bg-foreground/[0.03] border border-foreground/5 focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs font-medium"
                    placeholder="e.g., Springfield (IL) Cannabis"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2 block ml-1">Code (optional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      className="flex-1 h-12 px-4 rounded-xl bg-foreground/[0.03] border border-foreground/5 focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs font-mono font-medium"
                      placeholder="Auto-generated if empty"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      maxLength={16}
                    />
                    <button
                      type="button"
                      className="h-12 w-12 rounded-xl border border-foreground/5 bg-foreground/[0.03] flex items-center justify-center hover:bg-foreground/[0.06] transition-all text-muted-foreground hover:text-foreground shrink-0 shadow-sm"
                      onClick={() => setCustomCode(genCodeFromName(customName))}
                      title="Auto-generate code from name"
                      aria-label="Auto-generate code"
                    >
                      <Wand2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider mt-2 ml-1">Max 16 chars. Allowed: A-Z, 0-9, dash. Example: CUS-SPRINGFIELD</div>
                </div>
                
                <div className="md:col-span-2 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Tax Components</label>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border border-foreground/[0.05] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-[9px] font-bold uppercase tracking-wider flex items-center transition-all shadow-sm"
                      onClick={() =>
                        setCustomComponents((prev) => [...prev, { code: "", name: "", ratePct: "" }])
                      }
                    >
                      <Plus className="h-3 w-3 mr-1.5" /> Add Component
                    </button>
                  </div>
                  <div className="space-y-3">
                    {customComponents.map((c, idx) => (
                      <div key={idx} className="rounded-2xl border border-foreground/[0.05] bg-foreground/[0.02] p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center group">
                        <input
                          className="md:col-span-2 h-10 px-3 border-none rounded-xl bg-foreground/[0.03] focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none font-mono text-[10px] font-medium"
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
                          className="md:col-span-6 h-10 px-3 border-none rounded-xl bg-foreground/[0.03] focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none text-[10px] font-medium"
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
                            className="h-10 w-full px-3 border-none rounded-xl bg-foreground/[0.03] focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none text-right font-mono text-[10px] font-medium"
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
                              className="h-10 px-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-[9px] font-bold uppercase tracking-wider text-red-400 transition-colors opacity-80 group-hover:opacity-100"
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
                      <div className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider p-4 text-center rounded-2xl border border-dashed border-foreground/10">No components yet. Add at least one.</div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2 rounded-2xl border border-[var(--pp-secondary)]/20 bg-[var(--pp-secondary)]/[0.02] p-4 flex items-center justify-between mt-4 shadow-sm">
                  <div className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground ml-1">Total Compound Rate</div>
                  <div className="text-lg font-mono font-bold text-[var(--pp-secondary)]">
                    {Math.round(totalCustomRateFraction() * 10000) / 100}%
                  </div>
                </div>
              </div>
              
              {customError && <div className="text-[9px] uppercase font-bold tracking-wider text-red-500 mt-4 relative z-10">{customError}</div>}
              
              <div className="mt-8 flex items-center justify-end gap-3 relative z-10">
                <button className="px-6 py-3 rounded-xl border border-foreground/[0.05] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-[9px] font-bold uppercase tracking-wider transition-all" onClick={() => setCustomOpen(false)}>Cancel</button>
                <button className="px-8 py-3 rounded-xl bg-[var(--pp-secondary)] hover:bg-[var(--pp-secondary)]/90 text-white text-[9px] font-bold uppercase tracking-wider shadow-[0_0_20px_var(--pp-secondary)]/30 transition-all" onClick={saveCustomJurisdiction}>
                  Save Jurisdiction
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}

      {/* ─── 1099-DA Digital Asset Tax Reporting ─── */}
      <div className="md:col-span-12 my-6">
        <div className="h-px bg-foreground/5 w-full" />
      </div>
      
      <div className="md:col-span-12 rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-8 flex flex-col gap-6 shadow-sm overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-[10px] md:text-xs uppercase font-bold tracking-[0.2em] text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              1099-DA Digital Asset Reporting
            </h2>
            <p className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase font-bold tracking-wider mt-2 ml-1">
              IRS Form 1099-DA — Digital Asset Proceeds From Broker Transactions
            </p>
          </div>
          <span className="px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm shrink-0">
            PDAP Compliant
          </span>
        </div>
        <div className="relative z-10 mt-2">
          <Suspense fallback={
            <div className="p-8 text-center text-[10px] uppercase font-bold tracking-wider text-muted-foreground border border-dashed border-foreground/10 rounded-2xl">
              Loading 1099-DA module…
            </div>
          }>
            <Form1099DAPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
