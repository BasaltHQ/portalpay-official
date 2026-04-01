"use client";

import { useState, useEffect } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";

// Bind to custom Capacitor plugin we wrote in Android
const DeviceProfile = registerPlugin<any>("DeviceProfile");

type RotationState = "landscape" | "portrait" | "auto";

export function useKDSOrientation() {
    const [orientation, setOrientation] = useState<RotationState>("landscape");
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        // Detect if running physically inside the Capacitor shell
        const native = Capacitor.isNativePlatform();
        setIsNative(native);

        if (native) {
            // Check memory cache for standard tablets
            const saved = localStorage.getItem("kds_screen_orientation") as RotationState | null;
            if (saved === "portrait" || saved === "landscape") {
                setOrientation(saved);
                try {
                    ScreenOrientation.lock({ orientation: saved });
                } catch (e) {
                    console.warn("Failed to natively lock screen orientation:", e);
                }
            } else {
                setOrientation("auto");
            }
        }
    }, []);

    // 1. Standard API for generic iPads and consumer Android tablets
    const setSoftRotation = async (type: "landscape" | "portrait" | "auto") => {
        setOrientation(type);
        
        if (!isNative) {
            console.log(`[Simulator] Screen orientation toggled to: ${type}`);
            return;
        }

        try {
            if (type === "auto") {
                await ScreenOrientation.unlock();
                localStorage.removeItem("kds_screen_orientation");
            } else {
                await ScreenOrientation.lock({ orientation: type });
                localStorage.setItem("kds_screen_orientation", type);
            }
        } catch (e) {
            console.error("Native software orientation lock failed:", e);
        }
    };

    // 2. Aggressive Kernel API for Fixed Hardware / SZHRET Firmwares
    const setHardRotation = async (degree: 0 | 1 | 2 | 3) => {
        if (!isNative) {
            alert(`[Simulator] Would reboot and force OS to rotation config: ${degree}`);
            return;
        }

        try {
            // This will instantly reboot the device upon completion
            await DeviceProfile.setSystemRotation({ rotation: degree });
        } catch (e) {
            console.error("Failed to commit hardware orientation reboot:", e);
            alert("Hardware rotation failed. Permission Denied or Not Rooted.");
        }
    };

    return { orientation, setSoftRotation, setHardRotation, isNative };
}
