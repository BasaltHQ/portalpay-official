import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

export async function GET(req: NextRequest) {
  try {
    const container = await getContainer();
    
    // Select all receipt documents that have localDelivery defined
    const querySpec = {
      query: "SELECT * FROM c WHERE c.type = 'receipt' AND IS_DEFINED(c.localDelivery) ORDER BY c.createdAt DESC",
      parameters: []
    };
    
    let { resources: jobs } = await container.items.query(querySpec).fetchAll();

    // Automatic Routing Queue Decay and DIRS Penalty Processor
    const now = Date.now();
    let updatedAny = false;
    
    for (const job of (jobs || [])) {
      const delivery = job.localDelivery || {};
      const status = delivery.deliveryStatus || "pending";
      
      // If it's pending and has an active ping that has timed out (> 45s)
      if (status === "pending" && delivery.activePing && delivery.pingTimestamp) {
        const elapsed = now - Number(delivery.pingTimestamp);
        if (elapsed > 45000) { // 45 seconds timeout
          const failedDriver = delivery.activePing.toLowerCase();
          
          // 1. Mark driver with consecutive decline lockout check
          try {
            const failedDriverDocId = `driver:${failedDriver}`;
            const { resource: fdProfile } = await container.item(failedDriverDocId, failedDriver).read();
            if (fdProfile) {
              fdProfile.consecutiveDeclines = Number(fdProfile.consecutiveDeclines || 0) + 1;
              if (fdProfile.consecutiveDeclines >= 3) {
                // Sidelined cooldown lockout for 5 minutes
                fdProfile.cooldownUntil = now + 5 * 60 * 1000;
                fdProfile.isOnline = false; // Set offline as reliability penalty
              }
              await container.item(failedDriverDocId, failedDriver).replace(fdProfile);
            }
          } catch (fdErr) {
            console.warn("Could not penalize unresponsive driver:", fdErr);
          }

          // 2. Increment order surge pricing payout (+$1.00 per pass, up to +$5.00)
          delivery.surgeBonusUsd = Math.min(5.00, Number(delivery.surgeBonusUsd || 0) + 1.00);

          // 3. Shift to next driver in routing queue
          const queue = Array.isArray(delivery.routingQueue) ? delivery.routingQueue : [];
          const currentIndex = queue.indexOf(delivery.activePing);
          if (currentIndex !== -1 && currentIndex + 1 < queue.length) {
            delivery.activePing = queue[currentIndex + 1];
            delivery.pingTimestamp = now;
            
            // Increment next target driver totalOffersCount
            try {
              const nextDriver = delivery.activePing.toLowerCase();
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
            delivery.activePing = null;
            delivery.pingTimestamp = null;
          }

          // 4. Update order document in Cosmos
          job.localDelivery = delivery;
          job.updatedAt = now;
          
          await container.item(job.id, job.wallet).replace(job);
          updatedAny = true;
        }
      }
    }

    // Re-fetch jobs if database state changed to guarantee fresh readouts
    if (updatedAny) {
      const freshRes = await container.items.query(querySpec).fetchAll();
      jobs = freshRes.resources;
    }
    
    
    return NextResponse.json({ ok: true, jobs: jobs || [] });
  } catch (error: any) {
    console.error("[drive/jobs] Error fetching jobs:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch delivery jobs" },
      { status: 500 }
    );
  }
}
