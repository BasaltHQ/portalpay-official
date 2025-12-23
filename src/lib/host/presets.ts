import { FloorPreset, TableSpec, DomainSpec } from './types';
import { getAllTableCoordinates } from './floor-mapper';

// Precise coordinate mapping based on reference image
const preciseCoordinates = getAllTableCoordinates();

// Base table definitions with capacities and types
const baseTables: TableSpec[] = [
  // Bar seats (no B15 in the actual floor plan)
  ...['B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11','B12','B13','B14','B16'].map(id => ({ id, capacity: 1, type: 'barSeat' as const })),
  // Standard tables 71,72 and 81..83, 91..92, 61..63, 51..53
  { id: '71', capacity: 4, type: 'table' },
  { id: '72', capacity: 4, type: 'table' },
  { id: '81', capacity: 4, type: 'table' },
  { id: '82', capacity: 4, type: 'table' },
  { id: '83', capacity: 4, type: 'table' },
  { id: '91', capacity: 6, type: 'table' },
  { id: '92', capacity: 6, type: 'table' },
  { id: '61', capacity: 2, type: 'round' },
  { id: '62', capacity: 2, type: 'round' },
  { id: '63', capacity: 2, type: 'round' },
  { id: '51', capacity: 2, type: 'round' },
  { id: '52', capacity: 2, type: 'round' },
  { id: '53', capacity: 2, type: 'round' },
  { id: '24', capacity: 4, type: 'round' },
  { id: '34', capacity: 4, type: 'round' },
  // Patio tables
  ...['P11','P12','P13','P21','P22','P23','P24','P31','P32','P33','P34','P35'].map(id => ({ id, capacity: id.startsWith('P3') ? 4 : 2, type: 'patio' as const })),
  // Wall booths
  { id: '11', capacity: 4, type: 'booth' },
  { id: '12', capacity: 4, type: 'booth' },
  { id: '13', capacity: 4, type: 'booth' },
  { id: '21', capacity: 2, type: 'table' },
  { id: '22', capacity: 2, type: 'table' },
  { id: '23', capacity: 2, type: 'table' },
  { id: '31', capacity: 2, type: 'table' },
  { id: '32', capacity: 2, type: 'table' },
  { id: '33', capacity: 2, type: 'table' },
  { id: '41', capacity: 4, type: 'booth' },
  { id: '42', capacity: 4, type: 'booth' },
  { id: '43', capacity: 6, type: 'booth' },
];

// Apply precise coordinates from floor-mapper
const tables3p2: TableSpec[] = baseTables.map(table => {
  const coord = preciseCoordinates[table.id];
  if (coord) {
    return {
      ...table,
      x: coord.x,
      y: coord.y,
      w: coord.width,
      h: coord.height,
    };
  }
  return table;
});

function mkDomains(mapping: Record<string, string[]>, colors: Record<string, string>): DomainSpec[] {
  return Object.entries(mapping).map(([name, tableIds], idx) => ({
    id: `D${idx + 1}`,
    name,
    color: colors[name] || ['#22c55e','#3b82f6','#a855f7','#f59e0b','#ef4444','#10b981','#6366f1'][idx % 7],
    tableIds,
  }));
}

// Extracted from images: "3 + 2 BAR" etc. These are guiding presets.

export const FLOOR_PRESETS: FloorPreset[] = [
  {
    slug: '3-plus-2-bar',
    name: '3 + 2 Bar',
    description: 'Three main domains plus two bartop coverage',
    width: 1200,
    height: 760,
    tables: tables3p2,
    domains: mkDomains(
      {
        Green: ['31','32','33','41','42','43','51','52','53','91'],
        Blue: ['21','22','23','24','71','72','81','82','83','92'],
        Purple: ['61','62','63','24','34'],
        PatioA: ['P31','P32','P33','P35'],
        PatioB: ['P21','P22','P23','P24','P34','P13','P12','P11'],
        Bar: Array.from({ length: 16 }, (_, i) => `B${i+1}`),
      },
      { Green: '#22c55e', Blue: '#3b82f6', Purple: '#8b5cf6', PatioA: '#f59e0b', PatioB: '#ef4444', Bar: '#94a3b8' }
    ),
  },
  {
    slug: '4-plus-2-bar',
    name: '4 + 2 Bar',
    description: 'Four inside domains with two patio groups and bar',
    width: 1200,
    height: 760,
    tables: baseTables,
    domains: mkDomains(
      {
        Green: ['31','32','51','52','91'],
        Yellow: ['33','53','63','34','41'],
        Blue: ['21','22','23','24','71','72','81','82','83','92'],
        Orange: ['61','62','43','42'],
        PatioA: ['P23','P24','P31'],
        PatioB: ['P33','P32','P35','P34','P13','P12','P11','P21','P22'],
        Bar: Array.from({ length: 16 }, (_, i) => `B${i+1}`),
      },
      { Green: '#22c55e', Yellow: '#eab308', Blue: '#3b82f6', Orange: '#f97316', PatioA: '#fb7185', PatioB: '#f43f5e', Bar: '#94a3b8' }
    ),
  },
  {
    slug: '3-plus-1-bar',
    name: '3 + 1 Bar',
    width: 1200,
    height: 760,
    tables: baseTables,
    domains: mkDomains(
      {
        Green: ['31','32','51','52','91'],
        Yellow: ['33','53','63','34','41','42','43'],
        Blue: ['21','22','23','24','71','72','81','82','83','92','61','62'],
        Patio: ['P21','P22','P23','P24','P31','P32','P33','P34','P35','P13','P12','P11'],
        Bar: Array.from({ length: 8 }, (_, i) => `B${i+1}`),
      },
      { Green: '#22c55e', Yellow: '#f59e0b', Blue: '#3b82f6', Patio: '#ef4444', Bar: '#94a3b8' }
    ),
  },
  {
    slug: '5-plus-1-bar',
    name: '5 + 1 Bar',
    width: 1200,
    height: 760,
    tables: baseTables,
    domains: mkDomains(
      {
        Green: ['24','82','83','32','52'],
        Yellow: ['33','53','63','41','42','43','P34','P35'],
        Blue: ['21','22','23','71','72','81','91'],
        Orange: ['31','92','51'],
        Patio: ['P21','P22','P23','P24','P31','P32','P33','P13','P12','P11'],
        Bar: Array.from({ length: 16 }, (_, i) => `B${i+1}`),
      },
      { Green: '#22c55e', Yellow: '#eab308', Blue: '#3b82f6', Orange: '#f97316', Patio: '#ef4444', Bar: '#94a3b8' }
    ),
  },
  {
    slug: '4-plus-1-bar',
    name: '4 + 1 Bar',
    width: 1200,
    height: 760,
    tables: baseTables,
    domains: mkDomains(
      {
        Green: ['91','51','52','32'],
        Yellow: ['53','63','43','42','41','33'],
        Blue: ['21','22','23','24','71','72','81','82','83','62','61','92'],
        Patio: ['P21','P22','P23','P24','P31','P32','P33','P34','P35','P13','P12','P11'],
        Bar: Array.from({ length: 16 }, (_, i) => `B${i+1}`),
      },
      { Green: '#22c55e', Yellow: '#eab308', Blue: '#3b82f6', Patio: '#ef4444', Bar: '#94a3b8' }
    ),
  },
];

export function getPreset(slug: string): FloorPreset | undefined {
  return FLOOR_PRESETS.find(p => p.slug === slug);
}


