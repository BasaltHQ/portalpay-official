APIM Custom Domain Guide

Overview
- Gateway: https://api.pay.ledger1.ai
- Base path for backend routes: /portalpay/api/*
- Health check endpoint: /portalpay/healthz
- Authentication: Ocp-Apim-Subscription-Key required for non-health routes
- Alternative accepted header (when using Azure Front Door): x-edge-secret: AFDEDGESECRET-20251028
- Certificate: Bound from Key Vault kv-portalpay-prod; expiry 2026-02-04; thumbprint D550284B814E2428A43DBE2F10C20FF916DEA9E2

What changed
- We simplified the architecture to use APIM directly with a custom domain (AFD optional). All client integrations should target https://api.pay.ledger1.ai.
- APIM policy now permits requests that either include a valid APIM subscription key or originate from AFD with x-edge-secret.
- The policy strips any client-supplied wallet headers; backend resolves wallet based on subscription.
- Requests to /portalpay/api/* are rewritten to /api/* for the backend App Service.

How to call the API
- Include header: Ocp-Apim-Subscription-Key: <your-subscription-key>
- Example health check:
  curl -i -H "Ocp-Apim-Subscription-Key: <KEY>" https://api.pay.ledger1.ai/portalpay/healthz
- Example inventory list:
  curl -i -H "Ocp-Apim-Subscription-Key: <KEY>" https://api.pay.ledger1.ai/portalpay/api/inventory

Expected responses
- Healthz returns 200 OK with {"status":"ok"}
- Inventory returns 200 OK with JSON payload when the subscription key is valid
- Without a subscription key (and no AFD header), APIM returns 401/403 with a descriptive error

Headers and security
- Required for non-health routes: Ocp-Apim-Subscription-Key
- Optional (only if using AFD): x-edge-secret: AFDEDGESECRET-20251028
- The policy enforces header stripping for x-wallet and wallet to prevent spoofing

DNS and certificate
- The custom domain api.pay.ledger1.ai is bound to APIM with a Let’s Encrypt certificate stored in Key Vault:
  https://kv-portalpay-prod.vault.azure.net/secrets/api-pay-ledger1-2025-11-06/ab48c53bfc58440b99c272f6fee00839
- Renewal: Manual DNS-01 issuance was used; schedule re-issuance before 2026-02-04, or implement an automated renewal flow

AFD fallback (optional)
- If needed, Azure Front Door can be reintroduced. When enabled, ensure AFD injects x-edge-secret: AFDEDGESECRET-20251028 so APIM policy permits traffic.
- See docs/AFD_FALLBACK_PLAN.md for procedures.

Developer notes
- APIM policy location: infra/policies/portalpay-api-policy-body.json
- Policy allows either context.Subscription (APIM subscription) or x-edge-secret
- Healthz bypass remains to keep probes green

Migration guidance for existing references
- Replace any references to the prior default APIM endpoint with https://api.pay.ledger1.ai
- Ensure client SDKs send Ocp-Apim-Subscription-Key on write/read endpoints
- Update documentation links to point to this guide and example curl commands above

Support
- To report any issues or request documentation updates, use /reportbug with details.
