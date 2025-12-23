"use client";

import React, { MouseEvent } from "react";
import Link from "next/link";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";

/**
 * LoginGateLink
 * - Acts like a normal Next.js Link when the user is logged in
 * - If the user is logged out, prevents navigation and dispatches a global event to prompt the Auth modal
 * - Keeps the user on the current page (e.g., /developers/docs/...) while presenting a dismissible login modal
 */
export function LoginGateLink({
  href,
  children,
  className,
  title,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const account = useActiveAccount();
  const activeWallet = useActiveWallet();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    try {
      if (!account?.address) {
        e.preventDefault();
        // Prefer social login UI for embedded wallet types if detectable,
        // but it's okay if this is undefined and navbar will choose default presentation.
        const walletId = activeWallet?.id;
        const isEmbeddedWallet = walletId === "inApp" || walletId === "embedded";
        window.dispatchEvent(
          new CustomEvent("pp:auth:prompt", {
            detail: {
              href,
              reason: "dashboard_access",
              preferSocial: Boolean(isEmbeddedWallet),
            },
          })
        );
      }
      // If logged in, allow normal Link navigation
    } catch {
      // Fail-safe: do nothing
    }
  }

  return (
    <Link href={href} onClick={handleClick} className={className} title={title}>
      {children}
    </Link>
  );
}

export default LoginGateLink;
