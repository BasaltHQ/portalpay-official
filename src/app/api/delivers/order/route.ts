import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";

function genReceiptId(): string {
  const baseId = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `R-${baseId}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      shopSlug,
      items,
      customerName,
      customerAddress,
      customerPhone,
      deliveryInstructions
    } = body;
    
    if (!shopSlug || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "Missing required fields (shopSlug, items)" }, { status: 400 });
    }
    
    const container = await getContainer();
    
    // 1. Resolve Shop Config
    const { resources: configs } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'shop_config' AND c.slug = @slug",
        parameters: [{ name: "@slug", value: shopSlug.toLowerCase() }]
      })
      .fetchAll();
      
    const shop = configs[0];
    if (!shop) {
      return NextResponse.json({ ok: false, error: "Shop not found" }, { status: 404 });
    }
    
    const merchantWallet = shop.wallet;
    const deliveryFee = Number(shop.deliveryFee || 5.00);
    
    // 2. Fetch inventory items to verify details
    const itemIds = items.map((it: any) => it.itemId);
    const { resources: invItems } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'inventory_item' AND c.wallet = @wallet",
        parameters: [{ name: "@wallet", value: merchantWallet.toLowerCase() }]
      })
      .fetchAll();
      
    const invMap = new Map(invItems.map((it: any) => [it.id, it]));
    
    let subtotal = 0;
    const lineItems = [];
    
    for (const it of items) {
      const inv = invMap.get(it.itemId);
      if (!inv) {
        return NextResponse.json({ ok: false, error: `Item not found: ${it.itemId}` }, { status: 400 });
      }
      
      const qty = Math.max(1, Number(it.quantity || 1));
      const price = Number(inv.priceUsd || 0);
      const lineTotal = price * qty;
      subtotal += lineTotal;
      
      lineItems.push({
        itemId: inv.id,
        sku: inv.sku || "",
        label: inv.name || "Item",
        priceUsd: price,
        qty: qty,
        thumb: Array.isArray(inv.images) && inv.images.length ? inv.images[0] : undefined
      });
    }
    
    const taxRate = 0.0825; // standard tax
    const tax = Number((subtotal * taxRate).toFixed(2));
    const total = Number((subtotal + tax + deliveryFee).toFixed(2));
    const platformFee = Number((total * 0.01).toFixed(2)); // 1% platform fee
    
    const receiptId = genReceiptId();
    const now = Date.now();

    // Prioritized Algorithmic Matchmaker Routine
    const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const dy = lat1 - lat2;
      const dx = lon1 - lon2;
      return Math.sqrt(dx * dx + dy * dy) * 111; // 1 degree ~ 111km
    };

    // Fetch all active online approved drivers
    const { resources: onlineDrivers } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.type = 'driver_request' AND c.approved = true AND c.isOnline = true",
        parameters: []
      })
      .fetchAll();

    const candidates = [];
    const nowTime = Date.now();

    for (const dr of onlineDrivers) {
      // Exclude drivers on active lockout cooldown
      const cooldownUntil = Number(dr.cooldownUntil || 0);
      if (cooldownUntil > nowTime) {
        continue;
      }

      // Check if driver has coordinates
      const drLat = dr.currentLocation?.lat;
      const drLng = dr.currentLocation?.lng;
      if (drLat === undefined || drLng === undefined) continue;

      const shopLat = Number(shop.latitude || 34.0522);
      const shopLng = Number(shop.longitude || -118.2437);
      
      const distance = getDistanceKm(drLat, drLng, shopLat, shopLng);

      // Score algorithm
      const distanceScore = distance > 0 ? (100 / distance) : 500;
      
      let vehicleBonus = 30; // Walker
      if (dr.vehicle === "car") vehicleBonus = 100;
      else if (dr.vehicle === "scooter") vehicleBonus = 80;
      else if (dr.vehicle === "bike") vehicleBonus = 55;

      let groupBonus = 0;
      if (dr.poolPreference === "shop" && dr.shopSlug?.toLowerCase() === shopSlug.toLowerCase()) {
        groupBonus = 250;
      }

      const totalOffers = Number(dr.totalOffersCount || 0);
      const acceptedOffers = Number(dr.acceptedOffersCount || 0);
      const acceptRate = totalOffers > 0 ? (acceptedOffers / totalOffers) : 1.0;
      const acceptanceReward = acceptRate >= 0.85 ? 50 : 0;

      const priorityScore = distanceScore + vehicleBonus + groupBonus + acceptanceReward;

      candidates.push({
        wallet: dr.wallet.toLowerCase(),
        score: priorityScore
      });
    }

    // Sort by priority score descending
    candidates.sort((a, b) => b.score - a.score);

    const routingQueue = candidates.map(c => c.wallet);
    const activePing = routingQueue.length > 0 ? routingQueue[0] : null;
    const pingTimestamp = activePing ? Date.now() : null;

    // Increment targeted driver totalOffersCount
    if (activePing) {
      try {
        const activePingDocId = `driver:${activePing}`;
        const { resource: activePingProfile } = await container.item(activePingDocId, activePing).read();
        if (activePingProfile) {
          activePingProfile.totalOffersCount = Number(activePingProfile.totalOffersCount || 0) + 1;
          await container.item(activePingDocId, activePing).replace(activePingProfile);
        }
      } catch (pingErr) {
        console.warn("Could not increment driver totalOffersCount:", pingErr);
      }
    }
    
    const orderDoc = {
      id: `receipt:${receiptId}`,
      type: "receipt",
      receiptId,
      wallet: merchantWallet.toLowerCase(),
      shopSlug: shopSlug.toLowerCase(),
      shopName: shop.name || "Shop",
      totalUsd: total,
      subtotalUsd: subtotal,
      taxUsd: tax,
      deliveryFeeUsd: deliveryFee,
      platformFeeUsd: platformFee,
      currency: "USD",
      lineItems,
      createdAt: now,
      updatedAt: now,
      status: "pending", // Payment / order status
      kitchenStatus: "pending",
      
      // Local Delivery specific fields
      localDelivery: {
        deliveryStatus: "pending", // pending, accepted, in_transit, completed
        customerName: customerName || "Guest Customer",
        customerAddress: customerAddress || "123 Main St, Anytown",
        customerPhone: customerPhone || "555-0199",
        deliveryInstructions: deliveryInstructions || "",
        driverWallet: null,
        driverName: null,
        driverPhone: null,
        locationTrail: [],
        routingQueue: routingQueue || [],
        activePing: activePing || null,
        pingTimestamp: pingTimestamp || null,
        surgeBonusUsd: 0
      }
    };
    
    await container.items.create(orderDoc);
    
    return NextResponse.json({ ok: true, receipt: orderDoc });
  } catch (error: any) {
    console.error("[delivers/order] Error creating order:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const wallet = url.searchParams.get("wallet")?.toLowerCase();
    const shopSlug = url.searchParams.get("shopSlug")?.toLowerCase();
    const driverWallet = url.searchParams.get("driverWallet")?.toLowerCase();
    const status = url.searchParams.get("status");
    const pendingPool = url.searchParams.get("pendingPool") === "true";

    const container = await getContainer();

    let query = "SELECT * FROM c WHERE c.type = 'receipt' AND IS_DEFINED(c.localDelivery)";
    const parameters: any[] = [];

    if (wallet) {
      query += " AND c.wallet = @wallet";
      parameters.push({ name: "@wallet", value: wallet });
    } else if (shopSlug) {
      query += " AND c.shopSlug = @shopSlug";
      parameters.push({ name: "@shopSlug", value: shopSlug });
    } else if (driverWallet) {
      query += " AND c.localDelivery.driverWallet = @driverWallet";
      parameters.push({ name: "@driverWallet", value: driverWallet });
    } else if (pendingPool) {
      query += " AND c.localDelivery.deliveryStatus = 'pending'";
    }

    if (status) {
      query += " AND c.localDelivery.deliveryStatus = @status";
      parameters.push({ name: "@status", value: status });
    }

    // Sort by createdAt descending
    query += " ORDER BY c.createdAt DESC";

    const { resources: orders } = await container.items.query({ query, parameters }).fetchAll();

    return NextResponse.json({ ok: true, orders });
  } catch (error: any) {
    console.error("[delivers/order] Error fetching orders:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { receiptId, status, driverWallet, driverName, driverPhone, lat, lng } = body;

    if (!receiptId) {
      return NextResponse.json({ ok: false, error: "Missing receiptId" }, { status: 400 });
    }

    const container = await getContainer();
    
    // Fetch the receipt
    const id = receiptId.startsWith("receipt:") ? receiptId : `receipt:${receiptId}`;
    
    // Query to find partition key (wallet)
    const { resources } = await container.items.query({
      query: "SELECT c.wallet FROM c WHERE c.id = @id AND c.type = 'receipt'",
      parameters: [{ name: "@id", value: id }]
    }).fetchAll();
    
    const wallet = resources[0]?.wallet;
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Order partition not found" }, { status: 404 });
    }
    
    const { resource: order } = await container.item(id, wallet).read();
    
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    if (!order.localDelivery) {
      order.localDelivery = {
        deliveryStatus: "pending",
        customerName: "Guest Customer",
        customerAddress: "123 Main St, Anytown",
        customerPhone: "555-0199",
        deliveryInstructions: "",
        driverWallet: null,
        driverName: null,
        driverPhone: null,
        locationTrail: []
      };
    }

    if (status) {
      order.localDelivery.deliveryStatus = status;
    }

    if (driverWallet !== undefined) {
      order.localDelivery.driverWallet = driverWallet;
      order.localDelivery.driverName = driverName || null;
      order.localDelivery.driverPhone = driverPhone || null;
    }

    if (lat !== undefined && lng !== undefined) {
      order.localDelivery.locationTrail = order.localDelivery.locationTrail || [];
      order.localDelivery.locationTrail.push({
        lat: Number(lat),
        lng: Number(lng),
        timestamp: Date.now()
      });
    }

    order.updatedAt = Date.now();

    await container.item(id, wallet).replace(order);

    return NextResponse.json({ ok: true, order });
  } catch (error: any) {
    console.error("[delivers/order] Error updating order:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Failed to update order" }, { status: 500 });
  }
}

