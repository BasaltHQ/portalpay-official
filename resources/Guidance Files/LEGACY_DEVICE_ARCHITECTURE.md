# Legacy Device Architecture Reference

> **Purpose**: This document is the authoritative reference for all legacy device support in the BasaltSurge/PortalPay platform. It MUST be consulted by any developer or AI agent before modifying code that touches the legacy routing, CSS pipeline, setup page, or touchpoint provisioning flow.

---

## Table of Contents

1. [Overview](#overview)
2. [Target Hardware](#target-hardware)
3. [Architecture Diagram](#architecture-diagram)
4. [Routing & Proxy Layer](#routing--proxy-layer)
5. [CSS Pipeline](#css-pipeline)
6. [SSR Overlay System](#ssr-overlay-system)
7. [Legacy Setup Page](#legacy-setup-page)
8. [JS Bridge Contracts (APK ↔ Web)](#js-bridge-contracts-apk--web)
9. [Provisioning API](#provisioning-api)
10. [File Inventory](#file-inventory)
11. [Critical Rules](#critical-rules)
12. [Common Pitfalls](#common-pitfalls)
13. [Testing Checklist](#testing-checklist)

---

## Overview

The platform supports **legacy Android terminals** (ValorPay VP550) running Chrome 93 WebView. These devices cannot parse modern CSS or JavaScript that the standard Next.js build produces. A parallel routing and CSS system ensures these devices receive compatible content.

**The Two Pipelines:**

| | Modern Devices | Legacy Devices (VP550) |
|---|---|---|
| **Browser** | Chrome 110+ / Safari 16+ | Chrome 93 WebView |
| **CSS** | `globals.css` via Tailwind v4 (uses `@layer`, `oklch()`, `:is()`) | `public/css/legacy.css` (flattened, all modern CSS downleveled) |
| **Routes** | `src/app/(web)/*` | `src/app/legacy/*` |
| **JS** | React hydration, client components | Standalone ES5 inline scripts (setup page only) |
| **Proxy** | Direct pass-through | `NextResponse.rewrite()` from `/touchpoint/*` → `/legacy/touchpoint/*` |

---

## Target Hardware

| Property | Value |
|---|---|
| **Device** | ValorPay VP550 |
| **OS** | Android 12 (kernel-level restrictions) |
| **WebView** | Chrome 93.0.4577.62 |
| **User-Agent** | `Mozilla/5.0 (Linux; Android 12; N950 Build/SKQ1.220119.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/93.0.4577.62 Mobile Safari/537.36` |
| **APK URL** | `https://xpaypass.com/touchpoint/setup?scale=0.75` |

### Unsupported CSS Features (Chrome 93)

| Feature | Required Chrome Version |
|---|---|
| `@layer` | 99+ |
| `oklch()` / `lab()` | 111+ |
| `color-mix()` | 111+ |
| `:is()` | 88+ (limited), full support 105+ |
| `:where()` | 88+ |
| `@supports` (relative color) | 119+ |
| Individual `translate` / `scale` / `rotate` | 104+ |
| `aspect-ratio` | 88+ |
| `@property` | 85+ |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         VP550 APK                               │
│  Opens: https://xpaypass.com/touchpoint/setup?scale=0.75        │
│  Reads: window.TOUCHPOINT_CONFIG, window.TOUCHPOINT_INSTALL_ID  │
│  Query Params: lockdownMode, unlockHash, scale                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP Request
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Proxy Layer (src/proxy.ts)                     │
│                                                                  │
│  1. Detect UA: Chrome < 99 + Android → isLegacyAndroid           │
│  2. If terminal route + legacy → NextResponse.rewrite(/legacy/*) │
│  3. Browser URL stays /touchpoint/setup (rewrite is invisible)   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌──────────────────────┐  ┌──────────────────────────────┐
│   Modern Route       │  │   Legacy Route               │
│   src/app/(web)/     │  │   src/app/legacy/            │
│                      │  │                              │
│   - React hydration  │  │   - layout.tsx loads         │
│   - Tailwind v4 CSS  │  │     legacy.css + overlay     │
│   - Client components│  │     kill <style>             │
│                      │  │   - touchpoint/setup:        │
│                      │  │     Standalone ES5 inline JS │
│                      │  │   - terminal/[id], etc:      │
│                      │  │     Re-exports from (web)    │
└──────────────────────┘  └──────────────────────────────┘
```

---

## Routing & Proxy Layer

### Proxy Rewrite (`src/proxy.ts`, lines ~230-249)

The proxy intercepts requests and rewrites legacy device traffic:

```typescript
// Terminal routes that need legacy CSS support
const isTerminalRoute = url.pathname.startsWith("/terminal") ||
                        url.pathname.startsWith("/touchpoint") ||
                        url.pathname.startsWith("/kiosk") ||
                        url.pathname.startsWith("/kitchen") ||
                        url.pathname.startsWith("/handheld");

if (isTerminalRoute) {
    const chromeMatch = ua.match(/Chrome\/([0-9]+)/i);
    const chromeVersion = chromeMatch ? parseInt(chromeMatch[1], 10) : 0;
    const isLegacyAndroid = /Android/i.test(ua) && chromeVersion > 0 && chromeVersion < 99;

    if (isLegacyAndroid && !url.pathname.startsWith("/legacy")) {
        const target = new URL(`/legacy${url.pathname}`, req.url);
        const res = NextResponse.rewrite(target);
        return res;
    }
}
```

> **CRITICAL**: `NextResponse.rewrite()` is server-side only. The browser URL stays `/touchpoint/setup`, not `/legacy/touchpoint/setup`. All client-side code that checks `window.location.pathname` sees the ORIGINAL path, not the rewritten one.

### Legacy Route Group (`src/app/legacy/`)

```
src/app/legacy/
├── layout.tsx                    ← Loads legacy.css + overlay kill
├── touchpoint/
│   └── setup/
│       └── page.tsx              ← STANDALONE server component (ES5 inline JS)
├── terminal/
│   ├── page.tsx                  ← Re-exports (web)/terminal/page
│   └── [id]/
│       └── page.tsx              ← Re-exports (web)/terminal/[id]/page
├── handheld/
│   └── [id]/
│       └── page.tsx              ← Re-exports (web)/handheld/[id]/page
├── kiosk/
│   └── [id]/
│       └── page.tsx              ← Re-exports (web)/kiosk/[id]/page
└── kitchen/
    ├── page.tsx                  ← Re-exports (web)/kitchen/page
    └── [wallet]/
        └── page.tsx              ← Re-exports (web)/kitchen/[wallet]/page
```

> **IMPORTANT**: Only `touchpoint/setup/page.tsx` is a standalone implementation. All other legacy pages re-export from `(web)` — they share the same server-side logic and client components. The `legacy/layout.tsx` adds the CSS overrides.

---

## CSS Pipeline

### Build Command

```bash
npm run build:legacy
# Runs: node scripts/flatten-legacy-css.mjs
```

This is automatically chained into the main build:
```json
"build": "npm run build:legacy && next build"
```

### Pipeline: `scripts/flatten-legacy-css.mjs`

| Step | Action | Purpose |
|---|---|---|
| 1 | `npx @tailwindcss/cli` compile `globals.css` | Generate full Tailwind output |
| 2 | LightningCSS transform (target Chrome 93) | Convert `oklch()` → hex, add vendor prefixes |
| 3 | Regex transforms | Strip `@layer`, `@property`, `@supports` blocks; convert `:where()` → inner selectors; `:is()` → `:-webkit-any()`; individual transforms → `transform:` shorthand; logical properties → physical |
| 4 | LightningCSS minification (target Chrome 93) | Minify without re-introducing modern features |
| 5 | Post-minification cleanup | Re-strip `@supports`, `:is()`, `:where()`, `color-mix()`, `lab()`, gradient color spaces, **theme-ready overlay rules** |

### Output

- **Input**: `src/app/globals.css` (Tailwind v4)
- **Output**: `public/css/legacy.css` (~625 KB)

### When to Rebuild

**You MUST run `npm run build:legacy` after ANY of these changes:**

1. ✏️ Editing `src/app/globals.css`
2. ✏️ Adding/modifying Tailwind utility classes used on terminal/touchpoint pages
3. ✏️ Updating Tailwind config or version
4. ✏️ Modifying the flatten script itself (`scripts/flatten-legacy-css.mjs`)

### Verification

After rebuilding, the script prints a compatibility report. ALL items must show `✅ 0`:

```
═══ Chrome 93 Compatibility Report ═══
  ✅ oklch(: 0
  ✅ lab(: 0
  ✅ color-mix(: 0
  ✅ margin-inline: 0
  ✅ padding-inline: 0
  ✅ @layer: 0
  ✅ :is(: 0
  ✅ :where(: 0
  ...
═══════════════════════════════════════
🎉 ZERO incompatible patterns found!
```

> **WARNING**: If any item shows a non-zero count, the legacy CSS will break on VP550 terminals. Do NOT deploy until all items are zero.

---

## SSR Overlay System

### The Problem

The root layout (`src/app/layout.tsx`) renders `<html data-pp-theme-ready="0">` during SSR. Two systems use this attribute to block user interaction until themes load:

1. **CSS Overlay** (`globals.css`, lines 755-789): Pure CSS `body::before`/`body::after` with `z-index: 9999`, `position: fixed`, `inset: 0`, and a blurred dark background
2. **React Overlay** (`ThemeReadyGate` component): A React-based full-screen overlay

### The `beforeInteractive` Script (`layout.tsx`, `pp-prelock`)

This script runs before React hydration and sets `data-pp-theme-ready="1"` for device routes:

```javascript
if (path.indexOf("/touchpoint") === 0 ||
    path.indexOf("/terminal") === 0 ||
    path.indexOf("/handheld") === 0 ||
    path.indexOf("/kiosk") === 0 ||
    path.indexOf("/kitchen") === 0 ||
    path.indexOf("/legacy") === 0) {
  d.setAttribute("data-pp-theme-stage", "init");
  d.setAttribute("data-pp-theme-ready", "1");
}
```

> **CRITICAL**: The `/legacy` path MUST be included in this check. If omitted, legacy devices will be permanently blocked by the CSS overlay.

### Three Layers of Defense (Legacy Devices)

1. **`beforeInteractive` script**: Sets `data-pp-theme-ready="1"` for `/legacy` paths (prevents CSS overlay from ever showing)
2. **`legacy/layout.tsx` inline `<style>`**: Force-kills `body::before`/`body::after` with `display: none !important` (backup if script fails to parse)
3. **`flatten-legacy-css.mjs` step 5g**: Strips all `html[data-pp-theme-ready="0"] body:before/after` rules from `legacy.css` (prevents the rules from ever existing in the legacy stylesheet)

### ThemeReadyGate Bypass (`theme-ready-gate.tsx`, line ~491)

The React-based overlay returns `null` for device routes:

```typescript
const isDeviceRoute = pathname.startsWith("/touchpoint") ||
    pathname.startsWith("/terminal") ||
    pathname.startsWith("/handheld") ||
    pathname.startsWith("/kiosk") ||
    pathname.startsWith("/kitchen") ||
    pathname.startsWith("/legacy");
if (!shouldShow || isLandingPage || isShopRoute || isDeviceRoute) return null;
```

> **CRITICAL**: `/legacy` MUST be in the `isDeviceRoute` check. If omitted, the React overlay will render on legacy routes.

---

## Legacy Setup Page

**File**: `src/app/legacy/touchpoint/setup/page.tsx`

This is a **standalone server component** with inline ES5 JavaScript. It does NOT use React hydration for its interactive behavior.

### Why Standalone?

The original `(web)/touchpoint/setup/page.tsx` is a `"use client"` component that uses:
- `useRouter()` from Next.js
- `useState`, `useEffect` from React
- `navigator.clipboard` API
- `lucide-react` icons

These require React hydration. On Chrome 93, the Next.js client bundle may contain modern JS syntax that Chrome can't parse, causing hydration to fail silently. When hydration fails, all React event handlers (onClick, etc.) are dead.

### Behavior Contract

The legacy setup page MUST replicate the following behaviors from the original:

| Behavior | Implementation |
|---|---|
| Generate/persist installation ID | `localStorage` key `"touchpoint_installation_id"`, format: `Date.now() + "-" + Math.random().toString(36).substring(2, 15)` |
| Accept `?installationId=` query param | Parse from URL, persist to localStorage (overrides stored ID) |
| Fetch config on load | `GET /api/touchpoint/config?installationId={id}` via XMLHttpRequest |
| Manual "Check Configuration" button | Same API call, toggles button state |
| Expose `window.TOUCHPOINT_CONFIG` | **MUST** be set after EVERY config fetch (see JS Bridge section) |
| Expose `window.TOUCHPOINT_INSTALL_ID` | Set once on init |
| Redirect when configured | `window.location.replace()` to `/legacy/{mode}/{wallet}?params` |
| Pass lockdown params | `lockdownMode` and `unlockHash` in redirect query string |
| Preserve scale param | `scale` from original URL passed through to redirect |

### ES5 Constraints

All JavaScript in the legacy setup page MUST be ES5 compatible:

| ✅ Use | ❌ Do NOT Use |
|---|---|
| `var` | `let`, `const` |
| `function(){}` | Arrow functions `() => {}` |
| `"string" + var` | Template literals `` `${var}` `` |
| `indexOf()` | `includes()`, `startsWith()` |
| `XMLHttpRequest` | `fetch()`, `async/await` |
| `for (var i=0; ...)` | `for...of`, `for...in` on arrays |
| `JSON.parse()` | Optional chaining `?.`, nullish coalescing `??` |

---

## JS Bridge Contracts (APK ↔ Web)

The Android APK reads JavaScript global variables from the WebView to determine device state.

### `window.TOUCHPOINT_CONFIG` (Required)

Set by the setup page after every `/api/touchpoint/config` response:

```javascript
window.TOUCHPOINT_CONFIG = {
    configured: true,           // boolean — is device provisioned?
    mode: "terminal",           // "terminal" | "handheld" | "kds" | "kiosk" | null
    merchantWallet: "0x...",    // string — merchant's wallet address | null
    brandKey: "xoinpay",        // string — brand identifier | null
    locked: false,              // boolean — is device locked?
    lockdownMode: "standard",   // "none" | "standard" | "device_owner"
    unlockCodeHash: "sha256..", // string — SHA-256 hash of unlock PIN | null
};
```

> **CRITICAL**: If this object is missing or has incorrect shape, the APK cannot:
> - Detect provisioning status → device appears stuck on setup
> - Read lockdown settings → lockdown activates without unlock ability
> - Determine device mode → incorrect interface loads

### `window.TOUCHPOINT_INSTALL_ID` (Required)

```javascript
window.TOUCHPOINT_INSTALL_ID = "1779143014798-hg11mene1gw";
```

The APK uses this to identify the device for remote management.

### Query Parameters (Redirect URL)

When redirecting after provisioning, these query params are passed:

| Param | Value | Purpose |
|---|---|---|
| `scale` | `0.75` | Screen scaling factor from APK |
| `lockdownMode` | `standard` or `device_owner` | APK applies device-level lockdown |
| `unlockHash` | SHA-256 hash | APK verifies unlock PIN against this hash |

---

## Provisioning API

### `GET /api/touchpoint/config?installationId={id}`

**Response (not configured):**
```json
{
    "configured": false,
    "installationId": "1779143014798-hg11mene1gw"
}
```

**Response (configured):**
```json
{
    "configured": true,
    "mode": "terminal",
    "merchantWallet": "0x...",
    "brandKey": "xoinpay",
    "locked": true,
    "configuredAt": "2026-05-18T...",
    "lockdownMode": "standard",
    "unlockCodeHash": "sha256...",
    "clearDeviceOwner": false,
    "wipeDevice": false
}
```

### `POST /api/touchpoint/provision`

Used by the admin panel to provision a device. Accepts:
```json
{
    "installationId": "1779143014798-hg11mene1gw",
    "mode": "terminal",
    "merchantWallet": "0x...",
    "brandKey": "xoinpay",
    "lockdownMode": "standard",
    "unlockCode": "1234"
}
```

---

## File Inventory

### Critical Files (Must Not Be Modified Without Understanding)

| File | Purpose | Legacy Impact |
|---|---|---|
| `src/proxy.ts` (~230-249) | UA-based route rewriting | Adding/removing routes requires updating this |
| `src/app/legacy/layout.tsx` | Loads `legacy.css`, kills CSS overlay | Removing the `<style>` tag re-enables the blocking overlay |
| `src/app/legacy/touchpoint/setup/page.tsx` | Standalone ES5 setup page | Any modern JS syntax breaks Chrome 93 |
| `scripts/flatten-legacy-css.mjs` | CSS downlevel pipeline | Changes affect all legacy device styling |
| `public/css/legacy.css` | Build output (DO NOT EDIT DIRECTLY) | Auto-generated by `build:legacy` |
| `src/app/globals.css` (~755-789) | SSR theme-ready overlay CSS | Adding overlay rules requires rebuild of `legacy.css` |
| `src/app/layout.tsx` (~801) | `beforeInteractive` script | Must include `/legacy` in device route check |
| `src/components/providers/theme-ready-gate.tsx` (~491) | React overlay bypass | Must include `/legacy` in `isDeviceRoute` |
| `src/components/DeviceStyleInjector.tsx` | Runtime DOM fixes for legacy WebView | Client component, uses `useEffect` |
| `src/app/api/touchpoint/config/route.ts` | Provisioning config API | Changes to response shape must be mirrored in `TOUCHPOINT_CONFIG` |
| `src/app/api/touchpoint/provision/route.ts` | Provisioning endpoint | Changes to lockdown fields must be mirrored in setup page |

### Re-export Pages (Shared with Modern)

These files re-export the `(web)` page component and share the same server + client logic:

```
src/app/legacy/terminal/page.tsx          → (web)/terminal/page
src/app/legacy/terminal/[id]/page.tsx     → (web)/terminal/[id]/page
src/app/legacy/handheld/[id]/page.tsx     → (web)/handheld/[id]/page
src/app/legacy/kiosk/[id]/page.tsx        → (web)/kiosk/[id]/page
src/app/legacy/kitchen/page.tsx           → (web)/kitchen/page
src/app/legacy/kitchen/[wallet]/page.tsx  → (web)/kitchen/[wallet]/page
```

---

## Critical Rules

### 🔴 Rule 1: Never Use Modern JS in the Legacy Setup Page

The file `src/app/legacy/touchpoint/setup/page.tsx` contains an inline `<script>` with ES5 JavaScript. If you use `let`, `const`, arrow functions, template literals, optional chaining, nullish coalescing, `async/await`, `fetch()`, or any ES6+ syntax inside that script block, **Chrome 93 will fail to parse the entire script and NO JavaScript will execute**.

### 🔴 Rule 2: Always Rebuild legacy.css After globals.css Changes

Any change to `src/app/globals.css` requires running `npm run build:legacy` before deployment. If you forget, legacy devices will use stale CSS that may not match the current layout.

### 🔴 Rule 3: Keep the Overlay Kill in legacy/layout.tsx

The inline `<style>` in `src/app/legacy/layout.tsx` that sets `body::before, body::after { display: none !important; content: none !important; }` is a critical safety net. Do NOT remove it.

### 🔴 Rule 4: Keep `/legacy` in All Bypass Checks

Three locations must include `/legacy` in their path checks:

1. `src/app/layout.tsx` — `beforeInteractive` `pp-prelock` script
2. `src/components/providers/theme-ready-gate.tsx` — `isDeviceRoute` variable
3. `src/proxy.ts` — `isTerminalRoute` check (to prevent double-rewrite)

### 🔴 Rule 5: Mirror TOUCHPOINT_CONFIG Changes

If you add, remove, or rename fields in the API response from `/api/touchpoint/config`, you MUST update `window.TOUCHPOINT_CONFIG` in BOTH:

1. `src/app/(web)/touchpoint/setup/page.tsx` (lines ~142-154)
2. `src/app/legacy/touchpoint/setup/page.tsx` (in `handleConfig()`)

### 🟡 Rule 6: Adding New Terminal Modes

If you add a new terminal mode (e.g., `"drive-thru"`):

1. Add route: `src/app/(web)/drive-thru/[id]/page.tsx`
2. Add legacy re-export: `src/app/legacy/drive-thru/[id]/page.tsx`
3. Update proxy: Add `/drive-thru` to `isTerminalRoute` in `src/proxy.ts`
4. Update `beforeInteractive` script: Add `path.indexOf("/drive-thru") === 0` to device route check
5. Update `ThemeReadyGate`: Add `pathname.startsWith("/drive-thru")` to `isDeviceRoute`
6. Update redirect logic: Add `else if (cfg.mode === "drive-thru")` in both setup pages
7. Rebuild: `npm run build:legacy`

### 🟡 Rule 7: Adding New Lockdown Fields

If the APK requires new configuration fields:

1. Add to API response in `src/app/api/touchpoint/config/route.ts`
2. Add to `TOUCHPOINT_CONFIG` in `src/app/(web)/touchpoint/setup/page.tsx`
3. Add to `TOUCHPOINT_CONFIG` in `src/app/legacy/touchpoint/setup/page.tsx`
4. Add to redirect query params if the APK needs them across navigation
5. Document the new field in the JS Bridge Contracts section above

---

## Common Pitfalls

### Pitfall 1: "It Works on My Browser"

Modern browsers will render the `/legacy/*` routes perfectly. The issues only appear on Chrome 93. Always test with:
- The actual VP550 device, or
- Chrome DevTools device emulation with UA override

### Pitfall 2: Next.js Bundle Syntax

Even if YOUR code is ES5, Next.js may wrap it in a module that uses modern syntax. The `dangerouslySetInnerHTML` inline `<script>` approach bypasses the bundler. If you convert the legacy setup page to a `"use client"` component, Chrome 93 will break.

### Pitfall 3: CSS Specificity

`legacy.css` and `globals.css` both load on legacy routes. If they conflict, the last-loaded wins. The `legacy/layout.tsx` loads `legacy.css` AFTER globals, so its rules take precedence for same-specificity selectors.

### Pitfall 4: Proxy Rewrite is Invisible

`NextResponse.rewrite()` does NOT change the browser URL. `window.location.pathname` still shows `/touchpoint/setup`, not `/legacy/touchpoint/setup`. Do NOT use pathname checks for legacy detection on the client side — use User-Agent detection instead.

### Pitfall 5: localStorage Clearing

If a device's localStorage is cleared (cache wipe, factory reset, app reinstall), it generates a NEW installation ID. The admin must re-provision the device with the new ID.

---

## Testing Checklist

Before deploying changes that touch legacy device code:

- [ ] `npm run build:legacy` succeeds with zero compatibility warnings
- [ ] `public/css/legacy.css` does NOT contain `theme-ready` overlay rules
- [ ] Legacy setup page renders at `/legacy/touchpoint/setup?scale=0.75`
- [ ] "Check Configuration" button triggers API call (check Network tab)
- [ ] `window.TOUCHPOINT_CONFIG` is set after config fetch (check Console)
- [ ] `window.TOUCHPOINT_INSTALL_ID` is set (check Console)
- [ ] No gray overlay blocking interaction
- [ ] After provisioning, redirect goes to correct `/legacy/{mode}/{wallet}` URL
- [ ] Redirect includes `lockdownMode` and `unlockHash` query params when applicable
- [ ] Terminal PIN pad is functional after redirect
- [ ] Modern browser at `/touchpoint/setup` still works (no regression)

---

*Last updated: 2026-05-18 • Created during VP550 legacy routing stabilization*
