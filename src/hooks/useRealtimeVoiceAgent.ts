import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useConversation } from "@elevenlabs/react";
import { buildShopConciergePrompt } from "../agent/prompts/shopConciergePrompt";
import { getLanguageCode } from "@/lib/azure-translator";
import { getLocaleFromLanguage } from "@/lib/i18n/config";

// ─── Sound Effects ───
// Pre-generated via ElevenLabs Sound Effects API (scripts/generate-agent-sounds.ts)
class SoundFX {
  private static cache: Record<string, HTMLAudioElement> = {};
  private static thinkingAudio: HTMLAudioElement | null = null;

  static preload() {
    if (typeof window === "undefined") return;
    ["/audio/agent-connect.mp3", "/audio/agent-thinking.mp3"].forEach((src) => {
      if (!SoundFX.cache[src]) {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = 0.3;
        SoundFX.cache[src] = audio;
      }
    });
  }

  static playConnect() {
    try {
      const a = SoundFX.cache["/audio/agent-connect.mp3"];
      if (a) { a.currentTime = 0; a.volume = 0.35; a.play().catch(() => { }); }
    } catch { }
  }

  static startThinking() {
    try {
      const a = SoundFX.cache["/audio/agent-thinking.mp3"];
      if (!a) return;
      if (SoundFX.thinkingAudio) { SoundFX.thinkingAudio.pause(); }
      a.currentTime = 0;
      a.volume = 0.25;
      a.loop = true;
      a.play().catch(() => { });
      SoundFX.thinkingAudio = a;
    } catch { }
  }

  static stopThinking() {
    try {
      const a = SoundFX.thinkingAudio;
      if (a) {
        a.pause();
        a.currentTime = 0;
        a.loop = false;
        SoundFX.thinkingAudio = null;
      }
    } catch { }
  }
}
// Preload on module init
SoundFX.preload();

/**
 * Realtime voice agent hook — ElevenLabs Conversational AI
 * 
 * Replaces the previous WebRTC + Azure OpenAI implementation with ElevenLabs.
 * Uses the @elevenlabs/react SDK's `useConversation` hook.
 * 
 * Preserves the same return type (UseRealtimeVoiceAgent) so consumers
 * (VoiceAgentProvider, ShopVoiceAgentButton) need no changes.
 */

export type StartOptions = {
  voice?: string; // reserved for future voice selection
};

export type VoiceAgentState = {
  isListening: boolean;
  isMuted: boolean;
  isStarting: boolean;
  toolsReady: boolean;
  micLevel: number;   // 0..1 normalized
  agentLevel: number; // 0..1 normalized
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

// Client-side tool names that dispatch to the local cart manager
const UI_TOOL_NAMES = new Set([
  // Shop info
  "getShopDetails", "getShopRating",
  // Inventory
  "searchInventory", "getInventoryPage", "getItemModifiers", "getAllInventory",
  // Cart
  "addToCart", "editCartItem", "removeFromCart",
  "updateCartItemQty", "clearCart", "getCartSummary",
  // Owner
  "getOwnerAnalytics",
  // Agent self-management
  "changeLanguage",
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
    `Greeting rule: greet the customer with an appropriate salutation for the time of day (${bucket}) and speak in the selected language (${language}). ` +
    `Keep the greeting short before proceeding. ` +
    `Inventory Strategy: IMMEDIATELY call getAllInventory at the start of the conversation to load the full catalog. ` +
    `Use this cached knowledge to answer questions about items, categories, and availability. ` +
    `Only use searchInventory for specific keyword lookups if needed. ` +
    `Before adding items with modifiers or customizations, call getItemModifiers to learn available options. ` +
    `If the customer speaks a different language than ${language}, use changeLanguage to switch, then inform them the conversation will restart.`;
  return { instruction, locale, language };
}

/**
 * Resolves a pending tool call promise by waiting for `pp:agent:tool_result:{callId}`
 * dispatched by the cart manager on the window.
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

export function useRealtimeVoiceAgent(): UseRealtimeVoiceAgent {
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

  // ─── Build client tools for ElevenLabs ───
  // Each tool function dispatches to the cart manager via window events
  // and returns the result to the agent.
  const clientTools = useMemo(() => {
    const tools: Record<string, (params: any) => Promise<string>> = {};
    for (const toolName of UI_TOOL_NAMES) {
      tools[toolName] = async (params: any) => {
        const callId = `cl:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

        // Parse JSON strings back to objects for modifiers/variants
        const parsedParams = { ...params };
        if (typeof parsedParams.selectedModifiers === "string") {
          try { parsedParams.selectedModifiers = JSON.parse(parsedParams.selectedModifiers); } catch { }
        }
        if (typeof parsedParams.selectedVariant === "string") {
          try { parsedParams.selectedVariant = JSON.parse(parsedParams.selectedVariant); } catch { }
        }

        // Play thinking sound while tool executes
        SoundFX.startThinking();

        // Dispatch to local cart manager
        window.dispatchEvent(new CustomEvent("pp:agent:tool_call", {
          detail: {
            name: toolName,
            args: parsedParams,
            requestId: callId,
          },
        }));

        // Wait for result from cart manager
        const result = await waitForToolResult(callId, 8000);
        SoundFX.stopThinking();
        return typeof result === "string" ? result : JSON.stringify(result);
      };
    }
    return tools;
  }, []);

  // ─── ElevenLabs useConversation ───
  const conversation = useConversation({
    clientTools: clientTools,
    workletPaths: {
      rawAudioProcessor: "/elevenlabs/rawAudioProcessor.js",
      audioConcatProcessor: "/elevenlabs/audioConcatProcessor.js",
    },
    format: "pcm",
    onConnect: ({ conversationId }: { conversationId: string }) => {
      console.info("[ElevenLabs] Connected:", conversationId);
      setToolsReady(true);
      SoundFX.playConnect();
    },
    onDisconnect: () => {
      console.info("[ElevenLabs] Disconnected");
      setIsListening(false);
      isListeningRef.current = false;
      setToolsReady(false);
    },
    onError: (message: string, context: any) => {
      console.error("[ElevenLabs] Error:", message, context);
      setError(typeof message === "string" ? message : "Voice agent error");
    },
    onModeChange: ({ mode }: { mode: string }) => {
      // mode is "speaking" or "listening"
      console.info("[ElevenLabs] Mode:", mode);
    },
    onAudio: (audio: string) => {
      // Log length to verify data flow
      if (Math.random() < 0.05) console.log("[ElevenLabs] Audio chunk received (base64 length):", audio.length);
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
      // Tell HeroVisualizer we're no longer listening
      window.dispatchEvent(new CustomEvent("pp:voice:levels", {
        detail: { isListening: false, micLevel: 0, agentLevel: 0 },
      }));
      return;
    }

    const poll = () => {
      if (!isListeningRef.current) return;
      try {
        // getInputVolume() and getOutputVolume() return 0..1
        const mic = conversation.getInputVolume?.() ?? 0;
        const agent = conversation.getOutputVolume?.() ?? 0;
        setMicLevel(Math.min(1, Math.max(0, mic)));
        setAgentLevel(Math.min(1, Math.max(0, agent)));

        // Broadcast to HeroVisualizer and any other subscribers
        window.dispatchEvent(new CustomEvent("pp:voice:levels", {
          detail: {
            isListening: true,
            micLevel: mic,
            agentLevel: agent,
          },
        }));

        if (agent > 0 && Math.random() < 0.05) {
          console.log("[ElevenLabs] Agent volume > 0:", agent);
        }
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
    } catch {
      // swallow commit errors
    }
  }, [maxDurationSec]);

  // ─── Start ───
  const startListening = useCallback(async (_opts?: StartOptions) => {
    setError(null);

    // ─── AUDIO CONTEXT WARMUP (CRITICAL) ───
    // We must create/resume a context synchronously within the user gesture
    // before any async operations (like fetch) to unlock audio autoplay.
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        console.log("[Voice] Warmup Context created. State:", ctx.state);

        ctx.resume().then(() => {
          console.log("[Voice] Warmup Context resumed. State:", ctx.state);
        }).catch(err => console.warn("[Voice] Resume failed", err));
      } else {
        console.warn("[Voice] AudioContext API missing");
      }
    } catch (e) {
      console.warn("[Voice] Audio warmup failed", e);
    }

    if (isListening || isStarting) return;

    // Ensure shop context is ready
    try {
      const sc = (window as any).__pp_shopContext || {};
      console.info("[ElevenLabs] shopContext:", { name: sc?.name, wallet: sc?.merchantWallet, slug: sc?.slug, desc: !!sc?.description });
      const hasDesc =
        (typeof sc.description === "string" && sc.description.trim().length > 0) ||
        (typeof sc.shortDescription === "string" && sc.shortDescription.trim().length > 0) ||
        (typeof sc.bio === "string" && sc.bio.trim().length > 0);
      const ready =
        !!sc &&
        typeof sc.merchantWallet === "string" && sc.merchantWallet &&
        typeof sc.name === "string" && sc.name.trim().length > 0 &&
        hasDesc;
      if (!ready) {
        console.warn("[ElevenLabs] Shop context NOT ready — aborting", { hasDesc, wallet: sc?.merchantWallet, name: sc?.name });
        setError("Shop context not ready");
        return;
      }
    } catch (ctxErr) {
      console.error("[ElevenLabs] Shop context check error:", ctxErr);
    }

    setIsStarting(true);

    try {
      const shopCtx = (window as any).__pp_shopContext || {};
      const wallet = String(shopCtx?.merchantWallet || "").trim();
      const slug = String(shopCtx?.slug || "").trim();

      // Build dynamic prompt override
      const dynamicPrompt = buildShopConciergePrompt({
        name: String(shopCtx?.name || "").trim(),
        description: String(shopCtx?.description || "").trim(),
        shortDescription: String(shopCtx?.shortDescription || "").trim(),
        bio: String(shopCtx?.bio || "").trim(),
        merchantWallet: wallet,
        slug,
        ratingAvg: Number(shopCtx?.ratingAvg || 0),
        ratingCount: Number(shopCtx?.ratingCount || 0),
        categories: Array.isArray(shopCtx?.categories) ? shopCtx.categories : [],
        sessionSeed: `sess:${Date.now()}:${Math.random().toString(36).slice(2)}`,
        startedAt: new Date().toISOString(),
      });

      const langInfo = buildLanguageTimeInjection();
      const fullPrompt = `${dynamicPrompt}\n\n${langInfo.instruction}`;

      // Get signed URL from our API
      console.info("[ElevenLabs] Fetching signed URL...");
      const sessionRes = await fetch("/api/voice/elevenlabs/signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(wallet ? { "x-wallet": wallet } : {}),
        },
        cache: "no-store",
        body: JSON.stringify({ persona: "concierge", wallet }),
      });

      const sessionJson = await sessionRes.json().catch(() => ({}));
      console.info("[ElevenLabs] Signed URL response:", { ok: sessionRes.ok, status: sessionRes.status, hasUrl: !!sessionJson?.signedUrl, error: sessionJson?.error });
      if (!sessionRes.ok || !sessionJson?.signedUrl) {
        const msg = typeof sessionJson?.error === "string" ? sessionJson.error : "Voice session failed";
        throw new Error(msg);
      }

      const cap = Number(sessionJson?.maxDurationSec || 60);
      setMaxDurationSec(cap);
      usageDocIdRef.current = String(sessionJson?.usageDocId || "");
      committedRef.current = false;

      // Start ElevenLabs session with signed URL
      console.info("[ElevenLabs] Starting session with signed URL...", { signedUrl: sessionJson.signedUrl?.slice(0, 60) + "..." });
      await conversation.startSession({
        signedUrl: sessionJson.signedUrl,
        overrides: {
          agent: {
            prompt: {
              prompt: fullPrompt,
            },
            firstMessage: `Hi, welcome to ${String(shopCtx?.name || "the shop").trim()}! How can I help you today?`,
          },
        },
        dynamicVariables: {
          shopName: String(shopCtx?.name || "").trim(),
          shopDescription: String(shopCtx?.description || shopCtx?.shortDescription || "").trim(),
          merchantWallet: wallet,
          shopSlug: slug,
        },
      });
      console.info("[ElevenLabs] Session started successfully");
      // Mark as listening
      setIsListening(true);
      isListeningRef.current = true;
      setIsMuted(false);
      try {
        conversation.setVolume?.({ volume: 1 });
      } catch { }
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
      console.error("[ElevenLabs] startListening failed:", e);
      setError(e?.message || "Failed to start voice");
      setIsStarting(false);
      try { await conversation.endSession(); } catch { }
    }
  }, [isListening, isStarting, conversation]);

  // ─── Toggle Mute ───
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    // ElevenLabs SDK handles mic muting via the conversation object
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

  // ─── Cleanup on unmount ───
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
