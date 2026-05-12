"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export function FaviconUpdater() {
    const { theme } = useTheme();
    // Track the authoritative favicon URL from ThemeContext
    const authoritativeFaviconRef = useRef<string>("");

    // Blocked favicon URLs — match by UUID regardless of hostname (Azure, AFD, or S3)
    const BLOCKED_FAVICON_PATHS = [
        "a311dcf8-e6de-4eca-a39c-907b347dff11",
    ];
    const BLOCKED_FAVICON_REPLACEMENT = "/Surge.png";

    // Platform-default favicons that should NOT override merchant branding
    const PLATFORM_FAVICONS = [
        "/Surge.png", "/favicon-32x32.png", "/ppsymbol.png",
        "/BasaltSurgeWideD.png", "/BasaltSurgeD.png", "/BasaltSurgeWide.png",
        "/cblogod.png", "/ppsymbolbg.png", "/watermark.png", "/api/favicon",
    ];

    function isBlockedFavicon(url: string): boolean {
        const normalized = url.trim().toLowerCase();
        return BLOCKED_FAVICON_PATHS.some(path => normalized.includes(path.toLowerCase()));
    }

    function isPlatformFavicon(url: string): boolean {
        if (!url) return false;
        return PLATFORM_FAVICONS.some(p => url.endsWith(p) || url.toLowerCase().includes(p.toLowerCase()));
    }

    /** Force all <link rel="*icon*"> elements to the given href */
    function applyFavicon(faviconUrl: string) {
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

    // Primary effect: update favicon when theme.brandFaviconUrl changes
    useEffect(() => {
        let faviconUrl = theme.brandFaviconUrl;

        // Check if this favicon is blocked and replace with fallback
        if (faviconUrl && isBlockedFavicon(faviconUrl)) {
            faviconUrl = BLOCKED_FAVICON_REPLACEMENT;
        }

        // Guard: Don't overwrite partner favicons with platform defaults
        const isPartner = typeof document !== "undefined" &&
            document.documentElement.getAttribute("data-pp-container-type") === "partner";
        if (isPartner && faviconUrl && isPlatformFavicon(faviconUrl)) {
            // Check if there's already a non-platform favicon set in the DOM — preserve it
            const existingLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
            if (existingLink?.href && !isPlatformFavicon(existingLink.href)) {
                console.log("[FaviconUpdater] Skipping platform favicon override for partner:", faviconUrl);
                return;
            }
        }

        if (faviconUrl) {
            authoritativeFaviconRef.current = faviconUrl;
            applyFavicon(faviconUrl);
        }
    }, [theme.brandFaviconUrl]);

    // Defensive MutationObserver: guard against ThemeLoader or other scripts
    // overwriting the merchant favicon with a platform default after we've set it.
    useEffect(() => {
        if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

        const observer = new MutationObserver((mutations) => {
            const authoritative = authoritativeFaviconRef.current;
            // Only defend if we have a non-platform authoritative favicon
            if (!authoritative || isPlatformFavicon(authoritative)) return;

            for (const mutation of mutations) {
                // Handle attribute changes on existing link elements
                if (mutation.type === "attributes" && mutation.attributeName === "href") {
                    const target = mutation.target as HTMLLinkElement;
                    const rel = (target.getAttribute("rel") || "").toLowerCase();
                    if (rel.includes("icon")) {
                        const newHref = target.href || "";
                        // If something overwrote our merchant favicon with a platform default, revert it
                        if (isPlatformFavicon(newHref) && !newHref.endsWith(authoritative)) {
                            console.log("[FaviconUpdater] Reverting external favicon override:", newHref, "→", authoritative);
                            target.href = authoritative;
                        }
                    }
                }
                // Handle new link elements being added to <head>
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLLinkElement) {
                            const rel = (node.getAttribute("rel") || "").toLowerCase();
                            if (rel.includes("icon")) {
                                const href = node.href || "";
                                if (isPlatformFavicon(href) && !href.endsWith(authoritative)) {
                                    console.log("[FaviconUpdater] Overriding newly-added platform favicon:", href, "→", authoritative);
                                    node.href = authoritative;
                                }
                            }
                        }
                    });
                }
            }
        });

        observer.observe(document.head, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["href"],
        });

        return () => observer.disconnect();
    }, []);

    return null;
}
