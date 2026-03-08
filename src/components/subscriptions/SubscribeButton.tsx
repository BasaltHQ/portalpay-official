"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useActiveAccount, useActiveWalletChain } from "thirdweb/react";
import { base } from "thirdweb/chains";
import {
    getContract,
    prepareContractCall,
    sendTransaction,
    waitForReceipt,
} from "thirdweb";
import { client } from "@/lib/thirdweb/client";
import {
    BASE_USDC_ADDRESS,
    BASE_USDC_DECIMALS,
    BILLING_PERIODS,
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
    /** Platform wallet address that will execute transferFrom — from env */
    spenderWallet: string;
    onSuccess?: (subscriptionId: string) => void;
    onError?: (error: string) => void;
    className?: string;
};

/**
 * Customer-facing Subscribe Button.
 *
 * Universal ERC-20 Approve + TransferFrom flow:
 * 1. Check USDC balance → show funding prompt if low
 * 2. Call USDC.approve(platformWallet, totalAllowance) from customer's wallet
 * 3. POST /api/subscriptions/create — backend executes first charge via transferFrom
 * 4. Show success
 *
 * Works with ALL wallet types: Smart Accounts, EOAs, Coinbase Smart Wallets.
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
    const [step, setStep] = useState<"idle" | "approving" | "submitting" | "success" | "error">("idle");
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

    // Handle subscribe — ERC-20 approve flow
    const handleSubscribe = async () => {
        if (!customerWallet || !account) {
            setErrorMsg("Connect your wallet first");
            setStep("error");
            return;
        }

        if (!spenderWallet || !/^0x[a-fA-F0-9]{40}$/.test(spenderWallet)) {
            setErrorMsg("Platform wallet not configured");
            setStep("error");
            return;
        }

        setStep("approving");
        setErrorMsg("");

        try {
            // Calculate total allowance: price × 12 periods (or subscription duration)
            const durationPeriods = 12;
            const totalAllowanceUsd = priceUsd * durationPeriods;
            const totalAllowanceWei = BigInt(
                Math.round(totalAllowanceUsd * 10 ** BASE_USDC_DECIMALS)
            );
            const periodSeconds = BILLING_PERIODS[period];

            // Get the USDC contract
            const usdcContract = getContract({
                client,
                address: BASE_USDC_ADDRESS,
                chain: base,
            });

            // Step 1: Customer approves the platform wallet to spend their USDC
            // This is the ONLY wallet interaction — wallet popup appears here
            console.log("[SubscribeButton] Requesting USDC approval:", {
                spender: spenderWallet,
                allowance: totalAllowanceWei.toString(),
                allowanceUsd: totalAllowanceUsd,
            });

            const approveTx = prepareContractCall({
                contract: usdcContract,
                method: {
                    type: "function",
                    name: "approve",
                    inputs: [
                        { name: "spender", type: "address" },
                        { name: "amount", type: "uint256" },
                    ],
                    outputs: [{ name: "", type: "bool" }],
                    stateMutability: "nonpayable",
                },
                params: [spenderWallet as `0x${string}`, totalAllowanceWei],
            });

            const approvalResult = await sendTransaction({
                account,
                transaction: approveTx,
            });

            // Wait for approval tx to confirm on-chain
            const approvalReceipt = await waitForReceipt({
                ...approvalResult,
                client,
                chain: base,
            });

            console.log("[SubscribeButton] USDC approval confirmed:", approvalReceipt.transactionHash);

            // Step 2: Send subscription request to backend
            // Backend will execute the first charge via USDC.transferFrom()
            setStep("submitting");

            const res = await fetch("/api/subscriptions/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    planId,
                    customerWallet,
                    approvalTxHash: approvalReceipt.transactionHash,
                    approvedSpender: spenderWallet.toLowerCase(),
                    approvedAllowance: totalAllowanceWei.toString(),
                    periodSeconds,
                }),
            });

            const data = await res.json();

            if (data.success) {
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
            setErrorMsg(
                msg.includes("rejected") || msg.includes("denied") || msg.includes("User rejected")
                    ? "Transaction rejected by user"
                    : msg
            );
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
                disabled={step === "approving" || step === "submitting" || needsFunding}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all w-full
          ${needsFunding
                        ? "bg-amber-500/10 text-amber-500 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }
          ${step !== "idle" ? "opacity-70 cursor-wait" : ""}
          ${className || ""}
        `}
            >
                {step === "approving" && (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Approve USDC in wallet...
                    </>
                )}
                {step === "submitting" && (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing first charge...
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
