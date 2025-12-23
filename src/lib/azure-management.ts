type AzureConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
  resourceGroup: string;
  apimName: string;
};

function getEnv(name: string): string {
  const v = process.env[name] || "";
  if (!v || !v.trim()) throw new Error(`Missing required env: ${name}`);
  return v.trim();
}

export function getAzureConfig(): AzureConfig {
  return {
    tenantId: getEnv("AZURE_TENANT_ID"),
    clientId: getEnv("AZURE_CLIENT_ID"),
    clientSecret: getEnv("AZURE_CLIENT_SECRET"),
    subscriptionId: getEnv("AZURE_SUBSCRIPTION_ID"),
    resourceGroup: getEnv("AZURE_RESOURCE_GROUP"),
    apimName: getEnv("AZURE_APIM_NAME"),
  };
}

export async function getManagementToken(): Promise<string> {
  const { tenantId, clientId, clientSecret } = getAzureConfig();
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://management.azure.com/.default",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AAD token request failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = (await res.json()) as { access_token?: string };
  const token = String(json.access_token || "");
  if (!token) throw new Error("AAD token response missing access_token");
  return token;
}

function managementBaseUrl(cfg: AzureConfig): string {
  return `https://management.azure.com/subscriptions/${cfg.subscriptionId}/resourceGroups/${cfg.resourceGroup}/providers/Microsoft.ApiManagement/service/${cfg.apimName}`;
}

function withApiVersion(url: string, apiVersion = "2022-08-01"): string {
  const hasQuery = url.includes("?");
  const hasApiVersion = url.includes("api-version=");
  if (hasApiVersion) return url;
  return url + (hasQuery ? "&" : "?") + `api-version=${apiVersion}`;
}

async function mgmtRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH",
  path: string,
  body?: any
): Promise<T> {
  const cfg = getAzureConfig();
  const token = await getManagementToken();
  const base = managementBaseUrl(cfg);
  const url = withApiVersion(`${base}${path}`);

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: typeof body !== "undefined" ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Azure Mgmt ${method} ${path} failed: ${res.status} ${res.statusText} ${text}`);
  }

  // Some operations (e.g., regenerate) may return 204 No Content
  const contentType = res.headers.get("content-type") || "";
  if (res.status === 204 || !contentType.includes("application/json")) {
    return undefined as unknown as T;
  }

  const json = (await res.json()) as T;
  return json;
}

/**
 * Products
 */
export async function listProducts(): Promise<any> {
  return mgmtRequest<any>("GET", `/products`);
}

/**
 * Subscriptions
 */
export async function listSubscriptions(): Promise<any> {
  return mgmtRequest<any>("GET", `/subscriptions`);
}

export async function getSubscription(subscriptionId: string): Promise<any> {
  return mgmtRequest<any>("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function createSubscription(
  subscriptionId: string,
  productId: string,
  displayName: string,
  ownerUserId?: string
): Promise<any> {
  const cfg = getAzureConfig();
  const scope = `${managementBaseUrl(cfg)}/products/${productId}`;
  const body: any = {
    properties: {
      displayName,
      state: "active",
      scope,
    },
  };
  if (ownerUserId) {
    body.properties.ownerId = `${managementBaseUrl(cfg)}/users/${ownerUserId}`;
  }
  return mgmtRequest<any>("PUT", `/subscriptions/${encodeURIComponent(subscriptionId)}`, body);
}

export async function regenerateSubscriptionKey(
  subscriptionId: string,
  keyType: "primary" | "secondary"
): Promise<void> {
  const body = {
    keyType,
  };
  await mgmtRequest<void>("POST", `/subscriptions/${encodeURIComponent(subscriptionId)}/regenerate`, body);
}

export async function listSubscriptionSecrets(subscriptionId: string): Promise<{ primaryKey?: string; secondaryKey?: string }> {
  // APIM "list secrets" is a POST
  const res = await mgmtRequest<any>("POST", `/subscriptions/${encodeURIComponent(subscriptionId)}/listSecrets`);
  const keys = {
    primaryKey: res?.primaryKey,
    secondaryKey: res?.secondaryKey,
  };
  return keys;
}
