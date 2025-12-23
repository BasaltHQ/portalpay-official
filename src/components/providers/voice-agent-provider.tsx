"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useRealtimeVoiceAgent, UseRealtimeVoiceAgent } from "@/hooks/useRealtimeVoiceAgent";

const VoiceAgentContext = createContext<UseRealtimeVoiceAgent | null>(null);

export function VoiceAgentProvider({ children }: { children: ReactNode }) {
  const voiceAgent = useRealtimeVoiceAgent();
  return (
    <VoiceAgentContext.Provider value={voiceAgent}>
      {children}
    </VoiceAgentContext.Provider>
  );
}

export function useVoiceAgent(): UseRealtimeVoiceAgent {
  const context = useContext(VoiceAgentContext);
  if (!context) {
    throw new Error("useVoiceAgent must be used within VoiceAgentProvider");
  }
  return context;
}
