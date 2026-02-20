/**
 * Shop Agent Dispatcher
 * A lightweight event-based bridge for tool calls from the voice agent runtime.
 * The agent emits a CustomEvent("pp:agent:tool_call", { detail: { name, args, requestId } })
 * and listens for CustomEvent("pp:agent:tool_result", { detail: { requestId, result } }).
 *
 * This allows us to route tool calls to the shopTools registry without coupling to the UI.
 */

export type ToolCall = {
  name: string;
  args?: Record<string, any>;
  requestId?: string; // Optional correlation id
  sessionId?: string; // Optional session scoping id
};

export type ToolResultPayload = {
  requestId?: string;
  sessionId?: string;
  result: { ok: boolean; data?: any; error?: string };
};

export type ToolsRegistry = Record<string, (args: Record<string, any>) => Promise<{ ok: boolean; data?: any; error?: string }>>;

/**
 * Normalize tool names from model events to our registry:
 * - snake_case -> camelCase (get_shop_details -> getShopDetails)
 * No aliasing; tools must be called by their exact registered names.
 */
function normalizeToolName(name: string): string {
  const n = String(name || "").trim();
  if (!n) return n;
  const lower = n.toLowerCase();

  // Known aliases
  const aliasMap: Record<string, string> = {};

  // snake_case to camelCase fallback
  if (lower.includes("_")) {
    return lower.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/^([a-z])/, (c) => c.toUpperCase()) // PascalCase
      .replace(/^([A-Z])/, (c) => c.toLowerCase()); // back to camelCase
  }

  return n;
}

export function installShopAgentDispatcher(tools: ToolsRegistry) {
  const handler = async (evt: Event) => {
    try {
      const ce = evt as CustomEvent<ToolCall>;
      const { name, args = {}, requestId, sessionId } = ce.detail || ({} as ToolCall);
      if (!name || typeof name !== "string") return;

      const resolvedName = normalizeToolName(name);
      const fn = tools[resolvedName] || tools[name];

      // Developer logging for visibility into tool routing
      try {
        const sc = (window as any).__pp_shopContext || {};
        const wallet = String(sc?.merchantWallet || "");
        console.info("[Agent] Tool call start:", { name, resolvedName, args, requestId, sessionId, wallet });
        try {
          fetch("/api/agent/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "tool_call_start",
              name: name || resolvedName,
              requestId,
              sessionId,
              wallet,
              args
            })
          }).catch(() => { });
        } catch { }
      } catch { }

      if (!fn || typeof fn !== "function") {
        try {
          console.warn("[Agent] Tool not found:", { name, resolvedName, available: Object.keys(tools) });
        } catch { }
        const payload: ToolResultPayload = { requestId, sessionId, result: { ok: false, error: `tool_not_found:${name}` } };
        window.dispatchEvent(new CustomEvent("pp:agent:tool_result", { detail: payload }));
        return;
      }

      let res = { ok: false, error: "unknown_error" } as { ok: boolean; data?: any; error?: string };
      try {
        res = await fn(args || {});
      } catch (e: any) {
        res = { ok: false, error: e?.message || "tool_failed" };
      }

      try {
        const sc2 = (window as any).__pp_shopContext || {};
        const wallet2 = String(sc2?.merchantWallet || "");
        console.info("[Agent] Tool call result:", { resolvedName, ok: res.ok, error: res.error, dataPreview: res.ok ? (Array.isArray((res as any).data) ? (res as any).data : typeof (res as any).data) : undefined, requestId, sessionId, wallet: wallet2 });
        try {
          fetch("/api/agent/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "tool_call_result",
              name: resolvedName,
              requestId,
              sessionId,
              wallet: wallet2,
              result: { ok: res.ok, error: res.error }
            })
          }).catch(() => { });
        } catch { }
      } catch { }

      const payload: ToolResultPayload = { requestId, sessionId, result: res };
      window.dispatchEvent(new CustomEvent("pp:agent:tool_result", { detail: payload }));
      if (requestId) {
        window.dispatchEvent(new CustomEvent(`pp:agent:tool_result:${requestId}`, { detail: payload }));
      }
    } catch {
      // swallow
    }
  };

  window.addEventListener("pp:agent:tool_call", handler as EventListener);
  return () => {
    try {
      window.removeEventListener("pp:agent:tool_call", handler as EventListener);
    } catch { }
  };
}

/**
 * Helper for manual testing: dispatch a tool call and wait for the result once.
 */
export function testToolCall(name: string, args?: Record<string, any>): Promise<ToolResultPayload> {
  return new Promise((resolve) => {
    const requestId = `${name}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const onResult = (evt: Event) => {
      const ce = evt as CustomEvent<ToolResultPayload>;
      if (ce.detail?.requestId === requestId) {
        window.removeEventListener("pp:agent:tool_result", onResult as EventListener);
        resolve(ce.detail);
      }
    };
    window.addEventListener("pp:agent:tool_result", onResult as EventListener, { once: true });
    const detail: ToolCall = { name, args: args || {}, requestId };
    window.dispatchEvent(new CustomEvent("pp:agent:tool_call", { detail }));
  });
}
