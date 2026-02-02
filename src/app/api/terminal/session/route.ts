import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

// GET: Fetch session details (for re-hydration or check)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId");
        // Prefer header, fallback to query param (client sends it in query)
        const merchantWallet = req.headers.get("x-wallet") || searchParams.get("merchantWallet");

        if (!sessionId) {
            return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
        }

        const container = await getContainer();

        // If we have merchantWallet, we can do a direct point read/query efficiently. 
        // If not, we query by ID (assuming ID is unique).
        // Since session ID is UUID, query is fine.

        const querySpec = {
            query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'terminal_session'",
            parameters: [{ name: "@id", value: sessionId }]
        };

        const { resources } = await container.items.query(querySpec).fetchAll();

        if (!resources || resources.length === 0) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const session = resources[0];
        const staffId = session.staffId; // Assuming session has staffId (HandheldSessionManager says so)

        // Calculate Start of Day (Local Server Time - simplified)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); // Milliseconds

        // Find ALL sessions for this staff member today
        // Removed wallet scope to avoid casing mismatches context errors.
        // staffId should be sufficiently unique combined with today's date context? 
        // Ideally staffId is a GUID or specific to merchant.
        // We TRUST staffId for now.

        // Brand isolation for partner containers
        const ct = String(process.env.NEXT_PUBLIC_CONTAINER_TYPE || process.env.CONTAINER_TYPE || "platform").toLowerCase();
        const brandKey = String(process.env.BRAND_KEY || process.env.NEXT_PUBLIC_BRAND_KEY || "").toLowerCase();

        let sessionQuery: { query: string; parameters: any[] };
        if (ct === "partner" && brandKey) {
            // Partner mode: filter by brandKey
            sessionQuery = {
                query: "SELECT c.id, c.startTime, c.endTime, c.totalSales, c.totalTips FROM c WHERE c.type = 'terminal_session' AND c.staffId = @staffId AND c.createdAt >= @startOfDay AND c.brandKey = @brandKey",
                parameters: [
                    { name: "@staffId", value: staffId },
                    { name: "@startOfDay", value: startOfDay },
                    { name: "@brandKey", value: brandKey }
                ]
            };
        } else {
            // Platform mode: no brand filter
            sessionQuery = {
                query: "SELECT c.id, c.startTime, c.endTime, c.totalSales, c.totalTips FROM c WHERE c.type = 'terminal_session' AND c.staffId = @staffId AND c.createdAt >= @startOfDay",
                parameters: [
                    { name: "@staffId", value: staffId },
                    { name: "@startOfDay", value: startOfDay }
                ]
            };
        }
        const { resources: dailySessions } = await container.items.query(sessionQuery).fetchAll();
        const dailySessionIds = dailySessions.map((s: any) => s.id);

        // SUPER DEBUG: Log recent sessions for this staff to see what we are missing
        const inspectSessionsQuery = {
            query: "SELECT TOP 5 c.id, c.staffId, c.createdAt, c.wallet FROM c WHERE c.type='terminal_session' AND c.staffId = @staffId ORDER BY c.createdAt DESC",
            parameters: [{ name: "@staffId", value: staffId }]
        };
        const { resources: recentSessions } = await container.items.query(inspectSessionsQuery).fetchAll();
        console.log("DEBUG: Inspect Recent Sessions for Staff:", {
            startOfDayMs: startOfDay,
            recentSessions,
            caughtSessions: dailySessionIds
        });

        // Ensure we at least include the current one if query missed it (e.g. time skew)
        if (!dailySessionIds.includes(sessionId)) dailySessionIds.push(sessionId);

        // DEBUG: Check recent receipts to verify sessionId exists
        const debugQuery = {
            query: "SELECT TOP 5 c.id, c.sessionId, c.status, c.totalUsd FROM c WHERE c.type='receipt' AND c.wallet=@wallet ORDER BY c.createdAt DESC",
            parameters: [{ name: "@wallet", value: merchantWallet?.toLowerCase() || session.wallet || "" }]
        };
        const { resources: recentReceipts } = await container.items.query(debugQuery).fetchAll();
        console.log("DEBUG Recent Receipts:", recentReceipts);

        // Aggregate stats from receipts for ALL sessions of this staff today
        // We MUST include wallet to target partition for aggregation, otherwise SUM over cross-partition might fail or be slow
        // We assume all sessions are in the SAME wallet (which makes sense for a staff view)
        // Aggregate stats from receipts for ALL sessions of this staff today
        // We MUST include wallet to target partition for aggregation, otherwise SUM over cross-partition might fail or be slow
        const statsQuery = {
            query: `SELECT VALUE { totalSales: SUM(c.totalUsd), totalTips: SUM(c.tipAmount), count: COUNT(1) } FROM c WHERE c.type = 'receipt' AND c.wallet = @wallet AND (c.staffId = @staffId OR ARRAY_CONTAINS(@sessionIds, c.sessionId)) AND c.createdAt >= @startOfDay AND LOWER(c.status) IN ('paid', 'checkout_success', 'confirmed', 'tx_mined', 'reconciled', 'settled', 'completed')`,
            parameters: [
                { name: "@staffId", value: staffId },
                { name: "@startOfDay", value: startOfDay },
                { name: "@wallet", value: merchantWallet?.toLowerCase() || session.wallet || "" },
                { name: "@sessionIds", value: dailySessionIds }
            ]
        };

        // Let's fetch total sales and tips.
        console.log("Daily Report Query:", { staffId, sessions: dailySessionIds, query: statsQuery.query }); // DEBUG
        const { resources: stats } = await container.items.query(statsQuery).fetchAll();
        console.log("Only Daily Stats:", stats); // DEBUG
        const aggregated = stats[0] || { totalSales: 0, totalTips: 0, count: 0 };

        let orders: any[] = [];
        if (searchParams.get("includeOrders") === "true") {
            const detailQuery = {
                query: `SELECT c.id, c.receiptId, c.createdAt, c.totalUsd, c.tipAmount, c.status, c.tableNumber FROM c WHERE c.type = 'receipt' AND c.wallet = @wallet AND (c.staffId = @staffId OR ARRAY_CONTAINS(@sessionIds, c.sessionId)) AND c.createdAt >= @startOfDay AND LOWER(c.status) IN ('paid', 'checkout_success', 'confirmed', 'tx_mined', 'reconciled', 'settled', 'completed') ORDER BY c.createdAt DESC`,
                parameters: [
                    { name: "@staffId", value: staffId },
                    { name: "@startOfDay", value: startOfDay },
                    { name: "@wallet", value: merchantWallet?.toLowerCase() || session.wallet || "" },
                    { name: "@sessionIds", value: dailySessionIds }
                ]
            };
            const { resources: orderList } = await container.items.query(detailQuery).fetchAll();
            orders = orderList;
        }

        return NextResponse.json({
            session: {
                ...session,
                totalSales: aggregated.totalSales || 0,
                totalTips: aggregated.totalTips || 0,
                transactionCount: aggregated.count || 0
            },
            orders // Return detailed list if requested
        });

    } catch (e: any) {
        console.error("Session API Error:", e.message, e.stack); // DEBUG: Ensure we see why it failed
        return NextResponse.json({ error: e.message, details: e.toString() }, { status: 500 });
    }
}

// POST: End Session (Clock Out)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { sessionId, merchantWallet } = body;

        if (!sessionId || !merchantWallet) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const container = await getContainer();
        const w = String(merchantWallet).toLowerCase();

        // Fetch valid session
        const { resource: session } = await container.item(sessionId, w).read();

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (session.endTime) {
            return NextResponse.json({ success: true, message: "Already ended" });
        }

        const now = Math.floor(Date.now() / 1000);

        // Aggregate stats before closing
        const statsQuery = {
            query: "SELECT VALUE { totalSales: SUM(c.totalUsd), totalTips: SUM(c.tipAmount) } FROM c WHERE c.type = 'receipt' AND c.sessionId = @sid AND LOWER(c.status) IN ('paid', 'checkout_success', 'confirmed', 'tx_mined', 'reconciled', 'settled', 'completed')",
            parameters: [{ name: "@sid", value: sessionId }]
        };
        const { resources: stats } = await container.items.query(statsQuery).fetchAll();
        const agg = stats[0] || { totalSales: 0, totalTips: 0 };

        // Patch update
        const ops = [
            { op: "set", path: "/endTime", value: now },
            { op: "set", path: "/totalSales", value: agg.totalSales || 0 },
            { op: "set", path: "/totalTips", value: agg.totalTips || 0 },
            { op: "add", path: "/tipsPaid", value: false }
        ] as any[];

        await container.item(sessionId, w).patch(ops);

        return NextResponse.json({ success: true, endTime: now });

    } catch (e: any) {
        console.error("Session update failed", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
