import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { renderToStream } from "@react-pdf/renderer";
import { EndOfDayPDF } from "@/components/reports/EndOfDayPDF";
import JSZip from "jszip";
import React from "react";

const BLOCKED_URL_PART = "a311dcf8";
const LEGACY_LOGO = "cblogod.png";

function sanitizeShopTheme(theme: any) {
    if (!theme) return theme;
    const t = { ...theme };
    if (t.brandLogoUrl && (t.brandLogoUrl.includes(BLOCKED_URL_PART) || t.brandLogoUrl.includes(LEGACY_LOGO))) {
        t.brandLogoUrl = "/BasaltSurgeWideD.png";
    }
    if (t.brandFaviconUrl && (t.brandFaviconUrl.includes(BLOCKED_URL_PART) || t.brandFaviconUrl.includes(LEGACY_LOGO))) {
        t.brandFaviconUrl = "/Surge.png";
    }
    return t;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Params
        const type = searchParams.get("type") || "z-report"; // z-report, x-report, employee, hourly
        const format = searchParams.get("format") || "json"; // json, zip
        const startTs = Number(searchParams.get("start"));
        const endTs = Number(searchParams.get("end"));

        // Auth Context
        const sessionId = searchParams.get("sessionId"); // Terminal Access
        const adminWallet = req.headers.get("x-linked-wallet"); // Admin Access (if coming from Admin Panel)
        const targetMerchantWallet = req.headers.get("x-wallet"); // Required for context

        if (!startTs || !endTs || !targetMerchantWallet) {
            return NextResponse.json({ error: "Missing required params (start, end, wallet)" }, { status: 400 });
        }

        const container = await getContainer();
        const w = String(targetMerchantWallet).toLowerCase();

        // --- AUTHENTICATION ---
        let authorized = false;
        let staffName = "Admin";

        if (sessionId) {
            // 1. Terminal Session Authentication
            const sessionQuery = {
                query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'terminal_session'",
                parameters: [{ name: "@id", value: sessionId }]
            };
            const { resources: sessions } = await container.items.query(sessionQuery).fetchAll();
            const session = sessions[0];

            if (session && session.merchantWallet === w) {
                const role = String(session.role || "").toLowerCase();
                if (role === "manager" || role === "keyholder") {
                    authorized = true;
                    staffName = session.staffName || "Staff";
                }
            }
        } else if (adminWallet) {
            // 2. Admin Authentication (Multi-Org Linked Wallet)
            // Verify that 'adminWallet' is actually a linked manager for 'targetMerchantWallet'
            // We trust 'adminWallet' from header? No, usually we'd verify a signature or session token.
            // For this MVP, we assume the API is protected or we double check the DB.
            // Ideally we'd validte a session token that resolves to adminWallet.
            // Here we will query to ensure the LINK exists.

            const memberQuery = {
                query: "SELECT * FROM c WHERE c.merchantWallet = @mw AND c.type = 'merchant_team_member' AND c.linkedWallet = @lw AND c.role = 'manager'",
                parameters: [
                    { name: "@mw", value: w },
                    { name: "@lw", value: String(adminWallet).toLowerCase() }
                ]
            };
            const { resources: members } = await container.items.query(memberQuery).fetchAll();
            if (members.length > 0) {
                authorized = true;
                staffName = members[0].name;
            }
        }

        if (!authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // --- DATA AGGREGATION ---

        // Base Receipt Query
        const receiptsQuery = {
            query: `
                SELECT c.totalUsd, c.tipAmount, c.currency, c.paymentMethod, c.createdAt, c.employeeId
                FROM c 
                WHERE c.type = 'receipt' 
                AND c.merchantWallet = @w 
                AND c._ts >= @start 
                AND c._ts <= @end
            `,
            parameters: [
                { name: "@w", value: w },
                { name: "@start", value: startTs },
                { name: "@end", value: endTs }
            ]
        };

        const { resources: receipts } = await container.items.query(receiptsQuery).fetchAll();

        // Calculate Stats
        const totalSales = receipts.reduce((acc: number, r: any) => acc + (r.totalUsd || 0), 0);
        const totalTips = receipts.reduce((acc: number, r: any) => acc + (r.tipAmount || 0), 0);
        const transactionCount = receipts.length;
        const averageOrderValue = transactionCount > 0 ? totalSales / transactionCount : 0;
        const net = totalSales - 0; // Refunds not yet tracked fully?

        // Payment Methods Breakdown
        const methodMap = new Map<string, number>();
        for (const r of receipts) {
            const m = r.paymentMethod || r.currency || "Unknown";
            const val = r.totalUsd || 0;
            methodMap.set(m, (methodMap.get(m) || 0) + val);
        }
        const paymentMethods = Array.from(methodMap.entries()).map(([method, total]) => ({ method, total }));

        // Specialized Data based on Type
        let detailedData: any = {};

        if (type === "employee") {
            const empMap = new Map<string, { sales: number, tips: number, count: number }>();
            for (const r of receipts) {
                const eid = r.employeeId || "Unknown";
                if (!empMap.has(eid)) empMap.set(eid, { sales: 0, tips: 0, count: 0 });
                const e = empMap.get(eid)!;
                e.sales += (r.totalUsd || 0);
                e.tips += (r.tipAmount || 0);
                e.count += 1;
            }
            detailedData.employees = Array.from(empMap.entries()).map(([id, stats]) => ({
                id,
                ...stats,
                aov: stats.count > 0 ? stats.sales / stats.count : 0
            }));
        } else if (type === "hourly") {
            const hourMap = new Array(24).fill(0);
            for (const r of receipts) {
                const d = new Date(r.createdAt || 0);
                const h = d.getHours(); // This uses Server Time (UTC probably), client might need local adjust.
                // Ideally we use local offset passed in params, but for now simplistic UTC mapping 
                hourMap[h] += (r.totalUsd || 0);
            }
            detailedData.hourly = hourMap.map((amount, hour) => ({ hour, amount }));
        }

        const reportData = {
            meta: {
                type,
                generatedBy: staffName,
                date: new Date(startTs * 1000).toISOString(),
                range: { start: startTs, end: endTs }
            },
            summary: {
                totalSales,
                totalTips,
                transactionCount,
                averageOrderValue,
                net
            },
            paymentMethods,
            ...detailedData,
            receipts: receipts.map((r: any) => ({
                id: r.id,
                totalUsd: r.totalUsd,
                currency: r.currency,
                paymentMethod: r.paymentMethod,
                createdAt: r.createdAt,
                employeeId: r.employeeId
            }))
        };

        // --- RESPONSE FORMAT ---

        if (format === "json") {
            return NextResponse.json(reportData);
        } else if (format === "zip") {
            // Need Store Config for Branding
            const configQuery = {
                query: "SELECT * FROM c WHERE c.wallet = @w AND c.type = 'shop_config'",
                parameters: [{ name: "@w", value: w }]
            };
            const { resources: configs } = await container.items.query(configQuery).fetchAll();
            const config = configs[0] || { name: "Merchant", theme: {} };
            if (config.theme) config.theme = sanitizeShopTheme(config.theme);

            const reportTitleMap: Record<string, string> = {
                "z-report": "End of Day Report (Z)",
                "x-report": "Snapshot Report (X)",
                "employee": "Employee Performance Report",
                "hourly": "Hourly Sales Report"
            };

            // PDF
            const pdfStream = await renderToStream(
                <EndOfDayPDF
                    brandName={config.name || "Merchant"}
                    logoUrl={config.theme?.brandLogoUrl}
                    date={new Date(startTs * 1000).toLocaleDateString()}
                    generatedBy={staffName}
                    reportTitle={reportTitleMap[type] || "Report"}
                    stats={{
                        totalSales,
                        totalTips,
                        transactionCount,
                        averageOrderValue
                    }}
                    paymentMethods={paymentMethods}
                    employees={detailedData.employees}
                    hourly={detailedData.hourly}
                />
            );

            // Stream to Buffer
            const chunks: Uint8Array[] = [];
            for await (const chunk of pdfStream) chunks.push(chunk as Uint8Array);
            const pdfBuffer = Buffer.concat(chunks);

            // CSV
            let csv = "";

            if (type === "employee" && detailedData.employees) {
                const header = "EmployeeID,Sales,Tips,Orders,AvgOrder\n";
                const rows = detailedData.employees.map((e: any) =>
                    `${e.id},${e.sales},${e.tips},${e.count},${e.aov}`
                ).join("\n");
                csv = header + rows;
            } else if (type === "hourly" && detailedData.hourly) {
                const header = "Hour,SalesAmount\n";
                const rows = detailedData.hourly.map((h: any) =>
                    `${h.hour}:00,${h.amount}`
                ).join("\n");
                csv = header + rows;
            } else {
                // Default Z/X Report (Receipt Dump)
                const rows = receipts.map((r: any) => {
                    return `${r.currency},${r.paymentMethod || 'Unknown'},${r.totalUsd},${r.employeeId || ''},${new Date(r.createdAt || 0).toISOString()}`;
                });
                csv = "Currency,Method,AmountUSD,EmployeeID,Date\n" + rows.join("\n");
            }

            // Zip
            const zip = new JSZip();
            zip.file(`${type}_report.pdf`, pdfBuffer);
            zip.file(`${type}_data.csv`, csv);

            const zipData = await zip.generateAsync({ type: "uint8array" });

            return new NextResponse(new Blob([zipData as any]), {
                headers: {
                    "Content-Type": "application/zip",
                    "Content-Disposition": `attachment; filename="${type}-report-${startTs}.zip"`
                }
            });
        }

        return NextResponse.json({ error: "Invalid format" }, { status: 400 });

    } catch (e: any) {
        console.error("Report API Error", e);
        return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
    }
}
