# Validation Checklist (APIM custom domain)

Use these quick checks to confirm the APIM custom domain, policy, and routes are working end‑to‑end.

Primary base: https://api.pay.ledger1.ai/portalpay
Auth: Ocp-Apim-Subscription-Key on all non‑health routes

Prereqs
- Ensure you have a valid APIM subscription key exported as APIM_SUBSCRIPTION_KEY
- Port 443 open; curl or PowerShell available

1) Health (no key required)
- Expected: 200 OK with a small JSON payload

curl -i https://api.pay.ledger1.ai/portalpay/healthz

2) Inventory list (requires key)
- Expected: 401 without key; 200 OK with key and JSON array

# Without key (expect 401)
curl -i https://api.pay.ledger1.ai/portalpay/api/inventory

# With key (expect 200)
curl -i -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  https://api.pay.ledger1.ai/portalpay/api/inventory

3) Create inventory item (write path; requires key + scope)
- Expected: 200 OK with item object

curl -i -X POST "https://api.pay.ledger1.ai/portalpay/api/inventory" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  -d '{
    "sku": "CHECK-001",
    "name": "Validation Espresso",
    "priceUsd": 2.5,
    "stockQty": 10
  }'

4) Create order (write path; requires key + scope; split must be configured)
- Expected: 200 OK with receipt (or 403 split_required if split not configured)

curl -i -X POST "https://api.pay.ledger1.ai/portalpay/api/orders" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  -d '{"items":[{"sku":"CHECK-001","qty":1}],"jurisdictionCode":"US-CA"}'

5) Receipts list (requires key + scope)
- Expected: 200 OK with receipts array

curl -i -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  "https://api.pay.ledger1.ai/portalpay/api/receipts?limit=5"

6) Error semantics (missing key)
- Expected: 401 unauthorized with descriptive message

curl -i https://api.pay.ledger1.ai/portalpay/api/receipts

7) Optional: AFD fallback smoke (only if AFD is configured)
- Expected: Health 200 via AFD default endpoint; do not include key here unless testing pass‑through to APIM

curl -i https://afd-endpoint-pay-….z02.azurefd.net/healthz

8) Trace header (optional)
- If enabled, confirm X-Correlation-Id is present for triage

curl -i -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  https://api.pay.ledger1.ai/portalpay/api/inventory | findstr /I "x-correlation-id"

9) OpenAPI server URL
- Confirm OpenAPI servers include the APIM base
- File: public/openapi.yaml → servers.url: https://api.pay.ledger1.ai/portalpay

Notes
- Policy strips any client wallet headers; wallet is resolved from your subscription and stamped via x-subscription-id for backend use
- Healthz is open to simplify probes and SRE checks
- AFD is optional; APIM custom domain is the primary path
