import { registerPlugin } from '@capacitor/core';
import { useCallback, useState } from 'react';
import { useHardwareProfile } from './DeviceCapabilities';

export interface CardResult {
    type: 'MAGSTRIPE' | 'IC' | 'NFC' | 'UNKNOWN';
    pan?: string;
    expireDate?: string;
    track2?: string;
}

export interface CardReaderPlugin {
    startCardDetection(): Promise<CardResult>;
    stopCardDetection(): Promise<void>;
}

export interface PinPadPlugin {
    requestPin(options: { amount?: string; pan?: string }): Promise<{ success: boolean; pinBlock: string }>;
    cancelPin(): Promise<void>;
    // Uses addListener('pinPadEvent', () => {}) for live keypress updates
}

const CardReader = registerPlugin<CardReaderPlugin>('CardReader');
const PinPad = registerPlugin<PinPadPlugin>('PinPad');

export interface ValorPaymentPlugin {
    initializePayment(): Promise<{ success: boolean; message: string }>;
    performTransaction(options: { amount: string }): Promise<{
        success: boolean;
        authCode?: string;
        responseCode?: string;
        rrn?: string;
    }>;
    addListener(
        eventName: 'valorPaymentProgress',
        listenerFunc: (info: { message: string }) => void
    ): Promise<import('@capacitor/core').PluginListenerHandle> & import('@capacitor/core').PluginListenerHandle;
}

const ValorPayment = registerPlugin<ValorPaymentPlugin>('ValorPayment');

export function useCardReader() {
    const profile = useHardwareProfile();
    const [isWaitingForCard, setIsWaitingForCard] = useState(false);

    const startDetection = useCallback(async (): Promise<CardResult | null> => {
        if (!profile?.hasCardReader) return null;

        try {
            setIsWaitingForCard(true);
            const result = await CardReader.startCardDetection();
            return result;
        } catch (err) {
            console.error('Card detection failed', err);
            return null;
        } finally {
            setIsWaitingForCard(false);
        }
    }, [profile]);

    const stopDetection = useCallback(async () => {
        if (!profile?.hasCardReader) return;
        try {
            if (isWaitingForCard) {
                await CardReader.stopCardDetection();
                setIsWaitingForCard(false);
            }
        } catch (e) { }
    }, [profile, isWaitingForCard]);

    return { startDetection, stopDetection, isWaitingForCard, hasHardware: profile?.hasCardReader || false };
}

export function usePinPad() {
    const profile = useHardwareProfile();
    const [isWaitingForPin, setIsWaitingForPin] = useState(false);

    const requestPin = useCallback(async (amount: string, pan: string): Promise<string | null> => {
        if (!profile?.hasPINPad) return null;

        try {
            setIsWaitingForPin(true);
            const result = await PinPad.requestPin({ amount, pan });
            return result.pinBlock;
        } catch (err) {
            console.error('PIN request failed', err);
            return null;
        } finally {
            setIsWaitingForPin(false);
        }
    }, [profile]);

    const cancelPin = useCallback(async () => {
        if (!profile?.hasPINPad) return;
        try {
            if (isWaitingForPin) {
                await PinPad.cancelPin();
                setIsWaitingForPin(false);
            }
        } catch (e) { }
    }, [profile, isWaitingForPin]);

    return { requestPin, cancelPin, isWaitingForPin, hasHardware: profile?.hasPINPad || false };
}

export function useValorPayment() {
    const profile = useHardwareProfile();
    const isValorDevice = profile?.type === 'VALOR_VP550' || profile?.type === 'VALOR_VP800';

    const [isProcessing, setIsProcessing] = useState(false);
    const [progressMessage, setProgressMessage] = useState<string>('');

    const initializeSDK = useCallback(async () => {
        if (!isValorDevice) return false;
        try {
            const res = await ValorPayment.initializePayment();
            return res.success;
        } catch (e) {
            console.error("Valor SDK Initialization config exception", e);
            return false;
        }
    }, [isValorDevice]);

    const performTransaction = useCallback(async (amount: string) => {
        if (!isValorDevice) return null;
        try {
            setIsProcessing(true);
            setProgressMessage('Initializing Terminal...');

            const listener = await ValorPayment.addListener('valorPaymentProgress', (info) => {
                setProgressMessage(info.message);
            });

            const result = await ValorPayment.performTransaction({ amount });
            listener.remove();

            return result;
        } catch (error) {
            console.error('Valor transaction failed', error);
            throw error;
        } finally {
            setIsProcessing(false);
            setProgressMessage('');
        }
    }, [isValorDevice]);

    return {
        initializeSDK,
        performTransaction,
        isProcessing,
        progressMessage,
        hasHardware: isValorDevice
    };
}
