"use client";

import React from "react";

interface BasicInfoEditorProps {
  displayName: string;
  bio: string;
  pfpUrl: string;
  onDisplayNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onPfpUrlChange: (value: string) => void;
  onPfpUpload: () => void;
  uploadBusy: boolean;
}

export function BasicInfoEditor({
  displayName,
  bio,
  pfpUrl,
  onDisplayNameChange,
  onBioChange,
  onPfpUrlChange,
  onPfpUpload,
  uploadBusy
}: BasicInfoEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-2">Profile Picture</label>
        <div className="space-y-2">
          <input
            className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
            value={pfpUrl}
            onChange={(e) => onPfpUrlChange(e.target.value)}
            placeholder="https://..."
          />
          <button
            type="button"
            onClick={onPfpUpload}
            disabled={uploadBusy}
            className="w-full sm:w-auto px-4 py-2 rounded-md border hover:bg-foreground/5 text-sm disabled:opacity-50"
          >
            {uploadBusy ? 'Uploading...' : 'Upload Picture'}
          </button>
          {pfpUrl && (
            <div className="mt-2 w-20 h-20 rounded-full overflow-hidden bg-foreground/10">
              <img src={pfpUrl} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Display Name</label>
        <input
          className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Your name or handle"
        />
      </div>

      <div>
        <label className="text-sm font-medium block mb-2">Bio</label>
        <textarea
          className="w-full min-h-[120px] px-3 py-2 border rounded-md bg-background text-sm"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Tell us about yourself"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {bio.length}/2000 characters
        </p>
      </div>
    </div>
  );
}
