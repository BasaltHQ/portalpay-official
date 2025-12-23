import { getFlagColors } from './flags';

export type WorldRegion = 'north-america' | 'south-america' | 'europe' | 'africa' | 'middle-east' | 'asia' | 'oceania';

/**
 * Get representative color for a region based on its most prominent countries' flags
 */
export function getRegionColor(region: WorldRegion): string {
  const regionColorMap: Record<WorldRegion, string> = {
    'north-america': '#DC143C', // Crimson red
    'south-america': '#32CD32', // Lime green
    'europe': '#4169E1', // Royal blue
    'africa': '#FF8C00', // Dark orange
    'middle-east': '#9370DB', // Medium purple
    'asia': '#FF1493', // Deep pink
    'oceania': '#00CED1', // Dark turquoise
  };
  
  return regionColorMap[region];
}

/**
 * Get gradient colors for a region based on multiple flag colors
 */
export function getRegionGradientColors(region: WorldRegion): string[] {
  const gradients: Record<WorldRegion, string[]> = {
    'north-america': ['#B22234', '#FFFFFF', '#3C3B6E'], // USA colors
    'south-america': ['#009C3B', '#FFDF00', '#002776'], // Brazil colors
    'europe': ['#0055A4', '#FFFFFF', '#EF4135'], // France colors
    'africa': ['#239F40', '#FCD116', '#CE1126'], // Pan-African
    'middle-east': ['#006233', '#FFFFFF', '#C8102E'], // Saudi/UAE
    'asia': ['#CE1126', '#FFDF00', '#003893'], // China/regional blend
    'oceania': ['#012169', '#FFFFFF', '#E4002B'], // Australia colors
  };
  
  return gradients[region];
}
