"use client";

import React, { useMemo, useState } from "react";
import { REGION_LANGS, type RegionKey } from "@/lib/region-langs";
import { getLanguagesForRegion } from "@/lib/master-langs";

/**
 * Lightweight, dependency-free WorldRegionMap replacement.
 * - Removes Leaflet and CSS imports that caused build errors
 * - Preserves API: props { selected?, onSelect(region), className? }
 * - Renders a grid of geographic regions; clicking opens a language picker modal
 * - Uses REGION_LANGS/getLanguagesForRegion to populate languages
 */

export function WorldRegionMap({
  selected,
  onSelect,
  className,
}: {
  selected?: string | null;
  onSelect: (region: RegionKey) => void;
  className?: string;
}) {
  const [modalRegion, setModalRegion] = useState<RegionKey | null>(null);
  const [q, setQ] = useState("");

  // Canonical region order used across the app (geographic groups only)
  const REGIONS = useMemo<RegionKey[]>(
    () => [
      "AMERICAS - North",
      "AMERICAS - Central & South",
      "EUROPE - Western & Northern",
      "EUROPE - Eastern & Central",
      "EUROPE - Minority & Other",
      "AFRICA - North",
      "AFRICA - West",
      "AFRICA - East",
      "AFRICA - Central & Southern",
      "MIDDLE EAST & WESTERN ASIA",
      "ASIA - South",
      "ASIA - Southeast",
      "ASIA - East",
      "ASIA - Central & North",
      "OCEANIA",
    ],
    []
  );

  // Static color palette per region (consistent with prior UI)
  const REGION_COLORS: Record<RegionKey, string> = {
    "AMERICAS - North": "#14b8a6",
    "AMERICAS - Central & South": "#10b981",
    "EUROPE - Western & Northern": "#eab308",
    "EUROPE - Eastern & Central": "#f59e0b",
    "EUROPE - Minority & Other": "#d4a373",
    "AFRICA - North": "#fb923c",
    "AFRICA - West": "#f97316",
    "AFRICA - East": "#fdba74",
    "AFRICA - Central & Southern": "#ea580c",
    "MIDDLE EAST & WESTERN ASIA": "#ef4444",
    "ASIA - South": "#22c55e",
    "ASIA - Southeast": "#4ade80",
    "ASIA - East": "#60a5fa",
    "ASIA - Central & North": "#38bdf8",
    "OCEANIA": "#8b5cf6",
    "MYSTERIOUS": "#a855f7",
  } as const;

  const regionCards = useMemo(() => {
    return REGIONS.map((rk) => {
      const color = REGION_COLORS[rk] || "#4f46e5";
      const isSelected = !!selected && rk === selected;
      return (
        <button
          key={rk}
          type="button"
          className={`rounded-lg border p-3 text-left transition ${
            isSelected
              ? "ring-2 ring-offset-2 ring-[var(--primary)] border-foreground/30"
              : "hover:bg-foreground/5 border-foreground/10"
          }`}
          onClick={() => setModalRegion(rk)}
          title={`Browse languages for ${rk}`}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium">{rk}</span>
          </div>
          <div className="microtext text-muted-foreground mt-1">
            Click to pick a language commonly used in this region
          </div>
        </button>
      );
    });
  }, [REGIONS, REGION_COLORS, selected]);

  const filteredLanguages = useMemo(() => {
    if (!modalRegion) return [];
    const base =
      getLanguagesForRegion(modalRegion) ||
      (REGION_LANGS as any)[modalRegion] ||
      [];
    const langs = Array.from(new Set((base || []).filter(Boolean))) as string[];
    const query = q.trim().toLowerCase();
    if (!query) return langs;
    return langs.filter((l) => l.toLowerCase().includes(query));
  }, [modalRegion, q]);

  return (
    <div className={className}>
      <div className="glass-pane rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Pick by region</div>
          {selected ? (
            <div className="microtext text-muted-foreground">
              Selected: <span className="font-medium">{selected}</span>
            </div>
          ) : null}
        </div>

        {/* Simple responsive grid of region "tiles" (no external map libs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {regionCards}
        </div>
      </div>

      {/* Language picker modal */}
      {modalRegion && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setModalRegion(null);
              setQ("");
            }}
          />
          <div className="glass-pane relative z-50 w-[min(680px,92vw)] max-h-[82vh] rounded-xl border p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-sm font-semibold">
                Languages in {modalRegion}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter languages…"
                  className="h-8 px-2 rounded-md border bg-background text-sm"
                />
                <button
                  className="h-8 px-2 rounded-md border text-xs"
                  onClick={() => {
                    setModalRegion(null);
                    setQ("");
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-[66vh] overflow-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {filteredLanguages.length === 0 ? (
                <div className="text-xs text-muted-foreground px-1 py-2">
                  No languages found{q ? " for this filter" : ""}.
                </div>
              ) : (
                filteredLanguages.map((lang, idx) => (
                  <button
                    key={`${lang}-${idx}`}
                    className="w-full text-left px-2 py-1.5 rounded-md border hover:bg-foreground/5 text-sm"
                    onClick={() => {
                      try {
                        // Notify Console to change the language immediately
                        const ev = new CustomEvent("cb:setLanguage", {
                          detail: { language: lang },
                        });
                        window.dispatchEvent(ev as any);
                      } catch {}
                      onSelect(modalRegion);
                      setModalRegion(null);
                      setQ("");
                    }}
                  >
                    {lang}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
