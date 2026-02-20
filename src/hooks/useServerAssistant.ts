import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { buildServerAssistantPrompt, type ShopContextPrompt } from "../agent/prompts/serverAssistantPrompt";
import { getLanguageCode } from "@/lib/azure-translator";
import { getLocaleFromLanguage } from "@/lib/i18n/config";

/**
 * Server Assistant voice agent hook — ElevenLabs Conversational AI
 * 
 * Replaces the previous WebRTC + Azure OpenAI implementation.
 * Uses the @elevenlabs/react SDK's `useConversation` hook.
 * 
 * This hook is tailored for the "Server Assistant" persona used on handheld devices.
 * It supports cart tools (addToCart, removeFromCart, etc.) and inventory tools.
 */

export type StartOptions = {
  voice?: string;
  instructions?: string;
};

export type VoiceAgentState = {
  isListening: boolean;
  isMuted: boolean;
  isStarting: boolean;
  toolsReady: boolean;
  micLevel: number;
  agentLevel: number;
  maxDurationSec: number;
  error: string | null;
};

export type UseRealtimeVoiceAgent = {
  state: VoiceAgentState;
  startListening: (opts?: StartOptions) => Promise<void>;
  toggleMute: () => void;
  stop: () => void;
  sendText: (text: string) => void;
};

// Client-side tool names dispatched via window events to local cart manager
const UI_TOOL_NAMES = new Set([
  "addToCart", "editCartItem", "removeFromCart",
  "updateCartItemQty", "clearCart", "getCartSummary",
]);

function buildLanguageTimeInjection(): { instruction: string; locale: string; language: string } {
  let language = "English (US)";
  let locale = "en";
  try {
    const savedLocale = localStorage.getItem("pp:locale") || "";
    const savedLanguage = localStorage.getItem("pp:language") || "";
    const lc = (savedLanguage && (getLanguageCode(savedLanguage) || getLocaleFromLanguage(savedLanguage))) || savedLocale || "en";
    const ln = savedLanguage || "English (US)";
    locale = String(lc || "en");
    language = String(ln || "English (US)");
  } catch { }
  let tz = "UTC";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch { }
  const now = new Date();
  const hour = now.getHours();
  const timeStr = (() => {
    try {
      return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return `${hour}:${String(now.getMinutes()).padStart(2, "0")}`;
    }
  })();
  let bucket = "night";
  if (hour >= 5 && hour <= 11) bucket = "morning";
  else if (hour >= 12 && hour <= 16) bucket = "afternoon";
  else if (hour >= 17 && hour <= 21) bucket = "evening";
  else bucket = "night";
  const instruction =
    `Localization: Preferred language is ${language} (locale: ${locale}). ` +
    `Customer time zone: ${tz}. Local time: ${timeStr}. ` +
    `${bucket} shift.`;
  return { instruction, locale, language };
}

/**
 * Wait for a tool result from the cart manager via window event.
 */
function waitForToolResult(callId: string, timeoutMs = 10000): Promise<any> {
  return new Promise((resolve) => {
    const eventName = `pp:agent:tool_result:${callId}`;
    let resolved = false;
    const handler = (evt: Event) => {
      if (resolved) return;
      resolved = true;
      window.removeEventListener(eventName, handler);
      resolve((evt as CustomEvent)?.detail ?? { ok: true });
    };
    window.addEventListener(eventName, handler);
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener(eventName, handler);
        resolve({ ok: true, timeout: true });
      }
    }, timeoutMs);
  });
}

export function useServerAssistant(): UseRealtimeVoiceAgent {
  // ─── State ───
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [agentLevel, setAgentLevel] = useState(0);
  const [maxDurationSec, setMaxDurationSec] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [toolsReady, setToolsReady] = useState(false);

  // ─── Refs ───
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usageDocIdRef = useRef<string>("");
  const sessionStartMsRef = useRef<number | null>(null);
  const committedRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const isListeningRef = useRef<boolean>(false);

  // ─── Build client tools ───
  const clientTools = useRef<Record<string, (params: any) => Promise<string>>>({});

  if (Object.keys(clientTools.current).length === 0) {
    for (const toolName of UI_TOOL_NAMES) {
      clientTools.current[toolName] = async (params: any) => {
        const callId = `cl:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

        const parsedParams = { ...params };
        if (typeof parsedParams.selectedModifiers === "string") {
          try { parsedParams.selectedModifiers = JSON.parse(parsedParams.selectedModifiers); } catch { }
        }
        if (typeof parsedParams.selectedVariant === "string") {
          try { parsedParams.selectedVariant = JSON.parse(parsedParams.selectedVariant); } catch { }
        }

        window.dispatchEvent(new CustomEvent("pp:agent:tool_call", {
          detail: { name: toolName, args: parsedParams, requestId: callId },
        }));

        const result = await waitForToolResult(callId, 8000);
        return typeof result === "string" ? result : JSON.stringify(result);
      };
    }
  }

  // ─── ElevenLabs useConversation ───
  const conversation = useConversation({
    clientTools: clientTools.current,
    workletPaths: {
      rawAudioProcessor: "/elevenlabs/rawAudioProcessor.js",
      audioConcatProcessor: "/elevenlabs/audioConcatProcessor.js",
    },
    format: "pcm",
    onConnect: ({ conversationId }: { conversationId: string }) => {
      console.info("[ElevenLabs:Server] Connected:", conversationId);
      setToolsReady(true);
      // Set volume to 1 after session start
      try {
        conversation.setVolume?.({ volume: 1 });
      } catch { }
    },
    onDisconnect: () => {
      console.info("[ElevenLabs:Server] Disconnected");
      setIsListening(false);
      isListeningRef.current = false;
      setToolsReady(false);
    },
    onError: (message: string, context: any) => {
      console.error("[ElevenLabs:Server] Error:", message, context);
      setError(typeof message === "string" ? message : "Voice agent error");
    },
    onModeChange: ({ mode }: { mode: string }) => {
      console.info("[ElevenLabs:Server] Mode:", mode);
    },
  });

  // ─── Audio Level Polling ───
  useEffect(() => {
    if (!isListening) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setMicLevel(0);
      setAgentLevel(0);
      return;
    }

    const poll = () => {
      if (!isListeningRef.current) return;
      try {
        const mic = conversation.getInputVolume?.() ?? 0;
        const agent = conversation.getOutputVolume?.() ?? 0;
        setMicLevel(Math.min(1, Math.max(0, mic)));
        setAgentLevel(Math.min(1, Math.max(0, agent)));
      } catch { }
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isListening, conversation]);

  // ─── Usage Commit ───
  const commitUsage = useCallback(async () => {
    try {
      if (committedRef.current) return;
      const id = usageDocIdRef.current;
      const startedAt = sessionStartMsRef.current;
      if (!id || !startedAt) return;
      const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const used = Math.min(elapsedSec, Math.max(0, maxDurationSec || 0));
      committedRef.current = true;
      await fetch("/api/voice/usage/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ id, seconds: used }),
      }).catch(() => { });
    } catch { }
  }, [maxDurationSec]);

  // ─── Start ───
  const startListening = useCallback(async (opts?: StartOptions) => {
    setError(null);

    // ─── AUDIO CONTEXT WARMUP (CRITICAL) ───
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume().catch(() => { });
      }
    } catch (e) { }

    if (isListening || isStarting) return;

    // Ensure shop context is ready
    try {
      const sc = (window as any).__pp_shopContext || {};
      const ready =
        !!sc &&
        typeof sc.merchantWallet === "string" && sc.merchantWallet &&
        typeof sc.name === "string" && sc.name.trim().length > 0;
      if (!ready) {
        setError("Shop context not ready");
        return;
      }
    } catch { }

    setIsStarting(true);

    try {
      const shopCtx = (window as any).__pp_shopContext || {};
      const wallet = String(shopCtx?.merchantWallet || "").trim();
      const slug = String(shopCtx?.slug || "").trim();

      // Build prompt with inventory for server assistant
      const promptCtx: ShopContextPrompt = {
        name: String(shopCtx?.name || "").trim(),
        description: String(shopCtx?.description || "").trim(),
        shortDescription: String(shopCtx?.shortDescription || "").trim(),
        bio: String(shopCtx?.bio || "").trim(),
        categories: Array.isArray(shopCtx?.categories) ? shopCtx.categories : [],
        inventory: Array.isArray(shopCtx?.inventory) ? shopCtx.inventory : [],
        sessionSeed: `sess:${Date.now()}:${Math.random().toString(36).slice(2)}`,
        startedAt: new Date().toISOString(),
      };

      const dynamicPrompt = buildServerAssistantPrompt(promptCtx);
      const langInfo = buildLanguageTimeInjection();
      const fullPrompt = `${dynamicPrompt}\n\n${langInfo.instruction}`;

      // Get signed URL from our API (server persona)
      const sessionRes = await fetch("/api/voice/elevenlabs/signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(wallet ? { "x-wallet": wallet } : {}),
        },
        cache: "no-store",
        body: JSON.stringify({ persona: "server", wallet }),
      });

      const sessionJson = await sessionRes.json().catch(() => ({}));
      if (!sessionRes.ok || !sessionJson?.signedUrl) {
        const msg = typeof sessionJson?.error === "string" ? sessionJson.error : "Voice session failed";
        throw new Error(msg);
      }

      const cap = Number(sessionJson?.maxDurationSec || 60);
      setMaxDurationSec(cap);
      usageDocIdRef.current = String(sessionJson?.usageDocId || "");
      committedRef.current = false;

      // Start ElevenLabs session
      await conversation.startSession({
        signedUrl: sessionJson.signedUrl,
        overrides: {
          agent: {
            prompt: { prompt: fullPrompt },
            firstMessage: "Server Assistant ready. What do you need?",
          },
        },
        dynamicVariables: {
          shopName: String(shopCtx?.name || "").trim(),
          shopDescription: String(shopCtx?.description || shopCtx?.shortDescription || "").trim(),
          merchantWallet: wallet,
          shopSlug: slug,
        },
      });

      setIsListening(true);
      isListeningRef.current = true;
      setIsMuted(false);
      sessionStartMsRef.current = Date.now();
      setIsStarting(false);

      // Auto-stop at cap
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      autoStopTimerRef.current = setTimeout(() => {
        try { stop(); } catch { }
      }, cap * 1000);

    } catch (e: any) {
      setError(e?.message || "Failed to start voice");
      setIsStarting(false);
      try { await conversation.endSession(); } catch { }
    }
  }, [isListening, isStarting, conversation]);

  // ─── Toggle Mute ───
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      if (nextMuted) {
        conversation.setVolume?.({ volume: 0 });
      } else {
        conversation.setVolume?.({ volume: 1 });
      }
    } catch { }
  }, [isMuted, conversation]);

  // ─── Stop ───
  const stop = useCallback(() => {
    void commitUsage();
    try { conversation.endSession(); } catch { }
    setIsListening(false);
    isListeningRef.current = false;
    setToolsReady(false);
    setMicLevel(0);
    setAgentLevel(0);
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [commitUsage, conversation]);

  // ─── Send Text ───
  const sendText = useCallback((text: string) => {
    const t = String(text || "").trim();
    if (!t || conversation.status !== "connected") return;
    try {
      conversation.sendUserMessage(t);
    } catch { }
  }, [conversation]);

  // ─── Cleanup ───
  useEffect(() => {
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state: { isListening, isMuted, isStarting, toolsReady, micLevel, agentLevel, maxDurationSec, error },
    startListening,
    toggleMute,
    stop,
    sendText,
  };
}
