import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { createJiraTicket, addJiraComment } from "@/lib/jira";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Backfill Jira tickets for existing Surge tickets.
 * - Finds tickets without `jiraIssueKey`.
 * - Creates Jira issue.
 * - Syncs all responses as comments.
 * - Updates ticket with Jira linkage.
 */
export async function POST(req: NextRequest) {
    try {
        // Require admin role
        await requireRole(req, "admin");

        const container = await getContainer(undefined, "support_tickets");

        // Query all tickets that don't have a jiraIssueKey yet
        // Note: checking IS_DEFINED(c.jiraIssueKey) = false OR c.jiraIssueKey = null
        const querySpec = {
            query: "SELECT * FROM c WHERE NOT IS_DEFINED(c.jiraIssueKey) OR c.jiraIssueKey = null",
        };

        const { resources: tickets } = await container.items.query(querySpec).fetchAll();
        console.log(`[Jira Backfill] Found ${tickets.length} tickets to backfill`);

        const results = {
            total: tickets.length,
            success: 0,
            failed: 0,
            skipped: 0,
            details: [] as string[],
        };

        for (const ticket of tickets) {
            try {
                // Double check just in case
                if (ticket.jiraIssueKey) {
                    results.skipped++;
                    continue;
                }

                console.log(`[Jira Backfill] Processing ${ticket.id}...`);

                // 1. Create the Jira Ticket
                const jiraResult = await createJiraTicket(ticket as any);

                if (!jiraResult) {
                    throw new Error("Failed to create Jira ticket");
                }

                // 2. Sync Responses (Conversation History)
                if (ticket.responses && Array.isArray(ticket.responses)) {
                    for (const response of ticket.responses) {
                        await addJiraComment(
                            jiraResult.issueKey,
                            response.message || "(No message content)",
                            !!response.isAdmin, // true if admin, false if user
                            response.attachments || []
                        );
                    }
                }

                // 3. Update Surge Ticket with Jira Linkage
                const partitionKey = ticket.wallet || ticket.user;
                const updatedTicket = {
                    ...ticket,
                    jiraIssueKey: jiraResult.issueKey,
                    jiraIssueId: jiraResult.issueId,
                    jiraIssueUrl: jiraResult.issueUrl,
                    updatedAt: Date.now(), // update timestamp to reflect sync
                };

                await container.item(ticket.id, partitionKey).replace(updatedTicket);

                results.success++;
                results.details.push(`Synced ${ticket.id} -> ${jiraResult.issueKey}`);

            } catch (err: any) {
                console.error(`[Jira Backfill] Failed ${ticket.id}:`, err);
                results.failed++;
                results.details.push(`Failed ${ticket.id}: ${err.message}`);
            }
        }

        return NextResponse.json({ ok: true, results });

    } catch (e: any) {
        console.error("[Jira Backfill] Error:", e);
        return NextResponse.json({ error: e.message || "Backfill failed" }, { status: 500 });
    }
}
