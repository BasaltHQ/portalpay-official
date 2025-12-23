# Error Handling

Comprehensive guide to error codes, debugging, and troubleshooting under the APIM-first security model.

## Overview

PortalPay APIs use standard HTTP status codes and structured error responses. Developer-facing endpoints require an APIM subscription key in the header `Ocp-Apim-Subscription-Key` when called via the APIM custom domain.

Base API URL for clients: https://api.pay.ledger1.ai/portalpay
- Health check path: `GET /portalpay/healthz` (no subscription required)
- All API routes: `/portalpay/api/*` (APIM rewrites to backend `/api/*`)

Admin-only operations in the PortalPay web app use JWT cookies (`cb_auth_token`) with CSRF and role checks.

---

## HTTP Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request (check parameters) |
| 401 | Unauthorized | Missing or invalid APIM subscription key (developer APIs) or missing/invalid admin session (JWT) |
| 403 | Forbidden | Insufficient scope/permissions or business precondition not met |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error (retry after delay) |

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "error_code",
  "message": "Human-readable error description"
}
```

Additional fields may be included depending on the error type (for example `resetAt` for rate limiting).

---

## Common Error Codes

### Authentication & Authorization Errors

#### `unauthorized`
- HTTP: 401  
- Message: "Missing or invalid subscription key" (developer APIs)  
- Cause: Missing/invalid `Ocp-Apim-Subscription-Key` header  
- Solution: Include a valid APIM subscription key on every developer API request

cURL:
```bash
# Wrong (no key)
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/inventory"

# Correct (with APIM key)
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/inventory" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```

For admin-only operations (PortalPay UI):
- HTTP: 401  
- Message: "JWT authentication failed"  
- Cause: Missing/expired admin session cookie `cb_auth_token`  
- Solution: Re-authenticate through the web interface

#### `forbidden`
- HTTP: 403  
- Message: "Insufficient scope or not allowed"  
- Causes:
  - APIM subscription does not include the required scope (e.g., `orders:create`, `inventory:write`)
  - Attempt to access or mutate resources without proper role/ownership (admin-JWT paths)
- Solutions:
  - Ensure your APIM product/subscription grants the required scopes
  - For admin routes, confirm you are logged in with appropriate roles

Note: If using Azure Front Door (AFD) as an optional fallback path, APIM also permits requests carrying the AFD-injected internal header `x-edge-secret`. Clients should not send this header themselves.

---

### Business Logic Errors

#### `split_required`
- HTTP: 403  
- Message: "Split contract not configured for this merchant"  
- Cause: Creating orders without configuring split first  
- Solution: Configure your split in the PortalPay Admin UI (Settings → Payments → Split), then retry

#### `inventory_item_not_found`
- HTTP: 400  
- Message: "Product not found in inventory"  
- Cause: Referencing a SKU or ID that doesn't exist  
- Solution: Verify SKU/ID exists in your inventory; list inventory and confirm before ordering

```typescript
// Check inventory first
const items = await listProducts();
const exists = items.some(item => item.sku === 'ITEM-001');
if (!exists) throw new Error('inventory_item_not_found');

// Then create order
await createOrder([{ sku: 'ITEM-001', qty: 1 }]);
```

#### `items_required`
- HTTP: 400  
- Message: "At least one item is required"  
- Cause: Creating an order with an empty items array  
- Solution: Include at least one item in the order

---

### Validation Errors

#### `invalid_input`
- HTTP: 400  
- Message: "Invalid request parameters"  
- Cause: Missing required fields or invalid data types  
- Solution: Review endpoint docs for required parameters; validate types and value ranges

Common causes:
- Missing required fields (sku, name, price, etc.)
- Invalid data types (string instead of number)
- Out of range values (negative prices, invalid stock quantity)

```typescript
// Wrong
{
  "sku": "ITEM-001",
  // Missing name
  "priceUsd": "invalid",  // Should be number
  "stockQty": -10         // Should be >= -1
}

// Correct
{
  "sku": "ITEM-001",
  "name": "Product Name",
  "priceUsd": 25.00,
  "stockQty": 100
}
```

---

### Rate Limiting Errors

#### `rate_limited`
- HTTP: 429  
- Message: "Rate limit exceeded"  
- Response: Includes `resetAt` timestamp (Unix ms)  
- Cause: Too many requests in the time window  
- Solution: Implement backoff and retry after `resetAt`

Example payload:
```json
{
  "error": "rate_limited",
  "message": "Rate limit exceeded",
  "resetAt": 1698765432000
}
```

Implementation:
```typescript
async function makeRequestWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err?.error === 'rate_limited') {
        const resetAt = err.resetAt || Date.now() + 60_000;
        const waitMs = Math.max(0, resetAt - Date.now());
        if (i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
      }
      throw err;
    }
  }
}
```

Rate limit headers (if enabled at gateway):
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

### System / Degraded Mode

#### `cosmos_unavailable`
- HTTP: 200 (Degraded mode)  
- Response: Includes `degraded: true`  
- Cause: Database temporarily unavailable  
- Solution: System operates in degraded mode; data will be persisted when database recovers

```json
{
  "ok": true,
  "degraded": true,
  "reason": "cosmos_unavailable",
  "data": { "...": "..." }
}
```

Handling:
```typescript
const response = await createOrder(items);
if (response.degraded) {
  console.warn('System in degraded mode:', response.reason);
  // Inform user or queue for reconciliation
}
```

#### `platform_recipient_not_configured`
- HTTP: 400  
- Message: "Platform recipient address not set up"  
- Cause: Server/platform configuration issue  
- Solution: Contact support

---

## Debugging Tips

### 1. Use Correlation IDs

Responses may include an `X-Correlation-Id` header. Log this for faster support triage.

cURL:
```bash
curl -i "https://api.pay.ledger1.ai/portalpay/api/orders" \
  -H "Content-Type: application/json" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  -X POST -d '{...}'

# Response headers may include:
# X-Correlation-Id: 550e8400-e29b-41d4-a716-446655440000
```

### 2. Check Request Format

```typescript
console.log('Request:', { url, method: 'POST', headers, body: payload });

const response = await fetch(url, {
  method: 'POST',
  headers,
  body: JSON.stringify(payload)
});

const data = await response.json();
if (!response.ok) {
  console.error('Error:', { status: response.status, error: data });
}
```

### 3. Validate Before Sending

```typescript
function validateOrder(items: any[]) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('items_required');
  for (const item of items) {
    if (!item.sku && !item.id) throw new Error('Item must have SKU or ID');
    if (!item.qty || item.qty < 1) throw new Error('Invalid quantity');
  }
}
```

### 4. Monitor Your Usage

Track call/error/rate-limit counts and alert on spikes:
```typescript
const metrics = { calls: 0, errors: 0, rateLimits: 0 };
async function tracked(fn: () => Promise<any>) {
  metrics.calls++;
  try { return await fn(); }
  catch (e: any) { metrics.errors++; if (e?.error === 'rate_limited') metrics.rateLimits++; throw e; }
}
setInterval(() => console.log('API Metrics:', metrics), 60_000);
```

---

## Common Scenarios

### Scenario 1: Authentication Failure (Developer APIs)

- Error: `unauthorized` (401)  
- Steps:
  1. Ensure `Ocp-Apim-Subscription-Key` is present and valid
  2. Confirm your subscription is active
  3. Retry the request

### Scenario 2: Missing Scope

- Error: `forbidden` (403)  
- Steps:
  1. Check required scope in the API docs (e.g., `orders:create`)
  2. Verify your APIM product/subscription includes that scope
  3. Request access or upgrade if necessary

### Scenario 3: Split Not Configured

- Error: `split_required` (403)  
- Steps:
  1. In Admin UI, configure split (Settings → Payments → Split)
  2. Retry order creation

### Scenario 4: Rate Limited

- Error: `rate_limited` (429)  
- Steps:
  1. Read `X-RateLimit-*` headers and `resetAt`
  2. Back off until reset time
  3. Implement client-side throttling

---

## Getting Help

If you encounter persistent errors:

1. Documentation: Review the [API Reference](./api/README.md)  
2. Include Details in Reports:
   - X-Correlation-Id (if present)
   - Endpoint, method, headers (redact secrets)
   - Full error payload and status code
   - Steps to reproduce
3. Contact Support with the above information

---

Next Steps:
- [API Reference](./api/README.md)
- [Rate Limits](./limits.md)
- [Quick Start](./quickstart.md)
