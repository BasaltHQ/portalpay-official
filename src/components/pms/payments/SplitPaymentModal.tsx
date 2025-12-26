/**
 * SplitPaymentModal Component
 * Configure split payments between cash and card
 */

'use client';

import { useState, FormEvent } from 'react';
import { PMSCard } from '../shared';
import type { PMSInstance, PMSFolio, PaymentSegment } from '@/lib/pms';
import { getDefaultBrandSymbol, getDefaultBrandName } from '@/lib/branding';

interface SplitPaymentModalProps {
  instance: PMSInstance;
  folio: PMSFolio;
  onSuccess: () => void;
  onCancel: () => void;
}

interface SegmentConfig {
  amount: string;
  method: 'cash' | 'qr_code';
  paymentUrl?: string;
  receiptId?: string;
}

export function SplitPaymentModal({
  instance,
  folio,
  onSuccess,
  onCancel
}: SplitPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [segments, setSegments] = useState<SegmentConfig[]>([
    { amount: '', method: 'qr_code' },
    { amount: '', method: 'cash' },
  ]);
  const [copied, setCopied] = useState<number | null>(null);

  const balance = folio.balance;
  const totalAllocated = segments.reduce((sum, seg) => sum + (parseFloat(seg.amount) || 0), 0);
  const remaining = balance - totalAllocated;
  const isValid = Math.abs(remaining) < 0.01 && segments.every(s => parseFloat(s.amount) > 0);

  const handleAddSegment = () => {
    setSegments([...segments, { amount: '', method: 'cash' }]);
  };

  const handleRemoveSegment = (index: number) => {
    if (segments.length > 2) {
      setSegments(segments.filter((_, i) => i !== index));
    }
  };

  const handleSegmentChange = (index: number, field: keyof SegmentConfig, value: string) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setSegments(newSegments);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError('Total allocated must equal balance due');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // If QR codes not yet generated, generate them first
      if (segments.some(s => s.method === 'qr_code' && !s.paymentUrl)) {
        const nights = Math.ceil((folio.checkOut - folio.checkIn) / (1000 * 60 * 60 * 24));
        const newSegments = [...segments];

        // Generate orders for PortalPay segments
        for (let i = 0; i < newSegments.length; i++) {
          const segment = newSegments[i];

          if (segment.method === 'qr_code' && !segment.paymentUrl) {
            // Calculate proportional qty based on segment amount
            const segmentQty = Math.max(1, Math.round((parseFloat(segment.amount) / balance) * nights));

            const orderRes = await fetch(`/api/orders?wallet=${instance.wallet}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-wallet': instance.wallet,
              },
              body: JSON.stringify({
                items: [{
                  id: folio.roomId,
                  qty: segmentQty,
                }],
              }),
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok) {
              throw new Error(orderData.error || 'Failed to create payment order');
            }

            const receiptId = orderData.receipt?.receiptId;
            if (!receiptId) {
              throw new Error('No receipt ID returned from order');
            }

            const paymentUrl = `${window.location.origin}/portal/${receiptId}?recipient=${instance.wallet}`;

            newSegments[i] = {
              ...segment,
              paymentUrl,
              receiptId,
            };
          }
        }

        setSegments(newSegments);
        setLoading(false);
        return;
      }

      // QR codes generated, now complete the split payment
      const res = await fetch(`/api/pms/${instance.slug}/payments/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folioId: folio.id,
          totalAmount: balance,
          segments: segments.map(s => ({
            amount: parseFloat(s.amount),
            method: s.method,
            receiptId: s.receiptId,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create split payment');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create split payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 border border-gray-700/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <PMSCard
          title="Configure Split Payment"
          subtitle={`${folio.guestName} - Room ${folio.roomNumber}`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Balance Info */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-white">Total Balance:</span>
                  <span className="text-2xl font-bold text-blue-400">
                    ${balance.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Allocated:</span>
                  <span className={`font-medium ${totalAllocated > balance ? 'text-red-400' : 'text-white'}`}>
                    ${totalAllocated.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Remaining:</span>
                  <span className={`font-medium ${remaining > 0.01 ? 'text-yellow-400' : remaining < -0.01 ? 'text-red-400' : 'text-green-400'}`}>
                    ${remaining.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Segments */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Payment Segments
                </h3>
                <button
                  type="button"
                  onClick={handleAddSegment}
                  className="px-3 py-1.5 text-sm rounded-lg bg-blue-500/20 hover:bg-blue-500/30 
                    text-blue-400 border border-blue-500/30 transition-all"
                  disabled={loading}
                >
                  + Add Segment
                </button>
              </div>

              {segments.map((segment, index) => (
                <div key={index} className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Amount <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={segment.amount}
                          onChange={(e) => handleSegmentChange(index, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                            text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Method <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={segment.method}
                            onChange={(e) => handleSegmentChange(index, 'method', e.target.value as 'cash' | 'qr_code')}
                            className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                              text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            disabled={loading}
                          >
                            <option value="cash">💵 Cash</option>
                            <option value="qr_code">{getDefaultBrandName()}</option>
                          </select>
                          {segment.method === 'qr_code' && (
                            <img
                              src={getDefaultBrandSymbol()}
                              alt={getDefaultBrandName()}
                              className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {segments.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSegment(index)}
                        className="mt-7 p-2 rounded-lg text-red-400 hover:bg-red-500/10 
                          border border-red-500/30 transition-all"
                        disabled={loading}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Messages */}
            {!isValid && totalAllocated > 0 && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-yellow-400">
                  {remaining > 0.01
                    ? `You need to allocate $${remaining.toFixed(2)} more`
                    : remaining < -0.01
                      ? `You've allocated $${Math.abs(remaining).toFixed(2)} too much`
                      : 'Allocation looks good!'
                  }
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Generated PortalPay Links */}
            {segments.some(s => s.paymentUrl) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  {getDefaultBrandName()} Payment Links
                </h3>
                {segments.map((segment, index) => segment.paymentUrl && (
                  <div key={index} className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(segment.paymentUrl)}`}
                        alt={`QR Code ${index + 1}`}
                        className="w-24 h-24 rounded"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-white">
                            {getDefaultBrandName()} Segment {index + 1}
                          </span>
                          <span className="text-lg font-bold text-blue-400">
                            ${parseFloat(segment.amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={segment.paymentUrl}
                            readOnly
                            className="flex-1 px-2 py-1 rounded bg-gray-900/50 border border-gray-700/50
                              text-gray-400 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(segment.paymentUrl!);
                              setCopied(index);
                              setTimeout(() => setCopied(null), 2000);
                            }}
                            className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs
                              font-medium transition-colors"
                          >
                            {copied === index ? '✓' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">Receipt: {segment.receiptId}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <p className="text-sm text-purple-400 font-medium mb-1">Processing Note</p>
              <p className="text-sm text-gray-300">
                Generate QR codes for {getDefaultBrandName()} segments. Guests scan codes on their devices to pay their portion. Cash is processed directly in PMS.
              </p>
            </div>

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
                disabled={loading || !isValid}
                className="flex-1 py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${instance.branding.primaryColor}, ${instance.branding.secondaryColor})`,
                }}
              >
                {loading ? 'Generating...' : segments.some(s => s.paymentUrl) ? 'Complete Split Payment' : `Generate ${getDefaultBrandName()} Links`}
              </button>
            </div>
          </form>
        </PMSCard>
      </div>
    </div>
  );
}
