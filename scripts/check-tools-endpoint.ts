
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API || process.env.ELEVENLABS_API_KEY || "";
const API_BASE = "https://api.elevenlabs.io/v1";

async function main() {
    console.log("🔍 Checking /convai/tools endpoint...");
    const res = await fetch(`${API_BASE}/convai/tools`, { // Guessing endpoint
        headers: { "xi-api-key": ELEVENLABS_API_KEY }
    });

    console.log(`Status: ${res.status}`);
    if (res.ok) {
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } else {
        console.log("Error:", await res.text());
    }
}

main();
