"use client";

import React from "react";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cachedFetch } from "@/lib/client-api-cache";

export default function AIDataProcessingPage() {
    const brand = useBrand();
    const { theme: rawTheme } = useTheme();
    const [containerBrandKey, setContainerBrandKey] = React.useState<string>("");
    const [containerType, setContainerType] = React.useState<string>("");
    const [hasReachedBottom, setHasReachedBottom] = React.useState(false);
    const [isTracking, setIsTracking] = React.useState(false);

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

    // Scroll-to-bottom tracking for auth modal read verification
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        if (params.get("track") !== "1") return;
        setIsTracking(true);

        const onScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const clientHeight = window.innerHeight;
            const scrollHeight = document.documentElement.scrollHeight;
            if (scrollTop + clientHeight >= scrollHeight - 80) {
                setHasReachedBottom(true);
                try {
                    const bc = new BroadcastChannel("legal-read");
                    bc.postMessage({ doc: "aidpa", read: true });
                    bc.close();
                } catch { }
                window.removeEventListener("scroll", onScroll);
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        // Check immediately in case the page is short enough
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
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
        const fixBasaltSurge = (name: string) =>
            name.toLowerCase() === "basaltsurge" ? "BasaltSurge" : name;

        try {
            const raw = String(rawTheme?.brandName || "").trim();
            const generic = /^ledger\d*$/i.test(raw) || /^partner\d*$/i.test(raw) || /^default$/i.test(raw);
            const treatAsGeneric = generic || (isPartnerContainer && /^portalpay$/i.test(raw));
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
                        AI Data Processing Agreement
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Last updated: March 8, 2026
                    </p>
                </header>

                {/* Tracking indicator */}
                {isTracking && (
                    <div className={`sticky top-4 z-50 mx-auto max-w-md mb-8 px-4 py-3 rounded-lg border text-center text-xs font-semibold uppercase tracking-wide transition-all duration-500 ${hasReachedBottom
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}>
                        {hasReachedBottom ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Agreement reviewed — you may close this window
                            </span>
                        ) : (
                            <span>↓ Please scroll to the bottom to confirm you have read this agreement</span>
                        )}
                    </div>
                )}

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction and Scope</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            This AI Data Processing Agreement (&quot;AIDPA&quot; or &quot;Agreement&quot;) is entered into between you (&quot;Merchant,&quot; &quot;you,&quot; or &quot;your&quot;) and {displayBrandName} (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). This Agreement governs the processing of personal data by artificial intelligence (&quot;AI&quot;) and machine learning (&quot;ML&quot;) systems deployed within our payment processing, analytics, fraud detection, and business intelligence services (collectively, the &quot;AI-Powered Services&quot;).
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            This Agreement supplements and is incorporated into our Terms of Service and Privacy Policy. In the event of a conflict between this Agreement and the Privacy Policy regarding AI-specific data processing, this Agreement shall prevail. This Agreement is designed to comply with the California Consumer Privacy Act (CCPA), the California Privacy Rights Act (CPRA), and all applicable AI transparency and data protection regulations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Definitions</h2>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Automated Decision-Making (ADM):</strong> Any decision made by technological means without human involvement, including decisions made using AI/ML models that produce legal or similarly significant effects.</li>
                            <li><strong>Profiling:</strong> Any form of automated processing of personal data consisting of using data to evaluate, analyze, or predict aspects concerning an individual&apos;s behavior, preferences, reliability, or creditworthiness.</li>
                            <li><strong>AI Model:</strong> Any machine learning model, neural network, statistical model, or algorithmic system used to process, analyze, classify, or make predictions based on personal or transaction data.</li>
                            <li><strong>Training Data:</strong> Data used to develop, calibrate, train, validate, or improve AI Models.</li>
                            <li><strong>Sensitive Personal Information:</strong> As defined under CCPA/CPRA, includes Social Security numbers, financial account information, precise geolocation data, biometric data, and other categories specified under Cal. Civ. Code § 1798.140(ae).</li>
                            <li><strong>Consumer:</strong> Any California resident, or any individual whose data is subject to California privacy law, whose personal information is processed through our AI-Powered Services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Categories of Data Processed by AI Systems</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our AI-Powered Services process the following categories of data:
                        </p>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">3.1 Transaction Data</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
                            <li>Payment amounts, currency types (fiat and cryptocurrency), and timestamps</li>
                            <li>Blockchain wallet addresses and on-chain transaction hashes</li>
                            <li>Payment method identifiers (card type, token address)</li>
                            <li>Transaction success/failure states and error codes</li>
                            <li>Settlement and reconciliation data</li>
                        </ul>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">3.2 Merchant Operational Data</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
                            <li>Sales patterns, volume trends, and revenue analytics</li>
                            <li>Inventory levels, product categories, and pricing data</li>
                            <li>Customer demographics and behavioral analytics (aggregated)</li>
                            <li>Operational metrics (order fulfillment, service times)</li>
                        </ul>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">3.3 Identity and Verification Data</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
                            <li>KYC/AML compliance data (government-issued identification, business registration)</li>
                            <li>Digital wallet signatures and cryptographic proofs</li>
                            <li>Device fingerprints and session metadata for fraud detection</li>
                            <li>IP addresses, geolocation data, and browser characteristics</li>
                        </ul>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">3.4 Communication Data</h3>
                        <ul className="list-disc pl-6 mt-2 space-y-2 text-muted-foreground">
                            <li>Support ticket content and customer service interactions</li>
                            <li>Voice agent transcriptions and sentiment analysis outputs</li>
                            <li>Automated notification metadata and delivery analytics</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Purposes of AI Data Processing</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We process personal data through AI systems exclusively for the following purposes. We do not process personal data for purposes incompatible with those listed below without obtaining additional consent.
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Fraud Detection and Prevention:</strong> Real-time transaction monitoring, anomaly detection, risk scoring, and pattern recognition to identify potentially fraudulent activity.</li>
                            <li><strong>Payment Optimization:</strong> Intelligent routing of transactions, dynamic fee calculation, currency conversion optimization, and settlement timing.</li>
                            <li><strong>Business Intelligence:</strong> Generating merchant dashboards, predictive analytics, revenue forecasting, and operational recommendations.</li>
                            <li><strong>Compliance and Regulatory:</strong> Automated KYC/AML screening, sanctions list checking, transaction monitoring for regulatory reporting, and suspicious activity detection.</li>
                            <li><strong>Customer Experience:</strong> AI-powered customer support (voice and text agents), personalized merchant onboarding recommendations, and service quality optimization.</li>
                            <li><strong>Platform Integrity:</strong> Detecting spam, abuse, and Terms of Service violations to maintain platform security and trustworthiness.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Automated Decision-Making and Profiling</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            In accordance with the CPRA and best-practice AI governance principles, we disclose the following automated decision-making processes:
                        </p>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">5.1 Fraud Risk Scoring</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Our systems assign risk scores to transactions based on behavioral patterns, device characteristics, and historical data. Transactions exceeding defined thresholds may be automatically flagged, delayed, or declined. Risk scores are derived from ensemble models that consider velocity checks, geographic anomalies, and device reputation signals.
                        </p>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">5.2 Merchant Verification</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            AI models are used to screen merchant applications for compliance with underwriting criteria, regulatory requirements, and risk appetite. These models may influence, but do not solely determine, approval or denial decisions — a human reviewer participates in final determinations for all merchant account decisions.
                        </p>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">5.3 Dynamic Fee Calculation</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Processing fees may be influenced by AI-driven risk assessments, volume predictions, and market conditions. Fee structures are governed by your merchant agreement and are subject to the disclosed fee schedule.
                        </p>

                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">5.4 Right to Human Review</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to request human review of any automated decision that produces legal or similarly significant effects. To request human review, contact us at the address provided in Section 16. We will respond to such requests within fifteen (15) business days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Algorithmic Transparency</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We commit to meaningful transparency regarding our AI systems:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Model Documentation:</strong> We maintain internal documentation describing the logic, training methodology, and intended outputs of each AI model deployed in production.</li>
                            <li><strong>Impact Assessments:</strong> We conduct regular algorithmic impact assessments to evaluate our AI systems for accuracy, bias, fairness, and disparate impact across protected classes.</li>
                            <li><strong>Output Explainability:</strong> For decisions that significantly affect merchants or consumers, we can provide a meaningful explanation of the principal factors that led to the decision.</li>
                            <li><strong>Audit Trails:</strong> All AI-driven decisions that affect transaction processing, account status, or financial outcomes are logged with sufficient detail to reconstruct the reasoning process.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Consumer Rights Under California Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Consistent with the CCPA and CPRA, consumers and merchants have the following rights with respect to AI data processing:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Right to Know:</strong> You may request disclosure of the categories of personal information used in AI processing, the purposes for such processing, and the categories of third parties with whom AI-derived insights are shared (Cal. Civ. Code § 1798.110).</li>
                            <li><strong>Right to Delete:</strong> You may request deletion of personal information used in AI processing, subject to legal retention requirements for financial records and regulatory compliance (Cal. Civ. Code § 1798.105).</li>
                            <li><strong>Right to Correct:</strong> You may request correction of inaccurate personal information that is used as input to AI models (Cal. Civ. Code § 1798.106).</li>
                            <li><strong>Right to Opt-Out of Automated Decision-Making:</strong> You may opt out of profiling and automated decision-making technologies that produce legal or similarly significant effects (Cal. Civ. Code § 1798.185(a)(16)).</li>
                            <li><strong>Right to Limit Use of Sensitive Personal Information:</strong> You may limit the use of sensitive personal information to that which is necessary to perform the services (Cal. Civ. Code § 1798.121).</li>
                            <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of your privacy rights.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Right to Opt-Out</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You may opt out of certain AI data processing activities while continuing to use our core payment services. Opting out may result in the following limitations:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Predictive analytics and business intelligence features may be unavailable</li>
                            <li>AI-powered customer support features may revert to manual support queues</li>
                            <li>Personalized recommendations and operational insights may not be generated</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            <strong>Note:</strong> You may not opt out of AI processing required for fraud detection, regulatory compliance, or platform security, as these uses are necessary for the performance of the contract and compliance with legal obligations.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            To exercise your opt-out rights, submit a verifiable request through the contact details in Section 16. We will process your request within forty-five (45) calendar days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">9. AI Training Data Practices</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We are committed to responsible AI training practices:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>No Direct PII in Training:</strong> Personal information is de-identified, aggregated, or pseudonymized before use as Training Data. Raw personal data is not used to train general-purpose AI models.</li>
                            <li><strong>Merchant Data Isolation:</strong> Each merchant&apos;s data is logically isolated within our multi-tenant architecture. AI models trained on aggregate platform data do not leak individual merchant information.</li>
                            <li><strong>Opt-Out of Training:</strong> You may request that your data not be used for AI model training or improvement purposes. This does not affect real-time inference (e.g., fraud detection) on your transactions.</li>
                            <li><strong>No Sale of AI-Derived Insights:</strong> We do not sell, rent, or trade AI-derived insights, predictions, or profiles to third parties for their own commercial purposes.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Third-Party AI Sub-Processors</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may engage third-party AI service providers (&quot;Sub-Processors&quot;) to deliver certain AI-Powered Services. All Sub-Processors are bound by data processing agreements that require:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Processing only in accordance with our documented instructions</li>
                            <li>Implementation of appropriate technical and organizational security measures</li>
                            <li>Compliance with all applicable data protection and AI governance regulations</li>
                            <li>Prohibition on using merchant or consumer data for the Sub-Processor&apos;s own model training without explicit consent</li>
                            <li>Prompt notification of any data breach, model failure, or AI incident</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Current categories of AI Sub-Processors include: cloud infrastructure providers, payment fraud detection services, natural language processing providers, and blockchain analytics services. A current list of Sub-Processors is available upon written request.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Cross-Border Data Transfers</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            AI processing may involve the transfer of data to servers located outside of California or the United States. Where such transfers occur, we ensure appropriate safeguards are in place, including:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Standard Contractual Clauses or equivalent mechanisms approved by applicable data protection authorities</li>
                            <li>Encryption of data in transit and at rest using industry-standard protocols (AES-256, TLS 1.3)</li>
                            <li>Access controls limiting data access to authorized personnel on a need-to-know basis</li>
                            <li>Data residency options for merchants requiring data to remain within specific jurisdictions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Data Retention and Deletion</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Data processed by AI systems is retained in accordance with the following schedule:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Transaction Data:</strong> Retained for a minimum of seven (7) years for regulatory compliance (AML/BSA requirements).</li>
                            <li><strong>AI Model Outputs:</strong> Risk scores, predictions, and classifications are retained for three (3) years or the duration of the merchant relationship, whichever is longer.</li>
                            <li><strong>Training Data:</strong> De-identified training datasets are retained for the useful life of the associated AI model, plus two (2) years for audit purposes.</li>
                            <li><strong>Audit Logs:</strong> AI decision logs are retained for five (5) years to support regulatory inquiries and internal audits.</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Upon account termination, we will delete or de-identify personal data used in AI processing within ninety (90) calendar days, except where retention is required by law. You may request early deletion subject to regulatory constraints.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Security Safeguards</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We implement comprehensive security measures to protect data processed by AI systems:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li><strong>Model Security:</strong> AI models are protected against adversarial attacks, data poisoning, and model extraction through input validation, anomaly detection, and access controls.</li>
                            <li><strong>Infrastructure Security:</strong> AI workloads run in isolated environments with network segmentation, encrypted storage, and multi-factor authentication for all administrative access.</li>
                            <li><strong>Data Minimization:</strong> AI models are designed to use the minimum amount of personal data necessary to achieve the stated purpose.</li>
                            <li><strong>Regular Testing:</strong> Penetration testing, red-team exercises, and vulnerability assessments are conducted at least annually on AI infrastructure.</li>
                            <li><strong>Bias Monitoring:</strong> Continuous monitoring of AI outputs for statistical bias, fairness violations, and unintended discrimination across demographic groups.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">14. AI Incident Response</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            In the event of an AI-specific incident (including model failure, biased output discovery, data breach affecting AI systems, or unauthorized access to AI-derived insights), we will:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                            <li>Notify affected merchants within seventy-two (72) hours of discovery</li>
                            <li>Immediately suspend the affected AI model or system pending investigation</li>
                            <li>Conduct a root cause analysis and implement corrective measures</li>
                            <li>Report to applicable regulatory authorities as required by law</li>
                            <li>Provide a written incident report to affected parties within thirty (30) days</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">15. Children&apos;s Data</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our AI-Powered Services are not directed at individuals under the age of 18. We do not knowingly use AI systems to process personal data of minors. If we discover that AI models have processed data attributable to a minor, we will promptly delete such data and retrain affected models as necessary.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">16. Amendments</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update this Agreement to reflect changes in our AI practices, applicable law, or regulatory guidance. Material changes will be communicated at least thirty (30) days in advance via email or through the merchant dashboard. Continued use of AI-Powered Services following notice constitutes acceptance of the updated terms. If you do not agree to the changes, you may terminate your use of AI-Powered Services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">17. Governing Law and Dispute Resolution</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            This Agreement shall be governed by and construed in accordance with the laws of the State of California, United States, including the CCPA and CPRA as amended. Any dispute arising under this Agreement shall be subject to the dispute resolution provisions set forth in our Terms of Service. For AI-specific complaints, you may also contact the California Privacy Protection Agency (CPPA) or the California Attorney General&apos;s office.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">18. Contact Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For questions, concerns, or requests related to AI data processing, including exercising your rights under this Agreement, please contact us at:
                        </p>
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground"><strong>{displayBrandName}</strong></p>
                            <p className="text-muted-foreground">AI Data Processing Inquiries</p>
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
                                    <p className="text-muted-foreground">Email: <a href="mailto:legal@basalthq.com" className="text-indigo-400 hover:text-indigo-300">legal@basalthq.com</a></p>
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
