"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";

/**
 * useStripeEmbeddedOnramp
 * 
 * Full client-side orchestrator for the Stripe Embedded Components Crypto Onramp.
 * Uses the @stripe/crypto SDK with headless `ui_mode` for complete UI control.
 * 
 * Architecture: Smart Wallet Bridge Pattern
 * ──────────────────────────────────────────
 * 1. Buyer enters email → Stripe Link verifies via OTP (single OTP)
 * 2. Server marks email as verified → Thirdweb auth_endpoint trusts it (no 2nd OTP)
 * 3. Thirdweb creates/retrieves deterministic EIP-4337 smart wallet for that email
 * 4. Smart wallet address registered with Stripe as buyer's wallet (unique per buyer)
 * 5. Stripe onramp delivers USDC to smart wallet
 * 6. Gasless USDC.transfer() moves funds from smart wallet → split contract
 * 7. Split contract auto-distributes to merchant + platform
 * 
 * Key properties:
 * - Each buyer email = unique wallet (no shared-address compliance issues)
 * - Buyer never sees a wallet, never pays gas, never signs anything
 * - Single OTP total (Stripe Link), no Thirdweb OTP
 * - Smart wallet is persistent: same email = same wallet forever
 */

export type OnrampStep =
  | "idle"
  | "initializing"
  | "checking_link"
  | "registering_link"
  | "authenticating"
  | "exchanging_tokens"
  | "checking_kyc"
  | "collecting_kyc"
  | "verifying_identity"
  | "creating_wallet"
  | "registering_wallet"
  | "collecting_payment"
  | "creating_session"
  | "checking_out"
  | "awaiting_funds"
  | "transferring"
  | "completed"
  | "error";

type OnrampCoordinator = {
  registerLinkUser: (info: {
    email: string;
    phone: string;
    country: string;
    fullName?: string;
  }) => Promise<{ created: boolean }>;
  authenticate: (
    linkAuthIntentId: string,
    onCompletion: (result: {
      result: "success" | "abandoned" | "declined";
      crypto_customer_id?: string;
    }) => void
  ) => Promise<HTMLElement | null>;
  submitKycInfo: (params: any) => Promise<void>;
  verifyDocuments: () => Promise<{ result: "success" | "abandoned" }>;
  registerWalletAddress: (
    walletAddress: string,
    network: string
  ) => Promise<{ id: string; wallet_address: string; network: string }>;
  collectPaymentMethod: (
    options: {
      payment_method_types: string[];
      wallets: { applePay: string; googlePay: string };
    },
    onCompletion: (result: { cryptoPaymentToken: string }) => void
  ) => Promise<HTMLElement>;
  performCheckout: (
    onrampSessionId: string,
    checkout: (sessionId: string) => Promise<string>
  ) => Promise<{ successful: boolean }>;
  destroy: () => void;
};

export type UseStripeEmbeddedOnrampProps = {
  /** Buyer's email */
  email?: string;
  /** Buyer's phone (E.164) */
  phone?: string;
  /** Split contract address — final destination for funds */
  splitAddress?: string;
  /** USD amount to onramp */
  amount?: number;
  /** Network for destination */
  network?: string;
  /** Destination currency */
  destinationCurrency?: string;
  /** Receipt ID for metadata */
  receiptId?: string;
  /** Merchant wallet for metadata */
  merchantWallet?: string;
  /** Brand key for metadata */
  brandKey?: string;
  /** Enable/disable */
  enabled?: boolean;
  /**
   * If the buyer is already connected with a Thirdweb wallet, pass their address here.
   * This skips the auth_endpoint wallet creation entirely — no extra OTP, no new wallet.
   */
  connectedWalletAddress?: string;
  /** Callbacks */
  onSuccess?: (result: { sessionId: string; txHash?: string }) => void;
  onError?: (error: Error) => void;
  onStepChange?: (step: OnrampStep) => void;
};

export type UseStripeEmbeddedOnrampReturn = {
  /** Current step in the onramp flow */
  step: OnrampStep;
  /** Human-readable status message */
  statusMessage: string;
  /** Error message if any */
  error: string | null;
  /** The auth element to render (OTP modal) */
  authElement: HTMLElement | null;
  /** The payment method element to render */
  paymentElement: HTMLElement | null;
  /** Start the full onramp flow */
  startOnramp: (overrideEmail?: string) => Promise<void>;
  /** Reset state */
  reset: () => void;
  /** Whether the flow is actively running */
  isActive: boolean;
  /** The crypto customer ID after auth */
  cryptoCustomerId: string | null;
  /** The buyer's smart wallet address (deterministic from email) */
  buyerWalletAddress: string | null;
};

const STEP_MESSAGES: Record<OnrampStep, string> = {
  idle: "Ready to start",
  initializing: "Initializing Stripe...",
  checking_link: "Checking account...",
  registering_link: "Creating account...",
  authenticating: "Verifying identity...",
  exchanging_tokens: "Securing session...",
  checking_kyc: "Checking verification...",
  collecting_kyc: "Collecting identity info...",
  verifying_identity: "Verifying identity documents...",
  creating_wallet: "Setting up your wallet...",
  registering_wallet: "Registering wallet...",
  collecting_payment: "Select payment method...",
  creating_session: "Preparing transaction...",
  checking_out: "Processing payment...",
  awaiting_funds: "Waiting for funds...",
  transferring: "Completing transfer...",
  completed: "Payment complete!",
  error: "Something went wrong",
};

// ─── Base USDC contract address ───
const BASE_USDC_ADDRESS = process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export function useStripeEmbeddedOnramp({
  email,
  phone,
  splitAddress,
  amount,
  network = "base",
  destinationCurrency = "usdc",
  receiptId,
  merchantWallet,
  brandKey,
  enabled = true,
  connectedWalletAddress,
  onSuccess,
  onError,
  onStepChange,
}: UseStripeEmbeddedOnrampProps): UseStripeEmbeddedOnrampReturn {
  const [step, setStep] = useState<OnrampStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [authElement, setAuthElement] = useState<HTMLElement | null>(null);
  const [paymentElement, setPaymentElement] = useState<HTMLElement | null>(null);
  const [cryptoCustomerId, setCryptoCustomerId] = useState<string | null>(null);
  const [buyerWalletAddress, setBuyerWalletAddress] = useState<string | null>(null);

  const onrampRef = useRef<OnrampCoordinator | null>(null);
  const mountedRef = useRef(true);
  const oauthTokenRef = useRef<string | null>(null);
  const paymentTokenRef = useRef<string | null>(null);
  const verificationTokenRef = useRef<string | null>(null);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try { onrampRef.current?.destroy(); } catch {}
    };
  }, []);

  const updateStep = useCallback((newStep: OnrampStep) => {
    if (!mountedRef.current) return;
    setStep(newStep);
    onStepChange?.(newStep);
  }, [onStepChange]);

  const handleError = useCallback((message: string, err?: any) => {
    if (!mountedRef.current) return;
    console.error(`[EMBEDDED ONRAMP] ${message}`, err);
    setError(message);
    updateStep("error");
    onError?.(new Error(message));
  }, [onError, updateStep]);

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setAuthElement(null);
    setPaymentElement(null);
    setCryptoCustomerId(null);
    setBuyerWalletAddress(null);
    oauthTokenRef.current = null;
    paymentTokenRef.current = null;
    verificationTokenRef.current = null;
  }, []);

  // ─── Create/retrieve Thirdweb smart wallet for buyer email ───
  // Uses auth_endpoint strategy — no OTP (email already verified by Stripe Link)
  const createBuyerWallet = useCallback(async (buyerEmail: string): Promise<string | null> => {
    try {
      const { createThirdwebClient } = await import("thirdweb");
      const { inAppWallet } = await import("thirdweb/wallets");
      const { base } = await import("thirdweb/chains");

      const twClient = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
      });

      // Create in-app wallet with auth_endpoint strategy (no OTP)
      const wallet = inAppWallet({
        auth: {
          options: ["auth_endpoint" as any],
        },
        executionMode: {
          mode: "EIP4337",
          smartAccount: {
            chain: base,
            sponsorGas: true,
          },
        },
      });

      // Connect using auth_endpoint — sends payload to our /api/auth/thirdweb-verify
      const account = await wallet.connect({
        client: twClient,
        chain: base,
        strategy: "auth_endpoint" as any,
        payload: JSON.stringify({
          email: buyerEmail,
          verificationToken: verificationTokenRef.current || "",
        }),
      });

      const address = account.address;
      console.log("[EMBEDDED ONRAMP] Smart wallet created/retrieved:", address?.slice(0, 10) + "...");

      return address || null;
    } catch (err: any) {
      console.error("[EMBEDDED ONRAMP] Wallet creation failed:", err);
      return null;
    }
  }, []);

  // ─── Execute gasless USDC transfer from smart wallet → split contract ───
  const executeGaslessTransfer = useCallback(async (
    fromWalletEmail: string,
    toAddress: string,
    usdcAmount: number,
  ): Promise<string | null> => {
    try {
      const { createThirdwebClient, getContract, prepareContractCall, sendTransaction } = await import("thirdweb");
      const { inAppWallet } = await import("thirdweb/wallets");
      const { base } = await import("thirdweb/chains");

      const twClient = createThirdwebClient({
        clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
      });

      // Re-connect the wallet (same email = same wallet, deterministic)
      const wallet = inAppWallet({
        auth: {
          options: ["auth_endpoint" as any],
        },
        executionMode: {
          mode: "EIP4337",
          smartAccount: {
            chain: base,
            sponsorGas: true,
          },
        },
      });

      const account = await wallet.connect({
        client: twClient,
        chain: base,
        strategy: "auth_endpoint" as any,
        payload: JSON.stringify({
          email: fromWalletEmail,
          verificationToken: verificationTokenRef.current || "",
        }),
      });

      // Prepare ERC-20 transfer: USDC has 6 decimals
      const usdcContract = getContract({
        client: twClient,
        chain: base,
        address: BASE_USDC_ADDRESS,
      });

      const amountInUnits = BigInt(Math.floor(usdcAmount * 1_000_000)); // 6 decimals

      const tx = prepareContractCall({
        contract: usdcContract,
        method: "function transfer(address to, uint256 amount) returns (bool)",
        params: [toAddress, amountInUnits],
      });

      console.log("[EMBEDDED ONRAMP] Executing gasless USDC transfer:", amountInUnits.toString(), "→", toAddress.slice(0, 10) + "...");

      const result = await sendTransaction({
        account,
        transaction: tx,
      });

      console.log("[EMBEDDED ONRAMP] ✓ Transfer complete, tx:", result.transactionHash);
      return result.transactionHash;
    } catch (err: any) {
      console.error("[EMBEDDED ONRAMP] Gasless transfer failed:", err);
      return null;
    }
  }, []);

  const startOnramp = useCallback(async (overrideEmail?: string) => {
    const activeEmail = overrideEmail || email;

    if (!enabled || !activeEmail || !splitAddress || !publishableKey) {
      handleError("Missing required fields (email, split address, or API key)");
      return;
    }

    if (!amount || amount <= 0) {
      handleError("Invalid amount");
      return;
    }

    try {
      // @ts-ignore - beta SDK method missing from types
      const stripeCryptoModule = (await import("@stripe/crypto")) as any;
      const loadCryptoOnrampAndInitialize = stripeCryptoModule.loadCryptoOnrampAndInitialize || stripeCryptoModule.loadStripeOnramp;

      const onramp = await loadCryptoOnrampAndInitialize(publishableKey, {
        theme: "stripe",
      });

      if (!mountedRef.current) return;
      onrampRef.current = onramp as unknown as OnrampCoordinator;

      // ─── Step 2: Check for Link account ───
      updateStep("checking_link");

      const linkRes = await fetch("/api/stripe/link-auth-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail }),
      });

      if (!mountedRef.current) return;

      let authIntentId: string;

      if (linkRes.status === 404) {
        // No Link account — register
        updateStep("registering_link");

        const registerResult = await onramp.registerLinkUser({
          email: activeEmail,
          phone: phone || "",
          country: "US",
          fullName: "",
        });

        if (!registerResult.created) {
          handleError("Failed to create Link account");
          return;
        }

        const retryRes = await fetch("/api/stripe/link-auth-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: activeEmail }),
        });

        if (!retryRes.ok) {
          const retryData = await retryRes.json();
          handleError(retryData.error || "Failed to create auth intent after registration");
          return;
        }

        const retryData = await retryRes.json();
        authIntentId = retryData.authIntentId;
      } else if (linkRes.ok) {
        const linkData = await linkRes.json();
        authIntentId = linkData.authIntentId;
      } else {
        const linkData = await linkRes.json();
        handleError(linkData.error || "Link auth check failed");
        return;
      }

      if (!mountedRef.current) return;

      // ─── Step 3: Authenticate via Stripe Link (buyer does OTP here) ───
      updateStep("authenticating");

      const authPromise = new Promise<string>((resolve, reject) => {
        onramp.authenticate(authIntentId, (result: any) => {
          if (result.result === "success" && result.crypto_customer_id) {
            resolve(result.crypto_customer_id);
          } else if (result.result === "abandoned") {
            reject(new Error("Authentication cancelled"));
          } else if (result.result === "declined") {
            reject(new Error("OAuth consent declined"));
          } else {
            reject(new Error("Authentication failed"));
          }
        }).then((element: HTMLElement | null) => {
          if (element && mountedRef.current) {
            setAuthElement(element);
          }
        });
      });

      const customerId = await authPromise;
      if (!mountedRef.current) return;

      setCryptoCustomerId(customerId);
      setAuthElement(null);

      // ─── Step 3b: Mark email as verified for Thirdweb ───
      // Stripe Link has verified this email via OTP.
      // Tell our server so Thirdweb's auth_endpoint can trust it (no 2nd OTP).
      const markRes = await fetch("/api/auth/mark-verified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: activeEmail }),
      });

      if (markRes.ok) {
        const markData = await markRes.json();
        verificationTokenRef.current = markData.verificationToken;
        console.log("[EMBEDDED ONRAMP] Email marked as Stripe-verified for Thirdweb");
      }

      // ─── Step 4: Exchange tokens ───
      updateStep("exchanging_tokens");

      const tokenRes = await fetch("/api/stripe/link-auth-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authIntentId,
          cryptoCustomerId: customerId,
        }),
      });

      if (!tokenRes.ok) {
        const tokenData = await tokenRes.json();
        handleError(tokenData.error || "Token exchange failed");
        return;
      }

      const tokenData = await tokenRes.json();
      oauthTokenRef.current = tokenData.accessToken;

      if (!mountedRef.current) return;

      // ─── Step 5: Check KYC ───
      updateStep("checking_kyc");

      const kycRes = await fetch(`/api/stripe/crypto-customer/${encodeURIComponent(customerId)}`, {
        headers: {
          "x-stripe-oauth-token": oauthTokenRef.current || "",
        },
      });

      if (!mountedRef.current) return;

      if (kycRes.ok) {
        const kycData = await kycRes.json();

        if (kycData.kycStatus === "not_started") {
          console.log("[EMBEDDED ONRAMP] KYC not started — will handle during checkout");
        }

        if (kycData.idDocStatus === "not_started") {
          console.log("[EMBEDDED ONRAMP] Identity doc not started — will handle during checkout");
        }
      }

      // ─── Step 6: Resolve buyer's wallet ───
      // If the buyer is already connected via Thirdweb, use their wallet directly.
      // Otherwise, create/retrieve a smart wallet via auth_endpoint (no OTP).
      let buyerWallet: string;

      if (connectedWalletAddress) {
        buyerWallet = connectedWalletAddress;
        console.log("[EMBEDDED ONRAMP] Using connected Thirdweb wallet:", buyerWallet.slice(0, 10) + "...");
      } else {
        updateStep("creating_wallet");

        const createdWallet = await createBuyerWallet(activeEmail);

        if (!createdWallet) {
          handleError("Failed to create buyer wallet");
          return;
        }

        buyerWallet = createdWallet;
        console.log("[EMBEDDED ONRAMP] Created smart wallet via auth_endpoint:", buyerWallet.slice(0, 10) + "...");
      }

      if (!mountedRef.current) return;
      setBuyerWalletAddress(buyerWallet);

      // ─── Step 7: Register buyer's smart wallet with Stripe ───
      updateStep("registering_wallet");

      try {
        await onramp.registerWalletAddress(buyerWallet, network);
        console.log("[EMBEDDED ONRAMP] Buyer wallet registered with Stripe:", buyerWallet.slice(0, 10) + "...");
      } catch (walletErr: any) {
        // May already be registered — that's okay
        console.log("[EMBEDDED ONRAMP] Wallet registration (may already exist):", walletErr?.message);
      }

      if (!mountedRef.current) return;

      // ─── Step 8: Collect payment method ───
      updateStep("collecting_payment");

      const paymentPromise = new Promise<string>((resolve, reject) => {
        onramp.collectPaymentMethod(
          {
            payment_method_types: ["card"],
            wallets: { applePay: "auto", googlePay: "auto" },
          },
          (result: any) => {
            if (result.cryptoPaymentToken) {
              resolve(result.cryptoPaymentToken);
            } else {
              reject(new Error("Payment method collection failed"));
            }
          }
        ).then((element: HTMLElement) => {
          if (mountedRef.current) {
            setPaymentElement(element);
          }
        }).catch(reject);
      });

      const pmToken = await paymentPromise;
      if (!mountedRef.current) return;

      paymentTokenRef.current = pmToken;
      setPaymentElement(null);

      // ─── Step 9: Create onramp session (destination = buyer's smart wallet) ───
      updateStep("creating_session");

      const sessionRes = await fetch("/api/stripe/onramp-session-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cryptoCustomerId: customerId,
          cryptoPaymentToken: pmToken,
          sourceAmount: amount,
          sourceCurrency: "usd",
          destinationCurrency,
          destinationNetwork: network,
          walletAddress: buyerWallet, // ← Buyer's unique smart wallet
          oauthToken: oauthTokenRef.current,
          receiptId,
          merchantWallet,
          brandKey,
        }),
      });

      if (!sessionRes.ok) {
        const sessionData = await sessionRes.json();
        handleError(sessionData.error || "Session creation failed");
        return;
      }

      const sessionData = await sessionRes.json();
      const sessionId = sessionData.id;

      if (!mountedRef.current) return;

      // ─── Step 10: Perform checkout with retry loop ───
      updateStep("checking_out");

      const MAX_ATTEMPTS = 5;
      let checkoutSucceeded = false;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const result = await onramp.performCheckout(sessionId, async (onrampSessionId: string) => {
            const checkoutRes = await fetch(`/api/stripe/onramp-checkout/${encodeURIComponent(onrampSessionId)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                oauthToken: oauthTokenRef.current,
              }),
            });

            const checkoutData = await checkoutRes.json();

            if (!checkoutData.client_secret) {
              throw new Error(checkoutData.error || "No client_secret returned");
            }

            return checkoutData.client_secret;
          });

          if (result.successful) {
            checkoutSucceeded = true;
            break;
          }
        } catch (checkoutErr: any) {
          // Inspect session for last_error
          try {
            const statusRes = await fetch(`/api/stripe/onramp-status?sessionId=${encodeURIComponent(sessionId)}`);
            const statusData = await statusRes.json();
            const lastError = statusData.transactionDetails?.last_error;

            if (lastError === "missing_kyc") {
              updateStep("collecting_kyc");
              handleError("KYC verification required. Please contact support.");
              return;
            } else if (lastError === "missing_document_verification") {
              updateStep("verifying_identity");
              try {
                await onramp.verifyDocuments();
              } catch {
                handleError("Identity verification failed");
                return;
              }
              continue;
            } else if (lastError === "charged_with_expired_quote") {
              console.log("[EMBEDDED ONRAMP] Quote expired, retrying...");
              continue;
            } else if (lastError === "missing_consumer_wallet") {
              updateStep("registering_wallet");
              try {
                await onramp.registerWalletAddress(buyerWallet, network);
              } catch {}
              continue;
            } else if (
              lastError === "transaction_limit_reached" ||
              lastError === "location_not_supported" ||
              lastError === "transaction_failed"
            ) {
              handleError(`Transaction error: ${lastError}`);
              return;
            }
          } catch {}

          if (attempt === MAX_ATTEMPTS - 1) {
            handleError(checkoutErr?.message || "Checkout failed after retries");
            return;
          }
        }
      }

      if (!checkoutSucceeded || !mountedRef.current) return;

      // ─── Step 11: Wait for USDC to arrive in buyer's smart wallet ───
      updateStep("awaiting_funds");

      // Poll for onramp fulfillment (Stripe delivers USDC to buyer's smart wallet)
      let fundsDelivered = false;
      for (let poll = 0; poll < 60; poll++) { // Max 5 minutes
        await new Promise(r => setTimeout(r, 5000));
        if (!mountedRef.current) return;

        try {
          const statusRes = await fetch(`/api/stripe/onramp-status?sessionId=${encodeURIComponent(sessionId)}`);
          const statusData = await statusRes.json();

          if (statusData.status === "fulfillment_complete") {
            fundsDelivered = true;
            console.log("[EMBEDDED ONRAMP] ✓ USDC delivered to buyer's smart wallet");
            break;
          }
        } catch {}
      }

      if (!fundsDelivered) {
        handleError("Timed out waiting for funds delivery");
        return;
      }

      if (!mountedRef.current) return;

      // ─── Step 12: Gasless transfer from buyer's smart wallet → split contract ───
      updateStep("transferring");

      const txHash = await executeGaslessTransfer(activeEmail, splitAddress, amount);

      if (!txHash) {
        handleError("Failed to transfer funds to merchant");
        return;
      }

      // ─── Done ───
      updateStep("completed");
      onSuccess?.({ sessionId, txHash });

    } catch (err: any) {
      handleError(err?.message || "Onramp flow failed");
    }
  }, [
    enabled, email, phone, splitAddress, amount, network,
    destinationCurrency, receiptId, merchantWallet, brandKey,
    publishableKey, connectedWalletAddress, onSuccess, handleError,
    updateStep, createBuyerWallet, executeGaslessTransfer,
  ]);

  const statusMessage = useMemo(() => STEP_MESSAGES[step], [step]);

  const isActive = useMemo(() =>
    step !== "idle" && step !== "completed" && step !== "error",
    [step]
  );

  return {
    step,
    statusMessage,
    error,
    authElement,
    paymentElement,
    startOnramp,
    reset,
    isActive,
    cryptoCustomerId,
    buyerWalletAddress,
  };
}
