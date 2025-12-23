/**
 * FolioList Component
 * Display list of guest folios with quick actions
 */

'use client';

import { useState, useEffect } from 'react';
import { PMSCard, StatusBadge } from '../shared';
import type { PMSFolio, PMSInstance } from '@/lib/pms';
import { formatCurrency, formatDate } from '@/lib/pms';

interface FolioListProps {
  instance: PMSInstance;
  initialFolios?: PMSFolio[];
  onSelectFolio?: (folio: PMSFolio) => void;
}

export function FolioList({ instance, initialFolios = [], onSelectFolio }: FolioListProps) {
  const [folios, setFolios] = useState<PMSFolio[]>(initialFolios);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'checked_out'>('open');

  useEffect(() => {
    loadFolios();
  }, [filter]);

  const loadFolios = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? `/api/pms/${instance.slug}/folios`
        : `/api/pms/${instance.slug}/folios?status=${filter}`;
        
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        setFolios(data.folios || []);
      }
    } catch (error) {
      console.error('Failed to load folios:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PMSCard 
      title="Active Folios"
      subtitle={`${folios.length} ${filter === 'all' ? 'total' : filter} folio(s)`}
      headerAction={
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === 'open'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('checked_out')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === 'checked_out'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            Checked Out
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-gray-400 mt-2">Loading folios...</p>
        </div>
      ) : folios.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No folios found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {folios.map((folio) => (
            <button
              key={folio.id}
              onClick={() => onSelectFolio?.(folio)}
              className="w-full p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg
                hover:border-gray-600 hover:bg-gray-800/50
                transition-all duration-200 text-left group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {folio.guestName}
                  </h4>
                  <p className="text-sm text-gray-400">
                    Folio #{folio.folioNumber}
                  </p>
                </div>
                <StatusBadge status={folio.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Room</p>
                  <p className="text-gray-300 font-medium">{folio.roomNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Balance</p>
                  <p className={`font-medium ${folio.balance > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {formatCurrency(folio.balance, instance.settings.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Check-In</p>
                  <p className="text-gray-300">{formatDate(folio.checkIn)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-Out</p>
                  <p className="text-gray-300">{formatDate(folio.checkOut)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </PMSCard>
  );
}
