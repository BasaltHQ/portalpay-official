"use client";

import React from "react";
import { Copy, Check } from "lucide-react";

type Props = {
  address?: string;
  start?: number;
  end?: number;
  className?: string;
  codeClass?: string;
};

/**
 * TruncatedAddress
 * - Displays a shortened wallet address like 0x1234…abcd
 * - Adds a small copy button to copy the full address to clipboard
 */
export default function TruncatedAddress({
  address = "",
  start = 6,
  end = 4,
  className = "",
  codeClass = "text-xs",
}: Props) {
  const [copied, setCopied] = React.useState(false);
  const a = String(address || "");

  const truncated = React.useMemo(() => {
    try {
      const w = a.toLowerCase();
      if (!w) return "";
      if (w.length <= start + end) return w;
      return `${w.slice(0, start)}…${w.slice(-end)}`;
    } catch {
      return a;
    }
  }, [a, start, end]);

  function copy() {
    try {
      if (!a) return;
      navigator.clipboard
        .writeText(a)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        })
        .catch(() => {});
    } catch {}
  }

  if (!a) {
    return <span className={`microtext text-muted-foreground ${className}`}>—</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <code className={`font-mono ${codeClass} truncate`}>{truncated}</code>
      <button
        type="button"
        onClick={copy}
        className="h-5 w-5 rounded-md border flex items-center justify-center hover:bg-foreground/5"
        title={copied ? "Copied!" : "Copy address"}
        aria-label="Copy address"
      >
        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  );
}
