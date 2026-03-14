'use client';

/**
 * TemplateCustomizer — Shopify-class no-code template editor.
 *
 * Three-column layout:
 *   Left:   Page tabs + section list (reorder, add, remove, toggle visibility)
 *   Center: Live preview placeholder (rendered later in Phase 4)
 *   Right:  Section settings editor (schema-driven form from SectionDefinition)
 *
 * This component allows full no-code modification of every section within
 * every page of a template — headings, images, colors, toggles, layout
 * options, everything defined in the section's schema.
 */

import React, { useState, useMemo } from 'react';
import type { ShopTemplate, SectionConfig, SectionDefinition, ShopSectionType } from '@/lib/shop-templates/types';
import { getSectionDefinition, getAllSectionDefinitions } from '@/lib/shop-templates/registry';
import SectionSettingsEditor from './SectionSettingsEditor';
import SectionPreview, { NavbarPreview } from './SectionPreview';

interface TemplateCustomizerProps {
  template: ShopTemplate;
  onSectionsChange: (pageKey: string, sections: SectionConfig[]) => void;
  onGlobalSettingsChange?: (key: string, value: any) => void;
  shopData?: {
    shopName: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    items: any[];
  };
}

type PageKey = 'home' | 'product' | 'collection';

const PAGE_LABELS: Record<PageKey, { label: string; desc: string }> = {
  home:       { label: 'Home',       desc: 'Main storefront landing page' },
  product:    { label: 'Product',    desc: 'Individual product detail page' },
  collection: { label: 'Collection', desc: 'Collection listing page' },
};

export default function TemplateCustomizer({ template, onSectionsChange, onGlobalSettingsChange, shopData }: TemplateCustomizerProps) {
  const [activePage, setActivePage] = useState<PageKey>('home');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'section' | 'global'>('section');

  const currentSections = template.pages[activePage] || [];
  const selectedSection = currentSections.find(s => s.id === selectedSectionId);
  const selectedDef = selectedSection ? getSectionDefinition(selectedSection.type as ShopSectionType) : null;

  const allDefs = useMemo(() => getAllSectionDefinitions(), []);
  const availableDefs = allDefs.filter(def =>
    template.supportedSections.includes(def.type) &&
    !currentSections.some(s => s.type === def.type && def.maxPerPage === 1)
  );

  // ── Section mutations ──

  const updateSectionSettings = (sectionId: string, key: string, value: any) => {
    const updated = currentSections.map(s =>
      s.id === sectionId ? { ...s, settings: { ...s.settings, [key]: value } } : s
    );
    onSectionsChange(activePage, updated);
  };

  const toggleVisibility = (sectionId: string) => {
    const updated = currentSections.map(s =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    onSectionsChange(activePage, updated);
  };

  const removeSection = (sectionId: string) => {
    const section = currentSections.find(s => s.id === sectionId);
    if (section && template.requiredSections.includes(section.type as ShopSectionType)) return;
    const updated = currentSections.filter(s => s.id !== sectionId);
    onSectionsChange(activePage, updated);
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const idx = currentSections.findIndex(s => s.id === sectionId);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === currentSections.length - 1) return;
    const updated = [...currentSections];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    onSectionsChange(activePage, updated);
  };

  const addSection = (def: SectionDefinition) => {
    const defaults: Record<string, any> = {};
    for (const setting of def.settings) {
      if (setting.default !== undefined) defaults[setting.key] = setting.default;
    }
    const newSection: SectionConfig = {
      id: `${def.type}-${Date.now()}`,
      type: def.type,
      visible: true,
      settings: defaults,
    };
    onSectionsChange(activePage, [...currentSections, newSection]);
    setSelectedSectionId(newSection.id);
    setShowAddSection(false);
    setSettingsTab('section');
  };

  const duplicateSection = (sectionId: string) => {
    const source = currentSections.find(s => s.id === sectionId);
    if (!source) return;
    const cloned: SectionConfig = {
      ...source,
      id: `${source.type}-${Date.now()}`,
      settings: { ...source.settings },
    };
    const idx = currentSections.findIndex(s => s.id === sectionId);
    const updated = [...currentSections];
    updated.splice(idx + 1, 0, cloned);
    onSectionsChange(activePage, updated);
    setSelectedSectionId(cloned.id);
  };

  return (
    <div className="flex h-full min-h-0">

      {/* ── Left Panel: Pages + Sections ── */}
      <div className="w-64 shrink-0 border-r border-white/10 bg-black/10 flex flex-col overflow-hidden">
        {/* Page tabs */}
        <div className="px-3 pt-3 pb-2 border-b border-white/10 shrink-0">
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Page</p>
          <div className="flex gap-1">
            {(Object.keys(PAGE_LABELS) as PageKey[]).map(key => (
              <button
                key={key}
                onClick={() => { setActivePage(key); setSelectedSectionId(null); }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activePage === key
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {PAGE_LABELS[key].label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-600 mt-1.5">{PAGE_LABELS[activePage].desc}</p>
        </div>

        {/* Section list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">
              Sections ({currentSections.length})
            </p>
            <button
              onClick={() => setShowAddSection(!showAddSection)}
              className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors"
            >
              + Add
            </button>
          </div>

          {currentSections.map((section, idx) => {
            const def = getSectionDefinition(section.type as ShopSectionType);
            const isSelected = selectedSectionId === section.id;
            const isRequired = template.requiredSections.includes(section.type as ShopSectionType);
            return (
              <div
                key={section.id}
                className={`group rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 border-emerald-500/30 ring-1 ring-emerald-500/10'
                    : section.visible
                      ? 'bg-white/5 border-white/10 hover:border-white/20'
                      : 'bg-black/20 border-white/5 opacity-50 hover:opacity-75'
                }`}
                onClick={() => { setSelectedSectionId(section.id); setSettingsTab('section'); }}
              >
                <div className="flex items-center gap-2 px-2.5 py-2">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-px opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); moveSection(section.id, 'up'); }}
                      disabled={idx === 0}
                      className="text-[8px] text-gray-500 hover:text-white disabled:opacity-20 leading-none"
                    >
                      ▲
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); moveSection(section.id, 'down'); }}
                      disabled={idx === currentSections.length - 1}
                      className="text-[8px] text-gray-500 hover:text-white disabled:opacity-20 leading-none"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Section info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate capitalize">
                      {def?.name || section.type.replace(/-/g, ' ')}
                    </p>
                    <p className="text-[9px] text-gray-500 truncate">
                      {def?.description?.slice(0, 40) || section.type}
                      {(def?.description?.length || 0) > 40 ? '...' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); toggleVisibility(section.id); }}
                      className={`text-[10px] px-1 ${section.visible ? 'text-emerald-400' : 'text-gray-500'}`}
                      title={section.visible ? 'Hide' : 'Show'}
                    >
                      {section.visible ? '●' : '○'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); duplicateSection(section.id); }}
                      className="text-[10px] text-gray-400 hover:text-white px-1"
                      title="Duplicate"
                    >
                      ⊕
                    </button>
                    {!isRequired && (
                      <button
                        onClick={e => { e.stopPropagation(); removeSection(section.id); }}
                        className="text-[10px] text-red-400 hover:text-red-300 px-1"
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Settings count badge */}
                {def && (
                  <div className="px-2.5 pb-1.5">
                    <span className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded text-gray-500">
                      {def.settings.length} settings
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {currentSections.length === 0 && (
            <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
              <p className="text-xs text-gray-500">No sections on this page</p>
              <button
                onClick={() => setShowAddSection(true)}
                className="mt-2 text-[10px] text-emerald-400 hover:text-emerald-300"
              >
                + Add your first section
              </button>
            </div>
          )}
        </div>

        {/* Global settings tab */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            onClick={() => { setSelectedSectionId(null); setSettingsTab('global'); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              settingsTab === 'global' && !selectedSectionId
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Theme Settings
          </button>
        </div>
      </div>

      {/* ── Center: Preview ── */}
      <div className="flex-1 min-w-0 bg-gradient-to-b from-black/5 to-black/20 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {/* Device toggles */}
              {[
                { label: 'Desktop', w: 20, h: 16, rx: 2 },
                { label: 'Tablet', w: 14, h: 20, rx: 2 },
                { label: 'Mobile', w: 10, h: 20, rx: 2 },
              ].map(d => (
                <button
                  key={d.label}
                  className="w-7 h-7 rounded border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
                  title={d.label}
                >
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x={(24-d.w)/2} y={(24-d.h)/2} width={d.w} height={d.h} rx={d.rx} />
                  </svg>
                </button>
              ))}
            </div>
            <span className="text-[10px] text-gray-500">|</span>
            <p className="text-[10px] text-gray-400">
              {PAGE_LABELS[activePage].label} Page
              {selectedSection && ` / ${getSectionDefinition(selectedSection.type as ShopSectionType)?.name || selectedSection.type}`}
            </p>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-0">
            {/* Storefront navbar chrome */}
            <NavbarPreview templateId={template.id} theme={{ colors: template.theme.colors, typography: template.theme.typography }} shopData={shopData} />

            {/* Section previews */}
            <div className="space-y-3 rounded-b-lg p-3" style={{ backgroundColor: template.theme.colors.background }}>
              {currentSections.filter(s => s.visible).map(section => (
                <SectionPreview
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionId === section.id}
                  onClick={() => { setSelectedSectionId(section.id); setSettingsTab('section'); }}
                  theme={{ colors: template.theme.colors, typography: template.theme.typography }}
                  templateId={template.id}
                  shopData={shopData}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Settings Editor ── */}
      <div className="w-80 shrink-0 border-l border-white/10 bg-black/10 flex flex-col overflow-hidden">
        {selectedSection && selectedDef && settingsTab === 'section' ? (
          <>
            {/* Section header */}
            <div className="px-4 py-3 border-b border-white/10 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white capitalize">{selectedDef.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{selectedDef.description}</p>
                </div>
                <button
                  onClick={() => setSelectedSectionId(null)}
                  className="text-[10px] text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-white/5"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Settings form */}
            <div className="flex-1 overflow-y-auto p-4">
              <SectionSettingsEditor
                schema={selectedDef.settings}
                values={selectedSection.settings}
                onChange={(key, value) => updateSectionSettings(selectedSection.id, key, value)}
              />

              {/* Blocks editor (if section supports blocks) */}
              {selectedDef.blocks && selectedDef.blocks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">
                    Blocks ({selectedSection.blocks?.length || 0})
                  </p>
                  {selectedSection.blocks?.map((block, blockIdx) => {
                    const blockDef = selectedDef.blocks?.find(b => b.type === block.type);
                    return (
                      <div key={block.id} className="mb-3 p-3 bg-black/20 rounded-lg border border-white/5">
                        <p className="text-[10px] font-semibold text-gray-300 mb-2">
                          {blockDef?.name || block.type} #{blockIdx + 1}
                        </p>
                        {blockDef && (
                          <SectionSettingsEditor
                            schema={blockDef.settings}
                            values={block.settings}
                            onChange={(key, value) => {
                              const updatedBlocks = selectedSection.blocks?.map(b =>
                                b.id === block.id ? { ...b, settings: { ...b.settings, [key]: value } } : b
                              );
                              const updated = currentSections.map(s =>
                                s.id === selectedSection.id ? { ...s, blocks: updatedBlocks } : s
                              );
                              onSectionsChange(activePage, updated);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : settingsTab === 'global' ? (
          <>
            {/* Global theme settings */}
            <div className="px-4 py-3 border-b border-white/10 shrink-0">
              <p className="text-sm font-semibold text-white">Theme Settings</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Global design tokens for {template.name}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Colors */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Colors</p>
                <div className="space-y-2.5">
                  {Object.entries(template.theme.colors).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={val}
                        onChange={e => onGlobalSettingsChange?.(`colors.${key}`, e.target.value)}
                        className="w-8 h-8 rounded border border-white/10 cursor-pointer bg-transparent p-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-[9px] font-mono text-gray-500">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Typography</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-500">Heading Font</label>
                    <input
                      type="text"
                      value={template.theme.typography.headingFont}
                      onChange={e => onGlobalSettingsChange?.('typography.headingFont', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Body Font</label>
                    <input
                      type="text"
                      value={template.theme.typography.bodyFont}
                      onChange={e => onGlobalSettingsChange?.('typography.bodyFont', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500">Base Size</label>
                      <input type="number" value={template.theme.typography.baseSize} onChange={e => onGlobalSettingsChange?.('typography.baseSize', Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Line Height</label>
                      <input type="number" step="0.1" value={template.theme.typography.lineHeight} onChange={e => onGlobalSettingsChange?.('typography.lineHeight', Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Layout</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-500">Max Width (px)</label>
                    <input type="number" value={template.theme.layout.maxWidth} onChange={e => onGlobalSettingsChange?.('layout.maxWidth', Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs mt-1" step="100" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Border Radius</label>
                    <select value={template.theme.layout.borderRadius} onChange={e => onGlobalSettingsChange?.('layout.borderRadius', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs mt-1">
                      {['none', 'sm', 'md', 'lg', 'full'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Card Style</label>
                    <select value={template.theme.layout.cardStyle} onChange={e => onGlobalSettingsChange?.('layout.cardStyle', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs mt-1">
                      {['flat', 'bordered', 'shadow', 'glass'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Spacing</label>
                    <select value={template.theme.layout.spacing} onChange={e => onGlobalSettingsChange?.('layout.spacing', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs mt-1">
                      {['compact', 'comfortable', 'spacious'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Product Image Ratio</label>
                    <select value={template.theme.layout.productImageRatio} onChange={e => onGlobalSettingsChange?.('layout.productImageRatio', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs mt-1">
                      {['1:1', '3:4', '4:3', '16:9', 'natural'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Effects */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Effects</p>
                <div className="space-y-2">
                  {Object.entries(template.theme.effects).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer py-1">
                      <div
                        onClick={() => onGlobalSettingsChange?.(`effects.${key}`, !val)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          val ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-black/40 border-white/10'
                        }`}
                      >
                        {val && (
                          <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                        )}
                      </div>
                      <span className="text-xs text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No selection */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto text-gray-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
              </svg>
              <p className="text-xs text-gray-400">Select a section to edit its settings</p>
              <p className="text-[10px] text-gray-600 mt-1">or use Theme Settings for global design tokens</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Section Modal ── */}
      {showAddSection && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowAddSection(false)}>
          <div className="bg-[#0d0d0d] rounded-xl border border-white/10 p-6 max-w-lg w-full max-h-[70vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Add Section</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Choose a section to add to your {PAGE_LABELS[activePage].label} page</p>
              </div>
              <button onClick={() => setShowAddSection(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {availableDefs.map(def => (
                <button
                  key={def.type}
                  onClick={() => addSection(def)}
                  className="text-left p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20 transition-all"
                >
                  <p className="text-xs font-semibold text-white capitalize">{def.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{def.description}</p>
                  <span className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded text-gray-500 mt-2 inline-block">
                    {def.settings.length} settings
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
