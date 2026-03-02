"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * TitleUpdater
 * Subscribes to ThemeContext and updates the browser tab title (document.title)
 * to match the current brand name. Uses a MutationObserver to actively defend
 * partner titles against aggressive Next.js metadata hydration overwrites.
 */
export function TitleUpdater() {
    const { theme } = useTheme();
    const isObserving = useRef(false);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const isPartnerContainer = document.documentElement.getAttribute('data-pp-container-type') === 'partner';
        const newName = theme.brandName?.trim() || "";
        const isThemePlatformName = /^(Basalt\s*Surge|Portal\s*Pay)$/i.test(newName);

        // Core validation and update logic
        const enforceTitle = () => {
            const currentTitle = document.title;

            // If the server already set a non-platform title, and ThemeContext is trying to revert it 
            // to a platform title (usually during default state), block the override.
            const serverSetPartnerTitle = currentTitle && !/^(Basalt\s*Surge|Portal\s*Pay|PortalPay)/i.test(currentTitle);

            // Double guard: If we are in a partner container, strictly forbid reverting to the platform name
            if ((serverSetPartnerTitle || isPartnerContainer) && isThemePlatformName) {
                return; // Respect the server-rendered partner title
            }

            if (!newName) return;

            // Otherwise, it's safe to update (e.g. valid merchant name from shop API, or initial platform load)
            // But append the brand name properly to avoid destroying page-specific prefixes
            if (currentTitle.includes('|')) {
                const prefix = currentTitle.split('|')[0].trim();
                const proposedTitle = `${prefix} | ${newName}`;
                if (document.title !== proposedTitle) {
                    document.title = proposedTitle;
                }
            } else {
                if (document.title !== newName) {
                    document.title = newName;
                }
            }
        };

        // Run immediately on theme change
        enforceTitle();

        // ONLY mount the heavy defensive observer if we are explicitly a partner container
        // to prevent Next.js from flashing "BasaltSurge" during lazy navigations or suspense boundaries.
        if (isPartnerContainer && !isObserving.current) {
            const head = document.querySelector('head');
            if (head) {
                isObserving.current = true;
                const observer = new MutationObserver((mutations) => {
                    let titleMutated = false;
                    for (const mutation of mutations) {
                        if (mutation.target.nodeName === 'TITLE') {
                            titleMutated = true;
                            break;
                        }
                        for (const added of Array.from(mutation.addedNodes)) {
                            if (added.nodeName === 'TITLE') {
                                titleMutated = true;
                                break;
                            }
                        }
                        if (titleMutated) break;
                    }

                    if (titleMutated) {
                        // If Next.js just forced a generic platform title, revert it
                        const current = document.title;
                        if (/^(Basalt\s*Surge|Portal\s*Pay|PortalPay)/i.test(current)) {
                            // Determine the correct title based on the theme (which has the real partner name)
                            // or fallback to the brandName data attribute if the theme is still booting
                            const fallbackName = document.documentElement.getAttribute('data-pp-brand-name') || "";
                            const safeName = (newName && !isThemePlatformName) ? newName : (fallbackName && !/^(Basalt\s*Surge|Portal\s*Pay|PortalPay)/i.test(fallbackName) ? fallbackName : "");

                            if (safeName) {
                                // Overriding Next.js mutation
                                document.title = current.includes('|')
                                    ? `${current.split('|')[0].trim()} | ${safeName}`
                                    : safeName;
                            }
                        }
                    }
                });

                observer.observe(head, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                });

                return () => {
                    observer.disconnect();
                    isObserving.current = false;
                };
            }
        }
    }, [theme.brandName]);

    return null;
}
