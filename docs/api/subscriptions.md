# Subscription Payments API

Merchants can create recurring subscription plans and customers can subscribe using EIP-712 signed spend permissions. Charges are automated via Azure Timer Trigger.

## Base URL

```
https://surge.basalthq.com/api/subscriptions
```

---

## Plans

### List Plans

```
GET /api/subscriptions/plans?wallet=0x...
```

Returns all active subscription plans for a merchant.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `wallet` | string | Yes | Merchant wallet address |

**Response:**

```json
{
  "success": true,
  "plans": [
    {
      "planId": "abc123",
      "name": "Gold Membership",
      "description": "Premium access",
      "priceUsd": 29.99,
      "period": "MONTHLY",
      "active": true,
      "createdAt": 1707696000000
    }
  ]
}
```

### Create Plan

```
POST /api/subscriptions/plans
```

Creates a new subscription plan. Requires authenticated merchant wallet.

**Body:**

```json
{
  "wallet": "0x...",
  "name": "Gold Membership",
  "description": "Premium access",
  "priceUsd": 29.99,
  "period": "MONTHLY"
}
```

**Supported Periods:** `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`

**Response:** `201 Created`

```json
{
  "success": true,
  "plan": { "planId": "abc123", "..." }
}
```

---

## Subscriptions

### Create Subscription (Customer)

```
POST /api/subscriptions/create
```

Customer subscribes to a plan. Requires an EIP-712 signed SpendPermission.

**Body:**

```json
{
  "planId": "abc123",
  "customerWallet": "0x...",
  "permissionSignature": "0x...",
  "permissionData": {
    "account": "0x...",
    "spender": "0x...",
    "token": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "allowance": "29990000",
    "period": 2592000,
    "start": 1707696000,
    "end": 1739318400,
    "salt": "1707696000000001",
    "extraData": "0x"
  }
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "subscription": {
    "subscriptionId": "xyz789",
    "status": "active",
    "nextChargeAt": 1707696000000
  }
}
```

### Query Subscriptions

```
GET /api/subscriptions/status?subscriptionId=xyz789
GET /api/subscriptions/status?customer=0x...
GET /api/subscriptions/status?merchant=0x...
```

### Cancel Subscription

```
POST /api/subscriptions/cancel
```

**Body:**

```json
{
  "subscriptionId": "xyz789",
  "wallet": "0x..."
}
```

Only the subscribing customer can cancel.

---

## Charging (Internal)

### Charge Single Subscription

```
POST /api/subscriptions/charge
```

Executes a single charge via Thirdweb Engine. Requires `CRON_SECRET`.

**Headers:** `x-cron-secret: <secret>`

### Batch Charge (Cron)

```
POST /api/cron/charge-subscriptions
```

Charges all due subscriptions. Called by Azure Timer Trigger daily.

**Headers:** `x-cron-secret: <secret>`

**Response:**

```json
{
  "success": true,
  "processed": 5,
  "succeeded": 4,
  "failed": 1,
  "durationMs": 12340,
  "results": [...]
}
```

---

## Platform Fee

A **0.5% platform fee** is applied to every subscription charge, consistent with one-time payments. Each charge generates a `BillingEvent` in Cosmos DB.

## Contract

- **SpendPermissionManager**: `0xf85210B21cC50302F477BA56686d2019dC9b67Ad` (Base mainnet)
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (Base mainnet, 6 decimals)
