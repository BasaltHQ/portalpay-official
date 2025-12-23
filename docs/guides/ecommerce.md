# E-commerce Integration Guide

Complete guide for integrating PortalPay into your online store.

## Overview

This guide walks through integrating PortalPay into an e-commerce platform, covering product catalog, shopping cart, checkout, and order fulfillment.

## Security & Headers

- All developer API requests require the APIM subscription header:
  `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Perform PortalPay API calls on your backend; never expose your subscription key in browser code.
- Origin enforcement: requests must pass through Azure Front Door (AFD). APIM validates an internal x-edge-secret injected by AFD. Direct-origin calls are denied (403) in protected environments.
- Rate limiting headers may be returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. Implement exponential backoff on `429 Too Many Requests`.
- Admin-only endpoints (e.g., POST `/api/receipts/refund`, POST `/api/receipts/terminal`, POST `/api/split/deploy`, POST `/api/pricing/config`) are JWT cookie-protected in the PortalPay UI and are not callable via APIM.

---

## Architecture

```
┌──────────────────┐
│   Your Frontend  │ (React, Vue, etc.)
│   Shopping Cart  │
└────────┬─────────┘
         │
         │ HTTPS
         │
┌────────▼─────────┐
│  Your Backend    │ (Node.js, Python, etc.)
│  (Holds APIM Key)│
└────────┬─────────┘
         │
         │ PortalPay API
         │
┌────────▼─────────┐
│   PortalPay      │
│   Payment Flow   │
└──────────────────┘
```

---

## Step 1: Initial Setup

### Configure Split Contract (Admin-only)

Perform this one-time setup in the PortalPay Admin UI. The endpoint /api/split/deploy is JWT-only and not accessible via APIM. External integrations should not attempt to call it; your admin session in the UI performs this securely.

### Sync Product Catalog

```typescript
async function syncProducts(products: any[]) {
  for (const product of products) {
    await fetch('https://pay.ledger1.ai/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.PORTALPAY_SUBSCRIPTION_KEY
      },
      body: JSON.stringify({
        sku: product.sku,
        name: product.name,
        priceUsd: product.price,
        stockQty: product.stock,
        category: product.category,
        description: product.description,
        taxable: true,
        images: product.images
      })
    });
  }
}
```

---

## Step 2: Shopping Cart

### Frontend Cart State

```typescript
interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const [cart, setCart] = useState<CartItem[]>([]);

function addToCart(product: any) {
  setCart(prev => {
    const existing = prev.find(item => item.sku === product.sku);
    if (existing) {
      return prev.map(item =>
        item.sku === product.sku
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }
    return [...prev, { ...product, quantity: 1 }];
  });
}
```

---

## Step 3: Checkout Flow

### Backend Checkout Endpoint

```typescript
// pages/api/checkout.ts
export async function POST(req: Request) {
  const { items, customerEmail } = await req.json();
  
  // Create order in PortalPay
  const orderResponse = await fetch('https://pay.ledger1.ai/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': process.env.PORTALPAY_SUBSCRIPTION_KEY!
    },
    body: JSON.stringify({
      items: items.map((item: any) => ({
        sku: item.sku,
        qty: item.quantity
      })),
      jurisdictionCode: 'US-CA'
    })
  });
  
  const order = await orderResponse.json();
  
  // Store order in your database
  await db.orders.create({
    id: order.receipt.receiptId,
    customerEmail,
    total: order.receipt.totalUsd,
    status: 'pending',
    items
  });
  
  // Return payment URL
  return Response.json({
    receiptId: order.receipt.receiptId,
    paymentUrl: `https://pay.ledger1.ai/pay/${order.receipt.receiptId}`,
    total: order.receipt.totalUsd
  });
}
```

### Frontend Checkout

```typescript
async function checkout() {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: cart,
      customerEmail: email
    })
  });
  
  const { paymentUrl, receiptId } = await response.json();
  
  // Redirect to payment page
  window.location.href = paymentUrl;
}
```

---

## Step 4: Payment Verification

### Poll for Payment Status

```typescript
async function waitForPayment(receiptId: string): Promise<boolean> {
  const maxWait = 5 * 60 * 1000; // 5 minutes
  const interval = 5000; // 5 seconds
  const start = Date.now();
  
  while (Date.now() - start < maxWait) {
    const response = await fetch(`/api/portalpay/receipts/status?receiptId=${receiptId}`);
    const data = await response.json();
    
    if (data.status === 'completed') return true;
    if (data.status === 'failed') return false;
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false; // Timeout
}
```

---

## Step 5: Order Fulfillment

### Webhook Handler (Recommended)

```typescript
// pages/api/webhooks/portalpay.ts
export async function POST(req: Request) {
  const { event, receiptId, transactionHash } = await req.json();
  
  // Verify webhook signature (coming soon)
  // const valid = verifyWebhookSignature(req);
  // if (!valid) return Response.json({ error: 'invalid' }, { status: 401 });
  
  if (event === 'receipt.paid') {
    // Update order status
    await db.orders.update({
      where: { id: receiptId },
      data: {
        status: 'paid',
        transactionHash,
        paidAt: new Date()
      }
    });
    
    // Send confirmation email
    await sendOrderConfirmation(receiptId);
    
    // Fulfill order
    await fulfillOrder(receiptId);
  }
  
  return Response.json({ ok: true });
}
```

---

## Complete Example

See [Code Examples](../examples/README.md) for complete working implementations.

---

## Best Practices

1. **Never expose your APIM subscription key client-side**
2. **Validate cart items before checkout**
3. **Store orders in your database**
4. **Use webhooks for payment notifications** (polling as fallback)
5. **Handle payment failures gracefully**
6. **Send email confirmations**
7. **Implement inventory management**

---

## Next Steps

- [Payment Gateway Guide](./payment-gateway.md)
- [API Reference](../api/README.md)
- [Code Examples](../examples/README.md)
