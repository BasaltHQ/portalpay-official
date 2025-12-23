# APIM Custom Domain (API Gateway) and Optional Developer Portal Domains

This guide establishes the APIM-first, custom-domain endpoint for all client integrations and scopes the developer portal domain as optional. Azure Front Door (AFD) is also optional and documented as a fallback.

## Primary: API Gateway Custom Domain

- Gateway base URL for clients: `https://api.pay.ledger1.ai/portalpay`
- Health check (no subscription required): `GET https://api.pay.ledger1.ai/portalpay/healthz`
- All API routes: prefix with `/portalpay/api/*` (APIM policy rewrites to backend `/api/*`)
- Authentication: `Ocp-Apim-Subscription-Key` required for all non-health routes
- APIM policy: stamps `x-subscription-id` for backend wallet resolution and strips client-supplied wallet headers

### Configuration Summary (already implemented)
- Certificate: Let’s Encrypt DNS-01, imported to Key Vault `kv-portalpay-prod`
- APIM system-assigned managed identity enabled, granted Key Vault Secrets User
- APIM `hostnameConfigurations` updated to bind `api.pay.ledger1.ai`
- Policy updated to permit either:
  - a valid APIM subscription (`context.Subscription != null`), or
  - the AFD `x-edge-secret` header (only for fallback path)
- Healthz bypass remains; client wallet headers are stripped; APIM rewrites `/portalpay/api/*` to `/api/*`

### Validate
- Health: `curl -i https://api.pay.ledger1.ai/portalpay/healthz` → expect `200 OK`
- Inventory: `curl -i -H "Ocp-Apim-Subscription-Key: <KEY>" https://api.pay.ledger1.ai/portalpay/api/inventory` → expect `200 OK` with JSON

For detailed gateway binding steps and operations, see `docs/APIM_CUSTOM_DOMAIN_GUIDE.md`.

## Optional: Developer Portal Custom Domain

The APIM Developer Portal can be exposed on a custom domain if desired for documentation and onboarding. This is not required for API calls; the API gateway above is primary.

### Configure Developer Portal Domain (Optional)
Create a CNAME record pointing your desired developer portal host (e.g., `dev.pay.ledger1.ai`) to the APIM-managed developer portal endpoint:

```
Type: CNAME
Name: dev.pay (or dev.pay.ledger1.ai depending on your DNS provider)
Value: apim-portalpay-prod.developer.azure-api.net
TTL: 300 (or your preference)
```

Cloudflare example:
1. DNS → Add record
2. Type: CNAME
3. Name: dev.pay
4. Target: apim-portalpay-prod.developer.azure-api.net
5. Proxy status: DNS only (gray cloud)
6. TTL: Auto

Verify propagation:
```powershell
nslookup dev.pay.ledger1.ai
Resolve-DnsName dev.pay.ledger1.ai
```

Then bind the domain to the Developer Portal in APIM (Portal settings). Azure-managed certificates for the developer portal typically auto-provision and renew.

### Notes
- The developer portal domain is independent of the API gateway domain.
- Client integrations must call `https://api.pay.ledger1.ai/portalpay/...`, not the developer portal.
- The default APIM developer portal URL remains accessible even without a custom domain.

## Optional: AFD Fallback

Azure Front Door can be used as a fallback path. When enabled, APIM policy accepts traffic that includes the AFD-injected `x-edge-secret` header. Clients should not send this header themselves.
- See `docs/AFD_FALLBACK_PLAN.md` and `docs/AFD_DOMAIN_VALIDATION.md` for optional procedures.

## Troubleshooting

- 401 Unauthorized: Missing or invalid `Ocp-Apim-Subscription-Key`
- 403 Forbidden: Insufficient scope or request did not meet policy conditions
- Route not found: Ensure you are using the `/portalpay` prefix (e.g., `https://api.pay.ledger1.ai/portalpay/api/...`)
- Healthz: `GET /portalpay/healthz` should always return `200 OK`

## Rollback (Developer Portal Domain only)
To remove a developer portal custom domain:
```powershell
az apim update \
  --resource-group rg-portalpay-prod \
  --name apim-portalpay-prod \
  --set "portalHostnameConfigurations=[]"
```

## Next Steps
1. Ensure all documentation and examples reference `https://api.pay.ledger1.ai/portalpay`
2. Update onboarding materials to emphasize APIM subscription key usage
3. Keep AFD docs marked as optional/fallback
4. Schedule certificate renewal per `docs/APIM_RENEWAL_RUNBOOK.md`
