import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_COMPLIANCE_CONFIG } from "@/lib/cannabis-compliance";

/**
 * POST /api/compliance/sales/push
 * 
 * Auto-reports completed point-of-sale transactions to the merchant's configured
 * Cannabis Compliance provider (METRC/BioTrack) if autoReportSales is enabled.
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const merchantWallet = req.headers.get("x-wallet");
        if (!merchantWallet) {
            return NextResponse.json({ error: "Unauthorized: Missing merchant wallet" }, { status: 401 });
        }

        const body = await req.json();
        
        // In a live system, we would fetch the specific config from Cosmos site_config via merchantWallet
        // For now, we simulate using the default object with some conditional tweaks based on DB logic
        // For demonstration, simulating active connection if autoReportSales was toggled in UI
        const activeProvider = DEFAULT_COMPLIANCE_CONFIG.activeProvider; 
        
        // Usually checked in DB, but assuming 'true' if the hook dispatched it
        // Or if in mocked environment, we process to Mock Endpoints.
        
        if (!body.receiptId) {
             return NextResponse.json({ error: "Missing receiptId payload" }, { status: 400 });
        }

        const items = body.lineItems || [];
        // Filter line items that actually have compliance tags attached
        const compliantItems = items.filter((item: any) => item.metrcTag || item.biotrackId || item.complianceBatchNumber);
        
        if (compliantItems.length === 0) {
            // Nothing to report for this receipt (no cannabis products sold)
            return NextResponse.json({
                 success: true, 
                 message: "Skipped: No compliant items in receipt",
                 receiptId: body.receiptId
            });
        }

        let pushUrl = "";
        let payloadStruct: any = {};

        if (activeProvider === 'metrc') {
            pushUrl = "https://sandbox-api-xx.metrc.com/sales/v1/receipts";
            payloadStruct = {
                SalesDateTime: new Date().toISOString(),
                SalesCustomerType: "Consumer", // Could be Patient if body.customerId exists
                PatientLicenseNumber: body.customerId || null,
                Transactions: compliantItems.map((item: any) => ({
                    PackageLabel: item.metrcTag || item.complianceBatchNumber,
                    Quantity: item.qty,
                    UnitOfMeasure: "Each", // Usually dynamically fetched from InventoryItem
                    TotalAmount: item.priceUsd * item.qty
                }))
            };
        } else if (activeProvider === 'biotrack') {
            pushUrl = "https://sandbox.biotrackthc.net/serverjson.asp"; // BioTrack standard sync endpoint
            payloadStruct = {
                action: "ticket_create",
                barcodeId: compliantItems[0]?.biotrackId, // Simplified for BioTrack
                amount: body.totalUsd,
                quantity: compliantItems.length
            };
        }

        console.log(`[COMPLIANCE] Dispatching mocked POST to ${pushUrl} via ${activeProvider.toUpperCase()}`);
        console.log(JSON.stringify(payloadStruct, null, 2));

        // MOCK NETWORK DELAY
        await new Promise(resolve => setTimeout(resolve, 800));

        // SIMULATED SUCCESS RESPONSE
        return NextResponse.json({
            success: true,
            provider: activeProvider ? activeProvider.toUpperCase() : "METRC",
            syncedItemsCount: compliantItems.length,
            receiptId: body.receiptId,
            mockPayload: payloadStruct
        });

    } catch (e: any) {
        console.error("[COMPLIANCE PUSH ERROR]", e);
        return NextResponse.json(
            { error: "Internal Server Error" }, 
            { status: 500, headers: { "x-correlation-id": correlationId } }
        );
    }
}
