"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignupWizard } from "@/components/signup-wizard";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

export default function ApplyPage() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        // Trigger the wizard to open immediately
        setIsOpen(true);
    }, []);

    // Default fallbacks if theme is loading or missing
    const primary = theme?.primaryColor || "#10b981"; // Emerald
    const secondary = theme?.secondaryColor || "#06b6d4"; // Cyan
    // Generate a tertiary color based on hue rotation or simple variant
    const tertiary = primary;

    return (
        <div className="min-h-[100dvh] w-full bg-black relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated Gradient Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] mix-blend-screen"
                    style={{ background: `radial-gradient(circle, ${primary}4D 0%, transparent 70%)` }}
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, 100, 0],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[100px] mix-blend-screen"
                    style={{ background: `radial-gradient(circle, ${secondary}4d 0%, transparent 70%)` }}
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        y: [0, -50, 0],
                        opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full blur-[130px] mix-blend-screen"
                    style={{ background: `radial-gradient(circle, ${primary}33 0%, transparent 70%)` }}
                />
            </div>

            {/* Moving Grid Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none perspective-grid" />

            <style jsx global>{`
                .perspective-grid {
                    background-size: 50px 50px;
                    background-image:
                        linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                    animation: grid-move 20s linear infinite;
                }
                @keyframes grid-move {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(50px); }
                }
            `}</style>

            {/* The Wizard Component */}
            <SignupWizard
                isOpen={isOpen}
                onClose={() => router.push('/')}
                onComplete={() => router.push('/admin')}
                inline
            />
        </div>
    );
}
