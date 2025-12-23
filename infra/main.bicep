@description('Existing Azure Container Apps managed environment resource ID (Microsoft.App/managedEnvironments)')
param managedEnvironmentId string

@description('Name of the Container App to create/update')
param name string

@description('Azure location for the Container App resource')
param location string

@description('OCI image for the application (e.g., myregistry.azurecr.io/portalpay:latest)')
param image string

@description('Brand key to scope runtime (BRAND_KEY)')
param brandKey string

@description('Public app URL used by the brand (NEXT_PUBLIC_APP_URL)')
param appUrl string

@description('Brand display name (PP_BRAND_NAME)')
param brandName string

@description('Brand logo URL path or absolute URL (PP_BRAND_LOGO)')
param brandLogo string

@description('Brand favicon URL path or absolute URL (PP_BRAND_FAVICON)')
param brandFavicon string

@minLength(1)
var cpu = '0.5'
@minLength(1)
var memory = '1Gi'
var targetPort = 3000

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  properties: {
    managedEnvironmentId: managedEnvironmentId
    configuration: {
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [] // Expect image to be pullable with existing identity; configure if needed
      activeRevisionsMode: 'Single'
      secrets: [] // No secrets in this baseline; extend as needed
      // Non-secret environment variables
      env: [
        {
          name: 'BRAND_KEY'
          value: brandKey
        }
        {
          name: 'NEXT_PUBLIC_APP_URL'
          value: appUrl
        }
        {
          name: 'PP_BRAND_NAME'
          value: brandName
        }
        {
          name: 'PP_BRAND_LOGO'
          value: brandLogo
        }
        {
          name: 'PP_BRAND_FAVICON'
          value: brandFavicon
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: image
          resources: {
            cpu: float(cpu)
            memory: memory
          }
          env: [
            {
              name: 'BRAND_KEY'
              value: brandKey
            }
            {
              name: 'NEXT_PUBLIC_APP_URL'
              value: appUrl
            }
            {
              name: 'PP_BRAND_NAME'
              value: brandName
            }
            {
              name: 'PP_BRAND_LOGO'
              value: brandLogo
            }
            {
              name: 'PP_BRAND_FAVICON'
              value: brandFavicon
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

@description('Container App FQDN (when available)')
output fqdn string = containerApp.properties.configuration.ingress.fqdn
