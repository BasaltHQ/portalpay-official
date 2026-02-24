import { registerPlugin } from '@capacitor/core';
import { useCallback, useState, useEffect } from 'react';
import { getHardwareProfile, HardwareProfile } from './DeviceCapabilities';

// ---- Plugin Interfaces ----
export interface ScannerPlugin {
    startScan(): Promise<{ value: string }>;
    stopScan(): Promise<void>;
}
export interface PrinterPlugin {
    printText(options: { text: string }): Promise<{ success: boolean }>;
    printImage(options: { base64: string }): Promise<{ success: boolean }>;
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
const HardwareScanner = registerPlugin<ScannerPlugin>('HardwareScanner');
const TopWisePrinter = registerPlugin<PrinterPlugin>('TopWisePrinter');
const KioskPrinter = registerPlugin<PrinterPlugin>('KioskPrinter');
const ExternalPrinter = registerPlugin<PrinterPlugin>('ExternalPrinter');
const DeviceFeedback = registerPlugin<FeedbackPlugin>('DeviceFeedback');
const SecondaryDisplay = registerPlugin<SecondaryDisplayPlugin>('SecondaryDisplay');
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
            const result = await HardwareScanner.startScan();
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
                await HardwareScanner.stopScan();
                setIsScanning(false);
            }
        } catch (e) { }
    }, [isScanning]);

    return { startScan, stopScan, isScanning };
}

export function useReceiptPrinter() {
    const profile = useHardwareProfile();

    const printDocument = useCallback(async (content: { text?: string; base64Image?: string }, printOptions?: { externalIp?: string }) => {
        try {
            // Prioritize external network printer if IP is provided
            if (printOptions?.externalIp) {
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
                console.warn('No built-in printer detected');
                return false;
            }

            // Direct route for Valor devices using the injected Javascript bridge
            if (profile.type === 'VALOR_VP550' || profile.type === 'VALOR_VP800') {
                if (typeof window !== "undefined" && (window as any).ValorPrint) {
                    const P = (window as any).ValorPrint;
                    try {
                        P.initPrinter();
                        if (content.text) {
                            const lines = content.text.split('\n');
                            for (const line of lines) {
                                if (line.trim() === '') {
                                    P.feedPaper(20);
                                } else if (line.includes('RECEIPT') || line.includes('TOTAL') || line.includes('STATUS')) {
                                    P.drawtext(line, 24, true, "CENTER");
                                } else {
                                    P.drawtext(line, 20, false, "LEFT");
                                }
                            }
                            P.feedPaper(50);
                            P.print();
                        }
                        return true;
                    } catch (e) {
                        console.error("Valor sdk print exception", e);
                        return false;
                    }
                } else {
                    console.warn("ValorPrint interface not found on Valor device");
                    return false;
                }
            }

            const activePrinter = profile.type === 'KIOSK_H2150B' ? KioskPrinter : TopWisePrinter;

            // Use the unified native document printing method to prevent overlapping hardware buffer jobs
            await activePrinter.printDocument({
                text: content.text,
                base64: content.base64Image
            });
            return true;
        } catch (err) {
            console.error('Print failed:', err);
            return false;
        }
    }, [profile]);

    return { printDocument, hasPrinter: profile?.hasBuiltInPrinter || false };
}

export function useDeviceFeedback() {
    const playSuccess = useCallback(() => {
        DeviceFeedback.successFeedback().catch(console.error);
    }, []);

    const playError = useCallback(() => {
        DeviceFeedback.errorFeedback().catch(console.error);
    }, []);

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
                await SecondaryDisplay.displayQR({ data: qrData, base64: base64Image });
            }
            return true;
        } catch (err) {
            console.error('Secondary display failed', err);
            return false;
        }
    }, [profile]);

    const clearCustomerScreen = useCallback(async () => {
        if (!profile?.hasSecondaryDisplay) return;
        try {
            if (profile.type === 'VALOR_VP800') {
                await ValorDisplay.clearDisplay();
            } else {
                await SecondaryDisplay.clearDisplay();
            }
        } catch (e) { }
    }, [profile]);

    return { pushQRToCustomerScreen, clearCustomerScreen, hasSecondaryDisplay: profile?.hasSecondaryDisplay || false };
}
