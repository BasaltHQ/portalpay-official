"use client";

import React from "react";

interface RolesEditorProps {
  merchant: boolean;
  buyer: boolean;
  onMerchantChange: (value: boolean) => void;
  onBuyerChange: (value: boolean) => void;
}

export function RolesEditor({
  merchant,
  buyer,
  onMerchantChange,
  onBuyerChange
}: RolesEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-2">Select Your Roles</label>
        <p className="text-xs text-muted-foreground mb-3">
          Choose the roles that best describe your activity on the platform
        </p>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-foreground/5 transition-colors">
            <input
              type="checkbox"
              checked={merchant}
              onChange={(e) => onMerchantChange(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <div className="font-medium text-sm">Merchant</div>
              <div className="text-xs text-muted-foreground">
                You sell products or services on the platform
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-foreground/5 transition-colors">
            <input
              type="checkbox"
              checked={buyer}
              onChange={(e) => onBuyerChange(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <div className="font-medium text-sm">Buyer</div>
              <div className="text-xs text-muted-foreground">
                You purchase products or services on the platform
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
