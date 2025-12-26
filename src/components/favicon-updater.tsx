"use client";

import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export function FaviconUpdater() {
    const { theme } = useTheme();

    useEffect(() => {
        if (theme.brandFaviconUrl) {
            // Update ALL instances of favicon links (rel="icon", rel="shortcut icon", etc.)
            const links = document.querySelectorAll("link[rel*='icon']");

            if (links.length > 0) {
                links.forEach((link: any) => {
                    if (link.href !== theme.brandFaviconUrl && !link.href.endsWith(theme.brandFaviconUrl)) {
                        link.href = theme.brandFaviconUrl;
                    }
                });
            } else {
                // Create shortcut icon if none exist
                const link = document.createElement("link");
                link.rel = "shortcut icon";
                link.href = theme.brandFaviconUrl;
                document.head.appendChild(link);
            }
        }
    }, [theme.brandFaviconUrl]);

    return null;
}
