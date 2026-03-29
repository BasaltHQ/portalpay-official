/**
 * Build script: openapi.yaml → openapi.json
 *
 * Converts the canonical YAML spec to JSON for agent discovery tools.
 * Propagates the global `security` declaration into every operation
 * that doesn't already have an explicit override, so that crawlers
 * like agentcash see per-operation auth mode without needing to
 * resolve OpenAPI inheritance themselves.
 */
const fs = require("fs");
const yaml = require("yaml");

const src = fs.readFileSync("public/openapi.yaml", "utf8");
const doc = yaml.parseDocument(src);
const spec = doc.toJSON();

// Global security (e.g. [{ apimKey: [] }])
const globalSecurity = spec.security || [];

// Walk every path → method → operation and inject security + x-auth-mode if missing
if (spec.paths) {
  for (const [path, methods] of Object.entries(spec.paths)) {
    if (!methods || typeof methods !== "object") continue;
    for (const method of ["get", "post", "put", "patch", "delete", "options", "head"]) {
      const op = methods[method];
      if (!op) continue;
      // Only inject security if the operation has NO explicit security field at all
      if (!("security" in op)) {
        op.security = globalSecurity;
      }

      // Inject x-auth-mode so discovery tools know what auth is required
      if (!op["x-auth-mode"]) {
        const secArr = op.security || [];
        const isEmpty = secArr.length === 0 || (secArr.length === 1 && Object.keys(secArr[0]).length === 0);
        const hasPayment = !!op["x-payment-info"];
        if (isEmpty && !hasPayment) {
          op["x-auth-mode"] = "none";
        } else if (hasPayment) {
          op["x-auth-mode"] = "x402";
        } else {
          op["x-auth-mode"] = "apiKey";
        }
      }

      // Ensure 401 response exists for protected endpoints
      if (op["x-auth-mode"] === "apiKey" && op.responses && !op.responses["401"]) {
        op.responses["401"] = { description: "Unauthorized – missing or invalid API key" };
      }
    }
  }
}

fs.writeFileSync("public/openapi.json", JSON.stringify(spec, null, 2));
console.log("✓ public/openapi.json written with explicit per-operation security");
