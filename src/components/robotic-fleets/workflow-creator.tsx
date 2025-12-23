"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Plus,
  Trash2,
  Save,
  Upload,
  Download,
  Copy,
  RotateCcw,
  Timer,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import FloorMap from "@/components/hostpro/FloorMap";
import { getPreset } from "@/lib/host/presets";

// Robot colors for visualization
const robotColors = [
  "#22c55e", // Green - Bear Alpha
  "#3b82f6", // Blue - Bear Beta  
  "#8b5cf6", // Purple - Bear Gamma
  "#f59e0b", // Orange - Bear Delta
  "#ef4444", // Red - Bear Echo
];

const robotNames = ["Bear Alpha", "Bear Beta", "Bear Gamma", "Bear Delta", "Bear Echo"];

// Reuse HostPro floor layout for workflow map

interface Keyframe {
  id: string;
  time: number; // seconds
  robots: {
    id: number;
    x: number;
    y: number;
    action: string; // 'move', 'wait', 'charge', 'clean', etc.
    duration: number; // seconds for this action
  }[];
}

export default function WorkflowCreator() {
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [keyframes, setKeyframes] = useState<Keyframe[]>([
    {
      id: "frame-0",
      time: 0,
      robots: [
        { id: 0, x: 100, y: 300, action: "wait", duration: 5 },
        { id: 1, x: 100, y: 300, action: "wait", duration: 5 },
        { id: 2, x: 100, y: 300, action: "wait", duration: 5 },
        { id: 3, x: 275, y: 300, action: "wait", duration: 5 },
        { id: 4, x: 500, y: 320, action: "wait", duration: 5 },
      ]
    }
  ]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedRobot, setSelectedRobot] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [zoomLevel] = useState(0.8);
  const [layoutData, setLayoutData] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const mapRef = useRef<SVGSVGElement | null>(null);

  const totalDuration = keyframes.length > 0 ? 
    Math.max(...keyframes.map(kf => kf.time + Math.max(...kf.robots.map(r => r.duration)))) : 0;

  const addKeyframe = () => {
    const lastFrame = keyframes[keyframes.length - 1];
    const newTime = lastFrame ? lastFrame.time + 10 : 0; // 10 second increment
    
    const newKeyframe: Keyframe = {
      id: `frame-${keyframes.length}`,
      time: newTime,
      robots: lastFrame ? 
        lastFrame.robots.map(r => ({ ...r, action: "move", duration: 5 })) :
        robotNames.map((_, index) => ({ 
          id: index, 
          x: 100 + index * 50, 
          y: 300, 
          action: "wait", 
          duration: 5 
        }))
    };
    
    setKeyframes([...keyframes, newKeyframe]);
    setCurrentFrame(keyframes.length);
  };

  const deleteKeyframe = (frameIndex: number) => {
    if (keyframes.length > 1) {
      const newKeyframes = keyframes.filter((_, index) => index !== frameIndex);
      setKeyframes(newKeyframes);
      setCurrentFrame(Math.min(currentFrame, newKeyframes.length - 1));
    }
  };

  const updateRobotPosition = (robotId: number, x: number, y: number) => {
    const newKeyframes = [...keyframes];
    const robot = newKeyframes[currentFrame].robots.find(r => r.id === robotId);
    if (robot) {
      robot.x = x;
      robot.y = y;
      setKeyframes(newKeyframes);
    }
  };

  const updateRobotAction = (robotId: number, action: string, duration: number) => {
    const newKeyframes = [...keyframes];
    const robot = newKeyframes[currentFrame].robots.find(r => r.id === robotId);
    if (robot) {
      robot.action = action;
      robot.duration = duration;
      setKeyframes(newKeyframes);
    }
  };

  const handleMapClick = (event: React.MouseEvent<SVGElement>) => {
    if (selectedRobot === null) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / zoomLevel);
    const y = ((event.clientY - rect.top) / zoomLevel);
    
    updateRobotPosition(selectedRobot, x, y);
  };

  const getRobotTrajectory = (robotId: number) => {
    const points = keyframes
      .map((kf) => {
        const robot = kf.robots.find((r) => r.id === robotId);
        return robot ? { x: robot.x, y: robot.y, time: kf.time } : null;
      })
      .filter((p): p is { x: number; y: number; time: number } => Boolean(p));
    return points;
  };

  const exportWorkflow = () => {
    const workflow = {
      name: workflowName,
      keyframes,
      totalDuration,
      created: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentKeyframe = keyframes[currentFrame];

  // Load latest HostPro layout for consistent map
  useEffect(() => {
    (async () => {
      try { const r = await fetch('/api/hostpro/scan-layout'); const j = await r.json(); if (j?.success) setLayoutData(j.data || null); } catch {}
    })();
  }, []);

  // Observe container width to auto-fit map and avoid cropping
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

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
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Workflow Creator</CardTitle>
              <CardDescription>Design custom robot workflows using keyframe animation</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={exportWorkflow}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-1" />
                Deploy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </div>
            <div>
              <Label>Total Duration</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{totalDuration}s</span>
              </div>
            </div>
            <div>
              <Label>Keyframes</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline">{keyframes.length} frames</Badge>
                <Button size="sm" variant="outline" onClick={addKeyframe}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline and Playback Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline & Playback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center justify-center space-x-2">
              <Button size="sm" variant="outline">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="outline">
                <Square className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <SkipForward className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2 ml-4">
                <Label className="text-sm">Speed:</Label>
                <Select value={playbackSpeed.toString()} onValueChange={(v) => setPlaybackSpeed(Number(v))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.25">0.25x</SelectItem>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Keyframe Timeline */}
            <div className="space-y-2">
              <Label>Keyframes Timeline</Label>
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {keyframes.map((keyframe, index) => (
                  <div key={keyframe.id} className="flex-shrink-0">
                    <Button
                      variant={currentFrame === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentFrame(index)}
                      className="relative"
                    >
                      <span className="mr-2">{index}</span>
                      <span className="text-xs">{keyframe.time}s</span>
                      {keyframes.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute -top-2 -right-2 h-4 w-4 p-0 hover:bg-red-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteKeyframe(index);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addKeyframe}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Current Frame Info */}
            {currentKeyframe && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Frame {currentFrame}</Label>
                  <p className="text-sm text-muted-foreground">Time: {currentKeyframe.time}s</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Frame Duration</Label>
                  <Input
                    type="number"
                    value={currentKeyframe.time}
                    onChange={(e) => {
                      const newKeyframes = [...keyframes];
                      newKeyframes[currentFrame].time = Number(e.target.value);
                      setKeyframes(newKeyframes);
                    }}
                    className="mt-1"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Workflow Map</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowTrajectories(!showTrajectories)}
                  >
                    {showTrajectories ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    Paths
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={containerRef} className="border rounded-lg bg-gray-50 dark:bg-gray-900">
                {(() => {
                  const scale = Math.max(0.1, Math.min(3, (containerWidth || w) / w));
                  return (
                    <div className="relative" style={{ height: h * scale }}>
                      <div className="absolute inset-0 flex justify-center">
                        <div style={{ width: w * scale, height: h * scale, position: 'relative' }}>
                          <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative' }}>
                            <FloorMap preset={preset as any} showDomains={false} walls={layoutData?.walls} labels={layoutData?.labels} />
                            <svg
                              ref={mapRef}
                              width={w}
                              height={h}
                              className="block cursor-crosshair"
                              viewBox={`0 0 ${w} ${h}`}
                              onClick={handleMapClick}
                              style={{ position: 'absolute', inset: 0 }}
                            >

                  {/* Robot trajectories */}
                  {showTrajectories && robotNames.map((_, robotId) => {
                    const trajectory = getRobotTrajectory(robotId);
                    if (trajectory.length < 2) return null;
                    
                    return (
                      <g key={`trajectory-${robotId}`}>
                        <polyline
                          points={trajectory.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke={robotColors[robotId]}
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          opacity="0.6"
                        />
                        {trajectory.map((point, index) => (
                          <circle
                            key={`traj-${robotId}-${index}`}
                            cx={point.x}
                            cy={point.y}
                            r="2"
                            fill={robotColors[robotId]}
                            opacity="0.8"
                          />
                        ))}
                      </g>
                    );
                  })}

                  {/* Current frame robots */}
                  {currentKeyframe && currentKeyframe.robots.map((robot) => (
                    <g key={robot.id}>
                      <circle
                        cx={robot.x}
                        cy={robot.y}
                        r={selectedRobot === robot.id ? 16 : 12}
                        fill={robotColors[robot.id]}
                        stroke={selectedRobot === robot.id ? "#f59e0b" : "#ffffff"}
                        strokeWidth={selectedRobot === robot.id ? 3 : 2}
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRobot(robot.id);
                        }}
                      />
                      <text
                        x={robot.x}
                        y={robot.y + 24}
                        textAnchor="middle"
                        className="text-xs font-medium fill-foreground pointer-events-none"
                      >
                        {robotNames[robot.id].split(' ')[1]}
                      </text>
                    </g>
                  ))}
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground">
                Click on a robot to select it, then click on the map to move it. Selected: {
                  selectedRobot !== null ? robotNames[selectedRobot] : "None"
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Robot Control Panel */}
        <div className="space-y-4">
          {/* Robot Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Robot Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {robotNames.map((name, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRobot === index ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedRobot(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: robotColors[index] }}
                      ></div>
                      <span className="font-medium">{name}</span>
                    </div>
                    {selectedRobot === index && (
                      <Badge variant="secondary">Selected</Badge>
                    )}
                  </div>
                  
                  {currentKeyframe && (
                    <div className="mt-2 space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Position: ({currentKeyframe.robots[index].x}, {currentKeyframe.robots[index].y})
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Action</Label>
                        <Select
                          value={currentKeyframe.robots[index].action}
                          onValueChange={(action) => updateRobotAction(index, action, currentKeyframe.robots[index].duration)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="move">Move</SelectItem>
                            <SelectItem value="wait">Wait</SelectItem>
                            <SelectItem value="clean">Clean</SelectItem>
                            <SelectItem value="charge">Charge</SelectItem>
                            <SelectItem value="patrol">Patrol</SelectItem>
                            <SelectItem value="deliver">Deliver</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Duration (s)</Label>
                        <Input
                          type="number"
                          value={currentKeyframe.robots[index].duration}
                          onChange={(e) => updateRobotAction(index, currentKeyframe.robots[index].action, Number(e.target.value))}
                          className="h-8"
                          min="1"
                          max="300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy Frame
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Positions
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                Auto-Generate Path
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}