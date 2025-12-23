# Split Contract APIs

Configure and inspect payment split configuration and indexed split transactions.

## Overview

Split configuration controls how payments are distributed among recipients. Before accepting payments, merchants should configure a split for their wallet.

- Base URL: `https://api.pay.ledger1.ai/portalpay`
- Authentication (Developer APIs – reads): All developer reads require an Azure APIM subscription key header:
  - `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Gateway posture: APIM custom domain is the primary endpoint. Azure Front Door (AFD) may be configured as an optional/fallback edge; if enabled, APIM accepts an internal `x-edge-secret` per policy.
- Identity: Wallet identity is resolved automatically at the gateway based on your subscription; clients MUST NOT send wallet identity headers.
- Admin/UI writes (configuration) are performed via the PortalPay web app using JWT cookies (`cb_auth_token`) with CSRF protections and role checks. Public developer subscriptions cannot perform admin writes.

See `../auth.md` for full security model details. See OpenAPI at `../../public/openapi.yaml`.

---

## GET /portalpay/api/split/deploy

Required scopes: `split:read`

Get split configuration for the merchant associated with your subscription.

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/split/deploy",
  "title": "Get Split Configuration",
  "description": "Retrieve the split configuration for your merchant account"
}
```

### Request

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
```

Example Requests:

<!-- CODE_TABS_START -->
<!-- TAB:cURL -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/split/deploy" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```
<!-- TAB:JavaScript -->
```javascript
const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/split/deploy', {
  headers: { 'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY }
});
const data = await res.json(); // { split: { address, recipients[] } }
```
<!-- TAB:Python -->
```python
import os, requests
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
r = requests.get(
  'https://api.pay.ledger1.ai/portalpay/api/split/deploy',
  headers={'Ocp-Apim-Subscription-Key': KEY}
)
data = r.json()  # { 'split': { ... } }
```
<!-- CODE_TABS_END -->

### Response

Success (200 OK):
```json
{
  "split": {
    "address": "0x...",
    "recipients": [
      { "address": "0xMerchantWallet", "sharesBps": 9950 },
      { "address": "0xPlatformAddress", "sharesBps": 50 }
    ]
  }
}
```

Not Configured (200 OK):
```json
{
  "split": {
    "address": null,
    "recipients": []
  }
}
```

---

## POST /portalpay/api/split/deploy (Admin – JWT; APIM writes not permitted)

Idempotently persist split address and recipients for a merchant. This is an admin-only operation performed inside the PortalPay web app and is not callable via developer APIM subscriptions.

### Request

Headers:
```http
Content-Type: application/json
Cookie: cb_auth_token=...
```

Body Parameters (subset aligned to OpenAPI SplitConfigUpsertRequest):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `splitAddress` | string | No | Optional pre-deployed split contract address |
| `recipients` | array | No | Recipients array of `{ address, sharesBps }` |

Recipient item:
- `address` (string, required): Recipient wallet
- `sharesBps` (integer, required): Basis points of split shares (e.g., 9950 = 99.5%)

Example (admin UI, fetch):
```javascript
const res = await fetch('/api/split/deploy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // send cb_auth_token
  body: JSON.stringify({
    splitAddress: '0xOptionalExistingSplit',
    recipients: [
      { address: '0xMerchantWallet', sharesBps: 9950 },
      { address: '0xPlatformAddress', sharesBps: 50 }
    ]
  })
});
const data = await res.json();
```

### Response

Success (200 OK):
```json
{
  "ok": true,
  "split": {
    "address": "0x...",
    "recipients": [
      { "address": "0xMerchantWallet", "sharesBps": 9950 },
      { "address": "0xPlatformAddress", "sharesBps": 50 }
    ]
  }
}
```

Idempotent (already configured):
```json
{
  "ok": true,
  "split": { "address": "0x...", "recipients": [ "..." ] },
  "idempotent": true
}
```

---

## GET /portalpay/api/split/transactions

Required scopes: `split:read`

List split transactions indexed by the split indexer. Availability varies by deployment.

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/split/transactions",
  "title": "List Split Transactions",
  "description": "Retrieve indexed split transactions",
  "query": [
    {
      "name": "address",
      "type": "string",
      "required": false,
      "placeholder": "0x..."
    }
  ]
}
```

### Request

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
```

Query Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | No | Optional filter by recipient/split address |

Example:
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/split/transactions" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```

### Response

Success (200 OK):
```json
[
  {
    "id": "txn_abc",
    "receiptId": "rcpt_12345",
    "amount": 27.0,
    "currency": "USDC",
    "status": "completed",
    "timestamp": "2025-01-01T12:00:00Z",
    "transactionHash": "0x...",
    "fees": 0.2
  }
]
```

Response Headers (when enabled at gateway):
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## POST /portalpay/api/split/withdraw (Deprecated)

Deprecated in favor of client-side `PaymentSplitter.release` via a connected wallet. Do not use this endpoint.

Behavior:
- Returns HTTP 410 Gone with a deprecation payload; some deployments may return 204 No Content.

### Request

Headers:
```http
Content-Type: application/json
```

### Responses

204 No Content (deprecated endpoint)
```http
HTTP/1.1 204 No Content
x-correlation-id: ...
```

410 Gone (preferred deprecation response)
```json
{
  "error": "deprecated",
  "reason": "use_connected_wallet",
  "message": "Deprecated in favor of client-side PaymentSplitter.release"
}
```

Migration:
- Use your wallet to call the split contract’s `release` function directly.

---

## Error Responses

401 Unauthorized
```json
{ "error": "unauthorized", "message": "Missing or invalid subscription key" }
```

403 Forbidden
```json
{ "error": "forbidden", "message": "Insufficient scope or origin enforcement failed" }
```

429 Too Many Requests
```json
{ "error": "rate_limited", "resetAt": 1698765432000 }
```

400 Bad Request
```json
{ "error": "invalid_input", "message": "Invalid request parameters" }
```

500 Internal Server Error
```json
{ "error": "failed", "message": "Error message details" }
```

---

## Important Notes

### Split Contract Requirement

A split configuration should be in place before:
- Creating orders
- Accepting payments

Creating orders without a configured split may result in `split_required`.

### Basis Points (BPS)

Split shares are specified in basis points:
- 10000 bps = 100%
- 9950 bps = 99.50%
- 50 bps = 0.50%

### Idempotency

The admin split configuration route is idempotent:
- First call: Creates configuration
- Subsequent calls: Returns existing configuration with `idempotent: true`

---

## Code Examples

### JavaScript/TypeScript (developer reads)
```typescript
const APIM_SUBSCRIPTION_KEY = process.env.APIM_SUBSCRIPTION_KEY!;
const BASE_URL = 'https://api.pay.ledger1.ai/portalpay';

export async function getSplitConfig() {
  const res = await fetch(`${BASE_URL}/api/split/deploy`, {
    headers: { 'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY }
  });
  return res.json(); // { split: SplitConfig }
}

export async function listSplitTransactions(address?: string) {
  const params = new URLSearchParams();
  if (address) params.set('address', address);
  const res = await fetch(`${BASE_URL}/api/split/transactions?${params}`, {
    headers: { 'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY }
  });
  return res.json() as Promise<{
    id: string; receiptId: string; amount: number; currency: string;
    status: string; timestamp: string; transactionHash: string; fees: number;
  }[]>;
}
```

### JavaScript/TypeScript (admin write – JWT, in browser)
```typescript
export async function configureSplitAdmin(input: {
  splitAddress?: string;
  recipients?: { address: string; sharesBps: number }[];
}) {
  const res = await fetch('/api/split/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // sends cb_auth_token
    body: JSON.stringify(input)
  });
  return res.json();
}
```

### Python (developer reads)
```python
import os, requests
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
BASE_URL = 'https://api.pay.ledger1.ai/portalpay'

def get_split_config():
    r = requests.get(f'{BASE_URL}/api/split/deploy', headers={'Ocp-Apim-Subscription-Key': KEY})
    return r.json().get('split')

def list_split_transactions(address=None):
    params = {}
    if address:
        params['address'] = address
    r = requests.get(f'{BASE_URL}/api/split/transactions',
                     headers={'Ocp-Apim-Subscription-Key': KEY},
                     params=params)
    return r.json()  # array
```

---

## Notes on Auth Models

- Developer reads must use `Ocp-Apim-Subscription-Key`. Wallet identity is resolved automatically at the gateway based on your subscription; the backend trusts the resolved identity.
- Admin/UI operations use JWT cookies (`cb_auth_token`) with CSRF and role checks for sensitive actions (configure split).
- Client requests do not include wallet identity; APIM strips wallet headers and stamps the resolved identity.
