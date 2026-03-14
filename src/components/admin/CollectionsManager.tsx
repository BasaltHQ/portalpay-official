'use client';

/**
 * Collections Manager — Organize products into collections with manual or smart rules.
 * 
 * Supports both:
 * - Manual collections: hand-pick products
 * - Smart collections: auto-populate based on rules (tags, price, vendor, etc.)
 */

import React, { useState } from 'react';

interface CollectionRule {
  field: 'tag' | 'price' | 'vendor' | 'type' | 'name' | 'inventory';
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with';
  value: string;
}

interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  type: 'manual' | 'smart';
  rules?: CollectionRule[];
  rulesMatch?: 'all' | 'any';
  productIds?: string[];
  sortOrder: 'manual' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest' | 'best-selling';
  publishedAt?: string;
  seo?: {
    title?: string;
    description?: string;
  };
}

export default function CollectionsManager() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [showForm, setShowForm] = useState(false);

  const createCollection = () => {
    const newCol: Collection = {
      id: `col-${Date.now()}`,
      title: '',
      slug: '',
      description: '',
      imageUrl: '',
      type: 'manual',
      productIds: [],
      sortOrder: 'manual',
    };
    setEditing(newCol);
    setShowForm(true);
  };

  const saveCollection = () => {
    if (!editing) return;
    const slug = editing.slug || editing.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const toSave = { ...editing, slug };
    setCollections(prev => {
      const idx = prev.findIndex(c => c.id === toSave.id);
      if (idx >= 0) {
        return prev.map(c => c.id === toSave.id ? toSave : c);
      }
      return [...prev, toSave];
    });
    setEditing(null);
    setShowForm(false);
  };

  const deleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const addRule = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      rules: [...(editing.rules || []), { field: 'tag', condition: 'equals', value: '' }],
    });
  };

  const updateRule = (idx: number, patch: Partial<CollectionRule>) => {
    if (!editing?.rules) return;
    setEditing({
      ...editing,
      rules: editing.rules.map((r, i) => i === idx ? { ...r, ...patch } : r),
    });
  };

  const removeRule = (idx: number) => {
    if (!editing?.rules) return;
    setEditing({ ...editing, rules: editing.rules.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Collections</h3>
          <p className="text-[10px] text-gray-400">Group products into browsable categories</p>
        </div>
        <button
          onClick={createCollection}
          className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors"
        >
          + New Collection
        </button>
      </div>

      {/* Collections list */}
      {collections.length === 0 && !showForm && (
        <div className="text-center py-8 border border-dashed border-white/10 rounded-lg">
          <div className="text-2xl mb-2 text-gray-500">□</div>
          <p className="text-xs text-gray-400">No collections yet</p>
          <p className="text-[10px] text-gray-500 mt-1">Collections help customers find what they're looking for</p>
        </div>
      )}

      {!showForm && collections.map(col => (
        <div
          key={col.id}
          className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          onClick={() => { setEditing(col); setShowForm(true); }}
        >
          <div className="w-10 h-10 bg-black/30 rounded flex items-center justify-center text-lg shrink-0">
            {col.type === 'smart' ? '◆' : '■'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{col.title || 'Untitled'}</p>
            <p className="text-[9px] text-gray-500">
              {col.type === 'smart' ? `Smart • ${col.rules?.length || 0} rules` : `Manual • ${col.productIds?.length || 0} products`}
              {' • /'}{col.slug}
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); deleteCollection(col.id); }}
            className="text-red-400 hover:text-red-300 text-xs px-1"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Collection editor */}
      {showForm && editing && (
        <div className="bg-black/20 rounded-lg border border-white/10 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white">
              {collections.find(c => c.id === editing.id) ? 'Edit Collection' : 'New Collection'}
            </h4>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 text-xs">Cancel</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-400">Title</label>
              <input
                type="text"
                value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm"
                placeholder="e.g., Summer Collection"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-400">URL Slug</label>
              <input
                type="text"
                value={editing.slug}
                onChange={e => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm font-mono"
                placeholder="summer-collection"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-400">Description</label>
            <textarea
              value={editing.description}
              onChange={e => setEditing({ ...editing, description: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs h-16 resize-none"
              placeholder="Short description for this collection"
            />
          </div>

          {/* Type selector */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-400">Collection Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing({ ...editing, type: 'manual' })}
                className={`flex-1 p-2 rounded border text-xs font-medium transition-all ${
                  editing.type === 'manual'
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-white/5 text-gray-400 hover:border-white/10'
                }`}
              >
                Manual
                <span className="block text-[9px] text-gray-500 mt-0.5">Hand-pick products</span>
              </button>
              <button
                onClick={() => setEditing({ ...editing, type: 'smart', rules: editing.rules || [] })}
                className={`flex-1 p-2 rounded border text-xs font-medium transition-all ${
                  editing.type === 'smart'
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                    : 'border-white/5 text-gray-400 hover:border-white/10'
                }`}
              >
                Smart
                <span className="block text-[9px] text-gray-500 mt-0.5">Auto-populate by rules</span>
              </button>
            </div>
          </div>

          {/* Smart rules */}
          {editing.type === 'smart' && (
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400">Rules</label>
                  <select
                    value={editing.rulesMatch || 'all'}
                    onChange={e => setEditing({ ...editing, rulesMatch: e.target.value as 'all' | 'any' })}
                    className="bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[10px]"
                  >
                    <option value="all">Match ALL</option>
                    <option value="any">Match ANY</option>
                  </select>
                </div>
                <button onClick={addRule} className="text-[10px] text-emerald-400 px-1">+ Add Rule</button>
              </div>

              {(editing.rules || []).map((rule, idx) => (
                <div key={idx} className="flex gap-1.5 items-center">
                  <select
                    value={rule.field}
                    onChange={e => updateRule(idx, { field: e.target.value as CollectionRule['field'] })}
                    className="bg-black/40 border border-white/10 rounded px-1.5 py-1 text-[10px] w-24"
                  >
                    <option value="tag">Tag</option>
                    <option value="price">Price</option>
                    <option value="vendor">Vendor</option>
                    <option value="type">Type</option>
                    <option value="name">Name</option>
                    <option value="inventory">Inventory</option>
                  </select>
                  <select
                    value={rule.condition}
                    onChange={e => updateRule(idx, { condition: e.target.value as CollectionRule['condition'] })}
                    className="bg-black/40 border border-white/10 rounded px-1.5 py-1 text-[10px] w-24"
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="contains">contains</option>
                    <option value="starts_with">starts with</option>
                    <option value="greater_than">greater than</option>
                    <option value="less_than">less than</option>
                  </select>
                  <input
                    type="text"
                    value={rule.value}
                    onChange={e => updateRule(idx, { value: e.target.value })}
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px]"
                    placeholder="Value"
                  />
                  <button onClick={() => removeRule(idx)} className="text-red-400 text-[10px] px-1">✕</button>
                </div>
              ))}

              {(!editing.rules || editing.rules.length === 0) && (
                <p className="text-[10px] text-gray-500 text-center py-2">No rules — all products will be included</p>
              )}
            </div>
          )}

          {/* Sort order */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-400">Sort Order</label>
            <select
              value={editing.sortOrder}
              onChange={e => setEditing({ ...editing, sortOrder: e.target.value as Collection['sortOrder'] })}
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs"
            >
              <option value="manual">Manual</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="best-selling">Best Selling</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="text-xs text-gray-400 px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={saveCollection}
              className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors font-medium"
            >
              Save Collection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
