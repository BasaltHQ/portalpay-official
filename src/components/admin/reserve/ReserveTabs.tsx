"use client";

import React, { useState } from "react";
import { ReserveSettings } from "./ReserveSettings";
import { ReserveStrategy } from "./ReserveStrategy";
import { ReserveAnalytics } from "./ReserveAnalytics";
import { TipSettings } from "./TipSettings";
import { TaxManagement } from "./TaxManagement";
import { TransactionsViewer } from "./TransactionsViewer";

type ReserveTab = "configuration" | "analytics" | "transactions" | "tax" | "tips";

export function ReserveTabs() {
  const [activeTab, setActiveTab] = useState<ReserveTab>("configuration");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="glass-pane rounded-xl border">
        <nav className="flex items-center gap-2 p-2 overflow-x-auto">
          <button
            className={`px-3 py-2 md:py-1.5 min-h-[36px] whitespace-nowrap flex-shrink-0 rounded-md border text-sm ${activeTab === "configuration"
                ? "bg-foreground/10 border-foreground/20"
                : "hover:bg-foreground/5"
              }`}
            onClick={() => setActiveTab("configuration")}
          >
            Reserve Configuration
          </button>
          <button
            className={`px-3 py-2 md:py-1.5 min-h-[36px] whitespace-nowrap flex-shrink-0 rounded-md border text-sm ${activeTab === "analytics"
                ? "bg-foreground/10 border-foreground/20"
                : "hover:bg-foreground/5"
              }`}
            onClick={() => setActiveTab("analytics")}
          >
            Reserve Analytics
          </button>
          <button
            className={`px-3 py-2 md:py-1.5 min-h-[36px] whitespace-nowrap flex-shrink-0 rounded-md border text-sm ${activeTab === "transactions"
                ? "bg-foreground/10 border-foreground/20"
                : "hover:bg-foreground/5"
              }`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
          <button
            className={`px-3 py-2 md:py-1.5 min-h-[36px] whitespace-nowrap flex-shrink-0 rounded-md border text-sm ${activeTab === "tax"
                ? "bg-foreground/10 border-foreground/20"
                : "hover:bg-foreground/5"
              }`}
            onClick={() => setActiveTab("tax")}
          >
            Tax Management
          </button>
          <button
            className={`px-3 py-2 md:py-1.5 min-h-[36px] whitespace-nowrap flex-shrink-0 rounded-md border text-sm ${activeTab === "tips"
                ? "bg-foreground/10 border-foreground/20"
                : "hover:bg-foreground/5"
              }`}
            onClick={() => setActiveTab("tips")}
          >
            Tips
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "configuration" && (
        <div className="glass-pane rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Reserve Configuration</h2>
            <span className="microtext text-muted-foreground">Admin-only</span>
          </div>
          <p className="microtext text-muted-foreground">
            Configure processing fee and target reserve ratios. Ratios are fractions (0 to 1). Quotes
            are in USD to match receipts. Default token and accumulation mode are applied immediately.
          </p>
          <ReserveSettings />
          <ReserveStrategy />
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="glass-pane rounded-xl border p-6 space-y-4">
          <ReserveAnalytics />
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="glass-pane rounded-xl border p-6 space-y-4">
          <TransactionsViewer />
        </div>
      )}

      {activeTab === "tax" && (
        <div className="space-y-4">
          <TaxManagement />
        </div>
      )}

      {activeTab === "tips" && (
        <div className="glass-pane rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tip Settings</h2>
            <span className="microtext text-muted-foreground">Merchant</span>
          </div>
          <p className="microtext text-muted-foreground">
            Configure the tip percentage presets shown on the payment portal. Set a default tip and control whether buyers can enter a custom amount.
          </p>
          <TipSettings />
        </div>
      )}
    </div>
  );
}
