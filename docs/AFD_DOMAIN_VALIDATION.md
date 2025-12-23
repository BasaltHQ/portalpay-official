# AFD Custom Domain Validation (Optional Fallback) — APIM‑first posture

This document applies when Azure Front Door (AFD) is used as an optional/fallback path. The primary public endpoint for client integrations is the APIM custom domain:
- Base: `https://api.pay.ledger1.ai/portalpay`
- Health: `GET /portalpay/healthz` (no subscription required)
- API routes: `/portalpay/api/*` (APIM policy rewrites to backend `/api/*`)
- Authentication: `Ocp-Apim-Subscription-Key` (required for non‑health routes)

AFD may still be configured for the Developer Portal or as a fallback, and APIM policy will accept AFD traffic that carries the AFD‑injected `x-edge-secret` header. Clients must not send `x-edge-secret` themselves.

---

## Issue

The AFD custom domain `dev.pay.ledger1.ai` is in Pending validation state. Until validation completes, traffic won’t route through AFD for that host.

Current example state:
```json
{
  "hostName": "dev.pay.ledger1.ai",
  "domainValidationState": "Pending",
  "isActive": false,
  "validationProperties": {
    "expirationDate": "2025-11-13T22:15:41+00:00",
    "validationToken": "_7guiltkgjlkvqatc2rawvwh77ht5hhq"
  }
}
```

---

## Required Action: Add DNS TXT Record

AFD managed certificates require a DNS TXT record to validate domain ownership.

Record details:
- Type: TXT
- Name: `_dnsauth.dev.pay.ledger1.ai`
- Value: `_7guiltkgjlkvqatc2rawvwh77ht5hhq` (example — use your current token)
- TTL: 3600 (or default)

Steps:
1. Log into your DNS provider for `ledger1.ai`
2. Add a new TXT record
   - Host/Name: `_dnsauth.dev.pay` (or `_dnsauth.dev.pay.ledger1.ai` depending on provider)
   - Type: TXT
   - Value: your current validation token
   - TTL: 3600
3. Save the record
4. Wait 5–15 minutes for DNS propagation
5. Azure will auto‑detect validation and activate the domain

Validation commands:
```bash
# Check DNS record propagation
nslookup -type=TXT _dnsauth.dev.pay.ledger1.ai
# Or
dig TXT _dnsauth.dev.pay.ledger1.ai

# Check custom domain status in Azure
az afd custom-domain show \
  --profile-name afd-portalpay-prod \
  --resource-group PortalPay \
  --custom-domain-name dev-pay-ledger1-ai \
  --query "{hostName:hostName,state:domainValidationState,isActive:isActive}" -o table
```

---

## Important Notes

### APIM‑first Gateway vs AFD Domain

- Primary API gateway for client calls: `https://api.pay.ledger1.ai/portalpay`
- AFD Developer Portal (optional): `https://dev.pay.ledger1.ai`

Ensure tests target the correct host for the correct purpose.

### Why 401/403 Can Happen

If calls bypass APIM or omit the subscription key:
```
Client → (direct backend) ❌  # no APIM, no subscription enforcement
Client → APIM without key ❌  # missing Ocp-Apim-Subscription-Key
```

Correct flows:
```
Client → APIM custom domain ✅
  Header: Ocp-Apim-Subscription-Key

Client → AFD (fallback) → APIM ✅
  AFD injects x-edge-secret (clients do not send this)
  APIM validates either subscription or AFD header per policy
```

---

## Quick Fallback Test (AFD default endpoint)

While waiting for AFD custom domain validation, you can test via the AFD default endpoint (if configured):
```bash
python scripts/test-write-endpoints.py https://afd-endpoint-pay-….z02.azurefd.net YOUR_KEY
```

For primary APIM validation tests:
```bash
# Health (no key)
curl -i https://api.pay.ledger1.ai/portalpay/healthz
# Inventory (with key)
curl -i -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
  https://api.pay.ledger1.ai/portalpay/api/inventory
```

---

## Summary

- APIM custom domain is primary for client integrations
- AFD custom domain validation requires a DNS TXT record `_dnsauth.<host>`
- After DNS validation, AFD becomes active for the Developer Portal or fallback API path
- APIM policy accepts either a valid subscription key or AFD `x-edge-secret` (AFD‑only); Healthz is always permitted

See also:
- `docs/APIM_CUSTOM_DOMAIN_GUIDE.md`
- `docs/AFD_FALLBACK_PLAN.md`
- `docs/portal-custom-domain-afd-commands.md` (commands; optional/fallback)
