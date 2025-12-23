import { NextRequest, NextResponse } from 'next/server';
import { initializeAgent } from '../../tools/route';
import { AgentContext } from '@/lib/services/varuni-agent';

export async function POST(req: NextRequest) {
  try {
    const { toolName, args } = await req.json();
    const agent = initializeAgent();

    const authHeader = req.headers.get('authorization') || '';
    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/api/graphql';

    const callGraphQL = async (query: string, variables?: Record<string, any>) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ query, variables }),
      });
      const json = await res.json();
      return json.data;
    };
    
    const restOrigin = (() => {
      try { return new URL(endpoint).origin; } catch { return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; }
    })();

    const callREST = async (path: string, method: string, options?: { query?: Record<string, any>; body?: any; headers?: Record<string, string> }) => {
        const isAbsolute = /^https?:\/\//i.test(path);
        const urlBase = isAbsolute ? '' : restOrigin;
        const urlPath = isAbsolute ? path : path;
        const qs = options?.query ? '?' + new URLSearchParams(Object.entries(options.query).reduce((acc: Record<string,string>, [k,v]) => { acc[k] = Array.isArray(v) ? v.join(',') : String(v); return acc; }, {})).toString() : '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          ...(options?.headers || {}),
        };
        const res = await fetch(urlBase + urlPath + qs, { method: method.toUpperCase(), headers, body: options?.body ? JSON.stringify(options.body) : undefined } as any);
        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) throw new Error(typeof data === 'string' ? data : (data?.error || 'REST call failed'));
        return data;
    };

    const context: AgentContext = {
      graphqlEndpoint: endpoint,
      callGraphQL,
      restBaseUrl: restOrigin,
      callREST,
      accessToken: authHeader.split(' ')[1] || undefined,
    };

    const result = await agent.callTool(toolName, args, context);

    return NextResponse.json({ result });

  } catch (error) {
    console.error('Error calling tool:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
