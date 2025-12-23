"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FloorPreset } from '@/lib/host/types';
import { DndContext, DragEndEvent, useDraggable, useDroppable, rectIntersection } from '@dnd-kit/core';

export default function AssignSplitPane({
  preset,
  servers,
  assignments,
  onChange,
  onAuto,
  onSubmit,
}: {
  preset: FloorPreset;
  servers: Array<{ id: string; name: string; role?: string; range?: string; isActive?: boolean }>;
  assignments: Array<{ serverId: string; domainIds: string[] }>;
  onChange: (assignments: Array<{ serverId: string; domainIds: string[] }>) => void;
  onAuto?: () => void;
  onSubmit?: (assignments: Array<{ serverId: string; domainIds: string[] }>) => void;
}) {
  const [local, setLocal] = useState(assignments);
  useEffect(() => setLocal(assignments), [assignments]);

  const serverById = useMemo(() => new Map(local.map(a => [a.serverId, a])), [local]);
  const assignedTo = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of local) for (const d of a.domainIds || []) map.set(d, String(a.serverId));
    return map;
  }, [local]);
  const domainById = useMemo(() => new Map((preset.domains || []).map(d => [d.id, d])), [preset.domains]);
  function moveDomain(domainId: string, serverId: string) {
    // Normalize droppable id to base server id (strip shift suffix if present)
    const baseServerId = String(serverId).split('::')[0];
    const next = local.map(a => ({ ...a, domainIds: a.domainIds.filter(d => d !== domainId) }));
    let target = next.find(a => a.serverId === baseServerId);
    if (!target) { (next as any).push({ serverId: baseServerId, domainIds: [] }); target = next[next.length - 1]; }
    target.domainIds = Array.from(new Set([...(target.domainIds || []), domainId]));
    setLocal(next);
    onChange(next);
  }

  function handleDragEnd(e: DragEndEvent) {
    const domainId = String(e?.active?.id || '');
    const serverId = String((e?.over as any)?.id || '');
    if (domainId && serverId) moveDomain(domainId, serverId);
  }

  const unassignedDomainIds = new Set<string>();
  for (const d of (preset.domains || [])) unassignedDomainIds.add(d.id);
  for (const a of local) for (const id of (a.domainIds || [])) unassignedDomainIds.delete(id);

  // Split team by role. Show all shift cards regardless of active status.
  const serversOnly = servers.filter(s => ((s.role || 'Server') === 'Server'));
  const bartendersOnly = servers.filter(s => ((s.role || '').includes('Bartender')));

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={rectIntersection}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Servers */}
        <TeamColumn title="Servers" members={serversOnly} serverById={serverById} domainById={domainById} local={local} />
        {/* Bartenders */}
        <TeamColumn title="Bartenders" members={bartendersOnly} serverById={serverById} domainById={domainById} local={local} />
        {/* Domains list */}
        <Card className="bg-card">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Domains</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onAuto}>Auto</Button>
              <Button size="sm" variant="ghost" onClick={() => { const cleared = local.map(a => ({ ...a, domainIds: [] })); setLocal(cleared); onChange(cleared); }}>Reset</Button>
              <Button size="sm" onClick={() => onSubmit ? onSubmit(local) : onChange(local)}>Submit</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
              {(preset.domains || []).map(d => {
                const assigneeId = assignedTo.get(d.id);
                const isAssigned = Boolean(assigneeId);
                const assigneeName = isAssigned ? (servers.find(s => String(s.id) === assigneeId)?.name || '') : '';
                const card = (
                  <div className={`rounded-md border p-2 flex flex-col gap-1 ${isAssigned ? 'opacity-60 pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`} style={{ backgroundColor: d.color + '22' }}>
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <div className="font-medium text-sm">{d.name}</div>
                      <div className="ml-auto text-[10px] text-muted-foreground">{(d.tableIds || []).length} tables</div>
                    </div>
                    {isAssigned && (
                      <div className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 w-fit">Assigned to {assigneeName || assigneeId}</div>
                    )}
                  </div>
                );
                return isAssigned ? (
                  <div key={d.id}>{card}</div>
                ) : (
                  <DraggableDomain key={d.id} id={d.id}>{card}</DraggableDomain>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DndContext>
  );
}

function DraggableDomain({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style: React.CSSProperties = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {};
  if (isDragging) {
    (style as any).position = 'relative';
    (style as any).zIndex = 9999;
  }
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? 'opacity-80 ring-2 ring-primary rounded-md relative z-50' : ''}>
      {children}
    </div>
  );
}

function DroppableServer({ id, disabled, children }: { id: string; disabled?: boolean; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id, disabled: Boolean(disabled) });
  return (
    <div ref={setNodeRef} className={`${isOver ? 'ring-2 ring-primary rounded-md' : ''} ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {children}
    </div>
  );
}

function AssignedTags({ serverId, local, domainById }: { serverId: string; local: Array<{ serverId: string; domainIds: string[] }>; domainById: Map<string, any> }) {
  const a = local.find(x => String(x.serverId) === String(serverId));
  const ids = a?.domainIds || [];
  if (!ids.length) return null;
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {ids.map(id => {
        const d = domainById.get(id);
        return (
          <DraggableDomain key={`${serverId}:${id}`} id={id}>
            <div className="rounded-md border p-2 text-xs cursor-grab flex flex-col gap-1" style={{ background: (d?.color || '#94a3b8') + '22' }}>
              <div className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full" style={{ backgroundColor: d?.color || '#94a3b8' }} />
                <span className="font-medium">{d?.name || 'Domain'}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{(d?.tableIds || []).length} tables</div>
            </div>
          </DraggableDomain>
        );
      })}
    </div>
  );
}

function TeamColumn({ title, members, serverById, domainById, local }: { title: string; members: Array<{ id: string; name: string; role?: string; range?: string; isActive?: boolean; start?: string; end?: string; shiftIndex?: number; shiftCount?: number }>; serverById: Map<string, { serverId: string; domainIds: string[] }>; domainById: Map<string, any>; local: Array<{ serverId: string; domainIds: string[] }> }) {
  const activeById = React.useMemo(() => {
    const map = new Map<string, boolean>();
    for (const m of members) {
      const key = String(m.id);
      if (m.isActive) map.set(key, true);
      else if (!map.has(key)) map.set(key, false);
    }
    return map;
  }, [members]);
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map(s => (
          <DroppableServer key={`${s.id}:${(s as any).shiftIndex || 0}:${s.start || s.range || ''}`} id={`${String(s.id)}${(s as any).shiftIndex ? `::${(s as any).shiftIndex}` : ''}`} disabled={(s.isActive === false) && (activeById.get(String(s.id)) === true)}>
            <div className="border rounded-md p-2 bg-card/70 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium leading-tight flex items-center gap-2">
                    {s.name || '—'}
                    {Boolean((s as any).shiftIndex) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Shift {(s as any).shiftIndex}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.role || title}{s.range ? ` • ${s.range}` : ''}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const baseId = String(s.id);
                    const shadow = (s.isActive === false) && (activeById.get(baseId) === true);
                    const domains = shadow ? [] : (serverById.get(baseId)?.domainIds || []);
                    const tables = domains.reduce((acc, id) => acc + ((domainById.get(id)?.tableIds || []).length), 0);
                    return `${domains.length} domains • ${tables} tables`;
                  })()}
                </div>
              </div>
              {(() => {
                const baseId = String(s.id);
                const shadow = (s.isActive === false) && (activeById.get(baseId) === true);
                return shadow ? null : <AssignedTags serverId={baseId} local={local} domainById={domainById} />;
              })()}
              {(() => {
                const baseId = String(s.id);
                const shadow = (s.isActive === false) && (activeById.get(baseId) === true);
                return (!shadow && s.isActive === false && ((serverById.get(baseId)?.domainIds?.length || 0) > 0)) ? (
                <div className="mt-2 text-[10px] px-2 py-1 rounded-md bg-amber-500/15 text-amber-700">Inactive - reassign domains</div>
                ) : null;
              })()}
            </div>
          </DroppableServer>
        ))}
      </CardContent>
    </Card>
  );
}


