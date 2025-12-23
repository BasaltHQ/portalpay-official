"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Save, FolderOpen, Trash2, Wand2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";


// GraphQL mutations removed - using mock implementations for roster operations

type Stratum = "ADMIN" | "BOH" | "FOH";
type Candidate = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  roles: string[];
  department?: string;
  toastEnrolled: boolean;
  sevenShiftsEnrolled: boolean;
  rating: number;
}

type SelectedCandidate = {
  id: string;
  name: string;
  role: string;
  rating: number;
  department?: string;
}

interface RosterHUDProps {
  ratings: { byDepartment: { department: string; rating: number }[]; overall: number };
  candidatesCount: number;
  required: number;
  onRequiredChange: (value: number) => void;
  onAutopopulate: () => void;
  onAutoconfigure: () => void;
  onFill: () => void;
  onSave: (data: { name: string; rosterDate: Date; shift: string }) => void;
  onUpdate?: () => void;
  onLoad: (id: string) => void;
  onDelete?: () => void;
  savedRosters: any[];
  configurations?: any[];
  activeConfiguration?: any;
  onSetConfigName?: () => void;
  onSetActive?: () => void;
  onPresetChange?: () => void;
}
type Assignment = { userId: string; source: "TOAST" | "SEVEN_SHIFTS"; displayName?: string; rating?: number; };
type Node = { id: string; name: string; department: string; stratum: Stratum; capacity: number; assigned: Assignment[]; children?: Node[]; };

const PRESETS: { key: string; name: string; description: string; nodes: Node[] }[] = [
  {
    key: "classic",
    name: "Classic Full-Service",
    description: "Admin, Back of House, Front of House",
    nodes: [
      { id: "admin_mgr", name: "General Manager", department: "Admin", stratum: "ADMIN", capacity: 1, assigned: [] },
      { id: "boh", name: "Back of House", department: "Kitchen", stratum: "BOH", capacity: 0, assigned: [], children: [
        { id: "chef", name: "Chef", department: "Kitchen", stratum: "BOH", capacity: 1, assigned: [] },
        { id: "line", name: "Line Cooks", department: "Kitchen", stratum: "BOH", capacity: 3, assigned: [] },
        { id: "prep", name: "Prep", department: "Kitchen", stratum: "BOH", capacity: 2, assigned: [] }
      ]},
      { id: "foh", name: "Front of House", department: "Front of House", stratum: "FOH", capacity: 0, assigned: [], children: [
        { id: "host", name: "Hosts", department: "Front of House", stratum: "FOH", capacity: 2, assigned: [] },
        { id: "server", name: "Servers", department: "Front of House", stratum: "FOH", capacity: 5, assigned: [] },
        { id: "bar", name: "Bartenders", department: "Front of House", stratum: "FOH", capacity: 2, assigned: [] }
      ]}
    ]
  },
  {
    key: "fast_casual",
    name: "Fast Casual",
    description: "Lean BOH and FOH",
    nodes: [
      { id: "admin_shift", name: "Shift Lead", department: "Admin", stratum: "ADMIN", capacity: 1, assigned: [] },
      { id: "boh_fc", name: "Kitchen", department: "Kitchen", stratum: "BOH", capacity: 0, assigned: [], children: [
        { id: "cook", name: "Cooks", department: "Kitchen", stratum: "BOH", capacity: 3, assigned: [] },
        { id: "dish", name: "Dish", department: "Kitchen", stratum: "BOH", capacity: 1, assigned: [] }
      ]},
      { id: "foh_fc", name: "FOH", department: "Front of House", stratum: "FOH", capacity: 0, assigned: [], children: [
        { id: "cash", name: "Cashiers", department: "Front of House", stratum: "FOH", capacity: 2, assigned: [] },
        { id: "runner", name: "Runners", department: "Front of House", stratum: "FOH", capacity: 2, assigned: [] }
      ]}
    ]
  }
];

function flattenNodes(nodes: Node[]): Node[] {
  const list: Node[] = [];
  const walk = (n: Node) => { list.push(n); (n.children || []).forEach(walk); };
  nodes.forEach(walk);
  return list;
}

function computeRatings(nodes: Node[]) {
  const flat = flattenNodes(nodes);
  const deptMap: Record<string, { sum: number; count: number }> = {};
  let total = 0, count = 0;
  flat.forEach(n => {
    const r = n.assigned.reduce((acc, a) => acc + (a.rating || 0), 0);
    const c = n.assigned.length;
    if (!deptMap[n.department]) deptMap[n.department] = { sum: 0, count: 0 };
    deptMap[n.department].sum += r; deptMap[n.department].count += c;
    total += r; count += c;
  });
  const byDepartment = Object.entries(deptMap).map(([department, v]) => ({ department, rating: v.count ? (v.sum / v.count) : 0 }));
  const overall = count ? (total / count) : 0;
  return { byDepartment, overall };
}

function RosterHUD(props: RosterHUDProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [rosterName, setRosterName] = useState("");
  const [rosterDate, setRosterDate] = useState(new Date());
  const [shift, setShift] = useState("Lunch");
  const [shifts, setShifts] = useState(["Breakfast", "Lunch", "Dinner"]);
  const [newShift, setNewShift] = useState("");

  const handleSave = () => {
    props.onSave({ name: rosterName, rosterDate, shift });
    setSaveDialogOpen(false);
  };
  
  const handleAddShift = () => {
    if (newShift && !shifts.includes(newShift)) {
      setShifts([...shifts, newShift]);
      setNewShift("");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap bg-card border p-3 rounded-lg">
      <div className="flex items-center gap-4">
        {/* Overall Rating, Available, Required */}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={props.onAutoconfigure}>
          <Wand2 className="mr-2 h-4 w-4" />
          Auto-Configure
        </Button>
        <Button
          onClick={props.onAutopopulate}
          className="bg-gradient-to-r from-purple to-pink text-purple-foreground hover:from-purple hover:to-pink"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Autopopulate
        </Button>
        <Button onClick={props.onFill}>
          <UserPlus className="mr-2 h-4 w-4" />
          Fill Selected
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Manage Rosters</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Saved Rosters</h4>
              <Command>
                {props.savedRosters.map((r: any) => (
                  <CommandItem key={r.id} onSelect={() => props.onLoad(r.id)}>
                    {r.name} ({new Date(r.rosterDate).toLocaleDateString()} - {r.shift})
                  </CommandItem>
                ))}
              </Command>
              <Button onClick={() => setSaveDialogOpen(true)} className="w-full">
                <Save className="mr-2 h-4 w-4" /> Save Current Roster
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Roster</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Roster Name (e.g., Friday Night Rush)" value={rosterName} onChange={e => setRosterName(e.target.value)} />
              <Input type="date" value={rosterDate.toISOString().split('T')[0]} onChange={e => setRosterDate(new Date(e.target.value))} />
              <div className="flex gap-2">
                <Select value={shift} onValueChange={setShift}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift..." />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="New shift name..." value={newShift} onChange={e => setNewShift(e.target.value)} />
                <Button onClick={handleAddShift}>Add</Button>
              </div>
              <Button onClick={handleSave} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

type CandidateCardProps = {
  candidate: Candidate;
  onDragStart: (e: React.DragEvent, candidate: Candidate) => void;
  onSelect: (candidate: Candidate, isSelected: boolean) => void;
  onRoleSelect: (candidate: Candidate, role: string) => void;
  isSelected: boolean;
  selectedRole?: string;
};

function CandidateCard({ candidate, onDragStart, onSelect, onRoleSelect, isSelected, selectedRole }: CandidateCardProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox 
        id={`cand-${candidate.id}`}
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(candidate, !!checked)}
      />
      <label htmlFor={`cand-${candidate.id}`} className="flex-1">
        <div draggable onDragStart={(e) => onDragStart(e, candidate)} className="p-2 border rounded bg-background hover:bg-accent/30 transition">
          <div className="flex items-center justify-between">
            <div className="font-medium">{candidate.name}</div>
            <div className="flex items-center gap-2">
              <div title="Toast" className={`w-2.5 h-2.5 rounded-full ${candidate.toastEnrolled ? 'bg-green-500' : 'bg-gray-400'}`} />
              <Badge variant="secondary">{(candidate.rating || 0).toFixed(1)}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {(candidate.roles || []).map(role => {
              const isRoleSelected = selectedRole === role;
              return (
                <Badge 
                  key={role}
                  variant={isRoleSelected ? "default" : "outline"}
                  onClick={() => onRoleSelect(candidate, role)}
                  className="cursor-pointer"
                >
                  {role}
                </Badge>
              );
            })}
          </div>
        </div>
      </label>
    </div>
  );
}


export default function RosterPanel() {
  const [onlySevenShifts, setOnlySevenShifts] = useState(false); // Disabled since we're using seeded data
  const [includeToastOnly, setIncludeToastOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESETS[0].key);
  const [nodes, setNodes] = useState<Node[]>(PRESETS[0].nodes);
  const [configName, setConfigName] = useState("");
  const [requiredMembers, setRequiredMembers] = useState(10);
  const [selectedCandidates, setSelectedCandidates] = useState<SelectedCandidate[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch seeded team members from database
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/team-members');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Transform TeamMember data to Candidate format
            const transformedCandidates: Candidate[] = data.data.map((member: any) => ({
              id: member._id,
              name: member.name,
              email: member.email,
              role: member.role,
              roles: [member.role], // Convert single role to array
              department: member.department,
              toastEnrolled: !!member.toastId, // Check if they have a toastId
              sevenShiftsEnrolled: false, // Seeded users don't have 7shifts integration
              rating: member.performance?.rating || 0
            }));
            setCandidates(transformedCandidates);
          }
        }
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        toast.error('Failed to load team members');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleSelectCandidate = (candidate: Candidate, isSelected: boolean) => {
    setSelectedCandidates(prev => {
      if (isSelected) {
        if (!prev.find(c => c.id === candidate.id)) {
          return [...prev, { id: candidate.id, name: candidate.name, role: candidate.role || 'N/A', rating: candidate.rating || 0, department: candidate.department }];
        }
      } else {
        return prev.filter(c => c.id !== candidate.id);
      }
      return prev;
    });
  };

  const handleSelectCandidateRole = (candidate: Candidate, role: string) => {
    setSelectedCandidates(prev => {
      const isCurrentlySelected = prev.some(c => c.id === candidate.id);
      if (!isCurrentlySelected) {
        toast.info("Please select the candidate with the checkbox before assigning a role.");
        return prev;
      }
      return prev.map(c => c.id === candidate.id ? { ...c, role } : c);
    });
  };

  // Mock data for roster configurations since we're not using GraphQL
  const configurations: any[] = [];
  const active = null;
  const savedRosters: any[] = [];
  const roleMappings = [];

  const refetch = useCallback(() => {
    // Since we're using direct database access, we don't need to refetch
    // The useEffect will handle data loading
  }, []);

  // Mock implementations for roster operations (since no GraphQL backend)
  const createRoster = async () => { toast.success("Roster configuration saved (mock)"); };
  const updateRoster = async () => { toast.success("Roster updated (mock)"); };
  const setActive = async () => { toast.success("Active roster set (mock)"); };
  const saveRoster = async () => { toast.success("Roster saved (mock)"); };
  const updateRoleMapping = async () => { toast.success("Role mapping updated (mock)"); };

  useEffect(() => {
    const preset = PRESETS.find(p => p.key === selectedPreset);
    if (preset) setNodes(JSON.parse(JSON.stringify(preset.nodes)) as Node[]);
  }, [selectedPreset]);

  const onDragStart = useCallback((e: React.DragEvent, cand: Candidate) => {
    e.dataTransfer.setData("application/json", JSON.stringify(cand));
  }, []);

  const onDropOnNode = useCallback((e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    const cand: Candidate = JSON.parse(e.dataTransfer.getData("application/json"));
    setNodes(prev => {
      const clone: Node[] = JSON.parse(JSON.stringify(prev));
      const all = flattenNodes(clone);
      const node = all.find(n => n.id === nodeId);
      if (!node) return prev;
      if (node.capacity && node.assigned.length >= node.capacity) { toast.error("Capacity reached for this node"); return prev; }
      if (node.assigned.some(a => a.userId === cand.id)) return prev;
      node.assigned.push({ userId: cand.id, source: cand.sevenShiftsEnrolled ? "SEVEN_SHIFTS" : "TOAST", displayName: cand.name, rating: cand.rating || 0 });
      return clone;
    });
  }, []);

  const onRemoveFromNode = useCallback((nodeId: string, userId: string) => {
    setNodes(prev => {
      const clone: Node[] = JSON.parse(JSON.stringify(prev));
      const all = flattenNodes(clone);
      const node = all.find(n => n.id === nodeId);
      if (!node) return prev;
      node.assigned = node.assigned.filter(a => a.userId !== userId);
      return clone;
    });
  }, []);

  const ratings = useMemo(() => computeRatings(nodes), [nodes]);

  const handleAutopopulate = useCallback(() => {
    // Greedy Algorithm Implementation
    let available = [...candidates];
    let filledNodes = JSON.parse(JSON.stringify(nodes));
    let flatNodes = flattenNodes(filledNodes);

    flatNodes.forEach(node => node.assigned = []); // Clear existing assignments

    flatNodes.sort((a, b) => a.capacity - b.capacity); // Prioritize filling smaller capacity slots first

    flatNodes.forEach(node => {
      if (node.capacity > 0) {
        for (let i = 0; i < node.capacity; i++) {
          let bestCandidateIndex = -1;
          let bestCandidateRating = -1;

          available.forEach((cand, idx) => {
            const roleMatch = cand.role && (node.name.toLowerCase().includes(cand.role.toLowerCase()) || cand.role.toLowerCase().includes(node.name.toLowerCase()));
            if (roleMatch && (cand.rating || 0) > bestCandidateRating) {
              bestCandidateRating = cand.rating || 0;
              bestCandidateIndex = idx;
            }
          });

          if (bestCandidateIndex !== -1) {
            const bestCandidate = available.splice(bestCandidateIndex, 1)[0];
            node.assigned.push({
              userId: bestCandidate.id,
              source: bestCandidate.sevenShiftsEnrolled ? 'SEVEN_SHIFTS' : 'TOAST',
              displayName: bestCandidate.name,
              rating: bestCandidate.rating
            });
          }
        }
      }
    });

    setNodes(filledNodes);
    toast.success("Roster autopopulated!");
  }, [candidates, nodes]);

  const handleSaveRoster = async (saveData: { name: string, rosterDate: Date, shift: string }) => {
    await saveRoster();
    // Since we don't have persistent storage, just show success message
  };
  
  const handleLoadRoster = (rosterId: string) => {
    const rosterToLoad = savedRosters.find(r => r.id === rosterId);
    if (rosterToLoad) {
      setNodes(rosterToLoad.nodes);
      toast.success(`Loaded "${rosterToLoad.name}"`);
    }
  };

  const handleSave = async () => {
    if (!configName.trim()) { toast.error("Please enter a name for the configuration"); return; }
    await createRoster();
    setConfigName("");
  };

  const handleSetActive = async (id: string) => { await setActive(); };

  const handleAutoconfigure = useCallback(() => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate to autoconfigure.");
      return;
    }

    const departments = selectedCandidates.reduce((acc, cand) => {
      // Simple mapping based on seeded data - no external role mappings needed
      const dept = cand.department || 'Unassigned';
      const stratum = dept === 'Kitchen' ? 'BOH' : dept === 'Management' ? 'ADMIN' : 'FOH';
      const standardRole = cand.role;

      if (!acc[dept]) {
        acc[dept] = { stratum, roles: {} };
      }
      acc[dept].roles[standardRole] = (acc[dept].roles[standardRole] || 0) + 1;
      return acc;
    }, {} as Record<string, { stratum: Stratum, roles: Record<string, number> }>);

    const newNodes: Node[] = Object.entries(departments).map(([dept, { stratum, roles }]) => ({
      id: `${dept.toLowerCase().replace(/\s/g, '_')}_autoconfig`,
      name: dept,
      department: dept,
      stratum,
      capacity: 0,
      assigned: [],
      children: Object.entries(roles).map(([role, count]) => ({
        id: `${dept.toLowerCase()}_${role.toLowerCase().replace(/\s/g, '_')}`,
        name: role,
        department: dept,
        stratum,
        capacity: count,
        assigned: [],
      }))
    }));

    setNodes(newNodes);
    toast.success("Roster autoconfigured based on your selection!");
  }, [selectedCandidates]);

  const handleFillSelected = useCallback(() => {
    if (selectedCandidates.length === 0) {
      toast.error("Please select candidates to fill the roster.");
      return;
    }

    let filledNodes = JSON.parse(JSON.stringify(nodes));
    let flatNodes = flattenNodes(filledNodes);

    selectedCandidates.forEach(cand => {
      const targetNode = flatNodes.find(n => n.name === cand.role);
      if (targetNode && targetNode.assigned.length < targetNode.capacity) {
        if (!targetNode.assigned.some(a => a.userId === cand.id)) {
          targetNode.assigned.push({
            userId: cand.id,
            source: 'SEVEN_SHIFTS', // This is a simplification
            displayName: cand.name,
            rating: cand.rating 
          });
        }
      }
    });

    setNodes(filledNodes);
    toast.success("Filled roster with selected candidates!");
  }, [selectedCandidates, nodes]);

  const unique7ShiftsRoles = useMemo(() => {
    const roles = new Set<string>();
    candidates.forEach(c => (c.roles || []).forEach(r => roles.add(r)));
    return Array.from(roles);
  }, [candidates]);

  const handleMappingChange = (
    sevenShiftsRoleName: string,
    field: 'standardRoleName' | 'department' | 'stratum',
    value: string
  ) => {
    // Since we're not using external role mappings, just show a success message
    toast.success(`Role mapping updated (mock): ${sevenShiftsRoleName} -> ${field}: ${value}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            Using Seeded Database Users
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Select preset" /></SelectTrigger>
            <SelectContent>
              {PRESETS.map(p => (<SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Input placeholder="Configuration name" value={configName} onChange={(e) => setConfigName(e.target.value)} className="w-[240px]" />
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </div>

      <RosterHUD
        ratings={ratings}
        candidatesCount={candidates.length}
        required={requiredMembers}
        onRequiredChange={setRequiredMembers}
        onAutopopulate={handleAutopopulate}
        onAutoconfigure={handleAutoconfigure}
        onFill={handleFillSelected}
        onSave={handleSaveRoster}
        onLoad={handleLoadRoster}
        savedRosters={savedRosters}
        configurations={configurations}
        activeConfiguration={active}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-max gap-2 flex-nowrap">
            <TabsTrigger value="list" className="flex-none">List View</TabsTrigger>
            <TabsTrigger value="tree" className="flex-none">Squad View</TabsTrigger>
            <TabsTrigger value="mapping" className="flex-none">Role Mapping</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Role Mapping</CardTitle>
              <CardDescription>Map team member roles to departments and strata for roster planning.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Get unique roles from our seeded candidates */}
              {Array.from(new Set(candidates.map(c => c.role).filter(Boolean) as string[])).map(role => {
                const candidate = candidates.find(c => c.role === role);
                const department = candidate?.department || 'Unknown';

                return (
                  <div key={role} className="flex items-center gap-4 p-2 border-b">
                    <div className="w-1/4 font-medium">{role}</div>
                    <div className="w-1/4">
                      <Input
                        defaultValue={role}
                        placeholder="Standard Role"
                        onBlur={(e) => handleMappingChange(role, 'standardRoleName', e.target.value)}
                      />
                    </div>
                    <div className="w-1/4">
                      <Input defaultValue={department} placeholder="Department" onBlur={(e) => handleMappingChange(role, 'department', e.target.value)} />
                    </div>
                    <div className="w-1/4">
                      <Select defaultValue={department === 'Kitchen' ? 'BOH' : department === 'Management' ? 'ADMIN' : 'FOH'} onValueChange={(v) => handleMappingChange(role, 'stratum', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Stratum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="BOH">Back of House</SelectItem>
                          <SelectItem value="FOH">Front of House</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {candidates.map(c => (
                  <CandidateCard 
                    key={c.id}
                    candidate={c}
                    onDragStart={onDragStart}
                    onSelect={handleSelectCandidate}
                    onRoleSelect={handleSelectCandidateRole}
                    isSelected={selectedCandidates.some(sc => sc.id === c.id)}
                    selectedRole={selectedCandidates.find(sc => sc.id === c.id)?.role}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>By Department</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flattenNodes(nodes).filter(n => !n.children || n.children.length === 0).map(n => {
                  const deptRating = ratings.byDepartment.find(d => d.department === n.department)?.rating || 0;
                  return (
                    <div key={n.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropOnNode(e, n.id)} className="p-3 rounded min-h-[100px] border bg-gradient-to-br from-slate-900/10 via-slate-700/10 to-slate-500/10">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{n.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{deptRating.toFixed(2)}</Badge>
                          <Badge variant="outline">{n.assigned.length}/{n.capacity || '∞'}</Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{n.department} • {n.stratum}</div>
                      <div className="flex flex-wrap gap-2">
                        {n.assigned.map(a => (
                          <Badge key={a.userId} className="gap-1 cursor-pointer" onClick={() => onRemoveFromNode(n.id, a.userId)}>
                            {a.displayName || a.userId} <span className="opacity-60">({(a.rating || 0).toFixed(1)})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tree">
          {/* FIFA-style squad board: strata lanes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Squad List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {candidates.map(c => (
                  <CandidateCard 
                    key={c.id}
                    candidate={c}
                    onDragStart={onDragStart}
                    onSelect={handleSelectCandidate}
                    onRoleSelect={handleSelectCandidateRole}
                    isSelected={selectedCandidates.some(sc => sc.id === c.id)}
                    selectedRole={selectedCandidates.find(sc => sc.id === c.id)?.role}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Formation Board</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg p-4 bg-gradient-to-b from-emerald-900/30 via-emerald-800/20 to-emerald-700/10 border border-emerald-900/20">
                  <div className="grid gap-4">
                    {/* Admin lane */}
                    <Lane title="Admin" color="from-yellow-400/20" nodes={flattenNodes(nodes).filter(n => n.stratum==='ADMIN')} ratings={ratings} onDrop={onDropOnNode} onRemove={onRemoveFromNode} />
                    {/* BOH lane */}
                    <Lane title="Back of House" color="from-blue-400/20" nodes={flattenNodes(nodes).filter(n => n.stratum==='BOH')} ratings={ratings} onDrop={onDropOnNode} onRemove={onRemoveFromNode} />
                    {/* FOH lane */}
                    <Lane title="Front of House" color="from-pink-400/20" nodes={flattenNodes(nodes).filter(n => n.stratum==='FOH')} ratings={ratings} onDrop={onDropOnNode} onRemove={onRemoveFromNode} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Select onValueChange={(id) => handleSetActive(id)}>
              <SelectTrigger className="w-[280px]"><SelectValue placeholder="Set active configuration" /></SelectTrigger>
              <SelectContent>
                {configurations.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.id === active ? '(Active)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Lane({ title, color, nodes, ratings, onDrop, onRemove }: { title: string; color: string; nodes: Node[]; ratings: any; onDrop: (e: React.DragEvent, id: string) => void; onRemove: (nodeId: string, userId: string) => void; }) {
  return (
    <div className={`rounded-md p-3 bg-gradient-to-r ${color} via-transparent to-transparent border border-white/10`}>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="grid md:grid-cols-3 gap-3">
        {nodes.map(n => {
          const deptRating = ratings.byDepartment.find((d: { department: string; rating: number }) => d.department === n.department)?.rating || 0;
          return (
            <div key={n.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, n.id)} className="p-3 rounded min-h-[90px] border bg-background/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate" title={n.name}>{n.name}</div>
                  <Badge variant="outline">{n.assigned.length}/{n.capacity || '∞'}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-2 truncate">{n.department}</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                {n.assigned.map(a => (
                  <Badge key={a.userId} className="gap-1 cursor-pointer" onClick={() => onRemove(n.id, a.userId)}>
                    {a.displayName || a.userId} <span className="opacity-60">({(a.rating || 0).toFixed(1)})</span>
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


