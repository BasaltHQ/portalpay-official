"use client";

import React, { useState } from "react";
import { User, MessageSquare, Star, Mail, Heart, Link, Palette, Tag, Crown } from "lucide-react";
import {
  BasicInfoEditor,
  StatusEditor,
  InterestsEditor,
  ContactEditor,
  RelationshipEditor,
  LinksEditor,
  AppearanceEditor,
  RolesEditor,
  RingEditor
} from "./editors";

type LinkItem = { label: string; url: string };
type InterestItem = { name: string; category: string };
type ContactInfo = { email?: string; phone?: string; location?: string; website?: string; showEmail?: boolean; showPhone?: boolean; showLocation?: boolean; showWebsite?: boolean };
type StatusInfo = { message?: string; mood?: string; updatedAt?: number };
type RelationshipInfo = { status?: string; partner?: string };

interface EditFormTabsProps {
  displayName: string;
  bio: string;
  pfpUrl: string;
  status: StatusInfo;
  interests: InterestItem[];
  contact: ContactInfo;
  relationship: RelationshipInfo;
  links: LinkItem[];
  roles: { merchant: boolean; buyer: boolean };
  profileConfig: any;
  uploadBusy: boolean;
  uploadBgBusy: boolean;
  // Ring props
  onOpenRingModal?: () => void;
  activeRing?: { type: 'platform' | 'merchant' | 'none'; wallet?: string } | null;
  ringLevel?: number;
  ringPrimaryColor?: string;
  ringSecondaryColor?: string;
  ringText?: string;
  ringName?: string;
  onDisplayNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onPfpUrlChange: (value: string) => void;
  onPfpUpload: () => void;
  onStatusChange: (status: StatusInfo) => void;
  onInterestsChange: (interests: InterestItem[]) => void;
  onContactChange: (contact: ContactInfo) => void;
  onRelationshipChange: (relationship: RelationshipInfo) => void;
  onLinksChange: (links: LinkItem[]) => void;
  onRolesChange: (roles: { merchant: boolean; buyer: boolean }) => void;
  onProfileConfigChange: (config: any) => void;
  onBackgroundUpload: () => void;
}

type TabId = 'ring' | 'basic' | 'status' | 'interests' | 'contact' | 'relationship' | 'links' | 'appearance' | 'roles';

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'ring', label: 'Profile Ring', icon: Crown },
  { id: 'basic', label: 'Basic Info', icon: User },
  { id: 'status', label: 'Status', icon: MessageSquare },
  { id: 'interests', label: 'Interests', icon: Star },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'relationship', label: 'Relationship', icon: Heart },
  { id: 'links', label: 'Links', icon: Link },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'roles', label: 'Roles', icon: Tag }
];

export function EditFormTabs(props: EditFormTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ring');

  return (
    <div className="glass-pane rounded-xl border overflow-hidden">
      {/* Tabs Navigation */}
      <div className="border-b overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'ring' && (
          <RingEditor
            pfpUrl={props.pfpUrl}
            activeRing={props.activeRing}
            ringLevel={props.ringLevel}
            ringPrimaryColor={props.ringPrimaryColor}
            ringSecondaryColor={props.ringSecondaryColor}
            ringText={props.ringText}
            ringName={props.ringName}
            onOpenRingModal={props.onOpenRingModal}
          />
        )}

        {activeTab === 'basic' && (
          <BasicInfoEditor
            displayName={props.displayName}
            bio={props.bio}
            pfpUrl={props.pfpUrl}
            onDisplayNameChange={props.onDisplayNameChange}
            onBioChange={props.onBioChange}
            onPfpUrlChange={props.onPfpUrlChange}
            onPfpUpload={props.onPfpUpload}
            uploadBusy={props.uploadBusy}
          />
        )}

        {activeTab === 'status' && (
          <StatusEditor
            message={props.status.message || ''}
            mood={props.status.mood || ''}
            onMessageChange={(msg) => props.onStatusChange({ ...props.status, message: msg })}
            onMoodChange={(mood) => props.onStatusChange({ ...props.status, mood })}
          />
        )}

        {activeTab === 'interests' && (
          <InterestsEditor
            interests={props.interests}
            onAdd={(interest) => props.onInterestsChange([...props.interests, interest])}
            onRemove={(index) => props.onInterestsChange(props.interests.filter((_, i) => i !== index))}
          />
        )}

        {activeTab === 'contact' && (
          <ContactEditor
            contact={props.contact}
            onChange={props.onContactChange}
          />
        )}

        {activeTab === 'relationship' && (
          <RelationshipEditor
            relationship={props.relationship}
            onChange={props.onRelationshipChange}
          />
        )}

        {activeTab === 'links' && (
          <LinksEditor
            links={props.links}
            onChange={props.onLinksChange}
          />
        )}

        {activeTab === 'appearance' && (
          <AppearanceEditor
            themeColor={props.profileConfig.themeColor || '#8b5cf6'}
            backgroundUrl={props.profileConfig.backgroundUrl || ''}
            htmlBox={props.profileConfig.htmlBox || ''}
            onThemeColorChange={(color) => props.onProfileConfigChange({ ...props.profileConfig, themeColor: color })}
            onBackgroundUrlChange={(url) => props.onProfileConfigChange({ ...props.profileConfig, backgroundUrl: url })}
            onHtmlBoxChange={(html) => props.onProfileConfigChange({ ...props.profileConfig, htmlBox: html })}
            onBackgroundUpload={props.onBackgroundUpload}
            uploadBgBusy={props.uploadBgBusy}
          />
        )}

        {activeTab === 'roles' && (
          <RolesEditor
            merchant={props.roles.merchant}
            buyer={props.roles.buyer}
            onMerchantChange={(value) => props.onRolesChange({ ...props.roles, merchant: value })}
            onBuyerChange={(value) => props.onRolesChange({ ...props.roles, buyer: value })}
          />
        )}
      </div>
    </div>
  );
}
