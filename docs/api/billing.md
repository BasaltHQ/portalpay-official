# Billing APIs

Retrieve current wallet balances and usage information for your subscription.

## Overview

- Base URL: `https://api.pay.ledger1.ai/portalpay`
- Authentication (Developer APIs): All requests require an Azure APIM subscription key header:
  - `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Gateway posture: APIM custom domain is the primary endpoint. Azure Front Door (AFD) may be configured as an optional/fallback edge; if enabled, APIM accepts an internal `x-edge-secret` per policy.
- Rate limiting headers (if enabled): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Identity: Wallet identity is resolved automatically at the gateway based on your subscription; client requests do not include wallet identity and any wallet headers are stripped.

See authentication and security details in `../auth.md`. For OpenAPI schema details, refer to `../../public/openapi.yaml`.

---

## GET /portalpay/api/billing/balance

Return the current wallet balance and usage for the merchant associated with your subscription.

### Request

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
```

Example Requests:

<!-- CODE_TABS_START -->
<!-- TAB:cURL -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/billing/balance" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```
<!-- TAB:JavaScript -->
```javascript
const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/billing/balance', {
  headers: { 'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY }
});
const data = await res.json();
```
<!-- TAB:Python -->
```python
import os, requests
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
r = requests.get(
  'https://api.pay.ledger1.ai/portalpay/api/billing/balance',
  headers={'Ocp-Apim-Subscription-Key': KEY}
)
data = r.json()
```
<!-- CODE_TABS_END -->

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/billing/balance",
  "title": "Try It: Billing Balance",
  "description": "Fetch current wallet balance and usage.",
  "query": [],
  "headerName": "Ocp-Apim-Subscription-Key"
}
```

### Response

Success (200 OK):
```json
{
  "balances": [
    { "currency": "USDC", "available": 1250.42, "reserved": 150.00 },
    { "currency": "ETH", "available": 1.2345, "reserved": 0.0500 }
  ],
  "usage": {
    "monthUsd": 399.00,
    "lastUpdatedAt": 1698765432000
  }
}
```

Notes:
- `balances` shows available and reserved amounts by currency.
- `usage.monthUsd` may reflect fees or consumption metrics depending on deployment configuration.

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
{ "error": "failed", "message": "Unable to retrieve balance" }
```

---

## Code Examples

### JavaScript/TypeScript
```typescript
const APIM_SUBSCRIPTION_KEY = process.env.APIM_SUBSCRIPTION_KEY!;
const BASE_URL = 'https://api.pay.ledger1.ai/portalpay';

export async function getBillingBalance() {
  const res = await fetch(`${BASE_URL}/api/billing/balance`, {
    headers: { 'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY }
  });
  if (!res.ok) throw new Error(`billing_failed_${res.status}`);
  return res.json() as Promise<{
    balances: { currency: string; available: number; reserved: number }[];
    usage?: { monthUsd?: number; lastUpdatedAt?: number };
  }>;
}
```

### Python
```python
import os, requests
APIM_SUBSCRIPTION_KEY = os.environ['APIM_SUBSCRIPTION_KEY']
BASE_URL = 'https://api.pay.ledger1.ai/portalpay'

def get_billing_balance():
  r = requests.get(
    f'{BASE_URL}/api/billing/balance',
    headers={'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY}
  )
  r.raise_for_status()
  return r.json()
```

---

## Notes on Auth Models

- Developer reads must use `Ocp-Apim-Subscription-Key`. Wallet identity is resolved automatically at the gateway based on your subscription; the backend trusts the resolved identity.
- Admin/UI operations use JWT cookies (`cb_auth_token`) with CSRF and role checks for sensitive actions; billing balance is a developer read.
- Client requests do not include wallet identity; APIM strips wallet headers and stamps the resolved identity.
