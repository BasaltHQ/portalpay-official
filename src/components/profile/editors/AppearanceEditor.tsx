"use client";

import React, { useRef } from "react";

interface AppearanceEditorProps {
  themeColor: string;
  backgroundUrl: string;
  htmlBox: string;
  onThemeColorChange: (value: string) => void;
  onBackgroundUrlChange: (value: string) => void;
  onHtmlBoxChange: (value: string) => void;
  onBackgroundUpload: () => void;
  uploadBgBusy: boolean;
}

export function AppearanceEditor({
  themeColor,
  backgroundUrl,
  htmlBox,
  onThemeColorChange,
  onBackgroundUrlChange,
  onHtmlBoxChange,
  onBackgroundUpload,
  uploadBgBusy
}: AppearanceEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-2">Theme Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            className="h-9 w-20 px-1 border rounded-md bg-background cursor-pointer"
            value={themeColor}
            onChange={(e) => onThemeColorChange(e.target.value)}
          />
          <input
            type="text"
            className="flex-1 h-9 px-3 py-1 border rounded-md bg-background text-sm font-mono"
            value={themeColor}
            onChange={(e) => onThemeColorChange(e.target.value)}
            placeholder="#8b5cf6"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Cover Photo</label>
        <div className="space-y-2">
          <input
            className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
            value={backgroundUrl}
            onChange={(e) => onBackgroundUrlChange(e.target.value)}
            placeholder="https://..."
          />
          <button
            type="button"
            onClick={onBackgroundUpload}
            disabled={uploadBgBusy}
            className="w-full sm:w-auto px-4 py-2 rounded-md border hover:bg-foreground/5 text-sm disabled:opacity-50"
          >
            {uploadBgBusy ? 'Uploading...' : 'Upload Cover Photo'}
          </button>
          {backgroundUrl && (
            <div className="mt-2 rounded-md overflow-hidden border">
              <div
                className="w-full h-32"
                style={{
                  backgroundImage: `url(${backgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Custom HTML Box</label>
        <textarea
          className="w-full min-h-[120px] px-3 py-2 border rounded-md bg-background text-sm font-mono"
          value={htmlBox}
          onChange={(e) => onHtmlBoxChange(e.target.value)}
          placeholder="<marquee>Welcome to my profile!</marquee>"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Basic HTML only. No scripts. Limited tags and attributes allowed for safety.
        </p>
      </div>
    </div>
  );
}
