"use client";

import React from "react";
import WhiteBrandIcon from "./WhiteBrandIcon";
import MaskBrandIcon from "./MaskBrandIcon";

export default function TechnologyPartners() {
  // Curated monochrome SVGs rendered as pure white with transparent backgrounds
  const icons = [
    { alt: "Microsoft Azure", url: "/logos/microsoftazure.svg" },
    { alt: "Amazon Web Services", url: "/logos/amazonaws.svg" },
    { alt: "Thirdweb", url: "/logos/thirdweb.svg" },
    { alt: "Base (Ethereum L2)", url: "/logos/base.png" },
    { alt: "Ethereum", url: "/logos/ethereum.svg" },
    { alt: "ElevenLabs", url: "/logos/elevenlabs-symbol.svg", className: "scale-200" },
  ];

  return (
    <section className="mt-6 mb-10">
      <div className="glass-pane rounded-xl border p-4 md:p-5">
        <h2 className="text-xl font-semibold mb-3 text-center">Technology partners</h2>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {icons.map((i) => (
            <div key={i.alt} className="flex flex-col items-center gap-1 mx-2">
              {i.alt.includes("Base") ? (
                <MaskBrandIcon url="/logos/base.png" alt={i.alt} size="xl" />
              ) : (
                <WhiteBrandIcon url={i.url} alt={i.alt} size="xl" fallbackUrl={(i as any).fallbackUrl} className={(i as any).className || ""} />
              )}
              <span className="microtext text-muted-foreground">{i.alt}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
