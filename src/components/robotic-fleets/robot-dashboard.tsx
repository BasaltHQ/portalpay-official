"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Battery, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Pause, 
  Play, 
  Square,
  RefreshCw,
  Zap,
  MapPin,
  Clock,
  TrendingUp,
  Loader2,
  Target
} from "lucide-react";
import { toast } from "sonner";

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
  destination?: string; // Real destination from Bear Cloud API
  location?: string; // Current location description
}

// Initial empty state while loading from API
const initialRobots: RobotStatus[] = [];

export default function RobotDashboard() {
  const [robots, setRobots] = useState<RobotStatus[]>(initialRobots);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Fleet Statistics
  const activeRobots = robots.filter(r => r.status === "active").length;
  const totalRobots = robots.length;
  const averageBattery = totalRobots > 0 ? Math.round(robots.reduce((sum, r) => sum + r.battery, 0) / robots.length) : 0;
  const averageSignal = totalRobots > 0 ? Math.round(robots.reduce((sum, r) => sum + r.signal, 0) / robots.length) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "charging": return "bg-blue-500";
      case "maintenance": return "bg-red-500";
      case "idle": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  // Load robots on component mount
  useEffect(() => {
    loadRobots();
    
    // Set up periodic refresh every 30 seconds (slower refresh rate)
    const interval = setInterval(loadRobots, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRobots = async () => {
    try {
      console.log('🔄 Loading robots from Bear Cloud API...');
      const response = await fetch('/api/robots');
      
      if (!response.ok) {
        console.error(`❌ HTTP error! status: ${response.status}`);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('📡 API response:', result);
      
      if (result.success) {
        setRobots(result.data || []);
        setIsConnected(true);
        console.log('✅ Successfully loaded robots:', result.data?.length || 0);
      } else {
        setRobots([]);
        setIsConnected(false);
        console.warn('⚠️ API returned error:', result.message);
        console.warn('⚠️ Full error details:', result);
        toast.error(`API Error: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Failed to load robots:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', error);
      setRobots([]);
      setIsConnected(false);
      toast.error('Failed to connect to Bear Cloud API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRobotAction = async (robotId: string, action: string) => {
    try {
      console.log(`🎮 Executing ${action} on robot ${robotId}`);
      
      const response = await fetch(`/api/robots/${robotId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: action }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Successfully ${action}ed robot ${robotId}`);
        // Refresh robot data after command
        setTimeout(loadRobots, 1000);
      } else {
        toast.error(`Failed to ${action} robot ${robotId}: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Error executing ${action} on robot ${robotId}:`, error);
      toast.error(`Error: Could not ${action} robot`);
    }
  };

  const refreshFleetData = async () => {
    setIsLoading(true);
    await loadRobots();
  };

  return (
    <div className="space-y-6">
      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Robots</p>
                <p className="text-2xl font-bold text-foreground">{activeRobots}/{totalRobots}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                <Bot className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Battery</p>
                <p className="text-2xl font-bold text-foreground">{averageBattery}%</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                <Battery className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Signal</p>
                <p className="text-2xl font-bold text-foreground">{averageSignal}%</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
                <Wifi className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm font-bold text-foreground">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fleet Control Panel</CardTitle>
              <CardDescription>Monitor and control individual robots</CardDescription>
            </div>
            <Button 
              onClick={refreshFleetData}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && robots.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Connecting to Bear Cloud API...</span>
            </div>
          ) : robots.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Robots Found</h3>
                <p className="text-muted-foreground mb-4">
                  {isConnected ? 'No robots are currently registered in your fleet.' : 'Unable to connect to Bear Cloud API.'}
                </p>
                <Button onClick={refreshFleetData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </div>
            </div>
                    ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {robots.map((robot) => (
              <Card key={robot.id} className="border-2">
                <CardContent className="p-3">
                  {/* Header with Image and Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src="/servi.webp"
                          alt="Servi Robot"
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
                        />
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(robot.status)} border-2 border-white`}></div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{robot.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{robot.id}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(robot.status)} text-white border-none text-xs px-2 py-1`}
                    >
                      {robot.status}
                    </Badge>
                  </div>

                  {/* Compact Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {/* Battery */}
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <Battery className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">{robot.battery}%</span>
                      </div>
                      <Progress value={robot.battery} className="h-1" />
                    </div>

                    {/* Signal */}
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <Wifi className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium">{robot.signal}%</span>
                      </div>
                      <Progress value={robot.signal} className="h-1" />
                    </div>

                    {/* Task */}
                    <div className="bg-muted/30 rounded-lg p-2 col-span-2">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">Task:</span>
                        <span className="text-xs font-medium truncate">{robot.task}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center space-x-1 text-xs">
                      <MapPin className="h-3 w-3 text-green-600 flex-shrink-0" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium truncate">{robot.location || 'Unknown'}</span>
                    </div>
                    
                    {robot.destination && (
                      <div className="flex items-center space-x-1 text-xs">
                        <Target className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="text-muted-foreground">Destination:</span>
                        <span className="font-medium text-blue-600 truncate">{robot.destination}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Uptime: {robot.uptime}</span>
                      </div>
                      <span>Pos: ({robot.position?.x ?? '—'}, {robot.position?.y ?? '—'})</span>
                    </div>
                  </div>

                  {/* Compact Controls */}
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRobotAction(robot.id, 'start')}
                      disabled={robot.status === 'active' || isLoading}
                      className="flex-1 text-xs h-7"
                    >
                      <Play className="h-2 w-2 mr-1" />
                      Start
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRobotAction(robot.id, 'pause')}
                      disabled={robot.status !== 'active' || isLoading}
                      className="flex-1 text-xs h-7"
                    >
                      <Pause className="h-2 w-2 mr-1" />
                      Pause
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRobotAction(robot.id, 'stop')}
                      disabled={robot.status === 'maintenance' || isLoading}
                      className="flex-1 text-xs h-7"
                    >
                      <Square className="h-2 w-2 mr-1" />
                      Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}