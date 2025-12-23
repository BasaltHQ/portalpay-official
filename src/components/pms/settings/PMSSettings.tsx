/**
 * PMSSettings Component
 * PMS instance settings configuration
 */

'use client';

import { useState, FormEvent } from 'react';
import { PMSCard } from '../shared';
import type { PMSInstance } from '@/lib/pms';

interface PMSSettingsProps {
  instance: PMSInstance;
  onUpdate: () => void;
}

export function PMSSettings({ instance, onUpdate }: PMSSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: instance.name,
    primaryColor: instance.branding.primaryColor,
    secondaryColor: instance.branding.secondaryColor,
    checkInTime: instance.settings.checkInTime,
    checkOutTime: instance.settings.checkOutTime,
    currency: instance.settings.currency,
    timezone: instance.settings.timezone,
    taxRate: instance.settings.taxRate || 0,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`/api/pms/instances/${instance.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          branding: {
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
          },
          settings: {
            checkInTime: formData.checkInTime,
            checkOutTime: formData.checkOutTime,
            currency: formData.currency,
            timezone: formData.timezone,
            taxRate: formData.taxRate,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSuccess('Settings updated successfully');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PMSCard title="PMS Settings" subtitle="Configure your property management system">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            General Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Property Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Grand Hotel"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Branding */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Branding
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Color <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-10 w-16 rounded cursor-pointer"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                    text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#3b82f6"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secondary Color <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="h-10 w-16 rounded cursor-pointer"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                    text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#8b5cf6"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="p-4 rounded-lg border border-gray-700/50 bg-gray-800/30">
            <p className="text-sm text-gray-400 mb-3">Button Preview:</p>
            <button
              type="button"
              className="px-6 py-2 rounded-lg font-medium text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`,
              }}
            >
              Sample Button
            </button>
          </div>
        </div>

        {/* Operational Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Operations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Check-In Time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Check-Out Time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Currency <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tax Rate (%) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10.00"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timezone <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50
                  text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`,
          }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </PMSCard>
  );
}
