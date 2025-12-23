import React from "react";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-indigo-500/30">
            <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        Terms of Service
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </header>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Agreement to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Intellectual Property</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            The Service and its original content, features and functionality are and will remain the exclusive property of PortalPay and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of PortalPay.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Accounts</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            In no event shall PortalPay, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Governing Law</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            These Terms shall be governed and construed in accordance with the laws of United States, without regard to its conflict of law provisions.
                        </p>
                    </section>
                </div>

                <footer className="mt-20 pt-8 border-t text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} PortalPay. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
