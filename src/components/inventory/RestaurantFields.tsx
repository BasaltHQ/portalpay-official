"use client";

import React, { useMemo } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface Modifier {
  id: string;
  name: string;
  priceAdjustment: number;
  sortOrder?: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelect?: number;
  maxSelect?: number;
  modifiers: Modifier[];
  sortOrder?: number;
}

interface RestaurantFieldsProps {
  modifierGroups: ModifierGroup[];
  setModifierGroups: (groups: ModifierGroup[]) => void;
  dietaryTags: string[];
  setDietaryTags: (tags: string[]) => void;
  spiceLevel: number;
  setSpiceLevel: (level: number) => void;
  prepTime: string;
  setPrepTime: (time: string) => void;
  calories?: number;
  setCalories: (calories?: number) => void;
  ingredients: string;
  setIngredients: (ingredients: string) => void;
}

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Halal",
  "Kosher",
];

const PREP_TIME_OPTIONS = [
  "5-10 min",
  "10-15 min",
  "15-20 min",
  "20-30 min",
  "30+ min",
];

// =============================================================================
// DRAG HANDLE COMPONENT
// =============================================================================

interface DragHandleProps {
  listeners?: React.HTMLAttributes<HTMLButtonElement>;
  attributes?: React.HTMLAttributes<HTMLButtonElement>;
}

function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <button
      type="button"
      className="flex-shrink-0 h-8 w-6 flex items-center justify-center rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

// =============================================================================
// SORTABLE MODIFIER ITEM
// =============================================================================

interface SortableModifierProps {
  modifier: Modifier;
  groupId: string;
  onUpdate: (updates: Partial<Modifier>) => void;
  onRemove: () => void;
}

function SortableModifier({ modifier, groupId, onUpdate, onRemove }: SortableModifierProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: modifier.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 ${isDragging ? 'z-50' : ''}`}
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      <input
        className="flex-1 h-7 px-2 py-1 border rounded-md bg-background text-xs"
        placeholder="Modifier name"
        value={modifier.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
      />
      <input
        type="number"
        step={0.01}
        className="w-20 h-7 px-2 py-1 border rounded-md bg-background text-xs"
        placeholder="$0.00"
        value={modifier.priceAdjustment}
        onChange={(e) => onUpdate({ priceAdjustment: Number(e.target.value || 0) })}
      />
      <button
        type="button"
        onClick={onRemove}
        className="h-7 px-2 rounded-md border text-xs hover:bg-muted"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// =============================================================================
// SORTABLE MODIFIER GROUP
// =============================================================================

interface SortableModifierGroupProps {
  group: ModifierGroup;
  onUpdate: (updates: Partial<ModifierGroup>) => void;
  onRemove: () => void;
  onAddModifier: () => void;
  onUpdateModifier: (modifierId: string, updates: Partial<Modifier>) => void;
  onRemoveModifier: (modifierId: string) => void;
  onReorderModifiers: (oldIndex: number, newIndex: number) => void;
}

function SortableModifierGroup({
  group,
  onUpdate,
  onRemove,
  onAddModifier,
  onUpdateModifier,
  onRemoveModifier,
  onReorderModifiers,
}: SortableModifierGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort modifiers by sortOrder
  const sortedModifiers = useMemo(() => {
    return [...group.modifiers].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [group.modifiers]);

  const modifierIds = useMemo(() => sortedModifiers.map(m => m.id), [sortedModifiers]);

  function handleModifierDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sortedModifiers.findIndex(m => m.id === active.id);
      const newIndex = sortedModifiers.findIndex(m => m.id === over.id);
      onReorderModifiers(oldIndex, newIndex);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border p-3 space-y-2 bg-background ${isDragging ? 'shadow-lg ring-2 ring-primary/20 z-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <DragHandle listeners={listeners} attributes={attributes} />
        <input
          className="flex-1 h-8 px-2 py-1 border rounded-md bg-background text-sm"
          placeholder="Group name (e.g., Toppings)"
          value={group.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <button
          type="button"
          onClick={onRemove}
          className="h-8 px-2 rounded-md border text-xs hover:bg-muted"
          title="Remove group"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-2 ml-7">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={group.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
          />
          Required
        </label>
        <div>
          <input
            type="number"
            min={0}
            className="w-full h-7 px-2 py-1 border rounded-md bg-background text-xs"
            placeholder="Min select"
            value={group.minSelect ?? ""}
            onChange={(e) =>
              onUpdate({
                minSelect: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div>
          <input
            type="number"
            min={0}
            className="w-full h-7 px-2 py-1 border rounded-md bg-background text-xs"
            placeholder="Max select"
            value={group.maxSelect ?? ""}
            onChange={(e) =>
              onUpdate({
                maxSelect: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
      
      <div className="space-y-2 ml-7">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Modifiers</span>
          <button
            type="button"
            onClick={onAddModifier}
            className="px-2 py-1 rounded-md border text-xs hover:bg-muted"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleModifierDragEnd}
        >
          <SortableContext items={modifierIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {sortedModifiers.map((modifier) => (
                <SortableModifier
                  key={modifier.id}
                  modifier={modifier}
                  groupId={group.id}
                  onUpdate={(updates) => onUpdateModifier(modifier.id, updates)}
                  onRemove={() => onRemoveModifier(modifier.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {group.modifiers.length === 0 && (
          <div className="text-xs text-muted-foreground">
            No modifiers yet. Click + to add.
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MODIFIER GROUP OVERLAY (for drag preview)
// =============================================================================

function ModifierGroupOverlay({ group }: { group: ModifierGroup }) {
  return (
    <div className="rounded-md border p-3 bg-background shadow-xl ring-2 ring-primary/30">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{group.name || "Untitled Group"}</span>
      </div>
      <div className="mt-2 ml-6 text-xs text-muted-foreground">
        {group.modifiers.length} modifier{group.modifiers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RestaurantFields({
  modifierGroups,
  setModifierGroups,
  dietaryTags,
  setDietaryTags,
  spiceLevel,
  setSpiceLevel,
  prepTime,
  setPrepTime,
  calories,
  setCalories,
  ingredients,
  setIngredients,
}: RestaurantFieldsProps) {
  const [activeGroupId, setActiveGroupId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort groups by sortOrder
  const sortedGroups = useMemo(() => {
    return [...modifierGroups].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [modifierGroups]);

  const groupIds = useMemo(() => sortedGroups.map(g => g.id), [sortedGroups]);

  const activeGroup = useMemo(() => {
    if (!activeGroupId) return null;
    return modifierGroups.find(g => g.id === activeGroupId) || null;
  }, [activeGroupId, modifierGroups]);

  // Helper to update sortOrder values after reordering
  function updateSortOrders<T extends { sortOrder?: number }>(items: T[]): T[] {
    return items.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
  }

  function addModifierGroup() {
    const maxSortOrder = modifierGroups.reduce((max, g) => Math.max(max, g.sortOrder ?? 0), -1);
    const newGroup: ModifierGroup = {
      id: `mg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: "",
      required: false,
      modifiers: [],
      sortOrder: maxSortOrder + 1,
    };
    setModifierGroups([...modifierGroups, newGroup]);
  }

  function removeModifierGroup(groupId: string) {
    const updated = modifierGroups.filter((g) => g.id !== groupId);
    setModifierGroups(updateSortOrders(updated));
  }

  function updateModifierGroup(groupId: string, updates: Partial<ModifierGroup>) {
    setModifierGroups(
      modifierGroups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      )
    );
  }

  function addModifier(groupId: string) {
    const group = modifierGroups.find(g => g.id === groupId);
    const maxSortOrder = group?.modifiers.reduce((max, m) => Math.max(max, m.sortOrder ?? 0), -1) ?? -1;
    
    const newModifier: Modifier = {
      id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: "",
      priceAdjustment: 0,
      sortOrder: maxSortOrder + 1,
    };
    setModifierGroups(
      modifierGroups.map((g) =>
        g.id === groupId
          ? { ...g, modifiers: [...g.modifiers, newModifier] }
          : g
      )
    );
  }

  function removeModifier(groupId: string, modifierId: string) {
    setModifierGroups(
      modifierGroups.map((g) =>
        g.id === groupId
          ? { ...g, modifiers: updateSortOrders(g.modifiers.filter((m) => m.id !== modifierId)) }
          : g
      )
    );
  }

  function updateModifier(
    groupId: string,
    modifierId: string,
    updates: Partial<Modifier>
  ) {
    setModifierGroups(
      modifierGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              modifiers: g.modifiers.map((m) =>
                m.id === modifierId ? { ...m, ...updates } : m
              ),
            }
          : g
      )
    );
  }

  function reorderModifiers(groupId: string, oldIndex: number, newIndex: number) {
    setModifierGroups(
      modifierGroups.map((g) => {
        if (g.id !== groupId) return g;
        
        const sorted = [...g.modifiers].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const reordered = arrayMove(sorted, oldIndex, newIndex);
        return { ...g, modifiers: updateSortOrders(reordered) };
      })
    );
  }

  function handleGroupDragStart(event: DragStartEvent) {
    setActiveGroupId(event.active.id as string);
  }

  function handleGroupDragEnd(event: DragEndEvent) {
    setActiveGroupId(null);
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sortedGroups.findIndex(g => g.id === active.id);
      const newIndex = sortedGroups.findIndex(g => g.id === over.id);
      
      const reordered = arrayMove(sortedGroups, oldIndex, newIndex);
      setModifierGroups(updateSortOrders(reordered));
    }
  }

  function toggleDietaryTag(tag: string) {
    if (dietaryTags.includes(tag)) {
      setDietaryTags(dietaryTags.filter((t) => t !== tag));
    } else {
      setDietaryTags([...dietaryTags, tag]);
    }
  }

  return (
    <div className="md:col-span-2 rounded-md border p-3 space-y-4">
      <div className="text-sm font-medium">Restaurant-Specific Fields</div>

      {/* Modifier Groups */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="microtext text-muted-foreground">Modifier Groups</label>
          <button
            type="button"
            onClick={addModifierGroup}
            className="px-2 py-1 rounded-md border text-xs flex items-center gap-1 hover:bg-muted"
          >
            <Plus className="h-3 w-3" /> Add Group
          </button>
        </div>
        
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleGroupDragStart}
          onDragEnd={handleGroupDragEnd}
        >
          <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sortedGroups.map((group) => (
                <SortableModifierGroup
                  key={group.id}
                  group={group}
                  onUpdate={(updates) => updateModifierGroup(group.id, updates)}
                  onRemove={() => removeModifierGroup(group.id)}
                  onAddModifier={() => addModifier(group.id)}
                  onUpdateModifier={(modifierId, updates) =>
                    updateModifier(group.id, modifierId, updates)
                  }
                  onRemoveModifier={(modifierId) =>
                    removeModifier(group.id, modifierId)
                  }
                  onReorderModifiers={(oldIndex, newIndex) =>
                    reorderModifiers(group.id, oldIndex, newIndex)
                  }
                />
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {activeGroup ? <ModifierGroupOverlay group={activeGroup} /> : null}
          </DragOverlay>
        </DndContext>
        
        {modifierGroups.length === 0 && (
          <div className="text-xs text-muted-foreground">
            No modifier groups yet. Click "Add Group" to create one.
          </div>
        )}
      </div>

      {/* Dietary Tags */}
      <div>
        <label className="microtext text-muted-foreground">Dietary Tags</label>
        <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIETARY_OPTIONS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dietaryTags.includes(tag)}
                onChange={() => toggleDietaryTag(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      {/* Spice Level */}
      <div>
        <label className="microtext text-muted-foreground">
          Spice Level: {spiceLevel}
        </label>
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          className="mt-1 w-full"
          value={spiceLevel}
          onChange={(e) => setSpiceLevel(Number(e.target.value))}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
          <span>Mild</span>
          <span>Hot</span>
        </div>
      </div>

      {/* Prep Time */}
      <div>
        <label className="microtext text-muted-foreground">Prep Time</label>
        <select
          className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
        >
          <option value="">Select prep time</option>
          {PREP_TIME_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      {/* Calories */}
      <div>
        <label className="microtext text-muted-foreground">Calories (optional)</label>
        <input
          type="number"
          min={0}
          className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
          placeholder="e.g., 450"
          value={calories ?? ""}
          onChange={(e) =>
            setCalories(e.target.value ? Number(e.target.value) : undefined)
          }
        />
      </div>

      {/* Ingredients */}
      <div>
        <label className="microtext text-muted-foreground">Ingredients</label>
        <textarea
          className="mt-1 w-full h-20 px-3 py-2 border rounded-md bg-background"
          placeholder="List ingredients separated by commas..."
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
      </div>
    </div>
  );
}
