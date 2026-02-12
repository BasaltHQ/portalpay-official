# Quick Start Guide

Get up and running with PortalPay using the APIM custom domain and subscription-based authentication. This guide walks you through making your first API calls with the APIM-first gateway posture.

## Base URL and Paths

- Base API URL for clients: `https://api.pay.ledger1.ai/portalpay`
- Health check: `GET /portalpay/healthz` (no subscription required)
- All API calls: prefix with `/portalpay/api/*` (rewritten to `/api/*` for the backend by APIM policy)

Example full paths:

- Inventory list: `GET https://api.pay.ledger1.ai/portalpay/api/inventory`
- Create order: `POST https://api.pay.ledger1.ai/portalpay/api/orders`
- Receipts list: `GET https://api.pay.ledger1.ai/portalpay/api/receipts`

## Authentication

- Include header on all non-health routes: `Ocp-Apim-Subscription-Key: <your-subscription-key>`
- Healthz is permitted without a subscription key.
- The APIM policy stamps `x-subscription-id` for backend wallet resolution and strips any client-supplied wallet headers.

Notes:

- Treat your APIM key like a secret; rotate if compromised.
- Client requests should not include wallet headers; the gateway resolves wallet from your subscription.

## Step 1: Set Your Subscription Key

Store your key securely as an environment variable:

```bash
# .env
APIM_SUBSCRIPTION_KEY=your_apim_subscription_key
```

## Step 2: Validate Health

Health check requires no subscription key:

```bash
curl -i https://api.pay.ledger1.ai/portalpay/healthz
```

Expect `200 OK` and a simple JSON payload.

## Step 3: Create Your First Product (Developer API)

cURL:

```bash
curl -X POST "https://api.pay.ledger1.ai/portalpay/api/inventory" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  -d '{
    "sku": "COFFEE-001",
    "name": "Espresso",
    "priceUsd": 3.50,
    "stockQty": 100,
    "category": "beverages",
    "description": "Rich espresso shot",
    "taxable": true,
    "tags": ["hot", "coffee"]
  }'
```

Success Response (200):

```json
{
  "ok": true,
  "item": {
    "id": "inv_coffee001",
    "wallet": "0x...",
    "sku": "COFFEE-001",
    "name": "Espresso",
    "priceUsd": 3.50,
    "stockQty": 100,
    "category": "beverages",
    "taxable": true,
    "createdAt": 1698765432000,
    "updatedAt": 1698765432000
  }
}
```

## Step 4: Generate Your First Order (Developer API)

cURL:

```bash
curl -X POST "https://api.pay.ledger1.ai/portalpay/api/orders" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  -d '{
    "items": [
      { "sku": "COFFEE-001", "qty": 2 }
    ],
    "jurisdictionCode": "US-CA"
  }'
```

Success Response (200):

```json
{
  "ok": true,
  "receipt": {
    "receiptId": "R-123456",
    "totalUsd": 7.70,
    "currency": "USD",
    "lineItems": [
      { "label": "Espresso", "priceUsd": 7.00, "qty": 2, "sku": "COFFEE-001" },
      { "label": "Tax", "priceUsd": 0.66 },
      { "label": "Processing Fee", "priceUsd": 0.04 }
    ],
    "createdAt": 1698765432000,
    "status": "generated",
    "jurisdictionCode": "US-CA",
    "taxRate": 0.095
  }
}
```

## Step 5: View Your Receipts (Developer API)

cURL:

```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/receipts?limit=10" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```

Success Response (200):

```json
{
  "receipts": [
    {
      "receiptId": "R-123456",
      "totalUsd": 7.70,
      "currency": "USD",
      "lineItems": [ "..."],
      "createdAt": 1698765432000,
      "status": "generated"
    }
  ]
}
```

## Customer Payment Link

Customers pay via the public portal using a payment URL:

```
https://pay.ledger1.ai/portal/{receiptId}
```

For receipt `R-123456`:

```
https://pay.ledger1.ai/portal/R-123456
```

The payment page shows:

- Itemized receipt
- Currency selection (ETH, USDC, USDT, etc.)
- Wallet payment instructions and confirmation

## Rate Limiting and Headers

When APIM policy enforcement is enabled, responses may include rate limiting headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset` (Unix ms)

Implement backoff on HTTP 429:

```json
{ "error": "rate_limited", "resetAt": 1698765432000 }
```

## Reference: OpenAPI Specification

- Full OpenAPI YAML (repo): [public/openapi.yaml](../public/openapi.yaml)
- Key developer endpoints covered:
  - Inventory: `GET/POST/DELETE /portalpay/api/inventory`
  - Orders: `POST /portalpay/api/orders`
  - Receipts: `GET/POST /portalpay/api/receipts`, `GET/POST /portalpay/api/receipts/status`, `GET /portalpay/api/receipts/{id}`, `POST /portalpay/api/receipts/refund` (admin/JWT), `POST /portalpay/api/receipts/terminal`
  - Shop and Site: `GET /portalpay/api/shop/config`, `GET /portalpay/api/site/config` (may be public depending on environment)
  - Split: `GET /portalpay/api/split/deploy`, `GET /portalpay/api/split/transactions`, `POST /portalpay/api/split/deploy` (admin/JWT)
  - Billing: `GET /portalpay/api/billing/balance`
  - Pricing: `GET /portalpay/api/pricing/config`, `POST /portalpay/api/pricing/config` (admin/JWT)
  - Tax: `GET /portalpay/api/tax/catalog`
  - Reserve: `GET /portalpay/api/reserve/balances`, `GET /portalpay/api/reserve/recommend`
  - Health: `GET /portalpay/healthz` (subscription not required)

## Complete Example: Node.js/TypeScript (Developer APIs)

```typescript
const APIM_SUBSCRIPTION_KEY = process.env.APIM_SUBSCRIPTION_KEY!;
const BASE_URL = 'https://api.pay.ledger1.ai/portalpay';

async function createProduct() {
  const res = await fetch(`${BASE_URL}/api/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY
    },
    body: JSON.stringify({
      sku: 'COFFEE-001',
      name: 'Espresso',
      priceUsd: 3.50,
      stockQty: 100,
      taxable: true
    })
  });
  return res.json();
}

async function createOrder() {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY
    },
    body: JSON.stringify({
      items: [{ sku: 'COFFEE-001', qty: 2 }],
      jurisdictionCode: 'US-CA'
    })
  });
  const data = await res.json();
  console.log('Payment URL:', `https://pay.ledger1.ai/portal/${data.receipt.receiptId}`);
  return data;
}

async function main() {
  await createProduct();
  await createOrder();
}

main().catch(console.error);
```

## Complete Example: Python (Developer APIs)

```python
import os
import requests

APIM_SUBSCRIPTION_KEY = os.environ['APIM_SUBSCRIPTION_KEY']
BASE_URL = 'https://api.pay.ledger1.ai/portalpay'
headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY
}

def create_product():
    r = requests.post(
        f'{BASE_URL}/api/inventory',
        headers=headers,
        json={'sku': 'COFFEE-001', 'name': 'Espresso', 'priceUsd': 3.50, 'stockQty': 100, 'taxable': True}
    )
    return r.json()

def create_order():
    r = requests.post(
        f'{BASE_URL}/api/orders',
        headers=headers,
        json={'items': [{'sku': 'COFFEE-001', 'qty': 2}], 'jurisdictionCode': 'US-CA'}
    )
    data = r.json()
    print('Payment URL:', f"https://pay.ledger1.ai/portal/{data['receipt']['receiptId']}")
    return data

if __name__ == '__main__':
    print(create_product())
    print(create_order())
```

## Common Issues

Unauthorized (401)

```json
{ "error": "unauthorized", "message": "Missing or invalid subscription key" }
```

- Ensure you pass `Ocp-Apim-Subscription-Key` on every developer API request.

Forbidden (403)

```json
{ "error": "forbidden", "message": "Insufficient scope or not allowed" }
```

- Your subscription does not have the required scope (e.g., `orders:create`, `inventory:write`).

Prefix Required

```json
{ "error": "not_found", "message": "Route not found. Ensure /portalpay prefix." }
```

- Ensure you are calling `https://api.pay.ledger1.ai/portalpay/...` and not the backend origin directly.

Split Required

```json
{ "error": "split_required", "message": "Split contract not configured for this merchant" }
```

- Configure split in the PortalPay Admin UI before creating orders.

Rate Limited (429)

```json
{ "error": "rate_limited", "resetAt": 1698765432000 }
```

- Respect rate limits. Use `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` and implement backoff.

## AFD (Optional Fallback)

Azure Front Door (AFD) is optional. If used, the APIM policy accepts traffic that includes the AFD-injected `x-edge-secret` header. Do not send this header from clients. See `docs/AFD_FALLBACK_PLAN.md` for procedures.

## Help & Support

- Documentation: [API Reference](./api/README.md)
- Examples: [Code Examples](./examples/README.md)
- Authentication & Security: [docs/auth.md](./auth.md)
