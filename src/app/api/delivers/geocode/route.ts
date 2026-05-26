import { NextRequest, NextResponse } from "next/server";
import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { address } = body;

        if (!address || typeof address !== "string" || !address.trim()) {
            return NextResponse.json({ error: "Address is required" }, { status: 400 });
        }

        const apiKey = process.env.NEXT_PUBLIC_AWS_MAP_API_KEY;
        const region = process.env.AWS_REGION || "us-west-2";

        // Try direct API Key REST V2 geocoding first for ultra-low latency & zero warning noise!
        if (apiKey) {
            try {
                const restUrl = `https://places.geo.${region}.amazonaws.com/v2/search-text?key=${apiKey}`;
                const restRes = await fetch(restUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        QueryText: address, 
                        MaxResults: 1,
                        BiasPosition: [-118.2437, 34.0522] // Required by V2 REST geocoding endpoint for localized search text context
                    })
                });

                if (restRes.ok) {
                    const restData = await restRes.json();
                    const result = restData.ResultItems?.[0];
                    if (result && result.Position) {
                        const [lng, lat] = result.Position;
                        const label = result.Address?.Label || result.Title || "Search Result";
                        return NextResponse.json({ 
                            ok: true, 
                            lat, 
                            lng, 
                            label, 
                            coordinates: { latitude: lat, longitude: lng } 
                        });
                    }
                } else {
                    const errorText = await restRes.text();
                    console.warn("Direct API key geocoding fetch returned non-ok status:", errorText);
                }
            } catch (err: any) {
                console.warn("Direct API key geocoding fetch failed, falling back to SDK:", err.message);
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

        const command = new SearchPlaceIndexForTextCommand({
            IndexName: indexName,
            Text: address,
            MaxResults: 1
        });

        const response = await client.send(command);

        const result = response.Results?.[0];

        if (!result || !result.Place?.Geometry?.Point) {
            return NextResponse.json({ error: "Address could not be geocoded" }, { status: 404 });
        }

        // AWS Location returns point as [lng, lat]
        const [lng, lat] = result.Place.Geometry.Point;

        return NextResponse.json({ 
            ok: true, 
            lat, 
            lng, 
            label: result.Place.Label, 
            coordinates: { latitude: lat, longitude: lng } 
        });
    } catch (error: any) {
        console.error("Geocoding failed:", error);
        return NextResponse.json({ error: error.message || "Geocoding error" }, { status: 500 });
    }
}
