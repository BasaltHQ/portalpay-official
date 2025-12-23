# PortalPay API Inventory

This document provides a comprehensive inventory of all API routes in the PortalPay system, organized by category for OpenAPI documentation.

Last Updated: 2025-11-06

## Documentation Structure

The API is documented across multiple OpenAPI specifications:

1. `public/openapi.yaml` — Public developer-facing API (APIM subscription key required; APIM custom domain is primary)
2. `public/openapi-admin.yaml` — Admin & management operations (JWT admin role required)
3. `public/openapi-pms.yaml` — Property Management System API (Multi-tenant hotel operations)
4. `public/openapi-internal.yaml` — Internal services & utilities

---

## 1. Public Developer API (openapi.yaml)

Base API Endpoint for clients: https://api.pay.ledger1.ai/portalpay

Security: APIM subscription key via header `Ocp-Apim-Subscription-Key`

Gateway posture:
- Primary: APIM custom domain at `https://api.pay.ledger1.ai/portalpay`
- Optional Fallback: Azure Front Door (AFD) accepted when APIM policy validates the AFD-injected `x-edge-secret` header. Clients should not send this header themselves.

Currently documented routes:
- ✅ `/portalpay/api/inventory` — Product catalog CRUD
- ✅ `/portalpay/api/orders` — Order generation with tax computation
- ✅ `/portalpay/api/receipts` — Receipt management
- ✅ `/portalpay/api/receipts/{id}` — Receipt retrieval
- ✅ `/portalpay/api/receipts/status` — Payment status checking
- ✅ `/portalpay/api/shop/config` — Merchant shop configuration
- ✅ `/portalpay/api/site/config` — Public site configuration
- ✅ `/portalpay/api/split/transactions` — Split transaction indexer
- ✅ `/portalpay/healthz` — Health check endpoint (subscription not required)

Missing from current spec (to be added):
- `/portalpay/api/pricing/config` — Pricing configuration (GET, POST — owner only for POST)
- `/portalpay/api/billing/balance` — User balance checking (GET)
- `/portalpay/api/billing/purchase` — Credit purchase (POST)
- `/portalpay/api/billing/usage` — Usage tracking (POST)
- `/portalpay/api/split/deploy` — Deploy split contract (POST)
- `/portalpay/api/split/withdraw` — Withdraw from split (POST)
- `/portalpay/api/split/webhook` — Split event webhook (POST)
- `/portalpay/api/receipts/refund` — Refund processing (POST)
- `/portalpay/api/receipts/terminal` — Terminal receipt generation (POST)
- `/portalpay/api/tax/catalog` — Tax rate catalog (GET)
- `/portalpay/api/reserve/balances` — Reserve balance checking (GET)
- `/portalpay/api/reserve/recommend` — Reserve recommendation (POST)

---

## 2. Admin & Management API (openapi-admin.yaml)

Security: JWT with admin role
Rate Limiting: Applied per endpoint

Admin Operations
- `/api/admin/users` — User aggregation and analytics (GET)

APIM Management
- `/api/apim-management/products` — List APIM products (GET)
- `/api/apim-management/subscriptions` — Manage subscriptions (GET, POST)
- `/api/apim-management/subscriptions/{id}/keys` — Get subscription keys (GET)
- `/api/apim-management/subscriptions/{id}/regenerate-key` — Regenerate keys (POST)

Analytics
- `/api/analytics/merchant` — Merchant analytics dashboard (GET)

---

## 3. Property Management System API (openapi-pms.yaml)

Security: Multi-tenant JWT with slug-based isolation
Scope: Complete hotel/property management operations

Instance Management
- `/api/pms/instances` — List/create instances (GET, POST)
- `/api/pms/instances/{slug}` — Get/update/delete instance (GET, PUT, DELETE)

Tenant-Scoped Operations (by slug)
- `/api/pms/{slug}/auth/login` — PMS user login (POST)
- `/api/pms/{slug}/auth/logout` — PMS user logout (POST)
- `/api/pms/{slug}/auth/session` — Session validation (GET)
- `/api/pms/{slug}/dashboard` — Dashboard data (GET)
- `/api/pms/{slug}/setup-status` — Setup completion status (GET)
- `/api/pms/{slug}/complete-setup` — Mark setup complete (POST)

Folio Management
- `/api/pms/{slug}/folios` — List/create folios (GET, POST)
- `/api/pms/{slug}/folios/{id}` — Get/update folio (GET, PUT)
- `/api/pms/{slug}/folios/{id}/checkout` — Checkout folio (POST)

Payment Operations
- `/api/pms/{slug}/payments/split/{id}` — Split payment processing (GET, POST)

User Management
- `/api/pms/{slug}/users` — List/create users (GET, POST)
- `/api/pms/{slug}/users/{id}` — Get/update/delete user (GET, PUT, DELETE)

Hotel Operations
- `/api/hotel/reservations` — Reservation management (GET, POST)
- `/api/hotel/settings` — Hotel settings (GET, PUT)

---

## 4. Internal Services API (openapi-internal.yaml)

Security: Varies by endpoint (JWT, internal auth, or public)

Authentication & Authorization
- `/api/auth/login` — Thirdweb payload login (POST)
- `/api/auth/logout` — User logout (POST)
- `/api/auth/me` — Get current user (GET)
- `/api/auth/payload` — Generate login payload (POST)
- `/api/auth/auto-login` — Auto-login for testing (POST)

User Management
- `/api/users/search` — Search users (GET)
- `/api/users/live` — Live user feed (GET)
- `/api/users/profile` — User profile operations (GET, PUT)
- `/api/users/register` — User registration (POST)
- `/api/users/pfp` — Profile picture upload (POST)
- `/api/users/presence` — User presence tracking (POST)
- `/api/users/follow` — Follow/unfollow user (POST)
- `/api/users/follows` — Get follows list (GET)
- `/api/users/topics` — User topics/interests (GET, POST)

Social & Gamification
- `/api/leaderboard` — Leaderboard data (GET)
- `/api/conversations/log` — Log conversations (POST)
- `/api/sessions/log` — Log sessions (POST)

Media & Content
- `/api/media/upload` — File upload to blob storage (POST)
- `/api/media/favicon` — Generate favicon (GET)
- `/api/audio/suno/{id}` — Suno audio generation (GET)
- `/api/audio/youtube/{id}` — YouTube audio processing (GET)
- `/api/voice/session` — Voice session management (POST)

Open Graph Images (Dynamic)
- `/api/og-image/crypto-payments` — Crypto payments OG (GET)
- `/api/og-image/crypto-payments/{industry}` — Industry-specific OG (GET)
- `/api/og-image/developers` — Developer portal OG (GET)
- `/api/og-image/locations` — Locations OG (GET)
- `/api/og-image/locations/{slug}` — Location-specific OG (GET)
- `/api/og-image/profile/{wallet}` — User profile OG (GET)
- `/api/og-image/shop/{wallet}` — Shop OG (GET)
- `/api/og-image/vs` — Comparison OG (GET)
- `/api/og-image/vs/{competitor}` — Competitor comparison OG (GET)

Business Features
- `/api/kitchen/orders` — Kitchen order display system (GET, POST)
- `/api/industry-packs` — Industry template packs (GET, POST)
- `/api/inventory/images` — Inventory image upload (POST)
- `/api/inventory/presets` — Inventory presets (GET)
- `/api/presets` — General presets (GET)
- `/api/shop/slug` — Shop slug validation/generation (GET, POST)

Integration & Utilities
- `/api/graphql` — GraphQL endpoint (POST)
- `/api/translate` — Translation service (POST)
- `/api/link/preview` — Link preview generation (GET)
- `/api/prompt/roll` — AI prompt generation (POST)
- `/api/ipa` — IPA phonetic conversion (POST)
- `/api/defi` — DeFi integration endpoints

Health & Monitoring
- `/api/health/cosmos` — Cosmos DB health check (GET)
- `/api/site/metrics` — Site-wide metrics (GET)

---

## Security Models

### 1. APIM Subscription Key (Primary)
- Header: `Ocp-Apim-Subscription-Key`
- Used for: Public developer API at `https://api.pay.ledger1.ai/portalpay`
- Rate limiting: Applied via APIM policies
- Optional fallback: Requests routed through AFD are accepted when APIM validates AFD's injected `x-edge-secret` header (clients do not send this header)

### 2. JWT (Thirdweb)
- Cookie: `cb_auth_token`
- Used for: Authenticated admin/UI operations
- Roles: `admin`, `merchant`, `buyer`

### 3. Multi-tenant JWT (PMS)
- Slug-based isolation in path: `/api/pms/{slug}/*`
- Per-tenant user authentication
- Role-based access within tenant

### 4. Internal/Public Hybrid
- Some endpoints public (no auth)
- Some require JWT
- Some owner-only (env var check)

---

## Rate Limiting

All endpoints implement rate limiting via gateway/backend policies. Typical behavior:
- Returns 429 with `resetAt` timestamp
- Headers may include: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Common Response Patterns

Success:
```json
{ "ok": true, "data": {}, "degraded": false }
```

Error:
```json
{ "error": "error_code", "message": "Human readable message", "resetAt": 1234567890 }
```

Audit trail fields for admin operations:
- `who` (caller)
- `what` (operation)
- `target`
- `correlationId`
- `ok`
- `metadata`

---

## Next Steps

1. Update `openapi.yaml` servers to include `https://api.pay.ledger1.ai/portalpay`
2. Add missing endpoints listed above to `openapi.yaml`
3. Validate all specs with Spectral linter
4. Generate client SDKs if needed
