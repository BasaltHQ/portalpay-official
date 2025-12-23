"use client";

import React from "react";

interface RelationshipInfo {
  status?: string;
  partner?: string;
}

interface RelationshipSectionProps {
  relationship: RelationshipInfo;
}

function HeartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.7 7.7l1 1 7.8 7.8 7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.7z"/>
    </svg>
  );
}

export function RelationshipSection({ relationship }: RelationshipSectionProps) {
  if (!relationship?.status) return null;

  return (
    <div className="glass-pane rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <HeartIcon size={18} />
        Relationship
      </h2>
      <div className="space-y-2">
        <div className="text-sm">{relationship.status}</div>
        {relationship.partner && (
          <div className="text-xs text-muted-foreground font-mono">
            Partner: {relationship.partner.slice(0,6)}…{relationship.partner.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}
