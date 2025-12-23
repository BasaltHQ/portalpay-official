// Centralized unit conversion engine for inventory/menu usage tracking
// Supports mass, volume (US customary), volume (metric), and count units

export type UnitKind = 'mass' | 'volume_us' | 'volume_metric' | 'count';

export interface UnitDef {
  key: string;          // normalized unit key, e.g., 'lb', 'oz', 'gal', 'l', 'ml', 'each'
  aliases: string[];    // alternative spellings
  kind: UnitKind;       // unit family
  toBase: number;       // multiplier to convert this unit to its base unit for the kind
}

// Base units by kind:
// - mass: ounce (oz) as base (common in kitchens)
// - volume_us: fluid ounce (fl_oz) as base
// - volume_metric: milliliter (ml) as base
// - count: each as base

const UNIT_DEFS: UnitDef[] = [
  // count
  { key: 'each', aliases: ['ea', 'unit', 'units', 'count', 'piece', 'pc', 'pcs', 'can', 'cans', 'bottle', 'bottles', 'bag', 'bags', 'pack', 'package', 'packages', 'slice', 'slices', 'clove', 'cloves', 'bunch', 'bunches', 'head', 'heads', 'stick', 'sticks'], kind: 'count', toBase: 1 },

  // mass
  { key: 'oz', aliases: ['ounce', 'ounces', 'oz.'], kind: 'mass', toBase: 1 },
  { key: 'lb', aliases: ['pound', 'pounds', 'lbs'], kind: 'mass', toBase: 16 }, // 1 lb = 16 oz
  { key: 'g', aliases: ['gram', 'grams'], kind: 'mass', toBase: 0.0352739619 }, // 1 g = 0.0352739619 oz
  { key: 'kg', aliases: ['kilogram', 'kilograms', 'kgs'], kind: 'mass', toBase: 35.2739619 }, // 1 kg = 35.2739619 oz
  { key: 'mg', aliases: ['milligram', 'milligrams'], kind: 'mass', toBase: 0.0000352739619 }, // 1 mg = 3.52739619e-5 oz

  // volume (US customary) - base: fl_oz
  { key: 'fl_oz', aliases: ['floz', 'fl-oz', 'fl oz', 'fluid_ounce', 'fluid ounce', 'fluid ounces'], kind: 'volume_us', toBase: 1 },
  { key: 'tsp', aliases: ['teaspoon', 'teaspoons', 'tsp.'], kind: 'volume_us', toBase: 1/6 }, // 1 fl oz = 6 tsp
  { key: 'tbsp', aliases: ['tablespoon', 'tablespoons', 'tbsp.', 'tbs'], kind: 'volume_us', toBase: 0.5 }, // 1 fl oz = 2 tbsp
  { key: 'cup', aliases: ['cups', 'c'], kind: 'volume_us', toBase: 8 }, // 1 cup = 8 fl oz
  { key: 'pt', aliases: ['pint', 'pints', 'pt.'], kind: 'volume_us', toBase: 16 }, // 1 pt = 16 fl oz
  { key: 'qt', aliases: ['quart', 'quarts', 'qt.'], kind: 'volume_us', toBase: 32 }, // 1 qt = 32 fl oz
  { key: 'gal', aliases: ['gallon', 'gallons', 'gal.'], kind: 'volume_us', toBase: 128 }, // 1 gal = 128 fl oz
  // Small US measures (approximate)
  { key: 'dash', aliases: ['dashes'], kind: 'volume_us', toBase: (1/8) * (1/6) }, // 1 dash = 1/8 tsp
  { key: 'pinch', aliases: ['pinches'], kind: 'volume_us', toBase: (1/16) * (1/6) }, // 1 pinch = 1/16 tsp
  { key: 'smidgen', aliases: ['smidgens', 'smidge', 'smidges'], kind: 'volume_us', toBase: (1/32) * (1/6) }, // 1 smidgen = 1/32 tsp
  { key: 'drop', aliases: ['drops'], kind: 'volume_us', toBase: 0.001724 }, // ~1 drop ≈ 0.001724 fl oz (≈0.051 ml)
  // Bar measures
  { key: 'shot', aliases: ['shots'], kind: 'volume_us', toBase: 1.5 }, // 1 shot = 1.5 fl oz
  { key: 'jigger', aliases: ['jiggers'], kind: 'volume_us', toBase: 1.5 }, // 1 jigger = 1.5 fl oz
  { key: 'pony', aliases: ['ponies'], kind: 'volume_us', toBase: 1 }, // 1 pony = 1 fl oz
  { key: 'gill', aliases: ['gills'], kind: 'volume_us', toBase: 4 }, // US gill = 4 fl oz

  // volume (metric) - base: ml
  { key: 'ml', aliases: ['milliliter', 'milliliters', 'millilitre', 'millilitres', 'cc'], kind: 'volume_metric', toBase: 1 },
  { key: 'l', aliases: ['liter', 'liters', 'litre', 'litres'], kind: 'volume_metric', toBase: 1000 }, // 1 L = 1000 ml
  { key: 'cl', aliases: ['centiliter', 'centiliters', 'centilitre', 'centilitres'], kind: 'volume_metric', toBase: 10 }, // 1 cL = 10 ml
  { key: 'dl', aliases: ['deciliter', 'deciliters', 'decilitre', 'decilitres'], kind: 'volume_metric', toBase: 100 }, // 1 dL = 100 ml
];

const LOOKUP = (() => {
  const map = new Map<string, UnitDef>();
  for (const def of UNIT_DEFS) {
    map.set(def.key, def);
    for (const a of def.aliases) map.set(a.toLowerCase(), def);
  }
  return map;
})();

export function normalizeUnit(unitRaw: string | null | undefined): string {
  if (!unitRaw) return 'each';
  const u = String(unitRaw).trim();
  const key = LOOKUP.get(u.toLowerCase())?.key;
  if (key) return key;
  // Special case: plain 'oz' may be mass; we accept it as mass base
  return u.toLowerCase();
}

export function getUnitDef(unit: string): UnitDef | undefined {
  const n = normalizeUnit(unit);
  return LOOKUP.get(n) || LOOKUP.get(n.toLowerCase());
}

export function areCompatible(unitA: string, unitB: string): boolean {
  const a = getUnitDef(unitA);
  const b = getUnitDef(unitB);
  if (!a || !b) return String(normalizeUnit(unitA)) === String(normalizeUnit(unitB));
  return a.kind === b.kind;
}

export function baseUnitFor(unit: string): string {
  const def = getUnitDef(unit);
  if (!def) return normalizeUnit(unit);
  switch (def.kind) {
    case 'mass': return 'oz';
    case 'volume_us': return 'fl_oz';
    case 'volume_metric': return 'ml';
    case 'count': default: return 'each';
  }
}

// Convert a quantity from `fromUnit` to `toUnit`.
// If units are incompatible or unknown, returns the original quantity.
export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  if (!Number.isFinite(quantity)) return 0;
  const f = getUnitDef(fromUnit);
  const t = getUnitDef(toUnit);
  if (!f || !t) return quantity;
  if (f.kind === t.kind) {
    // Same family: convert via base
    const qtyInBase = quantity * f.toBase;
    return qtyInBase / t.toBase;
  }
  // Cross-family support: allow gal <-> l bridging (US volume <-> metric volume) using 1 gal = 3.785411784 L
  // Use base units fl_oz <-> ml: 1 fl_oz = 29.5735295625 ml
  const VOLUME_FL_OZ_TO_ML = 29.5735295625;
  if (f.kind === 'volume_us' && t.kind === 'volume_metric') {
    const qtyFlOz = quantity * f.toBase; // to fl_oz
    const qtyMl = qtyFlOz * VOLUME_FL_OZ_TO_ML; // to ml base
    return qtyMl / t.toBase;
  }
  if (f.kind === 'volume_metric' && t.kind === 'volume_us') {
    const qtyMl = quantity * f.toBase; // to ml
    const qtyFlOz = qtyMl / VOLUME_FL_OZ_TO_ML; // to fl_oz base
    return qtyFlOz / t.toBase;
  }
  // Otherwise, incompatible (e.g., mass <-> volume); return original
  return quantity;
}

// Normalize a quantity and unit to the inventory item’s base unit family
export function normalizeToInventoryBase(quantity: number, menuUnit: string, inventoryUnit: string): { quantity: number; unit: string } {
  const invBase = baseUnitFor(inventoryUnit);
  const qtyInInvBase = convertQuantity(quantity, menuUnit, invBase);
  return { quantity: qtyInInvBase, unit: invBase };
}

export function listCompatibleUnits(unit: string): string[] {
  const def = getUnitDef(unit);
  if (!def) return [normalizeUnit(unit)];
  return UNIT_DEFS.filter(u => u.kind === def.kind).map(u => u.key);
}

export function describeUnit(unit: string): string {
  const def = getUnitDef(unit);
  if (!def) return normalizeUnit(unit);
  return def.key;
}


