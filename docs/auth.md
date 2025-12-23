# Authentication & Security (APIM-first with optional AFD)

PortalPay enforces Azure API Management (APIM) subscription-based authentication for all developer-facing APIs exposed on the APIM custom domain. Azure Front Door (AFD) is optional as a fallback path; when enabled, the APIM policy also permits calls carrying the AFD-injected `x-edge-secret` header. Health checks are always allowed without a subscription key.

Core objectives:
- Replace legacy trustless header model with APIM subscriptions
- Make APIM custom domain the primary public gateway for developers
- Optional AFD fallback accepted via `x-edge-secret` header injected by AFD
- Preserve JWT cookie authentication for in-app admin/UI operations
- Defense-in-depth remains: AFD/WAF (optional) → APIM → Backend

## Gateway and Base URL

- Public API gateway: `https://api.pay.ledger1.ai/portalpay`
- Health check: `GET /portalpay/healthz` (no subscription required)
- All developer API routes: prefix with `/portalpay/api/*` (APIM policy rewrites to backend `/api/*`)

Examples:
- Inventory list: `GET https://api.pay.ledger1.ai/portalpay/api/inventory`
- Create order: `POST https://api.pay.ledger1.ai/portalpay/api/orders`

## Request Requirements (Developer APIs)

- Header: `Ocp-Apim-Subscription-Key` (required for all non-health routes)
- Do not send wallet identity headers (e.g., `x-wallet`). APIM policy strips these; wallet resolution is performed using your subscription context and stamped via `x-subscription-id` for the backend.
- If AFD is used as a fallback path, APIM also accepts requests carrying the AFD-injected internal header `x-edge-secret`. Clients should not send this header; it is injected by AFD only.

cURL examples:
```bash
# Health (no key required)
curl -i https://api.pay.ledger1.ai/portalpay/healthz

# Inventory (subscription key required)
curl -i -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  https://api.pay.ledger1.ai/portalpay/api/inventory

# Create order (subscription key required)
curl -i -X POST -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  https://api.pay.ledger1.ai/portalpay/api/orders \
  -d '{"items":[{"sku":"COFFEE-001","qty":2}],"jurisdictionCode":"US-CA"}'
```

PowerShell example:
```powershell
$headers = @{ "Ocp-Apim-Subscription-Key" = $env:APIM_SUBSCRIPTION_KEY }
Invoke-RestMethod -Uri "https://api.pay.ledger1.ai/portalpay/api/orders" -Method Post -Headers $headers -ContentType "application/json" -Body (@{
  items = @(@{ sku = "COFFEE-001"; qty = 2 })
  jurisdictionCode = "US-CA"
} | ConvertTo-Json)
```

## Headers and Identity

- Required (developer APIs): `Ocp-Apim-Subscription-Key`
- Gateway-stamped identity for backend:
  - `x-subscription-id`: stamped by APIM after subscription validation; used by backend to resolve wallet and correlate requests
- Header stripping:
  - Client-supplied wallet headers (e.g., `x-wallet`, `wallet`) are stripped by APIM policy to prevent spoofing
- Optional AFD-only header:
  - `x-edge-secret`: injected by AFD and validated by APIM inbound policy when AFD is used; clients MUST NOT send this themselves
- Optional observability headers:
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
  - `X-Correlation-Id` (if enabled)

## Status Codes Matrix

- 200/201 Success: Valid subscription key (or AFD secret), sufficient scopes
- 401 Unauthorized: Missing/invalid APIM subscription key
- 403 Forbidden:
  - Valid key but insufficient product/scope or disallowed action
  - Request did not meet policy conditions (e.g., attempted to rely on stripped wallet headers)
- 429 Too Many Requests: Rate limit exceeded
- 500 Server Error: Unhandled error

Example 429 payload:
```json
{ "error": "rate_limited", "resetAt": 1698765432000 }
```

## Health Checks

- Endpoint: `GET /portalpay/healthz`
- Behavior: Returns 200 with a small JSON body (e.g., `{"status":"ok"}`)
- Access: Available without subscription key to simplify probes and quick checks

## Wallet Resolution and Trust Model

- Wallet identity for developer requests is resolved at the gateway based on your APIM subscription. APIM stamps `x-subscription-id` for the backend.
- APIM inbound policy:
  - Validates subscription key
  - Strips client wallet headers
  - Optionally permits AFD-origin traffic via `x-edge-secret` (if AFD is used)
- Backend uses the stamped subscription identity to resolve the merchant wallet and enforce scopes.
- UI/admin endpoints continue to use JWT via `cb_auth_token` cookies.

## Authorization Scopes

Developer endpoints require scopes attached to your APIM product/subscription, such as:
- `inventory:read`, `inventory:write`
- `orders:create`
- `receipts:read`, `receipts:write`
- `shop:read`
- `split:read`

Backend enforcement uses the caller context:
- APIM path: subscription identity from `x-subscription-id`
- JWT path: user roles from `cb_auth_token`

## Admin and JWT

Sensitive admin operations (e.g., shop config writes) use JWT auth:
- Cookie: `cb_auth_token`
- Obtain via in-app login (EIP-712 signature / Thirdweb)
- CSRF protection applies

Example (JWT-only admin write):
```ts
// Within PortalPay admin UI
const res = await fetch("/api/shop/config", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ processingFeePct: 1.5 }),
  credentials: "include" // send cb_auth_token cookie
});
```

## Defense-in-Depth

- Azure API Management
  - Products, subscriptions, policies, quotas, rate limits
  - Diagnostics/logging, request tracing
- Azure Front Door + WAF (optional)
  - OWASP protections, TLS, header normalization
  - Injects `x-edge-secret` when used; APIM policy can validate it
- Secrets & Identity
  - Managed identity for APIM and backend
  - Secrets stored in Azure Key Vault
- Data Partitioning & Audit
  - Cosmos DB partitioned by resolved merchant wallet
  - Immutable audit trails, monitoring/alerts

## Rate Limiting and Errors

Gateway and backend enforce quotas and rate limits per subscription/wallet. Expect:
- `401 Unauthorized`: Missing/invalid subscription key
- `403 Forbidden`: Insufficient scope or request violated policy
- `429 Too Many Requests`: Rate limit exceeded

Headers may include:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Incident Response

If a subscription key is compromised:
1. Revoke the key in APIM (or via the PortalPay admin subscription panel)
2. Rotate to a new key
3. Audit recent requests and receipts
4. Tighten rate limits, IP allowlists, and WAF rules if applicable

If admin JWT is compromised:
1. Invalidate sessions and rotate credentials
2. Review audit logs and configuration changes
3. Enforce additional CSRF and mTLS checks if necessary

## Summary

- Primary gateway: `https://api.pay.ledger1.ai/portalpay`
- Authentication (developer): `Ocp-Apim-Subscription-Key` on all non-health routes
- Healthz: permitted without subscription
- AFD: optional fallback path; accepted via APIM policy using `x-edge-secret` (injected by AFD)
- Backend trust anchored on subscription identity stamped by APIM (`x-subscription-id`); client wallet headers are stripped
