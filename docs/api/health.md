# Health APIs

Service health check endpoint.

## Overview

- Base URL: `https://api.pay.ledger1.ai/portalpay`
- Authentication: Public. No subscription key is required for this endpoint.
- Gateway posture: APIM custom domain is the primary endpoint. Azure Front Door (AFD) may be configured as an optional/fallback edge; if enabled, APIM accepts an internal `x-edge-secret` per policy.
- Rate limiting headers (if enabled): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

See authentication and security details in `../auth.md`. For OpenAPI schema details, refer to `../../public/openapi.yaml`.

---

## GET /portalpay/healthz

Returns the health status of the service and dependencies.

### Request

Examples:

<!-- CODE_TABS_START -->
<!-- TAB:cURL (public) -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/healthz"
```
<!-- TAB:cURL (with header present, ignored) -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/healthz" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" # not required
```
<!-- TAB:JavaScript -->
```javascript
const res = await fetch('https://api.pay.ledger1.ai/portalpay/healthz');
const data = await res.json();
```
<!-- TAB:Python -->
```python
import requests
BASE = 'https://api.pay.ledger1.ai/portalpay'
r = requests.get(f'{BASE}/healthz')
data = r.json()
```
<!-- CODE_TABS_END -->

```tryit
{
  "method": "GET",
  "path": "/portalpay/healthz",
  "title": "Try It: Healthz",
  "description": "Check service health status. No subscription key required.",
  "query": []
}
```

### Response

Success (200 OK):
```json
{
  "ok": true,
  "status": "healthy",
  "time": 1698765432000,
  "dependencies": {
    "apim": "ok",
    "backend": "ok",
    "database": "ok"
  }
}
```

Degraded/Unavailable (503 Service Unavailable):
```json
{
  "ok": false,
  "status": "degraded",
  "time": 1698765432000,
  "dependencies": {
    "apim": "ok",
    "backend": "ok",
    "database": "degraded"
  },
  "reason": "cosmos_unavailable"
}
```

If rate limiting is enabled, the following headers may be present:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Error Responses

403 Forbidden (origin enforcement)
```json
{ "error": "forbidden", "message": "Origin enforcement failed" }
```

429 Too Many Requests
```json
{ "error": "rate_limited", "resetAt": 1698765432000 }
```

503 Service Unavailable
```json
{ "error": "unavailable", "message": "Service not healthy" }
```

---

## Code Examples

### JavaScript/TypeScript
```typescript
const BASE_URL = 'https://api.pay.ledger1.ai/portalpay';

export async function getHealth() {
  const res = await fetch(`${BASE_URL}/healthz`);
  return res.json() as Promise<{
    ok: boolean;
    status: string;
    time?: number;
    dependencies?: Record<string, string>;
    reason?: string;
  }>;
}
```

### Python
```python
import requests
BASE_URL = 'https://api.pay.ledger1.ai/portalpay'

def get_health():
  r = requests.get(f'{BASE_URL}/healthz')
  r.raise_for_status()
  return r.json()
```

---

## Notes

- Public endpoint: no APIM subscription key is required.
- Health responses may include dependency statuses for diagnostic purposes.
