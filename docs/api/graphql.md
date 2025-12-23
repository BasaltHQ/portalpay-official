# GraphQL API

PortalPay exposes a GraphQL endpoint for read-only queries over user presence and leaderboards. All developer requests require an Azure API Management (APIM) subscription key. The APIM custom domain is the primary client endpoint; Azure Front Door (AFD) can be configured as an optional/fallback edge.

- Base URL: `https://api.pay.ledger1.ai/portalpay`
- Authentication (Developer APIs): APIM subscription key in header
  - `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Gateway posture: APIM custom domain is primary. If AFD is enabled, APIM accepts an internal `x-edge-secret` header per policy.
- Rate limit headers (if enabled): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Endpoint

- GET/POST `/portalpay/api/graphql`
  - Prefer POST with `Content-Type: application/json`
  - GET is supported for simple queries (URL length limits apply)

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
Content-Type: application/json
```

Notes:
- Only read queries are available via APIM developer subscriptions.
- Mutations (e.g., `upsertUser`, `setPresence`, `follow`) are not available via APIM developer subscriptions and must be performed within the PortalPay Admin UI where JWT cookies and CSRF protections apply.
- Do not send wallet identity headers; APIM resolves identity from your subscription and strips wallet headers. Provide viewer context as GraphQL variables when needed.

---

## Schema (Read-Only Queries)

Available queries (high level):
- `user(wallet: ID!): User` — Fetch a user profile by wallet address
- `follows(wallet: ID!, viewer: ID): FollowsInfo!` — Followers/following counts and whether `viewer` follows `wallet`
- `liveUsers: [LiveUser!]!` — Users considered currently live and public
- `leaderboard(limit: Int = 50): [User!]!` — Top users ranked by XP (max 200)

Important return types:
- `User` fields include: `wallet`, `displayName`, `bio`, `pfpUrl`, `xp`, `followersCount`, `followingCount`, `live`, `liveSince`, `lastHeartbeat`, `spaceUrl`, `spacePublic`
- `LiveUser` fields include: `wallet`, `displayName`, `pfpUrl`, `spaceUrl`, `liveSince`, `lastHeartbeat`
- `FollowsInfo` fields: `followersCount`, `followingCount`, `viewerFollows`

---

## Example Requests

<!-- CODE_TABS_START -->
<!-- TAB:cURL -->
```bash
# Example: fetch a user and follows info, plus live users and a leaderboard
curl -X POST "https://api.pay.ledger1.ai/portalpay/api/graphql" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  -d '{
    "query": "query($wallet: ID!, $viewer: ID) { user(wallet: $wallet) { wallet displayName pfpUrl xp live liveSince lastHeartbeat spaceUrl spacePublic followersCount followingCount } follows(wallet: $wallet, viewer: $viewer) { followersCount followingCount viewerFollows } liveUsers { wallet displayName pfpUrl spaceUrl liveSince lastHeartbeat } leaderboard(limit: 10) { wallet displayName pfpUrl xp } }",
    "variables": { "wallet": "0x1234567890abcdef1234567890abcdef12345678", "viewer": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" }
  }'
```
<!-- TAB:JavaScript -->
```javascript
const query = `
  query($wallet: ID!, $viewer: ID) {
    user(wallet: $wallet) {
      wallet displayName pfpUrl xp live liveSince lastHeartbeat spaceUrl spacePublic
      followersCount followingCount
    }
    follows(wallet: $wallet, viewer: $viewer) {
      followersCount followingCount viewerFollows
    }
    liveUsers { wallet displayName pfpUrl spaceUrl liveSince lastHeartbeat }
    leaderboard(limit: 10) { wallet displayName pfpUrl xp }
  }
`;
const variables = {
  wallet: '0x1234567890abcdef1234567890abcdef12345678',
  viewer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
};
const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY
  },
  body: JSON.stringify({ query, variables })
});
const data = await res.json();
// data.data.user, data.data.follows, data.data.liveUsers, data.data.leaderboard
```
<!-- TAB:Python -->
```python
import os, requests, json
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
query = """
  query($wallet: ID!, $viewer: ID) {
    user(wallet: $wallet) {
      wallet displayName pfpUrl xp live liveSince lastHeartbeat spaceUrl spacePublic
      followersCount followingCount
    }
    follows(wallet: $wallet, viewer: $viewer) {
      followersCount followingCount viewerFollows
    }
    liveUsers { wallet displayName pfpUrl spaceUrl liveSince lastHeartbeat }
    leaderboard(limit: 10) { wallet displayName pfpUrl xp }
  }
"""
variables = {
  "wallet": "0x1234567890abcdef1234567890abcdef12345678",
  "viewer": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
}
r = requests.post('https://api.pay.ledger1.ai/portalpay/api/graphql',
                  headers={'Content-Type': 'application/json',
                           'Ocp-Apim-Subscription-Key': KEY},
                  data=json.dumps({'query': query, 'variables': variables}))
data = r.json()
```
<!-- CODE_TABS_END -->

```tryit
{
  "method": "POST",
  "path": "/portalpay/api/graphql",
  "title": "Try It: GraphQL Read Queries",
  "description": "Run read-only queries.",
  "contentType": "application/json",
  "sampleBody": {
    "query": "query($wallet: ID!, $viewer: ID) { user(wallet: $wallet) { wallet displayName pfpUrl xp live liveSince lastHeartbeat spaceUrl spacePublic followersCount followingCount } follows(wallet: $wallet, viewer: $viewer) { followersCount followingCount viewerFollows } liveUsers { wallet displayName pfpUrl spaceUrl liveSince lastHeartbeat } leaderboard(limit: 10) { wallet displayName pfpUrl xp } }",
    "variables": { "wallet": "0x1234567890abcdef1234567890abcdef12345678", "viewer": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" }
  },
  "headerName": "Ocp-Apim-Subscription-Key"
}
```

---

## Example Responses

Success (200 OK):
```json
{
  "data": {
    "user": {
      "wallet": "0x1234567890abcdef1234567890abcdef12345678",
      "displayName": "Alice",
      "pfpUrl": "https://cdn.example/pfp/alice.png",
      "xp": 1234,
      "live": true,
      "liveSince": 1698789000000,
      "lastHeartbeat": 1698790100000,
      "spaceUrl": "https://portalpay.com/alice",
      "spacePublic": true,
      "followersCount": 42,
      "followingCount": 7
    },
    "follows": { "followersCount": 42, "followingCount": 7, "viewerFollows": true },
    "liveUsers": [
      {
        "wallet": "0xaaaa...bbbb",
        "displayName": "Bob",
        "pfpUrl": "https://cdn.example/pfp/bob.png",
        "spaceUrl": "https://portalpay.com/bob",
        "liveSince": 1698789500000,
        "lastHeartbeat": 1698790123456
      }
    ],
    "leaderboard": [
      { "wallet": "0xaaaa...bbbb", "displayName": "Bob", "pfpUrl": "...", "xp": 9001 }
    ]
  }
}
```

Error (example GraphQL error shape):
```json
{
  "errors": [
    { "message": "Bad Request", "path": ["user"] }
  ]
}
```

Possible responses: 200 (OK), 429 (rate limited)

---

## Rate Limiting and Origin Enforcement

- APIM custom domain is primary; if AFD is enabled it injects `x-edge-secret` which APIM validates.
- Responses may include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- On `429 Too Many Requests`, implement exponential backoff.

## Scopes

Typical APIM scopes for GraphQL read queries:
- `users:read`

Requests missing the required scope return `403 Forbidden`.

---

## Mutations

Mutations (`upsertUser`, `setPresence`, `follow`) are not available via APIM developer subscriptions. Perform administrative actions within the PortalPay Admin UI, where JWT cookies (`cb_auth_token`), CSRF protections, and role checks are enforced.
