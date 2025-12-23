# Shop and Site Configuration APIs

Customize merchant branding, layout, and preferences (Shop), and view platform-wide defaults (Site).

## Overview

- Base URL: `https://api.pay.ledger1.ai/portalpay`
- Authentication (Developer APIs – reads): Developer reads require an Azure APIM subscription key header:
  - `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Gateway posture: APIM custom domain is the primary endpoint. Azure Front Door (AFD) may be configured as an optional/fallback edge; if enabled, APIM accepts an internal `x-edge-secret` per policy.
- Rate limiting headers (if enabled): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Identity: Wallet identity is resolved automatically at the gateway based on your subscription. Clients MUST NOT send wallet identity headers; APIM strips wallet headers and stamps the resolved identity.
- Admin/UI writes (updates) are performed via the PortalPay web app using JWT cookies (`cb_auth_token`) with CSRF protections and role checks.

See `../auth.md` for full security model details. See OpenAPI schema at `../../public/openapi.yaml`.

---

## GET /portalpay/api/shop/config

Required scopes: `shop:read`

Returns the merchant shop configuration (branding for the shop, layout, links, etc.).

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/shop/config",
  "title": "Get Shop Configuration",
  "description": "Fetch merchant shop configuration and branding settings",
  "query": [
    { "name": "slug", "type": "string", "placeholder": "my-coffee-shop" }
  ]
}
```

Resolution rules:
- Uses the wallet associated with your APIM subscription.
- Optionally, you may provide `?slug=...` to resolve a merchant by public slug when a subscription-bound wallet context is not appropriate (e.g., public catalog viewing).
- Client-supplied wallet headers are ignored by the gateway.

Authenticated not-found behavior:
- If an authenticated caller resolves a merchant but no shop config exists, the endpoint returns `404 { "error": "not_found" }` instead of falling back to defaults.

### Request

Headers:
```http
Ocp-Apim-Subscription-Key: {your-subscription-key}
```

Optional query parameter:
- `slug` (string): resolve merchant by public slug

Example Requests:

<!-- CODE_TABS_START -->
<!-- TAB:cURL -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/shop/config" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"

# Resolve by public slug
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/shop/config?slug=my-coffee-shop" \
  -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY"
```
<!-- TAB:JavaScript -->
```javascript
const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/shop/config', {
  headers: { 'Ocp-Apim-Subscription-Key': process.env.APIM_SUBSCRIPTION_KEY }
});
const data = await res.json();
```
<!-- TAB:Python -->
```python
import os, requests
KEY = os.environ['APIM_SUBSCRIPTION_KEY']
r = requests.get(
  'https://api.pay.ledger1.ai/portalpay/api/shop/config',
  headers={'Ocp-Apim-Subscription-Key': KEY}
)
data = r.json()
```
<!-- CODE_TABS_END -->

### Response

Success (200 OK):

Schema summary (OpenAPI ShopConfig):
- name (string)
- description (string)
- bio (string)
- theme (ShopTheme):
  - primaryColor, secondaryColor, textColor, accentColor, brandLogoUrl, coverPhotoUrl, fontFamily, logoShape (square|circle), heroFontSize (microtext|small|medium|large|xlarge)
- arrangement (grid|featured_first|groups|carousel)
- xpPerDollar (number)
- slug (string, nullable)
- links (array of { label, url })
- industryPack (restaurant|retail|hotel|freelancer, nullable)
- industryPackActivatedAt (int64, nullable)
- setupComplete (boolean)
- createdAt (int64)
- updatedAt (int64)

Example:
```json
{
  "config": {
    "name": "My Coffee Shop",
    "description": "Neighborhood espresso bar",
    "bio": "Small batch roastery and café",
    "theme": {
      "primaryColor": "#1f2937",
      "secondaryColor": "#F54029",
      "textColor": "#111827",
      "accentColor": "#10B981",
      "brandLogoUrl": "/cblogod.png",
      "coverPhotoUrl": "/hero.jpg",
      "fontFamily": "Inter, ui-sans-serif, system-ui",
      "logoShape": "square",
      "heroFontSize": "large"
    },
    "arrangement": "grid",
    "xpPerDollar": 1,
    "slug": "my-coffee-shop",
    "links": [
      { "label": "Instagram", "url": "https://instagram.com/mycoffeeshop" }
    ],
    "industryPack": "restaurant",
    "industryPackActivatedAt": 1698765400000,
    "setupComplete": true,
    "createdAt": 1698765300000,
    "updatedAt": 1698765400000
  }
}
```

Response Headers (when enabled at gateway):
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## POST /portalpay/api/shop/config (Admin – JWT)

Update shop configuration via the PortalPay admin UI. This route is not callable via APIM developer subscriptions and requires JWT + CSRF in the browser. Client-provided wallet headers are ignored; the authenticated wallet is used for writes.

Note:
- This admin write is not part of the public developer-facing OpenAPI. It is performed in-app by authenticated admins.

### Request

Headers:
```http
Content-Type: application/json
Cookie: cb_auth_token=...
```

Body Parameters (subset aligned to ShopConfig):
```json
{
  "name": "My Coffee Shop",
  "description": "Neighborhood espresso bar",
  "bio": "Small batch roastery and café",
  "theme": {
    "primaryColor": "#2563eb",
    "secondaryColor": "#dc2626",
    "textColor": "#111827",
    "accentColor": "#10B981",
    "brandLogoUrl": "/cblogod.png",
    "coverPhotoUrl": "/hero.jpg",
    "fontFamily": "Inter, ui-sans-serif, system-ui",
    "logoShape": "square",
    "heroFontSize": "large"
  },
  "arrangement": "grid",
  "xpPerDollar": 1,
  "slug": "my-coffee-shop",
  "links": [
    { "label": "Instagram", "url": "https://instagram.com/mycoffeeshop" }
  ],
  "industryPack": "restaurant"
}
```

Example (admin UI, fetch):
```javascript
const res = await fetch('/api/shop/config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // send cb_auth_token
  body: JSON.stringify({
    name: 'My Coffee Shop',
    theme: { primaryColor: '#2563eb', secondaryColor: '#dc2626' },
    arrangement: 'grid'
  })
});
const data = await res.json();
```

### Response

Success (200 OK):
```json
{
  "ok": true,
  "config": { "...": "updated ShopConfig ..." }
}
```

---

## GET /portalpay/api/site/config

Get site-level configuration (branding defaults and global payment defaults). Depending on environment, this may be public. In protected environments, APIM enforcement can be enabled; if so, include the subscription header.

```tryit
{
  "method": "GET",
  "path": "/portalpay/api/site/config",
  "title": "Get Site Configuration",
  "description": "Fetch site-level configuration and branding defaults"
}
```

Security (per OpenAPI): no default security (public/read-only), but may be APIM-protected by environment policy.

### Request

Examples:

<!-- CODE_TABS_START -->
<!-- TAB:cURL (public) -->
```bash
curl -X GET "https://api.pay.ledger1.ai/portalpay/api/site/config"
```
<!-- TAB:JavaScript (with APIM, if enforced) -->
```javascript
const headers = {};
if (process.env.APIM_SUBSCRIPTION_KEY) {
  headers['Ocp-Apim-Subscription-Key'] = process.env.APIM_SUBSCRIPTION_KEY;
}
const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/site/config', { headers });
const data = await res.json();
```
<!-- TAB:Python (public) -->
```python
import requests
r = requests.get('https://api.pay.ledger1.ai/portalpay/api/site/config')
data = r.json()
```
<!-- CODE_TABS_END -->

### Response

Success (200 OK):

Schema summary (OpenAPI SiteConfig):
- theme (SiteTheme):
  - primaryColor, secondaryColor, brandLogoUrl, brandFaviconUrl, brandName, fontFamily, receiptBackgroundUrl
- processingFeePct (number, nullable)
- defaultPaymentToken (ETH|USDC|USDT|cbBTC|cbXRP)
- reserveRatios (object<string, number>, nullable)

Example:
```json
{
  "theme": {
    "primaryColor": "#1f2937",
    "secondaryColor": "#F54029",
    "brandLogoUrl": "/cblogod.png",
    "brandFaviconUrl": "/favicon-32x32.png",
    "brandName": "PortalPay",
    "fontFamily": "Inter, ui-sans-serif, system-ui",
    "receiptBackgroundUrl": "/manifest.webmanifest"
  },
  "defaultPaymentToken": "ETH",
  "processingFeePct": 1.0
}
```

If APIM is enabled for this endpoint, rate limiting headers may be present:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Branding Reference

Shop (merchant) vs Site (platform) themes:

- Shop theme (ShopTheme)
  - primaryColor, secondaryColor, textColor, accentColor, brandLogoUrl, coverPhotoUrl, fontFamily, logoShape, heroFontSize
- Site theme (SiteTheme)
  - primaryColor, secondaryColor, brandLogoUrl, brandFaviconUrl, brandName, fontFamily, receiptBackgroundUrl

---

## Code Examples

### JavaScript/TypeScript (developer read — Shop)
```typescript
const APIM_SUBSCRIPTION_KEY = process.env.APIM_SUBSCRIPTION_KEY!;
const BASE_URL = 'https://api.pay.ledger1.ai/portalpay';

export async function getShopConfig() {
  const res = await fetch(`${BASE_URL}/api/shop/config`, {
    headers: { 'Ocp-Apim-Subscription-Key': APIM_SUBSCRIPTION_KEY }
  });
  return res.json(); // { config: ShopConfig }
}
```

### JavaScript/TypeScript (admin write — Shop, JWT in browser)
```typescript
export async function updateShopBranding(theme: any) {
  const res = await fetch('/api/shop/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // sends cb_auth_token cookie
    body: JSON.stringify({ theme })
  });
  return res.json(); // { ok: boolean, config?: ShopConfig }
}
```

### JavaScript/TypeScript (developer read — Site)
```typescript
export async function getSiteConfig() {
  const headers: Record<string, string> = {};
  if (process.env.APIM_SUBSCRIPTION_KEY) {
    headers['Ocp-Apim-Subscription-Key'] = process.env.APIM_SUBSCRIPTION_KEY;
  }
  const res = await fetch('https://api.pay.ledger1.ai/portalpay/api/site/config', { headers });
  return res.json(); // SiteConfig
}
```

---

## Notes on Auth Models

- Developer reads must use `Ocp-Apim-Subscription-Key` when APIM-enforced. Wallet identity is resolved automatically at the gateway based on your subscription; the backend trusts the resolved identity.
- Admin/UI operations use JWT cookies (`cb_auth_token`) with CSRF and role checks for sensitive actions (configuration updates).
- Client requests do not include wallet identity; APIM strips wallet headers and stamps the resolved identity.
