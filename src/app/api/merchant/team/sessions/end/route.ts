import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function POST(req: NextRequest) {
    try {
        const walletHeader = req.headers.get("x-wallet") || "";
        if (!walletHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const merchantWallet = walletHeader.toLowerCase();
        const { sessionId, endTime: customEndTime } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: "sessionId required" }, { status: 400 });
        }

        const container = await getContainer();

        // Fetch the full session document to verify ownership
        const { resources } = await container.items.query({
            query: "SELECT * FROM c WHERE c.id=@id AND c.type='terminal_session' AND c.merchantWallet=@w",
            parameters: [
                { name: "@id", value: sessionId },
                { name: "@w", value: merchantWallet }
            ]
        }).fetchAll();

        if (resources.length === 0) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const session = resources[0];
        console.log(`[EndSession] Found session ${sessionId}, wallet=${session.wallet}, merchantWallet=${session.merchantWallet}, hasEndTime=${!!session.endTime}`);

        if (session.endTime) {
            return NextResponse.json({ error: "Session is already ended" }, { status: 400 });
        }

        const endTime = customEndTime && typeof customEndTime === 'number' ? customEndTime : Math.floor(Date.now() / 1000);

        // Mutate the document and upsert
        const updatedSession: any = {
            ...session,
            endTime,
            endedManually: true,
            endedBy: "admin"
        };

        // If totalTips is explicitly 0 (or not set), automatically mark it as paid out
        if (!session.totalTips || session.totalTips === 0) {
            updatedSession.tipsPaid = true;
            updatedSession.tipsPaidAt = endTime;
        }

        await container.items.upsert(updatedSession);
        console.log(`[EndSession] Upserted session ${sessionId} with endTime=${endTime}`);

        // Verification: re-read the document to confirm persistence
        const { resources: verify } = await container.items.query({
            query: "SELECT c.id, c.endTime, c.endedManually FROM c WHERE c.id=@id AND c.type='terminal_session' AND c.merchantWallet=@w",
            parameters: [
                { name: "@id", value: sessionId },
                { name: "@w", value: merchantWallet }
            ]
        }).fetchAll();

        const verified = verify[0];
        if (verified?.endTime) {
            console.log(`[EndSession] ✅ Verified: endTime=${verified.endTime}, endedManually=${verified.endedManually}`);
        } else {
            console.error(`[EndSession] ❌ FAILED TO PERSIST! Document still has no endTime. Verify result:`, JSON.stringify(verified));
        }

        return NextResponse.json({ success: true, endTime });

    } catch (e: any) {
        console.error("Failed to end session", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
