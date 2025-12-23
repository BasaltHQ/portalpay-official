# Azure Front Door (AFD) Fallback and Emergency Runbook — APIM‑first

Objective: Provide a clear, low‑risk fallback process if AFD route configuration or custom‑domain activation issues cause outages, while keeping the APIM custom domain as the primary gateway for client API calls.

Key Principles
- APIM custom domain is primary for client integrations: `https://api.pay.ledger1.ai/portalpay`
- Writes and sensitive routes continue to require APIM (subscription key or JWT). We do not route write endpoints directly to App Service.
- Health and basic diagnostics should be available even if AFD is unhealthy.
- Prefer minimal blast radius: add fallback per route or per endpoint, not wholesale, unless directed.

Components (current posture)
- APIM custom domain: `https://api.pay.ledger1.ai/portalpay`
- APIM policy: permits either a valid APIM subscription key or AFD‑injected `x-edge-secret` when AFD is enabled; healthz bypass remains; client wallet headers stripped; `/portalpay/api/*` → `/api/*` rewrite to backend.
- AFD endpoint (optional): `afd-endpoint-pay-….z02.azurefd.net`
- AFD ruleset (optional): injects `x-edge-secret` for APIM enforcement when enabled
- Backend App Service (internal reference): payportal‑*.azurewebsites.net

Fallback Levels
1) Client‑level bypass (safest; zero infra change)
- For emergency read‑only testing or admin tasks, call APIM custom domain directly:
  - Base: `https://api.pay.ledger1.ai/portalpay`
  - Health: `https://api.pay.ledger1.ai/portalpay/healthz`
  - Inventory (requires APIM key): `https://api.pay.ledger1.ai/portalpay/api/inventory`
- This preserves APIM policy and `x-subscription-id` stamping. Recommended first‑line check.

2) AFD health route isolation (optional)
- Route `/healthz` → AFD → APIM healthz API
- Purpose: ensure a stable probe/diagnostic path via AFD independent from app operations.

3) Fallback origin group (App Service) with manual route switch (only for non‑write endpoints)
- Create a secondary origin group and origin to App Service:
  - Origin group (probe to `/`): `og-portal-appservice`
  - Origin: `origin-portal-appservice` → payportal‑*.azurewebsites.net
- DO NOT permanently route writes to this origin. This is for health and limited read‑only diagnostics if APIM is degraded.
- Use cases:
  - Keep `/` (homepage) and `/healthz` reachable.
  - Optionally allow limited GET endpoints for non‑sensitive data (explicitly listed) if business approves.

One‑time provisioning commands (examples)
```bash
# Create origin group (probe '/')
az afd origin-group create \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --origin-group-name og-portal-appservice \
  --probe-path / \
  --probe-request-type GET \
  --probe-protocol Https \
  --probe-interval-in-seconds 120

# Add origin to group
az afd origin create \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --origin-group-name og-portal-appservice \
  --origin-name origin-portal-appservice \
  --host-name payportal-hufedgdtabc4bdhf.eastus-01.azurewebsites.net \
  --https-port 443 \
  --origin-host-header payportal-hufedgdtabc4bdhf.eastus-01.azurewebsites.net

# Optional: narrow fallback route for homepage or /diag/*
az afd route create \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --endpoint-name afd-endpoint-pay \
  --route-name route-diag \
  --origin-group og-portal-appservice \
  --supported-protocols Https \
  --forwarding-protocol HttpsOnly \
  --https-redirect Enabled \
  --link-to-default-domain Enabled \
  --patterns-to-match "/"
```

Emergency manual switch (and rollback)
```bash
# Switch default catch-all route temporarily to fallback origin group
az afd route update \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --endpoint-name afd-endpoint-pay \
  --route-name route-apim \
  --origin-group og-portal-appservice

# Revert to APIM when recovered
az afd route update \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --endpoint-name afd-endpoint-pay \
  --route-name route-apim \
  --origin-group og-apim-public

# Force route redeploy (briefly disruptive)
az afd endpoint update \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --endpoint-name afd-endpoint-pay \
  --enabled-state Disabled
az afd endpoint update \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --endpoint-name afd-endpoint-pay \
  --enabled-state Enabled
```

Guardrails
- Do NOT route write endpoints to App Service fallback. The backend relies on APIM‑stamped subscription identity.
- Prefer to keep `/healthz` and homepage available via fallback; keep APIs on APIM.
- If you must expose a GET API via fallback, obtain approval and explicitly scope routes to that path only.

Monitoring and Alerts
- Add an alert for APIM `/portalpay/healthz` via Azure Monitor or an external uptime check.
- Add a lightweight cron/Function to curl these endpoints and notify on failures.
- Consider probing both:
  - `https://api.pay.ledger1.ai/portalpay/healthz`
  - `https://afd-endpoint-pay-….z02.azurefd.net/healthz`

Custom Domain Considerations
- If AFD custom domains are Pending validation, clients should target the AFD default endpoint or APIM direct.
- Once TXT records exist and CNAMEs point to AFD, verify `domainValidationState: Active`, then attach to route.

Playbook: If AFD shows 404 CONFIG_NOCACHE
1) Validate APIM: `curl https://api.pay.ledger1.ai/portalpay/healthz` (expect 200)
2) Validate AFD health route: `curl https://afd-endpoint-pay-….z02.azurefd.net/healthz`
3) If (1) OK and (2) FAILS → AFD config issue. Try endpoint toggle (force redeploy). If still failing, temporarily switch `/` catch‑all route to `og-portal-appservice` to keep homepage up.
4) When AFD normalizes, revert route to `og-apim-public`.
5) For client API calls during AFD incident, instruct clients to use the APIM base directly: `https://api.pay.ledger1.ai/portalpay`.

Optional Enhancement: Path Rewrite Convenience
- If desired, add an AFD rule to map `/api/*` → `/portalpay/api/*` when forwarding to APIM. This simplifies client URLs.

Verification Checklist (post‑action)
- AFD default `/healthz` returns 200
- APIM `/portalpay/api/inventory` returns 401/403 without key, 200 with valid key (`Ocp-Apim-Subscription-Key`)
- `x-edge-secret` is injected (APIM accepts when enabled) and `x-subscription-id` stamped (trace)
- Custom domains active and serve same results as default endpoint
