import React from "react";

export default function DevelopersSupportPage() {
    return (
        <div className="space-y-8 max-w-3xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Developer Resources</h1>
                <p className="text-lg text-muted-foreground">Technical documentation for the PortalPay API and SDKs.</p>
            </div>

            <div className="space-y-12">
                <section id="api-reference" className="space-y-4">
                    <h2 className="text-2xl font-bold border-b pb-2">API Reference</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p>
                            Our REST API allows you to create charges, manage customers, and retrieve transaction data programmatically.
                        </p>
                        <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm mt-4 overflow-x-auto">
                            <div>// Example: Create a Charge</div>
                            <div className="text-blue-400">POST /api/v1/charges</div>
                            <div>{`{`}</div>
                            <div className="pl-4"><span className="text-purple-400">"amount"</span>: <span className="text-green-400">100.00</span>,</div>
                            <div className="pl-4"><span className="text-purple-400">"currency"</span>: <span className="text-green-400">"USD"</span>,</div>
                            <div className="pl-4"><span className="text-purple-400">"description"</span>: <span className="text-green-400">"Order #1234"</span></div>
                            <div>{`}`}</div>
                        </div>
                    </div>
                </section>

                <section id="webhooks" className="space-y-4">
                    <h2 className="text-2xl font-bold border-b pb-2">Webhooks</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p>
                            Listen for real-time events to update your database when payments are completed or failed.
                        </p>
                        <table className="w-full mt-4 text-sm text-left">
                            <thead className="border-b font-medium">
                                <tr>
                                    <th className="py-2">Event</th>
                                    <th className="py-2">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="py-2 font-mono text-blue-600">charge.succeeded</td>
                                    <td className="py-2">Payment was successfully confirmed on the blockchain.</td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-mono text-blue-600">charge.failed</td>
                                    <td className="py-2">Payment failed or expired.</td>
                                </tr>
                                <tr>
                                    <td className="py-2 font-mono text-blue-600">payout.created</td>
                                    <td className="py-2">A payout to your connected wallet was initiated.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section id="security" className="space-y-4">
                    <h2 className="text-2xl font-bold border-b pb-2">Security</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p>
                            Ensure your integration is secure by following these best practices.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4">
                            <li><strong>Verify Signatures:</strong> Always verify the `X-PortalPay-Signature` header on webhook requests.</li>
                            <li><strong>API Keys:</strong> Keep your Secret Keys server-side. Never expose them in client-side code.</li>
                            <li><strong>Idempotency:</strong> Use idempotency keys to prevent duplicate charges during network retries.</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
}
