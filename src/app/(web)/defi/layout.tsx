import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthenticatedWallet, isOwnerWallet } from "@/lib/auth";
import { getSiteConfig } from "@/lib/site-config";
import QueryProvider from "./QueryProvider";

export default async function DefiLayout({ children }: { children: ReactNode }) {
  const config = await getSiteConfig();

  // If globally disabled, allow local, owner-only override via cookie/session set from Admin page
  if (config.defiEnabled === false) {
    try {
      const cookieStore = await cookies();
      const hasOverride = !!cookieStore.get("cb_defi_local_override")?.value;

      // Also allow the owner to bypass when globally disabled (dev convenience)
      let wallet = await getAuthenticatedWallet();
      if (!wallet) {
        const w = cookieStore.get("cb_wallet")?.value;
        if (w && /^0x[a-fA-F0-9]{40}$/.test(w)) wallet = w.toLowerCase();
      }
      const owner = isOwnerWallet(wallet);

      if (!hasOverride && !owner) {
        notFound();
      }
    } catch {
      notFound();
    }
  }

  return <QueryProvider>{children}</QueryProvider>;
}
