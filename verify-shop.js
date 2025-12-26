const fetch = require('node-fetch');

async function run() {
    const wallet = "0x3204a162ed5Fe55A611861a8160851B9dFf0f57a";
    const url = `http://localhost:3001/api/shop/config?wallet=${wallet}&brandKey=basaltsurge`;

    try {
        const res = await fetch(url, { method: "GET", headers: { "x-wallet": wallet } });
        console.log("Status:", res.status);
        const json = await res.json();
        console.log(JSON.stringify(json, null, 2));
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
run();
