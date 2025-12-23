import { AzureOpenAI } from 'openai';
import Embedding from '@/lib/models/Embedding';

const embeddingsDeployment = process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT || 'text-embedding-3-large';

export async function embedText(text: string): Promise<number[]> {
	const endpoint = process.env.AZURE_OPENAI_ENDPOINT as string;
	const apiKey = process.env.AZURE_OPENAI_API_KEY as string;
	const apiVersion = (process.env.AZURE_OPENAI_API_VERSION as string) || '2024-04-01-preview';
	const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment: embeddingsDeployment });
	const res = await client.embeddings.create({ model: embeddingsDeployment, input: text });
	return (res.data?.[0]?.embedding as number[]) || [];
}

export async function upsertEmbedding(namespace: string, entityType: string, entityId: string, text: string, metadata?: Record<string, any>) {
	const vec = await embedText(text);
	await Embedding.findOneAndUpdate(
		{ namespace, entityType, entityId },
		{ text, embedding: vec, metadata },
		{ upsert: true, new: true }
	);
}

export async function searchEmbedding(namespace: string, query: string, limit: number = 5) {
	const vec = await embedText(query);
	// naive cosine similarity in JS; for performance consider $vectorSearch in MongoDB Atlas or Azure Cosmos DB vector support
	const docs = await Embedding.find({ namespace }).limit(200).lean();
	function cosine(a: number[], b: number[]) {
		const dot = a.reduce((s, x, i) => s + x * (b[i] || 0), 0);
		const na = Math.sqrt(a.reduce((s, x) => s + x * x, 0)) || 1;
		const nb = Math.sqrt(b.reduce((s, x) => s + x * x, 0)) || 1;
		return dot / (na * nb);
	}
	const scored = docs.map(d => ({ ...d, score: cosine(vec, (d as any).embedding || []) }))
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map(d => ({ id: String((d as any)._id), text: (d as any).text, metadata: (d as any).metadata, score: (d as any).score }));
	return scored;
}


