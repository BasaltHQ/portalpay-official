"use client";

import { ThirdwebProvider } from "thirdweb/react";

export function ThirdwebAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}
