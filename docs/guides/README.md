# Integration Guides Overview

This section provides integration patterns for common scenarios. All developer API requests must use an Azure API Management (APIM) subscription key and traverse Azure Front Door (AFD). Admin-only operations are performed inside the PortalPay UI with JWT cookies and CSRF protections.

- Base URL: `https://pay.ledger1.ai`
- Developer Authentication: `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Origin Enforcement: AFD injects an internal header validated by APIM; direct-origin access may be rejected with 403 in protected environments.
- Rate Limit Headers (if enabled): `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Wallet Identity: Resolved automatically at the gateway based on your subscription; client requests do not include wallet identity.

## Guides

- E-commerce
  - Catalog, cart, checkout, and payment flows
  - File: `./ecommerce.md`
- Payment Gateway
  - Calling developer APIs from your backend, receipt status polling via proxy, and embedding receipts
  - File: `./payment-gateway.md`
- Point of Sale (POS)
  - In-store terminals and admin-only actions via PortalPay UI
  - File: `./pos.md`
- Shopify
  - Storefront button via App Proxy (Simple Embed) and advanced Shopify app with Draft Orders + webhooks (Advanced Buildout)
  - File: `./shopify.md`

## Security & Boundaries

- Developer APIs (read/list/create) require APIM subscription key in requests.
- Admin writes (e.g., shop/pricing config, refunds, terminal completion, split deploy) are performed in the PortalPay UI with JWT (`cb_auth_token`) and CSRF protections; these are not callable via APIM developer subscriptions.
- Never expose your APIM subscription key in browser code. Use a backend proxy when integrating from a web or mobile client.

## Origin Enforcement

Requests must pass through Azure Front Door. APIM validates an internal edge secret to prevent direct-origin calls. In protected environments:
- Direct calls to APIM or backend will receive 403.
- Plan proxies and server-side integrations accordingly.

## Rate Limiting

Responses may include the following headers when APIM rate limit policy is enabled:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

On `429 Too Many Requests`, implement exponential backoff.

## Proxy Pattern Reminder

When building client apps (browser/mobile), route calls through your backend where the APIM key is kept server-side. Example pattern is shown in the Payment Gateway guide for receipt status polling.

## Related Documents

- Authentication & Security: `../auth.md`
- API Reference: `../api/README.md`
- Pricing & Subscription Tiers: `../pricing.md`
- OpenAPI Spec: `../../public/openapi.yaml`
