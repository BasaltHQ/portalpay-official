type EventListener = (event: any) => void;

class SSEBus {
	private channels: Map<string, Set<EventListener>> = new Map();

	subscribe(channel: string, listener: EventListener): () => void {
		if (!this.channels.has(channel)) this.channels.set(channel, new Set());
		this.channels.get(channel)!.add(listener);
		return () => {
			try { this.channels.get(channel)?.delete(listener); } catch {}
		};
	}

	publish(channel: string, event: any): void {
		const set = this.channels.get(channel);
		if (!set || set.size === 0) return;
		for (const l of set) {
			try { l(event); } catch {}
		}
	}
}

// Singleton across module reloads
const globalAny = global as any;
export const sseBus: SSEBus = globalAny.__VARUNI_SSE_BUS__ || new SSEBus();
if (!globalAny.__VARUNI_SSE_BUS__) globalAny.__VARUNI_SSE_BUS__ = sseBus;

export default sseBus;


