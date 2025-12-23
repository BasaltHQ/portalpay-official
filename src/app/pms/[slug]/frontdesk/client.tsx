/**
 * Front Desk Client Component
 * Interactive front desk operations
 */

'use client';

import { useState } from 'react';
import { CheckInForm } from '@/components/pms/frontdesk/CheckInForm';
import { FolioList } from '@/components/pms/frontdesk/FolioList';
import { FolioManager } from '@/components/pms/frontdesk/FolioManager';
import { CheckOutForm } from '@/components/pms/frontdesk/CheckOutForm';
import { SplitPaymentModal } from '@/components/pms/payments/SplitPaymentModal';
import { useFolios, useAvailableRooms } from '@/lib/pms/hooks';
import type { PMSInstance, PMSFolio } from '@/lib/pms';

interface FrontDeskClientProps {
  instance: PMSInstance;
}

type View = 'list' | 'checkin' | 'folio' | 'checkout' | 'split';

export function FrontDeskClient({ instance }: FrontDeskClientProps) {
  const [view, setView] = useState<View>('list');
  const [selectedFolio, setSelectedFolio] = useState<PMSFolio | null>(null);

  // Fetch data with auto-refresh
  const { folios, loading, refetch } = useFolios(instance.slug);
  const { rooms } = useAvailableRooms(instance.wallet);

  const handleCheckInSuccess = () => {
    refetch();
    setView('list');
  };

  const handleViewFolio = (folio: PMSFolio) => {
    setSelectedFolio(folio);
    setView('folio');
  };

  const handleCheckout = (folio: PMSFolio) => {
    setSelectedFolio(folio);
    setView('checkout');
  };

  const handleCheckoutSuccess = () => {
    refetch();
    setSelectedFolio(null);
    setView('list');
  };

  const handleSplitPayment = () => {
    setView('split');
  };

  const handleSplitSuccess = () => {
    refetch();
    setSelectedFolio(null);
    setView('list');
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'list'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
          }`}
        >
          View Folios
        </button>
        <button
          onClick={() => setView('checkin')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            view === 'checkin'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
          }`}
        >
          New Check-In
        </button>
      </div>

      {/* Content */}
      {view === 'list' && (
        <FolioList
          instance={instance}
          initialFolios={folios}
          onSelectFolio={handleViewFolio}
        />
      )}

      {view === 'checkin' && (
        <CheckInForm
          instance={instance}
          availableRooms={rooms}
          onSuccess={handleCheckInSuccess}
        />
      )}

      {view === 'folio' && selectedFolio && (
        <div className="space-y-4">
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700
              transition-all font-medium"
          >
            ← Back to List
          </button>
          <FolioManager
            folio={selectedFolio}
            instance={instance}
            onUpdate={refetch}
            onCheckout={() => handleCheckout(selectedFolio)}
          />
        </div>
      )}

      {view === 'checkout' && selectedFolio && (
        <CheckOutForm
          instance={instance}
          folio={selectedFolio}
          onSuccess={handleCheckoutSuccess}
          onCancel={() => setView('list')}
          onSplitPayment={handleSplitPayment}
        />
      )}

      {view === 'split' && selectedFolio && (
        <SplitPaymentModal
          instance={instance}
          folio={selectedFolio}
          onSuccess={handleSplitSuccess}
          onCancel={() => setView('checkout')}
        />
      )}
    </div>
  );
}
