# PortalPay Environment Configuration Guide

This document provides a definitive checklist of environment variables for running PortalPay under the hardened gateway posture (Azure Front Door → Azure API Management). It categorizes variables by purpose, marks which are required vs optional, and calls out the minimum set needed to bring the developer-facing API endpoints online.

Important
- Do not commit secrets (.env should be gitignored).
- For production, inject secrets via your platform’s secure configuration (Azure App Settings, Key Vault, CI/CD secrets).
- Client-side variables are prefixed with NEXT_PUBLIC_ and are safe to expose on the frontend. Server-only variables must remain private.

-------------------------------------------------------------------------------
Minimum required to bring developer endpoints online
-------------------------------------------------------------------------------

These enable the public site, wallet integration, and core developer APIs:

Required
- NEXT_PUBLIC_APP_URL: Base URL of the app (e.g., https://pay.ledger1.ai)
- NEXT_PUBLIC_THIRDWEB_CLIENT_ID: Thirdweb client ID for wallet auth (frontend)
- NEXT_PUBLIC_CHAIN_ID and CHAIN_ID: Chain IDs matching your target network (e.g., 8453 for Base mainnet)
- JWT_SECRET: Required for admin UI session cookies; minimum 32 chars
- At least one supported payment token configuration if you plan to accept tokens other than ETH:
  - NEXT_PUBLIC_BASE_USDC_ADDRESS and NEXT_PUBLIC_BASE_USDC_DECIMALS
  - NEXT_PUBLIC_BASE_USDT_ADDRESS and NEXT_PUBLIC_BASE_USDT_DECIMALS
  - NEXT_PUBLIC_BASE_CBBTC_ADDRESS and NEXT_PUBLIC_BASE_CBBTC_DECIMALS
  - NEXT_PUBLIC_BASE_CBXRP_ADDRESS and NEXT_PUBLIC_BASE_CBXRP_DECIMALS

Recommended (for persistence and media)
- COSMOS_CONNECTION_STRING: Enables durable storage for receipts, inventory, and metrics (otherwise runs in degraded in-memory mode)
- AZURE_BLOB_* (one of CONNECTION_STRING or ACCOUNT_NAME + ACCOUNT_KEY): Enables blob-backed image uploads and CDN rewrite via AZURE_BLOB_PUBLIC_BASE_URL

Gateway (APIM) notes
- Developer endpoints require APIM subscription header: Ocp-Apim-Subscription-Key
- Do NOT expose PORTALPAY_SUBSCRIPTION_KEY client-side; it is only for server-initiated calls. Leave blank in .env if not needed.

-------------------------------------------------------------------------------
Variable matrix by category
-------------------------------------------------------------------------------

App URLs
- NEXT_PUBLIC_APP_URL (required): Public origin used by the client for links, payment URLs
- Note: For local dev you can override with a localhost URL as needed

Owner / Recipient
- NEXT_PUBLIC_OWNER_WALLET (required): Unlocks Admin UI and elevated privileges
- ADMIN_WALLETS (optional): Additional admin wallets (comma-separated)
- NEXT_PUBLIC_RECIPIENT_ADDRESS (recommended): Default recipient for reconciliation (falls back to owner)
- RESERVE_WALLET (optional): Reserve wallet for analytics; defaults to owner if blank

Thirdweb
- NEXT_PUBLIC_THIRDWEB_CLIENT_ID (required): Frontend wallet auth
- THIRDWEB_SECRET_KEY (recommended): Server SDK secret for server-side verification
- NEXT_PUBLIC_CHAIN_ID, CHAIN_ID (required): Chain IDs (Base mainnet=8453, Base Sepolia=84532)

Multi-currency token config (Base network)
- NEXT_PUBLIC_BASE_USDC_ADDRESS, NEXT_PUBLIC_BASE_USDC_DECIMALS (recommended if accepting USDC)
- NEXT_PUBLIC_BASE_USDT_ADDRESS, NEXT_PUBLIC_BASE_USDT_DECIMALS (recommended if accepting USDT)
- NEXT_PUBLIC_BASE_CBBTC_ADDRESS, NEXT_PUBLIC_BASE_CBBTC_DECIMALS (optional)
- NEXT_PUBLIC_BASE_CBXRP_ADDRESS, NEXT_PUBLIC_BASE_CBXRP_DECIMALS (optional)
- Note: ETH (native) does not require token address config

Azure Blob Storage
- AZURE_BLOB_CONTAINER (recommended): Default container (e.g., portalpay)
- One of:
  - AZURE_BLOB_CONNECTION_STRING (recommended)
  - AZURE_BLOB_ACCOUNT_NAME + AZURE_BLOB_ACCOUNT_KEY
- AZURE_BLOB_PUBLIC_BASE_URL (optional): CDN/Azure Front Door public base for URL rewrite
- NEXT_PUBLIC_BLOB_HOSTNAME (optional): For Next.js remote image allowlist
- NEXT_PUBLIC_AFD_HOSTNAME (optional): For CSP/remote image allowlist

Cosmos DB (events, users, metrics)
- COSMOS_CONNECTION_STRING (recommended): Durable storage for events, receipts, inventory
- COSMOS_PAYPORTAL_DB_ID, COSMOS_PAYPORTAL_CONTAINER_ID (optional; defaults provided)
- COSMOS_DB_ID, COSMOS_CONTAINER_ID (optional legacy)
- CB_AFTERHOURS_DB_ID, CB_AFTERHOURS_CONTAINER_ID (optional legacy)

Azure OpenAI (optional)
- AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY (optional)
- AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT, AZURE_OPENAI_EMBEDDINGS_MODEL, AZURE_OPENAI_EMBEDDINGS_API_VERSION (optional)
- AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_CHAT_DEPLOYMENT, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_CHAT_API_VERSION (optional)

Realtime (WebRTC) demo (optional)
- NEXT_PUBLIC_AZURE_OPENAI_REALTIME_WEBRTC_URL
- NEXT_PUBLIC_AZURE_OPENAI_REALTIME_DEPLOYMENT
- NEXT_PUBLIC_AZURE_OPENAI_REALTIME_API_VERSION

Admin / Deployment
- THIRDWEB_ADMIN_PRIVATE_KEY (optional): For contract ops
- ADMIN_PRIVATE_KEY (optional)
- NEXT_PUBLIC_SPAWNCAMP_FACTORY_ADDRESS (optional)
- CSRF_DISABLE (optional; default false): Disable CSRF for non-prod testing only

APIM / Gateway (PortalPay external developer API access)
- PORTALPAY_SUBSCRIPTION_KEY (server-only, optional): If your backend needs to call PortalPay APIs via APIM; do not expose client-side
- PORTALPAY_API_BASE (optional): Override API base (defaults to NEXT_PUBLIC_APP_URL)

Azure APIM Management (future Admin subscription lifecycle UI)
- AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, AZURE_APIM_NAME, AZURE_APIM_MANAGEMENT_ENDPOINT (optional): Required only if using Azure ARM/APIM Management API

Admin Controls (safety gates)
- ADMIN_TYPED_SIG_REQUIRED (optional; default true): Require typed signature for destructive admin actions

Block explorer API (optional)
- ETHERSCAN_API_KEY (optional)
- BASESCAN_API_KEY (optional)
- BLOCKSCOUT_API_URL (optional)
- BLOCKSCOUT_API_KEY (optional): Used by split/transactions indexer for enrichment

Uniswap V4 (optional)
- UNISWAP_V4_ROUTER, UNISWAP_V4_POOL_MANAGER (optional)
- UNISWAP_V4_WETH (default provided)
- UNISWAP_V4_USDC, UNISWAP_V4_USDT, UNISWAP_V4_CBBTC, UNISWAP_V4_CBXRP, UNISWAP_V4_DEFAULT_HOOK (optional)

Misc / Legacy compatibility
- JWT_SECRET (required): Admin UI sessions
- NODE_ENV (recommended): production
- DEMO_MODE, DEMO_STUBS, NEXT_PUBLIC_DEMO_MODE (optional): Demo flags
- BRAND_NAME, BACKOFFICE_NAME (optional)
- NEXT_PUBLIC_GRAPHQL_URL (optional)

Mongo (Cosmos Mongo API compatibility; not used by core PortalPay service)
- MONGODB_URI, MONGODB_DB_NAME, MONGODB_DB_NAME_DEMO, MONGODB_URI_DEMO (optional)
- Note: Core service uses Cosmos Core via COSMOS_CONNECTION_STRING; do not map Mongo URI into COSMOS_CONNECTION_STRING.

Bear Cloud API (optional integration)
- NEXT_PUBLIC_BEAR_CLOUD_API_URL, NEXT_PUBLIC_BEAR_CLOUD_AUTH_URL, NEXT_PUBLIC_BEAR_CLOUD_API_KEY, NEXT_PUBLIC_BEAR_CLOUD_SECRET, NEXT_PUBLIC_BEAR_CLOUD_SCOPE (optional)
- DEMO_FREEZE_DATE, NEXT_PUBLIC_DEMO_FREEZE_TIME, NEXT_PUBLIC_BEAR_CLOUD_TIMEOUT (optional)
- NEXT_PUBLIC_ROBOTICS_ENABLED, NEXT_PUBLIC_ROBOTICS_USE_MOCK_FALLBACK (optional)

Toast API (optional integration)
- TOAST_CLIENT_SECRET, TOAST_CLIENT_ID, TOAST_API_HOSTNAME, TOAST_USER_ACCESS_TYPE, TOAST_RESTAURANT_ID (optional)

Azure Translator (UI translations)
- AZURE_TRANSLATOR_ENDPOINT (optional; default provided)

Varuni feature toggles
- VARUNI_RAG_ENABLED, VARUNI_LANGGRAPH_ENABLED, VARUNI_HITL_ENABLED, VARUNI_PARALLEL_READS (optional)

Azure OpenAI Realtime Voice
- AZURE_OPENAI_REALTIME_DEPLOYMENT, AZURE_OPENAI_REALTIME_API_VERSION, AZURE_OPENAI_REALTIME_WEBRTC_URL (optional)
- NEXT_PUBLIC_AZURE_OPENAI_REALTIME_WEBRTC_URL, NEXT_PUBLIC_AZURE_OPENAI_REALTIME_DEPLOYMENT (optional)

Other integrations
- SEVENSHIFTS_ACCESS_TOKEN (optional)

-------------------------------------------------------------------------------
Operational notes and best practices
-------------------------------------------------------------------------------

- Developer-facing API access:
  - All calls must traverse AFD → APIM with Ocp-Apim-Subscription-Key.
  - Wallet identity is resolved automatically at the gateway based on your subscription; client requests do not include wallet identity.
  - Rate limiting may be enforced per subscription/wallet and signaled via X-RateLimit-* headers.

- Persistence and degraded mode:
  - If COSMOS_CONNECTION_STRING is not set, service operates in degraded in-memory mode.
  - Set COSMOS_CONNECTION_STRING for production to ensure durability.

- Image uploads:
  - For /api/inventory/images, configure AZURE_BLOB_* and optional AZURE_BLOB_PUBLIC_BASE_URL for CDN.

- Admin UI:
  - Requires JWT_SECRET.
  - THIRDWEB_SECRET_KEY recommended for server-side signature verification.
  - CSRF_DISABLE should remain false in production.

- Secrets hygiene:
  - Leave PORTALPAY_SUBSCRIPTION_KEY blank unless the server needs to call its own APIs via APIM.
  - Never expose server-side secrets in NEXT_PUBLIC_* variables.

-------------------------------------------------------------------------------
Quick-start checklist (copy to your runbook)
-------------------------------------------------------------------------------

- [ ] Set NEXT_PUBLIC_APP_URL
- [ ] Set NEXT_PUBLIC_THIRDWEB_CLIENT_ID
- [ ] Set NEXT_PUBLIC_CHAIN_ID and CHAIN_ID
- [ ] Set JWT_SECRET (>= 32 chars)
- [ ] Configure token addresses/decimals for currencies you will accept (USDC/USDT/etc.)
- [ ] Configure COSMOS_CONNECTION_STRING (recommended for production)
- [ ] Configure AZURE_BLOB_* for image uploads (recommended)
- [ ] Confirm Ocp-Apim-Subscription-Key is being passed via APIM for developer APIs
- [ ] Verify site and shop config endpoints respond as expected
- [ ] Verify receipts and orders endpoints respond and persist data (degraded mode or Cosmos)
- [ ] Optional: Set AZURE_OPENAI_* and integrations as needed

-------------------------------------------------------------------------------
Current .env audit (based on repository .env sample)
-------------------------------------------------------------------------------

Observed populated
- NEXT_PUBLIC_APP_URL: http://pay.ledger1.ai
- NEXT_PUBLIC_OWNER_WALLET / ADMIN_WALLETS: set
- NEXT_PUBLIC_RECIPIENT_ADDRESS: set
- NEXT_PUBLIC_THIRDWEB_CLIENT_ID: set
- THIRDWEB_SECRET_KEY: set
- NEXT_PUBLIC_CHAIN_ID / CHAIN_ID: set (8453)
- Token addresses: USDC/USDT/cbBTC/cbXRP set with decimals
- AZURE_BLOB_*: set with container, connection string, account name/key, public base URL
- NEXT_PUBLIC_BLOB_HOSTNAME / NEXT_PUBLIC_AFD_HOSTNAME: set
- COSMOS_CONNECTION_STRING: set
- JWT_SECRET: set
- NEXT_PUBLIC_DEMO_MODE / DEMO_MODE / DEMO_STUBS: set (demo)
- NEXT_PUBLIC_GRAPHQL_URL: set (localhost)
- Bear Cloud and Toast API: set (demo values)
- Azure OpenAI preview and realtime demo: set (demo values)
- NEXT_PUBLIC_AZURE_OPENAI_REALTIME_*: set
- SEVENSHIFTS_ACCESS_TOKEN: set

Observed blank or optional
- PORTALPAY_SUBSCRIPTION_KEY: blank (recommended to keep blank; server-side calls only)
- BASESCAN_API_KEY / BLOCKSCOUT_API_URL: blank (optional)
- ADMIN_PRIVATE_KEY: blank (optional)
- UNISWAP_V4_* token addresses and hook: blank (optional)
- RESERVE_WALLET: blank (optional)
- AZURE APIM Management credentials (AZURE_TENANT_ID, AZURE_CLIENT_ID, etc.): blank (not required unless using ARM/APIM Management API)

Action
- Review and intentionally leave sensitive server-only keys out of client exposure.
- Populate only the integrations you intend to use.
- Keep CSRF_DISABLE=false in production.

-------------------------------------------------------------------------------
References
-------------------------------------------------------------------------------

- docs/auth.md: Hardened gateway posture and auth models
- docs/api/*.md: Endpoint-specific guides (inventory, orders, receipts, shop, split)
- public/openapi.yaml: OpenAPI spec for developer-facing endpoints
