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

interface ContactSectionProps {
  contact: ContactInfo;
}

function MailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/>
    </svg>
  );
}

function PhoneIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7A2 2 0 0 1 22 16.9z"/>
    </svg>
  );
}

function MapPinIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function GlobeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

export function ContactSection({ contact }: ContactSectionProps) {
  const hasVisibleContact = (contact?.showEmail && contact?.email) || 
                           (contact?.showPhone && contact?.phone) || 
                           (contact?.showLocation && contact?.location) || 
                           (contact?.showWebsite && contact?.website);

  if (!hasVisibleContact) return null;

  return (
    <div className="glass-pane rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <MailIcon size={18} />
        Contact
      </h2>
      <div className="space-y-2">
        {contact.showEmail && contact.email && (
          <div className="flex items-center gap-2 text-sm">
            <MailIcon size={14} />
            <a href={`mailto:${contact.email}`} className="hover:underline truncate">
              {contact.email}
            </a>
          </div>
        )}
        {contact.showPhone && contact.phone && (
          <div className="flex items-center gap-2 text-sm">
            <PhoneIcon size={14} />
            <span className="truncate">{contact.phone}</span>
          </div>
        )}
        {contact.showLocation && contact.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon size={14} />
            <span className="truncate">{contact.location}</span>
          </div>
        )}
        {contact.showWebsite && contact.website && (
          <div className="flex items-center gap-2 text-sm">
            <GlobeIcon size={14} />
            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
              {contact.website}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
