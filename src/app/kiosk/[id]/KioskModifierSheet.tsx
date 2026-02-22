"use client";

import React, { useState, useMemo, useCallback } from "react";
import { X, Plus, Minus, ChevronRight, AlertCircle, Check, MessageSquare } from "lucide-react";
import type { InventoryItem, RestaurantModifierGroup, RestaurantModifier, SelectedModifier } from "@/types/inventory";

// ──────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────

export interface ModifierSelectionState {
    /** groupId → array of selected modifier IDs */
    selections: Record<string, string[]>;
    /** groupId + modifierId → quantity (for quantity-type groups) */
    quantities: Record<string, number>;
    specialInstructions: string;
}

export interface ModifierSheetResult {
    selectedModifiers: SelectedModifier[];
    specialInstructions: string;
    /** Final base price + all modifier adjustments */
    modifierTotal: number;
}

interface Props {
    item: InventoryItem;
    modifierGroups: RestaurantModifierGroup[];
    basePrice: number;
    primaryColor: string;
    secondaryColor: string;
    colorMode: "dark" | "light";
    onAdd: (qty: number, result: ModifierSheetResult) => void;
    onClose: () => void;
}

// ──────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────

function groupKey(groupId: string, modifierId: string) {
    return `${groupId}::${modifierId}`;
}

function isGroupSatisfied(group: RestaurantModifierGroup, selections: Record<string, string[]>): boolean {
    if (!group.required) return true;
    const sel = selections[group.id] || [];
    const min = group.minSelect ?? 1;
    return sel.length >= min;
}

function calcModifierTotal(
    groups: RestaurantModifierGroup[],
    selections: Record<string, string[]>,
    quantities: Record<string, number>
): number {
    let total = 0;
    for (const group of groups) {
        const sel = selections[group.id] || [];
        if (group.selectionType === "quantity") {
            for (const modId of sel) {
                const mod = group.modifiers.find(m => m.id === modId);
                if (mod) {
                    const qty = quantities[groupKey(group.id, modId)] || 1;
                    total += mod.priceAdjustment * qty;
                }
            }
        } else {
            for (const modId of sel) {
                const mod = group.modifiers.find(m => m.id === modId);
                if (mod) total += mod.priceAdjustment;
            }
        }
    }
    return total;
}

function buildSelectedModifiers(
    groups: RestaurantModifierGroup[],
    selections: Record<string, string[]>,
    quantities: Record<string, number>
): SelectedModifier[] {
    const result: SelectedModifier[] = [];
    for (const group of groups) {
        const sel = selections[group.id] || [];
        for (const modId of sel) {
            const mod = group.modifiers.find(m => m.id === modId);
            if (!mod) continue;
            const qty = group.selectionType === "quantity" ? (quantities[groupKey(group.id, modId)] || 1) : undefined;
            result.push({
                groupId: group.id,
                modifierId: mod.id,
                name: mod.name,
                priceAdjustment: mod.priceAdjustment,
                quantity: qty,
            });
        }
    }
    return result;
}

// ──────────────────────────────────────────────────────────────────
// MODIFIER SHEET COMPONENT
// ──────────────────────────────────────────────────────────────────

export default function KioskModifierSheet({ item, modifierGroups, basePrice, primaryColor, secondaryColor, colorMode, onAdd, onClose }: Props) {
    const isDark = colorMode === "dark";

    // Initialise defaults (pre-select default modifiers)
    const initSelections = useMemo(() => {
        const s: Record<string, string[]> = {};
        for (const group of modifierGroups) {
            const defaults = group.modifiers.filter(m => m.default && m.available !== false).map(m => m.id);
            if (defaults.length) s[group.id] = defaults;
        }
        return s;
    }, [modifierGroups]);

    const [selections, setSelections] = useState<Record<string, string[]>>(initSelections);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [qty, setQty] = useState(1);
    const [showInstructions, setShowInstructions] = useState(false);

    const modifierDelta = useMemo(() => calcModifierTotal(modifierGroups, selections, quantities), [modifierGroups, selections, quantities]);
    const unitPrice = basePrice + modifierDelta;
    const totalPrice = unitPrice * qty;

    const allRequiredSatisfied = useMemo(() =>
        modifierGroups.every(g => isGroupSatisfied(g, selections)),
        [modifierGroups, selections]
    );

    const toggleModifier = useCallback((group: RestaurantModifierGroup, mod: RestaurantModifier) => {
        setSelections(prev => {
            const cur = prev[group.id] || [];
            const isSelected = cur.includes(mod.id);

            if (group.selectionType === "single" || (!group.selectionType && group.maxSelect === 1 && group.maxSelect > 0)) {
                return { ...prev, [group.id]: isSelected ? [] : [mod.id] };
            }

            if (isSelected) {
                return { ...prev, [group.id]: cur.filter(id => id !== mod.id) };
            }

            // Check max
            const max = group.maxSelect;
            if (max !== undefined && max > 0 && cur.length >= max) return prev;
            return { ...prev, [group.id]: [...cur, mod.id] };
        });
    }, []);

    const adjustQuantity = useCallback((group: RestaurantModifierGroup, mod: RestaurantModifier, delta: number) => {
        const key = groupKey(group.id, mod.id);
        setQuantities(prev => {
            const cur = prev[key] || 1;
            const next = Math.max(0, cur + delta);
            const newQ = { ...prev, [key]: next };
            // If quantity goes to 0, remove from selections
            if (next === 0) {
                setSelections(s => ({ ...s, [group.id]: (s[group.id] || []).filter(id => id !== mod.id) }));
            } else if (!(selections[group.id] || []).includes(mod.id)) {
                setSelections(s => ({ ...s, [group.id]: [...(s[group.id] || []), mod.id] }));
            }
            return newQ;
        });
    }, [selections]);

    const handleAdd = useCallback(() => {
        if (!allRequiredSatisfied) return;
        onAdd(qty, {
            selectedModifiers: buildSelectedModifiers(modifierGroups, selections, quantities),
            specialInstructions,
            modifierTotal: modifierDelta,
        });
    }, [allRequiredSatisfied, qty, modifierGroups, selections, quantities, specialInstructions, modifierDelta, onAdd]);

    const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

    // Styles
    const bgOverlay = isDark ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.5)";
    const sheetBg = isDark ? "#111113" : "#ffffff";
    const headerBg = isDark ? "#18181c" : "#f8f9fa";
    const borderCol = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)";
    const textPrimary = isDark ? "#f4f4f5" : "#111827";
    const textMuted = isDark ? "rgba(161,161,170,0.8)" : "#6b7280";
    const surfaceBg = isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6";
    const selectedBg = `${primaryColor}22`;
    const selectedBorder = primaryColor;
    const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: bgOverlay, backdropFilter: "blur(4px)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300"
                style={{ background: sheetBg, maxHeight: "85vh" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-start gap-4 p-5" style={{ background: headerBg, borderBottom: `1px solid ${borderCol}` }}>
                    {item.images?.[0] && (
                        <img src={item.images[0]} alt={item.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-md" />
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold leading-tight" style={{ color: textPrimary }}>{item.name}</h2>
                        {item.description && (
                            <p className="text-sm mt-1 line-clamp-2" style={{ color: textMuted }}>{item.description}</p>
                        )}
                        <div className="mt-2 font-bold text-lg" style={{ color: primaryColor }}>{fmt(basePrice)}</div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors" style={{ background: surfaceBg, color: textMuted }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Modifier groups — scrollable */}
                <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
                    {modifierGroups.length === 0 && (
                        <div className="px-5 py-5 space-y-3">
                            {item.description && (
                                <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{item.description}</p>
                            )}
                            {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-[11px] px-2 py-1 rounded-full font-medium"
                                            style={{ background: `${primaryColor}15`, color: primaryColor }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {!item.description && (!item.tags || item.tags.length === 0) && (
                                <p className="text-sm italic" style={{ color: textMuted }}>
                                    Tap &ldquo;Add to Order&rdquo; to add this item to your cart.
                                </p>
                            )}
                        </div>
                    )}
                    {modifierGroups
                        .slice()
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                        .map(group => {
                            const groupSel = selections[group.id] || [];
                            const isSingle = group.selectionType === "single" || (!group.selectionType && group.maxSelect === 1);
                            const isQuantityType = group.selectionType === "quantity";
                            const satisfied = isGroupSatisfied(group, selections);

                            return (
                                <div key={group.id} className="border-b last:border-b-0" style={{ borderColor: borderCol }}>
                                    {/* Group header */}
                                    <div className="flex items-center justify-between px-5 py-3" style={{ background: surfaceBg }}>
                                        <div>
                                            <span className="font-semibold text-sm" style={{ color: textPrimary }}>{group.name}</span>
                                            {group.required && (
                                                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                    style={{ background: satisfied ? `${primaryColor}20` : "rgba(239,68,68,0.15)", color: satisfied ? primaryColor : "#ef4444" }}>
                                                    {satisfied ? <><Check size={9} className="inline mr-0.5" />DONE</> : "REQUIRED"}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px]" style={{ color: textMuted }}>
                                            {isSingle ? "Choose 1" :
                                                group.maxSelect ? `Up to ${group.maxSelect}` :
                                                    group.minSelect ? `Min ${group.minSelect}` : "Optional"}
                                        </span>
                                    </div>

                                    {/* Modifiers */}
                                    <div className="px-4 py-2 space-y-1">
                                        {group.modifiers
                                            .slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                                            .filter(m => m.available !== false)
                                            .map(mod => {
                                                const isSelected = groupSel.includes(mod.id);
                                                const modQty = quantities[groupKey(group.id, mod.id)] || 1;
                                                const isMaxed = !isSelected && group.maxSelect !== undefined && group.maxSelect > 0 && groupSel.length >= group.maxSelect;

                                                return (
                                                    <div key={mod.id}
                                                        className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all cursor-pointer select-none"
                                                        style={{
                                                            background: isSelected ? selectedBg : "transparent",
                                                            border: `1.5px solid ${isSelected ? selectedBorder : "transparent"}`,
                                                            opacity: isMaxed ? 0.45 : 1,
                                                        }}
                                                        onClick={() => !isMaxed && !isQuantityType && toggleModifier(group, mod)}
                                                    >
                                                        {/* Selector indicator */}
                                                        {!isQuantityType && (
                                                            <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-2 transition-all ${isSingle ? 'rounded-full' : 'rounded'}`}
                                                                style={{
                                                                    borderColor: isSelected ? primaryColor : borderCol,
                                                                    background: isSelected ? primaryColor : "transparent",
                                                                }}>
                                                                {isSelected && <Check size={11} color="#fff" strokeWidth={3} />}
                                                            </div>
                                                        )}

                                                        <span className="flex-1 text-sm font-medium" style={{ color: textPrimary }}>{mod.name}</span>

                                                        {/* Quantity stepper */}
                                                        {isQuantityType && isSelected && (
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={e => { e.stopPropagation(); adjustQuantity(group, mod, -1); }}
                                                                    className="w-7 h-7 rounded-full flex items-center justify-center border transition-colors"
                                                                    style={{ borderColor: borderCol, color: textMuted }}>
                                                                    <Minus size={12} />
                                                                </button>
                                                                <span className="w-5 text-center text-sm font-bold" style={{ color: textPrimary }}>{modQty}</span>
                                                                <button onClick={e => { e.stopPropagation(); adjustQuantity(group, mod, 1); }}
                                                                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors text-white"
                                                                    style={{ background: primaryColor }}>
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {isQuantityType && !isSelected && (
                                                            <button onClick={e => { e.stopPropagation(); adjustQuantity(group, mod, 1); }}
                                                                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors text-white"
                                                                style={{ background: primaryColor }}>
                                                                <Plus size={12} />
                                                            </button>
                                                        )}

                                                        {/* Price */}
                                                        {mod.priceAdjustment !== 0 && (
                                                            <span className="text-sm font-semibold flex-shrink-0"
                                                                style={{ color: mod.priceAdjustment > 0 ? primaryColor : "#22c55e" }}>
                                                                {mod.priceAdjustment > 0 ? "+" : ""}{fmt(mod.priceAdjustment)}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            );
                        })}

                    {/* Special Instructions */}
                    <div className="px-5 py-4 border-t" style={{ borderColor: borderCol }}>
                        <button onClick={() => setShowInstructions(v => !v)}
                            className="flex items-center gap-2 text-sm font-medium w-full text-left transition-colors"
                            style={{ color: showInstructions ? primaryColor : textMuted }}>
                            <MessageSquare size={15} />
                            Special Instructions
                            <ChevronRight size={14} className={`ml-auto transition-transform ${showInstructions ? "rotate-90" : ""}`} />
                        </button>
                        {showInstructions && (
                            <textarea
                                placeholder="e.g. No onions, extra napkins..."
                                value={specialInstructions}
                                onChange={e => setSpecialInstructions(e.target.value)}
                                rows={3}
                                className="mt-3 w-full text-sm rounded-xl px-3 py-2.5 resize-none outline-none border transition-all"
                                style={{ background: inputBg, color: textPrimary, borderColor: borderCol }}
                            />
                        )}
                    </div>
                </div>

                {/* Footer: qty + add button */}
                <div className="flex-shrink-0 p-4 flex items-center gap-3" style={{ background: headerBg, borderTop: `1px solid ${borderCol}` }}>
                    {/* Required warning */}
                    {!allRequiredSatisfied && (
                        <div className="flex items-center gap-1.5 text-[11px] text-red-500 flex-1">
                            <AlertCircle size={13} />
                            Make required selections
                        </div>
                    )}

                    {allRequiredSatisfied && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
                                style={{ borderColor: borderCol, color: textMuted }}>
                                <Minus size={16} />
                            </button>
                            <span className="w-6 text-center font-bold text-lg" style={{ color: textPrimary }}>{qty}</span>
                            <button onClick={() => setQty(q => q + 1)}
                                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-white"
                                style={{ background: primaryColor }}>
                                <Plus size={16} />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleAdd}
                        disabled={!allRequiredSatisfied}
                        className="flex-1 h-12 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: allRequiredSatisfied ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` : "#94a3b8" }}
                    >
                        Add to Order · {fmt(totalPrice)}
                    </button>
                </div>
            </div>
        </div>
    );
}
