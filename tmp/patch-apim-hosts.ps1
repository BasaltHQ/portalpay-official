$ErrorActionPreference = 'Stop'
$rg = 'rg-portalpay-prod'
$apim = 'apim-portalpay-prod'
$kv = 'kv-portalpay-prod'
$certName = 'api-pay-ledger1-2025-11-06'

Write-Host "Patching APIM hostnameConfigurations via az rest..." -ForegroundColor Cyan

# Resolve subscription and secretId
$subId = az account show --query id -o tsv
if (-not $subId) { throw "Failed to resolve subscription id" }
$secretId = az keyvault certificate show --vault-name $kv --name $certName --query sid -o tsv
if (-not $secretId) { throw "Failed to resolve Key Vault certificate secretId" }
Write-Host ("secretId: " + $secretId)

# Fetch current hostnames
$hostsJson = az apim show -g $rg -n $apim --query properties.hostnameConfigurations -o json
$hosts = @()
if ($hostsJson -and $hostsJson -ne 'null') { $hosts = $hostsJson | ConvertFrom-Json }
if ($null -eq $hosts) { $hosts = @() }

# Upsert the Proxy entry
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

# Build minimal payload
$payload = [ordered]@{
  properties = [ordered]@{
    hostnameConfigurations = $hosts
  }
}

# Write payload and patch using az resource update (avoids az rest header quirks)
$tmp = [System.IO.Path]::GetTempFileName()
$payload | ConvertTo-Json -Depth 30 | Set-Content -Path $tmp -Encoding UTF8
$apimId = az apim show -g $rg -n $apim --query id -o tsv
az resource update --ids $apimId --api-version 2021-08-01 --set properties.hostnameConfigurations=@$tmp -o none
Remove-Item $tmp -Force

Write-Host "Done. Verify in Azure Portal under APIM Custom domains." -ForegroundColor Green
