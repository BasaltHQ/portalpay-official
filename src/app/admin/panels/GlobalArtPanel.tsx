"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { useActiveAccount } from "thirdweb/react";
import { Sparkles, Palette, Sun, RefreshCw, Play, Pause, Wand2, Grid3X3, CircleDot, User, Upload, Image as ImageIcon, Zap, Eye, Box, Droplets, Monitor, Cpu, Layers, Radio, Waves, Minimize2, Save, Loader2, AlertTriangle, Check } from "lucide-react";
import { LevelPFPFrame } from "@/components/LevelPFPFrame";
import { GenerativeArtBadge, SolarSystemColors, SolarSystemTheme, SolarSystemConfig, THEME_CONFIGS } from "@/components/GenerativeArtBadge";

// Theme metadata for UI
const THEME_INFO: Record<SolarSystemTheme, { name: string; desc: string; icon: React.ReactNode; category: string }> = {
  default: { name: "Classic", desc: "Smooth 3D planets with pulsing star", icon: <CircleDot className="w-4 h-4" />, category: "standard" },
  pixelated: { name: "Pixel Art", desc: "8-bit retro game aesthetic", icon: <Grid3X3 className="w-4 h-4" />, category: "artistic" },
  neon: { name: "Neon Glow", desc: "Cyberpunk glowing outlines", icon: <Zap className="w-4 h-4" />, category: "glowing" },
  wireframe: { name: "Wireframe", desc: "Technical blueprint style", icon: <Box className="w-4 h-4" />, category: "minimal" },
  holographic: { name: "Holographic", desc: "Rainbow iridescent shimmer", icon: <Layers className="w-4 h-4" />, category: "artistic" },
  retro: { name: "Retro", desc: "Vintage computer graphics", icon: <Monitor className="w-4 h-4" />, category: "artistic" },
  minimal: { name: "Minimal", desc: "Clean, distraction-free design", icon: <Minimize2 className="w-4 h-4" />, category: "minimal" },
  "cosmic-dust": { name: "Cosmic Dust", desc: "Particles and trails in space", icon: <Sparkles className="w-4 h-4" />, category: "cosmic" },
  glitch: { name: "Glitch", desc: "Digital corruption effects", icon: <Cpu className="w-4 h-4" />, category: "artistic" },
  watercolor: { name: "Watercolor", desc: "Soft, painterly gradients", icon: <Droplets className="w-4 h-4" />, category: "artistic" },
  crystalline: { name: "Crystalline", desc: "Geometric ring outlines", icon: <Eye className="w-4 h-4" />, category: "minimal" },
  plasma: { name: "Plasma", desc: "Intense energy radiating", icon: <Radio className="w-4 h-4" />, category: "glowing" },
};

// Color presets
const COLOR_PRESETS = [
  { name: "Diamond Rainbow", star: "#FF00FF", planets: ["#00FFFF", "#FF1493", "#00FF00", "#FFD700", "#FF4500", "#7B68EE", "#00FF7F", "#FF69B4"] },
  { name: "Fire & Ice", star: "#FF4500", planets: ["#00CED1", "#FF6347", "#48D1CC", "#DC143C", "#00FFFF", "#FF0000", "#40E0D0", "#FF7F50"] },
  { name: "Ocean Depths", star: "#00CED1", planets: ["#0077B6", "#00B4D8", "#48CAE4", "#90E0EF", "#CAF0F8", "#023E8A", "#0096C7", "#ADE8F4"] },
  { name: "Nebula Purple", star: "#9B59B6", planets: ["#8E44AD", "#3498DB", "#E74C3C", "#F39C12", "#1ABC9C", "#9B59B6", "#E91E63", "#00BCD4"] },
  { name: "Golden Empire", star: "#FFD700", planets: ["#FFA500", "#FF8C00", "#FF7F50", "#FF6347", "#FF4500", "#DC143C", "#B8860B", "#DAA520"] },
  { name: "Cyber Neon", star: "#00FF00", planets: ["#FF00FF", "#00FFFF", "#FFFF00", "#FF0080", "#00FF80", "#8000FF", "#FF8000", "#0080FF"] },
  { name: "Monochrome", star: "#FFFFFF", planets: ["#E0E0E0", "#C0C0C0", "#A0A0A0", "#808080", "#606060", "#404040", "#303030", "#202020"] },
  { name: "Sunset", star: "#FF6B35", planets: ["#FF8C42", "#FFD166", "#F77F00", "#E85D04", "#DC2F02", "#D00000", "#9D0208", "#6A040F"] },
];

export function GlobalArtPanel({ isPlatform = false, merchantWallet }: { isPlatform?: boolean, merchantWallet?: string }) {
  const brand = useBrand();
  const account = useActiveAccount();
  const [seed, setSeed] = useState("global-art-" + Date.now());
  const [isAnimating, setIsAnimating] = useState(true);
  const [previewLevel, setPreviewLevel] = useState(50);

  // Persistence State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedConfig, setSavedConfig] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Theme selection
  const [selectedTheme, setSelectedTheme] = useState<SolarSystemTheme>("default");

  // Custom colors
  const [starColor, setStarColor] = useState("#FF00FF");
  const [planetColors, setPlanetColors] = useState([
    "#00FFFF", "#FF1493", "#00FF00", "#FFD700", "#FF4500", "#7B68EE", "#00FF7F", "#FF69B4"
  ]);
  const [orbitLineColor, setOrbitLineColor] = useState("#FFFFFF");

  // Advanced config
  const [glowIntensity, setGlowIntensity] = useState(1.5);

  const planetCount = Math.min(8, Math.max(1, Math.ceil(previewLevel / 7)));

  const colors: SolarSystemColors = { starColor, planetColors, orbitLineColor };
  const config: SolarSystemConfig = { theme: selectedTheme, colors, glowIntensity };

  // Derived state for comparison
  const currentConfigObj = useMemo(() => ({
    seed: seed.startsWith("global-art-") ? undefined : seed, // Check if it's the default dynamic seed or a regenerated one. Actually better to just save the seed.
    theme: selectedTheme,
    colors: { starColor, planetColors, orbitLineColor },
    glowIntensity
  }), [seed, selectedTheme, starColor, planetColors, orbitLineColor, glowIntensity]);

  // Load Config
  useEffect(() => {
    // Only fetch if we have a wallet for merchant, or if it's platform
    if (!isPlatform && !merchantWallet) return;

    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("type", isPlatform ? "platform" : "merchant");
    if (!isPlatform && merchantWallet) params.set("wallet", merchantWallet);

    fetch(`/api/loyalty/art-config?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          const c = data.config;
          // Apply config
          if (c.seed) setSeed(c.seed);
          if (c.theme) setSelectedTheme(c.theme);
          if (c.colors) {
            if (c.colors.starColor) setStarColor(c.colors.starColor);
            if (c.colors.planetColors && Array.isArray(c.colors.planetColors)) setPlanetColors(c.colors.planetColors);
            if (c.colors.orbitLineColor) setOrbitLineColor(c.colors.orbitLineColor);
          }
          if (c.glowIntensity !== undefined) setGlowIntensity(c.glowIntensity);

          setSavedConfig(JSON.stringify(c));
          setLastSaved(new Date());
        } else {
          // Initial state is "clean" if remote is empty? Or dirty?
          // Usually if no remote config, we start with defaults.
          // Let's mark it as clean (defaults) but ensure we save defaults eventually if edited.
          setSavedConfig(JSON.stringify(currentConfigObj));
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isPlatform, merchantWallet]);

  // Dirty Check
  useEffect(() => {
    if (savedConfig === null) return;
    // We need to compare specific fields because currentConfigObj might differ slightly if I didn't match the structure perfectly.
    // Simpler: Just JSON stringify current vs saved.
    // Note: seed handling might be tricky if it changes on mount.
    // I set savedConfig to currentConfigObj on mount if no data, so it should be fine.

    // One nuance: currentConfigObj.seed might include the initial random one.
    // If I didn't save the seed before, diff will show.
    // It's okay.
    setIsDirty(JSON.stringify(currentConfigObj) !== savedConfig);
  }, [currentConfigObj, savedConfig]);

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        type: isPlatform ? "platform" : "merchant",
        wallet: merchantWallet,
        config: currentConfigObj
      };

      const res = await fetch("/api/loyalty/art-config", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSavedConfig(JSON.stringify(data.config));
        setIsDirty(false);
        setLastSaved(new Date());
      }
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Warn on navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updatePlanetColor = (index: number, color: string) => {
    const newColors = [...planetColors];
    newColors[index] = color;
    setPlanetColors(newColors);
  };

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setStarColor(preset.star);
    setPlanetColors([...preset.planets]);
  };

  const regenerate = () => setSeed(`seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const allThemes = Object.keys(THEME_INFO) as SolarSystemTheme[];
  const themeCategories = {
    standard: allThemes.filter(t => THEME_INFO[t].category === "standard"),
    glowing: allThemes.filter(t => THEME_INFO[t].category === "glowing"),
    artistic: allThemes.filter(t => THEME_INFO[t].category === "artistic"),
    minimal: allThemes.filter(t => THEME_INFO[t].category === "minimal"),
    cosmic: allThemes.filter(t => THEME_INFO[t].category === "cosmic"),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-md p-4 -mx-4 z-10 border-b">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {isPlatform ? "Global Art Style" : "Rewards Art Studio"}
          </h2>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {isPlatform ? "Define the standard look for platform-wide levels." : "Customize the loyalty badges your shoppers earn."}
            {isDirty && <span className="text-amber-500 text-xs font-bold px-2 py-0.5 bg-amber-500/10 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Unsaved Changes</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}

          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm transition-colors"
            title="Toggle Animation"
          >
            {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={regenerate}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm transition-colors"
            title="Regenerate Seed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-border mx-1"></div>

          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving || isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDirty
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                : "bg-muted/50 text-muted-foreground cursor-not-allowed"
              }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-8">
        {/* Left: Preview & Themes */}
        <div className="space-y-6">
          {/* Large Preview */}
          <div className="bg-gradient-to-br from-black/70 to-black/90 rounded-2xl p-8 border border-white/5">
            <div className="flex flex-col items-center">
              <GenerativeArtBadge
                seed={seed}
                size={240}
                level={previewLevel}
                showAnimation={isAnimating}
                config={config}
              />
              <div className="mt-6 text-center">
                <div className="text-xl font-bold text-foreground">Level {previewLevel}</div>
                <div className="text-sm text-muted-foreground">{planetCount} Planet{planetCount !== 1 ? "s" : ""} • {THEME_INFO[selectedTheme].name} Theme</div>
              </div>

              {/* Level Slider */}
              <div className="w-full mt-6 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Level 1 (1 planet)</span>
                  <span>Level 50 (8 planets)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={previewLevel}
                  onChange={(e) => setPreviewLevel(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Theme Gallery */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Visual Themes
            </h3>

            {Object.entries(themeCategories).map(([category, themes]) => (
              themes.length > 0 && (
                <div key={category} className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{category}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {themes.map((theme) => {
                      const info = THEME_INFO[theme];
                      const isSelected = selectedTheme === theme;
                      return (
                        <button
                          key={theme}
                          onClick={() => setSelectedTheme(theme)}
                          className={`p-3 rounded-xl border transition-all duration-200 group ${isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50 hover:bg-card/80"}`}
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="bg-black/60 rounded-lg p-2">
                              <GenerativeArtBadge
                                seed={seed}
                                size={70}
                                level={35}
                                showAnimation={isAnimating && isSelected}
                                config={{ theme, colors, glowIntensity: THEME_CONFIGS[theme].glowIntensity ?? 1.5 }}
                              />
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                                {info.icon}
                                <span>{info.name}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{info.desc}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Level Progression Preview */}
          <div className="bg-gradient-to-br from-black/60 to-black/80 rounded-2xl p-6 border border-white/5">
            <h4 className="text-sm font-semibold text-foreground mb-4">Level Progression</h4>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {[1, 7, 14, 21, 28, 35, 42, 50].map((lvl) => (
                <div key={lvl} className="flex flex-col items-center gap-2">
                  <GenerativeArtBadge
                    seed={seed}
                    size={60}
                    level={lvl}
                    showAnimation={isAnimating}
                    config={config}
                  />
                  <div className="text-center">
                    <div className="text-xs font-bold text-foreground">Lv {lvl}</div>
                    <div className="text-[10px] text-muted-foreground">{Math.min(8, Math.ceil(lvl / 7))}P</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Color Controls */}
        <div className="space-y-5">
          {/* Color Presets */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Color Presets
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyColorPreset(preset)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.star }} />
                    {preset.planets.slice(0, 3).map((c, i) => (
                      <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Star Color */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-500" />
              Central Star
            </h4>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={starColor}
                onChange={(e) => setStarColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={starColor}
                  onChange={(e) => setStarColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm font-mono"
                />
              </div>
              <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: starColor, boxShadow: `0 0 20px ${starColor}` }} />
            </div>
          </div>

          {/* Planet Colors */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-blue-500" />
              Planet Colors
            </h4>
            <p className="text-xs text-muted-foreground mb-4">
              Level ÷ 7 = planets shown (Level {previewLevel} = {planetCount} planets)
            </p>
            <div className="grid grid-cols-4 gap-3">
              {planetColors.map((color, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-medium ${i < planetCount ? "text-foreground" : "text-muted-foreground/50"}`}>
                      P{i + 1}
                    </span>
                    {i < planetCount && <span className="text-[8px] text-green-500">●</span>}
                  </div>
                  <div className="relative">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => updatePlanetColor(i, e.target.value)}
                      className={`w-full h-10 rounded-lg cursor-pointer border-0 bg-transparent ${i >= planetCount ? "opacity-40" : ""}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orbit Lines */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Waves className="w-4 h-4 text-gray-500" />
              Orbit Lines
            </h4>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={orbitLineColor}
                onChange={(e) => setOrbitLineColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={orbitLineColor}
                onChange={(e) => setOrbitLineColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm font-mono"
              />
            </div>
          </div>

          {/* Glow Intensity */}
          <div className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Glow Intensity
              </h4>
              <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{glowIntensity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={glowIntensity}
              onChange={(e) => setGlowIntensity(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Subtle</span>
              <span>Intense</span>
            </div>
          </div>
        </div>
      </div>

      {/* PFP Ring Preview */}
      <PFPRingPreview glowIntensity={glowIntensity} isAnimating={isAnimating} />
    </div>
  );
}

function PFPRingPreview({ glowIntensity, isAnimating }: { glowIntensity: number; isAnimating: boolean }) {
  const account = useActiveAccount();
  const [profileUrl, setProfileUrl] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{ pfpUrl?: string; displayName?: string }>({});
  const [previewLevel, setPreviewLevel] = useState(25);
  const [previewPrestige, setPreviewPrestige] = useState(0);

  useEffect(() => {
    if (!account?.address) return;
    fetch(`/api/users/profile?wallet=${encodeURIComponent(account.address)}`)
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setUserProfile(data.profile);
          if (data.profile.pfpUrl) setProfileUrl(data.profile.pfpUrl);
        }
      })
      .catch(console.error);
  }, [account?.address]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfileUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 border-t border-border pt-8">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Ring Preview
        </h3>
        <p className="text-sm text-muted-foreground">Preview how the tier ring looks with a profile picture</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-black/60 to-black/80 rounded-2xl p-8 border border-white/5 flex flex-col items-center justify-center min-h-[350px]">
          <LevelPFPFrame
            level={previewLevel}
            prestige={previewPrestige}
            size={200}
            profileImageUrl={profileUrl || undefined}
            showAnimation={isAnimating}
            glowIntensity={glowIntensity}
          />
          <div className="mt-4 text-center">
            <div className="text-sm font-semibold text-foreground">
              Level {previewLevel} {previewPrestige > 0 && <span className="text-amber-400">✧ Prestige {previewPrestige}</span>}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {previewLevel >= 50 ? "Diamond" : previewLevel >= 41 ? "Platinum" : previewLevel >= 26 ? "Gold" : previewLevel >= 11 ? "Silver" : "Bronze"} Tier
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card rounded-xl p-5 border border-border space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Profile Picture
            </h4>

            {profileUrl ? (
              <div className="flex items-center gap-4">
                <img src={profileUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Current preview image</p>
                  <button onClick={() => setProfileUrl("")} className="text-xs text-destructive hover:underline">Remove</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 border-2 border-dashed border-border rounded-lg">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Upload an image to preview</p>
                <label className="inline-block px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm cursor-pointer">
                  Choose Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            )}

            {userProfile.pfpUrl && userProfile.pfpUrl !== profileUrl && (
              <button
                onClick={() => setProfileUrl(userProfile.pfpUrl!)}
                className="w-full px-4 py-2 border border-primary/30 text-primary rounded-lg text-sm hover:bg-primary/5"
              >
                Use My Profile Picture
              </button>
            )}
          </div>

          <div className="bg-card rounded-xl p-5 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Preview Level</h4>
              <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">Lv {previewLevel}</span>
            </div>
            <input type="range" min={1} max={50} value={previewLevel} onChange={(e) => setPreviewLevel(Number(e.target.value))} className="w-full accent-primary" />
          </div>

          <div className="bg-card rounded-xl p-5 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Prestige Level</h4>
              <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{previewPrestige === 0 ? "None" : `✧ ${previewPrestige}`}</span>
            </div>
            <input type="range" min={0} max={10} value={previewPrestige} onChange={(e) => setPreviewPrestige(Number(e.target.value))} className="w-full accent-amber-500" />
            <p className="text-xs text-muted-foreground">Prestige gems appear above the ring</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalArtPanel;
