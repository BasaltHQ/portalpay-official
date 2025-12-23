import { z } from 'zod';
import { getDefaultTimeZone, getDayRangeForYmdInTz } from '@/lib/timezone';

const SEVEN_SHIFTS_API_URL = 'https://api.7shifts.com/v2';

const UserSchema = z.object({
  id: z.coerce.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  mobile_number: z.string().nullable(),
  active: z.boolean(),
});

const LocationSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  company_id: z.coerce.number(),
});

const CompanySchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
});

const ShiftSchema = z.object({
  id: z.coerce.number(),
  user_id: z.coerce.number(),
  start: z.string(),
  end: z.string(),
  late_minutes: z.number().nullable().optional(),
  role_id: z.coerce.number().optional(),
  department_id: z.coerce.number().optional(),
  location_id: z.coerce.number().optional(),
  open: z.boolean().optional(),
  draft: z.boolean().optional(),
});

type User = z.infer<typeof UserSchema>;
type Shift = z.infer<typeof ShiftSchema>;
const RoleSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  department_id: z.coerce.number().optional(),
});

const DepartmentSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
});

type Company = z.infer<typeof CompanySchema>;
type Location = z.infer<typeof LocationSchema>;

const IdentitySchema = z.object({
  id: z.coerce.number(),
  company_id: z.coerce.number(),
  location_ids: z.array(z.coerce.number()),
  company_guid: z.string().optional(),
});

type Identity = z.infer<typeof IdentitySchema>;

class SevenShiftsApiClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}, extraHeaders?: Record<string, string>): Promise<T> {
    const url = new URL(`${SEVEN_SHIFTS_API_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) url.searchParams.append(key, params[key]);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...(extraHeaders || {}),
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`7shifts API request failed: ${response.statusText} - ${errorBody}`);
    }

    return response.json();
  }

  async getIdentity(): Promise<Identity> {
    const raw = await this.makeRequest<any>('/identity');
    console.log('7shifts /identity raw response:', JSON.stringify(raw, null, 2));
    const data = raw?.data ?? raw ?? {};

    const identityId = Number(data.identity_id ?? data.id);

    const companies = Array.isArray(data.companies) ? data.companies : [];
    console.log('7shifts companies from identity:', JSON.stringify(companies, null, 2));
    const primaryCompany = companies[0] ?? {};
    let companyId = Number(primaryCompany.id ?? primaryCompany.company_id ?? data.company_id);
    const companyGuid = String(primaryCompany.guid ?? data.company_guid ?? '') || undefined;

    let locationIds: number[] = [];
    const companyLocations = primaryCompany.locations ?? primaryCompany.location_ids ?? primaryCompany.authorized_location_ids;
    console.log('7shifts locations from identity:', JSON.stringify(companyLocations, null, 2));
    if (Array.isArray(companyLocations)) {
      locationIds = companyLocations
        .map((loc: any) => Number(typeof loc === 'object' ? (loc?.id ?? loc?.location_id) : loc))
        .filter((n: number) => !Number.isNaN(n));
    }

    const identityCandidate = {
      id: identityId,
      company_id: companyId,
      location_ids: locationIds,
      company_guid: companyGuid,
    };

    console.log('7shifts identity candidate:', JSON.stringify(identityCandidate, null, 2));
    return IdentitySchema.parse(identityCandidate);
  }

  private async getWhoAmI(): Promise<{ company_id?: number; company_guid?: string; location_ids?: number[] }> {
    const raw = await this.makeRequest<any>('/whoami');
    console.log('7shifts /whoami raw response:', JSON.stringify(raw, null, 2));
    const data = raw?.data ?? raw ?? {};
    const companies = Array.isArray(data.companies) ? data.companies : [];
    const primaryCompany = companies[0] ?? {};
    const companyId = Number(primaryCompany.id ?? primaryCompany.company_id ?? data.company_id);
    const companyGuid = String(primaryCompany.guid ?? data.company_guid ?? '') || undefined;
    let locationIds: number[] = [];
    const locs = primaryCompany.locations ?? primaryCompany.location_ids ?? primaryCompany.authorized_location_ids ?? data.location_ids;
    if (Array.isArray(locs)) {
      locationIds = locs
        .map((loc: any) => Number(typeof loc === 'object' ? (loc?.id ?? loc?.location_id) : loc))
        .filter((n: number) => !Number.isNaN(n));
    }
    const result = { company_id: Number.isNaN(companyId) ? undefined : companyId, company_guid: companyGuid, location_ids: locationIds };
    console.log('7shifts whoami result:', JSON.stringify(result, null, 2));
    return result;
  }

  public async getCompanyAndLocations(): Promise<{ companyId: number; companyGuid?: string; locationIds: number[] }> {
    console.log('7shifts getCompanyAndLocations: Starting...');
    let identity: Identity | null = null;
    try { 
      identity = await this.getIdentity(); 
      console.log('7shifts getCompanyAndLocations: Identity success');
    } catch (error) { 
      console.log('7shifts getCompanyAndLocations: Identity failed:', error);
      identity = null; 
    }

    let companyId = identity?.company_id ?? undefined;
    let companyGuid = identity?.company_guid ?? undefined;
    let locationIds = identity?.location_ids ?? [];
    console.log('7shifts getCompanyAndLocations: Initial state - companyId:', companyId, 'companyGuid:', companyGuid, 'locationIds:', locationIds);

    if (!locationIds || locationIds.length === 0) {
      console.log('7shifts getCompanyAndLocations: No locations from identity, trying whoami...');
      try {
        const who = await this.getWhoAmI();
        companyId = companyId ?? who.company_id;
        companyGuid = companyGuid ?? who.company_guid;
        if (who.location_ids && who.location_ids.length) locationIds = who.location_ids;
        console.log('7shifts getCompanyAndLocations: After whoami - companyId:', companyId, 'companyGuid:', companyGuid, 'locationIds:', locationIds);
      } catch (error) { 
        console.log('7shifts getCompanyAndLocations: Whoami failed:', error);
      }
    }

    if ((locationIds?.length ?? 0) === 0 && companyId !== undefined) {
      console.log('7shifts getCompanyAndLocations: Still no locations, trying to get company GUID and locations...');
      try {
        // First try to get company details to get the GUID
        console.log('7shifts getCompanyAndLocations: Trying getCompany to fetch GUID for companyId:', companyId);
        const company = await this.getCompany(companyId);
        console.log('7shifts getCompanyAndLocations: Company details:', JSON.stringify(company, null, 2));
        if (company.guid) {
          companyGuid = company.guid;
        }
      } catch (error) {
        console.log('7shifts getCompanyAndLocations: getCompany failed:', error);
      }

      // Now try to get locations with the corrected endpoint
      try {
        console.log('7shifts getCompanyAndLocations: Trying listLocations with companyId:', companyId);
        const locs = await this.listLocations(companyId);
        locationIds = (locs || []).map((l) => Number(l.id)).filter((n) => !Number.isNaN(n));
        console.log('7shifts getCompanyAndLocations: ListLocations result:', locationIds);
      } catch (error) { 
        console.log('7shifts getCompanyAndLocations: ListLocations failed:', error);
        
        // Try with company GUID header if we have it
        if (companyGuid) {
          try {
            console.log('7shifts getCompanyAndLocations: Trying locations with company GUID header:', companyGuid);
            const res = await this.makeRequest<{ data: Location[] }>(`/company/${companyId}/locations`, {}, { 'x-company-guid': companyGuid });
            const locs = z.array(LocationSchema).parse(res.data);
            locationIds = (locs || []).map((l) => Number(l.id)).filter((n) => !Number.isNaN(n));
            console.log('7shifts getCompanyAndLocations: Locations with GUID header result:', locationIds);
          } catch (guidError) {
            console.log('7shifts getCompanyAndLocations: Locations with GUID header failed:', guidError);
          }
        }
      }
    }

    console.log('7shifts getCompanyAndLocations: Final state - companyId:', companyId, 'companyGuid:', companyGuid, 'locationIds:', locationIds);

    if (companyId === undefined && !companyGuid) {
      throw new Error('No 7shifts company available for this access token');
    }

    // Note: We can proceed even without locations for company-level user sync
    if (!locationIds || locationIds.length === 0) {
      console.log('7shifts getCompanyAndLocations: No locations found, but will proceed with company-level sync');
      locationIds = [];
    }

    return { companyId: companyId as number, companyGuid, locationIds };
  }

  async listUsers(locationId: string, ctx?: { companyId?: number; companyGuid?: string }): Promise<User[]> {
    const params: Record<string, string> = { 
      limit: '500' 
    };
    // Only filter by location if a real location id was provided
    if (locationId && locationId !== '0') {
      params.location_id = locationId;
    }
    
    // Add company_id as required query parameter
    if (ctx?.companyId) {
      params.company_id = String(ctx.companyId);
    }
    
    const headers: Record<string, string> = {};
    if (ctx?.companyGuid) {
      headers['x-company-guid'] = String(ctx.companyGuid);
    }
    
    const response = await this.makeRequest<any>(
      '/users',
      params,
      headers
    );
    console.log('7shifts /users raw response keys:', Object.keys(response));
    console.log('7shifts /users response.data exists:', 'data' in response);
    console.log('7shifts /users response.data value:', response.data);
    console.log('7shifts /users response type:', typeof response);
    
    // The response structure is { results: [...], next_cursor, prev_cursor, limit }
    let users;
    if (response && typeof response === 'object' && 'results' in response) {
      users = response.results;
    } else if (response && typeof response === 'object' && 'data' in response) {
      users = response.data;
    } else if (Array.isArray(response)) {
      users = response;
    } else {
      users = [];
    }
    
    console.log('7shifts /users final users:', Array.isArray(users), users ? users.length : 'no length');
    return z.array(UserSchema).parse(users);
  }

  async listCompanies(): Promise<Company[]> {
    const response = await this.makeRequest<{ data: Company[] }>('/companies');
    return z.array(CompanySchema).parse(response.data);
  }

  async getCompany(companyId: number): Promise<{ id: number; name: string; guid?: string }> {
    const response = await this.makeRequest<{ data: any }>(`/company/${companyId}`);
    return {
      id: response.data.id,
      name: response.data.name,
      guid: response.data.guid
    };
  }

  async listLocations(companyId: number): Promise<Location[]> {
    const response = await this.makeRequest<{ data: Location[] }>(`/company/${companyId}/locations`);
    return z.array(LocationSchema).parse(response.data);
  }

  async listRoles(companyId: number): Promise<Array<{ id: number; name: string; department_id?: number }>> {
    const response = await this.makeRequest<{ data: any[] }>(`/company/${companyId}/roles`);
    const rows = Array.isArray(response?.data) ? response.data : [];
    return z.array(RoleSchema).parse(rows);
  }

  async listDepartments(companyId: number): Promise<Array<{ id: number; name: string }>> {
    const response = await this.makeRequest<{ data: any[] }>(`/company/${companyId}/departments`);
    const rows = Array.isArray(response?.data) ? response.data : [];
    return z.array(DepartmentSchema).parse(rows);
  }

  async getExternalUserMapping(userId: number, companyId?: number): Promise<{ external_id: string } | null> {
    // Try modern list endpoint first
    try {
      const params: Record<string, string> = { user_id: String(userId) };
      if (companyId) {
        params.company_id = String(companyId);
      }
      
      const resA = await this.makeRequest<{ data: Array<{ external_id?: string; provider?: string; external_source?: string }> }>(
        '/external_user_mappings',
        params,
        undefined
      );
      const mappings = Array.isArray(resA?.data) ? resA.data : [];
      const toastMapping = mappings.find((m) => {
        const p = (m.provider || m.external_source || '').toString().toLowerCase();
        return p.includes('toast');
      }) || mappings.find((m) => m.external_id);
      if (toastMapping?.external_id) return { external_id: toastMapping.external_id };
    } catch (_) { /* fall through */ }

    // Fallback to legacy per-user endpoint
    try {
      const params: Record<string, string> = {};
      if (companyId) {
        params.company_id = String(companyId);
      }
      
      const resB = await this.makeRequest<{ data: { external_id: string } }>(
        `/users/${userId}/external_mapping`,
        params,
        undefined
      );
      if (resB?.data?.external_id) return { external_id: resB.data.external_id };
    } catch (error) {
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('Not Found'))) {
        return null;
      }
      throw error;
    }

    return null;
  }

  async getUserRoleAssignments(userId: number, companyId: number): Promise<Array<{ role_id: number; location_id: number; department_id: number; name: string; is_primary: boolean; skill_level: number; sort: number }>> {
    try {
      const response = await this.makeRequest<any>(`/company/${companyId}/users/${userId}/role_assignments`);
      console.log(`7shifts role assignments for user ${userId}:`, JSON.stringify(response, null, 2));
      
      // The response structure is likely { data: [...] } based on the example
      const roleAssignments = response.data || response || [];
      return Array.isArray(roleAssignments) ? roleAssignments : [];
    } catch (error) {
      console.log(`Failed to get role assignments for user ${userId}:`, error);
      return [];
    }
  }

  async listShifts(locationId: string, start: string, end: string, ctx?: { companyId?: number; companyGuid?: string }): Promise<Shift[]> {
    if (!ctx?.companyId) {
      throw new Error('Company ID is required for shifts API');
    }

    // Based on 7shifts documentation: /v2/company/{company_id}/shifts
    const params: Record<string, string> = { 
      limit: '100',
      deleted: 'false',
      include_deleted: 'false',
      draft: 'false',
      include_draft: 'false',
      company_id: String(ctx.companyId),
    };
    
    // Date filtering: use start[gte] and end[lte] (ISO8601)
    const tz = process.env.TOAST_TIMEZONE || getDefaultTimeZone();
    if (start && start.length === 10) {
      const { start: dayStart } = getDayRangeForYmdInTz(tz, start);
      params['start[gte]'] = dayStart.toISOString();
    } else if (start) {
      params['start[gte]'] = start;
    }
    if (end && end.length === 10) {
      const { end: dayEnd } = getDayRangeForYmdInTz(tz, end);
      params['end[lte]'] = dayEnd.toISOString();
    } else if (end) {
      params['end[lte]'] = end;
    }
    
    // Location filtering (singular per API docs)
    if (locationId && locationId !== '0') {
      params.location_id = locationId;
    }
    
    const headers: Record<string, string> = {};
    if (ctx?.companyGuid) {
      headers['x-company-guid'] = String(ctx.companyGuid);
    }
    
    const endpoint = `/company/${ctx.companyId}/shifts`;
    const response = await this.makeRequest<any>(endpoint, params, headers);
    
    // The response structure might be { results: [...] } or { data: [...] }
    let shifts;
    if (response && typeof response === 'object' && 'results' in response) {
      shifts = response.results;
    } else if (response && typeof response === 'object' && 'data' in response) {
      shifts = response.data;
    } else if (Array.isArray(response)) {
      shifts = response;
    } else {
      shifts = [];
    }
    
    return z.array(ShiftSchema).parse(shifts);
  }
}

export default SevenShiftsApiClient;
