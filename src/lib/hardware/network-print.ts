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
    if (displayBrand) {
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

        const DOUBLE_COL = Math.floor(COL_WIDTH / 2);
        const qtyPrefix = `${qty}x  `;
        const indent = ' '.repeat(qtyPrefix.length);
        const maxLineLen = Math.max(1, DOUBLE_COL - qtyPrefix.length); // Prevent negative lengths

        // Word wrap long items strictly based on the DOUBLE_COL limit
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

        if (wrappedLines.length > 0) {
            lines.push('[MAGNIFY 2 2]');
            lines.push(BOLD_ON + qtyPrefix + (wrappedLines[0] || '') + BOLD_OFF);
            for (let i = 1; i < wrappedLines.length; i++) {
                lines.push(BOLD_ON + indent + wrappedLines[i] + BOLD_OFF);
            }
            lines.push('[MAGNIFY 1 1]');
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

/**
 * Build a formatted plain-text guest receipt for the Handheld POS (32-column layout).
 */
export function buildHandheldReceiptText(order: any, brandName: string): string {
    const COL_WIDTH = 32;

    const centerText = (text: string) => {
        let trimmed = text.substring(0, COL_WIDTH).trim();
        let spaces = Math.max(0, Math.floor((COL_WIDTH - trimmed.length) / 2));
        return ' '.repeat(spaces) + trimmed;
    };

    const centerDoubleText = (text: string) => {
        return centerText(`*** ${text} ***`);
    };

    const leftRightText = (left: string, right: string) => {
        let leftTrimmed = left.substring(0, COL_WIDTH - right.length - 1).trim();
        let spaces = Math.max(1, COL_WIDTH - leftTrimmed.length - right.length);
        return leftTrimmed + ' '.repeat(spaces) + right;
    };

    const wrapText = (text: string, maxLen: number) => {
        const words = text.split(' ');
        let lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            if ((currentLine + word).length > maxLen) {
                if (currentLine) lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        }
        if (currentLine) lines.push(currentLine.trim());
        return lines;
    };

    const lines: string[] = [];

    // Header section
    lines.push(centerDoubleText(brandName.toUpperCase()));
    lines.push('');
    
    lines.push(centerText('GUEST RECEIPT'));
    lines.push(centerText(new Date().toLocaleString()));
    lines.push('-'.repeat(COL_WIDTH));
    lines.push(leftRightText(`Order: #${String(order.receiptId || order.id || "").replace("receipt:", "").slice(-4)}`, `Type: POS`));
    lines.push('-'.repeat(COL_WIDTH));
    lines.push('');

    // Itemized lines
    let feeInItems = false;
    let taxInItems = false;
    let tipInItems = false;

    if (order.items && Array.isArray(order.items)) {
        order.items.forEach((itemLine: any) => {
            const qty = itemLine.quantity || itemLine.qty || 1;
            const name = itemLine.item?.name || itemLine.name || itemLine.label || 'Item';
            const price = Number((itemLine.item?.priceUsd || itemLine.priceUsd || 0)) * qty;
            
            const lowerLabel = name.toLowerCase();
            if (lowerLabel.includes('fee')) feeInItems = true;
            if (lowerLabel.includes('tax')) taxInItems = true;
            if (lowerLabel.includes('tip')) tipInItems = true;

            const qtyStr = `${qty}x `;
            const priceStr = `$${price.toFixed(2)}`;
            const maxNameLen = COL_WIDTH - qtyStr.length - priceStr.length - 1;

            const nameLines = wrapText(name, maxNameLen > 0 ? maxNameLen : COL_WIDTH);
            if (nameLines.length > 0) {
                 lines.push(leftRightText(`${qtyStr}${nameLines[0]}`, priceStr));
                 for (let i = 1; i < nameLines.length; i++) {
                      lines.push(`${' '.repeat(qtyStr.length)}${nameLines[i]}`);
                 }
            } else {
                 lines.push(leftRightText(`${qtyStr}${name}`, priceStr));
            }

            const mods = itemLine.modifiers || itemLine.selectedModifiers || [];
            if (mods.length > 0) {
                mods.forEach((mod: any) => {
                    const mName = mod.name || 'Modifier';
                    const mPrice = Number(mod.priceAdjustment || 0) * qty;
                    const priceStr = mPrice > 0 ? `+$${mPrice.toFixed(2)}` : '';
                    
                    const prefix = `   > `;
                    const mMaxNameLen = COL_WIDTH - prefix.length - priceStr.length - 1;
                    const mLines = wrapText(mName, mMaxNameLen > 0 ? mMaxNameLen : COL_WIDTH);
                    
                    if (mLines.length > 0) {
                         lines.push(leftRightText(`${prefix}${mLines[0]}`, priceStr));
                         for (let i = 1; i < mLines.length; i++) {
                              lines.push(`${' '.repeat(prefix.length)}${mLines[i]}`);
                         }
                    }
                });
            }
        });
    }

    lines.push('');
    lines.push('-'.repeat(COL_WIDTH));
    
    // Merge dynamically in-case fees/taxes are standalone totals rather than row items
    const taxVal = Number(order.taxUsd || order.taxAmount || order.tax || order.metadata?.tax || 0);
    const feeVal = Number(order.processingFeeUsd || order.processingFee || order.fee || order.metadata?.fee || 0);
    const tipVal = Number(order.tipUsd || order.tipAmount || order.tip || order.metadata?.tip || 0);

    if (taxVal > 0 && !taxInItems) lines.push(leftRightText('Sales Tax', `$${taxVal.toFixed(2)}`));
    if (feeVal > 0 && !feeInItems) lines.push(leftRightText('Processing Fee', `$${feeVal.toFixed(2)}`));
    if (tipVal > 0 && !tipInItems) lines.push(leftRightText('Tip', `$${tipVal.toFixed(2)}`));

    const finalTotal = Number(order.total || order.totalUsd || 0);
    lines.push(leftRightText('TOTAL', `$${finalTotal.toFixed(2)}`));
    lines.push(leftRightText('STATUS', (order.status || 'PAID').toUpperCase()));
    lines.push('-'.repeat(COL_WIDTH));

    lines.push('');
    lines.push(centerText('Scan QR below to pay online'));
    lines.push(centerText('or view receipt details.'));
    
    // Add padding block lines
    lines.push('');
    lines.push('');

    return lines.join('\n');
}
