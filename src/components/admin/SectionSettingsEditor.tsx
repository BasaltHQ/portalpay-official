'use client';

/**
 * SectionSettingsEditor — Schema-driven form renderer for section settings.
 *
 * Given a SectionSettingSchema[] from any SectionDefinition, this component
 * renders the appropriate form controls (text, textarea, select, range,
 * color, checkbox, image, url, number) and calls onChange for each mutation.
 *
 * This is the engine behind no-code template customization — every section's
 * settings can be edited without writing a line of code.
 */

import React from 'react';
import type { SectionSettingSchema } from '@/lib/shop-templates/types';

interface SectionSettingsEditorProps {
  schema: SectionSettingSchema[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export default function SectionSettingsEditor({ schema, values, onChange }: SectionSettingsEditorProps) {
  const getVal = (key: string, fallback?: any) => values[key] ?? fallback;

  return (
    <div className="space-y-4">
      {schema.map(field => (
        <div key={field.key} className="space-y-1.5">
          <label className="text-xs font-medium text-gray-300 block">{field.label}</label>

          {/* TEXT */}
          {field.type === 'text' && (
            <input
              type="text"
              value={getVal(field.key, field.default || '')}
              onChange={e => onChange(field.key, e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/25 focus:outline-none transition-colors"
              placeholder={typeof field.default === 'string' ? field.default : ''}
            />
          )}

          {/* TEXTAREA */}
          {field.type === 'textarea' && (
            <textarea
              value={getVal(field.key, field.default || '')}
              onChange={e => onChange(field.key, e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/25 focus:outline-none transition-colors resize-y"
              placeholder={typeof field.default === 'string' ? field.default : ''}
            />
          )}

          {/* RICHTEXT */}
          {field.type === 'richtext' && (
            <textarea
              value={getVal(field.key, field.default || '')}
              onChange={e => onChange(field.key, e.target.value)}
              rows={5}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-white/25 focus:outline-none transition-colors resize-y"
              placeholder="HTML / Markdown content..."
            />
          )}

          {/* NUMBER */}
          {field.type === 'number' && (
            <input
              type="number"
              value={getVal(field.key, field.default ?? 0)}
              onChange={e => onChange(field.key, Number(e.target.value))}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/25 focus:outline-none transition-colors"
            />
          )}

          {/* RANGE */}
          {field.type === 'range' && (
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  value={getVal(field.key, field.default ?? 50)}
                  onChange={e => onChange(field.key, Number(e.target.value))}
                  min={field.min ?? 0}
                  max={field.max ?? 100}
                  step={field.step ?? 1}
                  className="flex-1 accent-emerald-500 h-1.5"
                />
                <span className="text-xs font-mono text-gray-400 w-10 text-right">
                  {getVal(field.key, field.default ?? 50)}
                </span>
              </div>
              {(field.min !== undefined || field.max !== undefined) && (
                <div className="flex justify-between text-[9px] text-gray-600">
                  <span>{field.min ?? 0}</span>
                  <span>{field.max ?? 100}</span>
                </div>
              )}
            </div>
          )}

          {/* COLOR */}
          {field.type === 'color' && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={getVal(field.key, field.default || '#000000')}
                onChange={e => onChange(field.key, e.target.value)}
                className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent p-0.5"
              />
              <input
                type="text"
                value={getVal(field.key, field.default || '#000000')}
                onChange={e => onChange(field.key, e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-white/25 focus:outline-none"
              />
            </div>
          )}

          {/* IMAGE */}
          {field.type === 'image' && (
            <div className="space-y-2">
              {getVal(field.key) && (
                <div className="relative w-full h-24 bg-black/30 rounded-lg overflow-hidden border border-white/10">
                  <img src={getVal(field.key)} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => onChange(field.key, '')}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full text-white text-[10px] flex items-center justify-center hover:bg-red-500/60"
                  >
                    x
                  </button>
                </div>
              )}
              <input
                type="text"
                value={getVal(field.key, '')}
                onChange={e => onChange(field.key, e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/25 focus:outline-none"
                placeholder="Image URL or upload..."
              />
            </div>
          )}

          {/* URL */}
          {field.type === 'url' && (
            <input
              type="url"
              value={getVal(field.key, field.default || '')}
              onChange={e => onChange(field.key, e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/25 focus:outline-none transition-colors"
              placeholder="https://..."
            />
          )}

          {/* SELECT */}
          {field.type === 'select' && (
            <select
              value={getVal(field.key, field.default || '')}
              onChange={e => onChange(field.key, e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/25 focus:outline-none"
            >
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          {/* CHECKBOX */}
          {field.type === 'checkbox' && (
            <label className="flex items-center gap-2.5 cursor-pointer py-1">
              <div
                onClick={() => onChange(field.key, !getVal(field.key, field.default ?? false))}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                  getVal(field.key, field.default ?? false)
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                {getVal(field.key, field.default ?? false) && (
                  <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-300">{field.label}</span>
            </label>
          )}

          {/* COLLECTION / PRODUCT / PAGE (resource pickers) */}
          {(field.type === 'collection' || field.type === 'product' || field.type === 'page') && (
            <div className="flex gap-2">
              <input
                type="text"
                value={getVal(field.key, '')}
                onChange={e => onChange(field.key, e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-white/25 focus:outline-none"
                placeholder={`Select a ${field.type}...`}
              />
              <button className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-400 hover:bg-white/10 transition-colors">
                Browse
              </button>
            </div>
          )}

          {/* Info text */}
          {field.info && (
            <p className="text-[10px] text-gray-500 mt-0.5">{field.info}</p>
          )}
        </div>
      ))}
    </div>
  );
}
