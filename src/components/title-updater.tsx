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
            document.title = theme.brandName;
        }
    }, [theme.brandName]);

    return null;
}
