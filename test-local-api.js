async function testApi() {
  const texts = ["Hello world", "How are you?", "Accept crypto at the point of sale"];
  const targetLang = "Quenya (Elvish)";

  try {
    const res = await fetch('http://localhost:3001/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang, sourceLang: 'en' })
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testApi();
