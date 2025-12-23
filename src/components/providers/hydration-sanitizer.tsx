"use client";

import { useEffect } from "react";

export function HydrationSanitizer() {
  useEffect(() => {
    try {
      const b = document.body as any;
      if (b) {
        delete b.dataset?.newGrCsCheckLoaded;
        delete b.dataset?.grExtInstalled;
        b.removeAttribute?.("data-new-gr-c-s-check-loaded");
        b.removeAttribute?.("data-gr-ext-installed");
      }
    } catch {}
  }, []);
  return null;
}


