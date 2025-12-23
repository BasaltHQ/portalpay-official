import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_REALTIME_DEPLOYMENT, AZURE_OPENAI_REALTIME_API_VERSION } = process.env;

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_REALTIME_DEPLOYMENT || !AZURE_OPENAI_REALTIME_API_VERSION) {
      return NextResponse.json({ error: 'Azure OpenAI environment variables are not set.' }, { status: 500 });
    }

    const sessionsUrl = `${AZURE_OPENAI_ENDPOINT}openai/realtimeapi/sessions?api-version=${AZURE_OPENAI_REALTIME_API_VERSION}`;
    
    const { voice } = await req.json();

    const response = await fetch(sessionsUrl, {
      method: 'POST',
      headers: {
        'api-key': AZURE_OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AZURE_OPENAI_REALTIME_DEPLOYMENT,
        voice: voice || 'coral',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from Azure OpenAI sessions API:', errorText);
      return NextResponse.json({ error: `API request failed: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating voice session:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
  }
}
