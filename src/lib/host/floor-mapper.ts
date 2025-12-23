// Precise floor mapping system based on reference image coordinates
// Reference image dimensions and coordinate system

export interface FloorCoordinate {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness?: number;
}

// Reference image analysis - exact pixel coordinates
// Image dimensions: ~900px wide x ~700px tall
const REFERENCE_WIDTH = 900;
const REFERENCE_HEIGHT = 700;

// Scale factor to our SVG coordinate system
const SVG_WIDTH = 1200;
const SVG_HEIGHT = 800;
const SCALE_X = SVG_WIDTH / REFERENCE_WIDTH;
const SCALE_Y = SVG_HEIGHT / REFERENCE_HEIGHT;

// Exact table coordinates from reference image (measured in pixels)
const REFERENCE_TABLES: Record<string, FloorCoordinate> = {
  // Patio tables - Left side (red)
  'P11': { x: 30, y: 480, width: 60, height: 40 },
  'P12': { x: 30, y: 420, width: 60, height: 40 },
  'P13': { x: 30, y: 240, width: 120, height: 60 },
  
  // Patio tables - Top row (blue and green)
  'P21': { x: 90, y: 50, width: 50, height: 100 },
  'P22': { x: 150, y: 50, width: 50, height: 100 },
  'P23': { x: 280, y: 120, width: 70, height: 120 },
  'P24': { x: 360, y: 120, width: 70, height: 120 },
  'P31': { x: 480, y: 150, width: 50, height: 70 },
  'P32': { x: 570, y: 120, width: 70, height: 120 },
  'P33': { x: 650, y: 120, width: 70, height: 120 },
  'P34': { x: 780, y: 80, width: 50, height: 160 },
  'P35': { x: 600, y: 30, width: 90, height: 50 },
  
  // Main room - Top bar line small squares
  '21': { x: 290, y: 190, width: 28, height: 28 },
  '22': { x: 330, y: 190, width: 28, height: 28 },
  '23': { x: 420, y: 190, width: 28, height: 28 },
  '31': { x: 570, y: 190, width: 28, height: 28 },
  '32': { x: 610, y: 190, width: 28, height: 28 },
  '33': { x: 650, y: 190, width: 28, height: 28 },
  
  // Main room - Left wall booths (red)
  '13': { x: 200, y: 290, width: 50, height: 30 },
  '12': { x: 200, y: 360, width: 50, height: 30 },
  '11': { x: 200, y: 480, width: 50, height: 30 },
  
  // Main room - Center horizontal tables (red)
  '71': { x: 290, y: 330, width: 90, height: 35 },
  '72': { x: 390, y: 330, width: 90, height: 35 },
  
  // Main room - Vertical tables (blue)
  '91': { x: 480, y: 250, width: 45, height: 120 },
  '92': { x: 530, y: 250, width: 45, height: 120 },
  '81': { x: 290, y: 410, width: 45, height: 110 },
  '82': { x: 350, y: 410, width: 45, height: 110 },
  '83': { x: 410, y: 410, width: 45, height: 110 },
  
  // Main room - Diamond tables upper row (green)
  '51': { x: 580, y: 330, width: 35, height: 35 },
  '52': { x: 625, y: 330, width: 35, height: 35 },
  '53': { x: 670, y: 330, width: 35, height: 35 },
  
  // Main room - Circles
  '24': { x: 480, y: 410, width: 40, height: 40 },
  '34': { x: 530, y: 410, width: 40, height: 40 },
  
  // Main room - Diamond tables lower row (purple)
  '61': { x: 580, y: 450, width: 35, height: 35 },
  '62': { x: 625, y: 450, width: 35, height: 35 },
  '63': { x: 670, y: 450, width: 35, height: 35 },
  
  // Main room - Right wall booths (green/purple)
  '41': { x: 740, y: 290, width: 70, height: 30 },
  '42': { x: 740, y: 360, width: 70, height: 30 },
  '43': { x: 740, y: 470, width: 110, height: 35 },
};

// Bar seats - measured from reference (B1-B16, but B15 doesn't exist in the image)
const BAR_SEATS: Record<string, FloorCoordinate> = {
  // Left group
  'B1': { x: 250, y: 550, width: 25, height: 18 },
  'B2': { x: 280, y: 550, width: 25, height: 18 },
  'B3': { x: 310, y: 550, width: 25, height: 18 },
  'B4': { x: 340, y: 550, width: 25, height: 18 },
  'B5': { x: 370, y: 550, width: 25, height: 18 },
  'B6': { x: 400, y: 550, width: 25, height: 18 },
  'B7': { x: 430, y: 550, width: 25, height: 18 },
  'B8': { x: 460, y: 550, width: 25, height: 18 },
  
  // Right group (after gap)
  'B9': { x: 530, y: 550, width: 25, height: 18 },
  'B10': { x: 560, y: 550, width: 25, height: 18 },
  'B11': { x: 590, y: 550, width: 25, height: 18 },
  'B12': { x: 620, y: 550, width: 25, height: 18 },
  'B13': { x: 650, y: 550, width: 25, height: 18 },
  'B14': { x: 680, y: 550, width: 25, height: 18 },
  'B16': { x: 710, y: 550, width: 25, height: 18 },
};

// Wall segments - traced from reference image
export const WALL_SEGMENTS: WallSegment[] = [
  // Main dining rectangle (inner room)
  { x1: 280, y1: 300, x2: 1000, y2: 300 },
  { x1: 1000, y1: 300, x2: 1000, y2: 720 },
  { x1: 1000, y1: 720, x2: 280, y2: 720 },
  { x1: 280, y1: 720, x2: 280, y2: 300 },

  // Left patio corridor wrap
  { x1: 280, y1: 300, x2: 280, y2: 220 },
  { x1: 280, y1: 220, x2: 160, y2: 220 },
  { x1: 160, y1: 220, x2: 160, y2: 720 },
  { x1: 160, y1: 720, x2: 280, y2: 720 },

  // Top patio wrap
  { x1: 280, y1: 300, x2: 480, y2: 300 },
  { x1: 480, y1: 300, x2: 480, y2: 180 },
  { x1: 480, y1: 180, x2: 1030, y2: 180 },
  { x1: 1030, y1: 180, x2: 1030, y2: 300 },
  { x1: 1030, y1: 300, x2: 1000, y2: 300 },

  // Right patio corridor down to bottom
  { x1: 1030, y1: 300, x2: 1100, y2: 300 },
  { x1: 1100, y1: 300, x2: 1100, y2: 720 },
  { x1: 1100, y1: 720, x2: 1000, y2: 720 },

  // Bar counter (thick)
  { x1: 320, y1: 650, x2: 980, y2: 650, thickness: 10 },
  { x1: 320, y1: 710, x2: 980, y2: 710, thickness: 10 },
  { x1: 320, y1: 650, x2: 320, y2: 710, thickness: 10 },
  { x1: 980, y1: 650, x2: 980, y2: 710, thickness: 10 },
];

// Convert reference coordinates to SVG coordinates
export function convertToSVG(coord: FloorCoordinate): FloorCoordinate {
  return {
    x: coord.x * SCALE_X,
    y: coord.y * SCALE_Y,
    width: coord.width * SCALE_X,
    height: coord.height * SCALE_Y,
  };
}

export function convertWallToSVG(wall: WallSegment): WallSegment {
  return {
    x1: wall.x1 * SCALE_X,
    y1: wall.y1 * SCALE_Y,
    x2: wall.x2 * SCALE_X,
    y2: wall.y2 * SCALE_Y,
    thickness: wall.thickness || 6,
  };
}

// Get all table coordinates in SVG space
export function getAllTableCoordinates(): Record<string, FloorCoordinate> {
  const allTables = { ...REFERENCE_TABLES, ...BAR_SEATS };
  const svgTables: Record<string, FloorCoordinate> = {};
  
  for (const [id, coord] of Object.entries(allTables)) {
    svgTables[id] = convertToSVG(coord);
  }
  
  return svgTables;
}

// Get all wall segments in SVG space
export function getAllWallSegments(): WallSegment[] {
  return WALL_SEGMENTS.map(convertWallToSVG);
}
