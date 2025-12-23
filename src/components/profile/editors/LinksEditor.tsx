"use client";

import React from "react";

interface LinkItem {
  label: string;
  url: string;
}

interface LinksEditorProps {
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
}

const linkTypes = [
  'Website', 'X (Twitter)', 'YouTube', 'Twitch', 'Discord', 'GitHub',
  'LinkedIn', 'Instagram', 'Telegram', 'Email', 'Suno', 'SoundCloud'
];

export function LinksEditor({ links, onChange }: LinksEditorProps) {
  const updateLink = (index: number, field: keyof LinkItem, value: string) => {
    const newLinks = links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    onChange(newLinks);
  };

  const addLink = () => {
    onChange([...links, { label: 'Website', url: '' }]);
  };

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Social Links</label>
        <button
          type="button"
          onClick={addLink}
          className="px-3 py-1.5 rounded-md border hover:bg-foreground/5 text-sm"
        >
          Add Link
        </button>
      </div>

      <div className="space-y-3">
        {links.length > 0 ? (
          links.map((link, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 p-3 border rounded-md">
              <select
                className="h-9 px-3 border rounded-md bg-background text-sm sm:w-40"
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
              >
                {linkTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                className="flex-1 h-9 px-3 py-1 border rounded-md bg-background text-sm"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="h-9 px-3 rounded-md border hover:bg-red-500/10 hover:border-red-500/40 text-sm"
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No links added yet. Click "Add Link" to get started.
          </p>
        )}
      </div>
    </div>
  );
}
