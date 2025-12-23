"use client";

import React, { useMemo, useState, useEffect } from "react";
import { X as IconX, Mic, MicOff } from "lucide-react";
import { useVoiceAgent } from "@/components/providers/voice-agent-provider";

type Props = {
  variant?: "hero" | "compact" | "rectangular";
  primaryColor?: string;   // shop primary for agent speaking
  secondaryColor?: string; // shop secondary for user speaking
};

/**
 * ShopVoiceAgentButton
 * - Prominent mic button with animated visualizer background.
 * - Tap mic to start; tap again to mute/unmute while listening.
 * - Shows a small × button when listening to stop entirely.
 * - Visualizer tint switches based on whether user or agent is speaking.
 *
 * Note: agentLevel will remain near 0 until remote audio is wired in the hook.
 */
export function ShopVoiceAgentButton({
  variant = "hero",
  primaryColor = "#0ea5e9",
  secondaryColor = "#22c55e",
}: Props) {
  const { state, startListening, toggleMute, stop, sendText } = useVoiceAgent();
  const [activity, setActivity] = useState<string[]>([]);

  useEffect(() => {
    const onCall = (e: Event) => {
      const ce = e as CustomEvent<{ name: string; args: any; requestId?: string }>;
      const name = ce.detail?.name || "";
      const id = ce.detail?.requestId || "";
      const args = ce.detail?.args || {};
      const preview = JSON.stringify(args).slice(0, 120);
      setActivity((prev) => [
        `[tool_call] ${name}${id ? `#${id}` : ""} args=${preview}`,
        ...prev
      ].slice(0, 6));
    };
    const onResult = (e: Event) => {
      const ce = e as CustomEvent<{ requestId?: string; result: { ok: boolean; data?: any; error?: string } }>;
      const id = ce.detail?.requestId || "";
      const res = ce.detail?.result || { ok: false } as any;
      const label = res.error ? `error=${res.error}` : `ok=${res.ok}`;
      const preview = JSON.stringify(res.data ?? res).slice(0, 120);
      setActivity((prev) => [
        `[tool_result] ${id ? `#${id}` : ""} ${label} data=${preview}`,
        ...prev
      ].slice(0, 6));
    };
    window.addEventListener("pp:agent:tool_call", onCall as EventListener);
    window.addEventListener("pp:agent:tool_result", onResult as EventListener);
    return () => {
      window.removeEventListener("pp:agent:tool_call", onCall as EventListener);
      window.removeEventListener("pp:agent:tool_result", onResult as EventListener);
    };
  }, []);
  const { isListening, isMuted, isStarting, toolsReady, micLevel, agentLevel, maxDurationSec, error } = state;

  // Decide dominant speaker: user (mic) or agent (remote)
  const dominance = useMemo(() => {
    const u = micLevel || 0;
    const a = agentLevel || 0;
    if (u <= 0.02 && a <= 0.02) return "idle";
    return u >= a ? "user" : "agent";
  }, [micLevel, agentLevel]);

  // Animated gradient background intensity
  const intensity = useMemo(() => {
    const level = dominance === "user" ? micLevel : dominance === "agent" ? agentLevel : 0.05;
    return Math.min(1, Math.max(0.05, level));
  }, [dominance, micLevel, agentLevel]);

  const baseSize = variant === "hero" ? 96 : variant === "rectangular" ? 48 : 40;
  const iconSize = variant === "hero" ? 28 : variant === "rectangular" ? 20 : 18;

  const bgColorA = dominance === "agent" ? primaryColor : secondaryColor; // dominant color
  const bgColorB = dominance === "agent" ? secondaryColor : primaryColor; // accent color

  const visualizerStyle: React.CSSProperties = {
    width: variant === "rectangular" ? "100%" : baseSize,
    height: baseSize,
    borderRadius: variant === "rectangular" ? "0" : "9999px",
    background: `
      radial-gradient(at 25% 25%, ${bgColorA} ${Math.floor(intensity * 100)}%, transparent 60%),
      radial-gradient(at 75% 25%, ${bgColorB} ${Math.floor(intensity * 80)}%, transparent 60%),
      radial-gradient(at 25% 75%, ${bgColorB} ${Math.floor(intensity * 60)}%, transparent 60%),
      radial-gradient(at 75% 75%, ${bgColorA} ${Math.floor(intensity * 40)}%, transparent 60%)
    `,
    boxShadow: variant === "hero"
      ? `0 10px 30px rgba(0,0,0,0.25)`
      : `0 4px 12px rgba(0,0,0,0.15)`,
    display: "grid",
    placeItems: "center",
    transition: "background 120ms linear",
    overflow: "visible",
    border: variant === "rectangular" ? "none" : "2px solid rgba(255,255,255,0.35)",
  };

  const buttonLabel = !isListening
    ? "Start voice"
    : isMuted
      ? "Unmute mic"
      : "Mute mic";

  const onMicClick = async () => {
    // Block re-clicks while a session is being requested or until tools are ready once session is live
    if (isStarting || (isListening && !toolsReady)) {
      return;
    }
    if (!isListening) {
      await startListening().catch(() => {});
      return;
    }
    toggleMute();
  };

  return (
    <div className={variant === "hero" ? "flex flex-col items-center gap-3" : variant === "rectangular" ? "w-full" : ""} aria-live="polite">
      {false && variant === "hero" && (
        <div className="w-full max-w-md" aria-hidden="true">
          <div className="microtext text-white/80 mb-1">Tool activity</div>
          <div className="rounded-md border border-white/20 bg-black/30 p-2 text-xs text-white/80 max-h-20 overflow-y-auto">
            {activity.length === 0 ? (
              <div className="microtext text-white/50">No activity yet.</div>
            ) : (
              activity.map((line, idx) => (
                <div key={idx} className="truncate">{line}</div>
              ))
            )}
          </div>
        </div>
      )}
      <div
        role="button"
        aria-pressed={isListening && !isMuted}
        aria-label={buttonLabel}
        title={buttonLabel}
        style={visualizerStyle}
        className="relative cursor-pointer select-none"
        onClick={onMicClick}
      >
        <div
          className="rounded-full bg-black/20 text-white grid place-items-center"
          style={{
            width: baseSize - 18,
            height: baseSize - 18,
            border: "1px solid rgba(255,255,255,0.35)",
            backdropFilter: "blur(4px)",
          }}
        >
          {isListening ? (
            isMuted ? <MicOff size={iconSize} /> : <Mic size={iconSize} />
          ) : (
            <Mic size={iconSize} />
          )}
        </div>
        {isListening && (
          <button
            type="button"
            aria-label="Stop listening"
            title="Stop listening"
            onClick={(e) => {
              e.stopPropagation();
              stop();
            }}
            className={variant === "compact"
              ? "absolute -right-2 -top-2 z-20 h-6 w-6 rounded-full bg-white text-black shadow-lg border ring-1 ring-black/10 inline-flex items-center justify-center"
              : "absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white text-black shadow-md border inline-flex items-center justify-center"}
            style={{ color: primaryColor }}
          >
            <IconX size={14} />
          </button>
        )}
        {(isStarting || (isListening && !toolsReady)) && (
          <>
            {variant === "compact" ? (
              <div className="absolute inset-0 rounded-[inherit] bg-black/40 backdrop-blur-sm grid place-items-center">
                <div className="pp-spinner-compact h-5 w-5 relative">
                  <span className="pp-spinner-dot" />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 rounded-[inherit] bg-black/40 backdrop-blur-sm grid place-items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="pp-spinner h-6 w-6" />
                  <div className="microtext text-white/90">Starting…</div>
                </div>
              </div>
            )}
          </>
        )}
        <style jsx>{`
          .pp-spinner {
            border: 2px solid rgba(255,255,255,0.35);
            border-top-color: ${primaryColor};
            border-radius: 9999px;
            animation: pp-spin 900ms linear infinite;
          }
          .pp-spinner-compact::before {
            content: "";
            display: block;
            height: 20px;
            width: 20px;
            border: 2px dashed rgba(255,255,255,0.45);
            border-radius: 9999px;
            animation: pp-spin 800ms linear infinite;
          }
          .pp-spinner-dot {
            position: absolute;
            height: 6px;
            width: 6px;
            background: ${primaryColor};
            border-radius: 9999px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: pp-pulse 900ms ease-in-out infinite;
            box-shadow: 0 0 10px ${primaryColor};
          }
          @keyframes pp-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pp-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.35); opacity: 0.65; }
          }
        `}</style>

      </div>

      {variant === "hero" && (
        <div className="microtext text-center text-white/90">
          {isListening
            ? isMuted
              ? `Muted • Ends in ${maxDurationSec}s`
              : `Listening • Ends in ${maxDurationSec}s`
            : `Tap to start • ${maxDurationSec}s session`}
        </div>
      )}

      {error && variant === "hero" && (
        <div className="microtext text-center text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

export default ShopVoiceAgentButton;
