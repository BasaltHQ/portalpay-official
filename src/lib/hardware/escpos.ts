/**
 * Lightweight ESC/POS Encoder for 80mm Thermal Printers
 * Specifically architected for WebUSB raw endpoint delivery without a native OS driver.
 */

// Command Set
const ESC = 0x1B;
const GS  = 0x1D;
const LF  = 0x0A;

const CMD_INIT       = [ESC, 0x40];
const CMD_CUT        = [GS, 0x56, 0x42, 0x00];
const CMD_ALIGN_L    = [ESC, 0x61, 0x00];
const CMD_ALIGN_C    = [ESC, 0x61, 0x01];
const CMD_ALIGN_R    = [ESC, 0x61, 0x02];

// Character Sizes
const TXT_NORMAL = [GS, 0x21, 0x00];
const TXT_2H     = [GS, 0x21, 0x01]; // Double height
const TXT_2W     = [GS, 0x21, 0x10]; // Double width
const TXT_4SQUARE= [GS, 0x21, 0x11]; // Double width + Double height

// Text Style
const TXT_BOLD_ON  = [ESC, 0x45, 0x01];
const TXT_BOLD_OFF = [ESC, 0x45, 0x00];

export class EscPosEncoder {
    private buffer: number[] = [];
    private encoder = new TextEncoder(); // encodes strings to UTF-8. Assuming standard UTF-8 support on the printer or ASCII subset.

    constructor() {
        this.add(CMD_INIT);
    }

    private add(command: number[]) {
        this.buffer.push(...command);
    }
    
    private text(str: string) {
        // Encode generic Latin text
        const encoded = this.encoder.encode(str);
        for(let i=0; i < encoded.length; i++) {
            this.buffer.push(encoded[i]);
        }
    }

    newline() {
        this.buffer.push(LF);
        return this;
    }

    alignCenter() {
        this.add(CMD_ALIGN_C);
        return this;
    }

    alignLeft() {
        this.add(CMD_ALIGN_L);
        return this;
    }

    alignRight() {
        this.add(CMD_ALIGN_R);
        return this;
    }

    bold(enable: boolean) {
        this.add(enable ? TXT_BOLD_ON : TXT_BOLD_OFF);
        return this;
    }

    sizeAsNormal() {
        this.add(TXT_NORMAL);
        return this;
    }

    sizeAsHeading() {
        this.add(TXT_4SQUARE);
        return this;
    }
    
    separator() {
        // 80mm generic printers can fit 48 chars in Font A, 64 in Font B
        this.text("------------------------------------------------"); // 48 dashes
        this.newline();
        return this;
    }

    line(str: string) {
        this.text(str);
        this.newline();
        return this;
    }
    
    cut() {
        // Feed 4 blank lines before cutting to clear the blade
        for(let i=0; i<4; i++) {
            this.newline();
        }
        this.add(CMD_CUT);
        return this;
    }

    build(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}

/**
 * Builds a beautifully formatted 80mm ESC/POS layout for Kitchen/Expo Tickets.
 */
export function buildRawEscPosTicket(order: any): Uint8Array {
    const enc = new EscPosEncoder();
    
    enc.alignCenter();
    const displayBrand = order.shopName || order.brandName;
    if (displayBrand) {
        enc.bold(true).sizeAsHeading().line(displayBrand).sizeAsNormal().newline();
    }
    enc.bold(true).sizeAsHeading();
    
    if (order.orderType === 'takeout') enc.line("TAKEOUT");
    else if (order.orderType === 'delivery') enc.line("DELIVERY");
    else if (order.tableNumber) enc.line(`TABLE ${order.tableNumber}`);
    else enc.line("EXPO TICKET");
    
    enc.sizeAsNormal().bold(false).newline();
    
    enc.alignLeft();
    enc.separator();
    
    enc.line(`Order: #${String(order.receiptId || order.id || "").replace("receipt:", "").slice(-6)}`);
    if (order.customerName && order.customerName !== "Guest" && !order.customerName.includes("Table ")) {
        enc.line(`Guest: ${order.customerName}`);
    }
    if (order.employeeName || order.serverName) {
        enc.line(`Server: ${order.employeeName || order.serverName}`);
    }
    
    if (order.createdAt) {
        const d = new Date(typeof order.createdAt === "number" ? order.createdAt : order.createdAt);
        enc.line(`Time: ${d.toLocaleTimeString()}  ${d.toLocaleDateString()}`);
    }
    
    enc.separator();
    
    // Order Items
    enc.sizeAsNormal(); 
    
    const items = order.lineItems || order.items || [];
    for (const item of items) {
        const label = item.label || item.name || "Item";
        const qty = item.qty || item.quantity || 1;
        
        if (label.toLowerCase().includes("processing fee") || label.toLowerCase().includes("service fee")) continue;
        if (item.cancelled) continue; // Don't print cancelled items if building it fresh

        enc.bold(true);
        enc.line(`${qty}x  ${label}`);
        enc.bold(false);

        const mods = item.modifiers || item.selectedModifiers?.map((m: any) => m.name) || [];
        for (const mod of mods) {
            enc.line(`     + ${typeof mod === "string" ? mod : mod.name || mod}`);
        }
        
        if (item.specialInstructions) {
            // Box/highlight instructions visually by making them bold
            enc.bold(true);
            enc.line(`     ** NOTE: ${item.specialInstructions} **`);
            enc.bold(false);
        }
        enc.newline();
    }
    
    enc.separator();
    if (order.kitchenStatus) enc.line(`Status: ${order.kitchenStatus.toUpperCase()}`);
    enc.newline();
    
    enc.cut();
    
    return enc.build();
}
