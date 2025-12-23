# Partner Container Environment Configuration (Admin vs Recipient Wallets)

This guide defines a clean, non-conflicting environment schema for partner containers, separating ADMIN wallets (who can access admin panels) from RECIPIENT wallets (who receive fee shares in splits). Use this in Azure App Service/App Settings for your partner deployment.

Summary
- Admin wallet (NEXT_PUBLIC_OWNER_WALLET) controls Branding and Merchants admin panels.
- Recipient wallet (PARTNER_WALLET) receives the partner fee share (partnerFeeBps) in splits.
- Platform recipient (NEXT_PUBLIC_PLATFORM_WALLET) receives platform fee share (platformFeeBps).
- Container identification must be explicit via CONTAINER_TYPE and NEXT_PUBLIC_CONTAINER_TYPE.

Required variables (Partner)
- CONTAINER_TYPE=partner
- NEXT_PUBLIC_CONTAINER_TYPE=partner
- BRAND_KEY=<your brand key> (e.g. paynex)
- NEXT_PUBLIC_APP_URL=https://<your partner domain or container host> (e.g. https://paynex.azurewebsites.net)
- NEXT_PUBLIC_OWNER_WALLET=0x... (Partner admin wallet; grants access to admin panels)
- PARTNER_WALLET=0x... (Partner recipient wallet; receives partnerFeeBps share)
- NEXT_PUBLIC_PLATFORM_WALLET=0x... (Platform recipient wallet; receives platformFeeBps share)
- NEXT_PUBLIC_RECIPIENT_ADDRESS=0x... (Default recipient used by some flows; usually PARTNER_WALLET)
- ADMIN_WALLETS=0x...,0x... (Optional CSV; additional partner admin wallets)

Recommended
- PORTALPAY_API_BASE=https://<your partner domain> (if you want to override API base for server calls)
- AZURE_BLOB_PUBLIC_BASE_URL=https://<your AFD public base> (for CDN rewrites)
- NEXT_PUBLIC_AFD_HOSTNAME and NEXT_PUBLIC_BLOB_HOSTNAME (Next.js remote image allowlist)
- COSMOS_CONNECTION_STRING (Durable storage; otherwise degraded mode)

Wallet role separation
- Admin (UI access): NEXT_PUBLIC_OWNER_WALLET, plus ADMIN_WALLETS entries.
- Recipient (fee share): PARTNER_WALLET (partnerFeeBps) and NEXT_PUBLIC_PLATFORM_WALLET (platformFeeBps).
- Merchant site-config partition: /api/site/config?wallet=<merchant wallet> returns merchant’s site config; partner wallet is not used for merchant partition keys.
- Brand overrides: Brand partner wallet (PARTNER_WALLET) is used for split recipient binding and may be used to synthesize a brand-scoped config in partner container when fetching site config with ?wallet=PARTNER_WALLET.

Behavior changes implemented in code (summary)
- Site config GET (partner container): 
  - brand name and logos reflect BRAND_KEY brand.
  - appUrl defaults to brand.appUrl or container base, not platform URL.
  - If ?wallet equals brand PARTNER_WALLET and no wallet-scoped config exists, a brand-scoped config is synthesized to avoid 404 or platform fallback.
- Admin panel gating (partner container):
  - Branding/Merchants allowed when connected wallet equals NEXT_PUBLIC_OWNER_WALLET or is listed in ADMIN_WALLETS.
  - Partners panel: denied in partner container.
  - Wallets/Split edits: locked in partner container (read-only; platform manages binding).

Sample .env.partner (copy to App Settings)
```
# Container identification
CONTAINER_TYPE=partner
NEXT_PUBLIC_CONTAINER_TYPE=partner

# Brand selection
BRAND_KEY=paynex

# Base URL for links and metadata
NEXT_PUBLIC_APP_URL=https://paynex.azurewebsites.net

# Admin (UI access)
NEXT_PUBLIC_OWNER_WALLET=0x2367ae402e06edb2460e51f820c09fc885f87b65
ADMIN_WALLETS=0x2367ae402e06edb2460e51f820c09fc885f87b65

# Recipients (fee shares)
NEXT_PUBLIC_PLATFORM_WALLET=0x00Fe4F0104a989CA65Df6B825A6C1682413BcA56
PARTNER_WALLET=0x2367ae402e06edb2460e51f820c09fc885f87b65
NEXT_PUBLIC_RECIPIENT_ADDRESS=0x2367ae402e06edb2460e51f820c09fc885f87b65

# Optional split BPS overrides (use only if overriding brand defaults)
# PLATFORM_SPLIT_BPS=50
# PARTNER_SPLIT_BPS=50

# Storage/CDN (optional but recommended)
AZURE_BLOB_PUBLIC_BASE_URL=https://your-afd-profile.z02.azurefd.net
NEXT_PUBLIC_AFD_HOSTNAME=your-afd-profile.z02.azurefd.net
NEXT_PUBLIC_BLOB_HOSTNAME=engram1.blob.core.windows.net

# API base override for server calls (optional)
PORTALPAY_API_BASE=https://paynex.azurewebsites.net
```

Notes
- Ensure BRAND_KEY assets exist under /public/brands/<key>/ (e.g., /brands/paynex).
- Do not set CONTAINER_TYPE=platform in partner container; it disables partner overrides.
- For platform container, use docs/env-platform.md (admin + recipient separation for platform).
