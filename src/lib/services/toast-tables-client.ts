// Toast POS Tables API integration
// Fetches real table data from Toast POS system

export interface ToastTable {
  guid: string;
  entityType: string;
  name: string;
  serviceArea: {
    guid: string;
    entityType: string;
  };
  revenueCenter: {
    guid: string;
    entityType: string;
    externalId: string;
  };
}

export interface ToastTablesResponse {
  tables: ToastTable[];
  lastModified?: string;
  pageToken?: string;
}

import { ToastAuthService } from './toast-auth';

export class ToastTablesClient {
  private apiHostname: string;
  private restaurantId: string;
  private authService: ToastAuthService;

  constructor(restaurantId?: string) {
    // Prefer TOAST_API_HOSTNAME (used elsewhere) but fall back to TOAST_API_URL if provided
    this.apiHostname = process.env.TOAST_API_HOSTNAME || process.env.TOAST_API_URL || '';
    this.restaurantId = restaurantId || process.env.TOAST_RESTAURANT_ID || '';
    this.authService = ToastAuthService.getInstance();
  }

  async fetchTables(options?: {
    lastModified?: string;
    pageToken?: string;
  }): Promise<ToastTablesResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (options?.lastModified) {
        queryParams.set('lastModified', options.lastModified);
      }
      if (options?.pageToken) {
        queryParams.set('pageToken', options.pageToken);
      }

      const url = `${this.apiHostname}/config/v2/tables${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const token = await this.authService.getAccessToken();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Toast-Restaurant-External-ID': this.restaurantId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Toast API error: ${response.status} ${response.statusText}`);
      }

      const tables: ToastTable[] = await response.json();
      
      return {
        tables,
        lastModified: response.headers.get('Last-Modified') || undefined,
        pageToken: response.headers.get('X-Page-Token') || undefined,
      };
    } catch (error) {
      console.error('Error fetching tables from Toast:', error);
      throw error;
    }
  }

  async fetchTableByGuid(guid: string): Promise<ToastTable | null> {
    try {
      const url = `${this.apiHostname}/config/v2/tables/${encodeURIComponent(guid)}`;
      const token = await this.authService.getAccessToken();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Toast-Restaurant-External-ID': this.restaurantId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) return null;
      const table = await response.json() as ToastTable;
      return table;
    } catch (error) {
      console.error('Error fetching table by guid from Toast:', error);
      return null;
    }
  }

  async fetchTableByName(tableName: string): Promise<ToastTable | null> {
    try {
      const response = await this.fetchTables();
      return response.tables.find(table => 
        table.name === tableName || 
        table.name.toLowerCase() === tableName.toLowerCase()
      ) || null;
    } catch (error) {
      console.error(`Error fetching table ${tableName}:`, error);
      return null;
    }
  }

  async fetchMultipleTablesByNames(tableNames: string[]): Promise<Record<string, ToastTable | null>> {
    try {
      const response = await this.fetchTables();
      const result: Record<string, ToastTable | null> = {};
      
      for (const tableName of tableNames) {
        const table = response.tables.find(t => 
          t.name === tableName || 
          t.name.toLowerCase() === tableName.toLowerCase()
        );
        result[tableName] = table || null;
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching multiple tables:', error);
      // Return null for all requested tables on error
      return tableNames.reduce((acc, name) => ({ ...acc, [name]: null }), {});
    }
  }

  // Enhanced table matching that handles different naming conventions
  async fetchTablesByFloorPlan(detectedTableIds: string[]): Promise<{
    matched: Record<string, ToastTable>;
    unmatched: string[];
    suggestions: Record<string, ToastTable[]>;
  }> {
    try {
      const response = await this.fetchTables();
      const toastTables = response.tables;
      
      const matched: Record<string, ToastTable> = {};
      const unmatched: string[] = [];
      const suggestions: Record<string, ToastTable[]> = {};

      for (const detectedId of detectedTableIds) {
        // Try exact match first
        let table = toastTables.find(t => t.name === detectedId);
        
        if (!table) {
          // Try case-insensitive match
          table = toastTables.find(t => t.name.toLowerCase() === detectedId.toLowerCase());
        }
        
        if (!table) {
          // Try pattern matching for different naming conventions
          table = this.findTableByPattern(detectedId, toastTables);
        }

        if (table) {
          matched[detectedId] = table;
        } else {
          unmatched.push(detectedId);
          // Find similar tables for suggestions
          suggestions[detectedId] = this.findSimilarTables(detectedId, toastTables);
        }
      }

      return { matched, unmatched, suggestions };
    } catch (error) {
      console.error('Error matching tables with floor plan:', error);
      return {
        matched: {},
        unmatched: detectedTableIds,
        suggestions: {},
      };
    }
  }

  private findTableByPattern(detectedId: string, toastTables: ToastTable[]): ToastTable | undefined {
    // Handle common naming pattern variations
    const patterns = [
      detectedId, // exact
      `Table ${detectedId}`, // "Table 11"
      `T${detectedId}`, // "T11"
      `${detectedId}`, // just the number
      detectedId.replace(/^P/, 'Patio '), // "P11" -> "Patio 11"
      detectedId.replace(/^B/, 'Bar '), // "B1" -> "Bar 1"
    ];

    for (const pattern of patterns) {
      const table = toastTables.find(t => 
        t.name.toLowerCase() === pattern.toLowerCase()
      );
      if (table) return table;
    }

    return undefined;
  }

  private findSimilarTables(detectedId: string, toastTables: ToastTable[]): ToastTable[] {
    // Find tables with similar names for suggestions
    const similar = toastTables.filter(table => {
      const tableName = table.name.toLowerCase();
      const detectedLower = detectedId.toLowerCase();
      
      // Check if table name contains the detected ID or vice versa
      return tableName.includes(detectedLower) || 
             detectedLower.includes(tableName) ||
             this.levenshteinDistance(tableName, detectedLower) <= 2;
    });

    return similar.slice(0, 3); // Return top 3 suggestions
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

// Utility function to get enriched table data
export async function getEnrichedTableData(detectedTableIds: string[]): Promise<{
  tables: Array<{
    id: string;
    toastData: ToastTable | null;
    serviceArea?: string;
    revenueCenter?: string;
  }>;
  stats: {
    total: number;
    matched: number;
    unmatched: number;
  };
}> {
  const client = new ToastTablesClient();
  const result = await client.fetchTablesByFloorPlan(detectedTableIds);
  
  const tables = detectedTableIds.map(id => ({
    id,
    toastData: result.matched[id] || null,
    serviceArea: result.matched[id]?.serviceArea?.guid,
    revenueCenter: result.matched[id]?.revenueCenter?.externalId,
  }));

  return {
    tables,
    stats: {
      total: detectedTableIds.length,
      matched: Object.keys(result.matched).length,
      unmatched: result.unmatched.length,
    },
  };
}
