"use client";

import React, { useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { SUPPORTED_CURRENCIES } from "@/lib/fx";
import { CheckCircle } from "lucide-react";

type SiteConfig = {
  processingFeePct?: number;
  reserveRatios?: Record<string, number>;
  defaultPaymentToken?: "ETH" | "USDC" | "USDT" | "cbBTC" | "cbXRP" | "SOL";
  acceptCredit?: boolean;
  accumulationMode?: "fixed" | "dynamic";
  taxConfig?: {
    jurisdictions?: { code: string; name: string; rate: number; country?: string; type?: string }[];
    provider?: { name?: string; apiKeySet?: boolean };
  };
  theme?: { brandName?: string };
};

type ReserveSettingsProps = {
  walletOverride?: string;
  brandKey?: string;
};

export function ReserveSettings({ walletOverride, brandKey }: ReserveSettingsProps) {
  const account = useActiveAccount();
  const effectiveWallet = walletOverride || account?.address || "";
  const [processingFeePct, setProcessingFeePct] = useState<number>(0);
  const [storeCurrency, setStoreCurrency] = useState<string>("USD");
  const [ratios, setRatios] = useState<Record<string, number>>({
    USDC: 0.2,
    USDT: 0.2,
    cbBTC: 0.2,
    cbXRP: 0.2,
    ETH: 0.2,
    SOL: 0,
  });
  const [defaultPaymentToken, setDefaultPaymentToken] = useState<
    "ETH" | "USDC" | "USDT" | "cbBTC" | "cbXRP" | "SOL"
  >("USDC");
  const [acceptCredit, setAcceptCredit] = useState<boolean>(false);
  const [lastSavedAcceptCredit, setLastSavedAcceptCredit] = useState<boolean>(false);
  const [accumulationMode, setAccumulationMode] = useState<"fixed" | "dynamic">("fixed");
  const accModeUserChangedRef = useRef<boolean>(false);
  // Baselines to highlight unsaved changes
  const [lastSavedProcessingFeePct, setLastSavedProcessingFeePct] = useState<number>(0);
  const [lastSavedStoreCurrency, setLastSavedStoreCurrency] = useState<string>("USD");
  const [lastSavedRatios, setLastSavedRatios] = useState<Record<string, number>>({
    USDC: 0.2,
    USDT: 0.2,
    cbBTC: 0.2,
    cbXRP: 0.2,
    ETH: 0.2,
    SOL: 0,
  });
  const [lastSavedDefaultPaymentToken, setLastSavedDefaultPaymentToken] = useState<
    "ETH" | "USDC" | "USDT" | "cbBTC" | "cbXRP" | "SOL"
  >("USDC");
  const [lastSavedAccumulationMode, setLastSavedAccumulationMode] = useState<"fixed" | "dynamic">("fixed");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedPulse, setSavedPulse] = useState(false);
  const ratiosDebounceRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);

  async function postRatios(newRatios: Record<string, number>) {
    try {
      const r = await fetch("/api/site/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet": effectiveWallet,
        },
        body: JSON.stringify({ reserveRatios: newRatios }),
      });
      if (r.ok) {
        setLastSavedRatios({ ...newRatios });
        setSavedPulse(true);
        try { setTimeout(() => setSavedPulse(false), 1200); } catch { }
      } else {
        const j = await r.json().catch(() => ({}));
        setError(j?.error || "Failed to auto-save ratios");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to auto-save ratios");
    }
  }

  function schedulePostRatios(newRatios: Record<string, number>) {
    try {
      if (ratiosDebounceRef.current) {
        clearTimeout(ratiosDebounceRef.current as any);
      }
      ratiosDebounceRef.current = window.setTimeout(() => {
        postRatios(newRatios);
      }, 400) as any;
    } catch { }
  }

  useEffect(() => {
    setLoading(true);
    fetch("/api/site/config", {
      headers: {
        "x-wallet": effectiveWallet,
      },
    })
      .then((r) => r.json())
      .then((j) => {
        const cfg: SiteConfig = j?.config || {};
        if (typeof cfg.processingFeePct === "number") {
          setProcessingFeePct(cfg.processingFeePct);
          setLastSavedProcessingFeePct(cfg.processingFeePct);
        }
        if (typeof (cfg as any).storeCurrency === "string") {
          const sc = (cfg as any).storeCurrency;
          setStoreCurrency(sc);
          setLastSavedStoreCurrency(sc);
        }
        if (cfg.reserveRatios && typeof cfg.reserveRatios === "object") {
          setRatios((prev) => ({ ...prev, ...cfg.reserveRatios }));
          setLastSavedRatios({ ...lastSavedRatios, ...cfg.reserveRatios });
        }
        if (cfg.defaultPaymentToken) {
          setDefaultPaymentToken(cfg.defaultPaymentToken);
          setLastSavedDefaultPaymentToken(cfg.defaultPaymentToken);
        }
        if (cfg.accumulationMode === "dynamic" || cfg.accumulationMode === "fixed") {
          if (!accModeUserChangedRef.current) {
            setAccumulationMode(cfg.accumulationMode);
            setLastSavedAccumulationMode(cfg.accumulationMode);
            try {
              window.dispatchEvent(
                new CustomEvent("pp:accumulationModeChanged", { detail: { mode: cfg.accumulationMode } })
              );
            } catch { }
          }
        }
        if (typeof (cfg as any).acceptCredit === "boolean") {
          setAcceptCredit((cfg as any).acceptCredit);
          setLastSavedAcceptCredit((cfg as any).acceptCredit);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [effectiveWallet]);

  useEffect(() => {
    const onUpdated = (e: any) => {
      try {
        const next = e?.detail?.ratios;
        if (next && typeof next === "object") {
          setRatios((prev) => ({ ...prev, ...next }));
        }
      } catch { }
    };
    try { window.addEventListener("pp:reserveRatiosUpdated", onUpdated as any); } catch { }
    return () => {
      try { window.removeEventListener("pp:reserveRatiosUpdated", onUpdated as any); } catch { }
    };
  }, [effectiveWallet]);

  useEffect(() => {
    const onSave = () => {
      try { saveSettings(); } catch { }
    };
    try { window.addEventListener("pp:saveReserveSettings", onSave as any); } catch { }
    return () => {
      try { window.removeEventListener("pp:saveReserveSettings", onSave as any); } catch { }
    };
  }, [effectiveWallet, processingFeePct, defaultPaymentToken, accumulationMode, ratios]);

  function handleSliderChange(changedSymbol: string, newValue: number) {
    const tokens = ["USDC", "USDT", "cbBTC", "cbXRP", "ETH", "SOL"];
    const clampedValue = Math.max(0, Math.min(1, newValue));

    const remaining = 1 - clampedValue;
    const otherTokens = tokens.filter((t) => t !== changedSymbol);

    const currentOthersSum = otherTokens.reduce((sum, t) => sum + (ratios[t] || 0), 0);

    const newRatios: Record<string, number> = { [changedSymbol]: clampedValue };

    if (currentOthersSum > 0) {
      otherTokens.forEach((token) => {
        const proportion = (ratios[token] || 0) / currentOthersSum;
        newRatios[token] = remaining * proportion;
      });
    } else {
      const equalShare = remaining / otherTokens.length;
      otherTokens.forEach((token) => {
        newRatios[token] = equalShare;
      });
    }

    setRatios(newRatios);
    schedulePostRatios(newRatios);
    try { window.dispatchEvent(new CustomEvent("pp:reserveRatiosUpdated", { detail: { ratios: newRatios } })); } catch { }
  }

  async function saveSettings() {
    try {
      setSaving(true);
      setError("");
      const r = await fetch("/api/site/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet": effectiveWallet,
        },
        body: JSON.stringify({
          processingFeePct: Math.max(0, Number(processingFeePct)),
          storeCurrency,
          reserveRatios: ratios,
          defaultPaymentToken,
          accumulationMode,
          acceptCredit,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j?.error || "Failed to save");
        return;
      }
      // Successful save: update baselines from server response to ensure we have the normalized values
      const savedCfg = j?.config || {};
      if (typeof savedCfg.processingFeePct === "number") {
        setProcessingFeePct(savedCfg.processingFeePct);
        setLastSavedProcessingFeePct(savedCfg.processingFeePct);
      }
      if (typeof savedCfg.storeCurrency === "string") {
        setStoreCurrency(savedCfg.storeCurrency);
        setLastSavedStoreCurrency(savedCfg.storeCurrency);
      }
      if (savedCfg.reserveRatios && typeof savedCfg.reserveRatios === "object") {
        setRatios({ ...savedCfg.reserveRatios });
        setLastSavedRatios({ ...savedCfg.reserveRatios });
      }
      if (savedCfg.defaultPaymentToken) {
        setDefaultPaymentToken(savedCfg.defaultPaymentToken);
        setLastSavedDefaultPaymentToken(savedCfg.defaultPaymentToken);
      }
      if (savedCfg.accumulationMode) {
        setAccumulationMode(savedCfg.accumulationMode);
        setLastSavedAccumulationMode(savedCfg.accumulationMode);
      }
      if (typeof savedCfg.acceptCredit === "boolean") {
        setAcceptCredit(savedCfg.acceptCredit);
        setLastSavedAcceptCredit(savedCfg.acceptCredit);
      }
      setSavedPulse(true);
      try { setTimeout(() => setSavedPulse(false), 1500); } catch { }
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // Render loading skeleton
  if (loading) {
    return <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted/20 rounded-md w-full"></div>
      <div className="h-10 bg-muted/20 rounded-md w-full"></div>
      <div className="h-10 bg-muted/20 rounded-md w-full"></div>
    </div>;
  }

  const currentTotal = Object.values(ratios).reduce((sum, val) => sum + (val || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 relative z-10">
      
      {/* Left Column: Primary Settings */}
      <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
        
        <div className="flex items-center justify-between shrink-0">
          <h3 className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground flex items-center gap-2 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--pp-secondary)]" /> 
            Primary Settings
          </h3>
          <div className="flex items-center gap-3">
             {error && <div className="text-[9px] md:text-[10px] text-red-500 font-bold uppercase tracking-wider shrink-0">{error}</div>}
             {savedPulse && (
               <div className="rounded-full bg-[var(--pp-secondary)]/20 text-[var(--pp-secondary)] px-3 py-1.5 text-[9px] md:text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 shadow-[0_0_15px_var(--pp-secondary)]/20 shrink-0">
                 <CheckCircle className="h-3 w-3" /> Saved
               </div>
             )}
          </div>
        </div>

        {/* Accept Credit Cards (Stripe) Toggle */}
        <div className={`rounded-2xl border p-4 md:p-6 ${acceptCredit ? 'border-indigo-500/30 bg-indigo-500/[0.03]' : 'border-foreground/[0.04] bg-foreground/[0.02]'} transition-colors flex flex-col relative overflow-hidden shrink-0`}>
          {acceptCredit && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-5 blur-[50px] pointer-events-none" />}
          <div className="flex items-start justify-between relative z-10">
            <div className="pr-4 md:pr-8">
              <label className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-foreground mb-1 md:mb-2 block">Accept Credit Cards (Stripe)</label>
              <div className="text-[8px] md:text-[9px] text-muted-foreground/80 leading-relaxed uppercase tracking-wider font-semibold mt-1">
                When enabled, checkout portal locks to <strong className="text-indigo-400">USDC</strong> so Stripe can provision fiat deposits directly without a two-step on-chain swap.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={acceptCredit}
              onClick={() => {
                const next = !acceptCredit;
                setAcceptCredit(next);
                if (next) {
                  setDefaultPaymentToken("USDC");
                  setAccumulationMode("fixed");
                  accModeUserChangedRef.current = true;
                  try {
                    window.dispatchEvent(new CustomEvent("pp:accumulationModeChanged", { detail: { mode: "fixed" } }));
                  } catch { }
                }
                (async () => {
                  try {
                    const payload: any = { acceptCredit: next };
                    if (next) {
                      payload.defaultPaymentToken = "USDC";
                      payload.accumulationMode = "fixed";
                    }
                    const r = await fetch("/api/site/config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-wallet": effectiveWallet },
                      body: JSON.stringify(payload),
                    });
                    if (r.ok) {
                      setLastSavedAcceptCredit(next);
                      if (next) {
                        setLastSavedDefaultPaymentToken("USDC");
                        setLastSavedAccumulationMode("fixed");
                      }
                      setSavedPulse(true);
                      try { setTimeout(() => setSavedPulse(false), 1200); } catch { }
                    }
                  } catch { }
                })();
              }}
              className={`relative inline-flex h-6 w-11 md:h-7 md:w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--pp-secondary)] focus:ring-offset-2 focus:ring-offset-background ${
                acceptCredit ? 'bg-indigo-600' : 'bg-foreground/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 md:h-5 md:w-5 transform rounded-full bg-white transition-transform ${
                  acceptCredit ? 'translate-x-6 md:translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {acceptCredit && (
            <div className="mt-3 md:mt-4 flex gap-2 relative z-10">
              <span className="inline-flex items-center px-2 py-1 rounded text-[8px] md:text-[9px] font-bold bg-indigo-500/20 text-indigo-400 tracking-wider uppercase border border-indigo-500/30">CREDIT</span>
              <span className="inline-flex items-center px-2 py-1 rounded text-[8px] md:text-[9px] font-bold bg-blue-500/20 text-blue-400 tracking-wider uppercase border border-blue-500/30">USDC</span>
            </div>
          )}
        </div>

        {/* Store Currency & Processing Fee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 shrink-0">
          <div className="rounded-2xl border border-foreground/[0.04] bg-foreground/[0.02] p-4 md:p-6 flex flex-col justify-center">
            <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2 block ml-1 shrink-0">Store Currency</label>
            <select
              className={`w-full h-10 md:h-12 px-4 rounded-xl bg-foreground/[0.03] border-none focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs md:text-sm appearance-none cursor-pointer text-foreground ${(storeCurrency !== lastSavedStoreCurrency) ? "ring-1 ring-amber-500 border-amber-300" : ""}`}
              value={storeCurrency}
              onChange={(e) => {
                const currency = e.target.value;
                setStoreCurrency(currency);
                (async () => {
                  try {
                    const r = await fetch("/api/site/config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-wallet": effectiveWallet },
                      body: JSON.stringify({ storeCurrency: currency }),
                    });
                    if (r.ok) {
                      setLastSavedStoreCurrency(currency);
                      setSavedPulse(true);
                      try { setTimeout(() => setSavedPulse(false), 1200); } catch { }
                    }
                  } catch { }
                })();
              }}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-background text-foreground">
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            <div className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-3 ml-1">
              Global default currency. Overridable per order.
            </div>
          </div>

          <div className="rounded-2xl border border-foreground/[0.04] bg-foreground/[0.02] p-4 md:p-6 flex flex-col justify-center">
            <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2 block ml-1 shrink-0">Processing Fee (%)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              className={`w-full h-10 md:h-12 px-4 rounded-xl bg-foreground/[0.03] border-none focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs md:text-sm text-foreground placeholder:text-muted-foreground/50 ${(Math.abs((processingFeePct || 0) - (lastSavedProcessingFeePct || 0)) > 0.0001) ? "ring-1 ring-amber-500" : ""}`}
              value={processingFeePct}
              onChange={(e) => {
                const raw = Number(e.target.value || 0);
                const val = Math.max(0, raw);
                setProcessingFeePct(val);
              }}
              onBlur={() => {
                if (processingFeePct === lastSavedProcessingFeePct) return;
                (async () => {
                  try {
                    const r = await fetch("/api/site/config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-wallet": effectiveWallet },
                      body: JSON.stringify({ processingFeePct }),
                    });
                    if (r.ok) {
                      setLastSavedProcessingFeePct(processingFeePct);
                      setSavedPulse(true);
                      try { setTimeout(() => setSavedPulse(false), 1200); } catch { }
                    }
                  } catch { }
                })();
              }}
            />
            <div className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-3 ml-1 leading-relaxed">
              {(() => {
                try {
                  const ct = typeof document !== 'undefined' ? (document.documentElement?.getAttribute('data-pp-container-type') || '') : '';
                  if (ct === 'partner') return 'Added on top of base rate. Merchant receives remainder.';
                } catch {}
                return 'Base 0.5% included. This adds extra % (e.g., 2.5 = +2.5%).';
              })()}
            </div>
          </div>
        </div>

        {/* Accumulation Mode */}
        <div className="rounded-2xl border border-foreground/[0.04] bg-foreground/[0.02] p-4 md:p-6 flex flex-col justify-center shrink-0">
          <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2 block ml-1 shrink-0">Accumulation Mode</label>
          <select
            className={`w-full h-10 md:h-12 px-4 rounded-xl bg-foreground/[0.03] border-none focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs md:text-sm appearance-none cursor-pointer text-foreground ${(accumulationMode !== lastSavedAccumulationMode) ? "ring-1 ring-amber-500 border-amber-300" : ""}`}
            value={accumulationMode}
            onChange={(e) => {
              const mode = e.target.value as any;
              accModeUserChangedRef.current = true;
              setAccumulationMode(mode);
              try {
                window.dispatchEvent(new CustomEvent("pp:accumulationModeChanged", { detail: { mode } }));
              } catch { }
              (async () => {
                try {
                  const r = await fetch("/api/site/config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-wallet": effectiveWallet },
                    body: JSON.stringify({ accumulationMode: mode }),
                  });
                  if (r.ok) {
                    setLastSavedAccumulationMode(mode);
                    setSavedPulse(true);
                    try { setTimeout(() => setSavedPulse(false), 1200); } catch { }
                  }
                } catch { }
              })();
            }}
          >
            <option value="fixed" className="bg-background text-foreground">Fixed (Reconcile to Default Token)</option>
            <option value="dynamic" className="bg-background text-foreground">Dynamic (Rotate tokens based on Reserve Ratios)</option>
          </select>
          <div className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-3 ml-1 leading-relaxed">
            In Fixed mode, reconciliation uses the Default Token. In Dynamic mode, internal settlement rotates per order to match target reserve ratios.
          </div>
        </div>

        {/* Default Payment Token */}
        {accumulationMode === "fixed" && (
          <div className="rounded-2xl border border-[var(--pp-secondary)]/20 bg-[var(--pp-secondary)]/[0.02] p-4 md:p-6 flex flex-col justify-center shrink-0 animate-in fade-in zoom-in-95 duration-300">
            <label className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-[var(--pp-secondary)] mb-2 block ml-1 shrink-0">Default Payment Token</label>
            <select
              className={`w-full h-10 md:h-12 px-4 rounded-xl bg-foreground/[0.03] border-none focus:bg-foreground/[0.05] focus:ring-1 focus:ring-[var(--pp-secondary)] focus:outline-none transition-all text-xs md:text-sm appearance-none cursor-pointer text-foreground ${(defaultPaymentToken !== lastSavedDefaultPaymentToken) ? "ring-1 ring-amber-500 border-amber-300" : ""}`}
              value={defaultPaymentToken}
              onChange={(e) => {
                const token = e.target.value as any;
                setDefaultPaymentToken(token);
                (async () => {
                  try {
                    const r = await fetch("/api/site/config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "x-wallet": effectiveWallet },
                      body: JSON.stringify({ defaultPaymentToken: token }),
                    });
                    if (r.ok) {
                      setLastSavedDefaultPaymentToken(token);
                      setSavedPulse(true);
                      try { setTimeout(() => setSavedPulse(false), 1200); } catch { }
                    }
                  } catch { }
                })();
              }}
            >
              <option value="ETH" className="bg-background text-foreground">ETH (Ethereum)</option>
              <option value="USDC" className="bg-background text-foreground">USDC (USD Coin)</option>
              <option value="USDT" className="bg-background text-foreground">USDT (Tether)</option>
              <option value="cbBTC" className="bg-background text-foreground">cbBTC (Coinbase Wrapped BTC)</option>
              <option value="cbXRP" className="bg-background text-foreground">cbXRP (Coinbase Wrapped XRP)</option>
              <option value="SOL" className="bg-background text-foreground">SOL (Solana on Base)</option>
            </select>
            <div className="text-[8px] md:text-[9px] text-[var(--pp-secondary)]/60 uppercase font-semibold tracking-wider mt-3 ml-1">
              Buyers will see "Pay with {defaultPaymentToken}". Reconciliation targets this token.
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end shrink-0">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-[var(--pp-secondary)] hover:bg-[var(--pp-secondary)]/90 text-white rounded-xl text-xs md:text-sm font-bold shadow-[0_0_20px_var(--pp-secondary)]/20 transition-all disabled:opacity-50 flex items-center gap-2 tracking-wide"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>

      {/* Right Column: Dynamic Reserve Ratios */}
      <div className={`lg:col-span-5 rounded-2xl md:rounded-3xl border border-foreground/[0.04] bg-foreground/[0.02] p-4 md:p-8 backdrop-blur-sm relative overflow-hidden transition-all duration-700 flex flex-col shrink-0 ${accumulationMode !== "dynamic" ? "opacity-30 grayscale pointer-events-none" : "shadow-xl border-[var(--pp-secondary)]/20"}`}>
        {accumulationMode === "dynamic" && (
           <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--pp-secondary)] opacity-10 blur-[80px] pointer-events-none transition-opacity duration-1000 animate-in fade-in" />
        )}
        
        <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10 shrink-0">
          <h3 className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${accumulationMode === "dynamic" ? "bg-[var(--pp-secondary)] animate-pulse" : "bg-foreground/30"}`} />
            Reserve Ratios
          </h3>
          <span className={`text-[9px] md:text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg border ${Math.abs(currentTotal - 1) < 0.001 ? "text-green-500 bg-green-500/10 border-green-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20"}`}>
             Total: {currentTotal.toFixed(3)}
          </span>
        </div>

        <div className="space-y-4 md:space-y-5 relative z-10 flex-1 min-h-0">
          {["USDC", "USDT", "cbBTC", "cbXRP", "ETH", "SOL"].map((symbol) => (
            <div
              key={symbol}
              className={`space-y-2 rounded-xl border p-4 transition-colors ${Math.abs((ratios[symbol] || 0) - (lastSavedRatios[symbol] || 0)) > 0.0005
                ? "border-amber-400/50 bg-amber-500/[0.02]"
                : "border-foreground/[0.03] bg-foreground/[0.01]"
                }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs md:text-sm font-bold tracking-wide text-foreground">{symbol}</label>
                <span className="text-xs md:text-sm font-mono font-medium text-muted-foreground/80">{(ratios[symbol] || 0).toFixed(3)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                className="w-full glass-range mt-2"
                value={ratios[symbol] || 0}
                onChange={(e) => handleSliderChange(symbol, Number(e.target.value))}
              />
            </div>
          ))}
        </div>

        <div className="text-[8px] md:text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider mt-6 md:mt-8 pt-4 md:pt-6 border-t border-foreground/5 leading-relaxed relative z-10 shrink-0">
          Adjusting one slider automatically balances the others to maintain a total of 1.0. In Dynamic mode, the settlement token rotates for each subsequent purchase to fulfill these ratios over time.
        </div>
      </div>

    </div>
  );
}
