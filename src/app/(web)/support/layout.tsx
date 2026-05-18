import React from "react";
import Link from "next/link";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 border-r bg-muted/10 p-4 md:min-h-screen shrink-0">
                <div className="font-bold text-lg mb-6 px-2">Support Center</div>
                <nav className="space-y-6">
                    <div>
                        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Overview
                        </div>
                        <div className="space-y-1">
                            <Link href="/support" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Home
                            </Link>
                            <Link href="/support#contact" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Contact Us
                            </Link>
                        </div>
                    </div>

                    <div>
                        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            For Merchants
                        </div>
                        <div className="space-y-1">
                            <Link href="/support/merchants" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Getting Started
                            </Link>
                            <Link href="/support/merchants#payments" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Payments & Payouts
                            </Link>
                            <Link href="/support/merchants#orders" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Order Management
                            </Link>
                        </div>
                    </div>

                    <div>
                        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            For Partners
                        </div>
                        <div className="space-y-1">
                            <Link href="/support/partners" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Partner Program
                            </Link>
                            <Link href="/support/partners#integrations" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Building Integrations
                            </Link>
                            <Link href="/support/partners#brands" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Managing Brands
                            </Link>
                        </div>
                    </div>

                    <div>
                        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Developers
                        </div>
                        <div className="space-y-1">
                            <Link href="/support/developers" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                API Reference
                            </Link>
                            <Link href="/support/developers#webhooks" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Webhooks
                            </Link>
                            <Link href="/support/developers#security" className="block px-2 py-1.5 text-sm rounded-md hover:bg-foreground/5 transition">
                                Security
                            </Link>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                <div className="max-w-4xl mx-auto p-6 md:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
