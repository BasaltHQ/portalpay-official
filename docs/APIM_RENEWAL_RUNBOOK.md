# APIM Custom Domain Certificate Renewal Runbook (Let’s Encrypt DNS‑01 → Key Vault → APIM)

This runbook documents how to renew the APIM custom domain TLS certificate for:
- Host: api.pay.ledger1.ai
- Binding: APIM gateway custom domain (hostnameConfigurations)
- Certificate store: Azure Key Vault (kv-portalpay-prod), APIM loads the secret via system-assigned managed identity

Current state (as of latest cutover):
- Certificate: Let’s Encrypt DNS‑01, imported into Key Vault
- APIM MI: Enabled and granted Key Vault Secrets User (get/list)
- Expiry: 2026-02-04 (renew at least 30 days prior)

Scope of this document: Manual DNS‑01 renewal using certbot, packaging a PFX, importing to Key Vault as a secret, and updating/verifying APIM binding.

---

## 0) Prerequisites

- DNS write access for the ledger1.ai zone
- A workstation with:
  - certbot (or docker/podman to run certbot container)
  - OpenSSL (for packaging PFX)
  - Azure CLI logged into the correct subscription/tenant
- Key Vault name: `kv-portalpay-prod`
- APIM instance: `apim-portalpay-prod` (resource group `rg-portalpay-prod`)
- Ensure APIM system-assigned managed identity has at least `Key Vault Secrets User` on the vault

---

## 1) Issue/renew cert via Let’s Encrypt (DNS‑01, manual)

You can use native certbot or a container. Below shows the interactive/manual flow (single host):

```bash
# Example using native certbot (Linux/macOS)
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d api.pay.ledger1.ai \
  --agree-tos \
  -m ops@ledger1.ai \
  --no-eff-email
```

Certbot will prompt for a TXT record. Create the TXT as instructed:
- Name/Host: `_acme-challenge.api.pay.ledger1.ai`
- Value: (the TXT token from certbot)
- TTL: 60–300 seconds

Wait for propagation, then continue in certbot. On success, certbot places files under a directory similar to:
- fullchain: `/etc/letsencrypt/live/api.pay.ledger1.ai/fullchain.pem`
- privkey:   `/etc/letsencrypt/live/api.pay.ledger1.ai/privkey.pem`

Tip: If running in a container, bind mount a local directory to persist outputs.

---

## 2) Package certificate as PFX

APIM via Key Vault expects a PFX (PKCS#12). Use OpenSSL to export:

```bash
CERT_DIR=/etc/letsencrypt/live/api.pay.ledger1.ai
OUT=api-pay-ledger1-ai-$(date +%F).pfx
openssl pkcs12 -export \
  -out "$OUT" \
  -inkey "$CERT_DIR/privkey.pem" \
  -in "$CERT_DIR/fullchain.pem" \
  -passout pass:"$PFX_PASSWORD"
```

Notes:
- Choose a strong PFX password and store it in your secrets manager.
- Keep the resulting PFX secure (treat as a secret).

---

## 3) Import PFX into Azure Key Vault (as a secret)

Upload the PFX to `kv-portalpay-prod` as a secret with the appropriate content type:

```bash
VAULT=kv-portalpay-prod
NAME=api-pay-ledger1-$(date +%F)
FILE=api-pay-ledger1-ai-$(date +%F).pfx

az keyvault secret set \
  --vault-name "$VAULT" \
  --name "$NAME" \
  --file "$FILE" \
  --encoding base64 \
  --description "APIM TLS for api.pay.ledger1.ai (Let’s Encrypt DNS-01)" \
  --content-type application/x-pkcs12
```

Record the secret identifier from the command’s output, for example:
```
https://kv-portalpay-prod.vault.azure.net/secrets/api-pay-ledger1-2025-11-06/<version>
```

Best practice:
- Use a versionless secret ID in APIM binding if supported, so APIM can roll forward to the latest version automatically.
- Otherwise, update the APIM hostname binding to reference the new secret version (step 4).

---

## 4) Update APIM hostname binding to the new secret (if needed)

If APIM is already referencing a versionless secret ID, no change is necessary—APIM will fetch the newest version automatically. To force/update the binding (or if a version-specific reference is used):

Option A: Azure Portal
- APIM → Custom domains → Gateway
- Select `api.pay.ledger1.ai` binding → Change certificate → Select from Key Vault → pick the new secret (or version)
- Save → Wait for deployment complete

Option B: Azure CLI (advanced)
- Export current hostnameConfigurations (or use `tmp/hosts.json` if maintained in repo)
- Update the certificate secret ID to the newest version
- Apply via `az apim update` or ARM/Bicep deployment

Example (pseudo):
```bash
az apim update \
  --resource-group rg-portalpay-prod \
  --name apim-portalpay-prod \
  --set "hostnameConfigurations=[{type:Gateway,hostName:api.pay.ledger1.ai,certificate: {keyVaultId:'https://kv-portalpay-prod.vault.azure.net/secrets/api-pay-ledger1-2025-11-06'}}]"
```

Ensure the APIM managed identity has `get`/`list` permissions on the Key Vault.

---

## 5) Validate

- DNS: `nslookup api.pay.ledger1.ai` (should resolve)
- TLS: Check certificate chain/expiry:
  ```bash
  echo | openssl s_client -connect api.pay.ledger1.ai:443 -servername api.pay.ledger1.ai 2>/dev/null | openssl x509 -noout -issuer -subject -dates
  ```
- Health (no key):
  ```bash
  curl -i https://api.pay.ledger1.ai/portalpay/healthz
  ```
- Inventory (with APIM key):
  ```bash
  curl -i -H "Ocp-Apim-Subscription-Key: $APIM_SUBSCRIPTION_KEY" \
    https://api.pay.ledger1.ai/portalpay/api/inventory
  ```

Expected:
- Healthz returns 200 OK JSON
- Inventory returns 200 OK with data (valid key)

---

## 6) Rollback

If the new certificate exhibits issues:
- Revert APIM binding to the prior Key Vault secret version (Portal or CLI)
- Confirm MI permissions and retry
- Re-run validation checks above

---

## 7) Scheduling & Reminders

- Renew at least 30 days prior to certificate expiry (current expires 2026-02-04)
- Create an Azure Monitor alert or calendar reminder 60/30/14/7 days prior
- Consider automating issuance via ACME and Key Vault Certificate if manual steps become burdensome

---

## References

- APIM Guide: `docs/APIM_CUSTOM_DOMAIN_GUIDE.md`
- AFD Fallback Plan: `docs/AFD_FALLBACK_PLAN.md`
- Policy file: `infra/policies/portalpay-api-policy-body.json`
- Example hosts payloads: `tmp/hosts.json`, `tmp/apim-hostname-payload.json`
