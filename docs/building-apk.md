# APK Build, Sign, Publish, and Install Guide

Objective
- Automatically build and sign brand-specific Android APKs during container deployment (CI/CD).
- Publish signed APKs to Azure Blob Storage, following a strict naming convention.
- Enforce visibility so that:
  - Partner containers only see the APK for their BRAND_KEY.
  - Platform containers can see all APKs.
- Restrict APK download/install endpoints and UI to Admin/Superadmin roles.

This guide documents environment variables, pipeline steps (apktool → zipalign → apksigner → az storage upload), storage layout, access controls, and admin install flows.

---

Scope and Components
- Next.js App Router API:
  - GET /api/admin/apk/[app]
    - Serves signed APK by streaming from Azure Blob. Requires Admin/Superadmin.
    - Partner container gating via CONTAINER_TYPE and BRAND_KEY; hides other brands.
  - GET /api/site/container
    - Returns { containerType, brandKey } for runtime UI gating.

- Admin UI:
  - /admin/devices page with Device Installer Panel (WebUSB/WebADB).
  - Only Admin/Superadmin can see the Devices tab and page.

- Artifact Storage:
  - Azure Blob Storage container (e.g., apks).
  - Blob path/prefix (e.g., brands/).
  - Signed APK naming convention: brands/{BRAND_KEY}-signed.apk
    - Examples:
      - brands/portalpay-signed.apk
      - brands/paynex-signed.apk

Note: If you maintain multiple “app flavors” (e.g., [app]=portalpay or [app]=paynex), you may choose to incorporate {app} into the blob file name. The default convention above keeps blob names scoped by BRAND_KEY and assumes one signed APK per brand.

---

Environment Variables

Required for Runtime Gating
- CONTAINER_TYPE or NEXT_PUBLIC_CONTAINER_TYPE
  - Values: partner or platform
  - partner: only sees APK for its BRAND_KEY
  - platform: can see all APKs
- BRAND_KEY or NEXT_PUBLIC_BRAND_KEY
  - The brand for this container (e.g., portalpay, paynex)

Required for Blob Access (server)
- AZURE_STORAGE_CONNECTION_STRING
  - Storage account connection string with write (CI) and read (runtime) permissions
- PP_APK_CONTAINER (default: apks)
- PP_APK_BLOB_PREFIX (default: brands)

Required for Signing (CI)
- ANDROID_KEYSTORE_B64 (recommended) or ANDROID_KEYSTORE_PATH
  - Base64-encoded JKS/PKCS12 keystore for CI pipelines
- ANDROID_KEY_ALIAS
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_PASSWORD (if distinct from keystore password)

Recommended
- ANDROID_BUILD_TOOLS_VERSION (e.g., 34.0.0)
- BRAND_KEY (the brand being built in the current CI run)
- APP (optional flavor name if needed; e.g., portalpay)

---

CI/CD Overview

High-level steps:
1) Prepare build environment
   - Java/JDK
   - Android SDK Build-Tools (zipalign, apksigner)
   - apktool (decode/build)

2) Build unsigned APK using apktool
   - Use brand-specific source
   - Output: out/{brand}-unsigned.apk

3) Align APK with zipalign
   - Output: out/{brand}-aligned.apk

4) Sign with apksigner
   - Output: out/{brand}-signed.apk
   - Verify signature

5) Upload to Azure Blob
   - Container: PP_APK_CONTAINER (apks)
   - Blob path: PP_APK_BLOB_PREFIX/brands/{BRAND_KEY}-signed.apk
   - Overwrite enabled

6) (Optional) Post-deploy verification
   - HEAD/GET the blob
   - GET /api/admin/apk/[app] as Admin to verify stream

---

Example: GitHub Actions (Ubuntu)

This example illustrates a single-brand build in a matrix or per-brand job. Adjust versions, paths, and actions to your repo.

```yaml
name: Build and Publish APK

on:
  workflow_dispatch:
  push:
    branches: [ main ]
    paths:
      - "android/launcher/**"
      - ".github/workflows/apk.yml"

jobs:
  build-apk:
    runs-on: ubuntu-latest
    env:
      BRAND_KEY: portalpay
      ANDROID_BUILD_TOOLS_VERSION: "34.0.0"
      PP_APK_CONTAINER: apks
      PP_APK_BLOB_PREFIX: brands

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - name: Install Android SDK build-tools
        run: |
          sudo apt-get update
          sudo apt-get install -y wget unzip
          ANDROID_HOME="$HOME/android-sdk"
          mkdir -p "$ANDROID_HOME"
          echo "ANDROID_HOME=$ANDROID_HOME" >> $GITHUB_ENV
          echo "PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/build-tools/${ANDROID_BUILD_TOOLS_VERSION}:$PATH" >> $GITHUB_ENV

          # Install commandline-tools
          wget -q https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip -O cmdline-tools.zip
          mkdir -p "$ANDROID_HOME/cmdline-tools"
          unzip -q cmdline-tools.zip -d "$ANDROID_HOME"
          mv "$ANDROID_HOME/cmdline-tools" "$ANDROID_HOME/cmdline-tools-tmp"
          mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
          mv "$ANDROID_HOME/cmdline-tools-tmp"/* "$ANDROID_HOME/cmdline-tools/latest/"

          # Install build-tools
          yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$ANDROID_HOME" "build-tools;${ANDROID_BUILD_TOOLS_VERSION}" "platforms;android-34"

      - name: Install apktool
        run: |
          mkdir -p tools
          wget -q https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool_2.9.3.jar -O tools/apktool.jar
          echo "java -jar $PWD/tools/apktool.jar \"\$@\"" > tools/apktool
          chmod +x tools/apktool
          echo "PATH=$PWD/tools:$PATH" >> $GITHUB_ENV

      - name: Prepare output
        run: mkdir -p out

      - name: Build unsigned APK (brand = ${{ env.BRAND_KEY }})
        run: |
          # Select the brand-specific source; adjust path to your repository structure
          SRC_DIR="android/launcher/recovered/src-${BRAND_KEY}"
          if [ ! -d "$SRC_DIR" ]; then
            echo "Brand source not found: $SRC_DIR" >&2
            exit 1
          fi
          apktool b "$SRC_DIR" -o "out/${BRAND_KEY}-unsigned.apk"

      - name: Zipalign
        run: |
          zipalign -p -f 4 "out/${BRAND_KEY}-unsigned.apk" "out/${BRAND_KEY}-aligned.apk"

      - name: Restore keystore from secret
        run: |
          echo "$ANDROID_KEYSTORE_B64" | base64 -d > keystore.jks
        env:
          ANDROID_KEYSTORE_B64: ${{ secrets.ANDROID_KEYSTORE_B64 }}

      - name: Sign APK
        run: |
          apksigner sign \
            --ks keystore.jks \
            --ks-key-alias "$ANDROID_KEY_ALIAS" \
            --ks-pass pass:"$ANDROID_KEYSTORE_PASSWORD" \
            --key-pass pass:"$ANDROID_KEY_PASSWORD" \
            --out "out/${BRAND_KEY}-signed.apk" \
            "out/${BRAND_KEY}-aligned.apk"
        env:
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Verify Signature
        run: apksigner verify --verbose --print-certs "out/${BRAND_KEY}-signed.apk"

      - name: Azure CLI Login
        uses: azure/login@v2
        with:
          # Use federated credentials or skip this if using connection string upload
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Upload to Azure Blob (via connection string)
        run: |
          az storage blob upload \
            --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \
            -c "$PP_APK_CONTAINER" \
            -f "out/${BRAND_KEY}-signed.apk" \
            -n "${PP_APK_BLOB_PREFIX}/${BRAND_KEY}-signed.apk" \
            --overwrite
        env:
          AZURE_STORAGE_CONNECTION_STRING: ${{ secrets.AZURE_STORAGE_CONNECTION_STRING }}
```

Notes:
- Use matrix strategy for multiple brands: set BRAND_KEY=portalpay and BRAND_KEY=paynex in a matrix, run the above job per brand.
- To build “flavors” by app name, set APP in env and vary source/paths per flavor, then store e.g. brands/${BRAND_KEY}/${APP}-signed.apk.
- If not using azure/login OIDC, the connection string upload is sufficient.

---

Example: Azure DevOps (Linux)

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

variables:
  BRAND_KEY: 'portalpay'
  ANDROID_BUILD_TOOLS_VERSION: '34.0.0'
  PP_APK_CONTAINER: 'apks'
  PP_APK_BLOB_PREFIX: 'brands'

steps:
- checkout: self

- task: Bash@3
  displayName: Set up Java and tools
  inputs:
    targetType: inline
    script: |
      sudo apt-get update
      sudo apt-get install -y wget unzip

      ANDROID_HOME="$HOME/android-sdk"
      mkdir -p "$ANDROID_HOME"
      echo "##vso[task.setvariable variable=ANDROID_HOME]$ANDROID_HOME"
      echo "##vso[task.setvariable variable=PATH]$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/build-tools/${ANDROID_BUILD_TOOLS_VERSION}:$PATH"

      wget -q https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip -O cmdline-tools.zip
      mkdir -p "$ANDROID_HOME/cmdline-tools"
      unzip -q cmdline-tools.zip -d "$ANDROID_HOME"
      mv "$ANDROID_HOME/cmdline-tools" "$ANDROID_HOME/cmdline-tools-tmp"
      mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
      mv "$ANDROID_HOME/cmdline-tools-tmp"/* "$ANDROID_HOME/cmdline-tools/latest/"

      yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$ANDROID_HOME" "build-tools;${ANDROID_BUILD_TOOLS_VERSION}" "platforms;android-34"

      mkdir -p tools out
      wget -q https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool_2.9.3.jar -O tools/apktool.jar
      echo "java -jar $(pwd)/tools/apktool.jar \"\$@\"" > tools/apktool
      chmod +x tools/apktool

- task: Bash@3
  displayName: Build unsigned APK
  inputs:
    targetType: inline
    script: |
      SRC_DIR="android/launcher/recovered/src-$(echo ${BRAND_KEY})"
      if [ ! -d "$SRC_DIR" ]; then
        echo "Brand source not found: $SRC_DIR" >&2
        exit 1
      fi
      ./tools/apktool b "$SRC_DIR" -o "out/${BRAND_KEY}-unsigned.apk"

- task: Bash@3
  displayName: Zipalign
  inputs:
    targetType: inline
    script: |
      zipalign -p -f 4 "out/${BRAND_KEY}-unsigned.apk" "out/${BRAND_KEY}-aligned.apk"

- task: Bash@3
  displayName: Restore keystore and sign
  inputs:
    targetType: inline
    script: |
      echo "$ANDROID_KEYSTORE_B64" | base64 -d > keystore.jks
      apksigner sign \
        --ks keystore.jks \
        --ks-key-alias "$ANDROID_KEY_ALIAS" \
        --ks-pass pass:"$ANDROID_KEYSTORE_PASSWORD" \
        --key-pass pass:"$ANDROID_KEY_PASSWORD" \
        --out "out/${BRAND_KEY}-signed.apk" \
        "out/${BRAND_KEY}-aligned.apk"
      apksigner verify --verbose --print-certs "out/${BRAND_KEY}-signed.apk"
  env:
    ANDROID_KEYSTORE_B64: $(ANDROID_KEYSTORE_B64)
    ANDROID_KEY_ALIAS: $(ANDROID_KEY_ALIAS)
    ANDROID_KEYSTORE_PASSWORD: $(ANDROID_KEYSTORE_PASSWORD)
    ANDROID_KEY_PASSWORD: $(ANDROID_KEY_PASSWORD)

- task: AzureCLI@2
  displayName: Upload to Azure Blob
  inputs:
    azureSubscription: 'Your-Service-Connection' # if using SPN; or use connection string below without service connection
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: |
      az storage blob upload \
        --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \
        -c "$PP_APK_CONTAINER" \
        -f "out/${BRAND_KEY}-signed.apk" \
        -n "${PP_APK_BLOB_PREFIX}/${BRAND_KEY}-signed.apk" \
        --overwrite
  env:
    AZURE_STORAGE_CONNECTION_STRING: $(AZURE_STORAGE_CONNECTION_STRING)
```

---

Blob Storage Layout

Default container: apks  
Default prefix: brands

- apks/brands/portalpay-signed.apk
- apks/brands/paynex-signed.apk

If you opt into per-app flavoring:
- apks/brands/portalpay/portalpay-signed.apk
- apks/brands/paynex/paynex-signed.apk

Update PP_APK_BLOB_PREFIX accordingly, and ensure /api/admin/apk/[app] logic is consistent with your naming.

---

Access and Authorization

API download endpoint:
- GET /api/admin/apk/[app]
  - Content-Type: application/vnd.android.package-archive
  - Authorization:
    - requireThirdwebAuth
    - Role check: Admin or Superadmin only
  - Visibility gating:
    - CONTAINER_TYPE=partner: only BRAND_KEY APK visible; others return 404 apk_not_visible
    - CONTAINER_TYPE=platform: all brand APKs visible

Admin UI
- Admin Sidebar shows “Devices” tab only for Admin/Superadmin.
- /admin/devices renders Device Installer Panel:
  - Fetches runtime identity from /api/site/container to determine partner vs platform view.
  - Uses WebUSB/WebADB to push/install APK on a connected Android device.

Device Prep
- Enable “Developer options” and “USB debugging” on the Android device.
- Connect via USB; accept host fingerprint on device.

---

Keystore and Secrets Management

- Use a dedicated signing keystore per environment if required by your security posture.
- Store keystore as base64 in CI secret: ANDROID_KEYSTORE_B64
  - Decode at runtime: echo "$ANDROID_KEYSTORE_B64" | base64 -d > keystore.jks
- Store key alias and passwords in CI secrets:
  - ANDROID_KEY_ALIAS
  - ANDROID_KEYSTORE_PASSWORD
  - ANDROID_KEY_PASSWORD
- Store storage connection in secret: AZURE_STORAGE_CONNECTION_STRING
- Optionally use Azure Key Vault for secret distribution to CI and to the runtime (read-only for runtime).

---

Troubleshooting

- zipalign: command not found
  - Ensure Android Build-Tools are installed and PATH includes $ANDROID_HOME/build-tools/<version>.

- apksigner: command not found
  - Provided by Build-Tools; confirm the version installed matches ANDROID_BUILD_TOOLS_VERSION and PATH is set.

- Blob not found (404) from API
  - Confirm the upload path matches PP_APK_BLOB_PREFIX and container name PP_APK_CONTAINER.
  - Check capitalization and brand key value.

- apk_not_visible (404) from API in partner container
  - Ensure BRAND_KEY and CONTAINER_TYPE=partner are correctly set for the container requesting the APK.
  - Partner containers cannot access other brand APKs by design.

- 403 forbidden from API
  - Admin/Superadmin roles are required. Check JWT session and role claims.

- WebUSB not listing device
  - Check OS-specific ADB driver, enable USB debugging, accept debug prompt on device.
  - Some browsers restrict WebUSB; use Chrome-based browser and try again.

---

Conventions and Defaults

- Container type: platform (default) or partner
- BRAND_KEY required for partner containers
- PP_APK_CONTAINER: apks
- PP_APK_BLOB_PREFIX: brands
- Signed APK filename: {BRAND_KEY}-signed.apk

---

Reference Files

- API Stream: src/app/api/admin/apk/[app]/route.ts
- Runtime Identity: src/app/api/site/container/route.ts
- Admin UI Device Installer:
  - src/app/admin/devices/page.tsx
  - src/components/admin/admin-sidebar.tsx
  - src/app/admin/panels/DeviceInstallerPanel.tsx

---

Operational Notes

- The download endpoint streams bytes directly (no public Blob URL exposure).
- CI should run on container image publish or on brand config changes, depending on your release process.
- Platform container can be used to validate all brand APKs post-deploy.

---

Do Not Run Dev Server

Per directive, do not run the dev server as part of this process. If a dev session was started earlier, stop it manually (Ctrl+C in the active terminal) before proceeding with deployment or installation tasks.
