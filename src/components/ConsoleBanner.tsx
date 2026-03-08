"use client";

import { useEffect } from "react";

const BANNER = [
    "    ____                   ____  _____",
    "   / __ )____ __________ _/ / /_/ ___/__  ___________  ___",
    "  / __  / __ `/ ___/ __ `/ / __/ __  / / / / ___/ __ \\/ _ \\",
    " / /_/ / /_/ (__  ) /_/ / / /_ ___/ / /_/ / /  / /_/ /  __/",
    "/_____/\\__,_/____/\\__,_/_/\\__//____/\\__,_/_/   \\__, /\\___/",
    "                                               /____/",
];

/**
 * Prints a branded ASCII banner in the browser console.
 * Only renders on platform containers (not partner).
 * Uses console._log (the saved original) so it bypasses the silence gate.
 */
export function ConsoleBanner() {
    useEffect(() => {
        try {
            const ct = (
                document.documentElement.getAttribute("data-pp-container-type") || "platform"
            ).toLowerCase();
            if (ct !== "platform") return;

            const log = (console as any)._log || console.log;
            log("");
            BANNER.forEach((line) => log(`%c${line}`, "color:#35ff7c;font-weight:bold"));
            log("");
        } catch { }
    }, []);

    return null;
}
