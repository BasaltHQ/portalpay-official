Local competitor logo assets
============================

This directory contains local fallback logos for major competitors used in OG/Twitter image generation under src/app/api/og-image/vs/[competitor]/route.ts.

File naming conventions:
- Use lowercase slugs for filenames (matching the dynamic route param), e.g.:
  - stripe.svg or stripe.png
  - paypal.svg or paypal.png
  - square.svg or square.png
  - flexa.svg or flexa.png
- Optionally include name-based variants:
  - logos/portalpay.svg (already present in /public as PortalPay.png, but here it’s not required)
  - logos/checkout-com.svg
  - logos/coinbase-commerce.svg

Format recommendations:
- Prefer SVG when possible for crisp rendering.
- Use transparent backgrounds.
- Ensure the artwork fits within a square viewBox (e.g., 256x256) to render well in tiles.

The vs route will attempt these in order:
1) logos/{slug}.svg
2) logos/{slug}.png
3) logos/{name-slug}.svg
4) logos/{name-slug}.png
5) Remote Clearbit logo by domain mapping (cached)
6) Graceful fallback to initials if all above fail
