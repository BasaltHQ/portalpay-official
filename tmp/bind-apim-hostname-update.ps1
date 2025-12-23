$ErrorActionPreference = 'Stop'
$rg = 'rg-portalpay-prod'
$apim = 'apim-portalpay-prod'
$kv = 'kv-portalpay-prod'
$certName = 'api-pay-ledger1-2025-11-06'

Write-Host "Updating APIM Proxy hostnameConfigurations to bind api.pay.ledger1.ai from Key Vault..." -ForegroundColor Cyan

# Resolve Key Vault certificate secretId
$secretId = az keyvault certificate show --vault-name $kv --name $certName --query sid -o tsv
if (-not $secretId) { throw "Failed to resolve Key Vault certificate secretId" }
Write-Host ("secretId: " + $secretId)

# Fetch current hostnameConfigurations via CLI (avoid az rest quoting issues)
$hostsJson = az apim show -g $rg -n $apim --query properties.hostnameConfigurations -o json
$hosts = @()
if ($hostsJson -and $hostsJson -ne 'null') { $hosts = $hostsJson | ConvertFrom-Json }

# Ensure array
if ($null -eq $hosts) { $hosts = @() }

# Update or add the Proxy entry for api.pay.ledger1.ai
$found = $false
foreach ($h in $hosts) {
  if ($h.type -eq 'Proxy' -and $h.hostName -eq 'api.pay.ledger1.ai') {
    $h.negotiateClientCertificate = $false
    $h.certificateSource = 'KeyVault'
    $h.keyVaultId = $secretId
    $h.defaultSslBinding = $true
    $h.identityClientId = $null
    $found = $true
  }
}
if (-not $found) {
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
}

# Write updated array to temp file and PATCH via az apim update
$tmp = [System.IO.Path]::GetTempFileName()
$hosts | ConvertTo-Json -Depth 20 | Set-Content -Path $tmp -Encoding UTF8
az apim update -g $rg -n $apim --set properties.hostnameConfigurations=@$tmp -o none
Remove-Item $tmp -Force

Write-Host "APIM hostnameConfigurations updated. Check Azure Portal -> APIM -> Custom domains for provisioning status." -ForegroundColor Green
