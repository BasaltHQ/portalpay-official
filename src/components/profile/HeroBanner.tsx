"use client";

import React from "react";

interface HeroBannerProps {
  backgroundUrl: string;
  editMode: boolean;
  onBgUpload: () => void;
}

function CameraIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

export function HeroBanner({ backgroundUrl, editMode, onBgUpload }: HeroBannerProps) {
  if (!backgroundUrl) return null;

  return (
    <div className="rounded-xl border overflow-hidden relative group">
      <div 
        className="w-full h-40 sm:h-48" 
        style={{ 
          backgroundImage: `url(${backgroundUrl})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }} 
      />
      {editMode && (
        <button 
          onClick={onBgUpload}
          className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <CameraIcon size={20} />
        </button>
      )}
    </div>
  );
}
