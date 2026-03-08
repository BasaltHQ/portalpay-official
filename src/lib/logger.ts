/**
 * Centralized logger for BasaltSurge / PortalPay
 *
 * Silences ALL console.log output globally unless `DEBUG=true`.
 * console.warn and console.error are never touched.
 *
 * Server-side:  This module overrides console.log at import time.
 * Client-side:  An inline <Script> in layout.tsx does the same before hydration.
 *
 * To re-enable verbose logs, set DEBUG=true (server) or NEXT_PUBLIC_DEBUG=true (client).
 */

/* ── Resolve debug flag ─────────────────────────────────────────── */

const _isDebug = (() => {
    try {
        const v = (
            process.env.DEBUG
            || process.env.NEXT_PUBLIC_DEBUG
            || ""
        ).toLowerCase();
        return v === "true" || v === "1" || v === "yes";
    } catch {
        return false;
    }
})();

/* ── Global console.log gate (server-side) ──────────────────────── */

/** Original console.log — always available for explicit use */
const _log = console.log.bind(console);

if (!_isDebug) {
    // Silence all console.log calls across the entire server process
    console.log = function () { };
}

/* ── Public API ─────────────────────────────────────────────────── */

/** Check at runtime whether debug logging is enabled */
export function isDebug(): boolean {
    return _isDebug;
}

/**
 * Debug-level log — only prints when `DEBUG=true`.
 */
export function debug(tag: string, message: string, data?: unknown): void {
    if (!_isDebug) return;
    if (data !== undefined) {
        _log(`[${tag}] ${message}`, data);
    } else {
        _log(`[${tag}] ${message}`);
    }
}

/**
 * Info-level log — always prints (bypasses the global gate).
 * Use sparingly: startup banners, critical lifecycle events.
 */
export function info(tag: string, message: string, data?: unknown): void {
    if (data !== undefined) {
        _log(`[${tag}] ${message}`, data);
    } else {
        _log(`[${tag}] ${message}`);
    }
}

/**
 * Warn-level log — always prints.
 */
export function warn(tag: string, message: string, data?: unknown): void {
    if (data !== undefined) {
        console.warn(`[${tag}] ${message}`, data);
    } else {
        console.warn(`[${tag}] ${message}`);
    }
}

/**
 * Error-level log — always prints.
 */
export function error(tag: string, message: string, data?: unknown): void {
    if (data !== undefined) {
        console.error(`[${tag}] ${message}`, data);
    } else {
        console.error(`[${tag}] ${message}`);
    }
}

/* ── Branded Startup Banner ────────────────────────────────────── */

const BRAND_ASCII = `
    ____                   ____  _____                      
   / __ )____ __________ _/ / /_/ ___/__  ___________  ___  
  / __  / __ \`/ ___/ __ \`/ / __/\\__ \\/ / / / ___/ __ \\/ _ \\ 
 / /_/ / /_/ (__  ) /_/ / / /_ ___/ / /_/ / /  / /_/ /  __/ 
/_____/\\__,_/____/\\__,_/_/\\__//____/\\__,_/_/   \\__, /\\___/  
                                               /____/       
`;

let _bannerPrinted = false;

/**
 * Prints the branded startup banner once (always prints, bypasses gate).
 */
export function printBanner(): void {
    if (_bannerPrinted) return;
    _bannerPrinted = true;

    const mode = _isDebug ? "DEBUG" : "PRODUCTION";
    const nodeEnv = process.env.NODE_ENV ?? "development";
    const brandKey = process.env.NEXT_PUBLIC_BRAND_KEY || process.env.BRAND_KEY || "basaltsurge";

    _log(BRAND_ASCII);
    _log(`  ⚡  Environment : ${nodeEnv}`);
    _log(`  🔑  Brand Key   : ${brandKey}`);
    _log(`  📋  Log Mode    : ${mode}${_isDebug ? " (verbose)" : " (quiet — set DEBUG=true for verbose logs)"}`);
    _log(`  🕐  Started     : ${new Date().toISOString()}`);
    _log("");
}

