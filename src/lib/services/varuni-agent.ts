import { AzureOpenAI } from "openai";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";

type ToolHandler = (args: Record<string, any>, context: AgentContext) => Promise<any>;

export interface AgentContext {
	userId?: string;
	accessToken?: string;
	graphqlEndpoint: string;
	callGraphQL: <T>(query: string, variables?: Record<string, any>) => Promise<T>;
	systemPromptOverride?: string;
	// Optional REST support for calling internal APIs
	restBaseUrl?: string;
	callREST?: <T = any>(path: string, method: string, options?: { query?: Record<string, any>; body?: any; headers?: Record<string, string> }) => Promise<T>;
}

export interface AgentToolSpec {
	name: string;
	description: string;
	parameters?: { type: 'object'; properties?: Record<string, any>; required?: string[]; additionalProperties?: boolean };
	handler: ToolHandler;
}

export interface AgentToolSet {
	name: string;
	description: string;
	tools: AgentToolSpec[];
}

export interface AgentInitOptions {
	model?: string;
	deployment?: string;
	apiVersion?: string;
	endpoint?: string;
}

export class VaruniAgent {
	private client: AzureOpenAI;
	private modelName: string;
	private deployment: string;
	private toolsets: Map<string, AgentToolSet> = new Map();

	constructor(options?: AgentInitOptions) {
		const endpoint = options?.endpoint || (process.env.AZURE_OPENAI_ENDPOINT as string);
		const apiKey = process.env.AZURE_OPENAI_API_KEY as string;
		const apiVersion = options?.apiVersion || (process.env.AZURE_OPENAI_API_VERSION as string) || "2024-04-01-preview";
		const deployment = options?.deployment || (process.env.AZURE_OPENAI_DEPLOYMENT as string) || "gpt-5";
		const modelName = options?.model || (process.env.AZURE_OPENAI_MODEL_NAME as string) || "gpt-5";

		if (!endpoint || !apiKey) {
			throw new Error("Missing Azure OpenAI configuration");
		}

		this.client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });
		this.modelName = modelName;
		this.deployment = deployment;
	}

	registerToolSet(toolset: AgentToolSet): void {
		this.toolsets.set(toolset.name, toolset);
	}

	listToolSets(): Array<{ name: string; description: string; tools: string[] }> {
		return Array.from(this.toolsets.values()).map(ts => ({
			name: ts.name,
			description: ts.description,
			tools: ts.tools.map(t => t.name),
		}));
	}

	getToolDefinitions(toolsetName?: string): any[] {
		const activeToolsetName = (toolsetName && this.toolsets.has(toolsetName)) ? (toolsetName as string) : 'main';
		// Scope tools to the active toolset plus the main navigator to reduce confusion
		const active = this.toolsets.get(activeToolsetName);
		const sets = active ? [active, this.toolsets.get('main') as AgentToolSet].filter(Boolean) as AgentToolSet[] : (this.toolsets.has('main') ? [this.toolsets.get('main') as AgentToolSet] : []);
		const defs = sets.flatMap(ts => ts.tools).map(t => ({
			type: 'function' as const,
			function: {
				name: t.name,
				description: t.description,
				parameters: t.parameters || { type: 'object', properties: {}, additionalProperties: true },
			},
		}));
		return defs.length > 128 ? defs.slice(0, 128) : defs;
	}

	async callTool(toolName: string, args: Record<string, any>, context: AgentContext): Promise<any> {
		for (const ts of this.toolsets.values()) {
			const tool = ts.tools.find(t => t.name === toolName);
			if (tool) {
				return tool.handler(args || {}, context);
			}
		}
		throw new Error(`Unknown tool: ${toolName}`);
	}

	async chat(
		prompt: string,
		context: AgentContext,
		toolsetName?: string,
		opts?: { onEvent?: (event: any) => void; history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>; requireApproval?: boolean; sensitiveToolPatterns?: string[]; parallelizeReads?: boolean }
	): Promise<{ text: string; usedTools?: Array<{ name: string; args: any; result: any }>; events?: any[]; usage?: any }> {
		let activeToolsetName = (toolsetName && this.toolsets.has(toolsetName)) ? (toolsetName as string) : 'main';
		const buildToolDefs = () => {
			// Scope tools to the active toolset plus the main navigator to reduce confusion
			const active = this.toolsets.get(activeToolsetName);
			const sets = active ? [active, this.toolsets.get('main') as AgentToolSet].filter(Boolean) as AgentToolSet[] : (this.toolsets.has('main') ? [this.toolsets.get('main') as AgentToolSet] : []);
			const defs = sets.flatMap(ts => ts.tools).map(t => ({
				type: 'function' as const,
				function: {
					name: t.name,
					description: t.description,
					parameters: t.parameters || { type: 'object', properties: {}, additionalProperties: true },
				},
			}));
			return defs.length > 128 ? defs.slice(0, 128) : defs;
		};

		const systemPrompt = (context.systemPromptOverride && context.systemPromptOverride.trim().length > 0)
			? context.systemPromptOverride
			: `You are Varuni, an AI operations strategist.

Context: You are assisting a restaurant backoffice operator inside ledger1. Prioritize accurate, actionable advice. When helpful, you may ground your guidance in the following industry references: The Cornell School of Hotel Administration on Hospitality, Restaurant Manager’s Handbook (Kotas), The Food Service Professional Guide series, and ServSafe standards. Use these as guiding standards—not to quote—when forming recommendations.

About ledger1:
ledger1 is a unified backoffice demo platform for hospitality operations.

Core Operating Principles (inherited from The Utility Company):
- Decentralized Ownership: Enable stakeholders to own, not just participate.
- Self-Reliance: Build systems where individuals and communities can create more than they consume.
- Transparency by Design: Every action should leave a verifiable digital trace, ensuring accountability and trust.
- East Meets West: Ground modern automation in timeless philosophies—efficiency paired with intentionality.
- Vertical Integration: Leverage shared infrastructure across all subsidiaries to enable a seamless and interoperable I3AS ecosystem.

Your Capabilities as Varuni:
- Offer short, actionable insights and concrete next steps grounded in live data where possible.
- Use specialized tools and systems for each module; when tools are available, prioritize their use over manual reasoning.
- Maintain operational harmony between tokenized ownership mechanics and real-world distillery workflows.
- Act as a strategic assistant to restaurant and hospitality operators managing ledger1-affiliated menus, products, and experiences.

System Behavior:
- Always default to the most relevant module toolset when responding.
- Offer a one-line option to return to the main toolset when working in a submodule.
- Emphasize data-backed decisions, especially where inventory forecasting, token-based barrel planning, or invoice automation are concerned.

Voice & Tone:
- Be concise, confident, and instructive.
- Respect the user’s time—focus on what to do next.
- Honor the legacy of Varuni: maintain order, ensure prosperity, and enable fluid operations.

Daily framing: Always relate insights to day-part and current business date when relevant (e.g., pre-service, mid-service, close). If the user’s request could change by time horizon (today vs tomorrow), state assumptions explicitly.

Operating rules: Ask concise clarifying questions before tool calls when ambiguity exists. Keep tool chatter internal. After tools finish, produce ONE concise markdown response with: key numbers, assumptions, and 1–3 next steps.`;

		const messages: ChatCompletionCreateParamsNonStreaming["messages"] = [
			{ role: "system", content: systemPrompt },
		];
		// Inject prior conversation history if provided
		if (opts?.history && Array.isArray(opts.history) && opts.history.length) {
			for (const m of opts.history) {
				if (!m || typeof m.content !== 'string') continue;
				const role = (m.role === 'assistant' || m.role === 'user' || m.role === 'system') ? m.role : 'user';
				messages.push({ role, content: m.content } as any);
			}
		}
		// Append the current user prompt
		messages.push({ role: "user", content: prompt });

		const usedTools: Array<{ name: string; args: any; result: any }> = [];
		const events: Array<{ kind: 'tool_start' | 'tool_end' | 'final' | 'assistant_message' | 'tool_calls' | 'delta'; tool?: string; ts: number; args?: any; result?: any; message?: string; tools?: any[]; delta?: string }> = [];

		const isSensitive = (toolName: string) => {
			const patterns = opts?.sensitiveToolPatterns && opts.sensitiveToolPatterns.length ? opts.sensitiveToolPatterns : [
				'delete_', 'reset_', 'receive_purchase_order', 'mark_invoice_paid', 'update_menu_item_stock', 'set_menu_visibility', 'auth_', 'roles_delete', 'team_delete'
			];
			return patterns.some(p => {
				try { return new RegExp(p, 'i').test(toolName); } catch { return toolName.toLowerCase().includes(p.toLowerCase()); }
			});
		};
		const isReadOnly = (toolName: string) => /^(get_|list_|.*search.*|.*_get$|.*_list$)/i.test(toolName);

		// Tool-calling loop allowing up to 100 sequential invocations
		for (let i = 0; i < 100; i++) {
			const resp = await this.client.chat.completions.create({
				model: this.deployment,
				messages,
				tools: buildToolDefs(),
				tool_choice: 'auto',
			});
			const choice = resp.choices[0];
			const assistantMsg = (choice as any).message;
			const toolCalls = Array.isArray(assistantMsg.tool_calls) ? assistantMsg.tool_calls : [];
			if (toolCalls.length) {
				const summary = toolCalls.map((tc: any) => ({ name: tc.function?.name, raw: tc.function?.arguments }))
				events.push({ kind: 'tool_calls', ts: Date.now(), tools: summary });
				opts?.onEvent?.({ type: 'tool_calls', tools: summary });
				// Approval gate for sensitive tools
				if (opts?.requireApproval) {
					const sensitiveList = summary.filter((s: any) => isSensitive(String(s.name || '')))
					if (sensitiveList.length) {
						return { text: `Approval required: ${sensitiveList.map((s: any) => s.name).join(', ')}`, usedTools: usedTools.length ? usedTools : undefined, events } as any;
					}
				}
			}
			if (!toolCalls.length) {
				// Do not emit meta narration; only proceed to final summarization
				const text = choice.message.content || "";
				if (text && text.trim().length > 0) {
					messages.push({ role: 'assistant', content: text } as any);
				}
				break;
			}
			// Add assistant message with tool_calls
			messages.push(assistantMsg as any);
			// Respond to tool_calls (parallelize read-only tools if enabled)
			const runCall = async (tc: any) => {
				const toolName = tc.function.name as string;
				const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
				events.push({ kind: 'tool_start', tool: toolName, ts: Date.now(), args });
				opts?.onEvent?.({ type: 'tool_start', tool: toolName, args });
				let result: any = null;
				try {
					result = await this.callTool(toolName, args, context);
					usedTools.push({ name: toolName, args, result });
					messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) } as any);
					events.push({ kind: 'tool_end', tool: toolName, ts: Date.now(), result });
					opts?.onEvent?.({ type: 'tool_end', tool: toolName, result });
				} catch (err: any) {
					const errorMsg = err?.message || 'Tool failed';
					const suggestions: string[] = [
						'Consider retrying shortly in case of transient errors',
						'Open a different toolset and try an alternate data source',
						'Ask to bring a human into the loop to resolve credentials or configuration issues'
					];
					const errorPayload = { success: false, error: errorMsg, tool: toolName, suggestions };
					usedTools.push({ name: toolName, args, result: errorPayload });
					messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(errorPayload) } as any);
					events.push({ kind: 'tool_end', tool: toolName, ts: Date.now(), result: errorPayload });
					opts?.onEvent?.({ type: 'tool_end', tool: toolName, result: errorPayload });
				}
				if (result && typeof result === 'object' && typeof (result as any).navigate === 'string') {
					const next = String((result as any).navigate).toLowerCase();
					if (this.toolsets.has(next)) {
						activeToolsetName = next;
					}
				}
			};
			const allReadOnly = toolCalls.every((tc: any) => isReadOnly(String(tc.function?.name || '')));
			if (opts?.parallelizeReads && toolCalls.length > 1 && allReadOnly) {
				await Promise.all(toolCalls.map((tc: any) => runCall(tc)));
			} else {
				for (const tc of toolCalls) {
					await runCall(tc);
				}
			}
		}

		// Final answer pass (streaming) to summarize results into a user-facing reply
		let finalText = "";
		let usage: any = undefined;
		try {
			const stream: any = await (this.client as any).chat.completions.create({
				model: this.deployment,
				messages,
				stream: true,
				stream_options: { include_usage: true },
			});
			for await (const part of stream) {
				try {
					const delta = part?.choices?.[0]?.delta?.content || "";
					if (delta) {
						finalText += delta;
						events.push({ kind: 'delta', ts: Date.now(), delta });
						opts?.onEvent?.({ type: 'delta', delta });
					}
					usage = usage || (part as any)?.usage;
				} catch {}
			}
		} catch {
			// Fallback non-streaming
			const final = await this.client.chat.completions.create({ model: this.deployment, messages });
			finalText = final.choices?.[0]?.message?.content || "";
			usage = (final as any).usage;
		}
		events.push({ kind: 'final', ts: Date.now(), message: finalText });
		// Do not emit 'final' via onEvent here; the route will publish final with HTML
		return { text: finalText, usedTools, usage, events } as any;
	}
}

// Built-in utility to create a minimal GraphQL tool
export function createGraphQLTool(name: string, description: string, query: string): AgentToolSpec {
	return {
		name,
		description,
		parameters: {
			type: "object",
			properties: {
				variables: { type: "object", description: "GraphQL variables" },
			},
			additionalProperties: false,
		},
		handler: async (args, context) => {
			// Accept variables from args.variables or top-level args for compatibility with voice runtime
			const variables: Record<string, any> = { ...(args && args.variables ? args.variables : {}) };
			try {
				if (args && typeof args === 'object') {
					for (const [k, v] of Object.entries(args)) {
						if (k === 'variables') continue;
						if (variables[k] === undefined) variables[k] = v;
					}
				}
			} catch {}
			// Auto-fill sensible defaults for common required variables if omitted
			try {
				const needs = (v: string) => new RegExp(`\\$${v}\\s*:`, 'i').test(query);
				const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
				if (needs('period') && (variables.period === undefined || variables.period === null || variables.period === '')) {
					variables.period = 'weekly';
				}
				if ((needs('startDate') || needs('endDate'))) {
					const now = new Date();
					const end = variables.endDate ? new Date(String(variables.endDate)) : now;
					const start = variables.startDate ? new Date(String(variables.startDate)) : new Date(end);
					if (!variables.startDate) start.setDate(end.getDate() - 13);
					if (!variables.endDate) variables.endDate = toDateStr(end);
					variables.startDate = toDateStr(start);
				}
			} catch {}
			return await context.callGraphQL(query, variables);
		},
	};
}

// Built-in utility to create a minimal REST tool
export function createRESTTool(
  name: string,
  description: string,
  method: string,
  pathTemplate: string,
  parameters?: { type: 'object'; properties?: Record<string, any>; required?: string[]; additionalProperties?: boolean }
): AgentToolSpec {
  return {
    name,
    description,
    parameters: parameters || {
      type: 'object',
      properties: {
        pathParams: { type: 'object', description: 'Path parameters for dynamic segments like [id]' },
        query: { type: 'object', description: 'Query parameters' },
        body: { type: 'object', description: 'JSON body payload' },
        headers: { type: 'object', description: 'Additional headers' },
      },
      additionalProperties: true,
    },
    handler: async (args, context) => {
      const replacePathParams = (template: string, params?: Record<string, any>) => {
        if (!params) return template;
        return template.replace(/\[(.+?)\]/g, (_m, key) => {
          const v = params[key];
          if (v === undefined || v === null) throw new Error(`Missing path param: ${key}`);
          return encodeURIComponent(String(v));
        });
      };
      const path = replacePathParams(pathTemplate, args?.pathParams);
      if (typeof context.callREST === 'function') {
        return await context.callREST(path, method.toUpperCase(), { query: args?.query, body: args?.body, headers: args?.headers });
      }
      // Fallback: try to infer base from GraphQL endpoint
      const base = (() => {
        try { return new URL(context.graphqlEndpoint).origin; } catch { return ''; }
      })();
      const url = (() => {
        if (/^https?:\/\//i.test(path)) return path;
        const normalized = path.startsWith('/api') ? path : (`/api${path.startsWith('/') ? '' : '/'}${path}`);
        return `${base}${normalized}`;
      })();
      const qs = args?.query ? '?' + new URLSearchParams(Object.entries(args.query).reduce((acc: Record<string,string>, [k,v]) => {
        acc[k] = Array.isArray(v) ? v.join(',') : String(v);
        return acc;
      }, {})).toString() : '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(args?.headers || {}),
      };
      if (context.accessToken && !headers['Authorization']) headers['Authorization'] = `Bearer ${context.accessToken}`;
      const res = await fetch(url + qs, { method: method.toUpperCase(), headers, body: args?.body ? JSON.stringify(args.body) : undefined } as any);
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) throw new Error(typeof data === 'string' ? data : (data?.error || 'REST call failed'));
      return data;
    },
  };
}

