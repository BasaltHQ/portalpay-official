import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/cosmos";
import { getBrandKey } from "@/config/brands";
import { auditEvent } from "@/lib/audit";
import crypto from "node:crypto";
import { Bridge } from "thirdweb";

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/thirdweb
 * Webhook endpoint for Thirdweb Bridge/Pay events
 * - Verifies webhook signature with WEBHOOK_SECRET
 * - Persists payment events to Cosmos with brand scoping
 * - Resolves merchant context from receiver address
 * - Triggers split indexing and reconciliation
 * - Updates receipt status based on transaction completion
 * 
 * Supported webhook types:
 * - pay.onchain-transaction: Bridge/swap transactions with crypto payments
 * - pay.onramp-transaction: Onramp transactions (card to crypto)
 */

// Helper to validate webhook signature (Thirdweb uses HMAC-SHA256)
function validateWebhookSignature(
  body: string,
  headers: Record<string, string>,
  secret: string
): boolean {
  try {
    // Thirdweb sends signature in x-webhook-signature header
    const signature = headers['x-webhook-signature'] || headers['x-signature'];
    if (!signature) return false;
    
    // Compute HMAC-SHA256
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const computed = hmac.digest('hex');
    
    return signature === computed;
  } catch {
    return false;
  }
}

// Helper to resolve merchant context from receiver address
async function resolveMerchantContext(
  receiverAddr: string,
  container: any,
  brandKey: string
): Promise<{ merchantWallet?: string; splitAddress?: string; brandKey: string } | null> {
  const receiver = receiverAddr.toLowerCase();
  
  try {
    // Query site configs for this brand to find matching receiver
    const spec = {
      query: `SELECT c.wallet, c.splitAddress, c.split, c.config FROM c WHERE c.type='site_config' AND (LOWER(c.wallet)=@addr OR LOWER(c.splitAddress)=@addr OR LOWER(c.split.address)=@addr OR LOWER(c.config.splitAddress)=@addr OR LOWER(c.config.split.address)=@addr)`,
      parameters: [{ name: '@addr', value: receiver }]
    };
    
    const { resources } = await container.items.query(spec).fetchAll();
    const match = resources && resources[0];
    
    if (match) {
      const merchantWallet = String(match.wallet || '').toLowerCase();
      // Resolve split address from top-level and nested config.*
      const splitTop = String(match.splitAddress || '').toLowerCase();
      const splitObj = String(match.split?.address || '').toLowerCase();
      const splitCfgTop = String(match.config?.splitAddress || '').toLowerCase();
      const splitCfgObj = String(match.config?.split?.address || '').toLowerCase();
      const splitAddressRaw = splitTop || splitObj || splitCfgTop || splitCfgObj || '';
      const splitAddress = /^0x[a-f0-9]{40}$/i.test(splitAddressRaw) ? splitAddressRaw : receiver.toLowerCase();
      
      return {
        merchantWallet: /^0x[a-f0-9]{40}$/i.test(merchantWallet) ? merchantWallet : undefined,
        splitAddress,
        brandKey
      };
    }
  } catch (e) {
    console.error('[WEBHOOK] Error resolving merchant context:', e);
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  const correlationId = crypto.randomUUID();
  
  try {
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    // Verify webhook secret
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      console.error('[WEBHOOK] WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { ok: false, error: 'webhook_not_configured' },
        { status: 500, headers: { 'x-correlation-id': correlationId } }
      );
    }
    
    // Parse and verify webhook via Thirdweb
    let webhook: any;
    try {
      webhook = await Bridge.Webhook.parse(rawBody, headers as any, secret);
    } catch (err: any) {
      console.error('[WEBHOOK] Webhook verification failed:', err);
      await auditEvent(req, {
        who: 'webhook',
        roles: ['system'],
        what: 'webhook_invalid_signature',
        target: 'thirdweb',
        correlationId,
        ok: false,
        metadata: { error: err?.message || 'invalid_webhook' }
      });
      return NextResponse.json(
        { ok: false, error: 'invalid_webhook' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }

    const { version, type, data } = webhook;
    
    console.log(`[WEBHOOK] Received ${type} v${version}`);
    
    // Get brand context
    const brandKey = getBrandKey();
    const container = await getContainer();
    
    // Process based on webhook type
    if (type === 'pay.onchain-transaction') {
      return await handleOnchainTransaction(data, container, brandKey, correlationId, req);
    } else if (type === 'pay.onramp-transaction') {
      return await handleOnrampTransaction(data, container, brandKey, correlationId, req);
    } else {
      console.log(`[WEBHOOK] Unsupported webhook type: ${type}`);
      return NextResponse.json(
        { ok: true, message: 'ignored_unsupported_type' },
        { headers: { 'x-correlation-id': correlationId } }
      );
    }
  } catch (e: any) {
    console.error('[WEBHOOK] Error processing webhook:', e);
    return NextResponse.json(
      { ok: false, error: e?.message || 'webhook_processing_failed' },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}

async function handleOnchainTransaction(
  data: any,
  container: any,
  brandKey: string,
  correlationId: string,
  req: NextRequest
) {
  const {
    transactionId,
    paymentId,
    clientId,
    action,
    status,
    originToken,
    destinationToken,
    originAmount,
    destinationAmount,
    sender,
    receiver,
    transactions,
    developerFeeBps,
    developerFeeRecipient,
    purchaseData
  } = data;
  
  console.log(`[WEBHOOK] Onchain tx: ${transactionId}, status: ${status}, receiver: ${receiver}`);
  
  // Resolve merchant context
  const context = await resolveMerchantContext(receiver, container, brandKey);
  
  if (!context) {
    console.log(`[WEBHOOK] Receiver ${receiver} not mapped to any merchant in brand ${brandKey}`);
    // Store unmapped event for audit
    try {
      await container.items.upsert({
        id: `tw_tx_unmapped:${transactionId}`,
        type: 'payment_event_thirdweb_unmapped',
        brandKey,
        transactionId,
        paymentId,
        receiver,
        status,
        receivedAt: Date.now(),
        correlationId
      });
    } catch {}
    
    return NextResponse.json(
      { ok: true, message: 'receiver_unmapped' },
      { headers: { 'x-correlation-id': correlationId } }
    );
  }
  
  const { merchantWallet, splitAddress } = context;
  
  // Store payment event
  try {
    const eventDoc = {
      id: `tw_tx:${brandKey}:${transactionId}`,
      type: 'payment_event_thirdweb',
      brandKey,
      merchantWallet,
      splitAddress,
      transactionId,
      paymentId,
      clientId,
      action,
      status,
      sender: sender?.toLowerCase(),
      receiver: receiver?.toLowerCase(),
      originToken: {
        chainId: originToken?.chainId,
        address: originToken?.address?.toLowerCase(),
        symbol: originToken?.symbol,
        decimals: originToken?.decimals,
        amount: originAmount
      },
      destinationToken: {
        chainId: destinationToken?.chainId,
        address: destinationToken?.address?.toLowerCase(),
        symbol: destinationToken?.symbol,
        decimals: destinationToken?.decimals,
        amount: destinationAmount
      },
      transactions: Array.isArray(transactions) ? transactions.map((tx: any) => ({
        chainId: tx.chainId,
        transactionHash: tx.transactionHash?.toLowerCase()
      })) : [],
      developerFeeBps,
      developerFeeRecipient: developerFeeRecipient?.toLowerCase(),
      purchaseData: purchaseData || null,
      receivedAt: Date.now(),
      correlationId
    };
    
    await container.items.upsert(eventDoc);
    console.log(`[WEBHOOK] Stored payment event ${transactionId}`);
    
    await auditEvent(req, {
      who: sender?.toLowerCase() || 'unknown',
      roles: ['buyer'],
      what: 'webhook_payment_received',
      target: merchantWallet || receiver,
      correlationId,
      ok: true,
      metadata: { transactionId, status, destinationToken: destinationToken?.symbol }
    });
  } catch (e) {
    console.error('[WEBHOOK] Error storing payment event:', e);
  }
  
  // If status is COMPLETED, trigger split indexing and reconciliation
  if (status === 'COMPLETED' && splitAddress && merchantWallet) {
    const baseOrigin = req.nextUrl.origin;
    
    // Extract Base chain (8453) transaction hashes
    const baseTxHashes = Array.isArray(transactions)
      ? transactions
          .filter((tx: any) => tx.chainId === 8453)
          .map((tx: any) => tx.transactionHash?.toLowerCase())
          .filter(Boolean)
      : [];
    
    console.log(`[WEBHOOK] Triggering split indexing for ${merchantWallet.slice(0,10)}... with ${baseTxHashes.length} Base tx hashes`);
    
    try {
      // Trigger split webhook (which will index and reconcile)
      const webhookRes = await fetch(`${baseOrigin}/api/split/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          splitAddress,
          merchantWallet,
          trigger: 'payment',
          txHashes: baseTxHashes,
          correlationId
        })
      });
      
      const webhookData = await webhookRes.json().catch(() => ({}));
      console.log(`[WEBHOOK] Split indexing result:`, webhookData);
      
      // If we have purchaseData with receiptId, update receipt status
      if (purchaseData?.receiptId) {
        const receiptId = String(purchaseData.receiptId);
        console.log(`[WEBHOOK] Updating receipt ${receiptId} status`);
        
        // Post tx_mined status
        if (baseTxHashes.length > 0) {
          await fetch(`${baseOrigin}/api/receipts/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receiptId,
              wallet: merchantWallet,
              status: 'tx_mined',
              buyerWallet: sender?.toLowerCase(),
              txHash: baseTxHashes[0]
            })
          });
        }
        
        // Post reconciled status after indexing
        await fetch(`${baseOrigin}/api/receipts/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiptId,
            wallet: merchantWallet,
            status: 'reconciled',
            buyerWallet: sender?.toLowerCase()
          })
        });
      }
    } catch (e) {
      console.error('[WEBHOOK] Error triggering split indexing:', e);
    }
  }
  
  return NextResponse.json(
    { ok: true, transactionId, status, merchantWallet },
    { headers: { 'x-correlation-id': correlationId } }
  );
}

async function handleOnrampTransaction(
  data: any,
  container: any,
  brandKey: string,
  correlationId: string,
  req: NextRequest
) {
  const {
    id,
    onramp,
    token,
    amount,
    currency,
    currencyAmount,
    receiver,
    status,
    purchaseData
  } = data;
  
  console.log(`[WEBHOOK] Onramp tx: ${id}, status: ${status}, receiver: ${receiver}`);
  
  // Resolve merchant context
  const context = await resolveMerchantContext(receiver, container, brandKey);
  
  if (!context) {
    console.log(`[WEBHOOK] Receiver ${receiver} not mapped to any merchant in brand ${brandKey}`);
    // Store unmapped event
    try {
      await container.items.upsert({
        id: `tw_onramp_unmapped:${id}`,
        type: 'payment_event_thirdweb_onramp_unmapped',
        brandKey,
        onrampId: id,
        receiver,
        status,
        receivedAt: Date.now(),
        correlationId
      });
    } catch {}
    
    return NextResponse.json(
      { ok: true, message: 'receiver_unmapped' },
      { headers: { 'x-correlation-id': correlationId } }
    );
  }
  
  const { merchantWallet, splitAddress } = context;
  
  // Store onramp event
  try {
    const eventDoc = {
      id: `tw_onramp:${brandKey}:${id}`,
      type: 'payment_event_thirdweb_onramp',
      brandKey,
      merchantWallet,
      splitAddress,
      onrampId: id,
      onramp,
      status,
      receiver: receiver?.toLowerCase(),
      token: {
        chainId: token?.chainId,
        address: token?.address?.toLowerCase(),
        symbol: token?.symbol,
        decimals: token?.decimals,
        amount
      },
      currency,
      currencyAmount,
      purchaseData: purchaseData || null,
      receivedAt: Date.now(),
      correlationId
    };
    
    await container.items.upsert(eventDoc);
    console.log(`[WEBHOOK] Stored onramp event ${id} with status ${status}`);
  } catch (e) {
    console.error('[WEBHOOK] Error storing onramp event:', e);
  }
  
  // Handle based on status
  if (status === 'PENDING' && purchaseData?.receiptId) {
    // Update receipt to pending
    const baseOrigin = req.nextUrl.origin;
    try {
      await fetch(`${baseOrigin}/api/receipts/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptId: String(purchaseData.receiptId),
          wallet: merchantWallet,
          status: 'pending'
        })
      });
    } catch (e) {
      console.error('[WEBHOOK] Error updating receipt to pending:', e);
    }
  } else if (status === 'COMPLETED' && splitAddress && merchantWallet) {
    // Trigger split indexing and reconciliation
    const baseOrigin = req.nextUrl.origin;
    
    console.log(`[WEBHOOK] Onramp COMPLETED, triggering split indexing for ${merchantWallet.slice(0,10)}...`);
    
    try {
      await fetch(`${baseOrigin}/api/split/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          splitAddress,
          merchantWallet,
          trigger: 'onramp',
          correlationId
        })
      });
      
      if (purchaseData?.receiptId) {
        await fetch(`${baseOrigin}/api/receipts/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiptId: String(purchaseData.receiptId),
            wallet: merchantWallet,
            status: 'reconciled'
          })
        });
      }
    } catch (e) {
      console.error('[WEBHOOK] Error triggering split indexing for onramp:', e);
    }
  }
  
  return NextResponse.json(
    { ok: true, onrampId: id, status, merchantWallet },
    { headers: { 'x-correlation-id': correlationId } }
  );
}

/**
 * GET /api/webhooks/thirdweb
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'thirdweb-webhook',
    status: 'active',
    configured: !!process.env.WEBHOOK_SECRET
  });
}
