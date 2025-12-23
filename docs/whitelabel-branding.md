White-label Branding Guide

Overview
This project now supports runtime-selectable branding so you can run multiple containers from the same image with different brand look-and-feel, while keeping the same connections and environment variables (APIM keys, storage, etc.).

Key concept:
- Branding is selected via BRAND_KEY (e.g. "portalpay", "acme")
- All operational connections remain in your shared .env and/or Azure Key Vault
- The same built image can be reused for multiple deployments

What changed in code
- src/config/brands/index.ts: Central brand registry + getBrandConfig/getBrandKey helpers
- src/contexts/BrandContext.tsx: Client context provider + hook to access brand config
- src/app/layout.tsx: 
  - generateMetadata() uses brand for dynamic metadata (title, og, twitter, icons)
  - Wraps the app with BrandProvider for global access
- src/app/manifest.ts: Dynamic web app manifest per brand (Next uses this automatically)
- src/contexts/ThemeContext.tsx: Defaults now sourced from brand for name/logo/favicon
- src/components/landing/SiteFooter.tsx: Footer uses brand name/logo dynamically

How to add a new brand
1) Add assets
   - Place your brand-specific assets under public/brands/<brand>/, for example:
     - public/brands/acme/logo.png
     - public/brands/acme/favicon.png
     - optional: footer symbol, additional images

2) Add brand config
   - Edit src/config/brands/index.ts and add a new entry to BRANDS:
     {
       key: "acme",
       name: "ACME Pay",
       colors: { primary: "#8B5CF6", accent: "#F59E0B" },
       logos: { app: "/brands/acme/logo.png", favicon: "/brands/acme/favicon.png" },
       meta: { ogTitle: "ACME Pay", ogDescription: "White-labeled payments" }
     }
   - key should match your BRAND_KEY
   - logos.app is used for OG/Twitter images and Navbar defaults in ThemeContext
   - logos.favicon is used in metadata icons, manifest icons, etc.

3) Select the brand at runtime
   - Set BRAND_KEY=acme in the container environment
   - No need to change or duplicate your existing .env shared connections

Local multi-container example
A compose file is provided at deploy/docker-compose.whitelabel.yml:
- portalpay service: BRAND_KEY=portalpay (ports 8081:3000)
- acme service: BRAND_KEY=acme (ports 8082:3000)
- Both share the same env_file (.env) and connections
- Optional read-only volumes mount brand asset folders

Run locally:
- docker compose -f deploy/docker-compose.whitelabel.yml up --build -d
- Visit http://localhost:8081 for PortalPay, http://localhost:8082 for ACME

Azure deployment patterns
- Azure Container Apps
  - Create two Container Apps from the same image (or two revisions)
  - Inject BRAND_KEY=portalpay for the original and BRAND_KEY=<new> for the white-label
  - Reference the same secrets (APIM keys, endpoints) via Key Vault/App Configuration
- Azure App Service
  - Deploy the same image or zip, create two Web Apps (or slots)
  - Set BRAND_KEY in Application Settings
  - Shared app settings for connections remain the same (Key Vault references)
- Kubernetes
  - Create two Deployments that reference the same Secret/ConfigMap for connections
  - Set different BRAND_KEY env var per Deployment

Common Q&A
- Does this disturb the original PortalPay deployment?
  No. Branding is separate. Connections/variables remain unchanged. The original container keeps its setup with BRAND_KEY=portalpay.

- Do I need to rebuild an image per brand?
  No. Runtime branding via env variable is supported. You can still choose to make tag-per-brand images via build ARG if desired, but it’s optional.

- What about static copy mentioning “PortalPay”?
  Core metadata, footer, manifest, navbar defaults, and theme branding now reflect the selected brand. Some pages contain descriptive copy referencing PortalPay explicitly for marketing/docs. If you need those strings to be brand-agnostic, update the relevant pages to read brand.name via BrandContext or ThemeContext rather than static strings.

- Client-side access to brand?
  The current approach avoids exposing brand in public env. Components that need brand can read it via BrandContext. If you need client-side env, you can set NEXT_PUBLIC_BRAND_KEY with caution.

Maintenance tips
- Keep BRANDS minimal and avoid embedding secrets in brand configs
- Prefer server-side selection (getBrandConfig()) and pass via BrandProvider
- Keep shared connections in one place (.env, Key Vault, App Configuration)

Files touched
- src/config/brands/index.ts
- src/contexts/BrandContext.tsx
- src/app/layout.tsx
- src/app/manifest.ts
- src/contexts/ThemeContext.tsx
- src/components/landing/SiteFooter.tsx
- deploy/docker-compose.whitelabel.yml

Rollback
- To disable dynamic branding, remove BrandProvider usage and restore static metadata/icons in src/app/layout.tsx and remove manifest.ts. However, it’s recommended to keep dynamic branding for flexibility.
