"use client";

import React from "react";

interface LinkItem {
  label: string;
  url: string;
}

interface LinksSectionProps {
  links: LinkItem[];
}

function LinkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10 13a5 5 0 0 0 7.5 4.3l3-3a5 5 0 0 0-7-7l-1.5 1.5"/>
      <path d="M14 11a5 5 0 0 0-7.5-4.3l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>
    </svg>
  );
}

function getSocialIcon(url: string, label: string) {
  const u = String(url||"").toLowerCase();
  const l = String(label||"").toLowerCase();
  
  const kind = (
    u.includes('x.com') || /twitter|x\b/.test(l) ? 'twitter' :
    (u.includes('youtube.com') || u.includes('youtu.be') || /youtube/.test(l)) ? 'youtube' :
    (u.includes('github.com') || /github/.test(l)) ? 'github' :
    (u.includes('linkedin.com') || /linkedin/.test(l)) ? 'linkedin' :
    (u.includes('instagram.com') || /instagram/.test(l)) ? 'instagram' :
    (u.includes('discord.gg') || u.includes('discord.com') || /discord/.test(l)) ? 'discord' :
    'globe'
  );
  
  return (
    <span className="w-6 h-6 rounded-full grid place-items-center border bg-foreground/5">
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        {kind === 'globe' && <><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></>}
        {kind === 'twitter' && <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>}
        {kind === 'youtube' && <><path d="M22 12s0-3-0.4-4.4a3 3 0 0 0-2.2-2.2C17 5 12 5 12 5s-5 0-7.4.4A3 3 0 0 0 2.4 7.6C2 9 2 12 2 12s0 3 .4 4.4a3 3 0 0 0 2.2 2.2C5 19 12 19 12 19s5 0 7.4-.4a3 3 0 0 0 2.2-2.2C22 15 22 12 22 12z" stroke="none" fill="currentColor"/><polygon points="10 15 15 12 10 9 10 15" stroke="none" fill="#fff"/></>}
        {kind === 'github' && <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.9 9.6.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1-1.4-1-1.4-.8-.6.1-.6.1-.6.9.1 1.3 1 1.3 1 .8 1.3 2.1.9 2.6.7.1-.6.3-1 .5-1.2-2.2-.2-4.5-1.1-4.5-5 0-1.1.4-2 1-2.7-.1-.2-.5-1.3.1-2.6 0 0 .9-.3 2.8 1 .8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c2-1.3 2.8-1 2.8-1 .6 1.3.2 2.4.1 2.6.7.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.5 5 .3.3.6.9.6 1.9v2.8c0 .3.2.6.7.5 4-1.3 6.9-5.1 6.9-9.6C22 6.6 17.5 2 12 2z" stroke="none" fill="currentColor"/>}
        {kind === 'linkedin' && <><path d="M4 4h4v4H4z"/><path d="M6 8v12"/><path d="M10 12c0-2 1.5-3 3-3s3 1 3 3v8"/><path d="M10 20v-8"/></>}
        {kind === 'instagram' && <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1"/></>}
        {kind === 'discord' && <path d="M6 18c2 1 4 1 6 1s4 0 6-1c1-3 2-6 2-9-2-2-4-3-6-3l-1 2c-2-1-4-1-6 0L6 6C4 6 2 7 0 9c0 3 1 6 2 9z" stroke="none" fill="currentColor"/>}
      </svg>
    </span>
  );
}

export function LinksSection({ links }: LinksSectionProps) {
  if (!links || links.length === 0) {
    return (
      <div className="glass-pane rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <LinkIcon size={18} />
          Links
        </h2>
        <p className="text-sm text-muted-foreground">No links added yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-pane rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <LinkIcon size={18} />
        Links
      </h2>
      <div className="flex flex-col gap-2">
        {links.map((link, i) => (
          <a 
            key={i} 
            className="inline-flex items-center gap-2 px-2 py-1 rounded-md border hover:bg-foreground/5 text-sm truncate" 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {getSocialIcon(link.url, link.label)}
            <span className="font-medium truncate">{link.label || link.url}</span>
            <span className="microtext text-muted-foreground truncate hidden sm:inline">{link.url}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
