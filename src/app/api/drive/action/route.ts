import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      action,
      receiptId,
      driverWallet,
      driverName,
      driverPhone,
      location,
      photoUrl
    } = body;
    
    if (!action || !receiptId) {
      return NextResponse.json({ ok: false, error: "Missing required fields (action, receiptId)" }, { status: 400 });
    }
    
    const container = await getContainer();
    const docId = `receipt:${receiptId}`;
    
    // We need to look up the receipt using partition key.
    // Partition key is the merchant's wallet, but we don't know the merchant's wallet immediately.
    // So we can query for the receipt first to find its partition key!
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'receipt' AND c.receiptId = @receiptId",
      parameters: [{ name: "@receiptId", value: receiptId }]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    let receipt = resources[0];
    
    // If the receipt wasn't found in Cosmos, we can check if it exists in-memory or create a new mock one
    if (!receipt) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }
    
    // Initialize localDelivery if not present
    if (!receipt.localDelivery) {
      receipt.localDelivery = {
        deliveryStatus: "pending",
        customerName: "Alex Mercer",
        customerAddress: "456 Oak Ave, Pleasantville",
        customerPhone: "555-0144",
        deliveryInstructions: "Leave on the porch.",
        driverWallet: null,
        driverName: null,
        driverPhone: null,
        locationTrail: []
      };
    }
    
    const now = Date.now();
    receipt.updatedAt = now;
    
    if (action === "accept") {
      receipt.localDelivery.deliveryStatus = "accepted";
      receipt.localDelivery.driverWallet = driverWallet || "0xDriverWallet";
      receipt.localDelivery.driverName = driverName || "Local Driver";
      receipt.localDelivery.driverPhone = driverPhone || "555-0100";
      receipt.localDelivery.activePing = null;
      receipt.localDelivery.pingTimestamp = null;

      // Update DIRS acceptance metrics inside Cosmos request document
      if (driverWallet) {
        try {
          const driverDocId = `driver:${driverWallet.toLowerCase()}`;
          const { resource: drProfile } = await container.item(driverDocId, driverWallet.toLowerCase()).read();
          if (drProfile) {
            drProfile.consecutiveDeclines = 0;
            drProfile.acceptedOffersCount = Number(drProfile.acceptedOffersCount || 0) + 1;
            await container.item(driverDocId, driverWallet.toLowerCase()).replace(drProfile);
          }
        } catch (drErr) {
          console.warn("Could not record driver acceptance stats:", drErr);
        }
      }
    } else if (action === "decline") {
      const failedDriver = (driverWallet || "").toLowerCase();
      
      // 1. Mark driver with consecutive decline lockout check
      if (failedDriver) {
        try {
          const failedDriverDocId = `driver:${failedDriver}`;
          const { resource: fdProfile } = await container.item(failedDriverDocId, failedDriver).read();
          if (fdProfile) {
            fdProfile.consecutiveDeclines = Number(fdProfile.consecutiveDeclines || 0) + 1;
            if (fdProfile.consecutiveDeclines >= 3) {
              // Sidelined cooldown lockout for 5 minutes
              fdProfile.cooldownUntil = now + 5 * 60 * 1000;
              fdProfile.isOnline = false; // Set offline as penalty
            }
            await container.item(failedDriverDocId, failedDriver).replace(fdProfile);
          }
        } catch (fdErr) {
          console.warn("Could not penalize declining driver:", fdErr);
        }
      }

      // 2. Increment order surge pricing payout (+$1.00 per pass, up to +$5.00)
      receipt.localDelivery.surgeBonusUsd = Math.min(5.00, Number(receipt.localDelivery.surgeBonusUsd || 0) + 1.00);

      // 3. Shift to next driver in routing queue
      const queue = Array.isArray(receipt.localDelivery.routingQueue) ? receipt.localDelivery.routingQueue : [];
      const currentIndex = queue.indexOf(receipt.localDelivery.activePing);
      if (currentIndex !== -1 && currentIndex + 1 < queue.length) {
        receipt.localDelivery.activePing = queue[currentIndex + 1];
        receipt.localDelivery.pingTimestamp = now;

        // Increment next target driver totalOffersCount
        try {
          const nextDriver = receipt.localDelivery.activePing.toLowerCase();
          const nextDriverDocId = `driver:${nextDriver}`;
          const { resource: ndProfile } = await container.item(nextDriverDocId, nextDriver).read();
          if (ndProfile) {
            ndProfile.totalOffersCount = Number(ndProfile.totalOffersCount || 0) + 1;
            await container.item(nextDriverDocId, nextDriver).replace(ndProfile);
          }
        } catch (ndErr) {
          console.warn("Could not increment next driver totalOffersCount:", ndErr);
        }
      } else {
        // Queue exhausted! Fallback to general public pool
        receipt.localDelivery.activePing = null;
        receipt.localDelivery.pingTimestamp = null;
      }
    } else if (action === "transit") {
      receipt.localDelivery.deliveryStatus = "in_transit";
    } else if (action === "complete") {
      receipt.localDelivery.deliveryStatus = "completed";
      receipt.localDelivery.photoUrl = photoUrl || "https://images.unsplash.com/photo-1534531173927-aeb928d54385?q=80&w=200&auto=format&fit=crop";
      receipt.localDelivery.completedAt = now;
      receipt.kitchenStatus = "served"; // update POS status
    } else if (action === "location" && location) {
      if (!receipt.localDelivery.locationTrail) {
        receipt.localDelivery.locationTrail = [];
      }
      receipt.localDelivery.locationTrail.push({
        lat: location.lat,
        lng: location.lng,
        timestamp: now
      });
      receipt.localDelivery.currentLocation = location;
    } else {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }
    
    // Replace the document in Cosmos DB using the partition key (merchant wallet)
    await container.item(receipt.id, receipt.wallet).replace(receipt);
    
    return NextResponse.json({ ok: true, receipt });
  } catch (error: any) {
    console.error("[drive/action] Error performing driver action:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to execute action" },
      { status: 500 }
    );
  }
}
