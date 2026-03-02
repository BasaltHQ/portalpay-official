"use client";

import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * TitleUpdater
 * Subscribes to ThemeContext and updates the browser tab title (document.title)
 * to match the current brand name.
 */
export function TitleUpdater() {
    const { theme } = useTheme();

    useEffect(() => {
        if (typeof document !== "undefined" && theme.brandName) {
            // Only update the title if it's currently a default/placeholder or explicitly setting a merchant name.
            // DO NOT override a server-rendered partner name with "BasaltSurge" or "PortalPay" 
            // during the initial client-side hydration before the config API returns.
            const currentTitle = document.title;
            const newName = theme.brandName.trim();
            const isPlatformName = /^(Basalt\s*Surge|Portal\s*Pay)$/i.test(newName);

            // If the server already set a non-platform title, and ThemeContext is trying to revert it 
            // to a platform title (usually during default state), block the override.
            const serverSetPartnerTitle = currentTitle && !/^(Basalt\s*Surge|Portal\s*Pay)/i.test(currentTitle);

            if (serverSetPartnerTitle && isPlatformName) {
                return; // Respect the server-rendered partner title
            }

            // Otherwise, it's safe to update (e.g. valid merchant name from shop API, or initial platform load)
            // But append the brand name properly to avoid destroying page-specific prefixes
            if (currentTitle.includes('|')) {
                const prefix = currentTitle.split('|')[0].trim();
                document.title = `${prefix} | ${newName}`;
            } else {
                document.title = newName;
            }
        }
    }, [theme.brandName]);

    return null;
}
