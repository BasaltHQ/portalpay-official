"use client";

import React from "react";

interface RelationshipInfo {
  status?: string;
  partner?: string;
}

interface RelationshipEditorProps {
  relationship: RelationshipInfo;
  onChange: (relationship: RelationshipInfo) => void;
}

const relationshipStatuses = [
  'Single',
  'In a relationship',
  'Engaged',
  'Married',
  "It's complicated",
  'In an open relationship',
  'Prefer not to say'
];

export function RelationshipEditor({ relationship, onChange }: RelationshipEditorProps) {
  const updateField = (field: keyof RelationshipInfo, value: string) => {
    onChange({ ...relationship, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-2">Relationship Status</label>
        <select
          className="w-full h-9 px-3 border rounded-md bg-background text-sm"
          value={relationship.status || ''}
          onChange={(e) => updateField('status', e.target.value)}
        >
          <option value="">Select status...</option>
          {relationshipStatuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {relationship.status && relationship.status !== 'Single' && relationship.status !== 'Prefer not to say' && (
        <div>
          <label className="text-sm font-medium block mb-2">
            Partner's Wallet Address (Optional)
          </label>
          <input
            type="text"
            className="w-full h-9 px-3 py-1 border rounded-md bg-background text-sm font-mono"
            value={relationship.partner || ''}
            onChange={(e) => updateField('partner', e.target.value)}
            placeholder="0x..."
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter your partner's wallet address to link profiles
          </p>
        </div>
      )}
    </div>
  );
}
