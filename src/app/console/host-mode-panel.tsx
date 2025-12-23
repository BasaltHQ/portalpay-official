"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type HostModePanelProps = {
  // Realtime/Data channel access
  dataChannelRef: React.MutableRefObject<RTCDataChannel | null>;
  // Media playback control (reuses Console MediaPlayer audio element/graph)
  mediaAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  // VAD proxies coming from parent meters
  micVolume: number;
  agentVolume: number;
  // Parent utilities
  isListening: boolean;
  isSilenced: boolean;
  onSendUserMessage: (text: string) => boolean;
  onSendDeveloperMessage: (text: string) => boolean;
};

export default function HostModePanel(props: HostModePanelProps) {
  const {
    dataChannelRef,
    mediaAudioRef,
    micVolume,
    agentVolume,
    isListening,
    isSilenced,
    onSendUserMessage,
    onSendDeveloperMessage,
  } = props;

  const [hostContent, setHostContent] = useState<string>("Welcome everyone, thanks for joining! I’ll be your host for the next few minutes. Take a moment to get comfortable—music will play, and I’ll check in shortly.");
  const [inviteLine, setInviteLine] = useState<string>("This is a public space hosted by yours truly, feel free to hit the speak button to come up and talk with me about anything.");
  const [closingLine, setClosingLine] = useState<string>("We’re wrapping up—thanks to everyone who joined. Follow for future sessions, and have a wonderful rest of your day!");
  const [isHostRunning, setIsHostRunning] = useState<boolean>(false);
  const [hostStatus, setHostStatus] = useState<string>("Idle");
  const fiveMinTimerRef = useRef<number | null>(null);
  const inviteIntervalRef = useRef<number | null>(null);
  const vadLatchRef = useRef<boolean>(false);
  const speakingGateRef = useRef<boolean>(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const resumeIntervalRef = useRef<number | null>(null);
  const inviteCooldownRef = useRef<number>(0);
  const lastInviteRef = useRef<number>(0);
  const duckRef = useRef<{ prev: number; timer: number | null } | null>(null);
  const duckMusic = useCallback((ms: number = 6000, duckVol: number = 0.35) => {
    const a = mediaAudioRef.current;
    if (!a) return;
    try {
      const prev = Number.isFinite(a.volume) ? a.volume : 1;
      a.volume = Math.max(0, Math.min(1, duckVol));
      if (duckRef.current && duckRef.current.timer) {
        clearTimeout(duckRef.current.timer);
      }
      const t = setTimeout(() => {
        try {
          if (mediaAudioRef.current) mediaAudioRef.current.volume = prev;
        } catch {}
        duckRef.current = null;
      }, ms) as unknown as number;
      duckRef.current = { prev, timer: t };
    } catch {}
  }, [mediaAudioRef]);
  // Stable function refs to avoid "used before declaration" issues in event wiring
  const handleStartRef = useRef<() => void>(() => {});
  const handleStopRef = useRef<() => void>(() => {});
  const handleClosingRef = useRef<() => void>(() => {});

  const canPlay = useMemo(() => {
    return !!mediaAudioRef.current;
  }, [mediaAudioRef.current]);

  // Helper: safe play/pause wrappers on the media element
  const playMusic = useCallback(async () => {
    const a = mediaAudioRef.current;
    if (!a) return;
    try {
      a.muted = false;
      a.volume = 1;
      await a.play().catch(() => {});
      setHostStatus("Music playing");
    } catch {}
  }, [mediaAudioRef]);

  const pauseMusic = useCallback(() => {
    const a = mediaAudioRef.current;
    if (!a) return;
    try {
      a.pause();
      setHostStatus("Music paused");
    } catch {}
  }, [mediaAudioRef]);

  // Helper: send text to the agent to speak
  const say = useCallback(
    (text: string) => {
      if (!text || !text.trim()) return;
      if (!isListening || isSilenced) return;
      // Use a developer instruction to steer the model precisely, then send the text as a user message as a fallback
      onSendDeveloperMessage(
        `As host, speak the following line over the current music in a clear, inviting tone. Keep it concise and avoid trailing off: ${text}`,
      );
      const ok = onSendUserMessage(text);
      if (ok) setHostStatus("Speaking over music...");
    },
    [onSendUserMessage, onSendDeveloperMessage, isListening, isSilenced],
  );

  // Handle 5-minute phase: first play music 5 minutes, then read hostContent, then continue music
  const scheduleFiveMinutePhase = useCallback(() => {
    if (fiveMinTimerRef.current) {
      try {
        clearTimeout(fiveMinTimerRef.current);
      } catch {}
      fiveMinTimerRef.current = null;
    }
    fiveMinTimerRef.current = setTimeout(() => {
      // Read host content after 5 minutes
      pauseMusic();
      // slight delay to avoid stepping on playback stop
      setTimeout(() => {
        // Developer steer to ensure the content is spoken verbatim
        onSendDeveloperMessage(
          `As host, read the following Host Content verbatim and clearly. Announce it as the host, then pause briefly for interjections: ${hostContent}`,
        );
        onSendUserMessage(hostContent);
        setHostStatus("Reading host content...");
        // resume music a bit later to let speech start
        setTimeout(() => {
          if (isHostRunning) playMusic();
        }, 4000);
      }, 300);
    }, 5 * 60 * 1000) as unknown as number;
  }, [pauseMusic, say, hostContent, playMusic, isHostRunning]);

  // Invite line loop (every minute) while music is playing
  const beginInviteLoop = useCallback(() => {
    if (inviteIntervalRef.current) {
      try {
        clearInterval(inviteIntervalRef.current);
      } catch {}
      inviteIntervalRef.current = null;
    }
    inviteIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (!isHostRunning || isSilenced) return;
      const a = mediaAudioRef.current;
      // invite only if music is actually playing (not paused)
      if (!a || a.paused) return;
      // Throttle invites so we don't spam
      if (now - lastInviteRef.current < 60_000) return;
      lastInviteRef.current = now;
      say(inviteLine);
    }, 15_000) as unknown as number; // 15s tick; internal throttling enforces 60s cadence
  }, [isHostRunning, isSilenced, mediaAudioRef, say, inviteLine]);

  // Watch VAD: if someone speaks (micVolume sustained), pause music
  useEffect(() => {
    if (!isHostRunning) return;
    const a = mediaAudioRef.current;
    const speaking = agentVolume > 0.15;
    // Gate: don't trigger on our own speech
    speakingGateRef.current = speaking;
    if (micVolume > 0.22 && !speakingGateRef.current && a && !a.paused) {
      // Debounce with latch
      if (!vadLatchRef.current) {
        vadLatchRef.current = true;
        setTimeout(() => {
          // confirm still above threshold
          if (micVolume > 0.18 && !speakingGateRef.current) {
            pauseMusic();
            lastInteractionRef.current = Date.now();
          }
          // reset latch
          vadLatchRef.current = false;
        }, 450);
      }
    }
  }, [micVolume, agentVolume, pauseMusic, isHostRunning, mediaAudioRef]);

  // Resume music automatically after 2min with no conversation (mic quiet and agent quiet)
  useEffect(() => {
    if (!isHostRunning) return;
    if (resumeIntervalRef.current) {
      try {
        clearInterval(resumeIntervalRef.current);
      } catch {}
      resumeIntervalRef.current = null;
    }
    resumeIntervalRef.current = setInterval(() => {
      const a = mediaAudioRef.current;
      if (!a) return;
      const idleFor = Date.now() - lastInteractionRef.current;
      const noOneTalking = micVolume < 0.12 && agentVolume < 0.08;
      if (idleFor > 120_000 && a.paused && noOneTalking) {
        playMusic();
        lastInteractionRef.current = Date.now();
      }
    }, 5000) as unknown as number;
    return () => {
      if (resumeIntervalRef.current) {
        try {
          clearInterval(resumeIntervalRef.current);
        } catch {}
        resumeIntervalRef.current = null;
      }
    };
  }, [isHostRunning, mediaAudioRef, micVolume, agentVolume, playMusic]);

  // Wire up tool-call dispatcher events from parent (page.tsx will dispatch)
  useEffect(() => {
    const onHostStart = (e: any) => {
      if (isHostRunning) return;
      try { handleStartRef.current(); } catch {}
    };
    const onHostStop = (e: any) => {
      if (!isHostRunning) return;
      try { handleStopRef.current(); } catch {}
    };
    const onHostInviteNow = (e: any) => {
      if (!isHostRunning || isSilenced) return;
      const a = mediaAudioRef.current;
      if (!a || a.paused) return;
      const now = Date.now();
      if (now - lastInviteRef.current < 30_000) return;
      lastInviteRef.current = now;
      try { duckMusic(6000, 0.35); } catch {}
      say(inviteLine);
    };
    const onHostClosing = (e: any) => {
      if (!isHostRunning) return;
      try { handleClosingRef.current(); } catch {}
    };
    // Resume host: if already running but music paused, resume music; if not running, start it.
    const onHostResume = (e: any) => {
      if (!isListening) return;
      const a = mediaAudioRef.current;
      if (isHostRunning) {
        if (a && a.paused) {
          playMusic();
          setHostStatus("Music playing");
        } else {
          // kick the invite cadence anyway
          beginInviteLoop();
          setHostStatus("Host mode running");
        }
      } else {
        try { handleStartRef.current(); } catch {}
      }
    };
    try {
      window.addEventListener("cb:hostStart", onHostStart as any);
      window.addEventListener("cb:hostStop", onHostStop as any);
      window.addEventListener("cb:hostInviteNow", onHostInviteNow as any);
      window.addEventListener("cb:hostClosing", onHostClosing as any);
      window.addEventListener("cb:hostResume", onHostResume as any);
    } catch {}
    return () => {
      try {
        window.removeEventListener("cb:hostStart", onHostStart as any);
        window.removeEventListener("cb:hostStop", onHostStop as any);
        window.removeEventListener("cb:hostInviteNow", onHostInviteNow as any);
        window.removeEventListener("cb:hostClosing", onHostClosing as any);
        window.removeEventListener("cb:hostResume", onHostResume as any);
      } catch {}
    };
  }, [isHostRunning, say, inviteLine, isSilenced, mediaAudioRef, isListening, playMusic, beginInviteLoop]);

  const handleStart = useCallback(async () => {
    if (!isListening) return;
    if (!canPlay) {
      setHostStatus("No media source selected. Load audio in Media Player.");
      return;
    }
    setIsHostRunning(true);
    lastInteractionRef.current = Date.now();
    // start loops
    await playMusic();
    scheduleFiveMinutePhase();
    beginInviteLoop();
    setHostStatus("Host mode running");
  }, [isListening, canPlay, playMusic, scheduleFiveMinutePhase, beginInviteLoop]);

  const handleStop = useCallback(() => {
    setIsHostRunning(false);
    try {
      if (fiveMinTimerRef.current) clearTimeout(fiveMinTimerRef.current);
      if (inviteIntervalRef.current) clearInterval(inviteIntervalRef.current);
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    } catch {}
    fiveMinTimerRef.current = null;
    inviteIntervalRef.current = null;
    resumeIntervalRef.current = null;
    try {
      if (duckRef.current && duckRef.current.timer) {
        clearTimeout(duckRef.current.timer);
      }
    } catch {}
    try {
      const a = mediaAudioRef.current;
      if (a) a.volume = 1;
    } catch {}
    pauseMusic();
    setHostStatus("Host mode stopped");
  }, [pauseMusic]);

  const handleInviteNow = useCallback(() => {
    if (!isHostRunning || isSilenced) return;
    const a = mediaAudioRef.current;
    if (!a || a.paused) return;
    try { duckMusic(6000, 0.35); } catch {}
    say(inviteLine);
  }, [isHostRunning, isSilenced, mediaAudioRef, duckMusic, say, inviteLine]);

  const handleClosing = useCallback(() => {
    if (!isListening) return;
    try { duckMusic(7000, 0.3); } catch {}
    say(closingLine);
    setHostStatus("Closing sent");
    // allow the agent to speak the closer, then stop host mode
    setTimeout(() => {
      try { handleStopRef.current?.(); } catch {}
    }, 4000);
  }, [duckMusic, say, closingLine, isListening]);

  // Keep refs in sync with latest callbacks
  useEffect(() => { handleStartRef.current = handleStart; }, [handleStart]);
  useEffect(() => { handleStopRef.current = handleStop; }, [handleStop]);
  useEffect(() => { handleClosingRef.current = handleClosing; }, [handleClosing]);

  // Basic UI
  return (
    <div className="glass-pane rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Host Mode</h2>
        <div className="microtext text-muted-foreground">
          Status: {hostStatus}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Host Content (read once after 5 minutes)</label>
          <textarea
            className="w-full min-h-[90px] px-3 py-2 border rounded-md bg-background"
            value={hostContent}
            onChange={(e) => setHostContent(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Invite Line (speak over music every minute)</label>
          <input
            className="w-full h-10 px-3 py-2 border rounded-md bg-background"
            value={inviteLine}
            onChange={(e) => setInviteLine(e.target.value)}
            placeholder='e.g., "This is a public space... hit speak to join."' />
          <label className="text-sm font-medium mt-3 block">Space Closer (spoken on Closing)</label>
          <textarea
            className="w-full min-h-[60px] px-3 py-2 border rounded-md bg-background"
            value={closingLine}
            onChange={(e) => setClosingLine(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-60"
          onClick={handleStart}
          disabled={!isListening || isSilenced || isHostRunning}
          title={!isListening ? "Start the agent session first" : isSilenced ? "Agent is silenced" : ""}
        >
          Start Host Mode
        </button>
        <button
          className="px-3 py-1.5 rounded-md border disabled:opacity-60"
          onClick={handleStop}
          disabled={!isHostRunning}
        >
          Stop Host Mode
        </button>
        <button
          className="px-3 py-1.5 rounded-md border disabled:opacity-60"
          onClick={handleInviteNow}
          disabled={!isHostRunning || isSilenced}
          title="Say invite line now"
        >
          Say Invite Now
        </button>
        <button
          className="px-3 py-1.5 rounded-md border disabled:opacity-60"
          onClick={handleClosing}
          disabled={!isListening}
          title="Speak the space closer and stop host mode"
        >
          Closing
        </button>
        <div className="microtext text-muted-foreground">
          Note: Host Mode uses the Media Player’s current audio source.
        </div>
      </div>
    </div>
  );
}
