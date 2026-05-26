import { NextRequest, NextResponse } from "next/server";
import { LocationClient, SearchPlaceIndexForSuggestionsCommand } from "@aws-sdk/client-location";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text } = body;

        if (!text || typeof text !== "string" || !text.trim() || text.length < 3) {
            return NextResponse.json({ suggestions: [] });
        }

        const apiKey = process.env.NEXT_PUBLIC_AWS_MAP_API_KEY;
        const region = process.env.AWS_REGION || "us-west-2";

        // Try direct API Key REST V2 suggestions first for ultra-low latency & zero warning noise!
        if (apiKey) {
            try {
                const restUrl = `https://places.geo.${region}.amazonaws.com/v2/suggest?key=${apiKey}`;
                const restRes = await fetch(restUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        QueryText: text, 
                        MaxResults: 5,
                        BiasPosition: [-118.2437, 34.0522] // Default centered coordinates for localized suggestions bias
                    })
                });

                if (restRes.ok) {
                    const restData = await restRes.json();
                    const suggestions = restData.ResultItems?.map((r: any) => {
                        const placeId = r.Place?.PlaceId || r.Query?.QueryId || "";
                        return {
                            text: r.Title || "",
                            placeId: placeId
                        };
                    }) || [];
                    return NextResponse.json({ ok: true, suggestions });
                } else {
                    const errorText = await restRes.text();
                    console.warn("Direct API key suggestions fetch returned non-ok status:", errorText);
                }
            } catch (err: any) {
                console.warn("Direct API key suggestions fetch failed, falling back to SDK:", err.message);
            }
        }

        // Fallback: Use location client SDK if API key is not present or direct REST fetch fails
        const client = new LocationClient({
            region: region,
            credentials: {
                accessKeyId: process.env.AWS_MAPS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_MAPS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
            }
        });

        const indexName = process.env.AWS_PLACE_INDEX_NAME || process.env.NEXT_PUBLIC_AWS_MAP_NAME || "PortalPayPlaceIndex";

        const command = new SearchPlaceIndexForSuggestionsCommand({
            IndexName: indexName,
            Text: text,
            MaxResults: 5
        });

        const response = await client.send(command);

        const suggestions = response.Results?.map((r) => ({
            text: r.Text,
            placeId: r.PlaceId
        })) || [];

        return NextResponse.json({ ok: true, suggestions });
    } catch (error: any) {
        console.error("Suggestions failed:", error);
        return NextResponse.json({ error: error.message || "Suggestions error" }, { status: 500 });
    }
}
