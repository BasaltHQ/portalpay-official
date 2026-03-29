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
            // Leaving filters empty allows generic Chinese 80mm generic POS printers to appear 
            // even if they spoof vendor IDs or use custom classes.
            this.device = await navUsb.requestDevice({ filters: [] });

            await this.device.open();
            
            // Standard USB setup sequence
            if (this.device.configuration === null) {
                await this.device.selectConfiguration(1);
            }

            // In typical POS generic devices, the printer interface is 0. 
            // We claim it now to prepare for writing.
            await this.device.claimInterface(0);

            return true;
        } catch (err) {
            console.error('[WebUSB] Connection interrupted or denied by user:', err);
            return false;
        }
    }

    /**
     * Pushes a raw Uint8Array byte sequence down to the first available OUT endpoint.
     */
    static async print(data: Uint8Array): Promise<boolean> {
        try {
            if (!this.device || !this.device.opened) {
                const connected = await this.connect();
                if (!connected) return false;
            }

            // Dynamically scan for the OUT endpoint (usually 0x01, 0x02, or 0x81/82 depending on direction)
            let outEndpointNumber: number | null = null;
            let targetInterfaceNumber = 0;

            if (this.device.configuration) {
                for (const iface of this.device.configuration.interfaces) {
                    for (const alt of iface.alternates) {
                        for (const ep of alt.endpoints) {
                            if (ep.direction === 'out') {
                                outEndpointNumber = ep.endpointNumber;
                                targetInterfaceNumber = iface.interfaceNumber;
                                break;
                            }
                        }
                        if (outEndpointNumber !== null) break;
                    }
                    if (outEndpointNumber !== null) break;
                }
            }

            if (outEndpointNumber === null) {
                console.error("[WebUSB] No OUT endpoint discovered on USB device!");
                return false;
            }

            // Make sure we claimed the correct interface for the OUT endpoint
            if (targetInterfaceNumber !== 0) {
                await this.device.claimInterface(targetInterfaceNumber);
            }

            // Fire bytes to printer!
            const result = await this.device.transferOut(outEndpointNumber, data);
            
            if (result.status === 'ok') {
                return true;
            } else {
                console.warn("[WebUSB] Document sent, but result status was:", result.status);
                return false;
            }
        } catch (e) {
            console.error('[WebUSB] Data transfer error:', e);
            // Nullify device on catastrophic transfer fail so we reconnect next attempt
            this.device = null;
            return false;
        }
    }
}
