"use client";

import React from "react";
import { useActiveAccount, ConnectButton } from "thirdweb/react";
import { client, chain } from "@/lib/thirdweb/client";
import { useBrand } from "@/contexts/BrandContext";
import { useTheme } from "@/contexts/ThemeContext";
import RewardsPanel from "@/app/admin/panels/RewardsPanel";
import { Heart, Wallet } from "lucide-react";

export default function LoyaltyPage() {
    const account = useActiveAccount();
    const brand = useBrand();
    const { theme } = useTheme();
    const brandName = theme?.brandName || brand?.name || "PortalPay";

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {theme?.brandLogoUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={theme.brandLogoUrl}
                                alt={brandName}
                                className="h-8 w-auto object-contain"
                            />
                        )}
                        <div>
                            <h1 className="text-lg font-bold flex items-center gap-2">
                                <Heart className="h-4 w-4 text-primary" />
                                {brandName} Loyalty
                            </h1>
                            <p className="text-xs text-muted-foreground">Rewards & Level Progression</p>
                        </div>
                    </div>

                    <ConnectButton
                        client={client}
                        chain={chain}
                        connectButton={{
                            label: "Connect Wallet",
                            className: "!rounded-xl !px-4 !py-2 !text-sm !font-semibold",
                        }}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {!account?.address ? (
                    /* Not Connected State */
                    <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
                        <div className="h-20 w-20 rounded-2xl bg-primary/10 grid place-items-center">
                            <Wallet className="h-10 w-10 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                            <p className="text-muted-foreground max-w-md">
                                Connect your wallet to view your loyalty status, XP progress,
                                level rewards, and transaction history across all merchants.
                            </p>
                        </div>
                        <ConnectButton
                            client={client}
                            chain={chain}
                            connectButton={{
                                label: "Connect Wallet to View Rewards",
                                className: "!rounded-xl !px-6 !py-3 !text-base !font-bold",
                            }}
                        />
                    </div>
                ) : (
                    /* Connected — Show Full Rewards Panel */
                    <RewardsPanel />
                )}
            </div>
        </div>
    );
}
