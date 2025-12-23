
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// This would be in the brand config
const WEBHOOK_SECRET = "my-webhook-secret";

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get("X-Uber-Signature");
        const bodyText = await req.text(); // Need raw body for HMAC

        // 1. Validate Signature
        const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
        const digest = hmac.update(bodyText).digest("hex");
        // In production: if (signature !== digest) return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });

        const body = JSON.parse(bodyText);

        // 2. Handle Event
        // https://developer.uber.com/docs/eats/api/v1/post-eats-order_created
        if (body.event_type === "orders.notification") {
            const { resource_href } = body;

            // Fetch full order details
            // const orderRes = await fetch(resource_href, { headers: { Authorization: `Bearer ${token}` } });
            // const orderData = await orderRes.json();

            console.log("Received Uber Order Event:", body);

            // Create Order in DB (Mock)
            // db.orders.create({ ... })
        }

        return NextResponse.json({ status: "success" });
    } catch (err: any) {
        console.error("Webhook Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
