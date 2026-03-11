require('dotenv').config({ path: '.env.local' });

async function testLlama() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  
  const texts = ["Hello world", "How are you?"];
  const targetLanguageName = "Gen Z Slang";

  const systemPrompt = `You are a professional localization expert.
Translate the provided JSON array of strings into ${targetLanguageName}.
CRITICAL RULES:
1. Preserve the exact array order and length.
2. Return strictly a raw, valid JSON array of strings. Do not use markdown blocks like \`\`\`json.
3. Only return the final JSON array. No conversational text.
4. If ${targetLanguageName} is a phonetic accent, cipher, or gibberish (e.g. Minionese, Groot, Pirate Speak, Gen Z Slang), generate a highly thematic approximation for each string.`;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(texts) }
          ]
        })
      }
    );

    const data = await response.json();
    console.log("Raw Response:");
    console.log(data.result?.response);
  } catch(e) {
    console.error(e);
  }
}

testLlama();
