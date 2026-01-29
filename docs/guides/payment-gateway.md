# Payment Gateway Integration

Build a custom payment gateway using PortalPay infrastructure.

## Overview

This guide demonstrates how to build a payment gateway that accepts cryptocurrency payments using PortalPay's infrastructure.

## Security & Headers

- All developer API requests require the APIM subscription header:
  `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Always perform PortalPay API calls on your server; never expose your subscription key in browser code.
- Origin enforcement: requests must transit Azure Front Door (AFD). APIM validates an internal x-edge-secret set by AFD. Direct-origin calls are denied (403) in protected environments.
- Rate limiting headers may be returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Use Cases

- Accept crypto payments on your website
- Add crypto payment option to existing checkout
- Build a payment widget/plugin
- Create a white-label payment solution

---

## Integration Flow

```
Customer → Your App → Generate Receipt → PortalPay Payment Page → Confirmation
```

---

## Quick Integration

### 1. Generate Payment Link

```typescript
async function createPaymentLink(amount: number, description: string) {
  // Create a simple order
  const response = await fetch('https://pay.ledger1.ai/api/orders', {
    method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.PORTALPAY_SUBSCRIPTION_KEY!
      },
    body: JSON.stringify({
      items: [
        {
          sku: 'PAYMENT-001',
          qty: 1
        }
      ]
    })
  });
  
  const order = await response.json();
  
  return {
    receiptId: order.receipt.receiptId,
    paymentUrl: `https://pay.ledger1.ai/pay/${order.receipt.receiptId}`,
    amount: order.receipt.totalUsd
  };
}
```

### 2. Display Payment Options

```tsx
function CheckoutButton({ amount }: { amount: number }) {
  const [loading, setLoading] = useState(false);
  
  async function handlePayWithCrypto() {
    setLoading(true);
    
    try {
      const { paymentUrl } = await createPaymentLink(amount, 'Order Payment');
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Payment failed:', error);
      setLoading(false);
    }
  }
  
  return (
    <button 
      onClick={handlePayWithCrypto}
      disabled={loading}
      className="px-6 py-3 bg-blue-600 text-white rounded-md"
    >
      {loading ? 'Processing...' : 'Pay with Crypto'}
    </button>
  );
}
```

---

## Advanced Integration

### Embedded Portal iframe (recommended)

PortalPay provides a portal route you can embed directly to collect payments. This works in dashboard modals and shop pages and specifically allows embedding from https://pay.ledger1.ai.

---

## Portal URL Parameters

The portal supports multiple parameters to customize the experience:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `receiptId` | string | Yes | The receipt/order ID (in URL path) |
| `recipient` | string | Yes | Merchant wallet address (0x...) for Cosmos partitioning |
| `layout` | string | No | Layout mode: `compact` (default), `wide`, or `invoice` |
| `embedded` | string | No | Set to `1` to enable transparent background for iframe embedding |
| `correlationId` | string | No | Parent tracking ID for subscription flows and postMessage coordination |
| `forcePortalTheme` | string | No | Set to `1` to force PortalPay branding instead of merchant theme |

### Layout Modes

#### Compact Mode (Default)
- **Max width**: 428px
- **Layout**: Single column, mobile-optimized
- **Best for**: Modal dialogs, mobile views, subscription upgrades
- **URL**: `/portal/{receiptId}?recipient={wallet}`

```tsx
// Compact mode example (default)
const compactUrl = `https://pay.ledger1.ai/portal/${receiptId}?recipient=${wallet}`;
```

#### Wide Mode
- **Max width**: 980px
- **Layout**: Two-column grid (receipt left, payment right)
- **Best for**: Full-page checkouts, desktop experiences
- **URL**: `/portal/{receiptId}?recipient={wallet}&layout=wide`

```tsx
// Wide mode example
const wideUrl = `https://pay.ledger1.ai/portal/${receiptId}?recipient=${wallet}&layout=wide`;
```

#### Invoice Mode
- Max width: responsive two-column (receipt left, payment right) with decorative gradient
- Layout: Invoice presentation optimized for full-page, desktop/tablet
- Best for: Invoicing flows, quotes, long line items
- URL options:
  - `/portal/{receiptId}?recipient={wallet}&invoice=1` (suffix forces invoice view)
  - `/portal/{receiptId}?recipient={wallet}&layout=invoice`
  - `/portal/{receiptId}?recipient={wallet}&mode=invoice`

```tsx
// Invoice mode example (using invoice=1 suffix)
const invoiceUrl = `https://pay.ledger1.ai/portal/${receiptId}?recipient=${wallet}&invoice=1`;

// Alternate forms:
const invoiceUrlByLayout = `https://pay.ledger1.ai/portal/${receiptId}?recipient=${wallet}&layout=invoice`;
const invoiceUrlByMode = `https://pay.ledger1.ai/portal/${receiptId}?recipient=${wallet}&mode=invoice`;
```

### Sizing & Presentation
- Set `embedded=1` when rendering in an iframe to enable transparent background.
- Width should be `100%`. Height should be managed via the PostMessage event `gateway-preferred-height`.
- The portal posts `gateway-preferred-height` as content changes; set your iframe height to the provided value.
- Typical minimum heights:
  - Compact: ~560–600px
  - Wide: ~800px
  - Invoice: ~720–900px depending on content
- You can optionally set `e_h={pixels}` to hint the embedded widget panel height inside invoice/wide views.

---

## Embedding Patterns

### Pattern 1: Modal Embedding (Recommended for Dashboards)

Use compact layout with embedded mode for dashboard modals:

```tsx
function PaymentModal({ receiptId, recipient, onClose }: {
  receiptId: string;
  recipient: `0x${string}`;
  onClose: () => void;
}) {
  const [iframeHeight, setIframeHeight] = useState(600);
  
  useEffect(() => {
    // Listen for height adjustments from portal
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'gateway-preferred-height') {
        setIframeHeight(event.data.height);
      }
      if (event.data?.type === 'gateway-card-success') {
        // Payment succeeded
        onClose();
      }
      if (event.data?.type === 'gateway-card-cancel') {
        // User cancelled
        onClose();
      }
    }
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose]);
  
  const params = new URLSearchParams({
    recipient,
    embedded: '1', // Transparent background
    correlationId: receiptId,
  });
  
  const portalUrl = `https://pay.ledger1.ai/portal/${receiptId}?${params}`;
  
  return (
    <div className="modal-overlay">
      <iframe
        src={portalUrl}
        width="100%"
        height={iframeHeight}
        frameBorder="0"
        title="Payment Checkout"
        allow="payment; clipboard-write"
        style={{ border: 'none', borderRadius: '8px' }}
      />
    </div>
  );
}
```

### Pattern 2: Full-Page Embedding

Use wide layout for full-page checkout experiences:

```tsx
function CheckoutPage({ receiptId, recipient }: {
  receiptId: string;
  recipient: `0x${string}`;
}) {
  const params = new URLSearchParams({
    recipient,
    layout: 'wide', // Two-column layout
  });
  
  const portalUrl = `https://pay.ledger1.ai/portal/${receiptId}?${params}`;
  
  return (
    <iframe
      src={portalUrl}
      width="100%"
      height="800"
      frameBorder="0"
      title="PortalPay Checkout"
      allow="payment; clipboard-write"
      style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}
    />
  );
}
```

### Pattern 3: Subscription Payment

Use correlationId for subscription flows:

```tsx
function SubscriptionUpgrade({ 
  subscriptionId,
  recipient,
}: {
  subscriptionId: string;
  recipient: `0x${string}`;
}) {
  const params = new URLSearchParams({
    recipient,
    embedded: '1',
    correlationId: subscriptionId,
    forcePortalTheme: '1', // Use PortalPay branding
  });
  
  // Receipt ID can be the subscription ID - API will create receipt
  const portalUrl = `https://pay.ledger1.ai/portal/${subscriptionId}?${params}`;
  
  return (
    <iframe
      src={portalUrl}
      width="100%"
      height="600"
      frameBorder="0"
      title="Upgrade Subscription"
      allow="payment; clipboard-write"
    />
  );
}
```

---

## PostMessage API

The portal communicates with parent windows via postMessage for embedded scenarios.

### Events Sent from Portal

#### 1. Preferred Height (`gateway-preferred-height`)
Sent when portal content size changes for responsive iframe sizing.

```typescript
{
  type: 'gateway-preferred-height',
  height: number,           // Preferred height in pixels
  correlationId?: string,   // Your tracking ID
  receiptId: string        // Receipt ID
}
```

#### 2. Payment Success (`gateway-card-success`)
Sent when payment completes successfully.

```typescript
{
  type: 'gateway-card-success',
  token: string,           // Confirmation token (ppc_{receiptId}_{timestamp})
  correlationId?: string,  // Your tracking ID
  receiptId: string,      // Receipt ID
  recipient: string       // Merchant wallet
}
```

#### 3. Payment Cancel (`gateway-card-cancel`)
Sent when user cancels the payment.

```typescript
{
  type: 'gateway-card-cancel',
  correlationId?: string,  // Your tracking ID
  receiptId: string,      // Receipt ID
  recipient: string       // Merchant wallet
}
```

### Example Event Handler

```typescript
useEffect(() => {
  function handlePortalMessage(event: MessageEvent) {
    // Verify origin for security
    const trustedOrigin = 'https://pay.ledger1.ai';
    if (event.origin !== trustedOrigin) return;
    
    switch (event.data?.type) {
      case 'gateway-preferred-height':
        // Adjust iframe height
        setIframeHeight(event.data.height);
        break;
        
      case 'gateway-card-success':
        // Payment succeeded
        console.log('Payment confirmed:', event.data.token);
        handlePaymentSuccess(event.data.receiptId);
        break;
        
      case 'gateway-card-cancel':
        // User cancelled
        handlePaymentCancel();
        break;
    }
  }
  
  window.addEventListener('message', handlePortalMessage);
  return () => window.removeEventListener('message', handlePortalMessage);
}, []);
```

---

## Receipt API Integration

### Key Points
- Use the portal URL shape: `/portal/{receiptId}?recipient={wallet}&correlationId={id}`
- `recipient` is the merchant wallet address (0x...), used as the Cosmos partition
- `correlationId` is recommended for subscription flows (maps to a seeded receipt amount via `apim_subscription_payment`)
- The receipts API returns a uniform `{ receipt }` payload via GET and will ensure a positive total when possible

#### Receipts API and positive totals

- GET `/api/receipts/{id}` returns `{ receipt }` and requires an APIM subscription key. For embedded scenarios, use the `/portal/{receiptId}` route.
- For subscription flows, if the direct receipt lookup has `totalUsd <= 0`, the API falls back to `apim_subscription_payment` (or tip) by `correlationId=id` to construct a positive-total receipt (e.g., $399 Pro or $500 Enterprise).
- Always pass the merchant `recipient` wallet in the iframe query so the portal can partition correctly.

#### Allowed origins and CSP

- The app’s middleware sets `Content-Security-Policy` with `frame-ancestors 'self' https://pay.ledger1.ai` (and your `NEXT_PUBLIC_APP_URL` host if configured) specifically for `/portal/*`.
- `X-Frame-Options` is omitted for `/portal/*` so CSP exclusively governs embedding.
- If you self-host, ensure your `NEXT_PUBLIC_APP_URL` is set and your middleware includes its host in `frame-ancestors` for `/portal/*`.

#### Example: Subscription fallback embed

When your subscription endpoint returns a 402 with a fallback:

```json
{
  "fallback": {
    "type": "portalpay-card",
    "paymentPortalUrl": "https://your-app/portal/{correlationId}?recipient={ownerWallet}&correlationId={correlationId}",
    "amountUsd": 399,
    "productId": "portalpay-pro",
    "correlationId": "{correlationId}"
  }
}
```

Use `paymentPortalUrl` directly in the iframe. The portal will read `correlationId` and ensure the checkout widget initializes without “Invalid amount”.

---

## Payment Confirmation

### Server-side status proxy (required)

```ts
// Next.js (app or pages) API route example
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const receiptId = searchParams.get('receiptId');

  if (!receiptId) {
    return new Response(JSON.stringify({ error: 'missing_receiptId' }), { status: 400 });
  }

  const res = await fetch(`https://pay.ledger1.ai/api/receipts/status?receiptId=${encodeURIComponent(receiptId)}`, {
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.PORTALPAY_SUBSCRIPTION_KEY!,
    },
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
```

### Return URL

After payment, redirect customer back to your site:

```typescript
const paymentUrl = `https://pay.ledger1.ai/pay/${receiptId}?returnUrl=${encodeURIComponent('https://yoursite.com/order-confirmation')}`;
```

### Confirmation Page

Call your backend proxy route; do not call PortalPay directly from the browser.

```typescript
// pages/order-confirmation.tsx
export default function OrderConfirmation({ searchParams }: any) {
  const receiptId = searchParams.receiptId;
  const [status, setStatus] = useState('checking');
  
  useEffect(() => {
    async function checkStatus() {
      const response = await fetch(
        `/api/portalpay/receipts/status?receiptId=${receiptId}`
      );
      const data = await response.json();
      setStatus(data.status);
    }
    
    checkStatus();
  }, [receiptId]);
  
  if (status === 'completed') {
    return <div>✓ Payment successful! Receipt: {receiptId}</div>;
  }
  
  return <div>Checking payment status...</div>;
}
```

---

## Best Practices

1. **Always use server-side API calls**
2. **Verify payment status before fulfillment**
3. **Handle payment timeouts gracefully**
4. **Provide clear payment instructions**
5. **Support multiple cryptocurrencies**
6. **Test with small amounts first**

---

## Next Steps

- [E-commerce Guide](./ecommerce.md) - Full integration
- [POS Guide](./pos.md) - In-person payments
- [API Reference](../api/README.md)
