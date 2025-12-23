'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SetupFormProps {
  slug: string;
  instanceName: string;
}

export function SetupForm({ slug, instanceName }: SetupFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      let logoUrl: string | undefined;

      // Upload logo if provided
      if (logoFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', logoFile);

        const uploadRes = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload logo');
        }

        logoUrl = uploadData.url;
        setUploadingImage(false);
      }

      // Complete setup with password and logo
      const res = await fetch(`/api/pms/${slug}/complete-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerPassword: password,
          logo: logoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      // Redirect to login page
      router.push(`/pms/${slug}/login?setup=complete`);
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup');
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Complete Setup
            </h1>
            <p className="text-gray-400">
              {instanceName}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Set up your owner account and property logo to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Owner Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Owner Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg
                  text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
                  transition-colors"
                placeholder="Enter secure password"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg
                  text-white placeholder-gray-500 focus:outline-none focus:border-blue-500
                  transition-colors"
                placeholder="Confirm password"
                required
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Property Logo (optional)
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg
                    text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                    file:text-sm file:font-semibold file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700 file:cursor-pointer"
                />
                {logoPreview && (
                  <div className="flex justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-32 rounded-lg border border-gray-600"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload your property's logo (JPG, PNG, WebP)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600
                disabled:cursor-not-allowed text-white font-semibold rounded-lg
                transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {uploadingImage ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading logo...
                </>
              ) : loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>

            <p className="text-xs text-center text-gray-500">
              Username will be set to "owner" automatically
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
