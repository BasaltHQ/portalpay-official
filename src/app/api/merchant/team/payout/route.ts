import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function POST(req: NextRequest) {
    try {
        const walletHeader = req.headers.get("x-wallet") || "";
        if (!walletHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const merchantWallet = walletHeader.toLowerCase();

        const body = await req.json().catch(() => ({}));
        const { staffId, sessionIds } = body;

        if (!staffId && (!Array.isArray(sessionIds) || sessionIds.length === 0)) {
            return NextResponse.json({ error: "Missing staffId or sessionIds" }, { status: 400 });
        }

        const container = await getContainer();
        const now = Math.floor(Date.now() / 1000);

        // Find target sessions
        let targets: { id: string, wallet?: string, type: 'session' | 'receipt' }[] = [];

        if (Array.isArray(sessionIds) && sessionIds.length > 0) {
            // Note: If exact sessionIds are passed, we query them to get their true partition key
            const query = {
                query: "SELECT c.id, c.wallet FROM c WHERE ARRAY_CONTAINS(@ids, c.id) AND c.type='terminal_session'",
                parameters: [{ name: "@ids", value: sessionIds }]
            };
            const { resources } = await container.items.query(query).fetchAll();
            targets.push(...resources.map(r => ({ id: r.id, wallet: r.wallet, type: 'session' as const })));
        } else if (staffId) {
            const query = {
                query: "SELECT c.id, c.wallet FROM c WHERE c.type='terminal_session' AND c.merchantWallet=@w AND c.staffId=@sid AND (NOT IS_DEFINED(c.tipsPaid) OR c.tipsPaid=false) AND IS_DEFINED(c.endTime)",
                parameters: [
                    { name: "@w", value: merchantWallet },
                    { name: "@sid", value: staffId }
                ]
            };
            const { resources } = await container.items.query(query).fetchAll();
            targets.push(...resources.map(r => ({ id: r.id, wallet: r.wallet, type: 'session' as const })));
        }

        if (staffId && (!Array.isArray(sessionIds) || sessionIds.length === 0)) {
            const strayQuery = {
                query: "SELECT c.id, c.wallet FROM c WHERE c.type='receipt' AND c.wallet=@w AND (c.staffId=@sid OR c.employeeId=@sid) AND c.tipAmount > 0 AND (NOT IS_DEFINED(c.tipsPaid) OR c.tipsPaid=false)",
                parameters: [
                    { name: "@w", value: merchantWallet },
                    { name: "@sid", value: staffId }
                ]
            };
            const { resources } = await container.items.query(strayQuery).fetchAll();
            targets.push(...resources.map(r => ({ id: r.id, wallet: r.wallet, type: 'receipt' as const })));
        }

        if (targets.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "No unpaid sessions or receipts found" });
        }

        const promises = targets.map(doc => {
            // Fallback to undefined if missing, otherwise use the actual partition key value
            const partitionKey = doc.wallet !== undefined ? doc.wallet : undefined;
            return container.item(doc.id, partitionKey).patch([
                { op: "set", path: "/tipsPaid", value: true },
                { op: "set", path: "/tipsPaidAt", value: now }
            ]).catch(e => {
                console.error(`Failed to pay out ${doc.type} ${doc.id} with PK ${partitionKey}:`, e);
                return null;
            });
        });

        await Promise.all(promises);

        return NextResponse.json({ success: true, count: targets.length });



    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
