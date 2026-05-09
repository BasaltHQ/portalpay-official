'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useBrand } from '@/contexts/BrandContext';
import { cachedFetch } from '@/lib/client-api-cache';
import { resolveBrandAppLogo } from "@/lib/branding";
import dynamic from "next/dynamic";
import { client } from "@/lib/thirdweb/client";
import { usePortalThirdwebTheme, getConnectButtonStyle, connectButtonClass } from "@/lib/thirdweb/theme";

const ConnectButton = dynamic(() => import("thirdweb/react").then((m) => m.ConnectButton), { ssr: false });

// Fixed hero/nav bar for Admin, aligned with global navbar and AdminSidebar offsets
// Mirrors docs header positioning: fixed under global nav, with blur + border.
export default function AdminHero() {
  const brand = useBrand();

  // Avoid generic placeholder brand names and generic platform assets in partner containers
  // Derive container type from runtime API (works across custom domains)
  const [container, setContainer] = useState<{ containerType: string }>({ containerType: 'unknown' });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await cachedFetch('/api/site/container', { cache: 'no-store' });
        if (!cancelled && j && typeof j === 'object') {
          setContainer({ containerType: String(j.containerType || 'unknown').toLowerCase() });
        }
      } catch { }
    })();
    return () => { cancelled = true; };
  }, []);
  const isPartnerContainer = (container.containerType || '').toLowerCase() === 'partner';
  const rawBrandName = String(brand?.name || '').trim();
  const isGenericBrandName =
    /^ledger\d*$/i.test(rawBrandName) ||
    /^partner\d*$/i.test(rawBrandName) ||
    /^default$/i.test(rawBrandName);
  const keyForDisplay = String((brand as any)?.key || '').trim();
  const titleizedKey = keyForDisplay.toLowerCase() === 'basaltsurge' ? 'BasaltSurge' : (keyForDisplay ? keyForDisplay.charAt(0).toUpperCase() + keyForDisplay.slice(1) : 'PortalPay');
  const finalName = (!rawBrandName || isGenericBrandName) ? titleizedKey : rawBrandName;
  const displayBrandName = finalName.toLowerCase() === 'basaltsurge' ? 'BasaltSurge' : finalName;

  const logoUrl = resolveBrandAppLogo(brand?.logos?.app, (brand as any)?.key);

  const twTheme = usePortalThirdwebTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-[70] admin-hero-bar">
      <div className="w-full flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {/* Brand logo */}
          <div className="flex items-center">
            <Image
              src={logoUrl}
              alt={displayBrandName || 'Brand'}
              width={140}
              height={36}
              className="object-contain h-8 w-auto max-w-[160px]"
            />
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-white/10" />

          {/* Admin Console title */}
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold text-white/90 tracking-tight">Admin Console</h1>
            <span className="admin-status-chip">
              <span className="status-dot" />
              <span>Live</span>
            </span>
          </div>
        </div>

        {/* Right side — brand badge and connect button */}
        <div className="hidden md:flex items-center">
          <ConnectButton
            client={client}
            theme={twTheme}
            connectButton={{
              label: "Sign In",
              className: connectButtonClass,
              style: getConnectButtonStyle(),
            }}
          />
        </div>
      </div>
    </header>
  );
}
