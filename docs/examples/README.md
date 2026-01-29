# Code Examples

Ready-to-use code examples for integrating PortalPay APIs.

## Quick Links

- [Complete Integration](#complete-integration)
- [JavaScript/TypeScript](#javascripttypescript)
- [Python](#python)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Complete Integration

### Developer Onboarding (Node.js)

```typescript
import fetch from 'node-fetch';

const APIM_KEY = process.env.PORTALPAY_SUBSCRIPTION_KEY!;
const BASE_URL = 'https://pay.ledger1.ai';

async function onboarding() {
  // Admin-only setup (perform in PortalPay Admin UI):
  // - Deploy split contract
  // - Configure shop settings
  // Developer APIs below use APIM subscription key.

  // 1. Create sample products
  const products = [
    { sku: 'COFFEE-001', name: 'Espresso', priceUsd: 3.50, stockQty: 100, taxable: true },
    { sku: 'LATTE-001', name: 'Latte', priceUsd: 4.50, stockQty: 100, taxable: true },
    { sku: 'PASTRY-001', name: 'Croissant', priceUsd: 3.00, stockQty: 50, taxable: true }
  ];

  for (const product of products) {
    const response = await fetch(`${BASE_URL}/api/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': APIM_KEY
      },
      body: JSON.stringify(product)
    });

    const data = await response.json();
    console.log(`✓ Created product: ${product.name}`);
  }

  // 2. Create sample order
  const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': APIM_KEY
    },
    body: JSON.stringify({
      items: [
        { sku: 'COFFEE-001', qty: 2 },
        { sku: 'PASTRY-001', qty: 1 }
      ],
      jurisdictionCode: 'US-CA'
    })
  });

  const order = await orderResponse.json();
  console.log('✓ Order created:', order.receipt.receiptId);
  console.log(`  Total: $${order.receipt.totalUsd}`);
  console.log(`  Payment URL: ${BASE_URL}/pay/${order.receipt.receiptId}`);
}

onboarding().catch(console.error);
```

### Developer Onboarding (Python)

```python
import os
import requests

APIM_KEY = os.environ['PORTALPAY_SUBSCRIPTION_KEY']
BASE_URL = 'https://pay.ledger1.ai'

def onboarding():
    headers = {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': APIM_KEY
    }
    
    # Admin-only setup (perform in PortalPay Admin UI):
    # - Deploy split contract
    # - Configure shop settings
    
    # 1. Create sample products
    products = [
        {'sku': 'COFFEE-001', 'name': 'Espresso', 'priceUsd': 3.50, 'stockQty': 100, 'taxable': True},
        {'sku': 'LATTE-001', 'name': 'Latte', 'priceUsd': 4.50, 'stockQty': 100, 'taxable': True},
        {'sku': 'PASTRY-001', 'name': 'Croissant', 'priceUsd': 3.00, 'stockQty': 50, 'taxable': True}
    ]
    
    for product in products:
        response = requests.post(
            f'{BASE_URL}/api/inventory',
            headers=headers,
            json=product
        )
        print(f"✓ Created product: {product['name']}")
    
    # 2. Create sample order
    order_response = requests.post(
        f'{BASE_URL}/api/orders',
        headers=headers,
        json={
            'items': [
                {'sku': 'COFFEE-001', 'qty': 2},
                {'sku': 'PASTRY-001', 'qty': 1}
            ],
            'jurisdictionCode': 'US-CA'
        }
    )
    order = order_response.json()
    receipt = order['receipt']
    print(f"✓ Order created: {receipt['receiptId']}")
    print(f"  Total: ${receipt['totalUsd']}")
    print(f"  Payment URL: {BASE_URL}/pay/{receipt['receiptId']}")

if __name__ == '__main__':
    onboarding()
```

---

## Portal Embedding Examples

### Modal Payment with Auto-Sizing

```tsx
import { useState, useEffect } from 'react';

function PaymentModal({ 
  receiptId, 
  recipient, 
  onSuccess, 
  onCancel 
}: {
  receiptId: string;
  recipient: `0x${string}`;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [iframeHeight, setIframeHeight] = useState(600);
  
  useEffect(() => {
    function handlePortalMessage(event: MessageEvent) {
      // Security: verify origin
      if (event.origin !== 'https://pay.ledger1.ai') return;
      
      switch (event.data?.type) {
        case 'gateway-preferred-height':
          setIframeHeight(event.data.height);
          break;
        case 'gateway-card-success':
          onSuccess();
          break;
        case 'gateway-card-cancel':
          onCancel();
          break;
      }
    }
    
    window.addEventListener('message', handlePortalMessage);
    return () => window.removeEventListener('message', handlePortalMessage);
  }, [onSuccess, onCancel]);
  
  const params = new URLSearchParams({
    recipient,
    embedded: '1', // Transparent background
    correlationId: receiptId,
  });
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-md w-full">
        <iframe
          src={`https://pay.ledger1.ai/portal/${receiptId}?${params}`}
          width="100%"
          height={iframeHeight}
          frameBorder="0"
          title="Payment"
          allow="payment; clipboard-write"
          style={{ border: 'none', borderRadius: '8px' }}
        />
      </div>
    </div>
  );
}
```

### Wide Layout Checkout Page

```tsx
function CheckoutPage({ receiptId, recipient }: {
  receiptId: string;
  recipient: `0x${string}`;
}) {
  const params = new URLSearchParams({
    recipient,
    layout: 'wide', // Two-column layout
  });
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Complete Your Purchase</h1>
      <iframe
        src={`https://pay.ledger1.ai/portal/${receiptId}?${params}`}
        width="100%"
        height="800"
        frameBorder="0"
        title="Checkout"
        allow="payment; clipboard-write"
        className="border rounded-lg"
      />
    </div>
  );
}
```

### Invoice-Style Checkout Page

```tsx
function InvoiceCheckoutPage({ receiptId, recipient }: {
  receiptId: string;
  recipient: `0x${string}`;
}) {
  const params = new URLSearchParams({
    recipient,
    invoice: '1', // Force invoice layout
    // Optional alternatives:
    // layout: 'invoice',
    // mode: 'invoice',
    embedded: '1', // Use when rendering inside an iframe to enable transparent background
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Invoice</h1>
      <iframe
        src={`https://pay.ledger1.ai/portal/${receiptId}?${params}`}
        width="100%"
        height="820"
        frameBorder="0"
        title="Invoice"
        allow="payment; clipboard-write"
        className="border rounded-lg"
      />
    </div>
  );
}
```

Sizing notes:
- Manage height dynamically using the `gateway-preferred-height` postMessage to avoid scrollbars.
- Typical minimum heights:
  - Compact: ~560–600px
  - Wide: ~800px
  - Invoice: ~720–900px depending on content
- For embedded views, you can provide an initial widget height hint via `e_h` query, e.g., `...&e_h=320`.

### Subscription Upgrade Flow

```tsx
async function handleSubscriptionUpgrade(productId: string) {
  // 1. Call your backend to create subscription payment
  const response = await fetch('/api/subscriptions/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId })
  });
  
  const data = await response.json();
  
  if (response.status === 402 && data.fallback) {
    // 2. Show portal with subscription receipt
    const { correlationId, paymentPortalUrl } = data.fallback;
    
    // Extract receiptId from portal URL or use correlationId
    const receiptId = correlationId;
    
    const params = new URLSearchParams({
      recipient: data.fallback.recipient || YOUR_WALLET,
      embedded: '1',
      correlationId,
      forcePortalTheme: '1', // Use PortalPay branding
    });
    
    const portalUrl = `https://pay.ledger1.ai/portal/${receiptId}?${params}`;
    
    // Show in modal
    showPaymentModal(portalUrl);
  }
}
```

### Complete Integration with Status Tracking

```tsx
import { useState, useEffect } from 'react';

function PaymentFlow({ items }: { items: any[] }) {
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [status, setStatus] = useState<'creating' | 'paying' | 'confirming' | 'complete'>('creating');
  
  // 1. Create order
  useEffect(() => {
    async function createOrder() {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': process.env.NEXT_PUBLIC_APIM_KEY!
        },
        body: JSON.stringify({ items })
      });
      
      const order = await response.json();
      setReceiptId(order.receipt.receiptId);
      setStatus('paying');
    }
    
    createOrder();
  }, [items]);
  
  // 2. Handle payment completion
  const handlePaymentSuccess = async () => {
    setStatus('confirming');
    
    // Wait for blockchain confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStatus('complete');
  };
  
  if (status === 'creating') {
    return <div>Creating order...</div>;
  }
  
  if (status === 'paying' && receiptId) {
    return (
      <PaymentModal
        receiptId={receiptId}
        recipient={YOUR_WALLET_ADDRESS}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setStatus('creating')}
      />
    );
  }
  
  if (status === 'confirming') {
    return <div>Confirming payment...</div>;
  }
  
  return <div>✓ Payment complete! Receipt: {receiptId}</div>;
}
```

---

## JavaScript/TypeScript

See detailed examples in:
- [Split Contract Examples](../api/split.md#code-examples)
- [Inventory Examples](../api/inventory.md#code-examples)
- [Order Examples](../api/orders.md#code-examples)
- [Receipt Examples](../api/receipts.md#code-examples)
- [Shop Config Examples](../api/shop.md#code-examples)

---

## Python

See detailed examples in:
- [Split Contract Examples](../api/split.md#code-examples)
- [Inventory Examples](../api/inventory.md#code-examples)
- [Order Examples](../api/orders.md#code-examples)
- [Receipt Examples](../api/receipts.md#code-examples)
- [Shop Config Examples](../api/shop.md#code-examples)

---

## Error Handling

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const order = await retryWithBackoff(() => createOrder(items));
```

---

## Best Practices

### Server-Side Proxy Pattern

```typescript
// Your backend API (Next.js API route)
export async function POST(req: Request) {
  const { items } = await req.json();
  
  // Your auth/validation logic here
  const session = await getSession(req);
  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  
  // Call PortalPay with server-side APIM subscription key (hidden from client)
  const response = await fetch('https://pay.ledger1.ai/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': process.env.PORTALPAY_SUBSCRIPTION_KEY!
    },
    body: JSON.stringify({ items })
  });
  
  const order = await response.json();
  return Response.json(order);
}
```

---

## Next Steps

- [API Reference](../api/README.md) - Complete API documentation
- [Integration Guides](../guides/ecommerce.md) - Step-by-step guides
- [Quick Start](../quickstart.md) - Get started in 5 minutes

---

**Questions?** Check the [Error Handling Guide](../errors.md) or [FAQ](../README.md)
