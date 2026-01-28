"use client";

import React from "react";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cachedFetch } from "@/lib/client-api-cache";

export default function TermsOfServicePage() {
    const brand = useBrand();
    const { theme: rawTheme } = useTheme();
    const [containerBrandKey, setContainerBrandKey] = React.useState<string>("");
    const [containerType, setContainerType] = React.useState<string>("");

    // Fetch container identity to get brandKey for partner containers
    React.useEffect(() => {
        let cancelled = false;
        cachedFetch("/api/site/container", { cache: "no-store" })
            .then((ci: any) => {
                if (cancelled) return;
                setContainerBrandKey(String(ci?.brandKey || "").trim());
                setContainerType(String(ci?.containerType || "").trim());
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, []);

    // Detect if this is a partner container
    const isPartnerContainer = React.useMemo(() => {
        const ctFromState = containerType.toLowerCase();
        const ctFromAttr = typeof document !== "undefined"
            ? (document.documentElement.getAttribute("data-pp-container-type") || "").toLowerCase()
            : "";
        return ctFromState === "partner" || ctFromAttr === "partner";
    }, [containerType]);

    const displayBrandName = React.useMemo(() => {
        // Helper to fix BasaltSurge capitalization
        const fixBasaltSurge = (name: string) =>
            name.toLowerCase() === "basaltsurge" ? "BasaltSurge" : name;

        try {
            const raw = String(rawTheme?.brandName || "").trim();
            const generic = /^ledger\d*$/i.test(raw) || /^partner\d*$/i.test(raw) || /^default$/i.test(raw);
            // In partner containers, also treat "PortalPay" as generic to force using the brand key
            const treatAsGeneric = generic || (isPartnerContainer && /^portalpay$/i.test(raw));
            // Prefer container brand key over context brand key
            const key = containerBrandKey || String((brand as any)?.key || "").trim();
            const titleizedKey = key ? key.charAt(0).toUpperCase() + key.slice(1) : "BasaltSurge";
            const result = (!raw || treatAsGeneric) ? titleizedKey : raw;
            return fixBasaltSurge(result);
        } catch {
            const key = containerBrandKey || String((brand as any)?.key || "").trim();
            const fallback = key ? key.charAt(0).toUpperCase() + key.slice(1) : "BasaltSurge";
            return fixBasaltSurge(fallback);
        }
    }, [rawTheme?.brandName, containerBrandKey, (brand as any)?.key, isPartnerContainer]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-indigo-500/30">
            <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        Terms of Service
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Last updated: January 28, 2025
                    </p>
                </header>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Agreement to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you and {displayBrandName} (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) governing your access to and use of our website, mobile applications, and payment processing services (collectively, the &quot;Services&quot;).
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access or use our Services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Eligibility</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To use our Services, you must:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Be at least 18 years of age or the age of legal majority in your jurisdiction</li>
                            <li>Have the legal capacity to enter into a binding agreement</li>
                            <li>Not be prohibited from using our Services under applicable laws</li>
                            <li>Not be located in a jurisdiction where our Services are prohibited</li>
                            <li>Complete our identity verification process as required</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            If you are using our Services on behalf of a business entity, you represent and warrant that you have the authority to bind that entity to these Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Account Registration</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To access certain features of our Services, you must create an account. When creating an account, you agree to:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Provide accurate, current, and complete information</li>
                            <li>Maintain and promptly update your account information</li>
                            <li>Maintain the security and confidentiality of your login credentials</li>
                            <li>Accept responsibility for all activities that occur under your account</li>
                            <li>Notify us immediately of any unauthorized use of your account</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            We reserve the right to suspend or terminate your account if any information provided is inaccurate, false, or no longer current.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Services Description</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {displayBrandName} provides payment processing services that enable merchants to accept cryptocurrency and fiat currency payments. Our Services include:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Cryptocurrency payment processing and settlement</li>
                            <li>Fiat currency on-ramp and off-ramp services</li>
                            <li>Point-of-sale terminal solutions</li>
                            <li>E-commerce payment integration</li>
                            <li>Transaction monitoring and reporting</li>
                            <li>Multi-currency wallet management</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Payment Terms and Fees</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By using our payment processing Services, you agree to the following:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Transaction Fees:</strong> We charge fees for processing transactions as outlined in our fee schedule. Fees may vary based on payment method, currency, and volume.</li>
                            <li><strong>Settlement:</strong> Funds will be settled to your designated account according to our settlement schedule. Settlement times may vary based on payment method and verification status.</li>
                            <li><strong>Chargebacks and Disputes:</strong> You are responsible for chargebacks, disputes, and reversals initiated by customers. We may deduct disputed amounts from your balance pending resolution.</li>
                            <li><strong>Currency Conversion:</strong> Exchange rates for currency conversions are determined at the time of transaction and include applicable spreads.</li>
                            <li><strong>Refunds:</strong> You are responsible for processing refunds to customers. Original transaction fees may not be refundable.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Acceptable Use Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree not to use our Services for:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Any illegal, fraudulent, or unauthorized purpose</li>
                            <li>Money laundering, terrorist financing, or other financial crimes</li>
                            <li>Violating any applicable laws, regulations, or third-party rights</li>
                            <li>Processing transactions for prohibited goods or services</li>
                            <li>Circumventing our security measures or verification processes</li>
                            <li>Interfering with or disrupting our Services or servers</li>
                            <li>Creating false or misleading accounts or transactions</li>
                            <li>Engaging in market manipulation or wash trading</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            We reserve the right to suspend or terminate accounts that violate this Acceptable Use Policy without prior notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Intellectual Property</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Services and all content, features, and functionality (including but not limited to software, text, graphics, logos, icons, and images) are owned by {displayBrandName} or its licensors and are protected by copyright, trademark, and other intellectual property laws.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            You may not copy, modify, distribute, sell, or lease any part of our Services without our prior written consent. You may not reverse engineer or attempt to extract the source code of our software.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Disclaimer of Warranties</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            OUR SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            We do not warrant that our Services will be uninterrupted, error-free, or secure. We do not guarantee the accuracy, completeness, or timeliness of information provided through our Services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL {displayBrandName}, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Loss of profits, revenue, or data</li>
                            <li>Business interruption</li>
                            <li>Loss of use or goodwill</li>
                            <li>Procurement of substitute goods or services</li>
                            <li>Damages resulting from unauthorized access, alteration of transmissions or data, or any third-party conduct</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Our total liability to you for any claims arising out of or relating to these Terms or our Services shall not exceed the amount of fees you paid to us in the twelve (12) months preceding the claim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Indemnification</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree to indemnify, defend, and hold harmless {displayBrandName} and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys&apos; fees) arising out of or relating to:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Your use of our Services</li>
                            <li>Your violation of these Terms</li>
                            <li>Your violation of any third-party rights</li>
                            <li>Any content or data you submit through our Services</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may terminate or suspend your account and access to our Services immediately, without prior notice or liability, for any reason, including but not limited to:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Breach of these Terms</li>
                            <li>Violation of applicable laws or regulations</li>
                            <li>Fraudulent or illegal activity</li>
                            <li>Failure to pass verification requirements</li>
                            <li>Request by law enforcement or government agencies</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Upon termination, your right to use our Services will cease immediately. We may retain your data as required by applicable laws and for legitimate business purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Dispute Resolution</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Any disputes arising out of or relating to these Terms or our Services shall first be attempted to be resolved through informal negotiation. If the dispute cannot be resolved informally, both parties agree to submit the dispute to binding arbitration in accordance with the rules of the American Arbitration Association.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            You agree that any arbitration shall be conducted on an individual basis and not as a class action or representative proceeding. You waive any right to participate in a class action lawsuit or class-wide arbitration.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. You consent to the exclusive jurisdiction of the federal and state courts located in Delaware for any legal action or proceeding.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">14. Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            By continuing to access or use our Services after those revisions become effective, you agree to be bound by the revised Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">15. Severability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If any provision of these Terms is held to be unenforceable or invalid, such provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">16. Contact Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground"><strong>{displayBrandName}</strong></p>
                            <p className="text-muted-foreground">Email: <a href="mailto:info@basalthq.com" className="text-indigo-400 hover:text-indigo-300">info@basalthq.com</a></p>
                            <p className="text-muted-foreground">Website: <a href="https://basalthq.com" className="text-indigo-400 hover:text-indigo-300">https://basalthq.com</a></p>
                        </div>
                    </section>
                </div>

                <footer className="mt-20 pt-8 border-t text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} {displayBrandName}. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
