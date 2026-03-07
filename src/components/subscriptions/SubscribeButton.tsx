"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { base } from "thirdweb/chains";
import {
    spendPermissionDomain,
    spendPermissionTypes,
    buildSpendPermission,
    BASE_USDC_ADDRESS,
    BASE_USDC_DECIMALS,
    type BillingPeriod,
} from "@/lib/eip712-subscriptions";
import {
    CheckCircle,
    Loader2,
    Wallet,
    AlertTriangle,
    ArrowRight,
} from "lucide-react";

type SubscribeButtonProps = {
    planId: string;
    planName: string;
    priceUsd: number;
    period: BillingPeriod;
    merchantWallet: string;
    /** Backend wallet (spender) address — from env or plan config */
    spenderWallet: string;
    onSuccess?: (subscriptionId: string) => void;
    onError?: (error: string) => void;
    className?: string;
};

/**
 * Customer-facing Subscribe Button.
 *
 * Flow:
 * 1. Check USDC balance → show funding prompt if low
 * 2. Build EIP-712 SpendPermission message
 * 3. Prompt wallet signature (signTypedData)
 * 4. POST /api/subscriptions/create with signature + permission data
 * 5. Show success
 */
export default function SubscribeButton({
    planId,
    planName,
    priceUsd,
    period,
    merchantWallet,
    spenderWallet,
    onSuccess,
    onError,
    className,
}: SubscribeButtonProps) {
    const account = useActiveAccount();
    const chain = useActiveWalletChain();
    const [step, setStep] = useState<"idle" | "signing" | "submitting" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [checkingBalance, setCheckingBalance] = useState(false);

    const customerWallet = account?.address?.toLowerCase() as `0x${string}` | undefined;
    const isConnected = !!customerWallet;
    const isCorrectChain = chain?.id === base.id;

    // Check USDC balance on connect
    const checkBalance = useCallback(async () => {
        if (!customerWallet) return;
        setCheckingBalance(true);
        try {
            // Use a simple eth_call to check USDC balance
            const balanceOfData = `0x70a08231000000000000000000000000${customerWallet.slice(2)}`;
            const response = await fetch(`https://mainnet.base.org`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "eth_call",
                    params: [
                        { to: BASE_USDC_ADDRESS, data: balanceOfData },
                        "latest",
                    ],
                    id: 1,
                }),
            });
            const json = await response.json();
            if (json?.result) {
                const raw = BigInt(json.result);
                setUsdcBalance(Number(raw) / 10 ** BASE_USDC_DECIMALS);
            }
        } catch (err) {
            console.warn("Failed to check USDC balance:", err);
        } finally {
            setCheckingBalance(false);
        }
    }, [customerWallet]);

    useEffect(() => {
        if (isConnected) checkBalance();
    }, [isConnected, checkBalance]);

    const needsFunding = usdcBalance !== null && usdcBalance < priceUsd;

    // Handle subscribe
    const handleSubscribe = async () => {
        if (!customerWallet || !account) {
            setErrorMsg("Connect your wallet first");
            setStep("error");
            return;
        }

        setStep("signing");
        setErrorMsg("");

        try {
            // Build the spend permission message
            const permission = buildSpendPermission({
                account: customerWallet,
                spender: spenderWallet as `0x${string}`,
                priceUsd,
                period,
                durationMonths: 12,
            });

            // Generate a Viem wallet client from the Thirdweb account
            // This is required because @base-org/account expects a Viem Provider/WalletClient
            // We need a custom EIP-1193 provider that calls the thirdweb account's sign message/send trans methods
            const provider = {
                request: async ({ method, params }: any) => {
                    if (method === "eth_accounts") {
                        return [customerWallet];
                    }
                    if (method === "eth_chainId") {
                        return `0x${base.id.toString(16)}`;
                    }
                    if (method === "wallet_sendCalls") {
                        const { sendCalls } = await import("thirdweb/wallets/eip5792");
                        const txHash = await sendCalls({
                            account,
                            client: account.client,
                            calls: params[0].calls.map((c: any) => ({
                                to: c.to,
                                data: c.data,
                                value: c.value ? BigInt(c.value) : undefined
                            })),
                            version: params[0].version
                        });
                        return txHash;
                    }
                    if (method === "eth_signTypedData_v4") {
                        const parsed = typeof params[1] === "string" ? JSON.parse(params[1]) : params[1];
                        return await account.signTypedData({
                            domain: parsed.domain,
                            types: parsed.types,
                            primaryType: parsed.primaryType,
                            message: parsed.message
                        });
                    }
                    // For standard transactions/signing, pass down or throw
                    throw new Error(`Method ${method} not implemented in custom adapter`);
                }
            } as any;

            // Use the official Base interface to handle the wallet_sendCalls flow
            // This automatically attaches the SpendPermissionManager as an owner (ERC-6492 side effects)
            const { requestSpendPermission } = await import("@base-org/account/spend-permission");
            const sdkPermission = await requestSpendPermission({
                account: customerWallet,
                spender: spenderWallet as `0x${string}`,
                token: BASE_USDC_ADDRESS,
                allowance: permission.allowance,
                periodInDays: 30, // For monthly, we map to days for the SDK helper
                chainId: base.id,
                provider,
            });
            
            // The signature is now handled inside requestSpendPermission via wallet_sendCalls/signTypedData
            // And `sdkPermission` contains the fully approved on-chain permission structure.
            const signature = sdkPermission.signature || "0x";

            setStep("submitting");

            // Submit to our API
            const res = await fetch("/api/subscriptions/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    customerWallet,
                    permissionSignature: signature,
                    permissionData: {
                        account: sdkPermission.permission.account,
                        spender: sdkPermission.permission.spender,
                        token: sdkPermission.permission.token,
                        allowance: sdkPermission.permission.allowance.toString(),
                        period: Number(sdkPermission.permission.period),
                        start: Number(sdkPermission.permission.start),
                        end: Number(sdkPermission.permission.end),
                        salt: sdkPermission.permission.salt.toString(),
                        extraData: sdkPermission.permission.extraData,
                    },
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Check if the immediate first charge succeeded
                if (data.firstCharge && !data.firstCharge.success) {
                    console.warn("[SubscribeButton] Subscription created but first charge failed:", data.firstCharge.error);
                }
                setStep("success");
                onSuccess?.(data.subscription?.subscriptionId);
            } else {
                throw new Error(data.error || data.message || "Subscription failed");
            }
        } catch (err: any) {
            console.error("Subscribe error:", err);
            const msg = err?.message || "Failed to subscribe";
            setErrorMsg(msg.includes("rejected") || msg.includes("denied") ? "Signature rejected by user" : msg);
            setStep("error");
            onError?.(msg);
        }
    };

    // Render
    if (!isConnected) {
        return (
            <button
                disabled
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-700 text-zinc-400 font-medium cursor-not-allowed ${className || ""}`}
            >
                <Wallet className="w-4 h-4" />
                Connect Wallet to Subscribe
            </button>
        );
    }

    if (step === "success") {
        return (
            <div className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 font-medium ${className || ""}`}>
                <CheckCircle className="w-5 h-5" />
                Subscribed to {planName}!
            </div>
        );
    }

    if (step === "error") {
        return (
            <div className="space-y-2">
                <div className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm ${className || ""}`}>
                    <AlertTriangle className="w-4 h-4" />
                    {errorMsg}
                </div>
                <button
                    onClick={() => setStep("idle")}
                    className="text-sm text-primary hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Balance info */}
            {usdcBalance !== null && (
                <div className="text-xs text-muted-foreground">
                    USDC Balance: ${usdcBalance.toFixed(2)}
                    {needsFunding && (
                        <span className="ml-2 text-amber-500">
                            (Need ${priceUsd.toFixed(2)} — please fund your wallet)
                        </span>
                    )}
                </div>
            )}

            <button
                onClick={handleSubscribe}
                disabled={step === "signing" || step === "submitting" || needsFunding}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all w-full
          ${needsFunding
                        ? "bg-amber-500/10 text-amber-500 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }
          ${step !== "idle" ? "opacity-70 cursor-wait" : ""}
          ${className || ""}
        `}
            >
                {step === "signing" && (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sign in wallet...
                    </>
                )}
                {step === "submitting" && (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating subscription...
                    </>
                )}
                {step === "idle" && !needsFunding && (
                    <>
                        Subscribe — ${priceUsd.toFixed(2)}/{period.toLowerCase()}
                        <ArrowRight className="w-4 h-4" />
                    </>
                )}
                {step === "idle" && needsFunding && (
                    <>
                        <Wallet className="w-4 h-4" />
                        Fund Wallet First
                    </>
                )}
            </button>
        </div>
    );
}
