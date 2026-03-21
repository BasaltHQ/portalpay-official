"use client";

import React, { useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { CheckCircle, Plus, X } from "lucide-react";

type TipConfig = {
  presets: number[];
  defaultTip: number | null;
  allowCustom: boolean;
};

const DEFAULT_PRESETS = [0, 10, 15, 20];

type TipSettingsProps = {
  walletOverride?: string;
};

export function TipSettings({ walletOverride }: TipSettingsProps) {
  const account = useActiveAccount();
  const effectiveWallet = walletOverride || account?.address || "";

  const [presets, setPresets] = useState<number[]>(DEFAULT_PRESETS);
  const [defaultTip, setDefaultTip] = useState<number | null>(null);
  const [allowCustom, setAllowCustom] = useState(true);
  const [newPreset, setNewPreset] = useState<string>("");

  // Baselines for unsaved change detection
  const [lastSaved, setLastSaved] = useState<TipConfig>({
    presets: DEFAULT_PRESETS,
    defaultTip: null,
    allowCustom: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedPulse, setSavedPulse] = useState(false);
  const saveDebounceRef = useRef<number | null>(null);

  // Load existing tip config
  useEffect(() => {
    if (!effectiveWallet) return;
    setLoading(true);
    fetch("/api/site/config", {
      headers: { "x-wallet": effectiveWallet },
    })
      .then((r) => r.json())
      .then((j) => {
        const cfg = j?.config?.tipConfig;
        if (cfg && typeof cfg === "object") {
          if (Array.isArray(cfg.presets) && cfg.presets.length > 0) {
            const p = cfg.presets
              .map((v: any) => Number(v))
              .filter((v: number) => Number.isFinite(v) && v >= 0 && v <= 100);
            if (p.length > 0) setPresets(p);
            setLastSaved((prev) => ({ ...prev, presets: p.length > 0 ? p : prev.presets }));
          }
          if (typeof cfg.defaultTip === "number" && Number.isFinite(cfg.defaultTip)) {
            setDefaultTip(cfg.defaultTip);
            setLastSaved((prev) => ({ ...prev, defaultTip: cfg.defaultTip }));
          }
          if (typeof cfg.allowCustom === "boolean") {
            setAllowCustom(cfg.allowCustom);
            setLastSaved((prev) => ({ ...prev, allowCustom: cfg.allowCustom }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [effectiveWallet]);

  async function saveTipConfig(config: TipConfig) {
    try {
      setSaving(true);
      setError("");
      const r = await fetch("/api/site/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet": effectiveWallet,
        },
        body: JSON.stringify({ tipConfig: config }),
      });
      if (r.ok) {
        setLastSaved({ ...config });
        setSavedPulse(true);
        try {
          setTimeout(() => setSavedPulse(false), 1200);
        } catch {}
      } else {
        const j = await r.json().catch(() => ({}));
        setError(j?.error || "Failed to save");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function scheduleSave(config: TipConfig) {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current as any);
    saveDebounceRef.current = window.setTimeout(() => {
      saveTipConfig(config);
    }, 400) as any;
  }

  function addPreset() {
    const val = Number(newPreset);
    if (!Number.isFinite(val) || val < 0 || val > 100) return;
    if (presets.includes(val)) return;
    if (presets.length >= 6) return;
    const next = [...presets, val].sort((a, b) => a - b);
    setPresets(next);
    setNewPreset("");
    scheduleSave({ presets: next, defaultTip, allowCustom });
  }

  function removePreset(val: number) {
    const next = presets.filter((p) => p !== val);
    const newDefault = defaultTip === val ? null : defaultTip;
    setPresets(next);
    setDefaultTip(newDefault);
    scheduleSave({ presets: next, defaultTip: newDefault, allowCustom });
  }

  function handleDefaultChange(val: string) {
    const next = val === "none" ? null : Number(val);
    setDefaultTip(next);
    scheduleSave({ presets, defaultTip: next, allowCustom });
  }

  function handleCustomToggle(checked: boolean) {
    setAllowCustom(checked);
    scheduleSave({ presets, defaultTip, allowCustom: checked });
  }

  function resetToDefaults() {
    setPresets(DEFAULT_PRESETS);
    setDefaultTip(null);
    setAllowCustom(true);
    saveTipConfig({ presets: DEFAULT_PRESETS, defaultTip: null, allowCustom: true });
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted/20 rounded-md w-full" />
        <div className="h-10 bg-muted/20 rounded-md w-full" />
        <div className="h-10 bg-muted/20 rounded-md w-full" />
      </div>
    );
  }

  const hasChanges =
    JSON.stringify(presets) !== JSON.stringify(lastSaved.presets) ||
    defaultTip !== lastSaved.defaultTip ||
    allowCustom !== lastSaved.allowCustom;

  return (
    <div className="space-y-6">
      {/* Save confirmation pulse */}
      <div className="flex justify-end">
        {savedPulse && (
          <div className="rounded-full bg-green-600/90 text-white px-3 py-1.5 text-xs inline-flex items-center gap-1 shadow">
            <CheckCircle className="h-3 w-3" /> Saved
          </div>
        )}
      </div>

      {/* Tip Presets */}
      <div>
        <label className="text-sm font-medium">Tip Presets</label>
        <div className="microtext text-muted-foreground mt-1 mb-3">
          Configure the tip percentage options shown to customers. Up to 6 presets allowed.
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <div
              key={p}
              className={`group flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                defaultTip === p
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-foreground/[0.03] border-foreground/10"
              }`}
            >
              <span className="tabular-nums">{p}%</span>
              <button
                type="button"
                onClick={() => removePreset(p)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                title={`Remove ${p}%`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {presets.length < 6 && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={newPreset}
                onChange={(e) => setNewPreset(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPreset();
                  }
                }}
                placeholder="%"
                className="h-9 px-3 rounded-lg border bg-background text-sm w-20 tabular-nums"
                title="New preset percentage"
              />
              <button
                type="button"
                onClick={addPreset}
                disabled={!newPreset}
                className="h-9 w-9 rounded-lg border flex items-center justify-center hover:bg-foreground/5 transition-colors disabled:opacity-30"
                title="Add preset"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Default Tip */}
      <div>
        <label className="text-sm font-medium">Default Tip</label>
        <select
          className="w-full h-9 px-3 py-1 border rounded-md bg-background mt-1"
          value={defaultTip === null ? "none" : String(defaultTip)}
          onChange={(e) => handleDefaultChange(e.target.value)}
        >
          <option value="none">None (no pre-selection)</option>
          {presets.map((p) => (
            <option key={p} value={String(p)}>
              {p}%
            </option>
          ))}
        </select>
        <div className="microtext text-muted-foreground mt-1">
          Pre-selects this tip percentage for buyers when they open the payment portal.
        </div>
      </div>

      {/* Allow Custom Tip */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">Allow Custom Tip</label>
          <div className="microtext text-muted-foreground">
            Lets buyers enter their own tip percentage.
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={allowCustom}
          onClick={() => handleCustomToggle(!allowCustom)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            allowCustom ? "bg-emerald-500" : "bg-foreground/20"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              allowCustom ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {error && <div className="microtext text-red-500">{error}</div>}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={resetToDefaults}
          className="px-3 py-1.5 rounded-md border text-xs hover:bg-foreground/5 transition-colors text-muted-foreground"
        >
          Reset to Defaults
        </button>
        <button
          onClick={() => saveTipConfig({ presets, defaultTip, allowCustom })}
          disabled={saving || !hasChanges}
          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Tip Settings"}
        </button>
      </div>
    </div>
  );
}
