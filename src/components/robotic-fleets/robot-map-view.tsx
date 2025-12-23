"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  MapPin,
  Battery,
  Wifi,
  Navigation,
  RefreshCw,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import FloorMap from "@/components/hostpro/FloorMap";
import { getPreset } from "@/lib/host/presets";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

// Initial empty state - robots will be loaded from API
const initialRobots: RobotStatus[] = [];

export default function RobotMapView() {
  const [robots, setRobots] = useState<RobotStatus[]>(initialRobots);
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showPaths, setShowPaths] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [layoutData, setLayoutData] = useState<any | null>(null);
  const [calibration, setCalibration] = useState<any | null>(null);
  const [editBounds, setEditBounds] = useState(false);
  const [bounds, setBounds] = useState<Array<{ x: number; y: number }>>([]);
  const [dragVertexIdx, setDragVertexIdx] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  // Load robots on component mount
  useEffect(() => {
    loadRobots();
    // Load the latest saved HostPro layout for consistent map
    (async () => {
      try {
        const res = await fetch('/api/hostpro/scan-layout');
        const js = await res.json();
        if (js?.success) setLayoutData(js.data || null);
      } catch {}
      try {
        const r = await fetch('/api/robotic-fleets/calibration');
        const j = await r.json();
        if (j?.success) {
          setCalibration(j.data || null);
          if (Array.isArray(j?.data?.bounds)) setBounds(j.data.bounds as any);
        }
      } catch {}
    })();
    
    // Set up periodic refresh every 5 seconds for real-time tracking
    const interval = setInterval(loadRobots, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadRobots = async () => {
    try {
      console.log('🗺️ Loading robots for map view...');
      const response = await fetch('/api/robots');
      const result = await response.json();
      
      if (result.success) {
        setRobots(result.data || []);
        setIsConnected(true);
        console.log('✅ Successfully loaded robots for map:', result.data?.length || 0);
      } else {
        setRobots([]);
        setIsConnected(false);
        console.warn('⚠️ No robots found for map:', result.message);
      }
    } catch (error) {
      console.error('❌ Failed to load robots for map:', error);
      setRobots([]);
      setIsConnected(false);
      toast.error('Failed to load robot positions');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#22c55e";
      case "charging": return "#3b82f6";
      case "maintenance": return "#ef4444";
      case "idle": return "#eab308";
      default: return "#6b7280";
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleRobotClick = (robotId: string) => {
    setSelectedRobot(selectedRobot === robotId ? null : robotId);
  };

  const applyTransform = (x: number, y: number) => {
    const t = calibration?.transform || {};
    const flipX = t.flipX ? -1 : 1;
    const flipY = t.flipY ? -1 : 1;
    const rad = ((t.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const sx = (t.scaleX ?? 1) * flipX; const sy = (t.scaleY ?? 1) * flipY;
    const px = x * sx; const py = y * sy;
    const rx = px * cos - py * sin; const ry = px * sin + py * cos;
    return { x: rx + (t.translateX || 0), y: ry + (t.translateY || 0) };
  };

  // Map for charging robots row positioning
  const chargingRobots = robots.filter(r => r.status === 'charging');
  const chargingIndex: Record<string, number> = {};
  chargingRobots.forEach((r, i) => { chargingIndex[String(r.id)] = i; });

  const getRobotIcon = (robot: RobotStatus) => {
    const size = 24;
    const color = getStatusColor(robot.status);
    
    let { x: robotX, y: robotY } = applyTransform(robot.position.x, robot.position.y);

    // Charging row: bottom-right aligned
    if (robot.status === 'charging') {
      const idx = chargingIndex[String(robot.id)] || 0;
      const margin = 24;
      const spacing = size + 12;
      robotX = (w - margin) - idx * spacing;
      robotY = (h - margin);
    }
    const robotHeading = robot.heading || 0;

    return (
      <g transform={`translate(${robotX - size/2}, ${robotY - size/2})`}>
        {/* Robot body */}
        <circle
          cx={size/2}
          cy={size/2}
          r={size/2 - 2}
          fill={color}
          stroke="#ffffff"
          strokeWidth="2"
          className="cursor-pointer hover:opacity-80"
          onClick={() => handleRobotClick(robot.id)}
        />
        {/* Direction indicator */}
        <line
          x1={size/2}
          y1={size/2}
          x2={size/2 + Math.cos((robotHeading - 90) * Math.PI / 180) * (size/2 - 4)}
          y2={size/2 + Math.sin((robotHeading - 90) * Math.PI / 180) * (size/2 - 4)}
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Robot ID */}
        <text
          x={size/2}
          y={size + 12}
          textAnchor="middle"
          className="text-xs font-medium fill-foreground"
        >
          {robot.name.split(' ')[1] || robot.name}
        </text>
      </g>
    );
  };

  // Build preset from HostPro for unified map appearance
  const basePreset = getPreset('3-plus-2-bar') || { slug: '', name: '', tables: [], domains: [] } as any;
  const preset = {
    ...basePreset,
    width: layoutData?.width || basePreset.width || 1200,
    height: layoutData?.height || basePreset.height || 760,
    tables: Array.isArray(layoutData?.tables) && layoutData!.tables.length
      ? basePreset.tables.map((t: any) => {
          const s = (layoutData!.tables as any[]).find((x: any) => String(x.id) === String(t.id));
          return s ? { ...t, x: s.x, y: s.y, w: s.w, h: s.h, type: s.type || t.type } : t;
        })
      : basePreset.tables,
  } as any;
  const w = (preset as any).width || 1200;
  const h = (preset as any).height || 760;

  return (
    <div className="space-y-6">
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fleet & Map</CardTitle>
              <CardDescription>Live positions over the HostPro floor map</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPaths(!showPaths)}
              >
                <Navigation className="h-4 w-4 mr-1" />
                {showPaths ? 'Hide' : 'Show'} Paths
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadRobots}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            <div className="relative" style={{ height: h }}>
              <div
                ref={mapRef}
                className="absolute inset-0"
                style={{ transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`, transformOrigin: 'top left' }}
              >
                <FloorMap preset={preset} showDomains={false} walls={layoutData?.walls} labels={layoutData?.labels} />
                <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ position: 'absolute', inset: 0, zIndex: 10 }}
                  onMouseMove={(e) => {
                    if (dragVertexIdx === null || !editBounds) return;
                    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
                    setBounds(prev => prev.map((p, i) => i===dragVertexIdx ? { x, y } : p));
                  }}
                  onMouseUp={() => setDragVertexIdx(null)}
                >
                  {/* Calibration grid overlay */}
                  {showGrid && (calibration?.grid?.enabled ?? true) && (() => {
                    const size = calibration?.grid?.size || 40;
                    const originX = calibration?.grid?.originX || 0;
                    const originY = calibration?.grid?.originY || 0;
                    const lines: React.ReactNode[] = [];
                    for (let x = originX; x <= w; x += size) lines.push(<line key={`gx-${x}`} x1={x} y1={0} x2={x} y2={h} stroke="rgba(148,163,184,0.35)" strokeWidth={1} />);
                    for (let y = originY; y <= h; y += size) lines.push(<line key={`gy-${y}`} x1={0} y1={y} x2={w} y2={y} stroke="rgba(148,163,184,0.35)" strokeWidth={1} />);
                    return <g>{lines}</g>;
                  })()}
                  {/* Robot paths */}
                  {showPaths && robots.map((robot) => {
                    // Example path using current position; apply calibration transform
                    const currentPos = robot.position;
                    const pathPointsRaw = [
                      currentPos,
                      { x: currentPos.x + 50, y: currentPos.y },
                      { x: currentPos.x + 100, y: currentPos.y + 25 },
                    ];
                    const pathPoints = pathPointsRaw.map(p => applyTransform(p.x, p.y));
                    return (
                      <g key={`path-${robot.id}`}>
                        <polyline points={pathPoints.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={getStatusColor(robot.status)} strokeWidth={3} strokeDasharray="6,4" opacity="0.85" />
                        {pathPoints.map((p, i) => (<circle key={`pt-${robot.id}-${i}`} cx={p.x} cy={p.y} r="3" fill={getStatusColor(robot.status)} opacity="0.8" />))}
                      </g>
                    );
                  })}
                  {/* Robots */}
                  {robots.map((robot) => (
                    <g key={`robot-${robot.id}`}>{getRobotIcon(robot)}</g>
                  ))}
                  {/* Editable bounds polygon */}
                  {bounds.length > 1 && (
                    <g>
                      <polygon points={bounds.map(p=>`${p.x},${p.y}`).join(' ')} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeDasharray="6 4" strokeWidth={2} />
                      {bounds.map((p, idx) => (
                        <circle key={`bv-${idx}`} cx={p.x} cy={p.y} r={editBounds ? 6 : 4} fill={editBounds ? '#0ea5e9' : '#94a3b8'} stroke="#0c4a6e"
                          onMouseDown={(e) => { if (!editBounds) return; e.stopPropagation(); setDragVertexIdx(idx); }} />
                      ))}
                    </g>
                  )}
                  {editBounds && (
                    <rect x={0} y={0} width={w} height={h} fill="transparent" onClick={(e) => {
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
                      setBounds(prev => [...prev, { x, y }]);
                    }} />
                  )}
                  {/* Selection highlight */}
                  {selectedRobot && robots.find(r => r.id === selectedRobot) && (
                    <circle cx={robots.find(r => r.id === selectedRobot)!.position.x} cy={robots.find(r => r.id === selectedRobot)!.position.y} r="20" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8,4" className="animate-pulse" />
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* Map Info */}
          <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>Zoom: {Math.round(zoomLevel * 100)}% | Click robots to select</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Live Tracking' : 'Disconnected'}</span>
            </div>
          </div>
          {/* Calibration quick controls */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="mb-1">Scale X</div>
              <Slider min={0.1} max={3} step={0.01} value={[calibration?.transform?.scaleX || 1]} onValueChange={(v) => setCalibration((c: any) => ({ ...(c || { transform: {} }), transform: { ...(c?.transform || {}), scaleX: v[0] } }))} />
              <Input className="mt-1 h-7" type="number" step={0.01} value={calibration?.transform?.scaleX || 1} onChange={(e)=> setCalibration((c:any)=>({...(c||{transform:{}}), transform:{...(c?.transform||{}), scaleX: Number(e.target.value)}}))} />
            </div>
            <div>
              <div className="mb-1">Scale Y</div>
              <Slider min={0.1} max={3} step={0.01} value={[calibration?.transform?.scaleY || 1]} onValueChange={(v) => setCalibration((c: any) => ({ ...(c || { transform: {} }), transform: { ...(c?.transform || {}), scaleY: v[0] } }))} />
              <Input className="mt-1 h-7" type="number" step={0.01} value={calibration?.transform?.scaleY || 1} onChange={(e)=> setCalibration((c:any)=>({...(c||{transform:{}}), transform:{...(c?.transform||{}), scaleY: Number(e.target.value)}}))} />
            </div>
            <div>
              <div className="mb-1">Rotation</div>
              <Slider min={-180} max={180} step={1} value={[calibration?.transform?.rotation || 0]} onValueChange={(v) => setCalibration((c: any) => ({ ...(c || { transform: {} }), transform: { ...(c?.transform || {}), rotation: v[0] } }))} />
              <Input className="mt-1 h-7" type="number" step={1} value={calibration?.transform?.rotation || 0} onChange={(e)=> setCalibration((c:any)=>({...(c||{transform:{}}), transform:{...(c?.transform||{}), rotation: Number(e.target.value)}}))} />
            </div>
            <div>
              <div className="mb-1">Translate X</div>
              <Slider min={-w} max={w} step={1} value={[calibration?.transform?.translateX || 0]} onValueChange={(v) => setCalibration((c: any) => ({ ...(c || { transform: {} }), transform: { ...(c?.transform || {}), translateX: v[0] } }))} />
              <Input className="mt-1 h-7" type="number" step={1} value={calibration?.transform?.translateX || 0} onChange={(e)=> setCalibration((c:any)=>({...(c||{transform:{}}), transform:{...(c?.transform||{}), translateX: Number(e.target.value)}}))} />
            </div>
            <div>
              <div className="mb-1">Translate Y</div>
              <Slider min={-h} max={h} step={1} value={[calibration?.transform?.translateY || 0]} onValueChange={(v) => setCalibration((c: any) => ({ ...(c || { transform: {} }), transform: { ...(c?.transform || {}), translateY: v[0] } }))} />
              <Input className="mt-1 h-7" type="number" step={1} value={calibration?.transform?.translateY || 0} onChange={(e)=> setCalibration((c:any)=>({...(c||{transform:{}}), transform:{...(c?.transform||{}), translateY: Number(e.target.value)}}))} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="flipx" checked={!!calibration?.transform?.flipX} onCheckedChange={(v:any)=> setCalibration((c:any)=> ({...(c||{transform:{}}), transform:{...(c?.transform||{}), flipX: Boolean(v)}}))} />
              <Label htmlFor="flipx">Flip X</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="flipy" checked={!!calibration?.transform?.flipY} onCheckedChange={(v:any)=> setCalibration((c:any)=> ({...(c||{transform:{}}), transform:{...(c?.transform||{}), flipY: Boolean(v)}}))} />
              <Label htmlFor="flipy">Flip Y</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="grid" checked={showGrid} onCheckedChange={(v:any)=> setShowGrid(Boolean(v))} />
              <Label htmlFor="grid">Show Grid</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="bounds" checked={editBounds} onCheckedChange={(v:any)=> setEditBounds(Boolean(v))} />
              <Label htmlFor="bounds">Edit Bounds</Label>
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setCalibration((c: any) => ({ ...(c || {}), transform: { scaleX: 1, scaleY: 1, rotation: 0, translateX: 0, translateY: 0 } }))}>Reset</Button>
              <Button size="sm" onClick={async () => { const payload = { slug: 'default', ...(calibration || {}), transform: { scaleX: calibration?.transform?.scaleX || 1, scaleY: calibration?.transform?.scaleY || 1, rotation: calibration?.transform?.rotation || 0, translateX: calibration?.transform?.translateX || 0, translateY: calibration?.transform?.translateY || 0, flipX: calibration?.transform?.flipX || false, flipY: calibration?.transform?.flipY || false }, grid: calibration?.grid || { enabled: true, size: 40, originX: 0, originY: 0 }, bounds }; const r = await fetch('/api/robotic-fleets/calibration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const j = await r.json(); if (j?.success) { setCalibration(j.data); setBounds(j.data?.bounds || []); toast.success('Calibration saved'); } else { toast.error('Failed to save'); } }}>Save Calibration</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Robot Details Panel */}
      {selectedRobot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {robots.find(r => r.id === selectedRobot)?.name} Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const robot = robots.find(r => r.id === selectedRobot);
              if (!robot) return null;
              
              return (
                <div className="space-y-4">
                  {/* Robot Header with Image */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src="/servi.webp"
                          alt="Servi Robot"
                          width={64}
                          height={64}
                          className="rounded-lg object-cover"
                        />
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${getStatusColor(robot.status)} border-2 border-white`}></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{robot.name}</h3>
                        <p className="text-sm text-muted-foreground">{robot.id}</p>
                        <Badge style={{ backgroundColor: getStatusColor(robot.status) }} className="text-white text-xs mt-1">
                          {robot.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Compact Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Battery & Signal */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <h4 className="font-medium text-sm">Systems</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Battery className="h-4 w-4 text-green-600" />
                        <span>Battery: {robot.battery}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wifi className="h-4 w-4 text-blue-600" />
                        <span>Signal: {robot.signal}%</span>
                      </div>
                    </div>

                    {/* Location & Task */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                      <h4 className="font-medium text-sm">Location & Task</h4>
                      {robot.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="truncate">{robot.location}</span>
                        </div>
                      )}
                      {robot.destination && (
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4 text-blue-600" />
                          <span className="truncate">→ {robot.destination}</span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground truncate">Task: {robot.task}</p>
                    </div>
                  </div>

                  {/* Position Info */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Map Position (Simulated):</span>
                      <span>({Math.round(robot.position.x)}, {Math.round(robot.position.y)}) • {robot.heading || 0}°</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Fleet Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">Charging</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Idle</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}