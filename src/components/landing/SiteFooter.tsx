"use client";

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from "../../contexts/ThemeContext";
import { useBrand } from "../../contexts/BrandContext";

const navigationLinks = [
  { label: 'Home', href: '#hero' },
  { label: 'Features', href: '#features' },
  { label: 'AI Agents', href: '#ai-agents' },
  { label: 'Pricing', href: '#pricing' },
];

const ecosystemLinks = [
  { label: 'BasaltHQ', href: 'https://basalthq.com', description: 'Main Homepage' },
  { label: 'BasaltCRM', href: 'https://crm.basalthq.com', description: 'Customer Relations' },
  { label: 'BasaltERP', href: 'https://erp.basalthq.com', description: 'Enterprise Resource' },
  { label: 'BasaltCMS', href: 'https://cms.basalthq.com', description: 'Content Management' },
  { label: 'BasaltEcho', href: 'https://echo.basalthq.com', description: 'AI Communications' },
  { label: 'BasaltOnyx', href: 'https://onyx.basalthq.com', description: 'Analytics & BI' },
  { label: 'Developer API', href: '/developers' },
  { label: 'Status', href: 'https://status.basalthq.com' },
];

const socialLinks = [
  { label: 'Twitter', href: 'https://twitter.com/BasaltHQ' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/basalthq' },
  { label: 'GitHub', href: 'https://github.com/basalthq' },
  { label: 'Discord', href: 'https://discord.gg/gcgNugyWkg' },
];

export default function SiteFooter() {
  const { theme } = useTheme();
  const brand = useBrand();

  // Get navbarMode from brand context or theme
  const navbarMode = (brand as any)?.logos?.navbarMode || theme.navbarMode;

  // Determine if this is a partner container based on the effective brand key
  const isPartner = React.useMemo(() => {
    const key = String(theme.brandKey || (brand as any)?.key || "").toLowerCase();
    return key && key !== "basaltsurge" && key !== "portalpay";
  }, [theme.brandKey, (brand as any)?.key]);

  return (
    <footer className="relative py-16 px-6 border-t border-white/10 mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div>
            {/* Check navbarMode for logo display preference */}
            {(() => {
              const useFullWidthLogo = navbarMode === "logo" || (isPartner && navbarMode !== "symbol");
              const fullWidthLogo = theme.brandLogoUrl || (brand as any)?.logos?.app;

              if (useFullWidthLogo && fullWidthLogo) {
                // Full-width logo mode
                return (
                  <div className="mb-6">
                    <div className="relative h-10 w-auto max-w-[200px]">
                      <Image
                        src={fullWidthLogo}
                        alt={theme.brandName || "Brand Logo"}
                        fill
                        className="object-contain object-left"
                      />
                    </div>
                  </div>
                );
              } else {
                // Symbol + Text mode
                return (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative w-12 h-12">
                      {theme.brandLogoUrl ? (
                        <Image
                          src={theme.symbolLogoUrl || theme.brandLogoUrl}
                          alt={theme.brandName || "Brand Logo"}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 rounded-full" />
                      )}

                      {/* Only show gleam for Basalt/PortalPay */}
                      {!isPartner && <div className="shield-gleam-container" />}
                    </div>
                    <div>
                      {theme.brandName === "BasaltSurge" ? (
                        <span className="text-white text-xl tracking-widest uppercase font-vox whitespace-nowrap" style={{ fontFamily: 'vox, sans-serif' }}>
                          <span style={{ fontWeight: 300 }}>BASALT</span><span style={{ fontWeight: 700 }}>SURGE</span>
                        </span>
                      ) : (
                        <span className="text-white text-xl tracking-widest font-bold uppercase" style={{ fontFamily: theme.fontFamily }}>
                          {theme.brandName || "Brand"}
                        </span>
                      )}
                      {!isPartner && (
                        <p className="text-[10px] font-mono mt-1 whitespace-nowrap" style={{ color: theme.primaryColor }}>AI-POWERED RELATIONSHIPS</p>
                      )}
                    </div>
                  </div>
                );
              }
            })()}
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              <span className="font-semibold" style={{ color: theme.primaryColor }}>Payments. Portals. Power.</span> The financial backbone of the ecosystem, enabling seamless crypto and fiat transactions.
            </p>
            {!isPartner && (
              <a
                href="mailto:info@basalthq.com"
                className="text-sm hover:underline"
                style={{ color: theme.primaryColor }}
              >
                info@basalthq.com
              </a>
            )}
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-mono tracking-wider text-gray-500 mb-4">NAVIGATE</h4>
            <ul className="space-y-2">
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ecosystem (Available only for Platform) */}
          {!isPartner && (
            <div>
              <h4 className="text-xs font-mono tracking-wider text-gray-500 mb-4">ECOSYSTEM</h4>
              <ul className="space-y-2">
                {ecosystemLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1"
                    >
                      {link.label}
                      {link.href.startsWith("http") && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 0 00-2 2v10a2 0 002 2h10a2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Connect (Default / Platform only for now) */}
          {!isPartner && (
            <div>
              <h4 className="text-xs font-mono tracking-wider text-gray-500 mb-4">CONNECT</h4>
              <ul className="space-y-2">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 text-sm hover:text-[var(--primary)] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <h4 className="text-xs font-mono tracking-wider text-gray-500 mb-2">STATUS</h4>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[var(--primary)]"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                  </span>
                  <span className="text-xs font-mono text-[var(--primary)]">ALL SYSTEMS OPERATIONAL</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} {theme.brandName || "BasaltSurge"}. All rights reserved.
          </p>

          {/* ElevenLabs Grant Badge */}
          <div className="flex justify-center">
            <a
              href="https://elevenlabs.io/startup-grants"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative transition-all duration-500 hover:scale-105"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <Image
                src="/elevenlabs-grants.webp"
                alt="ElevenLabs Startup Grant"
                width={160}
                height={40}
                className="relative object-contain w-[140px] opacity-70 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0"
              />
            </a>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/legal/privacy" className="text-gray-500 text-xs hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="text-gray-500 text-xs hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
