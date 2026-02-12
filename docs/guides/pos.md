# Point of Sale (POS) Integration

Accept in-person crypto payments with terminal integration.

## Overview

This guide shows how to integrate PortalPay into point-of-sale systems for in-person cryptocurrency payments.

## Security & Headers

- All developer API requests require the APIM subscription header:
  `Ocp-Apim-Subscription-Key: {your-subscription-key}`
- Perform PortalPay API calls on your backend; never expose your subscription key in terminal or browser code.
- Origin enforcement: requests must pass through Azure Front Door (AFD). APIM validates an internal x-edge-secret injected by AFD. Direct-origin calls are denied (403) in protected environments.
- Rate limiting headers may be returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. Implement exponential backoff on `429 Too Many Requests`.
- Admin-only endpoints (e.g., POST `/api/receipts/terminal`, POST `/api/receipts/refund`, POST `/api/split/deploy`, POST `/api/pricing/config`) are JWT cookie-protected in the PortalPay UI and are not callable via APIM.

---

## Use Cases

- Restaurant/cafe payments
- Retail store checkouts
- Food trucks and mobile vendors
- Event ticket sales
- Service-based businesses

---

## Integration Flow

```
POS Terminal → Create Order → Display QR Code → Customer Scans → Payment Confirmed
```

---

## Quick Integration

### 1. Create Order at Terminal

```typescript
async function createTerminalOrder(items: any[]) {
  const response = await fetch('https://pay.ledger1.ai/api/orders', {
    method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.PORTALPAY_SUBSCRIPTION_KEY!
      },
    body: JSON.stringify({
      items,
      jurisdictionCode: 'US-CA'
    })
  });
  
  const order = await response.json();
  return order.receipt;
}
```

### 2. Display QR Code

```typescript
async function displayPaymentQR(receiptId: string) {
  const paymentUrl = `https://pay.ledger1.ai/portal/${receiptId}`;

  // Generate QR code locally from payment URL (admin-only terminal endpoint is JWT-only)
  const qrCode = await generateQrCode(paymentUrl); // implement with your QR library
  // Display QR code on terminal screen
  displayOnTerminal(qrCode);
}
```

### 3. Wait for Payment

```typescript
async function waitForTerminalPayment(receiptId: string): Promise<boolean> {
  const timeout = 5 * 60 * 1000; // 5 minutes
  const interval = 2000; // Check every 2 seconds
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const response = await fetch(
      `/api/portalpay/receipts/status?receiptId=${receiptId}`
    );
    const data = await response.json();
    
    if (data.status === 'completed') {
      playSuccessSound();
      return true;
    }
    
    if (data.status === 'failed') {
      playErrorSound();
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  // Timeout
  playTimeoutSound();
  return false;
}
```

---

## Complete POS Flow

```typescript
async function processPOSTransaction(cart: any[]) {
  try {
    // 1. Create order
    console.log('Creating order...');
    const receipt = await createTerminalOrder(cart);
    
    // 2. Display QR code
    console.log(`Order ${receipt.receiptId} created`);
    console.log(`Total: $${receipt.totalUsd}`);
    await displayPaymentQR(receipt.receiptId);
    
    // 3. Show waiting screen
    showWaitingScreen(receipt);
    
    // 4. Wait for payment
    const paid = await waitForTerminalPayment(receipt.receiptId);
    
    if (paid) {
      // Success!
      showSuccessScreen(receipt);
      printReceipt(receipt);
      return { success: true, receiptId: receipt.receiptId };
    } else {
      // Failed or timeout
      showFailedScreen();
      return { success: false, receiptId: receipt.receiptId };
    }
  } catch (error) {
    console.error('Transaction failed:', error);
    showErrorScreen(error);
    return { success: false, error };
  }
}
```

---

## Hardware Integration

### Receipt Printer

```typescript
import { ThermalPrinter } from 'node-thermal-printer';

async function printReceipt(receipt: any) {
  const printer = new ThermalPrinter({
    type: 'epson',
    interface: 'tcp://192.168.1.100'
  });
  
  // Header
  printer.alignCenter();
  printer.println(receipt.brandName || 'PortalPay');
  printer.println('');
  
  // Items
  printer.alignLeft();
  for (const item of receipt.lineItems) {
    if (item.qty) {
      printer.println(`${item.qty}x ${item.label} - $${item.priceUsd.toFixed(2)}`);
    } else {
      printer.println(`${item.label}: $${item.priceUsd.toFixed(2)}`);
    }
  }
  
  printer.println('');
  printer.alignRight();
  printer.println(`TOTAL: $${receipt.totalUsd.toFixed(2)}`);
  printer.println('');
  
  // Payment info
  printer.alignCenter();
  printer.println('Paid with Crypto');
  printer.println(`Receipt: ${receipt.receiptId}`);
  
  // QR code for digital receipt
  printer.printQR(`https://pay.ledger1.ai/portal/${receipt.receiptId}`);
  
  printer.cut();
  await printer.execute();
}
```

### Display Screen

```typescript
// Display on customer-facing screen
function displayOnCustomerScreen(data: any) {
  // Send to customer display via serial/USB/network
  const display = {
    type: 'payment_qr',
    qrCode: data.qrCode,
    amount: data.amount,
    receiptId: data.receiptId
  };
  
  sendToDisplay(display);
}
```

---

## Kitchen Display Integration

For restaurants, send orders to kitchen:

```typescript
async function sendToKitchen(order: any) {
  // Send to YOUR backend kitchen system. PortalPay does not expose a kitchen API.
  await fetch('/api/kitchen/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receiptId: order.receiptId,
      items: order.lineItems.filter((item: any) => item.itemId),
      station: 'grill' // or 'cold', 'dessert', etc.
    })
  });
}
```

---

## Best Practices

1. **Fast QR Generation**: Pre-generate QR codes for speed
2. **Clear Instructions**: Show customers how to scan and pay
3. **Timeout Handling**: Clear screen after 5 minutes of inactivity
4. **Error Recovery**: Allow staff to retry or use alternative payment
5. **Receipt Printing**: Print physical receipt after payment
6. **Network Reliability**: Handle connection issues gracefully
7. **Sound Feedback**: Play sounds for payment confirmation

---

## Next Steps

- [E-commerce Guide](./ecommerce.md) - Online store integration
- [Payment Gateway](./payment-gateway.md) - Custom gateway
- [API Reference](../api/README.md)
