/**
 * CheckOutForm Component
 * Guest checkout with payment processing
 */

'use client';

import { useState, FormEvent } from 'react';
import { PMSCard } from '../shared';
import type { PMSInstance, PMSFolio } from '@/lib/pms';
import { getDefaultBrandSymbol, getDefaultBrandName } from '@/lib/branding';

interface CheckOutFormProps {
  instance: PMSInstance;
  folio: PMSFolio;
  onSuccess: () => void;
  onCancel: () => void;
  onSplitPayment: () => void;
}

type PaymentMethod = 'cash' | 'qr_code' | 'split';

export function CheckOutForm({
  instance,
  folio,
  onSuccess,
  onCancel,
  onSplitPayment
}: CheckOutFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr_code');
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [receiptId, setReceiptId] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const balance = folio.balance;
  const totalPayments = folio.total - folio.balance;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'split') {
      onSplitPayment();
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (paymentMethod === 'qr_code') {
        // Calculate number of nights
        const nights = Math.ceil((folio.checkOut - folio.checkIn) / (1000 * 60 * 60 * 24));

        // Create order via orders API for QR code payment
        const orderRes = await fetch(`/api/orders?wallet=${instance.wallet}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet': instance.wallet,
          },
          body: JSON.stringify({
            items: [{
              id: folio.roomId,
              qty: nights,
            }],
          }),
        });

        const orderData = await orderRes.json();

        if (!orderRes.ok) {
          throw new Error(orderData.error || 'Failed to create payment order');
        }

        // Build payment URL from receipt
        const receiptId = orderData.receipt?.receiptId;
        if (!receiptId) {
          throw new Error('No receipt ID returned from order');
        }

        const paymentUrl = `${window.location.origin}/portal/${receiptId}?recipient=${instance.wallet}`;

        setPaymentUrl(paymentUrl);
        setReceiptId(receiptId);
        setShowQrModal(true);
      } else if (paymentMethod === 'cash') {
        // Process cash checkout directly in PMS
        const res = await fetch(`/api/pms/${instance.slug}/folios/${folio.id}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethod: 'cash',
            timestamp: Date.now(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Checkout failed');
        }

        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PMSCard
      title="Guest Checkout"
      subtitle={`${folio.guestName} - Room ${folio.roomNumber}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Balance Summary */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Total Charges:</span>
              <span className="text-white font-medium">
                ${folio.total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Payments Made:</span>
              <span className="text-white font-medium">
                ${totalPayments.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-gray-700/50 my-2"></div>
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-white">Balance Due:</span>
              <span className="text-2xl font-bold text-blue-400">
                ${balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Payment Method
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'cash'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">💵</div>
                <div className="text-sm font-medium text-white">Cash</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('qr_code')}
              className={`p-4 rounded-lg border-2 transition-all relative overflow-hidden ${paymentMethod === 'qr_code'
                  ? 'border-blue-500'
                  : 'border-gray-700/50 hover:border-gray-600'
                }`}
            >
              {/* 5-point mesh gradient background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `
                    radial-gradient(at 0% 0%, ${instance.branding.primaryColor} 0px, transparent 50%),
                    radial-gradient(at 100% 0%, ${instance.branding.secondaryColor} 0px, transparent 50%),
                    radial-gradient(at 100% 100%, ${instance.branding.primaryColor} 0px, transparent 50%),
                    radial-gradient(at 0% 100%, ${instance.branding.secondaryColor} 0px, transparent 50%),
                    radial-gradient(at 50% 50%, ${instance.branding.primaryColor} 0px, transparent 50%)
                  `,
                }}
              />
              <div className="text-center relative z-10">
                <div className="flex justify-center mb-2">
                  <img
                    src={getDefaultBrandSymbol()}
                    alt={getDefaultBrandName()}
                    className="h-8 w-8"
                  />
                </div>
                <div className="text-sm font-medium text-white">{getDefaultBrandName()}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('split')}
              className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === 'split'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🔀</div>
                <div className="text-sm font-medium text-white">Split</div>
              </div>
            </button>
          </div>
        </div>

        {/* QR Code Info (if QR selected but not generated yet) */}
        {paymentMethod === 'qr_code' && !paymentUrl && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400 font-medium mb-2">
              QR Code Payment
            </p>
            <p className="text-sm text-gray-300">
              Click "Generate QR Code" below to create a payment QR code that the guest can scan with their phone.
            </p>
          </div>
        )}

        {/* Split Payment Info */}
        {paymentMethod === 'split' && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-400 font-medium mb-2">
              Split Payment Configuration
            </p>
            <p className="text-sm text-gray-300">
              Click "Configure Split Payment" below to divide the payment between multiple methods.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg font-medium text-gray-300 bg-gray-700/50
              hover:bg-gray-700 transition-all duration-200"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || balance <= 0 || (paymentMethod === 'qr_code' && !!paymentUrl)}
            className="flex-1 py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${instance.branding.primaryColor}, ${instance.branding.secondaryColor})`,
            }}
          >
            {loading
              ? 'Processing...'
              : paymentMethod === 'split'
                ? 'Configure Split Payment'
                : paymentMethod === 'qr_code' && paymentUrl
                  ? 'Show QR Code'
                  : paymentMethod === 'qr_code'
                    ? 'Generate QR Code'
                    : `Process Cash $${balance.toFixed(2)}`
            }
          </button>
        </div>

        {/* QR Code Modal */}
        {showQrModal && paymentUrl && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Payment QR Code</h3>
                <button
                  onClick={() => {
                    setShowQrModal(false);
                    setCopied(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* QR Code */}
              <div className="bg-white p-6 rounded-lg flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentUrl)}`}
                  alt="Payment QR Code"
                  className="w-64 h-64"
                />
                <p className="text-sm text-gray-700 text-center mt-4">
                  Scan this code to pay ${balance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Receipt: {receiptId}
                </p>
              </div>

              {/* Payment Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Payment Link (for email/SMS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                      text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm
                      font-medium transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  Share this QR code or link with the guest. Payment will be processed when they complete the transaction.
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setShowQrModal(false);
                  setCopied(false);
                  onSuccess();
                }}
                className="w-full py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl
                  transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${instance.branding.primaryColor}, ${instance.branding.secondaryColor})`,
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </form>
    </PMSCard>
  );
}
