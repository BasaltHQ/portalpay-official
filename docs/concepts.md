# Core Concepts

Deep dive into PortalPay's fundamental concepts and architecture.

## Overview

Understanding these core concepts will help you build robust integrations with PortalPay.

---

## Trustless & Permissionless

### What It Means

**Trustless**: No intermediaries required. All transactions are executed via smart contracts without relying on a central authority.

**Permissionless**: Anyone can use the APIs without approval, registration, or KYC. No gatekeeping.

### Why It Matters

- **Censorship Resistant**: Cannot be blocked or restricted
- **Transparent**: All on-chain activity is publicly verifiable
- **Self-Sovereign**: You maintain full control over your wallet and funds
- **No Downtime**: Decentralized infrastructure ensures availability

---

## Wallet-Based Authentication

### Your Wallet = Your API Key

Instead of traditional API keys, PortalPay uses Ethereum wallet addresses as merchant identifiers.

**Traditional Model**:
```
Registration → API Key → Store Key → Use in API calls
```

**PortalPay Model**:
```
Have Wallet → Use Wallet Address → Start Using APIs
```

### Security Implications

Since wallet addresses serve as API credentials:
- ⚠️ **Must be kept secret** (never expose client-side)
- Use environment variables
- Implement server-side proxy layer
- Rotate if compromised

See [Authentication & Security](./auth.md) for detailed practices.

---

## Split Contracts

### What Are Split Contracts?

Smart contracts that automatically distribute payments among multiple recipients based on predefined shares.

### How They Work

1. **Configuration**: Define recipients and their share percentages
2. **Payment**: Customer pays to the split contract address
3. **Distribution**: Contract automatically splits payment on-chain
4. **Trustless**: No manual intervention or trust required

### Default Split

```
Merchant: 99.5% (9950 basis points)
Platform: 0.5% (50 basis points)
Total: 100% (10000 basis points)
```

### Custom Splits

You can configure additional recipients or adjust percentages:

```typescript
{
  recipients: [
    { address: "merchant_wallet", sharesBps: 8000 },  // 80%
    { address: "partner_wallet", sharesBps: 1500 },   // 15%
    { address: "platform_wallet", sharesBps: 500 }    // 5%
  ]
}
```

**Must total 10000 bps (100%)**

---

## Receipts & Orders

### Receipt Lifecycle

```
generated → pending → paid → completed
                   ↓
                refunded
```

| Status | Description |
|--------|-------------|
| `generated` | Order created, awaiting payment |
| `pending` | Payment transaction detected, awaiting confirmations |
| `paid` | Payment confirmed on blockchain |
| `completed` | Payment split and distributed |
| `refunded` | Order refunded to customer |

### Receipt Structure

```typescript
{
  receiptId: "R-123456",           // Unique identifier
  totalUsd: 27.14,                 // Total amount
  currency: "USD",                 // Display currency
  lineItems: [                     // Itemized list
    {
      label: "Product",
      priceUsd: 25.00,
      qty: 1,
      sku: "ITEM-001"
    },
    {
      label: "Tax",
      priceUsd: 2.00
    },
    {
      label: "Processing Fee",
      priceUsd: 0.14
    }
  ],
  status: "generated",
  createdAt: 1698765432000
}
```

---

## Tax Calculation

### Jurisdiction-Based Tax

Tax rates are configured per jurisdiction and applied automatically when orders are created.

### Tax Components

Jurisdictions can have multiple tax components:

```typescript
{
  jurisdictionCode: "US-CA",
  components: [
    { code: "state", name: "State Tax", rate: 0.075 },      // 7.5%
    { code: "county", name: "County Tax", rate: 0.01 },     // 1.0%
    { code: "district", name: "District Tax", rate: 0.01 }  // 1.0%
  ],
  totalRate: 0.095  // 9.5%
}
```

### Taxable Items

Only items marked `taxable: true` are subject to tax:

```typescript
// This item will be taxed
{
  sku: "FOOD-001",
  taxable: true
}

// This item won't be taxed
{
  sku: "MEDICINE-001",
  taxable: false
}
```

---

## Processing Fees

### Fee Structure

**Base Fee**: 0.5% (platform)  
**Merchant Add-On**: Configurable (0-10%)  
**Total Fee**: Base + Merchant Add-On

### Calculation

Fees are calculated on the subtotal after tax:

```
Subtotal: $100.00
Tax (9.5%): $9.50
Subtotal with Tax: $109.50
Processing Fee (0.5%): $0.55
Total: $110.05
```

With merchant add-on of 1.5% (total 2%):
```
Subtotal: $100.00
Tax (9.5%): $9.50
Subtotal with Tax: $109.50
Processing Fee (2%): $2.19
Total: $111.69
```

---

## Currency Support

### Multi-Currency Payments

Customers can pay in various cryptocurrencies:

- **ETH** - Ethereum
- **USDC** - USD Coin (stablecoin)
- **USDT** - Tether (stablecoin)
- **cbBTC** - Coinbase Wrapped Bitcoin
- **cbXRP** - Coinbase Wrapped XRP

### Price Display

All prices are displayed in USD, but payment happens in crypto:

```
Display: $27.14 USD
Payment: ~27.14 USDC (or equivalent in ETH at current rate)
```

---

## Inventory Management

### Product Catalog

Products in your inventory can be:
- Physical goods with stock tracking
- Digital goods (unlimited stock with `stockQty: -1`)
- Services (unlimited stock)

### SKU System

**SKU** (Stock Keeping Unit) is the unique identifier for products:

```typescript
{
  sku: "COFFEE-ESPRESSO-001",  // Unique per merchant
  name: "Espresso",
  priceUsd: 3.50
}
```

**Best Practices**:
- Use hierarchical SKUs: `CATEGORY-PRODUCT-VARIANT`
- Keep them short but descriptive
- Don't reuse SKUs after deletion

---

## Data Partitioning

### Per-Wallet Data

All data is partitioned by merchant wallet address:

```
Wallet A's inventory ≠ Wallet B's inventory
Wallet A's receipts ≠ Wallet B's receipts
```

This ensures:
- Data isolation between merchants
- Efficient queries
- Scalability

### Cosmos DB Partitioning

PortalPay uses Azure Cosmos DB with wallet address as the partition key. This enables:
- Fast queries within a merchant's data
- Global distribution
- High availability

---

## Graceful Degradation

### In-Memory Fallback

When Cosmos DB is unavailable, PortalPay falls back to in-memory storage:

```json
{
  "ok": true,
  "degraded": true,
  "reason": "cosmos_unavailable",
  "data": {...}
}
```

**What This Means**:
- Your request still succeeds
- Data stored in memory temporarily
- Persisted to database when available
- May not be visible across instances

**Best Practice**: Check for `degraded` flag and log for monitoring.

---

## Payment Flow

### Complete Transaction Flow

```
1. Customer adds items to cart
   ↓
2. Merchant creates order via API
   ↓
3. System generates receipt with tax/fees
   ↓
4. Customer scans QR or clicks payment link
   ↓
5. Customer chooses crypto currency
   ↓
6. Customer pays with wallet
   ↓
7. Transaction confirmed on blockchain
   ↓
8. Split contract distributes payment
   ↓
9. Merchant receives funds automatically
```

### Payment Finality

Cryptocurrency transactions are **irreversible**. Once confirmed:
- Cannot be reversed
- Funds are in recipient wallets
- Refunds must be initiated manually

---

## Industry Packs

### What Are Industry Packs?

Pre-configured templates for different business types:

- `restaurant` - F&B industry defaults
- `retail` - Retail store defaults
- `hotel` - Hospitality defaults
- `general` - Generic settings

### Using Industry Packs

```typescript
{
  sku: "BURGER-001",
  name: "Cheeseburger",
  priceUsd: 12.99,
  industryPack: "restaurant",  // Apply restaurant-specific settings
  category: "entrees"
}
```

Benefits:
- Pre-configured categories
- Industry-specific tax settings
- Relevant metadata fields

---

## Best Practices Summary

### Security
1. Never expose wallet addresses client-side
2. Use environment variables
3. Implement server-side proxy
4. Monitor for suspicious activity

### Performance
1. Cache inventory data
2. Batch operations when possible
3. Implement request queuing
4. Use pagination for large datasets

### Reliability
1. Implement retry logic with exponential backoff
2. Handle degraded mode gracefully
3. Store correlation IDs for debugging
4. Monitor rate limits

### User Experience
1. Show real-time payment status
2. Provide clear error messages
3. Support multiple currencies
4. Send email confirmations

---

## Architecture Patterns

### Three-Tier Architecture

```
Frontend (Public) → Backend (Private) → PortalPay API
    No Wallet         Has Wallet       Processes Payments
```

### Microservices

PortalPay APIs can be integrated into microservice architectures:

```
Order Service → PortalPay Orders API
Inventory Service → PortalPay Inventory API
Payment Service → PortalPay Receipts API
```

---

## Next Steps

- [Quick Start Guide](./quickstart.md) - Get started
- [API Reference](./api/README.md) - Endpoint documentation
- [Integration Guides](./guides/ecommerce.md) - Implementation examples
- [Authentication](./auth.md) - Security details

---

**Questions?** Check the [FAQ](./README.md) or [Error Guide](./errors.md)
