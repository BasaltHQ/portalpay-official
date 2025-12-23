# Reserve APIs

Retrieve reserve balances and recommended reserve settings for your subscription.

## Overview

- Base URL: `https://api.pay.ledger1.ai/portalpay`
- Authentication (Developer APIs): All requests require an Azure APIM subscription key header:
  - `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Gateway posture: APIM custom domain is the primary endpoint. Azure Front Door (AFD) may be configured as an optional/fallback edge; if enabled, APIM accepts an internal `x-edge-secret` per policy.
- Rate limiting headers (if enabled): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Identity: Wallet identity is resolved automatically at the gateway based on your subscription; client requests must not include wallet identity headers.

See authentication and security details in `../auth.md`. For OpenAPI schema details, refer to `../../public/openapi.yaml`.

---

## GET /portalpay/api/reserve/balances

Return current reserve balances, by currency, for the merchant associated with your subscription.

### Request

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
```

Example Requests:

<!-- CODE_TABS_START -->
<!-- TAB:cURL -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/reserve/balances" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```
<!-- TAB:JavaScript -->
```javascript
const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/reserve/balances', {
  headers: { 'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY }
});
const data = await res.json();
```
<!-- TAB:Python -->
```python
import os, requests
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
r = requests.get(
  'https://api.pay.ledger1.ai/portalpay/api/reserve/balances',
  headers={'Ocp-Apim-Subscription-Key': KEY}
)
data = r.json()
```
<!-- CODE_TABS_END -->

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/reserve/balances",
  "title": "Try It: Reserve Balances",
  "description": "Fetch current reserve balances by currency.",
  "query": [],
  "headerName": "Ocp-Apim-Subscription-Key"
}
```

### Response

Success (200 OK):
```json
{
  "balances": [
    { "currency": "USDC", "reserved": 100.00, "target": 150.00 },
    { "currency": "ETH", "reserved": 0.025, "target": 0.050 }
  ],
  "updatedAt": 1698765432000
}
```

Notes:
- `reserved` is the currently held amount.
- `target` is the recommended or configured target amount (if available).

Response Headers (when enabled at gateway):
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## POST /portalpay/api/reserve/recommend (Admin – JWT)

Update reserve recommendation settings (e.g., jurisdictions or strategy inputs) via the PortalPay admin UI. This operation is not callable via a developer APIM key.

### Request

Headers:
```http
Content-Type: application/json
Cookie: cb_auth_token=...
```

Body (JSON) example (deployment-dependent):
```json
{
  "taxConfig": { "jurisdictions": ["US-CA"], "provider": "ava" },
  "defaultJurisdictionCode": "US-CA"
}
```

### Response

Success (200 OK):
```json
{ "ok": true }
```

Other responses:
- 400: `invalid_input`
- 403: `forbidden`
- 429: `rate_limited`
- 500: `failed`

Notes:
- Client-provided wallet headers are ignored; the authenticated admin wallet is used.
- CSRF protections apply for browser-based writes.

---

## GET /portalpay/api/reserve/recommend

Return recommended reserve targets by currency based on recent activity and configuration.

### Request

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
```

Example Requests:

<!-- CODE_TABS_START -->
<!-- TAB:cURL -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/reserve/recommend" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```
<!-- TAB:JavaScript -->
```javascript
const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/reserve/recommend', {
  headers: { 'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY }
});
const data = await res.json();
```
<!-- TAB:Python -->
```python
import os, requests
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
r = requests.get(
  'https://api.pay.ledger1.ai/portalpay/api/reserve/recommend',
  headers={'Ocp-Apim-Subscription-Key': KEY}
)
data = r.json()
```
<!-- CODE_TABS_END -->

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/reserve/recommend",
  "title": "Try It: Reserve Recommendations",
  "description": "Fetch recommended reserve targets by currency.",
  "query": [],
  "headerName": "Ocp-Apim-Subscription-Key"
}
```

### Response

Success (200 OK):
```json
{
  "recommendations": [
    { "currency": "USDC", "target": 200.00, "basis": "30d_median_payouts" },
    { "currency": "ETH", "target": 0.075, "basis": "fees_buffer" }
  ],
  "windowDays": 30,
  "updatedAt": 1698765432000
}
```

Notes:
- `basis` indicates the heuristic used (deployment-dependent).
- Use these values to adjust reserve levels for smoothing payouts and covering fees.

Response Headers (when enabled at gateway):
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Error Responses

401 Unauthorized
```json
{ "error": "unauthorized", "message": "Missing or invalid subscription key" }
```

403 Forbidden
```json
{ "error": "forbidden", "message": "Insufficient privileges or origin enforcement failed" }
```

429 Too Many Requests
```json
{ "error": "rate_limited", "resetAt": 1698765432000 }
```

500 Internal Server Error
```json
{ "error": "failed", "message": "Unable to retrieve reserve data" }
```

---

## Code Examples

### JavaScript/TypeScript
```typescript
const APIM_SUBSCRIPTION_KEY = process.env.APIM_SUBSCRIPTION_KEY!;
const BASE_URL = 'https://api.pay.ledger1.ai/portalpay';

export async function getReserveBalances() {
  const res = await fetch(`${BASE_URL}/api/reserve/balances`, {
    headers: { 'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY }
  });
  if (!res.ok) throw new Error(`reserve_balances_failed_${res.status}`);
  return res.json() as Promise<{
    balances: { currency: string; reserved: number; target?: number }[];
    updatedAt?: number;
  }>;
}

export async function getReserveRecommendations() {
  const res = await fetch(`${BASE_URL}/api/reserve/recommend`, {
    headers: { 'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY }
  });
  if (!res.ok) throw new Error(`reserve_recommend_failed_${res.status}`);
  return res.json() as Promise<{
    recommendations: { currency: string; target: number; basis?: string }[];
    windowDays?: number;
    updatedAt?: number;
  }>;
}
```

### Python
```python
import os, requests
APIM_SUBSCRIPTION_KEY = os.environ['APIM_SUBSCRIPTION_KEY']
BASE_URL = 'https://api.pay.ledger1.ai/portalpay'

def get_reserve_balances():
  r = requests.get(
    f'{BASE_URL}/api/reserve/balances',
    headers={'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY}
  )
  r.raise_for_status()
  return r.json()

def get_reserve_recommendations():
  r = requests.get(
    f'{BASE_URL}/api/reserve/recommend',
    headers={'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY}
  )
  r.raise_for_status()
  return r.json()
```

---

## Notes on Auth Models

- Developer reads must use `Ocp-Apim-Subscription-Key`. Wallet identity is resolved automatically at the gateway based on your subscription; the backend trusts the resolved identity.
- Admin/UI writes (e.g., POST `/portalpay/api/reserve/recommend`) require JWT cookies (`cb_auth_token`) with CSRF and role checks; any client-supplied wallet headers are ignored on writes.
- Client requests do not include wallet identity for developer APIs; it is resolved at the gateway per subscription.
