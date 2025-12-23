"use client";

import React, { useEffect, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Wand2 } from "lucide-react";

export function ReserveStrategy() {
  const account = useActiveAccount();
  const [modulator, setModulator] = useState<number>(0.5);
  const [applyLoading, setApplyLoading] = useState(false);
  const [error, setError] = useState("");
  const [recommendation, setRecommendation] = useState<{ recommendedToken?: string; frequency?: number } | null>(null);
  const tiltDebounceRef = useRef<number | null>(null);
  const modUpdateRef = useRef<boolean>(false);
  const saveDebounceRef = useRef<number | null>(null);
  const [accumulationMode, setAccumulationMode] = useState<"fixed" | "dynamic">("fixed");
  const rsModeUserChangedRef = useRef<boolean>(false);

  function computeTiltedRatios(base: Record<string, number>, mod: number): Record<string, number> {
    const stableTarget = Math.max(0, Math.min(1, 1 - mod));
    const growthTarget = Math.max(0, Math.min(1, mod));

    const sUSDC = Math.max(0, Number(base.USDC || 0));
    const sUSDT = Math.max(0, Number(base.USDT || 0));
    const sSum = sUSDC + sUSDT;
    const sUSDCw = sSum > 0 ? sUSDC / sSum : 0.5;
    const sUSDTw = sSum > 0 ? sUSDT / sSum : 0.5;

    const gXRPb = Math.max(0, Number(base.cbXRP || 0));
    const gETHb = Math.max(0, Number(base.ETH || 0));
    const gBTCb = Math.max(0, Number(base.cbBTC || 0));
    const wXRP = 1.2;
    const wETH = 1.0;
    const wBTC = 0.8;
    let gXRPw = gXRPb * wXRP;
    let gETHw = gETHb * wETH;
    let gBTCw = gBTCb * wBTC;
    const gSum = gXRPw + gETHw + gBTCw;
    if (gSum <= 0) {
      gXRPw = wXRP; gETHw = wETH; gBTCw = wBTC;
    }
    const gNorm = gXRPw + gETHw + gBTCw;

    const ratios: Record<string, number> = {
      USDC: Math.max(0, Math.min(1, +(stableTarget * sUSDCw).toFixed(4))),
      USDT: Math.max(0, Math.min(1, +(stableTarget * sUSDTw).toFixed(4))),
      cbXRP: Math.max(0, Math.min(1, +(growthTarget * (gXRPw / gNorm)).toFixed(4))),
      ETH: Math.max(0, Math.min(1, +(growthTarget * (gETHw / gNorm)).toFixed(4))),
      cbBTC: Math.max(0, Math.min(1, +(growthTarget * (gBTCw / gNorm)).toFixed(4))),
    };

    const sum = Object.values(ratios).reduce((s, v) => s + Number(v || 0), 0);
    if (sum > 0) {
      for (const k of Object.keys(ratios)) ratios[k] = +(ratios[k] / sum).toFixed(4);
    }
    return ratios;
  }

  function computeModulatorFromRatios(next: Record<string, number>): number {
    const approx = (a: number, b: number, eps = 0.02) => Math.abs(a - b) < eps;
    const values = {
      USDC: Number(next.USDC || 0),
      USDT: Number(next.USDT || 0),
      cbBTC: Number(next.cbBTC || 0),
      cbXRP: Number(next.cbXRP || 0),
      ETH: Number(next.ETH || 0),
    };
    const isBalancedEqual =
      approx(values.USDC, 0.2) &&
      approx(values.USDT, 0.2) &&
      approx(values.cbBTC, 0.2) &&
      approx(values.cbXRP, 0.2) &&
      approx(values.ETH, 0.2);
    if (isBalancedEqual) return 0.5;

    const stableShare = (values.USDC || 0) + (values.USDT || 0);
    const wBtc = 0.8;
    const wEth = 1.0;
    const wXrp = 1.2;
    const weightedGrowth = (values.cbBTC || 0) * wBtc + (values.ETH || 0) * wEth + (values.cbXRP || 0) * wXrp;
    const denom = stableShare + weightedGrowth;
    const growthPortion = denom > 0 ? weightedGrowth / denom : 0.5;
    return +growthPortion.toFixed(2);
  }

  async function postTiltFromCurrentConfig() {
    try {
      if (accumulationMode !== "dynamic") return; // Guard: only active in dynamic mode

      const m = Math.max(0, Math.min(1, Number(modulator || 0)));
      let ratios: Record<string, number>;
      const isCenter = Math.abs(m - 0.5) < 0.005;
      if (isCenter) {
        ratios = { USDC: 0.2, USDT: 0.2, cbBTC: 0.2, cbXRP: 0.2, ETH: 0.2 };
      } else {
        ratios = computeTiltedRatios({}, m);
      }

      // Safety check for NaN
      if (Object.values(ratios).some(v => !Number.isFinite(v))) return;

      try {
        window.dispatchEvent(new CustomEvent("pp:reserveRatiosUpdated", { detail: { ratios } }));
      } catch { }

      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current as any);
      }
      saveDebounceRef.current = window.setTimeout(async () => {
        try {
          if (!account?.address) return;
          await fetch("/api/site/config", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-wallet": account.address },
            body: JSON.stringify({ reserveRatios: ratios }),
          });
        } catch { }
      }, 500) as any; // Increased debounce to 500ms
    } catch { }
  }

  function scheduleTilt() {
    try {
      if (modUpdateRef.current) {
        modUpdateRef.current = false;
        return;
      }
      postTiltFromCurrentConfig();
    } catch { }
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/reserve/recommend", {
          headers: { "x-wallet": account?.address || "" },
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok) {
          setRecommendation({ recommendedToken: j.recommendedToken, frequency: j.frequency });
        }
      } catch { }
    })();
  }, [account?.address]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/site/config", { headers: { "x-wallet": account?.address || "" } });
        const j = await r.json().catch(() => ({}));
        const m = j?.config?.accumulationMode;
        if (m === "fixed" || m === "dynamic") {
          if (!rsModeUserChangedRef.current) setAccumulationMode(m);
        }
      } catch { }
    })();
  }, [account?.address]);

  useEffect(() => {
    const onMode = (e: any) => {
      try {
        const m = e?.detail?.mode;
        if (m === "fixed" || m === "dynamic") {
          rsModeUserChangedRef.current = true;
          setAccumulationMode(m);
        }
      } catch { }
    };
    try { window.addEventListener("pp:accumulationModeChanged", onMode as any); } catch { }
    return () => {
      try { window.removeEventListener("pp:accumulationModeChanged", onMode as any); } catch { }
    };
  }, []);

  useEffect(() => {
    scheduleTilt();
  }, [modulator, account?.address]);

  useEffect(() => {
    const onRatiosUpdated = (e: any) => {
      try {
        const next = e?.detail?.ratios;
        if (next && typeof next === "object") {
          const m = computeModulatorFromRatios(next);
          modUpdateRef.current = true;
          setModulator(m);
        }
      } catch { }
    };
    try { window.addEventListener("pp:reserveRatiosUpdated", onRatiosUpdated as any); } catch { }
    return () => {
      try { window.removeEventListener("pp:reserveRatiosUpdated", onRatiosUpdated as any); } catch { }
    };
  }, [account?.address]);

  function preset(type: "balanced" | "stable" | "btc_hedge" | "xrp_focus") {
    setError("");

    if (type === "balanced") {
      const target = { USDC: 0.2, USDT: 0.2, cbBTC: 0.2, cbXRP: 0.2, ETH: 0.2 };
      modUpdateRef.current = true;
      setModulator(0.5);
      try { window.dispatchEvent(new CustomEvent("pp:reserveRatiosUpdated", { detail: { ratios: target } })); } catch { }
      (async () => {
        try {
          await fetch("/api/site/config", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-wallet": account?.address || "" },
            body: JSON.stringify({ reserveRatios: target }),
          });
        } catch { }
      })();
      return;
    }

    const presets: Record<string, Record<string, number>> = {
      stable: { USDC: 0.4, USDT: 0.4, cbBTC: 0.1, cbXRP: 0.05, ETH: 0.05 },
      btc_hedge: { USDC: 0.25, USDT: 0.25, cbBTC: 0.3, cbXRP: 0.1, ETH: 0.1 },
      xrp_focus: { USDC: 0.25, USDT: 0.25, cbBTC: 0.1, cbXRP: 0.3, ETH: 0.1 },
    };
    const target = { ...presets[type] };
    const sum = Object.values(target).reduce((s, v) => s + Number(v || 0), 0) || 1;
    for (const k of Object.keys(target)) target[k] = +(Number(target[k] || 0) / sum).toFixed(4);
    const m = computeModulatorFromRatios(target);
    modUpdateRef.current = true;
    setModulator(m);
    try { window.dispatchEvent(new CustomEvent("pp:reserveRatiosUpdated", { detail: { ratios: target } })); } catch { }
    (async () => {
      try {
        await fetch("/api/site/config", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-wallet": account?.address || "" },
          body: JSON.stringify({ reserveRatios: target }),
        });
      } catch { }
    })();
  }

  if (accumulationMode !== "dynamic") return null;

  return (
    <div className="glass-pane rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Strategy Modulator</h3>
        {recommendation?.recommendedToken ? (
          <span className="microtext text-muted-foreground">
            Suggested settle: <b>{recommendation.recommendedToken}</b> · cadence every {recommendation.frequency}
          </span>
        ) : (
          <span className="microtext text-muted-foreground">Recommendations auto‑calculated from reserve deficits</span>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Risk Appetite</label>
        <div className="relative pb-5">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={modulator}
            onChange={(e) => setModulator(Number(e.target.value))}
            onMouseUp={() => {
              const v = Number(modulator);
              if (Math.abs(v - 0.5) < 0.03) {
                modUpdateRef.current = true;
                setModulator(0.5);
              }
            }}
            onTouchEnd={() => {
              const v = Number(modulator);
              if (Math.abs(v - 0.5) < 0.03) {
                modUpdateRef.current = true;
                setModulator(0.5);
              }
            }}
            className="w-full glass-range"
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-[2px] bg-foreground/30 rounded-sm" />
          <div className="absolute left-1/2 top-full -translate-x-1/2 mt-1">
            <button
              type="button"
              className="px-2 py-0.5 rounded border text-[10px] leading-4"
              onClick={() => { modUpdateRef.current = true; setModulator(0.5); }}
              title="Set to Balanced (0.5)"
            >
              Balanced
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between microtext text-muted-foreground">
          <span>Stablecoin-heavy</span>
          <span>Growth tilt</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="px-3 py-1.5 rounded-md border text-xs" onClick={() => preset("balanced")}>Balanced</button>
        <button className="px-3 py-1.5 rounded-md border text-xs" onClick={() => preset("stable")}>Stable Focus</button>
        <button className="px-3 py-1.5 rounded-md border text-xs" onClick={() => preset("btc_hedge")}>BTC Hedge</button>
        <button className="px-3 py-1.5 rounded-md border text-xs" onClick={() => preset("xrp_focus")}>XRP Focus</button>
        <span className="microtext text-muted-foreground ml-auto">
          Applying a preset writes reserveRatios to your config. Adjust sliders above for fine‑tuning.
        </span>
      </div>
      {error && <div className="microtext text-red-500">{error}</div>}
      {applyLoading && <div className="microtext text-muted-foreground">Applying strategy…</div>}
    </div>
  );
}
