/**
 * Jira Service Desk API Client — Multi-Tenant
 *
 * Handles bi-directional sync between in-app support tickets and Jira.
 * Configuration is loaded dynamically from Cosmos DB based on the ticket's brand.
 */

import { getContainer } from "@/lib/cosmos";

// ── Helpers ────────────────────────────────────────────────────────────────────

interface JiraConfig {
    baseUrl: string;
    userEmail: string;
    apiToken: string;
    serviceDeskId: string;
    webhookSecret?: string;
}

/**
 * Load Jira configuration for a specific brand.
 * Falls back to environment variables if not found/configured (for legacy support).
 */
export async function getJiraConfig(brandKey: string): Promise<JiraConfig | null> {
    if (!brandKey) return null;
    const normalizedBrandKey = brandKey.toLowerCase();

    // 1. Try fetching from Cosmos DB
    try {
        const container = await getContainer();
        const docId = `jira_plugin_config:${normalizedBrandKey}`;
        const { resource } = await container.item(docId, normalizedBrandKey).read();

        if (resource && resource.enabled) {
            return {
                baseUrl: resource.baseUrl,
                userEmail: resource.userEmail,
                apiToken: resource.apiToken,
                serviceDeskId: resource.serviceDeskId || "1",
                webhookSecret: resource.webhookSecret,
            };
        }
    } catch (e) {
        // Ignore errors, fall back to env
    }

    // 2. Fallback to Environment Variables (Legacy/Surge)
    // Only if the requested brand "matches" the legacy environment concept or is generic
    // However, to be safe, we always fallback if env vars exist, assuming they are the "default"
    const envBaseUrl = process.env.JIRA_BASE_URL;
    const envEmail = process.env.JIRA_USER_EMAIL;
    const envToken = process.env.JIRA_API_TOKEN;

    if (envBaseUrl && envEmail && envToken) {
        return {
            baseUrl: envBaseUrl,
            userEmail: envEmail,
            apiToken: envToken,
            serviceDeskId: process.env.JIRA_SERVICE_DESK_ID || "1",
            webhookSecret: process.env.JIRA_WEBHOOK_SECRET
        };
    }

    return null;
}

function getAuthHeader(config: JiraConfig): string {
    return "Basic " + Buffer.from(`${config.userEmail}:${config.apiToken}`).toString("base64");
}

/** Map app request types to Jira Service Desk request type IDs */
function mapRequestTypeId(requestType: string): string {
    switch (requestType) {
        case "general":
        case "feature":
            return "2"; // Ask a question
        case "bug":
        case "billing":
        case "integration":
        case "other":
        default:
            return "1"; // Submit a request or incident
    }
}

/** Map app priority to Jira priority name */
function mapPriority(priority: string): string {
    switch (priority) {
        case "high": return "High";
        case "low": return "Low";
        case "medium":
        default: return "Medium";
    }
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SurgeTicket {
    id: string;
    brandKey: string;
    user: string;          // wallet address
    source: string;
    requestType: string;
    subject: string;
    message: string;
    priority: string;
    attachments?: string[];
}

export interface JiraCreateResult {
    issueId: string;
    issueKey: string;
    issueUrl: string;
}

// ── API Functions ──────────────────────────────────────────────────────────────

/**
 * Create a Jira Service Desk request from a Surge support ticket.
 */
export async function createJiraTicket(ticket: SurgeTicket): Promise<JiraCreateResult | null> {
    const config = await getJiraConfig(ticket.brandKey);
    if (!config) {
        console.warn(`[Jira] Not configured for brand '${ticket.brandKey}' — skipping ticket creation`);
        return null;
    }

    try {
        const requestTypeId = mapRequestTypeId(ticket.requestType);

        // Build description with metadata
        const description = [
            ticket.message,
            "",
            "---",
            `**Source:** ${ticket.source}`,
            `**Priority:** ${ticket.priority}`,
            `**Request Type:** ${ticket.requestType}`,
            `**Wallet:** ${ticket.user}`,
            `**Brand:** ${ticket.brandKey}`,
            `**Surge Ticket ID:** ${ticket.id}`,
            ticket.attachments?.length
                ? `**Attachments:** ${ticket.attachments.join(", ")}`
                : "",
        ].filter(Boolean).join("\n");

        // Create via Service Desk API
        const res = await fetch(`${config.baseUrl}/rest/servicedeskapi/request`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(config),
                "Content-Type": "application/json",
                "X-ExperimentalApi": "opt-in",
            },
            body: JSON.stringify({
                serviceDeskId: config.serviceDeskId,
                requestTypeId,
                requestFieldValues: {
                    summary: ticket.subject,
                    description,
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Jira] Create failed (${res.status}):`, errText);
            return null;
        }

        const data = await res.json();
        const issueKey = data.issueKey;
        const issueId = data.issueId;

        console.log(`[Jira] Created ${issueKey} for ticket ${ticket.id} (${ticket.brandKey})`);

        // Set custom fields via standard Jira API (Service Desk API doesn't support custom fields directly)
        // Custom field IDs are currently hardcoded constants, assuming they exist in the target Jira instance
        // TODO: Move these to config if they vary per partner (likely they depend on the Jira instance)
        // For now, we assume all partners use the SAME Jira instance (multi-tenant app, single Jira) OR similar schema.
        // IF partners bring their OWN Jira, they will have DIFFERENT custom field IDs.
        // We might need to look up CF IDs by name or store them in config.
        // For this refactor, we'll keep using the constants but be aware they might fail on external Jiras.
        await setCustomFields(config, issueKey, {
            "customfield_10274": ticket.user,      // CF_SURGE_WALLET
            "customfield_10275": ticket.id,        // CF_SURGE_TICKET_ID
            "customfield_10276": ticket.brandKey,  // CF_BRAND_KEY
        });

        // Set priority via standard API
        await setPriority(config, issueKey, mapPriority(ticket.priority));

        return {
            issueId,
            issueKey,
            issueUrl: `${config.baseUrl}/browse/${issueKey}`,
        };
    } catch (err) {
        console.error("[Jira] Create ticket error:", err);
        return null;
    }
}

/**
 * Set custom field values on a Jira issue.
 */
async function setCustomFields(config: JiraConfig, issueKey: string, fields: Record<string, string>): Promise<void> {
    try {
        const res = await fetch(`${config.baseUrl}/rest/api/3/issue/${issueKey}`, {
            method: "PUT",
            headers: {
                Authorization: getAuthHeader(config),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ fields }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.warn(`[Jira] Set custom fields failed (${res.status}):`, errText);
        }
    } catch (err) {
        console.warn("[Jira] Set custom fields error:", err);
    }
}

/**
 * Set priority on a Jira issue.
 */
async function setPriority(config: JiraConfig, issueKey: string, priorityName: string): Promise<void> {
    try {
        const res = await fetch(`${config.baseUrl}/rest/api/3/issue/${issueKey}`, {
            method: "PUT",
            headers: {
                Authorization: getAuthHeader(config),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fields: {
                    priority: { name: priorityName },
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.warn(`[Jira] Set priority failed (${res.status}):`, errText);
        }
    } catch (err) {
        console.warn("[Jira] Set priority error:", err);
    }
}

/**
 * Add a comment to a Jira issue.
 */
export async function addJiraComment(
    brandKey: string,
    issueKey: string,
    message: string,
    isAdmin: boolean,
    attachmentUrls?: string[]
): Promise<boolean> {
    const config = await getJiraConfig(brandKey);
    if (!config || !issueKey) return false;

    try {
        const prefix = isAdmin ? "💬 *Support Agent Response:*" : "👤 *Customer Reply:*";
        let body = `${prefix}\n\n${message}`;

        if (attachmentUrls?.length) {
            body += `\n\n*Attachments:*\n${attachmentUrls.map(u => `- ${u}`).join("\n")}`;
        }

        const res = await fetch(`${config.baseUrl}/rest/api/3/issue/${issueKey}/comment`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(config),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                body: {
                    version: 1,
                    type: "doc",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: body }],
                        },
                    ],
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`[Jira] Add comment failed (${res.status}):`, errText);
            return false;
        }

        console.log(`[Jira] Comment added to ${issueKey}`);
        return true;
    } catch (err) {
        console.error("[Jira] Add comment error:", err);
        return false;
    }
}

/**
 * Update Jira issue status by transitioning it.
 * Maps Surge statuses to Jira transitions.
 */
export async function updateJiraStatus(brandKey: string, issueKey: string, surgeStatus: string): Promise<boolean> {
    const config = await getJiraConfig(brandKey);
    if (!config || !issueKey) return false;

    try {
        // First, get available transitions
        const transRes = await fetch(`${config.baseUrl}/rest/api/3/issue/${issueKey}/transitions`, {
            headers: { Authorization: getAuthHeader(config) },
        });

        if (!transRes.ok) return false;

        const transData = await transRes.json();
        const transitions: Array<{ id: string; name: string }> = transData.transitions || [];

        // Map Surge status to Jira transition name patterns
        const targetPatterns: string[] = [];
        switch (surgeStatus) {
            case "in_progress":
                targetPatterns.push("in progress", "start progress", "working");
                break;
            case "resolved":
                targetPatterns.push("resolve", "done", "complete");
                break;
            case "closed":
                targetPatterns.push("close", "decline", "cancel");
                break;
            case "open":
                targetPatterns.push("reopen", "open", "back to open");
                break;
        }

        const matchedTransition = transitions.find(t =>
            targetPatterns.some(p => t.name.toLowerCase().includes(p))
        );

        if (!matchedTransition) {
            console.warn(`[Jira] No matching transition for status '${surgeStatus}' on ${issueKey}`);
            return false;
        }

        const res = await fetch(`${config.baseUrl}/rest/api/3/issue/${issueKey}/transitions`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(config),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                transition: { id: matchedTransition.id },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.warn(`[Jira] Transition failed (${res.status}):`, errText);
            return false;
        }

        console.log(`[Jira] Transitioned ${issueKey} to '${matchedTransition.name}'`);
        return true;
    } catch (err) {
        console.error("[Jira] Status update error:", err);
        return false;
    }
}

/**
 * Look up a Surge ticket by Jira issue key.
 * Used by the webhook handler.
 */
export async function findTicketByJiraKey(
    container: any,
    jiraIssueKey: string
): Promise<any | null> {
    try {
        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.jiraIssueKey = @key",
            parameters: [{ name: "@key", value: jiraIssueKey }],
        }).fetchAll();
        return resources[0] || null;
    } catch (err) {
        console.error("[Jira] Find ticket by key error:", err);
        return null;
    }
}

/**
 * Look up a Surge ticket by Jira issue ID (from custom field).
 */
export async function findTicketBySurgeId(
    container: any,
    surgeTicketId: string
): Promise<any | null> {
    try {
        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: surgeTicketId }],
        }).fetchAll();
        return resources[0] || null;
    } catch (err) {
        console.error("[Jira] Find ticket by Surge ID error:", err);
        return null;
    }
}

/**
 * Fetch a Jira issue's custom fields to extract Surge metadata.
 * Requires config, so must pass brandKey.
 */
export async function getJiraIssueFields(brandKey: string, issueKey: string): Promise<{
    surgeWallet: string | null;
    surgeTicketId: string | null;
    brandKey: string | null;
} | null> {
    const config = await getJiraConfig(brandKey);
    if (!config) return null;

    try {
        // Custom field IDs (TODO: configure these dynamically)
        const CF_SURGE_WALLET = "customfield_10274";
        const CF_SURGE_TICKET_ID = "customfield_10275";
        const CF_BRAND_KEY = "customfield_10276";

        const res = await fetch(
            `${config.baseUrl}/rest/api/3/issue/${issueKey}?fields=${CF_SURGE_WALLET},${CF_SURGE_TICKET_ID},${CF_BRAND_KEY}`,
            { headers: { Authorization: getAuthHeader(config) } }
        );

        if (!res.ok) return null;

        const data = await res.json();
        return {
            surgeWallet: data.fields?.[CF_SURGE_WALLET] || null,
            surgeTicketId: data.fields?.[CF_SURGE_TICKET_ID] || null,
            brandKey: data.fields?.[CF_BRAND_KEY] || null,
        };
    } catch (err) {
        console.error("[Jira] Get issue fields error:", err);
        return null;
    }
}
