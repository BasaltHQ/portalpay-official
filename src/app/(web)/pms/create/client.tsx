"use client";

import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { Hotel } from "lucide-react";

export function CreatePropertyClient() {
  const account = useActiveAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    logo: "",
    ownerUsername: "",
    ownerPassword: "",
    ownerPasswordConfirm: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkExisting() {
      if (!account?.address) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/pms/instances", {
          headers: { "x-wallet": account.address },
        });
        
        const data = await response.json();
        
        if (data.instances && data.instances.length > 0) {
          // User already has a property, redirect to admin
          router.push("/admin");
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to check existing properties:", e);
        setLoading(false);
      }
    }

    checkExisting();
  }, [account?.address, router]);

  if (!account?.address) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-xl p-8 max-w-md text-center">
          <Hotel className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
          <p className="text-sm text-muted-foreground">
            Please connect your wallet to create a property
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-xl p-8 max-w-md text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Checking existing properties...</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const response = await fetch("/api/pms/instances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet": account?.address || "",
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          branding: {
            logo: formData.logo || undefined,
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
          },
          ownerUsername: formData.ownerUsername,
          ownerPassword: formData.ownerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create property");
        setCreating(false);
        return;
      }

      // Redirect to the new property's dashboard
      router.push(`/pms/${formData.slug}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create property");
      setCreating(false);
    }
  }

  function generateSlug() {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData({ ...formData, slug });
  }

  function validateForm() {
    if (formData.ownerPassword !== formData.ownerPasswordConfirm) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.ownerPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    return true;
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    handleSubmit(e);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-xl p-8 max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-6">
          <Hotel className="h-8 w-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold">Create Your Property</h2>
            <p className="text-sm text-muted-foreground">
              Set up your hotel management system
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Property Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Property Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={50}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={generateSlug}
              placeholder="Grand Hotel & Spa"
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The name of your hotel or property
            </p>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-2">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/pms/</span>
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-z0-9-]+"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="grand-hotel"
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lowercase letters, numbers, and hyphens only. This will be your property's unique URL.
            </p>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Logo URL (optional)</label>
            <input
              type="url"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL to your hotel's logo image
            </p>
          </div>

          {/* Owner Credentials Section */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Owner Login Credentials</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your manager account to access the PMS
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  value={formData.ownerUsername}
                  onChange={(e) => setFormData({ ...formData, ownerUsername: e.target.value })}
                  placeholder="admin"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:outline-none font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.ownerPassword}
                  onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.ownerPasswordConfirm}
                  onChange={(e) => setFormData({ ...formData, ownerPasswordConfirm: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="h-12 w-20 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  className="h-12 w-20 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  placeholder="#8b5cf6"
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              disabled={creating}
              className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !formData.name || !formData.slug || !formData.ownerUsername || !formData.ownerPassword}
              className="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {creating ? "Creating Property..." : "Create Property & Owner Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
