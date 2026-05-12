import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sendEmail } from "@/lib/aws/ses";

export async function POST(req: NextRequest) {
    try {
        const caller = await requireRole(req, "admin");
        const url = new URL(req.url);
        const brandKey = url.searchParams.get("brandKey");
        const isPlatform = !brandKey || brandKey.toLowerCase() === "basaltsurge";

        if (!isPlatform) {
            return NextResponse.json({ error: "Unauthorized. Only Platform can send newsletters." }, { status: 403 });
        }

        const body = await req.json();
        const { emails, subject, html } = body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: "Missing or invalid emails array" }, { status: 400 });
        }

        if (!subject || !html) {
            return NextResponse.json({ error: "Missing subject or html content" }, { status: 400 });
        }

        // Send to all emails
        // AWS SES limits SendEmail to 50 destinations per call, so we should batch them if there are many.
        // For simplicity and immediate scale, we'll loop sequentially or use Promise.all for a few.
        // In production for huge lists, use SES SendBulkTemplatedEmail or a queue.
        const sendPromises = emails.map((email: string) => 
            sendEmail({
                to: email,
                subject: subject,
                html: html,
                fromName: "BasaltSurge Platform",
            })
        );

        await Promise.all(sendPromises);

        return NextResponse.json({ ok: true, message: `Sent to ${emails.length} recipients` });
    } catch (e: any) {
        console.error("Failed to send newsletter", e);
        return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
    }
}

