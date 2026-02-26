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
