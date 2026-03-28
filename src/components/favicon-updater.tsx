"use client";

import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export function FaviconUpdater() {
    const { theme } = useTheme();

    // Blocked favicon URLs — match by UUID regardless of hostname (Azure, AFD, or S3)
    const BLOCKED_FAVICON_PATHS = [
        "a311dcf8-e6de-4eca-a39c-907b347dff11",
    ];
    const BLOCKED_FAVICON_REPLACEMENT = "/Surge.png";

    function isBlockedFavicon(url: string): boolean {
        const normalized = url.trim().toLowerCase();
        return BLOCKED_FAVICON_PATHS.some(path => normalized.includes(path.toLowerCase()));
    }

    useEffect(() => {
        let faviconUrl = theme.brandFaviconUrl;

        // Check if this favicon is blocked and replace with fallback
        if (faviconUrl && isBlockedFavicon(faviconUrl)) {
            faviconUrl = BLOCKED_FAVICON_REPLACEMENT;
        }

        // Guard: Don't overwrite partner favicons with platform defaults
        const PLATFORM_FAVICONS = [
            "/Surge.png", "/favicon-32x32.png", "/ppsymbol.png",
            "/BasaltSurgeWideD.png", "/BasaltSurgeD.png", "/BasaltSurgeWide.png",
            "/cblogod.png", "/ppsymbolbg.png", "/watermark.png",
        ];
        const isPartner = typeof document !== "undefined" &&
            document.documentElement.getAttribute("data-pp-container-type") === "partner";
        if (isPartner && faviconUrl && PLATFORM_FAVICONS.some(p => faviconUrl.endsWith(p) || faviconUrl.toLowerCase().includes(p.toLowerCase()))) {
            // Check if there's already a non-platform favicon set in the DOM — preserve it
            const existingLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
            if (existingLink?.href && !PLATFORM_FAVICONS.some(p => existingLink.href.endsWith(p))) {
                console.log("[FaviconUpdater] Skipping platform favicon override for partner:", faviconUrl);
                return;
            }
        }

        if (faviconUrl) {
            // Update ALL instances of favicon links (rel="icon", rel="shortcut icon", etc.)
            const links = document.querySelectorAll("link[rel*='icon']");

            if (links.length > 0) {
                links.forEach((link: any) => {
                    if (link.href !== faviconUrl && !link.href.endsWith(faviconUrl)) {
                        link.href = faviconUrl;
                    }
                });
            } else {
                // Create shortcut icon if none exist
                const link = document.createElement("link");
                link.rel = "shortcut icon";
                link.href = faviconUrl;
                document.head.appendChild(link);
            }
        }
    }, [theme.brandFaviconUrl]);

    return null;
}
