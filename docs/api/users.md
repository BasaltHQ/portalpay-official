# Users API

The Users API provides developer-facing endpoints for discovering users and viewing live presence. All developer API requests require an Azure API Management (APIM) subscription key. The APIM custom domain is the primary client endpoint; Azure Front Door (AFD) can be configured as an optional/fallback edge.

- Base URL: `https://api.pay.ledger1.ai/portalpay`
- Authentication (Developer APIs): APIM subscription key in header
  - `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Gateway posture: APIM custom domain is primary. If AFD is enabled, APIM accepts an internal `x-edge-secret` header per policy.
- Rate limit headers (if enabled): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## GET /portalpay/api/users/search

Search users by wallet/displayName text, XP range, and dynamic metrics (domains, platforms, languages).

Query parameters:
- `q` (string, optional): case-insensitive text search across wallet and displayName
- `domains` (string, optional): comma-separated list; user must have all of these domains in metrics
- `platforms` (string, optional): comma-separated list; user must have all of these platforms in metrics
- `languages` (string, optional): comma-separated list; user must have all of these languages in metrics
- `minXp` (number, optional): minimum XP (>= 0)
- `maxXp` (number, optional): maximum XP (>= 0)
- `live` (boolean, optional): if `true`, only returns users currently live and with `spacePublic = true`
- `limit` (number, optional): number of results to return; clamped to [1, 100], default 25
- `scan` (number, optional): max items scanned server-side before filtering; clamped to [limit, 1000], default 400

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
```

Example requests

<!-- CODE_TABS_START -->
<!-- TAB:cURL -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/users/search?q=alice&minXp=100&domains=gaming,defi&limit=25" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```
<!-- TAB:JavaScript -->
```javascript
const params = new URLSearchParams({
  q: 'alice',
  minXp: '100',
  domains: 'gaming,defi',
  limit: '25'
});
const res = await fetch(`https://api.pay.ledger1.ai/portalpay/api/users/search?${params.toString()}`, {
  headers: { 'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY }
});
const data = await res.json();
// data.users: array of results
```
<!-- TAB:Python -->
```python
import os, requests
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
params = {
  'q': 'alice',
  'minXp': '100',
  'domains': 'gaming,defi',
  'limit': '25'
}
r = requests.get('https://api.pay.ledger1.ai/portalpay/api/users/search', params=params,
                 headers={'Ocp-Apim-Subscription-Key': KEY})
data = r.json()
```
<!-- CODE_TABS_END -->

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/users/search",
  "title": "Try It: Users Search",
  "description": "Search users with filters.",
  "query": [
    { "name": "q", "type": "string", "placeholder": "alice" },
    { "name": "minXp", "type": "number", "placeholder": "100" },
    { "name": "domains", "type": "string", "placeholder": "gaming,defi" },
    { "name": "limit", "type": "number", "default": 25 }
  ],
  "headerName": "Ocp-Apim-Subscription-Key"
}
```

Success (200 OK):
```json
{
  "users": [
    {
      "wallet": "0x1234...abcd",
      "displayName": "Alice",
      "pfpUrl": "https://cdn.example/pfp/alice.png",
      "xp": 1234,
      "live": true,
      "lastSeen": 1698790000000,
      "lastHeartbeat": 1698790100000,
      "domains": ["gaming", "defi"],
      "platforms": ["farcaster", "twitter"],
      "languages": ["en", "es"]
    }
  ],
  "total": 1
}
```

Degraded (Cosmos unavailable):
```json
{ "users": [], "degraded": true, "reason": "cosmos_unavailable" }
```

Notes:
- Ordering defaults to XP descending server-side.
- Filtering for domains/platforms/languages requires that the user has all requested keys in metrics.
- `scan` controls how many items are scanned before server-side filtering; results are then sliced to `limit`.

Possible responses: 200 (OK), 429 (rate limited)

---

## GET /portalpay/api/users/live

Returns users with recent presence heartbeats, indicating they are currently live and public.

Behavior:
- Active if `lastHeartbeat` within the last 2 minutes
- Only returns users with `live = true` and `spacePublic = true`

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
```

Example requests

<!-- CODE_TABS_START -->
<!-- TAB:cURL -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/users/live" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```
<!-- TAB:JavaScript -->
```javascript
const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/users/live', {
  headers: { 'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY }
});
const data = await res.json();
// data.live: array of live users
```
<!-- TAB:Python -->
```python
import os, requests
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
r = requests.get('https://api.pay.ledger1.ai/portalpay/api/users/live',
                 headers={'Ocp-Apim-Subscription-Key': KEY})
data = r.json()
```
<!-- CODE_TABS_END -->

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/users/live",
  "title": "Try It: Users Live",
  "description": "List currently live/public users.",
  "query": [],
  "headerName": "Ocp-Apim-Subscription-Key"
}
```

Success (200 OK):
```json
{
  "live": [
    {
      "wallet": "0x1234...abcd",
      "displayName": "Alice",
      "pfpUrl": "https://cdn.example/pfp/alice.png",
      "spaceUrl": "https://portalpay.com/alice",
      "liveSince": 1698789000000,
      "lastHeartbeat": 1698790100000,
      "languages": ["en"],
      "domains": ["gaming"],
      "platform": "farcaster"
    }
  ]
}
```

Degraded (Cosmos unavailable):
```json
{ "live": [], "degraded": true, "reason": "cosmos_unavailable" }
```

Possible responses: 200 (OK), 429 (rate limited)

---

## Rate Limiting and Gateway Posture

- APIM custom domain is primary; if AFD is enabled it injects `x-edge-secret` which APIM validates.
- Responses may include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- On `429 Too Many Requests`, implement exponential backoff.

## Scopes

Typical APIM scopes for Users endpoints:
- `users:read`

Requests missing the required scope return `403 Forbidden`.

---

## Notes on Auth Models

- Developer reads must use `Ocp-Apim-Subscription-Key`. Wallet identity is resolved automatically at the gateway based on your subscription.
- Admin/UI write operations related to users (e.g., profile updates, presence tracking writes, follow/unfollow mutations) are performed within the PortalPay app and require JWT cookies (`cb_auth_token`) with CSRF protections and role checks; these are not available via APIM developer subscriptions.
- Do not send wallet identity headers; APIM strips wallet headers and stamps the resolved identity.
