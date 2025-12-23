"use client";

import React from "react";
import { sanitizeProfileHtmlLimited } from "@/lib/sanitize";

interface AboutSectionProps {
  bio: string;
  htmlBox?: string;
}

function UsersIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.9"/>
      <path d="M16 3.1a4 4 0 0 1 0 7.8"/>
    </svg>
  );
}

export function AboutSection({ bio, htmlBox }: AboutSectionProps) {
  return (
    <div className="glass-pane rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <UsersIcon size={18} />
        About
      </h2>
      <p className="text-sm whitespace-pre-wrap">{bio || 'No bio yet.'}</p>
      {htmlBox && (
        <div 
          className="mt-4 text-sm p-3 rounded-md border bg-background/60 user-htmlbox max-h-64 overflow-auto break-words" 
          dangerouslySetInnerHTML={{ __html: sanitizeProfileHtmlLimited(htmlBox) }} 
        />
      )}
    </div>
  );
}
