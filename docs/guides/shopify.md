# Shopify Integration Guide

This guide provides two integration paths to add PortalPay crypto payments to Shopify stores:

- Simple Embed (fastest): Add a “Pay with Crypto” button and route through a Shopify App Proxy to your backend, which creates a PortalPay order and redirects the customer to the PortalPay payment page.
- Advanced Buildout: Build a Shopify app that orchestrates Draft Orders and webhook subscriptions; after PortalPay confirms payment, complete the Draft Order to create a Shopify Order.

PortalPay developer APIs require an Azure APIM subscription key and must traverse Azure Front Door. Never expose your APIM key in browser code.

Base URL: `https://pay.ledger1.ai`

Developer Authentication: `Ocp-Apim-Subscription-Key: {your-subscription-key}`

Important: Wallet identity is resolved automatically at the gateway based on your subscription. Clients do not include wallet identity.

Related docs:

- Quick Start: `../quickstart.md`
- Auth & Security: `../auth.md`
- Orders API: `../api/orders.md`
- Shop Config API: `../api/shop.md`
- Rate Limits: `../limits.md`

---

## 1) Simple Embed (App Proxy + Theme Button)

This pattern adds a button to the storefront that:

1. Reads the Shopify cart client-side (via `/cart.js`).
2. Calls your backend via Shopify App Proxy to keep secrets server-side.
3. Your backend calls `POST /api/orders` on PortalPay with cart items.
4. Redirect customer to `https://pay.ledger1.ai/portal/{receiptId}`.

Why App Proxy? It safely proxies requests from the storefront to your backend and includes an HMAC signature you can verify. This keeps the APIM key and other secrets off the client.

### Prerequisites

- A private or public Shopify app with App Proxy enabled.
- App Proxy settings (Shopify Admin → Apps → Your App → App Proxy):
  - Subpath prefix: `apps`
  - Subpath: `portalpay`
  - Proxy URL: `https://your-backend.example.com/shopify/app-proxy`
- Your backend (Node, Python, etc.) reachable at the Proxy URL.
- APIM subscription key stored in your backend secret storage.

### Theme Button + JS (Online Store 2.0)

Add a snippet to your theme (e.g., `main-cart-items.liquid` or a custom section):

```liquid
<button id="pp-crypto-checkout" class="button">Pay with Crypto</button>
<script>
  document.getElementById('pp-crypto-checkout').addEventListener('click', async () => {
    try {
      // 1) Read current cart
      const cartRes = await fetch('/cart.js', { credentials: 'same-origin' });
      const cart = await cartRes.json();

      // 2) Map Shopify cart items -> PortalPay items
      // Use variant SKU if present; otherwise use a mapping service on your backend
      const items = (cart.items || []).map(it => ({
        sku: it.sku || it.id.toString(), // prefer SKU; fallback to id
        qty: it.quantity
      }));

      // Optional: Pick jurisdiction from customer location or shop config
      const payload = { items, jurisdictionCode: 'US-CA' };

      // 3) Call App Proxy -> your backend (keeps APIM key server-side)
      // App Proxy path usually looks like /apps/portalpay/create-order
      const proxyRes = await fetch('/apps/portalpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });
      const data = await proxyRes.json();
      if (!data.ok || !data.paymentUrl) {
        alert(data.error || 'Failed to create PortalPay order');
        return;
      }

      // 4) Redirect to PortalPay payment page
      window.location.href = data.paymentUrl;
    } catch (e) {
      console.error('PortalPay checkout error', e);
      alert('Unable to start crypto checkout');
    }
  });
</script>
```

### Backend (App Proxy handler)

Verify App Proxy HMAC and call PortalPay Orders API. Example in Node/Express:

```typescript
import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const SHOPIFY_APP_PROXY_SECRET = process.env.SHOPIFY_APP_PROXY_SECRET!;
const APIM_SUBSCRIPTION_KEY = process.env.APIM_SUBSCRIPTION_KEY!;
const BASE_URL = 'https://pay.ledger1.ai';

// Verify App Proxy HMAC (query hmac over sorted query params)
function verifyProxyHmac(req: express.Request): boolean {
  const { hmac, ...rest } = req.query as Record<string, string>;
  const message = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('&');
  const digest = crypto
    .createHmac('sha256', SHOPIFY_APP_PROXY_SECRET)
    .update(message)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac || '', 'utf8'));
}

app.post('/shopify/app-proxy/create-order', async (req, res) => {
  if (!verifyProxyHmac(req)) {
    return res.status(401).json({ ok: false, error: 'invalid_proxy_signature' });
  }

  try {
    const { items, jurisdictionCode, taxRate, taxComponents } = req.body || {};
    const ppRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY
      },
      body: JSON.stringify({ items, jurisdictionCode, taxRate, taxComponents })
    });
    const data = await ppRes.json();
    if (!data.ok) {
      return res.status(400).json({ ok: false, error: data.error || 'portalpay_error' });
    }

    const receiptId = data.receipt?.receiptId;
    const paymentUrl = `${BASE_URL}/portal/${receiptId}`;
    return res.json({ ok: true, receiptId, paymentUrl });
  } catch (e: any) {
    console.error('PortalPay order error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.listen(3000, () => console.log('App Proxy handler running'));
```

Notes:

- Map Shopify product/variant to `sku` expected by your PortalPay inventory. If you don’t maintain SKUs, use your backend to translate variant IDs to PortalPay SKUs.
- Never expose `APIM_SUBSCRIPTION_KEY` to the browser. Keep all PortalPay calls on the server.

### Iframe Embed (optional)

If your deployment allows embedding the PortalPay payment page, you can render it inline via an iframe instead of redirecting.

Requirements:

- The PortalPay origin (`https://pay.ledger1.ai`) must permit framing by your shop domain via Content-Security-Policy `frame-ancestors` (and must not send `X-Frame-Options: DENY`). Enterprise deployments can configure allowed ancestors.
- Security best practice is to keep secrets server-side (use App Proxy as shown above) and to use `sandbox`/`allow` attributes to limit capabilities inside the iframe.

Theme section example (injects the payment iframe after creating the order via App Proxy):

```liquid
<div id="pp-iframe-container" style="width:100%;height:700px;">
  <iframe
    id="pp-iframe"
    src=""
    style="width:100%;height:100%;border:0;"
    sandbox="allow-scripts allow-forms allow-same-origin"
    allow="payment *; clipboard-read; clipboard-write"
    referrerpolicy="no-referrer"
  ></iframe>
</div>

<button id="pp-iframe-checkout" class="button">Pay with Crypto (Inline)</button>
<script>
  document.getElementById('pp-iframe-checkout').addEventListener('click', ppStartIframeCheckout);

  async function ppStartIframeCheckout() {
    try {
      // Read cart
      const cartRes = await fetch('/cart.js', { credentials: 'same-origin' });
      const cart = await cartRes.json();

      // Map items to PortalPay format
      const items = (cart.items || []).map(it => ({
        sku: it.sku || it.id.toString(),
        qty: it.quantity
      }));

      // Create order via App Proxy
      const proxyRes = await fetch('/apps/portalpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ items, jurisdictionCode: 'US-CA' })
      });
      const data = await proxyRes.json();
      if (!data.ok || !data.paymentUrl) {
        alert(data.error || 'Failed to create PortalPay order');
        return;
      }

      // Set iframe src to PortalPay payment page
      document.getElementById('pp-iframe').src = data.paymentUrl;

      // Optional: Listen for postMessage from PortalPay (if enabled)
      window.addEventListener('message', (event) => {
        if (event.origin !== 'https://pay.ledger1.ai') return;
        // Example payload: { type: 'portalpay:status', status: 'paid', receiptId: 'R-...' }
        // Handle payment status updates here (e.g., mark cart as paid, show confirmation)
        // console.log('PortalPay message', event.data);
      });
    } catch (e) {
      console.error('PortalPay iframe checkout error', e);
      alert('Unable to start inline crypto checkout');
    }
  }
</script>
```

Notes:

- Inline embed is convenient, but redirect can provide clearer payment context and fewer cross-origin constraints. Choose based on your UX and CSP posture.
- For kiosk/embedded contexts, coordinate with your PortalPay deployment to allow your shop domain in `frame-ancestors`.

---

## 2) Advanced Buildout (Shopify App + Admin API + PortalPay)

This pattern integrates tightly with Shopify:

- Use Shopify Admin GraphQL to create a Draft Order when the customer selects Crypto.
- Create a PortalPay order and redirect to PortalPay payment page.
- When PortalPay confirms payment (your webhook), complete the Draft Order to create a real Shopify Order.
- Optionally subscribe to Shopify `ORDERS_CREATE` webhooks for reconciliation.

### Flow Overview

1. Customer clicks “Pay with Crypto” → Your app server creates `draftOrder` (Shopify Admin GQL).
2. Your server calls PortalPay `POST /api/orders` and returns `paymentUrl`.
3. Customer pays on PortalPay.
4. Your PortalPay webhook handler is notified. It calls `draftOrderComplete` (Shopify Admin GQL) to convert the draft order into a real order.
5. Optional: Use `ORDERS_CREATE` webhook for bookkeeping or to detect handoffs.

### Validated Shopify GraphQL Operations

All operations below were validated against the Shopify Admin API schema using the Shopify MCP `validate_graphql_codeblocks` tool.

Required scopes are noted per operation.

Webhook subscription to ORDERS_CREATE (optional reconciliation):

```graphql
mutation CreateOrdersCreateWebhook($callbackUrl: String!) {
  webhookSubscriptionCreate(
    topic: ORDERS_CREATE,
    webhookSubscription: { uri: $callbackUrl, format: JSON }
  ) {
    userErrors { field message }
    webhookSubscription { id topic uri format }
  }
}
```

- Scopes: app webhook permissions as per Shopify app (managed in app config)
- Destination: Your webhook endpoint (must respond quickly; verify HMAC)

Create Draft Order:

```graphql
mutation CreateDraftOrder($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder {
      id
      invoiceUrl
      status
    }
    userErrors {
      field
      message
    }
  }
}
```

- Scopes: `write_draft_orders`, `read_draft_orders`

Complete Draft Order after PortalPay confirms payment:

```graphql
mutation CompleteDraftOrder($id: ID!) {
  draftOrderComplete(id: $id) {
    draftOrder {
      id
      order {
        id
        name
      }
      status
    }
    userErrors {
      field
      message
    }
  }
}
```

- Scopes: `write_draft_orders`, `read_draft_orders`, `read_orders`, `read_marketplace_orders`

### Example Server Flow (Node)

```typescript
// Pseudocode: create draft order, create PortalPay order, return paymentUrl

async function startCryptoCheckout(shopifySession, cartItems) {
  // 1) Create Shopify draft order
  const draftInput = {
    lineItems: cartItems.map(it => ({
      // Use product variant ID if available, else custom line item
      // For custom: { custom: true, title, originalUnitPrice: { amount: "10.00", currencyCode: "USD" }, quantity: 1 }
      quantity: it.quantity,
      // variantId: it.variantId, // if available
      // sku: it.sku // optional; Shopify line item may not require SKU for variant-based lines
    })),
    note: 'Crypto checkout via PortalPay',
    allowDiscountCodesInCheckout: true
  };

  const draft = await shopifyGraphQL(shopifySession, `
    mutation CreateDraftOrder($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { id status }
        userErrors { field message }
      }
    }`, { input: draftInput });

  const draftOrderId = draft?.data?.draftOrderCreate?.draftOrder?.id;
  if (!draftOrderId) throw new Error('draft_order_create_failed');

  // 2) Create PortalPay order
  const ppRes = await fetch('https://pay.ledger1.ai/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY!
    },
    body: JSON.stringify({
      items: cartItems.map(it => ({ sku: it.sku, qty: it.quantity })),
      jurisdictionCode: 'US-CA'
    })
  });
  const data = await ppRes.json();
  if (!data.ok) throw new Error(data.error || 'portalpay_error');

  const receiptId = data.receipt.receiptId;
  const paymentUrl = `https://pay.ledger1.ai/portal/${receiptId}`;

  // Store mapping: receiptId -> draftOrderId for later completion
  await saveMapping({ receiptId, draftOrderId });

  return { paymentUrl };
}

// PortalPay webhook handler (payment confirmed)
async function onPortalPayConfirmed(receiptId) {
  const { draftOrderId } = await loadMapping(receiptId);
  if (!draftOrderId) return;

  // Complete the draft order -> creates Shopify Order
  await shopifyGraphQL(shopifySessionFromShop(draftOrderId), `
    mutation CompleteDraftOrder($id: ID!) {
      draftOrderComplete(id: $id) {
        draftOrder { id status }
        userErrors { field message }
      }
    }`, { id: draftOrderId });
}
```

Notes:

- Align `sku` mapping across Shopify and PortalPay inventory. Consider metafields to store PortalPay SKU on products/variants.
- Use jurisdiction based on customer address or shop config.
- Persist `receiptId` ↔ `draftOrderId` mapping securely.

### Webhooks & Security

- Shopify Webhooks: Verify HMAC from `X-Shopify-Hmac-SHA256`. Respond quickly; process asynchronously.
- PortalPay Webhooks: Configure your webhook in PortalPay admin (Enterprise setups) to receive `paid/completed` status updates. Verify signatures if enabled.
- Origin Enforcement: Your PortalPay calls must pass through AFD; direct-origin calls may be rejected.
- Rate Limits: Handle `429` with exponential backoff. See `../limits.md`.

---

## Error Handling

Common responses from PortalPay Orders API:

- `split_required`: Merchant must configure split contract before orders.
- `inventory_item_not_found`: Ensure SKU mapping exists.
- `rate_limited`: Respect rate limit headers and backoff.

Shopify Admin API:

- GraphQL `userErrors`: Inspect `field` and `message`.
- Missing scopes: Ensure the app has required scopes listed above.

---

## Best Practices

- Keep APIM key server-side only (App Proxy or embedded app backend).
- Use Shopify metafields to store PortalPay SKU per product/variant for reliable mapping.
- Log and correlate Shopify IDs and PortalPay `receiptId` for support.
- Use App Proxy for storefront calls; use OAuth for embedded admin app calls.
- Test in a development store; validate all GraphQL operations (as shown) before deployment.

---

## App Verification & Publishing

To publish your app to the Shopify App Store, you must complete a rigorous verification process.

### 1. Verification Checklist

#### Business & Legal

- **Domain Ownership**: Verify domain ownership in the Partner Dashboard.
- **Business Verification**: Submit required business documents (e.g., tax ID, incorporation).
- **GDPR Compliance**: Ensure your app handles mandatory webhooks: `customers/data_request`, `customers/redact`, `shop/redact`.

#### Technical Requirements

- **Performance**: Your app must not reduce Lighthouse scores by more than 10 points.
- **Error Handling**: No console errors or 404s/500s during operation.
- **Billing**: Must use Shopify Billing API for any charges.

#### App Listing

- **App Name**: Unique, no "Shopify" in name, max 30 chars.
- **Icon**: 1200x1200px, no text.
- **Demo Store URL**: A live, password-protected development store with the app installed.
- **Screencast URL**: A video demonstrating the app's core functionality.

### 2. Publishing Workflow & Deep Links

The PortalPay admin panel generates direct deep links to your specific app in the Shopify Partner Dashboard. To enable this:

1. **Enter Partner Org ID**: Find this in your Partner Dashboard URL (e.g., `partners.shopify.com/12345678/...`). Enter `12345678` into the PortalPay config.
2. **Enter App ID**: Found in your App's overview page.

Once configured, use the "Publish" tab in PortalPay to quickly navigate to:

- **App Configuration**: To update URLs and scopes.
- **Extensions**: To upload your app package.
- **Distribution**: To create your listing and submit for review.

### 3. Submission Steps

1. **Generate Package**: Use the "Generate Package" button in PortalPay.
2. **Upload**: Go to the **Extensions** deep link and upload the ZIP.
3. **Create Listing**: Go to **Distribution** -> **Create Listing**. Fill in all fields (Description, Screenshots, Pricing).
4. **Submit**: Click "Submit for review".

---

## Links

- PortalPay Orders API: `../api/orders.md`
- PortalPay Shop Config API: `../api/shop.md`
- Shopify Admin API GraphQL: <https://shopify.dev/docs/api/admin-graphql>
- Shopify App Proxy: <https://shopify.dev/docs/apps/online-store/app-proxy>
- Shopify Webhooks: <https://shopify.dev/docs/apps/build/webhooks>
