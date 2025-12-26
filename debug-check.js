const fetch = require('node-fetch'); // Ensure node-fetch is available or use global fetch if Node 18+

async function run() {
    const wallet = "0x3204a162ed5Fe55A611861a8160851B9dFf0f57a";
    const url = `http://localhost:3001/api/split/deploy?wallet=${wallet}&brandKey=basaltsurge`;

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "x-wallet": wallet
            }
        });

        console.log("Status:", res.status);
        const json = await res.json();
        if (json._debug?.globalDebug) {
            console.log("GLOBAL DEBUG (json._debug.globalDebug):");
            console.log(JSON.stringify(json._debug.globalDebug, null, 2));
        } else {
            console.log("NO GLOBAL DEBUG FOUND. FULL _DEBUG:");
            // Only log minimal debug info to avoid garbling
            const d = json._debug || {};
            delete d.secondaryRes; // Removing large object
            console.log(JSON.stringify(d, null, 2));
        }
    }
    } catch (e) {
    console.error("Fetch failed:", e);
}
}

run();
