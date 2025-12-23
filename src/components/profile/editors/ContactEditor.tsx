"use client";

import React from "react";

interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  showEmail?: boolean;
  showPhone?: boolean;
  showLocation?: boolean;
  showWebsite?: boolean;
}

interface ContactEditorProps {
  contact: ContactInfo;
  onChange: (contact: ContactInfo) => void;
}

export function ContactEditor({ contact, onChange }: ContactEditorProps) {
  const updateField = (field: keyof ContactInfo, value: string | boolean) => {
    onChange({ ...contact, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Email</label>
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={contact.showEmail ?? true}
                onChange={(e) => updateField('showEmail', e.target.checked)}
              />
              Show publicly
            </label>
          </div>
          <input
            type="email"
            className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
            value={contact.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Phone</label>
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={contact.showPhone ?? false}
                onChange={(e) => updateField('showPhone', e.target.checked)}
              />
              Show publicly
            </label>
          </div>
          <input
            type="tel"
            className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
            value={contact.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Location</label>
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={contact.showLocation ?? true}
                onChange={(e) => updateField('showLocation', e.target.checked)}
              />
              Show publicly
            </label>
          </div>
          <input
            type="text"
            className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
            value={contact.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="City, Country"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Website</label>
            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={contact.showWebsite ?? true}
                onChange={(e) => updateField('showWebsite', e.target.checked)}
              />
              Show publicly
            </label>
          </div>
          <input
            type="url"
            className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm"
            value={contact.website || ''}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Privacy toggles control whether each field is visible on your public profile.
      </p>
    </div>
  );
}
