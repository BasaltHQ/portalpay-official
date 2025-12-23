# Tax Catalog APIs

Retrieve tax catalog data (rates and components) for supported jurisdictions.

## Overview

- Base URL: `https://api.pay.ledger1.ai/portalpay`
- Authentication (Developer APIs): All requests require an Azure APIM subscription key header:
  - `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Gateway posture: APIM custom domain is the primary endpoint. Azure Front Door (AFD) may be configured as an optional/fallback edge; if enabled, APIM accepts an internal `x-edge-secret` per policy.
- Rate limiting headers (if enabled): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Identity: Wallet identity is resolved automatically at the gateway based on your subscription; client requests MUST NOT include wallet identity headers.

See authentication and security details in `../auth.md`. For OpenAPI schema details, refer to `../../public/openapi.yaml`.

---

## GET /portalpay/api/tax/catalog

Return the tax catalog including jurisdiction codes, aggregate rates, and components. Use this to present tax options or to validate `jurisdictionCode` values used during order creation.

### Request

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
```

Query Parameters (optional):
- None (reserved for future filtering/pagination)

Example Requests:

<!-- CODE_TABS_START -->
<!-- TAB:cURL -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/tax/catalog" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```
<!-- TAB:JavaScript -->
```javascript
const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/tax/catalog', {
  headers: { 'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY }
});
const data = await res.json();
```
<!-- TAB:Python -->
```python
import os, requests
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
r = requests.get(
  'https://api.pay.ledger1.ai/portalpay/api/tax/catalog',
  headers={'Ocp-Apim-Subscription-Key': KEY}
)
data = r.json()
```
<!-- CODE_TABS_END -->

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/tax/catalog",
  "title": "Try It: Tax Catalog",
  "description": "Fetch tax jurisdictions and rates.",
  "query": [],
  "headerName": "Ocp-Apim-Subscription-Key"
}
```

### Response

Success (200 OK):
```json
{
  "jurisdictions": [
    {
      "code": "US-CA",
      "displayName": "United States - California",
      "rate": 0.095,
      "components": [
        { "code": "state", "rate": 0.0625 },
        { "code": "county", "rate": 0.015 },
        { "code": "district", "rate": 0.0175 }
      ],
      "updatedAt": 1698765432000
    },
    {
      "code": "US-NY",
      "displayName": "United States - New York",
      "rate": 0.08875,
      "components": [
        { "code": "state", "rate": 0.04 },
        { "code": "city", "rate": 0.045 },
        { "code": "mctd", "rate": 0.00375 }
      ],
      "updatedAt": 1698765432000
    }
  ]
}
```

Notes:
- `code` values (e.g., `US-CA`) are used as `jurisdictionCode` inputs on `POST /portalpay/api/orders` and other endpoints that support tax.
- Components may vary by deployment and jurisdiction.

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
{ "error": "failed", "message": "Unable to retrieve tax catalog" }
```

---

## Code Examples

### JavaScript/TypeScript
```typescript
const APIM_SUBSCRIPTION_KEY = process.env.APIM_SUBSCRIPTION_KEY!;
const BASE_URL = 'https://api.pay.ledger1.ai/portalpay';

export async function getTaxCatalog() {
  const res = await fetch(`${BASE_URL}/api/tax/catalog`, {
    headers: { 'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY }
  });
  if (!res.ok) throw new Error(`tax_catalog_failed_${res.status}`);
  return res.json() as Promise<{
    jurisdictions: {
      code: string;
      displayName?: string;
      rate: number;
      components?: { code: string; rate: number }[];
      updatedAt?: number;
    }[];
  }>;
}
```

### Python
```python
import os, requests
APIM_SUBSCRIPTION_KEY = os.environ['APIM_SUBSCRIPTION_KEY']
BASE_URL = 'https://api.pay.ledger1.ai/portalpay'

def get_tax_catalog():
  r = requests.get(
    f'{BASE_URL}/api/tax/catalog',
    headers={'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY}
  )
  r.raise_for_status()
  return r.json()
```

---

## Notes on Auth Models

- Developer reads must use `Ocp-Apim-Subscription-Key`. Wallet identity is resolved automatically at the gateway based on your subscription; the backend trusts the resolved identity.
- Client requests do not include wallet identity; APIM strips wallet headers and stamps the resolved identity.
