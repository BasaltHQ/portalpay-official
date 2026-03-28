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
}): string {
    const lines: string[] = [];
    const sep = '--------------------------------';

    lines.push(sep);
    lines.push('       *** EXPO TICKET ***');
    lines.push(sep);

    if (order.tableNumber) lines.push(`Table: ${order.tableNumber}`);
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

        // Skip processing/service fee lines
        if (label.toLowerCase().includes('processing fee') || label.toLowerCase().includes('service fee')) continue;

        lines.push(`${qty}x  ${label}`);

        // Modifiers
        const mods = item.modifiers || item.selectedModifiers?.map(m => m.name) || [];
        for (const mod of mods) {
            lines.push(`     + ${typeof mod === 'string' ? mod : (mod as any).name || mod}`);
        }

        if (item.specialInstructions) {
            lines.push(`     NOTE: ${item.specialInstructions}`);
        }
    }

    lines.push(sep);
    if (order.kitchenStatus) lines.push(`Status: ${order.kitchenStatus.toUpperCase()}`);
    lines.push('');

    return lines.join('\n');
}
