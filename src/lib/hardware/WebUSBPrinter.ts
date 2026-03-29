/**
 * WebUSB Printer Driver
 * Enables raw byte transfer directly to USB connected devices from the browser.
 * Especially powerful for Android environments (e.g. Chrome, Capacitor) where USB_CLASS_PRINTER
 * is not aggressively blocked by the host OS.
 */

export class WebUSBPrinter {
    private static device: any = null; // using any to bypass strict TS configs if w3c-web-usb isn't linked

    /**
     * Verify the current browser natively ships with WebUSB API enabled.
     */
    static isSupported(): boolean {
        return typeof navigator !== 'undefined' && 'usb' in navigator;
    }

    /**
     * Request connection via Chrome's native WebUSB dialog.
     */
    static async connect(): Promise<boolean> {
        try {
            if (this.device && this.device.opened) return true;

            const navUsb = (navigator as any).usb;
            if (!navUsb) return false;

            // Open dialog for user to select device.
            // Using classCode 7 explicitly targets standard USB Printers.
            // classCode 255 (0xFF) targets generic "Vendor Specific" thermal POS printers.
            this.device = await navUsb.requestDevice({ 
                filters: [
                    { classCode: 7 },
                    { classCode: 255 }
                ] 
            });

            await this.device.open();
            
            // Standard USB setup sequence
            if (this.device.configuration === null) {
                await this.device.selectConfiguration(1);
            }

            // In typical POS generic devices, the printer interface is 0. 
            // We claim it now to prepare for writing.
            await this.device.claimInterface(0);

            return true;
        } catch (err: any) {
            if (err.name !== 'NotFoundError') {
                console.warn('[WebUSB] Connection interrupted or denied by user:', err);
            }
            return false;
        }
    }

    private static async getEndpoints(): Promise<{ outEP: number | null; inEP: number | null; }> {
        if (!this.device || !this.device.opened) {
            const connected = await this.connect();
            if (!connected) return { outEP: null, inEP: null };
        }

        let outEP: number | null = null;
        let inEP: number | null = null;
        let targetIface = 0;

        if (this.device.configuration) {
            for (const iface of this.device.configuration.interfaces) {
                for (const alt of iface.alternates) {
                    for (const ep of alt.endpoints) {
                        if (ep.direction === 'out' && outEP === null) outEP = ep.endpointNumber;
                        if (ep.direction === 'in' && inEP === null) inEP = ep.endpointNumber;
                    }
                    if (outEP !== null || inEP !== null) {
                        targetIface = iface.interfaceNumber;
                        break;
                    }
                }
            }
        }

        if (targetIface !== 0) {
            try {
                await this.device.claimInterface(targetIface);
            } catch(e) { /* Already claimed or error */ }
        }

        return { outEP, inEP };
    }

    /**
     * Sends `ESC SP n` (1B 20 n) to query printer status and reads the byte response.
     */
    static async requestStatus(n: number = 1): Promise<{ status: number }> {
        try {
            const { outEP, inEP } = await this.getEndpoints();
            if (outEP === null || inEP === null) {
                console.warn("[WebUSB] Missing endpoints for bidirectional communication.");
                return { status: -1 };
            }

            // 1. Send ESC SP n
            const req = new Uint8Array([0x1B, 0x20, n]);
            await this.device.transferOut(outEP, req);

            // 2. Read response (up to 64 bytes is normally the packet size)
            const result = await this.device.transferIn(inEP, 64);
            if (result.status === 'ok' && result.data) {
                const dataView = result.data as DataView;
                if (dataView.byteLength > 0) {
                    return { status: dataView.getUint8(0) }; // Return the first byte
                }
            }
            return { status: -1 };
        } catch (e) {
            console.error('[WebUSB] Status fetch failed:', e);
            return { status: -1 };
        }
    }

    /**
     * Pushes a raw Uint8Array byte sequence down to the first available OUT endpoint.
     */
    static async print(data: Uint8Array): Promise<boolean> {
        try {
            const { outEP } = await this.getEndpoints();
            
            if (outEP === null) {
                console.warn("[WebUSB] No OUT endpoint discovered on USB device!");
                return false;
            }

            // Fire bytes to printer!
            const result = await this.device.transferOut(outEP, data);
            
            if (result.status === 'ok') {
                return true;
            } else {
                console.warn("[WebUSB] Document sent, but result status was:", result.status);
                return false;
            }
        } catch (e) {
            console.warn('[WebUSB] Data transfer error:', e);
            // Nullify device on catastrophic transfer fail so we reconnect next attempt
            this.device = null;
            return false;
        }
    }
}
