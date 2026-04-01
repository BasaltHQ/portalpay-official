"use client";

import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation, OrientationType } from "@capacitor/screen-orientation";

type RotationState = "landscape" | "portrait";

export function useKDSOrientation() {
    const [orientation, setOrientation] = useState<RotationState>("landscape");
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        // Detect if we are running physically inside the Kiosk/Terminal Capacitor shell
        const native = Capacitor.isNativePlatform();
        setIsNative(native);

        if (native) {
            // Check memory cache for previous saved rotation
            const saved = localStorage.getItem("kds_screen_orientation") as RotationState | null;
            if (saved === "portrait" || saved === "landscape") {
                setOrientation(saved);
                try {
                    ScreenOrientation.lock({ orientation: saved });
                } catch (e) {
                    console.warn("Failed to natively lock screen orientation:", e);
                }
            } else {
                // By default KDS displays are landscape
                setOrientation("landscape");
                try {
                    ScreenOrientation.lock({ orientation: "landscape" });
                } catch (e) {
                    console.warn("Failed to natively lock screen orientation:", e);
                }
            }
        }
    }, []);

    const toggleRotation = async () => {
        const next: RotationState = orientation === "landscape" ? "portrait" : "landscape";
        setOrientation(next);
        
        // Save to localized persistent memory so it survives reboots
        localStorage.setItem("kds_screen_orientation", next);

        if (isNative) {
            try {
                await ScreenOrientation.lock({ orientation: next });
            } catch (e) {
                console.error("Native orientation lock failed:", e);
            }
        } else {
            // Visual feedback for web development environment
            console.log(`[Simulator] Screen orientation toggled to: ${next}`);
        }
    };

    return { orientation, toggleRotation, isNative };
}
