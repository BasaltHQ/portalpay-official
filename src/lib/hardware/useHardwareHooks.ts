import { registerPlugin } from '@capacitor/core';
import { useCallback, useState, useEffect } from 'react';
import { getHardwareProfile, HardwareProfile } from './DeviceCapabilities';
import { debug } from '@/lib/logger';

// ---- Plugin Interfaces ----
export interface ScannerPlugin {
    startScan(): Promise<{ value: string }>;
    stopScan(): Promise<void>;
}
export interface PrinterPlugin {
    printText(options: { text: string; ipAddress?: string; port?: number }): Promise<{ success: boolean }>;
    printImage(options: { base64: string }): Promise<{ success: boolean }>;
    printDocument(options: { text?: string; base64?: string }): Promise<{ success: boolean }>;
    requestStatus?(options: { n?: number }): Promise<{ status: number }>; // ESC SP n Hardware Polling
}
export interface FeedbackPlugin {
    successFeedback(): Promise<void>;
    errorFeedback(): Promise<void>;
}
export interface SecondaryDisplayPlugin {
    displayQR(options: { data?: string; base64?: string }): Promise<{ success: boolean }>;
    clearDisplay(): Promise<void>;
}

// ---- Register Plugins ----
const TopWiseScanner = registerPlugin<ScannerPlugin>('TopWiseScanner');
const IcodScanner = registerPlugin<ScannerPlugin>('IcodScanner');

const TopWisePrinter = registerPlugin<PrinterPlugin>('TopWisePrinter');
const KioskPrinter = registerPlugin<PrinterPlugin>('KioskPrinter');
const ExternalPrinter = registerPlugin<PrinterPlugin>('ExternalPrinter');
export const UsbPrinter = registerPlugin<PrinterPlugin>('UsbPrinter');
const ValorPrinter = registerPlugin<PrinterPlugin>('ValorPrinter');

const TopWiseFeedback = registerPlugin<FeedbackPlugin>('TopWiseFeedback');
const IcodFeedback = registerPlugin<FeedbackPlugin>('IcodFeedback');
const GenericFeedback = registerPlugin<FeedbackPlugin>('GenericFeedback');

const TopWiseDisplay = registerPlugin<SecondaryDisplayPlugin>('TopWiseDisplay');
const ValorDisplay = registerPlugin<SecondaryDisplayPlugin>('ValorDisplay');

// ---- React Hooks ----

export function useHardwareProfile() {
    const [profile, setProfile] = useState<HardwareProfile | null>(null);

    useEffect(() => {
        getHardwareProfile().then(setProfile);
    }, []);

    return profile;
}

export function useHardwareScanner() {
    const [isScanning, setIsScanning] = useState(false);
    const profile = useHardwareProfile();

    const startScan = useCallback(async (): Promise<string | null> => {
        if (profile?.hardwareScannerType === 'SOFTWARE_ML_KIT') {
            console.warn('Device requires software scanner layout');
            return null; // Signals component to open web camera
        }

        try {
            setIsScanning(true);
            const activeScanner = profile?.type === 'KIOSK_H2150B' ? IcodScanner : TopWiseScanner;
            const result = await activeScanner.startScan();
            return result.value;
        } catch (err) {
            console.error('Scan failed', err);
            return null;
        } finally {
            setIsScanning(false);
        }
    }, [profile]);

    const stopScan = useCallback(async () => {
        try {
            if (isScanning) {
                const activeScanner = profile?.type === 'KIOSK_H2150B' ? IcodScanner : TopWiseScanner;
                await activeScanner.stopScan();
                setIsScanning(false);
            }
        } catch (e) { }
    }, [isScanning, profile]);

    return { startScan, stopScan, isScanning };
}

export function useReceiptPrinter() {
    const profile = useHardwareProfile();

    const printDocument = useCallback(async (content: { text?: string; base64Image?: string }, printOptions?: { externalIp?: string }) => {
        try {
            debug('PRINTER', `printDocument called. Profile: ${JSON.stringify(profile)} Content text length: ${content.text?.length} Content base64 length: ${content.base64Image?.length}`);

            // Prioritize external network printer if IP is provided
            if (printOptions?.externalIp) {
                debug('PRINTER', `Using external printer at: ${printOptions.externalIp}`);
                if (content.text) {
                    await ExternalPrinter.printText({
                        ipAddress: printOptions.externalIp,
                        port: 9100,
                        text: content.text
                    });
                }
                return true;
            }

            // Fallback to built-in hardware
            if (!profile?.hasBuiltInPrinter) {
                console.warn('[PRINTER] No built-in printer detected. Profile type:', profile?.type, 'hasBuiltInPrinter:', profile?.hasBuiltInPrinter);
                return false;
            }

            let activePrinter: PrinterPlugin;

            if (profile.type === 'VALOR_VP550' || profile.type === 'VALOR_VP800') {
                debug('PRINTER', `Selected ValorPrinter for device type: ${profile.type}`);
                activePrinter = ValorPrinter;
            } else if (profile.type === 'KIOSK_H2150B') {
                debug('PRINTER', 'Selected KioskPrinter');
                activePrinter = KioskPrinter;
            } else {
                debug('PRINTER', `Selected TopWisePrinter for device type: ${profile.type}`);
                activePrinter = TopWisePrinter;
            }

            // Use the unified native document printing method to prevent overlapping hardware buffer jobs
            debug('PRINTER', 'Calling activePrinter.printDocument...');
            await activePrinter.printDocument({
                text: content.text,
                base64: content.base64Image
            });
            debug('PRINTER', 'printDocument resolved successfully');
            return true;
        } catch (err: any) {
            console.error('[PRINTER] Print failed:', err?.message || err, err);
            if (typeof window !== "undefined") {
                alert("Native Print Error: " + (err?.message || err));
            }
            return false;
        }
    }, [profile]);

    return { printDocument, hasPrinter: profile?.hasBuiltInPrinter || false };
}

export function useDeviceFeedback() {
    const profile = useHardwareProfile();

    const getFeedbackPlugin = useCallback(() => {
        if (profile?.type === 'TOPWISE_T6D') return TopWiseFeedback;
        if (profile?.type === 'KDS_21_5') return IcodFeedback;
        return GenericFeedback;
    }, [profile]);

    const playSuccess = useCallback(() => {
        getFeedbackPlugin().successFeedback().catch(console.error);
    }, [getFeedbackPlugin]);

    const playError = useCallback(() => {
        getFeedbackPlugin().errorFeedback().catch(console.error);
    }, [getFeedbackPlugin]);

    return { playSuccess, playError };
}

export function useQRCodeDisplay() {
    const profile = useHardwareProfile();

    const pushQRToCustomerScreen = useCallback(async (qrData: string, base64Image?: string) => {
        if (!profile?.hasSecondaryDisplay) return false;

        try {
            if (profile.type === 'VALOR_VP800') {
                await ValorDisplay.displayQR({ data: qrData, base64: base64Image });
            } else {
                await TopWiseDisplay.displayQR({ data: qrData, base64: base64Image });
            }
            return true;
        } catch (err: any) {
            console.error('Secondary display failed', err);
            if (typeof window !== "undefined") {
                alert("Native QR Display Error: " + err);
            }
            return false;
        }
    }, [profile]);

    const clearCustomerScreen = useCallback(async () => {
        if (!profile?.hasSecondaryDisplay) return;
        try {
            if (profile.type === 'VALOR_VP800') {
                await ValorDisplay.clearDisplay();
            } else {
                await TopWiseDisplay.clearDisplay();
            }
        } catch (e) { }
    }, [profile]);

    return { pushQRToCustomerScreen, clearCustomerScreen, hasSecondaryDisplay: profile?.hasSecondaryDisplay || false };
}
