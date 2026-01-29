"use client";

import React from "react";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cachedFetch } from "@/lib/client-api-cache";

export default function PrivacyPolicyPage() {
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
                        Privacy Policy
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Last updated: January 28, 2025
                    </p>
                </header>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Welcome to {displayBrandName} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our payment processing services.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We collect information that you provide directly to us, information we obtain automatically when you use our services, and information from third-party sources.
                        </p>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Personal Information</h3>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Identity Data:</strong> First name, last name, username, business name, and government-issued identification for verification purposes.</li>
                            <li><strong>Contact Data:</strong> Email address, phone number, billing address, and shipping address.</li>
                            <li><strong>Financial Data:</strong> Bank account details, cryptocurrency wallet addresses, payment card information, and transaction history.</li>
                            <li><strong>Technical Data:</strong> IP address, browser type and version, device information, operating system, time zone, and location data.</li>
                            <li><strong>Usage Data:</strong> Information about how you use our website, products, and services, including pages visited, features used, and actions taken.</li>
                            <li><strong>Marketing Data:</strong> Your preferences for receiving marketing communications and your communication preferences.</li>
                        </ul>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Automatically Collected Information</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            When you access our services, we automatically collect certain information including your IP address, device characteristics, browser information, operating system, referring URLs, and information about how you interact with our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use the information we collect for various purposes, including:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Processing and facilitating cryptocurrency and fiat payment transactions</li>
                            <li>Creating and managing your account</li>
                            <li>Providing customer support and responding to inquiries</li>
                            <li>Complying with legal and regulatory requirements, including KYC/AML obligations</li>
                            <li>Detecting, preventing, and addressing fraud, security breaches, and technical issues</li>
                            <li>Analyzing usage patterns to improve our services</li>
                            <li>Sending administrative information, updates, and marketing communications (with consent)</li>
                            <li>Enforcing our terms and conditions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Sharing Your Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may share your information in the following situations:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf, such as payment processing, data analysis, email delivery, hosting, and customer service.</li>
                            <li><strong>Business Partners:</strong> With merchants and business partners to facilitate transactions you initiate.</li>
                            <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of all or a portion of our assets.</li>
                            <li><strong>With Your Consent:</strong> In any other circumstances where you have provided explicit consent.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Cookies and Tracking Technologies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use cookies and similar tracking technologies to collect and track information about your browsing activities. Cookies are small data files stored on your device that help us improve your experience, analyze site traffic, and understand user behavior.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, some parts of our services may become inaccessible or not function properly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Data Retention</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law. When determining retention periods, we consider the nature and sensitivity of the data, potential risks of unauthorized use or disclosure, and applicable legal requirements.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            For financial transaction data, we retain records for a minimum of seven (7) years to comply with anti-money laundering regulations and tax requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Your Privacy Rights</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Depending on your location, you may have certain rights regarding your personal information:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Access:</strong> Request access to the personal information we hold about you.</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete personal information.</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal retention requirements.</li>
                            <li><strong>Data Portability:</strong> Request a copy of your data in a structured, commonly used, machine-readable format.</li>
                            <li><strong>Objection:</strong> Object to processing of your personal information for certain purposes.</li>
                            <li><strong>Withdrawal of Consent:</strong> Withdraw consent at any time where we rely on consent to process your information.</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            To exercise these rights, please contact us at{' '}
                            {isPartnerContainer && (brand as any)?.contactEmail ? (
                                <a href={`mailto:${(brand as any).contactEmail}`} className="text-indigo-400 hover:text-indigo-300">{(brand as any).contactEmail}</a>
                            ) : (
                                <a href="mailto:info@basalthq.com" className="text-indigo-400 hover:text-indigo-300">info@basalthq.com</a>
                            )}. We will respond to your request within 30 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">8. International Data Transfers</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. We take appropriate safeguards to ensure that your personal information remains protected in accordance with this privacy policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encryption, secure socket layer (SSL) technology, firewalls, and regular security assessments.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Children&apos;s Privacy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Third-Party Links</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our services may contain links to third-party websites, services, or applications. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of any third-party services you access.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Updates to This Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update this privacy policy from time to time. The updated version will be indicated by an updated &quot;Last updated&quot; date at the top of this page. We encourage you to review this privacy policy periodically to stay informed about how we are protecting your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have questions or comments about this privacy policy, or if you wish to exercise your privacy rights, please contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground"><strong>{displayBrandName}</strong></p>
                            {isPartnerContainer ? (
                                <>
                                    {(brand as any)?.contactEmail && (
                                        <p className="text-muted-foreground">Email: <a href={`mailto:${(brand as any).contactEmail}`} className="text-indigo-400 hover:text-indigo-300">{(brand as any).contactEmail}</a></p>
                                    )}
                                    {(brand as any)?.appUrl && (
                                        <p className="text-muted-foreground">Website: <a href={(brand as any).appUrl} className="text-indigo-400 hover:text-indigo-300">{(brand as any).appUrl}</a></p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="text-muted-foreground">Email: <a href="mailto:info@basalthq.com" className="text-indigo-400 hover:text-indigo-300">info@basalthq.com</a></p>
                                    <p className="text-muted-foreground">Website: <a href="https://basalthq.com" className="text-indigo-400 hover:text-indigo-300">https://basalthq.com</a></p>
                                </>
                            )}
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
