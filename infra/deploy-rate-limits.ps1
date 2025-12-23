# Deploy APIM Rate Limits
# This script updates the rate limit policies for Starter, Pro, and Enterprise products.

$params = @{
    ResourceGroup = "rg-portalpay-prod"
    ServiceName   = "apim-portalpay-prod"
}

$policyFiles = @{
    "portalpay-starter"    = "infra/policies/product-portalpay-starter-policy-body.json"
    "portalpay-pro"        = "infra/policies/product-portalpay-pro-policy-body.json"
    "portalpay-enterprise" = "infra/policies/product-portalpay-enterprise-policy-body.json"
}

foreach ($product in $policyFiles.Keys) {
    $jsonPath = $policyFiles[$product]
    Write-Host "Processing $product from $jsonPath..."

    if (Test-Path $jsonPath) {
        $json = Get-Content $jsonPath | ConvertFrom-Json
        $xmlContent = $json.properties.value
        
        $subId = "0a8c8695-c09e-45cc-8a64-697faedee923"
        $uri = "/subscriptions/$subId/resourceGroups/$($params.ResourceGroup)/providers/Microsoft.ApiManagement/service/$($params.ServiceName)/products/$product/policies/policy?api-version=2021-08-01"
        
        # Prepare JSON body for REST call
        $body = @{
            properties = @{
                format = "rawxml"
                value  = $xmlContent
            }
        } | ConvertTo-Json -Depth 10 -Compress

        # Write body to temp file to avoid escaping issues
        $bodyFile = "tmp/${product}-body.json"
        Set-Content -Path $bodyFile -Value $body

        Write-Host "Deploying policy for $product via REST..."
        az rest --method put --uri $uri --body "@$bodyFile" --headers "Content-Type=application/json"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Success!" -ForegroundColor Green
        } else {
            Write-Error "Failed to deploy policy for $product. Exit code: $LASTEXITCODE"
        }
    }
    else {
        Write-Warning "File not found: $jsonPath"
    }
}
