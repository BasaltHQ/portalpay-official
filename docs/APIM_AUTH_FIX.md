# APIM Authentication Policy Update (APIM-first Gateway)

## Summary

We updated the APIM policy and documentation to make the APIM custom domain the primary public gateway for developer APIs. Clients call the APIM endpoint directly with an APIM subscription key. Azure Front Door (AFD) is optional; when used, APIM also accepts traffic carrying the AFD-injected `x-edge-secret` header. Health checks remain permitted without a subscription.

Primary endpoint for clients:
- Base: `https://api.pay.ledger1.ai/portalpay`
- Health: `GET https://api.pay.ledger1.ai/portalpay/healthz`
- API routes: `/portalpay/api/*` (APIM rewrites to backend `/api/*`)

## Problem (historical)

Write endpoints (POST/PUT/PATCH/DELETE) were failing due to misleading policy behavior:
- APIM policy previously injected a hardcoded wallet via `x-resolved-wallet`, which the backend did not trust or use.
- Documentation and examples required AFD-only routing, rejecting direct APIM-origin requests.

## What changed

### APIM policy
- Removed hardcoded `x-resolved-wallet` header injections.
- Kept `x-subscription-id` stamping for backend wallet resolution.
- Strips client-supplied wallet headers (e.g., `x-wallet`, `wallet`) to prevent spoofing.
- Permits either:
  - A valid APIM subscription (i.e., `Ocp-Apim-Subscription-Key` present and valid), or
  - AFD traffic with the `x-edge-secret` header (optional fallback).
- Bypasses `GET /portalpay/healthz`.
- Rewrites `/portalpay/api/*` → `/api/*` to the backend.

Policy sources:
- `infra/policies/portalpay-api-policy.xml`
- `infra/policies/portalpay-api-policy-body.json`

### Backend behavior
- Backend resolves the merchant wallet from Cosmos DB using the stamped `x-subscription-id`.
- Write endpoints rely on subscription identity and scopes; client wallet headers are ignored.

## Correct authentication flow (APIM-first)

```
1. Client → APIM custom domain with subscription key
2. APIM policy:
   - Validates subscription key (or validates AFD x-edge-secret if present)
   - Stamps x-subscription-id
   - Strips client wallet headers
   - Rewrites /portalpay/api/* → /api/*
3. Backend:
   - Resolves wallet by subscription
   - Enforces scopes and processes request
```

## Verification tools

Use `scripts/verify-apim-subscriptions.js` to confirm subscription documents exist in Cosmos and are correctly configured.

List all subscription docs:
```bash
node scripts/verify-apim-subscriptions.js
```

Check a specific subscription:
```bash
node scripts/verify-apim-subscriptions.js <subscription-id>
```

If missing, seed the subscription document:
```bash
node scripts/seed-apim-subscription.js <subscription-id> <merchant-wallet> <scopes...>
# Example:
node scripts/seed-apim-subscription.js portalpay-prod-merchant1 0x1234567890abcdef1234567890abcdef12345678 inventory:read inventory:write receipts:read
```

## Deploy updated APIM policy

```powershell
# From repo root
./scripts/set-apim-policy.ps1
```
Or via Azure Portal:
1. APIM → APIs → PortalPay API → All operations policy
2. Paste contents from `infra/policies/portalpay-api-policy.xml`
3. Save

## Test endpoints (APIM-first)

Create inventory item:
```bash
curl -X POST "https://api.pay.ledger1.ai/portalpay/api/inventory" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  -d '{
    "sku": "TEST-001",
    "name": "Test Product",
    "priceUsd": 9.99,
    "stockQty": 100
  }'
```

Delete inventory item:
```bash
curl -X DELETE "https://api.pay.ledger1.ai/portalpay/api/inventory?id=<item-id>" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```

Health (no key required):
```bash
curl -i https://api.pay.ledger1.ai/portalpay/healthz
```

## Troubleshooting

401 Unauthorized
- Missing or invalid `Ocp-Apim-Subscription-Key`
- Subscription document missing in Cosmos
- Subscription status not active

403 Forbidden
- Insufficient product/scope or disallowed action
- Attempted to rely on stripped wallet headers

Wrong wallet used
- Verify subscription document wallet in Cosmos
- Re-seed with correct wallet if needed

Commands:
```bash
node scripts/verify-apim-subscriptions.js <subscription-id>
node scripts/seed-apim-subscription.js <subscription-id> <wallet> <scopes...>
```

## Backend reference

`src/lib/gateway-auth.ts` implements APIM/JWT gateway logic that:
- Validates APIM subscription from `x-subscription-id`
- Fetches subscription doc from Cosmos
- Enforces scopes and resolves wallet

## Summary

- APIM custom domain is primary: `https://api.pay.ledger1.ai/portalpay`
- Developer calls require `Ocp-Apim-Subscription-Key` (non-health routes)
- AFD is optional; APIM accepts AFD traffic via `x-edge-secret` when present
- Backend wallet resolution is by subscription; client wallet headers are stripped
- Write endpoints function once subscriptions are correctly seeded and policy applied
