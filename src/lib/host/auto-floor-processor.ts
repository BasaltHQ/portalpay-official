// Automatic floor plan processing using the reference image
// This processes the floor plan automatically in the background

import { FloorPreset, TableSpec } from './types';

// Direct mapping from the reference image analysis
const DETECTED_TABLES = [
  // Patio tables (red region)
  { id: 'P11', x: 40, y: 640, width: 80, height: 50, type: 'patio', capacity: 4 },
  { id: 'P12', x: 40, y: 560, width: 80, height: 50, type: 'patio', capacity: 4 },
  { id: 'P13', x: 40, y: 480, width: 160, height: 80, type: 'patio', capacity: 6 },
  
  // Top patio tables (blue and green)
  { id: 'P21', x: 120, y: 67, width: 67, height: 133, type: 'patio', capacity: 4 },
  { id: 'P22', x: 200, y: 67, width: 67, height: 133, type: 'patio', capacity: 4 },
  { id: 'P23', x: 373, y: 160, width: 93, height: 160, type: 'patio', capacity: 6 },
  { id: 'P24', x: 480, y: 160, width: 93, height: 160, type: 'patio', capacity: 6 },
  { id: 'P31', x: 640, y: 200, width: 67, height: 93, type: 'patio', capacity: 4 },
  { id: 'P32', x: 760, y: 160, width: 93, height: 160, type: 'patio', capacity: 6 },
  { id: 'P33', x: 867, y: 160, width: 93, height: 160, type: 'patio', capacity: 6 },
  { id: 'P34', x: 1040, y: 107, width: 67, height: 213, type: 'patio', capacity: 8 },
  { id: 'P35', x: 800, y: 40, width: 120, height: 67, type: 'patio', capacity: 6 },
  
  // Small top tables (various colors)
  { id: '21', x: 387, y: 253, width: 37, height: 37, type: 'table', capacity: 2 },
  { id: '22', x: 440, y: 253, width: 37, height: 37, type: 'table', capacity: 2 },
  { id: '23', x: 560, y: 253, width: 37, height: 37, type: 'table', capacity: 2 },
  { id: '31', x: 760, y: 253, width: 37, height: 37, type: 'table', capacity: 2 },
  { id: '32', x: 813, y: 253, width: 37, height: 37, type: 'table', capacity: 2 },
  { id: '33', x: 867, y: 253, width: 37, height: 37, type: 'table', capacity: 2 },
  
  // Left wall booths (red)
  { id: '13', x: 267, y: 387, width: 67, height: 40, type: 'booth', capacity: 4 },
  { id: '12', x: 267, y: 480, width: 67, height: 40, type: 'booth', capacity: 4 },
  { id: '11', x: 267, y: 640, width: 67, height: 40, type: 'booth', capacity: 4 },
  
  // Center horizontal tables (red)
  { id: '71', x: 387, y: 440, width: 120, height: 47, type: 'table', capacity: 6 },
  { id: '72', x: 520, y: 440, width: 120, height: 47, type: 'table', capacity: 6 },
  
  // Vertical tables (blue)
  { id: '91', x: 640, y: 333, width: 60, height: 160, type: 'table', capacity: 8 },
  { id: '92', x: 707, y: 333, width: 60, height: 160, type: 'table', capacity: 8 },
  { id: '81', x: 387, y: 547, width: 60, height: 147, type: 'table', capacity: 6 },
  { id: '82', x: 467, y: 547, width: 60, height: 147, type: 'table', capacity: 6 },
  { id: '83', x: 547, y: 547, width: 60, height: 147, type: 'table', capacity: 6 },
  
  // Diamond tables (green/yellow)
  { id: '51', x: 773, y: 440, width: 47, height: 47, type: 'round', capacity: 4 },
  { id: '52', x: 833, y: 440, width: 47, height: 47, type: 'round', capacity: 4 },
  { id: '53', x: 893, y: 440, width: 47, height: 47, type: 'round', capacity: 4 },
  
  // Circles
  { id: '24', x: 640, y: 547, width: 53, height: 53, type: 'round', capacity: 4 },
  { id: '34', x: 707, y: 547, width: 53, height: 53, type: 'round', capacity: 4 },
  
  // Diamond tables lower (purple)
  { id: '61', x: 773, y: 600, width: 47, height: 47, type: 'round', capacity: 4 },
  { id: '62', x: 833, y: 600, width: 47, height: 47, type: 'round', capacity: 4 },
  { id: '63', x: 893, y: 600, width: 47, height: 47, type: 'round', capacity: 4 },
  
  // Right wall booths (green)
  { id: '41', x: 987, y: 387, width: 93, height: 40, type: 'booth', capacity: 6 },
  { id: '42', x: 987, y: 480, width: 93, height: 40, type: 'booth', capacity: 6 },
  { id: '43', x: 987, y: 627, width: 147, height: 47, type: 'booth', capacity: 8 },
  
  // Bar seats (purple circles at bottom)
  { id: 'B1', x: 333, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B2', x: 373, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B3', x: 413, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B4', x: 453, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B5', x: 493, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B6', x: 533, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B7', x: 573, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B8', x: 613, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  // Gap in bar seats
  { id: 'B9', x: 707, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B10', x: 747, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B11', x: 787, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B12', x: 827, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B13', x: 867, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B14', x: 907, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
  { id: 'B16', x: 947, y: 747, width: 33, height: 24, type: 'barSeat', capacity: 1 },
];

export interface AutoProcessResult {
  tables: TableSpec[];
  toastMatched: number;
  toastTotal: number;
  regions: Array<{
    id: string;
    name: string;
    color: string;
    tableIds: string[];
  }>;
}

export async function autoProcessFloorPlan(): Promise<AutoProcessResult> {
  console.log('Auto-processing floor plan from reference image...');
  
  // First, try server-side OCR+clustering derived layout
  try {
    const res = await fetch('/api/hostpro/scan-layout');
    const js = await res.json();
    if (js?.success && js?.data?.tables?.length) {
      const imgW = js.data.width || 900;
      const imgH = js.data.height || 700;
      const SCALE_X = 1200 / imgW;
      const SCALE_Y = 800 / imgH;
      const tables: TableSpec[] = (js.data.tables as any[]).map(t => ({
        id: String(t.id),
        capacity: String(t.id).startsWith('B') ? 1 : (String(t.id).startsWith('P') ? 4 : 4),
        type: (t.type || 'table') as any,
        x: t.x * SCALE_X,
        y: t.y * SCALE_Y,
        w: t.w * SCALE_X,
        h: t.h * SCALE_Y,
      }));

      // Proceed to Toast matching with OCR-derived ids
      let toastMatched = 0;
      let toastTotal = tables.length;
      try {
        const resp = await fetch('/api/hostpro/match-tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: tables.map(t => t.id) }) });
        const data = await resp.json();
        toastMatched = data?.data?.matchedCount || 0;
        toastTotal = data?.data?.total || toastTotal;
      } catch {}

      // Regions unknown from OCR; caller can create in UI
      return { tables, toastMatched, toastTotal, regions: [] };
    }
  } catch {}

  // Fallback to curated coordinate set if OCR produced nothing
  const SCALE_X = 1200 / 900; // SVG width / reference width
  const SCALE_Y = 800 / 700; // SVG height / reference height
  const tables: TableSpec[] = DETECTED_TABLES.map(t => ({ id: t.id, capacity: t.capacity, type: t.type as any, x: t.x * SCALE_X, y: t.y * SCALE_Y, w: t.width * SCALE_X, h: t.height * SCALE_Y }));
  
  // Try to sync with Toast POS via server API (avoid CORS/secret exposure)
  let toastMatched = 0;
  let toastTotal = tables.length;
  try {
    const resp = await fetch('/api/hostpro/match-tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: tables.map(t => t.id) }),
    });
    if (resp.ok) {
      const json = await resp.json();
      toastMatched = json?.data?.matchedCount || 0;
      toastTotal = json?.data?.total || toastTotal;
    }
  } catch (error) {
    console.warn('Toast sync failed (client fetch):', error);
  }
  
  // Create regions based on the color analysis from reference image
  const regions = [
    {
      id: 'red-region',
      name: 'Red Section',
      color: '#ef4444',
      tableIds: ['P11', 'P12', 'P13', '13', '12', '11', '71', '72', '81', '82', '83'],
    },
    {
      id: 'blue-region', 
      name: 'Blue Section',
      color: '#3b82f6',
      tableIds: ['P21', 'P22', 'P23', 'P24', '21', '22', '23', '91', '92', '24', '34'],
    },
    {
      id: 'green-region',
      name: 'Green Section', 
      color: '#22c55e',
      tableIds: ['P31', 'P32', 'P33', 'P35', '31', '32', '33', '51', '52', '53', '41', '42'],
    },
    {
      id: 'purple-region',
      name: 'Purple Section',
      color: '#8b5cf6', 
      tableIds: ['P34', '61', '62', '63', '43', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B16'],
    },
  ];
  
  return {
    tables,
    toastMatched,
    toastTotal,
    regions,
  };
}
