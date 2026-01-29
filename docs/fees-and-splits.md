# Fees and Splits: Configuration, Validation, and Immutability

This document describes how Platform and Partner fee basis points are configured per brand, how split configuration is validated against PaymentSplitter recipients, and the immutability policy enforced after a partner container is deployed.

- Audience: Platform operators and partner administrators
- Applies to: BasaltSurge platform container and partner-branded containers

## Terminology

- Basis Points (bps): Hundredths of a percent. 50 bps = 0.50%.
- Split recipients: Addresses and their share of split payouts in bps.
- PaymentSplitter: Smart contract used to divide funds among recipients.
- Brand overrides: Mutable brand configuration stored in Cosmos (`brand:config`).

## Overview

For partner brands, total recipient shares must sum to 10,000 bps:
- merchantBps = 10,000 − platformFeeBps − partnerFeeBps
- platformFeeBps is configurable per partner brand (subject to immutability rules)
- partnerFeeBps is configurable pre‑deploy (subject to immutability rules)

All bps are clamped to [0, 10,000], integer, floor-rounded.

## Configuration Model and Precedence

The platform fee configuration (`platformFeeBps`) is resolved in this order:

1. Brand override in Cosmos (`brand:config.platformFeeBps`)
2. Static brand config defaults (`BRANDS[key].platformFeeBps`) if defined
3. Environment fallback (e.g., `PLATFORM_SPLIT_BPS`) if defined
4. Hard fallback: 50 bps

Partner fee configuration (`partnerFeeBps`) follows similar precedence:

1. Brand override in Cosmos (`brand:config.partnerFeeBps`)
2. Static brand defaults
3. Hard fallback: 0 bps

Default merchant fee (`defaultMerchantFeeBps`) is orthogonal (merchant add‑on) and does not affect PaymentSplitter recipient shares.

When synthesizing recipients for a merchant under a partner brand:

- platformBps = clamp(resolvePlatformFeeBps(brandKey, effectiveBrand, overrides))
- partnerBps = clamp(overrides.partnerFeeBps or effectiveBrand.partnerFeeBps)
- merchantBps = clamp(10,000 − platformBps − partnerBps)

Where clamp(v) = min(10,000, max(0, floor(v)))

## Split Configuration Validation

Validation occurs during split preview (GET) and synthesis/bind flows (POST) via `src/app/api/split/deploy/route.ts`.

The API ensures PaymentSplitter recipients match expected shares for the platform and partner recipients:

- Platform recipient must be present
- Platform recipient shares must equal `expectedPlatformBps` resolved for the brand
- Partner recipient must be present for partner containers
- Total shares must deterministically sum to 10,000 bps

If misconfiguration is detected, the API responds with a `misconfiguredSplit` object. Typical shape:

```json
{
  "misconfiguredSplit": {
    "reason": "platform_bps_mismatch",
    "expectedPlatformBps": 50,
    "actualPlatformBps": 25,
    "needsRedeploy": true,
    "details": {
      "brandKey": "acme",
      "splitAddress": "0x...",
      "platformRecipient": "0x...",
      "partnerRecipient": "0x..."
    }
  }
}
```

Notes:

- `reason` may be `platform_bps_mismatch`, `missing_platform_recipient`, or `missing_partner_recipient`.
- `needsRedeploy` indicates the split must be re-bound with corrected recipients or a new PaymentSplitter deployment.
- GET flows surface misconfiguration for visibility.
- POST flows are idempotent and will not rewrite an existing split if recipients are mismatched; instead they signal `needsRedeploy`.

## Post‑Deploy Immutability Policy

Per user requirement: “The partner should not be able to configure their own share or the platform share once the partner container is deployed.”

The backend PATCH route `src/app/api/platform/brands/[brandKey]/config/route.ts` enforces:

- If a partner container has been deployed (any of `containerState`, `containerAppName`, `containerFqdn` present in overrides), then changes to `platformFeeBps` or `partnerFeeBps` are blocked unless the caller has one of:
  - `platform_superadmin`
  - `platform_admin`

Attempting such changes without the above roles returns:

```json
{
  "error": "fees_locked_after_deploy"
}
```

HTTP status: 403

### UI Behavior

- BrandingPanel (partner admin):
  - Fee inputs (`platformFeeBps`, `partnerFeeBps`) are disabled in partner containers after deploy; UI shows “Locked after partner container deploy”.
- PartnerManagementPanel (platform superadmin):
  - Mirrors the disabled state for fee inputs when `containerAppName`/`containerFqdn`/`containerState` indicate a deployed partner container.
  - Backend still enforces immutability; UI lock is a convenience.

### Role‑Based Exception

Platform operators with `platform_superadmin` or `platform_admin` may adjust `platformFeeBps` or `partnerFeeBps` post‑deploy via the Brand Config API if policy allows.

## Platform Recipient Resolution

The platform recipient address used in split validation is resolved based on container type:

- Platform container: `NEXT_PUBLIC_RECIPIENT_ADDRESS`
- Partner container: `NEXT_PUBLIC_PARTNER_WALLET` (or `PARTNER_WALLET`)

Split validation uses the appropriate recipient for the container type to confirm expected shares.

## Example Scenarios

1) Partner brand has `platformFeeBps = 75`, `partnerFeeBps = 25`.  
Expected merchantBps = 10,000 − 75 − 25 = 9,900 bps.  
If PaymentSplitter shows platform recipient at 50 bps, API returns `platform_bps_mismatch` with `needsRedeploy: true`.

2) Partner brand deployed; a partner admin attempts to change `partnerFeeBps` from 25 to 50.  
Backend returns 403 `fees_locked_after_deploy`. UI remains disabled.

3) Preview for merchant shows missing platform recipient.  
`misconfiguredSplit.reason = "missing_platform_recipient"`, `needsRedeploy: true`.

## Operational Guidance

- Always configure `platformFeeBps` and `partnerFeeBps` before provisioning a partner container.
- Treat split validation failures as blockers; re‑bind or redeploy with corrected recipients and bps.
- Post‑deploy fee changes require platform roles; partners cannot adjust fee bps after container provisioning.
- Use PartnerManagementPanel “Generate Provision Plan” to ensure container envs include brand and wallet variables.

## API Signals Summary

- `misconfiguredSplit.reason` values:
  - `platform_bps_mismatch`
  - `missing_platform_recipient`
  - `missing_partner_recipient`
- `misconfiguredSplit.needsRedeploy` (boolean)
- HTTP 403 `fees_locked_after_deploy` on forbidden fee changes post‑deploy

## References

- Backend route: `src/app/api/platform/brands/[brandKey]/config/route.ts` (immutability enforcement)
- Split deploy route: `src/app/api/split/deploy/route.ts` (bps resolution and split validation)
- Admin panels:
  - `src/app/admin/panels/BrandingPanel.tsx`
  - `src/app/admin/panels/PartnerManagementPanel.tsx`
