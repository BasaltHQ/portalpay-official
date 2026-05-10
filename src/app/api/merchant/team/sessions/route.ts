import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(req: NextRequest) {
    try {
        const walletHeader = req.headers.get("x-wallet") || "";
        if (!walletHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const merchantWallet = walletHeader.toLowerCase();
        const memberId = req.nextUrl.searchParams.get("memberId") || "";

        if (!memberId) {
            return NextResponse.json({ error: "memberId required" }, { status: 400 });
        }

        const container = await getContainer();

        // Fetch all sessions for this employee
        const sessionsQuery = {
            query: `SELECT c.id, c.startTime, c.endTime, c.totalSales, c.totalTips, c.tipsPaid, c.tipsPaidAt 
                    FROM c 
                    WHERE c.type='terminal_session' 
                    AND c.merchantWallet=@w 
                    AND c.staffId=@memberId 
                    ORDER BY c.startTime DESC`,
            parameters: [
                { name: "@w", value: merchantWallet },
                { name: "@memberId", value: memberId }
            ]
        };

        const { resources: sessions } = await container.items.query(sessionsQuery).fetchAll();

        // Enrich sessions with receipt-based sales/tips data
        // Receipts have sessionId field linking them to the session
        if (sessions.length > 0) {
            const sessionIds = sessions.map((s: any) => s.id);

            // Fetch all receipts for this employee, grouped by sessionId
            try {
                const receiptsQuery = {
                    query: `SELECT c.sessionId, SUM(c.totalUsd) as totalSales, SUM(c.tipAmount) as totalTips
                            FROM c 
                            WHERE c.type='receipt' 
                            AND c.wallet=@w 
                            AND IS_DEFINED(c.sessionId)
                            AND (c.employeeId=@memberId OR c.staffId=@memberId)
                            GROUP BY c.sessionId`,
                    parameters: [
                        { name: "@w", value: merchantWallet },
                        { name: "@memberId", value: memberId }
                    ]
                };

                const { resources: receiptAggs } = await container.items.query(receiptsQuery).fetchAll();

                // Build a lookup map
                const receiptMap: Record<string, { totalSales: number; totalTips: number }> = {};
                for (const agg of receiptAggs) {
                    if (agg.sessionId) {
                        receiptMap[agg.sessionId] = {
                            totalSales: agg.totalSales || 0,
                            totalTips: agg.totalTips || 0
                        };
                    }
                }

                // Merge receipt data into sessions
                for (const session of sessions) {
                    const receiptData = receiptMap[session.id];
                    if (receiptData) {
                        session.totalSales = receiptData.totalSales;
                        session.totalTips = receiptData.totalTips;
                    }
                }
            } catch (e) {
                console.warn("[Sessions] Receipt enrichment failed, using session values", e);
            }
        }

        let strayReceipts: any[] = [];
        try {
            const strayQuery = {
                query: `SELECT c.id, c.createdAt as startTime, c.totalUsd as totalSales, c.tipAmount as totalTips, c.tipsPaid, c.tipsPaidAt
                        FROM c 
                        WHERE c.type='receipt' 
                        AND c.wallet=@w 
                        AND (NOT IS_DEFINED(c.sessionId) OR c.sessionId = null OR c.sessionId = '')
                        AND (c.employeeId=@memberId OR c.staffId=@memberId)
                        AND c.tipAmount > 0
                        ORDER BY c.createdAt DESC`,
                parameters: [
                    { name: "@w", value: merchantWallet },
                    { name: "@memberId", value: memberId }
                ]
            };
            const { resources } = await container.items.query(strayQuery).fetchAll();
            strayReceipts = resources.map((r: any) => {
                let start = r.startTime;
                if (typeof start === 'string') {
                    start = Math.floor(new Date(start).getTime() / 1000);
                } else if (start > 10000000000) {
                    start = Math.floor(start / 1000);
                }
                return { ...r, startTime: start };
            });
        } catch (e) {
            console.warn("[Sessions] Stray receipts fetch failed", e);
        }

        return NextResponse.json({ sessions, strayReceipts });

    } catch (e: any) {
        console.error("Failed to fetch member sessions", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
