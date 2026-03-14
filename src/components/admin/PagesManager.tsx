'use client';

/**
 * Pages Manager — Full CMS for creating and managing storefront pages.
 * 
 * Each page has a slug, title, sections, and SEO metadata.
 * Sections can be reordered via drag-and-drop (Phase 4 visual editor),
 * or added/removed here.
 */

import React, { useState } from 'react';
import { getAllSectionDefinitions } from '@/lib/shop-templates/registry';
import type { ShopSectionType, SectionDefinition } from '@/lib/shop-templates/types';
// Self-registering side-effect import
import '@/lib/shop-templates';

interface Page {
  id: string;
  title: string;
  slug: string;
  sections: Array<{
    id: string;
    type: ShopSectionType | string;
    settings: Record<string, any>;
    visible: boolean;
  }>;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
  publishedAt?: string;
}

export default function PagesManager() {
  const [pages, setPages] = useState<Page[]>([
    {
      id: 'home',
      title: 'Home',
      slug: '/',
      sections: [],
      seo: {},
    },
  ]);
  const [activePage, setActivePage] = useState<string>('home');
  const [addingPage, setAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const allSections: SectionDefinition[] = getAllSectionDefinitions();

  const currentPage = pages.find(p => p.id === activePage);

  const addPage = () => {
    if (!newPageTitle.trim()) return;
    const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newPage: Page = {
      id: `page-${Date.now()}`,
      title: newPageTitle,
      slug: `/${slug}`,
      sections: [],
      seo: {},
    };
    setPages(prev => [...prev, newPage]);
    setActivePage(newPage.id);
    setNewPageTitle('');
    setAddingPage(false);
  };

  const deletePage = (id: string) => {
    if (id === 'home') return; // Can't delete home
    setPages(prev => prev.filter(p => p.id !== id));
    if (activePage === id) setActivePage('home');
  };

  const addSectionToPage = (sectionType: ShopSectionType) => {
    if (!currentPage) return;
    const sectionDef = allSections.find((s: SectionDefinition) => s.type === sectionType);
    if (!sectionDef) return;

    // Build default settings from schema
    const defaults: Record<string, any> = {};
    for (const setting of sectionDef.settings) {
      defaults[setting.key] = setting.default;
    }

    setPages(prev => prev.map(p => {
      if (p.id !== activePage) return p;
      return {
        ...p,
        sections: [...p.sections, {
          id: `${sectionType}-${Date.now()}`,
          type: sectionType,
          settings: defaults,
          visible: true,
        }],
      };
    }));
  };

  const removeSection = (sectionId: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePage) return p;
      return { ...p, sections: p.sections.filter(s => s.id !== sectionId) };
    }));
  };

  const toggleSectionVisibility = (sectionId: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePage) return p;
      return {
        ...p,
        sections: p.sections.map(s =>
          s.id === sectionId ? { ...s, visible: !s.visible } : s
        ),
      };
    }));
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setPages(prev => prev.map(p => {
      if (p.id !== activePage) return p;
      const idx = p.sections.findIndex(s => s.id === sectionId);
      if (idx < 0) return p;
      if (direction === 'up' && idx === 0) return p;
      if (direction === 'down' && idx === p.sections.length - 1) return p;
      const newSections = [...p.sections];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
      return { ...p, sections: newSections };
    }));
  };

  const [showSectionPicker, setShowSectionPicker] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Pages</h3>
        <button
          onClick={() => setAddingPage(true)}
          className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors"
        >
          + New Page
        </button>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 flex-wrap">
        {pages.map(page => (
          <div key={page.id} className="flex items-center gap-0.5">
            <button
              onClick={() => setActivePage(page.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activePage === page.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {page.title}
            </button>
            {page.id !== 'home' && (
              <button
                onClick={() => deletePage(page.id)}
                className="text-gray-500 hover:text-red-400 text-[10px] px-1"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add page form */}
      {addingPage && (
        <div className="flex gap-2 items-center bg-black/20 p-2 rounded">
          <input
            type="text"
            value={newPageTitle}
            onChange={e => setNewPageTitle(e.target.value)}
            placeholder="Page title (e.g., About Us)"
            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs"
            onKeyDown={e => e.key === 'Enter' && addPage()}
            autoFocus
          />
          <button onClick={addPage} className="text-xs text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded">Add</button>
          <button onClick={() => setAddingPage(false)} className="text-xs text-gray-400 px-2">Cancel</button>
        </div>
      )}

      {/* Active page content */}
      {currentPage && (
        <div className="space-y-3">
          {/* SEO */}
          <div className="bg-black/20 rounded p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">SEO Settings</p>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                placeholder="Page title (SEO)"
                value={currentPage.seo?.title || ''}
                onChange={e => {
                  setPages(prev => prev.map(p =>
                    p.id !== activePage ? p : { ...p, seo: { ...p.seo, title: e.target.value } }
                  ));
                }}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs"
              />
              <input
                type="text"
                placeholder="Meta description"
                value={currentPage.seo?.description || ''}
                onChange={e => {
                  setPages(prev => prev.map(p =>
                    p.id !== activePage ? p : { ...p, seo: { ...p.seo, description: e.target.value } }
                  ));
                }}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>

          {/* Sections list */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Sections ({currentPage.sections.length})</p>
              <button
                onClick={() => setShowSectionPicker(!showSectionPicker)}
                className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-300 rounded hover:bg-white/10 transition-colors"
              >
                + Add Section
              </button>
            </div>

            {currentPage.sections.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-xs border border-dashed border-white/10 rounded">
                No sections yet. Click "+ Add Section" to get started.
              </div>
            )}

            {currentPage.sections.map((section, idx) => (
              <div
                key={section.id}
                className={`flex items-center gap-2 p-2 rounded border transition-all ${
                  section.visible
                    ? 'bg-white/5 border-white/10'
                    : 'bg-black/20 border-white/5 opacity-50'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={idx === 0}
                    className="text-[10px] text-gray-500 hover:text-white disabled:opacity-20"
                  >▲</button>
                  <button
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={idx === currentPage.sections.length - 1}
                    className="text-[10px] text-gray-500 hover:text-white disabled:opacity-20"
                  >▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate capitalize">
                    {section.type.replace(/-/g, ' ')}
                  </p>
                  <p className="text-[9px] text-gray-500">{section.id}</p>
                </div>
                <button
                  onClick={() => toggleSectionVisibility(section.id)}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    section.visible ? 'text-emerald-400' : 'text-gray-500'
                  }`}
                >
                  {section.visible ? '●' : '○'}
                </button>
                <button
                  onClick={() => removeSection(section.id)}
                  className="text-[10px] text-red-400 hover:text-red-300 px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Section picker */}
          {showSectionPicker && (
            <div className="bg-black/30 rounded-lg border border-white/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Choose a section to add</p>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {allSections.map((section: SectionDefinition) => (
                  <button
                    key={section.type}
                    onClick={() => {
                      addSectionToPage(section.type as ShopSectionType);
                      setShowSectionPicker(false);
                    }}
                    className="text-left p-2 rounded border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all"
                  >
                    <span className="text-xs mr-1">{section.icon || '■'}</span>
                    <span className="text-[10px] font-medium text-gray-300">{section.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
