/**
 * FolioManager Component  
 * View and manage guest folio with charges
 */

'use client';

import { useState } from 'react';
import { PMSCard, StatusBadge } from '../shared';
import type { PMSFolio, PMSInstance } from '@/lib/pms';
import { formatCurrency, formatDate } from '@/lib/pms';
import { Modal } from "@/components/ui/modal";

interface FolioManagerProps {
  folio: PMSFolio;
  instance: PMSInstance;
  onUpdate: () => void;
  onCheckout: () => void;
}

export function FolioManager({ folio, instance, onUpdate, onCheckout }: FolioManagerProps) {
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newCharge, setNewCharge] = useState({
    description: '',
    amount: '',
    category: 'other' as const,
  });

  // Confirmation modal for destructive actions (replaces window.confirm)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalMicrotexts, setModalMicrotexts] = useState<Array<{ label: string; value?: string }>>([]);

  const handleAddCharge = async () => {
    if (!newCharge.description || !newCharge.amount) return;

    try {
      const res = await fetch(`/api/pms/${instance.slug}/folios/${folio.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newCharge.description,
          amount: parseFloat(newCharge.amount),
          category: newCharge.category,
          taxable: true,
        }),
      });

      if (res.ok) {
        setNewCharge({ description: '', amount: '', category: 'other' });
        setAdding(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to add charge:', error);
    }
  };

  function askDeleteConfirm() {
    try {
      setModalTitle("Delete Folio");
      setModalDesc("Are you sure you want to delete this folio? This action cannot be undone.");
      setModalMicrotexts([
        { label: "Folio #", value: String(folio.folioNumber || folio.id) },
        { label: "Guest", value: String(folio.guestName || "") },
        { label: "Balance Due", value: formatCurrency(folio.balance, instance.settings.currency) },
      ]);
      setConfirmOpen(true);
    } catch {}
  }

  async function performDeleteFolio() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pms/${instance.slug}/folios/${folio.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete folio:', error);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <PMSCard
      title={`Folio #${folio.folioNumber}`}
      subtitle={folio.guestName}
      headerAction={<StatusBadge status={folio.status} />}
    >
      <div className="space-y-6">
        {/* Guest Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Room</p>
            <p className="text-white font-medium">{folio.roomNumber}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Check-In</p>
            <p className="text-white">{formatDate(folio.checkIn)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Check-Out</p>
            <p className="text-white">{formatDate(folio.checkOut)}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Guests</p>
            <p className="text-white">{folio.adults + folio.children} ({folio.adults}A, {folio.children}C)</p>
          </div>
        </div>

        {/* Charges */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Charges
            </h4>
            {folio.status === 'open' && (
              <button
                onClick={() => setAdding(!adding)}
                className="px-3 py-1 rounded text-sm font-medium bg-blue-500 text-white
                  hover:bg-blue-600 transition-colors"
              >
                {adding ? 'Cancel' : '+ Add Charge'}
              </button>
            )}
          </div>

          {adding && (
            <div className="mb-4 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newCharge.description}
                  onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
                  className="px-3 py-2 rounded bg-gray-800/50 border border-gray-700/50
                    text-white text-sm placeholder-gray-500"
                  placeholder="Description"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newCharge.amount}
                  onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                  className="px-3 py-2 rounded bg-gray-800/50 border border-gray-700/50
                    text-white text-sm placeholder-gray-500"
                  placeholder="Amount"
                />
                <button
                  onClick={handleAddCharge}
                  className="px-3 py-2 rounded bg-green-500 text-white text-sm font-medium
                    hover:bg-green-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {folio.charges.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between p-3 bg-gray-800/20 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-white font-medium">{charge.description}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(charge.timestamp)} • Qty: {charge.quantity}
                  </p>
                </div>
                <p className="text-white font-semibold">
                  {formatCurrency(charge.amount * charge.quantity, instance.settings.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-700/50 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-white">{formatCurrency(folio.subtotal, instance.settings.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Tax ({instance.settings.taxRate || 0}%)</span>
            <span className="text-white">{formatCurrency(folio.tax, instance.settings.currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-gray-700/50 pt-2">
            <span className="text-white">Total</span>
            <span className="text-white">{formatCurrency(folio.total, instance.settings.currency)}</span>
          </div>
          {folio.payments.length > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Paid</span>
                <span className="text-green-400">
                  {formatCurrency(folio.total - folio.balance, instance.settings.currency)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-yellow-400">Balance Due</span>
                <span className="text-yellow-400">{formatCurrency(folio.balance, instance.settings.currency)}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {folio.status === 'open' && (
          <div className="flex gap-3">
            {folio.balance > 0 && (
              <button
                onClick={onCheckout}
                className="flex-1 py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl
                  transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${instance.branding.primaryColor}, ${instance.branding.secondaryColor})`,
                }}
              >
                Process Checkout
              </button>
            )}
            <button
              onClick={askDeleteConfirm}
              disabled={deleting}
              className="px-6 py-3 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600
                transition-all duration-200 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Folio'}
            </button>
          </div>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={modalTitle}
        description={modalDesc}
        microtexts={modalMicrotexts}
        actions={[
          { label: "Cancel", onClick: () => setConfirmOpen(false) },
          { label: "Delete", onClick: () => performDeleteFolio(), variant: "primary" }
        ]}
      />
    </PMSCard>
  );
}
