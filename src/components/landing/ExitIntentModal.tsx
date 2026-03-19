"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Exit-Intent Email Capture Modal                                    */
/*  Uses the same CRM form submission pattern as ContactFormSection.   */
/* ------------------------------------------------------------------ */

const FORM_SLUG = "surge-newsletter-form-f8d534e6";
const API_ENDPOINT = "https://crm.basalthq.com//api/forms/submit";

interface ExitIntentModalProps {
  accentColor?: string;
}

export function ExitIntentModal({ accentColor = "#F54029" }: ExitIntentModalProps) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Exit-intent detection — fires when cursor leaves the viewport from the top
  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only trigger when cursor exits through the top of the viewport
      if (e.clientY <= 0 && !dismissed && !show && !submitted) {
        setShow(true);
      }
    },
    [dismissed, show, submitted]
  );

  useEffect(() => {
    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem("exit-intent-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Small delay before attaching the listener so it doesn't fire immediately
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000); // 5 second grace period

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("exit-intent-dismissed", "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("form_slug", FORM_SLUG);
      formData.append("email", email.trim());
      formData.append("source_url", window.location.href);
      if (document.referrer) formData.append("referrer", document.referrer);

      // UTM params
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("utm_source")) formData.append("utm_source", urlParams.get("utm_source")!);
      if (urlParams.has("utm_medium")) formData.append("utm_medium", urlParams.get("utm_medium")!);
      if (urlParams.has("utm_campaign")) formData.append("utm_campaign", urlParams.get("utm_campaign")!);

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSubmitted(true);
        sessionStorage.setItem("exit-intent-dismissed", "1");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={dismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top accent gradient bar */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80, ${accentColor})`,
          }}
        />

        <div className="p-8">
          {submitted ? (
            /* Success State */
            <div className="text-center py-4">
              <div
                className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: accentColor }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">You&apos;re In!</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Welcome aboard! We&apos;ll keep you updated with the latest from BasaltSurge — no spam, just signal.
              </p>
              <button
                onClick={dismiss}
                className="px-8 py-3 rounded-lg text-white text-sm font-bold transition-all hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                GOT IT
              </button>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Wait — Don&apos;t Miss Out!
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Get early access to platform updates, industry insights, and exclusive offers.{" "}
                  <span className="text-emerald-400 font-semibold">No spam, ever.</span>
                </p>
              </div>

              {/* Free tier reminder */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-5">
                <span className="text-2xl font-black text-white leading-none">$0</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest">/MO<br />FOREVER</span>
                <div className="h-6 w-px bg-white/10" />
                <p className="text-[11px] text-gray-400 leading-snug">
                  No subscription. All industry packs included. Processing fee paid by the customer.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/30 transition-colors"
                    disabled={submitting}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-lg text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accentColor }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    "Stay in the Loop"
                  )}
                </button>

                <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                  By subscribing you agree to receive emails from BasaltSurge. Unsubscribe anytime.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
