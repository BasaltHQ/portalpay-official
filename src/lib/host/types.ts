export type TableType = 'table' | 'booth' | 'highTop' | 'barSeat' | 'patio' | 'round';

export interface TableSpec {
  id: string; // e.g. "71", "P21", "B3"
  label?: string; // optional display label
  capacity: number; // number of seats
  type: TableType;
  // Optional rough coordinates for map view (SVG logical space)
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface DomainSpec {
  id: string; // slug-like id e.g. "D1"
  name: string; // display name e.g. "Green",
  color: string; // hex color for map rendering
  tableIds: string[]; // tables included in domain
}

export interface FloorPreset {
  slug: string; // e.g. "three-plus-two-bar"
  name: string; // e.g. "3 + 2 Bar"
  description?: string;
  width?: number; // map canvas width
  height?: number; // map canvas height
  tables: TableSpec[];
  domains: DomainSpec[];
}

export interface ServerInfo {
  id: string; // from 7shifts user id (stringified)
  name: string;
  department?: string;
  role?: string;
  isActive?: boolean;
}

export interface HostAssignment {
  serverId: string;
  domainIds: string[]; // a server may own multiple domains
}

export type SeatingStatus = 'seated' | 'completed' | 'cancelled';

export interface SeatingRecord {
  id: string;
  serverId: string;
  tableId: string;
  partySize: number;
  startedAt: Date;
  completedAt?: Date;
  status: SeatingStatus;
}

export interface RotationState {
  isLive: boolean; // whether the play button is active
  order: string[]; // array of server ids in rotation order
  pointer: number; // index into order indicating "next up"
}

export interface HostSessionState {
  _id?: string;
  presetSlug: string;
  presetName: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'live' | 'ended';
  servers: ServerInfo[];
  assignments: HostAssignment[];
  tableOccupied: Record<string, boolean>; // tableId -> occupied
  seatings: SeatingRecord[];
  rotation: RotationState;
}

export interface SeatByPartyRequest {
  partySize: number;
  // optional preferred server id; if omitted, use next-up logic
  preferredServerId?: string;
}

export interface SeatSuggestion {
  serverId: string;
  tableId: string;
  slack: number; // table capacity - partySize
}

export interface AutoAssignRequest {
  // Provide explicit mapping or request algorithmic distribution
  assignments?: HostAssignment[];
}


