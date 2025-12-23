$ErrorActionPreference = 'Stop'
$rg = 'rg-portalpay-prod'
$apim = 'apim-portalpay-prod'
$kv = 'kv-portalpay-prod'
$certName = 'api-pay-ledger1-2025-11-06'

Write-Host "Binding custom domain to APIM Proxy using Key Vault certificate..." -ForegroundColor Cyan

# Resolve subscription and secretId
$subId = az account show --query id -o tsv
if (-not $subId) { throw "Failed to resolve subscription id" }
$secretId = az keyvault certificate show --vault-name $kv --name $certName --query sid -o tsv
if (-not $secretId) { throw "Failed to resolve Key Vault certificate secretId" }
Write-Host ("secretId: " + $secretId)

# Ensure APIM system-assigned identity is enabled (handled separately if needed)
# az apim update -g $rg -n $apim --set identity.type=SystemAssigned -o none

# Grant APIM MI access to Key Vault secrets
$apimPrincipalId = az apim show -g $rg -n $apim --query identity.principalId -o tsv
if (-not $apimPrincipalId) { throw "Failed to resolve APIM principalId" }
$kvScope = az keyvault show -n $kv --query id -o tsv
az role assignment create --role 'Key Vault Secrets User' --assignee-object-id $apimPrincipalId --assignee-principal-type ServicePrincipal --scope $kvScope -o none

# Fetch APIM configuration
$apimUri = "https://management.azure.com/subscriptions/$subId/resourceGroups/$rg/providers/Microsoft.ApiManagement/service/$apim?api-version=2021-08-01"
$cfg = az rest --method get --uri $apimUri -o json | ConvertFrom-Json
$hosts = @()
if ($cfg.properties.hostnameConfigurations) { $hosts = @($cfg.properties.hostnameConfigurations) }

# Update or add Proxy hostname configuration
$existing = $hosts | Where-Object { $_.type -eq 'Proxy' -and $_.hostName -eq 'api.pay.ledger1.ai' }
if ($null -eq $existing -or $existing.Count -eq 0) {
  $new = [ordered]@{
    type = 'Proxy'
    hostName = 'api.pay.ledger1.ai'
    negotiateClientCertificate = $false
    certificateSource = 'KeyVault'
    keyVaultId = $secretId
    defaultSslBinding = $true
    identityClientId = $null
  }
  $hosts = $hosts + @($new)
} else {
  foreach ($h in $existing) {
    $h.negotiateClientCertificate = $false
    $h.certificateSource = 'KeyVault'
    $h.keyVaultId = $secretId
    $h.defaultSslBinding = $true
    $h.identityClientId = $null
  }
}

# Build and send patch payload
$payload = [ordered]@{ properties = [ordered]@{ hostnameConfigurations = $hosts } }
$tmp = [System.IO.Path]::GetTempFileName()
$payload | ConvertTo-Json -Depth 50 | Set-Content -Path $tmp -Encoding UTF8
$etag = az rest --method get --uri $apimUri --query etag -o tsv
az rest --method patch --uri $apimUri --body "@$tmp" --headers "Content-Type=application/json" --headers ("If-Match=$etag") -o none
Remove-Item $tmp -Force

Write-Host "APIM custom domain binding request submitted. Monitor provisioning in Azure Portal -> APIM -> Custom domains." -ForegroundColor Green
