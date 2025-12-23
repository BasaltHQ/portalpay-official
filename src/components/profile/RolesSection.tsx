"use client";

import React from "react";

interface RolesSectionProps {
  merchant: boolean;
  buyer: boolean;
}

export function RolesSection({ merchant, buyer }: RolesSectionProps) {
  return (
    <div className="glass-pane rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-2">Roles</h2>
      <div className="flex flex-wrap gap-2">
        {merchant && <span className="px-2 py-1 rounded-md border text-xs">Merchant</span>}
        {buyer && <span className="px-2 py-1 rounded-md border text-xs">Buyer</span>}
        {!merchant && !buyer && <span className="text-sm text-muted-foreground">No roles selected</span>}
      </div>
    </div>
  );
}
