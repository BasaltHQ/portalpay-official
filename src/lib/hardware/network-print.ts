/**
 * Network Print Utility
 * 
 * Submits print jobs to the DeviceHub API for network-attached printers.
 * Also provides text formatting for KDS expo tickets.
 */

/** Submit a print job to the DeviceHub station agent */
export async function networkPrint(opts: {
    text: string;
    qrBase64?: string;
    stationId?: string;
    printerName?: string;
}): Promise<{ ok: boolean; jobId?: string; error?: string }> {
    try {
        const res = await fetch('/api/devicehub/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'print',
                stationId: opts.stationId,
                printerName: opts.printerName,
                payload: {
                    text: opts.text,
                    qrBase64: opts.qrBase64,
                },
            }),
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            return { ok: false, error: `DeviceHub responded ${res.status}: ${errBody}` };
        }

        const data = await res.json();
        return { ok: true, jobId: data.jobId || data.id };
    } catch (e: any) {
        return { ok: false, error: e?.message || 'Network print request failed' };
    }
}

/**
 * Build a formatted plain-text expo ticket for the KDS.
 * Uses simple dashes/pipes — suitable for thermal receipt printers (ESC/POS).
 */
export function buildExpoTicketText(order: {
    id?: string;
    receiptId?: string;
    tableNumber?: string;
    kitchenStatus?: string;
    lineItems?: Array<{
        label?: string;
        name?: string;
        qty?: number;
        quantity?: number;
        modifiers?: string[];
        selectedModifiers?: Array<{ name: string }>;
        specialInstructions?: string;
    }>;
    createdAt?: string | number;
    employeeName?: string;
    guestCount?: number;
    orderType?: string;
    customerName?: string;
    brandName?: string;
    shopName?: string;
    thermalLogoPayload?: string;
}): string {
    const ESC = '\x1B';
    const GS = '\x1D';
    const INIT = `${ESC}@`;
    const BOLD_ON = `${ESC}E\x01`;
    const BOLD_OFF = `${ESC}E\x00`;
    const DOUBLE_Size = `${GS}!\x11`;
    const NORMAL_Size = `${GS}!\x00`;
    const CUT = `${GS}V\x42\x00`;

    const lines: string[] = [];
    const COL_WIDTH = 48; // Standard Font A for 80mm generic printers
    const sep = '-'.repeat(COL_WIDTH);

    lines.push(INIT);

    // 1 char of Double Size = 2 columns
    const centerDoubleText = (text: string) => {
        const doubleLen = text.length * 2;
        const pad = Math.max(0, Math.floor((COL_WIDTH - doubleLen) / 2));
        return ' '.repeat(pad) + BOLD_ON + DOUBLE_Size + text + NORMAL_Size + BOLD_OFF;
    };

    const displayBrand = order.shopName || order.brandName;
    if (order.thermalLogoPayload) {
        try {
            // Injects raw 0-255 ESC/POS bit-sequence via Latin1 string mapping
            if (typeof window !== "undefined") {
                lines.push(window.atob(order.thermalLogoPayload));
            } else {
                lines.push(Buffer.from(order.thermalLogoPayload, 'base64').toString('binary'));
            }
        } catch (e) {
            console.error('Failed to parse thermal payload', e);
        }
    } else if (displayBrand) {
        lines.push(centerDoubleText(displayBrand.toUpperCase()));
        lines.push('');
    }

    lines.push(centerDoubleText('*** EXPO TICKET ***'));
    lines.push(sep);

    if (order.tableNumber) lines.push(BOLD_ON + `Table: ${order.tableNumber}` + BOLD_OFF);
    if (order.employeeName) lines.push(`Server: ${order.employeeName}`);
    if (order.guestCount) lines.push(`Guests: ${order.guestCount}`);

    const orderId = String(order.receiptId || order.id || '').replace('receipt:', '');
    if (orderId) lines.push(`Order: ${orderId.substring(0, 12)}`);

    if (order.createdAt) {
        const d = new Date(typeof order.createdAt === 'number' ? order.createdAt : order.createdAt);
        lines.push(`Time: ${d.toLocaleTimeString()}`);
    }

    lines.push(sep);

    const items = order.lineItems || [];
    for (const item of items) {
        const label = item.label || item.name || 'Item';
        const qty = item.qty || item.quantity || 1;

        if (label.toLowerCase().includes('processing fee') || label.toLowerCase().includes('service fee')) continue;

        const qtyPrefix = `${qty}x  `;
        const indent = ' '.repeat(qtyPrefix.length);
        const maxLineLen = COL_WIDTH - qtyPrefix.length;

        // Word wrap long items strictly to prevent ugly horizontal bleed
        const words = label.split(' ');
        let currentLine = '';
        const wrappedLines: string[] = [];
        
        for (const word of words) {
            if (currentLine.length + word.length + (currentLine ? 1 : 0) > maxLineLen) {
                if (currentLine) wrappedLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine += (currentLine ? ' ' : '') + word;
            }
        }
        if (currentLine) wrappedLines.push(currentLine);

        // First line keeps the quantity, subsequent lines get padded indent
        lines.push(BOLD_ON + qtyPrefix + (wrappedLines[0] || '') + BOLD_OFF);
        for (let i = 1; i < wrappedLines.length; i++) {
            lines.push(BOLD_ON + indent + wrappedLines[i] + BOLD_OFF);
        }

        // Modifiers
        const mods = item.modifiers || item.selectedModifiers?.map(m => m.name) || [];
        for (const mod of mods) {
            const modName = typeof mod === 'string' ? mod : (mod as any).name || mod;
            lines.push(`     + ${modName}`);
        }

        if (item.specialInstructions) {
            const notePrefix = `     NOTE: `;
            const noteIndent = ' '.repeat(notePrefix.length);
            const maxNoteLen = COL_WIDTH - notePrefix.length;
            const noteWords = item.specialInstructions.split(' ');
            let nLine = '';
            const nLines: string[] = [];
            for (const word of noteWords) {
                if (nLine.length + word.length + (nLine ? 1 : 0) > maxNoteLen) {
                    if (nLine) nLines.push(nLine);
                    nLine = word;
                } else {
                    nLine += (nLine ? ' ' : '') + word;
                }
            }
            if (nLine) nLines.push(nLine);
            
            lines.push(BOLD_ON + notePrefix + (nLines[0] || '') + BOLD_OFF);
            for (let i = 1; i < nLines.length; i++) {
                lines.push(BOLD_ON + noteIndent + nLines[i] + BOLD_OFF);
            }
        }
        lines.push(''); // Space between items for readability
    }

    lines.push(sep);
    if (order.kitchenStatus) lines.push(BOLD_ON + `Status: ${order.kitchenStatus.toUpperCase()}` + BOLD_OFF);
    lines.push('');

    return lines.join('\n');
}
