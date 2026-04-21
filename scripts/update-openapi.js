const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "../public/openapi.json");
const data = JSON.parse(fs.readFileSync(p, "utf-8"));

// Update guidance
data.info["x-guidance"] = `Welcome to PortalPay's Agentic Commerce API.
To use this API:
1. Non-paid resources are fully accessible with standard API keys or without auth depending on the path.
2. Payment-gated resources under /api/x402/ must be paid for. For example, POST /api/x402/orders to discover the pricing required. The server will reply with HTTP 402 and an x402 payment challenge.
3. Use an x402-capable wallet (like agentcash MCP) to fulfill the challenge and attach the x-payment proof back to Leicester.
4. To resubscribe or provision API keys, use /api/x402/subscribe and clear the x402 challenge there.`;

// Update orders
if (data.paths["/api/x402/orders"] && data.paths["/api/x402/orders"].post) {
  data.paths["/api/x402/orders"].post["x-payment-info"] = {
    price: {
      mode: "dynamic",
      currency: "USD",
      min: "0.10",
      max: "10000.00"
    },
    protocols: [{ x402: {} }]
  };
}

// Update subscribe
if (data.paths["/api/x402/subscribe"] && data.paths["/api/x402/subscribe"].post) {
  data.paths["/api/x402/subscribe"].post["x-payment-info"] = {
    price: {
      mode: "dynamic",
      currency: "USD",
      min: "0.00",
      max: "500.00"
    },
    protocols: [{ x402: {} }]
  };
}

// Add siwx and x402 security schemes
data.components = data.components || {};
data.components.securitySchemes = data.components.securitySchemes || {};

data.components.securitySchemes.siwx = {
  type: "http",
  scheme: "siwx",
  description: "Sign-In with X identity protocol"
};

data.components.securitySchemes.x402 = {
  type: "http",
  scheme: "x402",
  description: "x402 payment protocol"
};

if (!data.components.securitySchemes.apimKey) {
  data.components.securitySchemes.apimKey = {
    type: "apiKey",
    name: "Ocp-Apim-Subscription-Key",
    in: "header"
  };
}

fs.writeFileSync(p, JSON.stringify(data, null, 2));
console.log("Updated openapi.json");
