"use client";

import React from "react";

interface RolesSectionProps {
  merchant: boolean;
  buyer: boolean;
}

export function RolesSection({ merchant, buyer }: RolesSectionProps) {
  return (
    <div className="glass-pane rounded-xl border border-foreground/[0.1] bg-foreground/[0.02] p-6 space-y-4">
      <h2 className="text-xl font-bold tracking-tight mb-2">Roles</h2>
      <div className="flex flex-wrap gap-2">
        {merchant && <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border border-foreground/10 bg-foreground/5">Merchant</span>}
        {buyer && <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border border-foreground/10 bg-foreground/5">Buyer</span>}
        {!merchant && !buyer && <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-relaxed">No roles selected</span>}
      </div>
    </div>
  );
}
