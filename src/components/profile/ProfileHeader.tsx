"use client";

import React from "react";
import { DefaultAvatar } from "@/components/default-avatar";
import { LevelPFPFrame } from "@/components/LevelPFPFrame";

interface ProfileHeaderProps {
  pfpUrl: string;
  displayName: string;
  wallet: string;
  xp: number;
  statusMood?: string;
  editMode: boolean;
  onPfpUpload: () => void;
  // Ring props
  showRing?: boolean;
  ringLevel?: number;
  ringPrimaryColor?: string;
  ringSecondaryColor?: string;
  ringText?: string;
  onRingClick?: () => void;
}

const moodEmojis = [
  { emoji: '😊', label: 'Happy' }, { emoji: '😢', label: 'Sad' }, { emoji: '🔥', label: 'Excited' },
  { emoji: '💼', label: 'Professional' }, { emoji: '😴', label: 'Tired' }, { emoji: '🎉', label: 'Celebrating' },
  { emoji: '🤔', label: 'Thinking' }, { emoji: '💪', label: 'Motivated' }
];

function CameraIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function GlobeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function ProfileHeader({
  pfpUrl,
  displayName,
  wallet,
  xp,
  statusMood,
  editMode,
  onPfpUpload,
  showRing = true,
  ringLevel = 1,
  ringPrimaryColor,
  ringSecondaryColor,
  ringText,
  onRingClick
}: ProfileHeaderProps) {
  return (
    <div
      className="rounded-2xl border p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))',
        borderColor: 'rgba(255,255,255,0.1)',
        boxShadow: '0 0 40px rgba(59, 130, 246, 0.1)'
      }}
    >
      {/* Subtle gradient glow */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${ringPrimaryColor || '#3b82f6'}30, transparent 50%)`
        }}
      />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <div
            className="relative group cursor-pointer"
            onClick={editMode ? onPfpUpload : onRingClick}
            title={editMode ? "Change photo" : "Customize ring"}
          >
            {/* Ring Frame or Plain Avatar - matches modal styling */}
            {showRing ? (
              <LevelPFPFrame
                level={ringLevel}
                size={140}
                profileImageUrl={pfpUrl}
                primaryColor={ringPrimaryColor}
                innerRingColor={ringSecondaryColor}
                showAnimation={true}
                glowIntensity={1.5}
                ringText={ringText}
                textColor={ringPrimaryColor}
              />
            ) : (
              <div className="rounded-full bg-foreground/10 overflow-hidden flex-shrink-0 border-2 border-white/10" style={{ width: 140, height: 140 }}>
                {pfpUrl ? (
                  <img src={pfpUrl} alt={displayName || wallet} className="w-full h-full object-cover" />
                ) : (
                  <DefaultAvatar seed={wallet} size={140} className="rounded-full" />
                )}
              </div>
            )}

            {/* Edit overlay */}
            {editMode && (
              <button
                onClick={onPfpUpload}
                className="absolute inset-0 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <CameraIcon size={24} />
              </button>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-2xl font-bold truncate text-white">
              {displayName || `${wallet.slice(0, 6)}…${wallet.slice(-4)}`}
            </div>
            <div className="font-mono text-xs text-gray-400 truncate">
              {wallet.slice(0, 10)}…{wallet.slice(-6)}
            </div>
            <div className="mt-2 flex items-center gap-3">
              {/* Level Badge */}
              {showRing && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: `${ringPrimaryColor || '#3b82f6'}25`,
                    color: ringPrimaryColor || '#3b82f6',
                    border: `1px solid ${ringPrimaryColor || '#3b82f6'}40`
                  }}
                >
                  Level {ringLevel}
                </span>
              )}
              <span className="text-sm text-gray-300">
                <span className="font-semibold">{xp || 0}</span> XP
              </span>
              {statusMood && (
                <span className="text-lg">
                  {moodEmojis.find(m => m.label === statusMood)?.emoji}
                </span>
              )}
            </div>
          </div>
        </div>

        <a
          href={`/u/${wallet}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-sm whitespace-nowrap flex items-center gap-2 transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white'
          }}
        >
          <GlobeIcon size={16} />
          View Public Profile
        </a>
      </div>
    </div>
  );
}
