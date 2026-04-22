const { decodePaymentRequiredHeader } = require('@x402/core/http'); 

const twObj = {"x402Version":2,"error":"Payment required","accepts":[{"scheme":"exact","network":"eip155:8453","maxAmountRequired":"399000000","resource":"https://surge-sand.basalthq.com/api/x402/subscribe","description":"PortalPay Pro API subscription","mimeType":"application/json","payTo":"0x2dA9327a02A187FeF7c4a0A5B9402499fC80bB01","maxTimeoutSeconds":86400,"asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","outputSchema":{"input":{"type":"http","method":"POST","discoverable":true,"schema":{"type":"object","required":["planKey"],"properties":{"planKey":{"type":"string","enum":["starter","pro","enterprise"]}}}},"output":{"planKey":"pro"}},"extra":{"recipientAddress":"0x2dA9327a02A187FeF7c4a0A5B9402499fC80bB01","facilitatorAddress":"0x2dA9327a02A187FeF7c4a0A5B9402499fC80bB01","name":"USD Coin","version":"2","primaryType":"TransferWithAuthorization"}}],"resource":{"url":"https://surge-sand.basalthq.com/api/x402/subscribe"},"subscription":{"planKey":"pro","priceUsd":399,"currency":"USD"}};

const b64 = Buffer.from(JSON.stringify(twObj)).toString('base64'); 
try {
   console.log(decodePaymentRequiredHeader(b64));
} catch (e) {
   console.error("Decode failed!", e.message);
}
