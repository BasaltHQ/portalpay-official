import { connectDB } from '@/lib/db/connection';
import AIInsight from '@/lib/models/AIInsight';
import { VaruniAgent, createGraphQLTool } from './varuni-agent';
import { upsertEmbedding } from './rag';

let schedulerInitialized = false;

async function runNightlyInsights(): Promise<void> {
	try {
		await connectDB();
		const agent = new VaruniAgent();
		const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/api/graphql';
		const callGraphQL = async (query: string, variables?: Record<string, any>) => {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, variables }),
			});
			const json = await res.json();
			return json.data;
		};
		agent.registerToolSet({
			name: 'inventory',
			description: 'Inventory analytics and stock tools',
			tools: [
				createGraphQLTool('getInventoryAnalyticsSummary', 'Fetch inventory analytics summary', `query($startDate: Date!, $endDate: Date!){ inventoryAnalyticsSummary(startDate:$startDate,endDate:$endDate){ totalInventoryValue totalItems lowStockItems criticalItems wasteCostInPeriod wasteQtyInPeriod turnoverRatio } }`),
				createGraphQLTool('getLowStockItems', 'Fetch low stock items', `query{ lowStockItems{ id name currentStock minThreshold unit costPerUnit status } }`),
			],
		});

		const modules: Array<'dashboard'|'inventory'|'scheduling'|'invoicing'|'menu'|'analytics'|'hostpro'> = ['dashboard','inventory','scheduling','invoicing','menu','analytics','hostpro'];
		const today = new Date();
		const forDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
		for (const m of modules) {
			const result = await agent.chat(
				`Generate 3-5 actionable ${m} insights for ${forDate.toISOString().slice(0,10)} with fields: title, description, action, urgency (low|medium|critical), impact. Respond with JSON array only, no prose.`,
				{ graphqlEndpoint: endpoint, callGraphQL },
				m
			);
			let parsed: any[] = [];
			try { parsed = JSON.parse(result.text || '[]'); } catch {}
			if (!Array.isArray(parsed)) parsed = [];
			const docs = parsed.slice(0, 6).map((p) => ({
				module: m,
				title: String(p.title || 'Insight'),
				description: String(p.description || ''),
				action: String(p.action || ''),
				urgency: (p.urgency || 'medium') as any,
				impact: p.impact ? String(p.impact) : undefined,
				data: p,
				status: 'active' as const,
				forDate,
				createdBy: 'varuni',
			}));
			if (docs.length) await AIInsight.insertMany(docs);
		}
		console.log('[Varuni Scheduler] Nightly insights generated');
	} catch (e) {
		console.error('[Varuni Scheduler] error', e);
	}
}

export function initVaruniScheduler(): void {
	if (schedulerInitialized) return;
	schedulerInitialized = true;

	// Compute ms until next local midnight
	const now = new Date();
	const nextMidnight = new Date(now);
	nextMidnight.setDate(now.getDate() + 1);
	nextMidnight.setHours(0, 0, 0, 0);
	const msUntilMidnight = nextMidnight.getTime() - now.getTime();

	setTimeout(() => {
		runNightlyInsights();
		// Optional: trigger reindex nightly after insights
		if (process.env.VARUNI_RAG_ENABLED === 'true') {
			setTimeout(async () => {
				try {
					await fetch((process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000') + '/api/varuni/reindex', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
					console.log('[Varuni Scheduler] Nightly reindex triggered');
				} catch (e) {
					console.warn('[Varuni Scheduler] Nightly reindex failed', e);
				}
			}, 5_000);
		}
		// Every 24 hours afterwards
		setInterval(runNightlyInsights, 24 * 60 * 60 * 1000);
	}, Math.max(5_000, msUntilMidnight));
}


