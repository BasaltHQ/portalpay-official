"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * useStripeOnrampInterceptor
 * 
 * Intercepts thirdweb's Stripe onramp flow:
 * 1. Patches window.open to catch crypto.link.com redirects
 * 2. Modifies the Stripe provider card in "Select Payment Provider" with our quote + tags
 * 3. Launches our direct Stripe Crypto Onramp modal
 */

type InterceptorProps = {
  walletAddress?: string;
  amount?: number;
  receiptId?: string;
  merchantWallet?: string;
  brandKey?: string;
  onSuccess?: (result: { sessionId: string; status: string }) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
};

type StripeQuote = {
  destinationAmount: string;
  destinationCurrency: string;
  destinationNetwork: string;
  fees: { network_fee_monetary: string; transaction_fee_monetary: string };
  sourceTotal: string;
};

// Stripe SDK loading (singleton)
let stripeOnrampPromise: Promise<any> | null = null;

function loadStripeOnrampSdk(): Promise<any> {
  if (stripeOnrampPromise) return stripeOnrampPromise;

  stripeOnrampPromise = new Promise((resolve, reject) => {
    if (typeof (window as any).StripeOnramp !== "undefined") {
      resolve((window as any).StripeOnramp);
      return;
    }

    const loadScript = (src: string): Promise<void> =>
      new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => res();
        s.onerror = () => rej(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

    loadScript("https://js.stripe.com/clover/stripe.js")
      .then(() => loadScript("https://crypto-js.stripe.com/crypto-onramp-outer.js"))
      .then(() => {
        setTimeout(() => {
          if (typeof (window as any).StripeOnramp !== "undefined") {
            resolve((window as any).StripeOnramp);
          } else {
            reject(new Error("StripeOnramp not available after script load"));
          }
        }, 150);
      })
      .catch(reject);
  });

  return stripeOnrampPromise;
}

export function useStripeOnrampInterceptor({
  walletAddress,
  amount,
  receiptId,
  merchantWallet,
  brandKey,
  onSuccess,
  onError,
  enabled = true,
}: InterceptorProps) {
  const activeSessionRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const launchRef = useRef<() => void>(() => {});
  const [quote, setQuote] = useState<StripeQuote | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, []);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  // ─── Fetch our Stripe quote on mount / amount change ───
  useEffect(() => {
    if (!enabled || !amount || amount <= 0) return;

    let cancelled = false;
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/stripe/onramp-quote?amount=${encodeURIComponent(String(amount))}&currency=usd`);
        const data = await res.json();
        if (!cancelled && data.ok && data.quote) {
          setQuote(data.quote);
          console.log("[STRIPE INTERCEPTOR] Quote fetched:", data.quote.sourceTotal, "USDC");
        }
      } catch (err) {
        console.warn("[STRIPE INTERCEPTOR] Quote fetch failed:", err);
      }
    };
    fetchQuote();

    return () => { cancelled = true; };
  }, [enabled, amount]);

  // ─── Launch our Stripe onramp in a modal overlay ───
  const launchStripeOnramp = useCallback(async () => {
    if (!walletAddress || !publishableKey) {
      console.warn("[STRIPE INTERCEPTOR] Missing wallet or publishable key");
      return;
    }

    document.getElementById("pp-stripe-onramp-overlay")?.remove();
    console.log("[STRIPE INTERCEPTOR] 🚀 Launching direct Stripe Crypto Onramp...");

    if (!document.getElementById("pp-stripe-anim-style")) {
      const animStyle = document.createElement("style");
      animStyle.id = "pp-stripe-anim-style";
      animStyle.textContent = `
        @keyframes ppFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ppSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `;
      document.head.appendChild(animStyle);
    }

    const overlay = document.createElement("div");
    overlay.id = "pp-stripe-onramp-overlay";
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      z-index: 999999; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
      animation: ppFadeIn 0.2s ease-out;
    `;

    const inner = document.createElement("div");
    inner.style.cssText = `
      width: 440px; max-width: 95vw; max-height: 90vh;
      background: #1a1a2e; border-radius: 16px; overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      display: flex; flex-direction: column; position: relative;
      animation: ppSlideUp 0.25s ease-out;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);
    `;
    const title = document.createElement("span");
    title.textContent = "Pay with Stripe";
    title.style.cssText = "color: #fff; font-size: 16px; font-weight: 600;";
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = `
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(255,255,255,0.1); border: none;
      color: #fff; font-size: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    `;
    closeBtn.onmouseenter = () => { closeBtn.style.background = "rgba(255,255,255,0.2)"; };
    closeBtn.onmouseleave = () => { closeBtn.style.background = "rgba(255,255,255,0.1)"; };
    closeBtn.addEventListener("click", () => overlay.remove());
    header.appendChild(title);
    header.appendChild(closeBtn);

    const loadingDiv = document.createElement("div");
    loadingDiv.style.cssText = `
      display: flex; align-items: center; justify-content: center;
      padding: 60px 20px; color: rgba(255,255,255,0.6); font-size: 14px;
    `;
    loadingDiv.textContent = "Initializing Stripe Onramp...";

    const onrampDiv = document.createElement("div");
    onrampDiv.id = "pp-stripe-onramp-mount";
    onrampDiv.style.cssText = "width:100%;min-height:500px;display:none;";

    inner.appendChild(header);
    inner.appendChild(loadingDiv);
    inner.appendChild(onrampDiv);
    overlay.appendChild(inner);

    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);

    try {
      const res = await fetch("/api/stripe/onramp-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          amount: amount ? String(amount) : undefined,
          receiptId,
          merchantWallet,
          brandKey,
        }),
      });

      const data = await res.json();

      if (!data.ok || !data.clientSecret) {
        console.error("[STRIPE INTERCEPTOR] Session creation failed:", data);
        loadingDiv.textContent = `Error: ${data.error || "Failed to create session"}`;
        loadingDiv.style.color = "#ef4444";
        onError?.(new Error(data.error || "Session creation failed"));
        return;
      }

      const { clientSecret, sessionId } = data;
      activeSessionRef.current = sessionId;
      console.log("[STRIPE INTERCEPTOR] Session created:", sessionId);

      const StripeOnramp = await loadStripeOnrampSdk();
      const stripeOnramp = StripeOnramp(publishableKey);
      const onrampSession = stripeOnramp.createSession({ clientSecret });

      loadingDiv.style.display = "none";
      onrampDiv.style.display = "block";
      onrampSession.mount(onrampDiv);

      console.log("[STRIPE INTERCEPTOR] ✓ Onramp mounted successfully");

      onrampSession.addEventListener("onramp_session_updated", (e: any) => {
        const session = e?.payload?.session;
        const status = session?.status;
        console.log("[STRIPE INTERCEPTOR] Session status:", status);

        if (status === "fulfillment_complete") {
          console.log("[STRIPE INTERCEPTOR] ✓ Onramp completed!");
          if (receiptId && merchantWallet) {
            fetch("/api/receipts/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                receiptId, wallet: merchantWallet, status: "paid",
                txHash: session?.transaction_details?.transaction_id,
              }),
            }).catch(() => {});
          }
          onSuccess?.({ sessionId, status });
          setTimeout(() => overlay.remove(), 2000);
        }

        if (status === "rejected") {
          onError?.(new Error("Onramp session rejected"));
        }
      });

      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        if (!mountedRef.current || !activeSessionRef.current) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          return;
        }
        try {
          const statusRes = await fetch(
            `/api/stripe/onramp-status?sessionId=${encodeURIComponent(activeSessionRef.current)}`
          );
          const statusData = await statusRes.json();
          if (statusData.status === "fulfillment_complete") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            onSuccess?.({ sessionId: activeSessionRef.current || sessionId, status: "fulfillment_complete" });
            setTimeout(() => overlay.remove(), 2000);
          }
        } catch { }
      }, 5000);
    } catch (err: any) {
      console.error("[STRIPE INTERCEPTOR] Error:", err);
      loadingDiv.textContent = `Error: ${err?.message || "Failed to initialize"}`;
      loadingDiv.style.color = "#ef4444";
      onError?.(err);
    }
  }, [walletAddress, amount, receiptId, merchantWallet, brandKey, publishableKey, onSuccess, onError]);

  // Keep the ref in sync so the window.open patch always calls the latest version
  useEffect(() => {
    launchRef.current = launchStripeOnramp;
  }, [launchStripeOnramp]);

  // ─── DOM manipulation: modify the Stripe provider card in thirdweb's panel ───
  useEffect(() => {
    if (!enabled) return;

    const MODIFIED_ATTR = "data-pp-stripe-modified";

    const modifyStripeCard = () => {
      try {
        // Walk all body-level portals looking for text "Stripe" in provider cards
        const allElements = document.body.querySelectorAll("*");

        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i] as HTMLElement;
          // Skip our own elements
          if (el.closest("#pp-stripe-onramp-overlay")) continue;
          if (el.closest("[data-pp-stripe-modified]")) continue;

          const text = el.textContent?.trim() || "";

          // Look for text nodes that are exactly "Stripe"
          if (text !== "Stripe" || el.children.length > 0) continue;

          // Found a "Stripe" text element — walk up to find the card container
          let card: HTMLElement | null = el.parentElement;
          for (let j = 0; j < 6 && card; j++) {
            if (card.hasAttribute(MODIFIED_ATTR)) { card = null; break; }
            const rect = card.getBoundingClientRect();
            const style = window.getComputedStyle(card);
            const isCard = rect.width > 150 && rect.height > 40 && rect.height < 200;
            const isClickable = style.cursor === "pointer" || card.tagName === "BUTTON" || card.getAttribute("role") === "button";

            if (isCard && isClickable) break;
            card = card.parentElement;
          }

          if (!card || card.hasAttribute(MODIFIED_ATTR)) continue;

          // Verify this is in a provider list (should have siblings with Coinbase/Transak)
          const parent = card.parentElement;
          if (!parent) continue;
          const siblingText = parent.textContent || "";
          if (!siblingText.includes("Coinbase") && !siblingText.includes("Transak")) continue;

          console.log("[STRIPE INTERCEPTOR] Found Stripe provider card, modifying...");
          card.setAttribute(MODIFIED_ATTR, "1");

          // Find the price text inside the card (e.g., "$7.11") and the crypto amount (e.g., "0.0001 cbBTC")
          const allSpans = card.querySelectorAll("span, p, div");
          let priceEl: HTMLElement | null = null;
          let cryptoEl: HTMLElement | null = null;

          for (let k = 0; k < allSpans.length; k++) {
            const span = allSpans[k] as HTMLElement;
            const spanText = span.textContent?.trim() || "";

            // Price match (e.g., "$7.11")
            if (/^\$\d+(\.\d+)?$/.test(spanText) && !priceEl) {
              priceEl = span;
            }

            // Crypto amount match (e.g., "0.0001 cbBTC")
            if (/^\d+(\.\d+)?\s+\w+/.test(spanText) && spanText.includes("BTC") && !cryptoEl) {
              cryptoEl = span;
            }
          }

          // Replace quote values with our Stripe quote
          if (quote && priceEl) {
            priceEl.textContent = `$${parseFloat(quote.sourceTotal).toFixed(2)}`;
            console.log("[STRIPE INTERCEPTOR] Updated price to:", priceEl.textContent);
          }

          if (cryptoEl) {
            if (quote) {
              cryptoEl.textContent = `${parseFloat(quote.destinationAmount).toFixed(2)} USDC`;
            } else {
              cryptoEl.textContent = "USDC";
            }
          }

          // Add USDC and CREDIT tags
          const tagContainer = document.createElement("div");
          tagContainer.style.cssText = `
            display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;
          `;

          const createTag = (text: string, bgColor: string, textColor: string) => {
            const tag = document.createElement("span");
            tag.textContent = text;
            tag.style.cssText = `
              display: inline-flex; align-items: center;
              padding: 2px 6px; border-radius: 4px;
              font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
              background: ${bgColor}; color: ${textColor};
              line-height: 1.4;
            `;
            return tag;
          };

          tagContainer.appendChild(createTag("USDC", "rgba(38, 132, 255, 0.15)", "#2684FF"));
          tagContainer.appendChild(createTag("CREDIT", "rgba(99, 102, 241, 0.15)", "#818CF8"));

          // Find the best place to insert tags — after the crypto amount or price
          const insertAfter = cryptoEl || priceEl;
          if (insertAfter && insertAfter.parentElement) {
            insertAfter.parentElement.appendChild(tagContainer);
          } else {
            // Fallback: append to the card's rightmost area
            card.appendChild(tagContainer);
          }
        }
      } catch (err) {
        console.error("[STRIPE INTERCEPTOR] Card modification error:", err);
      }
    };

    const mo = new MutationObserver(() => modifyStripeCard());
    mo.observe(document.body, { childList: true, subtree: true });

    modifyStripeCard();
    const t1 = setTimeout(modifyStripeCard, 300);
    const t2 = setTimeout(modifyStripeCard, 600);
    const t3 = setTimeout(modifyStripeCard, 1200);
    const t4 = setTimeout(modifyStripeCard, 2500);
    const t5 = setTimeout(modifyStripeCard, 5000);

    return () => {
      try { mo.disconnect(); } catch { }
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5);
    };
  }, [enabled, quote]);

  // ─── Main effect: Patch window.open to intercept crypto.link.com redirects ───
  // Uses launchRef so this effect only runs once (stable deps) and never re-runs
  // to kill the overlay on re-render.
  useEffect(() => {
    if (!enabled || !walletAddress || !publishableKey) return;

    const originalOpen = window.open;

    window.open = function patchedOpen(
      url?: string | URL,
      target?: string,
      features?: string
    ): WindowProxy | null {
      const urlStr = String(url || "").toLowerCase();

      if (urlStr.includes("crypto.link.com") || urlStr.includes("link.com/crypto")) {
        console.log("[STRIPE INTERCEPTOR] 🎯 Intercepted window.open to:", urlStr);
        launchRef.current();
        return null;
      }

      return originalOpen.call(window, url, target, features);
    };

    console.log("[STRIPE INTERCEPTOR] ✓ window.open patched — watching for crypto.link.com redirects");

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.("a") as HTMLAnchorElement | null;
      if (anchor) {
        const href = (anchor.href || "").toLowerCase();
        if (href.includes("crypto.link.com") || href.includes("link.com/crypto")) {
          e.preventDefault();
          e.stopPropagation();
          launchRef.current();
        }
      }
    };
    document.addEventListener("click", handleClick, true);

    return () => {
      window.open = originalOpen;
      document.removeEventListener("click", handleClick, true);
      // Do NOT remove the overlay here — this cleanup runs on dep changes,
      // not just unmount. The overlay has its own close button.
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      console.log("[STRIPE INTERCEPTOR] ✓ Cleaned up, window.open restored");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, walletAddress, publishableKey]);

  // ─── Unmount-only cleanup: remove overlay if component truly unmounts ───
  useEffect(() => {
    return () => {
      try { document.getElementById("pp-stripe-onramp-overlay")?.remove(); } catch { }
    };
  }, []);
}
