/**
 * StaffLoginForm Component
 * Beautiful login form for staff authentication
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { PMSInstance } from '@/lib/pms';

interface StaffLoginFormProps {
  instance: PMSInstance;
}

export function StaffLoginForm({ instance }: StaffLoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/pms/${instance.slug}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to dashboard on success
      router.push(`/pms/${instance.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4
      bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          {instance.branding.logo ? (
            <img
              src={instance.branding.logo}
              alt={instance.name}
              className="h-16 w-16 mx-auto rounded-xl object-cover mb-4"
            />
          ) : (
            <div
              className="h-16 w-16 mx-auto rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4"
              style={{ backgroundColor: instance.branding.primaryColor }}
            >
              {instance.name.charAt(0)}
            </div>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">
            {instance.name}
          </h1>
          <p className="text-gray-400">Staff Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg
                  bg-gray-800/50 border border-gray-700/50
                  text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                  transition-all"
                placeholder="Enter your username"
                required
                autoComplete="username"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg
                  bg-gray-800/50 border border-gray-700/50
                  text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                  transition-all"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-white
                shadow-lg hover:shadow-xl
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                relative overflow-hidden group"
              style={{
                background: `linear-gradient(135deg, ${instance.branding.primaryColor}, ${instance.branding.secondaryColor})`,
              }}
            >
              <span className="relative z-10">
                {loading ? 'Signing in...' : 'Sign In'}
              </span>
              <div
                className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100
                  transition-transform duration-300 origin-left"
              />
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Secure staff access powered by Ledger1.ai PMS
        </p>
      </div>
    </div>
  );
}
