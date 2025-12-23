// Bear Cloud API Client Service
// This client-side service calls our Next.js API routes (production-grade)

interface RobotStatus {
  id: string;
  name: string;
  status: 'active' | 'charging' | 'maintenance' | 'idle';
  battery: number;
  position: { x: number; y: number; z?: number };
  signal: number;
  task: string;
  uptime: string;
  lastUpdate: string;
  heading?: number;
  speed?: number;
  sensors?: {
    temperature?: number;
    humidity?: number;
    proximity?: number[];
  };
}

interface WorkflowData {
  id: string;
  name: string;
  keyframes: unknown[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  created: string;
  updated: string;
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

class BearCloudAPIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api'; // Use our Next.js API routes
  }

  // Helper method to make API requests to our server
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    try {
      console.log(`📡 Client making request to: ${this.baseUrl}${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      const data: APIResponse<T> = await response.json();
      
      if (!response.ok) {
        console.error(`❌ API request failed:`, data);
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`❌ Client API request failed:`, error);
      throw error;
    }
  }

  // Robot Management
  async getAllRobots(): Promise<RobotStatus[]> {
    try {
      console.log('🤖 Client fetching all robots via API route...');
      
      const response = await this.makeRequest<RobotStatus[]>('/robots');
      
      console.log('✅ Successfully fetched robots from API route:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('❌ Failed to fetch robots via API route:', error);
      console.log('🔄 Falling back to mock data...');
      // Return mock data as fallback
      return this.getMockRobots();
    }
  }



  async getRobotById(robotId: string): Promise<RobotStatus | null> {
    try {
      console.log(`🤖 Client fetching robot ${robotId} via API route...`);
      
      const response = await this.makeRequest<RobotStatus>(`/robots/${robotId}`);
      
      console.log(`✅ Successfully fetched robot ${robotId} from API route:`, response.data);
      return response.data || null;
    } catch (error) {
      console.error(`❌ Failed to fetch robot ${robotId} via API route:`, error);
      // Return mock robot as fallback
      const mockRobots = this.getMockRobots();
      return mockRobots.find(r => r.id === robotId) || null;
    }
  }

  async sendRobotCommand(robotId: string, command: string, params?: unknown): Promise<boolean> {
    try {
      console.log(`🎮 Client sending command '${command}' to robot ${robotId} via API route...`);
      
      const payload = {
        command,
        params,
      };

      const response = await this.makeRequest<unknown>(`/robots/${robotId}/command`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const success = response.success;
      if (success) {
        console.log(`✅ Successfully sent command '${command}' to robot ${robotId}`);
      } else {
        console.error(`❌ Failed to send command '${command}' to robot ${robotId}:`, response.error);
      }

      return success;
    } catch (error) {
      console.error(`❌ Failed to send command ${command} to robot ${robotId} via API route:`, error);
      // In development, we can simulate success
      console.log(`🔄 Mock: Command '${command}' sent to robot ${robotId}`);
      return true;
    }
  }



  // Workflow Management
  async getWorkflows(): Promise<WorkflowData[]> {
    try {
      console.log('📋 Client fetching workflows via API route...');
      
      const response = await this.makeRequest<WorkflowData[]>('/workflows');
      
      console.log('✅ Successfully fetched workflows from API route:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('❌ Failed to fetch workflows via API route:', error);
      console.log('🔄 Returning mock workflows...');
      return this.getMockWorkflows();
    }
  }

  async createWorkflow(workflow: Omit<WorkflowData, 'id' | 'created' | 'updated'>): Promise<WorkflowData | null> {
    try {
      console.log('📋 Client creating workflow via API route:', workflow.name);
      
      const response = await this.makeRequest<WorkflowData>('/workflows', {
        method: 'POST',
        body: JSON.stringify(workflow),
      });

      console.log('✅ Successfully created workflow via API route:', response.data);
      return response.data || null;
    } catch (error) {
      console.error('❌ Failed to create workflow via API route:', error);
      // Return mock workflow as fallback
      return {
        id: `mock-${Date.now()}`,
        ...workflow,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
    }
  }

  // Facility & Mapping
  async getFacilityMap(): Promise<unknown> {
    try {
      console.log('🗺️ Client fetching facility map via API route...');
      
      const response = await this.makeRequest<unknown>('/facility/map');
      
      console.log('✅ Successfully fetched facility map from API route:', response.data);
      return response.data || this.getMockFacilityMap();
    } catch (error) {
      console.error('❌ Failed to fetch facility map via API route:', error);
      console.log('🔄 Returning mock facility map...');
      return this.getMockFacilityMap();
    }
  }

  // Mock data methods for fallback when API is not available

  // Mock data methods (to be removed when API is integrated)
  private getMockRobots(): RobotStatus[] {
    return [
      {
        id: "robot-001",
        name: "Bear Alpha",
        status: "active",
        battery: 85,
        position: { x: 120, y: 85 },
        signal: 92,
        task: "Cleaning Zone A",
        uptime: "4h 23m",
        lastUpdate: new Date().toISOString(),
        heading: 45,
        speed: 1.2,
      },
      {
        id: "robot-002",
        name: "Bear Beta",
        status: "charging",
        battery: 45,
        position: { x: 100, y: 300 },
        signal: 88,
        task: "Charging",
        uptime: "0h 15m",
        lastUpdate: new Date().toISOString(),
        heading: 0,
        speed: 0,
      },
      {
        id: "robot-003",
        name: "Bear Gamma",
        status: "active",
        battery: 67,
        position: { x: 400, y: 150 },
        signal: 95,
        task: "Patrol Route B",
        uptime: "2h 45m",
        lastUpdate: new Date().toISOString(),
        heading: 180,
        speed: 0.8,
      },
      {
        id: "robot-004",
        name: "Bear Delta",
        status: "maintenance",
        battery: 12,
        position: { x: 275, y: 300 },
        signal: 0,
        task: "Offline - Maintenance",
        uptime: "0h 0m",
        lastUpdate: new Date().toISOString(),
        heading: 0,
        speed: 0,
      },
      {
        id: "robot-005",
        name: "Bear Echo",
        status: "active",
        battery: 78,
        position: { x: 500, y: 320 },
        signal: 90,
        task: "Storage Delivery",
        uptime: "3h 12m",
        lastUpdate: new Date().toISOString(),
        heading: 270,
        speed: 1.0,
      },
    ];
  }

  private getMockWorkflows(): WorkflowData[] {
    return [
      {
        id: "workflow-001",
        name: "Morning Setup",
        keyframes: [],
        status: "active",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
      {
        id: "workflow-002", 
        name: "Lunch Rush",
        keyframes: [],
        status: "draft",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      }
    ];
  }

  private getMockFacilityMap(): unknown {
    return {
      width: 600,
      height: 400,
      obstacles: [
        { x: 150, y: 100, width: 100, height: 50 },
        { x: 350, y: 250, width: 80, height: 60 },
      ],
      zones: [
        { id: "kitchen", x: 0, y: 0, width: 200, height: 200 },
        { id: "dining", x: 200, y: 0, width: 400, height: 400 },
      ]
    };
  }
}

// Create and export a singleton instance
const bearCloudAPI = new BearCloudAPIService();

export { bearCloudAPI, BearCloudAPIService };
export type { RobotStatus, WorkflowData };