import { registerPlugin } from '@capacitor/core';

export interface HardwareProfile {
    type: string;
    hasSecondaryDisplay: boolean;
    hasBuiltInPrinter: boolean;
    hasAutoCutter: boolean;
    hasPINPad: boolean;
    hasCardReader: boolean;
    hardwareScannerType: string;
}

export interface DeviceProfilePlugin {
    getProfile(): Promise<HardwareProfile>;
}

// Register the native plugin 
const DeviceProfile = registerPlugin<DeviceProfilePlugin>('DeviceProfile');

export async function getHardwareProfile(): Promise<HardwareProfile> {
    try {
        const profile = await DeviceProfile.getProfile();
        return profile;
    } catch (err) {
        console.warn('Capacitor DeviceProfile plugin not available, falling back to GENERIC_PHONE', err);
        return {
            type: 'GENERIC_PHONE',
            hasSecondaryDisplay: false,
            hasBuiltInPrinter: false,
            hasAutoCutter: false,
            hasPINPad: false,
            hasCardReader: false,
            hardwareScannerType: 'SOFTWARE_ML_KIT'
        };
    }
}
