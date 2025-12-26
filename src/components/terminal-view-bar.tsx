"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

type ViewKey = "terminal" | "compact" | "wide" | "invoice";

export function TerminalViewBar({ className = "" }: { className?: string }) {
  const { theme } = useTheme();
  const pathname = usePathname() || "";
  const sp = useSearchParams();

  // Determine active view from query (?view=terminal|compact|wide|invoice) and invoice flag
  const activeView = useMemo<ViewKey>(() => {
    const v = String(sp?.get("view") || "").toLowerCase() as ViewKey;
    const inv = String(sp?.get("invoice") || "").toLowerCase();
    if (v === "terminal" || v === "compact" || v === "wide" || v === "invoice") return v;
    if (inv === "1" || inv === "true") return "invoice";
    return "terminal";
  }, [sp]);

  // Build URL helper preserving recipient param if present
  function hrefFor(view: ViewKey) {
    const u = new URL(pathname || "/terminal", typeof window !== "undefined" ? window.location.origin : "http://localhost");
    u.searchParams.set("view", view);
    // Preserve recipient to keep merchant context in previews
    const rec = String(sp?.get("recipient") || "").trim();
    if (rec) u.searchParams.set("recipient", rec);
    // For invoice mode we also add invoice=1 to trigger invoice-themed config fetches
    if (view === "invoice") u.searchParams.set("invoice", "1");
    else u.searchParams.delete("invoice");
    return u.pathname + (u.search ? u.search : "");
  }

  const ITEM_CLS = (key: ViewKey) =>
    `px-2 py-0.5 microtext text-[9px] md:text-[9px] lg:text-[10px] rounded hover:bg-foreground/5 transition-colors ${activeView === key ? "text-foreground" : "text-foreground/80"
    }`;

  // Only render on /pricing (and nested) paths
  const show = pathname.startsWith("/pricing") || pathname.startsWith("/terminal");

  if (!show) return null;

  return (
    <div
      className={`w-full border-b backdrop-blur-md relative z-40 ${className}`}
      style={{ backgroundColor: `${theme.primaryColor}40` }}
    >
      <div className="max-w-5xl mx-auto px-4 h-7 flex items-center justify-between">
        <nav className="flex items-center gap-1">
          <Link href={hrefFor("terminal")} className={ITEM_CLS("terminal")}>Terminal</Link>
          <Link href={hrefFor("compact")} className={ITEM_CLS("compact")}>Compact</Link>
          <Link href={hrefFor("wide")} className={ITEM_CLS("wide")}>Wide</Link>
          <Link href={hrefFor("invoice")} className={ITEM_CLS("invoice")}>Invoice</Link>
        </nav>
        {/* Right side reserved for future context if needed */}
        <div className="hidden md:block microtext text-foreground/60" />
      </div>
    </div>
  );
}
