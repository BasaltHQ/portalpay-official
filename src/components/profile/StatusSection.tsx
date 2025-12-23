"use client";

import React from "react";

interface StatusSectionProps {
  message?: string;
  updatedAt?: number;
}

function MessageIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

export function StatusSection({ message, updatedAt }: StatusSectionProps) {
  if (!message) return null;

  const minutesAgo = updatedAt ? Math.floor((Date.now() - updatedAt) / 60000) : 0;

  return (
    <div className="p-3 rounded-lg border bg-foreground/5">
      <div className="flex items-start gap-2">
        <MessageIcon size={16} />
        <div className="flex-1">
          <p className="text-sm">{message}</p>
          {updatedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated {minutesAgo < 60 ? `${minutesAgo} minutes ago` : `${Math.floor(minutesAgo / 60)} hours ago`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
