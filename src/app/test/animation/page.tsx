"use client";

import React, { useState, useEffect } from "react";
import GeometricAnimation from "@/components/landing/GeometricAnimation";

// Preset colors for quick selection
const PRESET_COLORS = [
  { name: "Indigo", color: "#6366f1" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Cyan", color: "#06b6d4" },
  { name: "Teal", color: "#14b8a6" },
  { name: "Green", color: "#22c55e" },
  { name: "Lime", color: "#84cc16" },
  { name: "Yellow", color: "#eab308" },
  { name: "Orange", color: "#f97316" },
  { name: "Red", color: "#ef4444" },
  { name: "Pink", color: "#ec4899" },
  { name: "Purple", color: "#a855f7" },
  { name: "Violet", color: "#8b5cf6" },
  { name: "Rose", color: "#f43f5e" },
  { name: "Emerald", color: "#10b981" },
  { name: "Sky", color: "#0ea5e9" },
  { name: "Amber", color: "#f59e0b" },
];

/**
 * Test page for the GeometricAnimation component
 * Only available on localhost for development testing
 */
export default function AnimationTestPage() {
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [isClient, setIsClient] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDev, setIsDev] = useState(false);
  const [gyroStatus, setGyroStatus] = useState<"unavailable" | "needs-permission" | "active">("unavailable");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if we're on localhost
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.");
    setIsDev(isLocalhost || process.env.NODE_ENV === "development");
    
    // Check for mobile device
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    
    // Check gyroscope availability
    if ('DeviceOrientationEvent' in window) {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        // iOS 13+ needs permission
        setGyroStatus("needs-permission");
      } else {
        // Android and other devices - gyro is auto-enabled
        setGyroStatus("active");
      }
    }
  }, []);

  const requestGyroPermission = async () => {
    if (typeof (window as any).__requestGyroPermission === 'function') {
      await (window as any).__requestGyroPermission();
      setGyroStatus("active");
    }
  };

  // Block access in production
  if (isClient && !isDev) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Full-screen animation with color override */}
      <div className="fixed inset-0">
        <GeometricAnimation 
          className="w-full h-full" 
          primaryColorOverride={selectedColor}
        />
      </div>

      {/* Toggle controls button */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors"
      >
        {showControls ? "Hide Controls" : "Show Controls"}
      </button>

      {/* Control panel */}
      {showControls && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              Animation Test Controls
            </h2>

            {/* Color picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Custom Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer border-2 border-white/20"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm"
                  placeholder="#6366f1"
                />
              </div>
            </div>

            {/* Preset colors */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                Preset Colors
              </label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setSelectedColor(preset.color)}
                    className={`group relative w-full aspect-square rounded-lg transition-all hover:scale-110 ${
                      selectedColor === preset.color
                        ? "ring-2 ring-white ring-offset-2 ring-offset-black"
                        : ""
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  >
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-lg transition-opacity">
                      <span className="text-[10px] text-white font-medium">
                        {preset.name}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gyroscope control for mobile */}
            {isMobile && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-white/80 mb-3">
                  Accelerometer / Gyroscope
                </label>
                <div className="flex items-center gap-3">
                  {gyroStatus === "needs-permission" && (
                    <button
                      onClick={requestGyroPermission}
                      className="px-4 py-2 rounded-lg bg-[var(--primary,#6366f1)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Enable Motion Control
                    </button>
                  )}
                  {gyroStatus === "active" && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm text-green-400">Gyroscope Active</span>
                    </div>
                  )}
                  {gyroStatus === "unavailable" && (
                    <span className="text-sm text-white/40">Gyroscope not available</span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-2">
                  Tilt your device to move the portal effect
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                <strong className="text-white/80">Tip:</strong> Move your mouse around to see the interactive effects. 
                Click anywhere to create ripple effects. On mobile, touch and drag to interact.
                {isMobile && " Tilt your device to control the portal vortex!"}
              </p>
            </div>

            {/* Current color info */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-white/60">Current color:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-white/20"
                  style={{ backgroundColor: selectedColor }}
                />
                <code className="text-white/80 font-mono">{selectedColor}</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Title overlay */}
      <div className="fixed top-4 left-4 z-40 pointer-events-none">
        <h1 className="text-2xl font-bold text-white/90">
          GeometricAnimation Test
        </h1>
        <p className="text-sm text-white/60 mt-1">
          Interactive mouse-tracking animation preview
        </p>
      </div>
    </div>
  );
}
