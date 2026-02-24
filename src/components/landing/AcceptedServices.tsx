"use client";

import React from "react";
import WhiteBrandIcon from "./WhiteBrandIcon";

const cashSizeMap: Record<string, { box: string; text: string }> = {
  sm: { box: "h-8 w-8", text: "text-3xl" },
  md: { box: "h-10 w-10", text: "text-4xl" },
  lg: { box: "h-12 w-12", text: "text-5xl" },
  xl: { box: "h-16 w-16", text: "text-6xl" },
};

export default function AcceptedServices({ size = "xl" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  // Curated monochrome SVGs; rendered as pure white with no background
  const icons = [
    { alt: "Apple Pay", url: "/logos/applepay.svg" },
    { alt: "Google Pay", url: "/logos/googlepay.svg" },
    { alt: "Samsung Pay", url: "/logos/samsungpay.svg" },
    { alt: "Visa", url: "/logos/visa.svg" },
    { alt: "Mastercard", url: "/logos/mastercard.svg" },
    { alt: "American Express", url: "/logos/americanexpress.svg" },
    // Represent Crypto with Ethereum mark (pure white, backgroundless)
    { alt: "Crypto", url: "/logos/ethereum.svg" },
  ];

  const cash = cashSizeMap[size] ?? cashSizeMap.xl;

  return (
    <section className="mt-6">
      <div className="glass-pane rounded-xl border p-4 md:p-5">
        <h2 className="text-xl font-semibold mb-3 text-center">Accepted here</h2>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {icons.map((i) => (
            <div key={i.alt} className="flex flex-col items-center gap-1 mx-2">
              <WhiteBrandIcon url={i.url} alt={i.alt} size={size as any} fallbackUrl={(i as any).fallbackUrl} />
              <span className="microtext text-muted-foreground">{i.alt}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1 mx-2">
            <span
              aria-label="Cash"
              title="Cash"
              className={`flex items-center justify-center ${cash.box} ${cash.text} text-white font-bold leading-none`}
            >
              $
            </span>
            <span className="microtext text-muted-foreground">Cash</span>
          </div>
        </div>
      </div>
    </section>
  );
}
