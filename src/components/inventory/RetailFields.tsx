"use client";

import React from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { RETAIL_VARIATION_PRESETS } from "@/lib/industry-packs";

export interface VariationGroup {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  required: boolean;
  values: string[];
}

export interface Variant {
  sku: string;
  attributes: Record<string, string>;
  stockQty: number;
  priceAdjustment: number;
}

interface RetailFieldsProps {
  baseSku: string;
  variationGroups: VariationGroup[];
  setVariationGroups: (groups: VariationGroup[]) => void;
  variants: Variant[];
  setVariants: (variants: Variant[]) => void;
}

export function RetailFields({
  baseSku,
  variationGroups,
  setVariationGroups,
  variants,
  setVariants,
}: RetailFieldsProps) {
  function addPresetVariation(presetKey: string) {
    const preset = RETAIL_VARIATION_PRESETS[presetKey as keyof typeof RETAIL_VARIATION_PRESETS];
    if (!preset) return;

    const newGroup: VariationGroup = {
      id: `vg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: preset.name,
      type: 'preset',
      required: true,
      values: [...preset.values],
    };
    setVariationGroups([...variationGroups, newGroup]);
  }

  function addCustomVariation() {
    const newGroup: VariationGroup = {
      id: `vg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: "",
      type: 'custom',
      required: false,
      values: [],
    };
    setVariationGroups([...variationGroups, newGroup]);
  }

  function removeVariationGroup(groupId: string) {
    setVariationGroups(variationGroups.filter((g) => g.id !== groupId));
  }

  function updateVariationGroup(groupId: string, updates: Partial<VariationGroup>) {
    setVariationGroups(
      variationGroups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      )
    );
  }

  function addValueToGroup(groupId: string, value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    setVariationGroups(
      variationGroups.map((g) =>
        g.id === groupId && !g.values.includes(trimmed)
          ? { ...g, values: [...g.values, trimmed] }
          : g
      )
    );
  }

  function removeValueFromGroup(groupId: string, value: string) {
    setVariationGroups(
      variationGroups.map((g) =>
        g.id === groupId
          ? { ...g, values: g.values.filter((v) => v !== value) }
          : g
      )
    );
  }

  function generateVariants() {
    if (variationGroups.length === 0) return;

    // Generate all combinations
    const combinations: Array<Record<string, string>> = [{}];
    
    for (const group of variationGroups) {
      if (group.values.length === 0) continue;
      
      const newCombinations: Array<Record<string, string>> = [];
      for (const combo of combinations) {
        for (const value of group.values) {
          newCombinations.push({
            ...combo,
            [group.name]: value,
          });
        }
      }
      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    // Create variants from combinations
    const newVariants: Variant[] = combinations.map((attrs) => {
      // Generate SKU from base SKU + attributes
      const attrSuffix = Object.values(attrs)
        .map((v) => v.slice(0, 3).toUpperCase())
        .join("-");
      const sku = `${baseSku}-${attrSuffix}`;

      return {
        sku,
        attributes: attrs,
        stockQty: 0,
        priceAdjustment: 0,
      };
    });

    setVariants(newVariants);
  }

  function updateVariant(index: number, updates: Partial<Variant>) {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, ...updates } : v))
    );
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  return (
    <div className="md:col-span-2 rounded-md border p-3 space-y-4">
      <div className="text-sm font-medium">Retail-Specific Fields</div>

      {/* Variation Groups */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="microtext text-muted-foreground">Variation Groups</label>
          <button
            type="button"
            onClick={addCustomVariation}
            className="px-2 py-1 rounded-md border text-xs flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add Custom
          </button>
        </div>

        {/* Preset buttons */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {Object.keys(RETAIL_VARIATION_PRESETS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => addPresetVariation(key)}
              className="px-2 py-1 rounded-md border text-xs"
            >
              + {RETAIL_VARIATION_PRESETS[key as keyof typeof RETAIL_VARIATION_PRESETS].name}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {variationGroups.map((group) => (
            <div key={group.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  className="flex-1 h-8 px-2 py-1 border rounded-md bg-background text-sm"
                  placeholder="Variation name (e.g., Size)"
                  value={group.name}
                  onChange={(e) =>
                    updateVariationGroup(group.id, { name: e.target.value })
                  }
                  disabled={group.type === 'preset'}
                />
                <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={group.required}
                    onChange={(e) =>
                      updateVariationGroup(group.id, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => removeVariationGroup(group.id)}
                  className="h-8 px-2 rounded-md border text-xs"
                  title="Remove group"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Values */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className="flex-1 h-7 px-2 py-1 border rounded-md bg-background text-xs"
                    placeholder="Add value (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        addValueToGroup(group.id, input.value);
                        input.value = "";
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.values.map((value) => (
                    <span
                      key={value}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs"
                    >
                      {value}
                      <button
                        type="button"
                        onClick={() => removeValueFromGroup(group.id, value)}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {group.values.length === 0 && (
                    <div className="text-xs text-muted-foreground">
                      No values yet. Type and press Enter to add.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {variationGroups.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No variation groups yet. Click preset buttons or "Add Custom".
            </div>
          )}
        </div>
      </div>

      {/* Generate Variants Button */}
      {variationGroups.length > 0 && (
        <div>
          <button
            type="button"
            onClick={generateVariants}
            className="w-full px-3 py-2 rounded-md border text-sm flex items-center justify-center gap-2"
          >
            <Wand2 className="h-4 w-4" /> Generate Variants
          </button>
          <div className="microtext text-muted-foreground mt-1">
            Creates all combinations from variation groups. Base SKU: {baseSku || "(not set)"}
          </div>
        </div>
      )}

      {/* Variants Grid */}
      {variants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="microtext text-muted-foreground">
              Generated Variants ({variants.length})
            </label>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {variants.map((variant, index) => (
              <div key={index} className="rounded-md border p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                  <div>
                    <div className="text-xs font-mono">{variant.sku}</div>
                    <div className="text-xs text-muted-foreground">
                      {Object.entries(variant.attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" • ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      className="w-20 h-7 px-2 py-1 border rounded-md bg-background text-xs"
                      placeholder="Stock"
                      value={variant.stockQty}
                      onChange={(e) =>
                        updateVariant(index, {
                          stockQty: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                    />
                    <input
                      type="number"
                      step={0.01}
                      className="w-24 h-7 px-2 py-1 border rounded-md bg-background text-xs"
                      placeholder="Price ±"
                      value={variant.priceAdjustment}
                      onChange={(e) =>
                        updateVariant(index, {
                          priceAdjustment: Number(e.target.value || 0),
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="h-7 px-2 rounded-md border text-xs"
                      title="Remove variant"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
