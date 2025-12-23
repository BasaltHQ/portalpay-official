import { NextRequest, NextResponse } from "next/server";
import { getReceipts, updateReceiptStatus } from "@/lib/receipts-mem";
import { getInventoryItems } from "@/lib/inventory-mem";

/**
 * GET /api/kitchen/orders
 * 
 * Fetches kitchen orders (paid receipts with restaurant items)
 * Filters to show only restaurant industry pack items
 * 
 * Query params:
 * - status: Filter by kitchen status (new,preparing,ready,completed)
 * - wallet: Merchant wallet (from header x-wallet)
 */
export async function GET(request: NextRequest) {
  try {
    const wallet = request.headers.get("x-wallet");
    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status")?.split(",") || ["new", "preparing", "ready"];

    // Get all receipts for merchant
    const allReceipts = getReceipts(undefined, wallet.toLowerCase());

    // Filter to paid receipts only
    const paidStatuses = ["checkout_success", "reconciled", "tx_mined", "recipient_validated", "paid"];
    const paidReceipts = allReceipts.filter((r: any) => {
      const status = String(r.status || "").toLowerCase();
      return paidStatuses.includes(status);
    });

    // Get merchant's inventory to check industry packs
    const inventory = getInventoryItems(wallet.toLowerCase());
    const inventoryMap = new Map(
      inventory.map((item: any) => [String(item.id || "").toLowerCase(), item])
    );

    // Process receipts to filter restaurant items
    const kitchenOrders = [];
    
    for (const receipt of paidReceipts) {
      const lineItems = Array.isArray(receipt.lineItems) ? receipt.lineItems : [];
      
      // Filter line items to restaurant items only
      const restaurantItems = [];
      for (const item of lineItems) {
        // Skip processing fee and tax items
        const label = String(item.label || "").toLowerCase();
        if (label.includes("processing fee") || label.includes("tax")) {
          continue;
        }

        // Try to find inventory item by itemId or sku
        const itemId = String((item as any).itemId || "").toLowerCase();
        const sku = String((item as any).sku || "").toLowerCase();
        
        let inventoryItem = null;
        if (itemId) {
          inventoryItem = inventoryMap.get(itemId);
        }
        if (!inventoryItem && sku) {
          // Search by SKU as fallback
          inventoryItem = inventory.find((inv: any) => 
            String(inv.sku || "").toLowerCase() === sku
          );
        }

        // Include item if it's a restaurant item
        if (inventoryItem && inventoryItem.industryPack === "restaurant") {
          restaurantItems.push({
            ...item,
            industryPack: "restaurant",
            // Include additional restaurant metadata if available
            attributes: inventoryItem.attributes || {},
          });
        }
      }

      // Only include receipt if it has restaurant items
      if (restaurantItems.length > 0) {
        // Check kitchen status filter
        const kitchenStatus = String((receipt as any).kitchenStatus || "new");
        if (statusFilter.includes(kitchenStatus)) {
          kitchenOrders.push({
            receiptId: receipt.receiptId,
            totalUsd: receipt.totalUsd,
            currency: receipt.currency || "USD",
            createdAt: receipt.createdAt,
            status: receipt.status,
            kitchenStatus,
            lineItems: restaurantItems,
            brandName: receipt.brandName,
            // Kitchen metadata
            kitchenMetadata: (receipt as any).kitchenMetadata || {
              enteredKitchenAt: receipt.createdAt,
            },
            // Additional order metadata
            orderType: (receipt as any).orderType || "dine-in",
            tableNumber: (receipt as any).tableNumber,
            customerName: (receipt as any).customerName,
            specialInstructions: (receipt as any).specialInstructions,
          });
        }
      }
    }

    // Sort by creation time (oldest first - FIFO)
    kitchenOrders.sort((a: any, b: any) => {
      const aTime = Number(a.kitchenMetadata?.enteredKitchenAt || a.createdAt || 0);
      const bTime = Number(b.kitchenMetadata?.enteredKitchenAt || b.createdAt || 0);
      return aTime - bTime;
    });

    return NextResponse.json({
      ok: true,
      orders: kitchenOrders,
      count: kitchenOrders.length,
    });
  } catch (error: any) {
    console.error("[kitchen/orders] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch kitchen orders" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/kitchen/orders/:receiptId
 * Update kitchen status for a receipt
 * 
 * Body: { receiptId, kitchenStatus: "new" | "preparing" | "ready" | "completed" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const wallet = request.headers.get("x-wallet");
    if (!wallet) {
      return NextResponse.json({ error: "Wallet required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { receiptId, kitchenStatus } = body;

    if (!receiptId || !kitchenStatus) {
      return NextResponse.json(
        { error: "receiptId and kitchenStatus required" },
        { status: 400 }
      );
    }

    const validStatuses = ["new", "preparing", "ready", "completed"];
    if (!validStatuses.includes(kitchenStatus)) {
      return NextResponse.json(
        { error: "Invalid kitchen status" },
        { status: 400 }
      );
    }

    const allReceipts = getReceipts(undefined, wallet.toLowerCase());
    const receipt = allReceipts.find((r: any) => r.receiptId === receiptId);

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Verify ownership
    const receiptWallet = String(receipt.wallet || "").toLowerCase();
    if (receiptWallet !== wallet.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update kitchen status using the status update function
    // This will append to statusHistory
    updateReceiptStatus(receiptId, wallet.toLowerCase(), `kitchen:${kitchenStatus}`);

    // Return updated receipt (fetch it again to get the updated version)
    const updatedReceipts = getReceipts(undefined, wallet.toLowerCase());
    const updatedReceipt = updatedReceipts.find((r: any) => r.receiptId === receiptId);

    return NextResponse.json({
      ok: true,
      receipt: {
        ...updatedReceipt,
        kitchenStatus,
      },
    });
  } catch (error: any) {
    console.error("[kitchen/orders] PATCH Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update kitchen status" },
      { status: 500 }
    );
  }
}
