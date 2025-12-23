# Azure Front Door (AFD) Custom Domain — Optional Fallback

This guide documents manual Azure CLI commands to configure a custom domain on Azure Front Door for the Developer Portal and/or as an optional fallback gateway. The APIM custom domain is the primary public endpoint for client integrations. Use AFD only when required (e.g., regional routing, WAF-first policies, or temporary fallback).

Primary API gateway for clients (preferred):
- Base: `https://api.pay.ledger1.ai/portalpay`
- Health: `GET /portalpay/healthz` (no subscription required)
- All API calls: prefix with `/portalpay/api/*`
- Authentication: `Ocp-Apim-Subscription-Key` header (AFD-only `x-edge-secret` is injected by AFD and validated by APIM; do not send it from clients)

See: `docs/APIM_CUSTOM_DOMAIN_GUIDE.md` and `docs/AFD_FALLBACK_PLAN.md`.

---

## Scope of This Document

- Optional AFD setup for Developer Portal on `dev.pay.ledger1.ai`
- Optional AFD path to APIM with `x-edge-secret` injection (fallback)
- Does not replace the primary APIM gateway. Keep APIM-first for all client integrations.

## Prerequisites

- Azure CLI installed and authenticated
- DNS access to update CNAME records for `ledger1.ai`
- Resource group: `PortalPay`
- AFD profile: `afd-portalpay-prod`
- AFD endpoint: `afd-endpoint-pay-dfech8b7cbdffxh9`

## Step 1: Update DNS Configuration (AFD)

Create a CNAME record for your AFD endpoint:

```
Type: CNAME
Host: dev.pay
Value: afd-endpoint-pay-dfech8b7cbdffxh9.z02.azurefd.net
TTL: 3600 (or your preferred value)
```

Resulting domain: `dev.pay.ledger1.ai`

## Step 2: Create Origin Group (Developer Portal)

```bash
az afd origin-group create \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --origin-group-name og-apim-portal \
  --probe-request-type GET \
  --probe-protocol Https \
  --probe-path "/" \
  --sample-size 4 \
  --successful-samples-required 3 \
  --additional-latency-in-milliseconds 50
```

## Step 3: Add APIM Developer Portal Origin

```bash
az afd origin create \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --origin-group-name og-apim-portal \
  --origin-name origin-apim-portal \
  --origin-host-header apim-portalpay-prod.developer.azure-api.net \
  --host-name apim-portalpay-prod.developer.azure-api.net \
  --http-port 80 \
  --https-port 443 \
  --priority 1 \
  --weight 1000 \
  --enabled-state Enabled
```

## Step 4: Add Custom Domain to AFD

```bash
az afd custom-domain create \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --custom-domain-name dev-pay-ledger1-ai \
  --host-name dev.pay.ledger1.ai \
  --certificate-type ManagedCertificate \
  --minimum-tls-version TLS12
```

Note: Azure will automatically provision an SSL certificate (5–15 minutes after DNS validation).

## Step 5: Create Route

```bash
az afd route create \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --endpoint-name afd-endpoint-pay-dfech8b7cbdffxh9 \
  --route-name route-portal \
  --origin-group og-apim-portal \
  --supported-protocols Https \
  --https-redirect Enabled \
  --forwarding-protocol HttpsOnly \
  --patterns-to-match "/*" \
  --custom-domains dev-pay-ledger1-ai \
  --enable-compression true
```

## Step 6: Monitor Certificate Provisioning

```bash
az afd custom-domain show \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --custom-domain-name dev-pay-ledger1-ai \
  --query "{validationState:validationProperties.validationState,domainValidationState:domainValidationState}"
```

`domainValidationState` should be `Approved` when the certificate is ready.

## Step 7: Verify Access (Developer Portal)

1. Browse to `https://dev.pay.ledger1.ai`
2. Verify SSL certificate (green lock)
3. Confirm products and APIs are visible in the Developer Portal

---

## Optional: AFD Fallback Path for API Gateway

If you reintroduce AFD as a fallback path in front of APIM for client API traffic:
- Ensure your AFD ruleset injects `x-edge-secret` for routes forwarded to APIM
- APIM inbound policy must validate `x-edge-secret` and permit traffic accordingly
- Clients should continue to use the APIM custom domain and must not send `x-edge-secret`

See `docs/AFD_FALLBACK_PLAN.md` for operational guidance.

---

## Troubleshooting

### DNS Not Propagating
```bash
nslookup dev.pay.ledger1.ai
```

### Certificate Still Provisioning
```bash
az afd custom-domain show \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --custom-domain-name dev-pay-ledger1-ai
```

### View AFD Custom Domains
```bash
az afd custom-domain list \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --output table
```

---

## Notes

- APIM custom domain for client APIs is primary: `https://api.pay.ledger1.ai/portalpay`
- The original APIM Developer Portal URL remains accessible: `https://apim-portalpay-prod.developer.azure-api.net`
- AFD managed certificates auto-renew
- DNS changes can take up to 48 hours to fully propagate globally

## Cleanup (if needed)

```bash
# Delete route
az afd route delete \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --endpoint-name afd-endpoint-pay-dfech8b7cbdffxh9 \
  --route-name route-portal

# Delete custom domain
az afd custom-domain delete \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --custom-domain-name dev-pay-ledger1-ai

# Delete origin
az afd origin delete \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --origin-group-name og-apim-portal \
  --origin-name origin-apim-portal

# Delete origin group
az afd origin-group delete \
  --resource-group PortalPay \
  --profile-name afd-portalpay-prod \
  --origin-group-name og-apim-portal
```
