# TODO: Play Store Submission & Package Name Migration

> **Created**: 2026-05-18
> **Follow-up by**: 2026-05-21 (3 days)
> **Status**: ON HOLD

## Decision Made

- **New package name**: `com.basalthq.surge` (for Play Store)
- **Old package name**: `com.example.basaltsurgemobile` (keep for existing field devices)

## Agreed Approach: Product Flavors

Use Gradle product flavors to build two APKs from one codebase:

| Flavor | applicationId | Distribution | Format |
|---|---|---|---|
| `legacy` | `com.example.basaltsurgemobile` | OVHCloud S3 → Valor OTA | APK (`assembleRelease`) |
| `production` | `com.basalthq.surge` | Google Play Store | AAB (`bundleRelease`) |

## Work Items

- [ ] Add product flavors to `android/app/build.gradle.kts`
- [ ] Update GitHub Actions workflow to support flavor selection
- [ ] Set up Play App Signing (upload key → Google)
- [ ] Create Google Play Console listing
- [ ] First AAB submission + review
- [ ] Verify existing OTA pipeline still works with legacy flavor

## Context

- Devices in the wild cannot be physically accessed
- Changing applicationId = new app to Android (breaks OTA updates)
- Both flavors share 100% of the same code
- Play Store requires AAB format, not APK
- Play Store requires Play App Signing (Google re-signs)
