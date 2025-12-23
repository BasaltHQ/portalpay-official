"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";

export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface FreelancerFieldsProps {
  pricingType: 'hourly' | 'project' | 'package' | 'retainer';
  setPricingType: (type: 'hourly' | 'project' | 'package' | 'retainer') => void;
  pricingAmount: number;
  setPricingAmount: (amount: number) => void;
  minHours?: number;
  setMinHours: (hours?: number) => void;
  billingCycle: string;
  setBillingCycle: (cycle: string) => void;
  deliveryTime: string;
  setDeliveryTime: (time: string) => void;
  revisionsIncluded?: number;
  setRevisionsIncluded: (revisions?: number) => void;
  skillLevel: string;
  setSkillLevel: (level: string) => void;
  serviceCategory: string;
  setServiceCategory: (category: string) => void;
  deliverables: string[];
  setDeliverables: (deliverables: string[]) => void;
  requirements: string[];
  setRequirements: (requirements: string[]) => void;
  addOns: AddOn[];
  setAddOns: (addOns: AddOn[]) => void;
}

const SKILL_LEVELS = ["Beginner", "Intermediate", "Expert", "Specialist"];
const BILLING_CYCLES = ["Monthly", "Quarterly", "Annually"];

export function FreelancerFields({
  pricingType,
  setPricingType,
  pricingAmount,
  setPricingAmount,
  minHours,
  setMinHours,
  billingCycle,
  setBillingCycle,
  deliveryTime,
  setDeliveryTime,
  revisionsIncluded,
  setRevisionsIncluded,
  skillLevel,
  setSkillLevel,
  serviceCategory,
  setServiceCategory,
  deliverables,
  setDeliverables,
  requirements,
  setRequirements,
  addOns,
  setAddOns,
}: FreelancerFieldsProps) {
  const [newDeliverable, setNewDeliverable] = React.useState("");
  const [newRequirement, setNewRequirement] = React.useState("");

  function addDeliverable() {
    const trimmed = newDeliverable.trim();
    if (!trimmed) return;
    setDeliverables([...deliverables, trimmed]);
    setNewDeliverable("");
  }

  function removeDeliverable(index: number) {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  }

  function addRequirement() {
    const trimmed = newRequirement.trim();
    if (!trimmed) return;
    setRequirements([...requirements, trimmed]);
    setNewRequirement("");
  }

  function removeRequirement(index: number) {
    setRequirements(requirements.filter((_, i) => i !== index));
  }

  function addAddOn() {
    const newAddOn: AddOn = {
      id: `addon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: "",
      price: 0,
      description: "",
    };
    setAddOns([...addOns, newAddOn]);
  }

  function removeAddOn(id: string) {
    setAddOns(addOns.filter((a) => a.id !== id));
  }

  function updateAddOn(id: string, updates: Partial<AddOn>) {
    setAddOns(
      addOns.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }

  return (
    <div className="md:col-span-2 rounded-md border p-3 space-y-4">
      <div className="text-sm font-medium">Freelancer-Specific Fields</div>

      {/* Pricing Section */}
      <div className="rounded-md border p-3 space-y-3">
        <div className="text-sm font-medium">Pricing</div>
        
        {/* Pricing Type */}
        <div>
          <label className="microtext text-muted-foreground">Pricing Type</label>
          <select
            className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value as any)}
          >
            <option value="hourly">Hourly</option>
            <option value="project">Project</option>
            <option value="package">Package</option>
            <option value="retainer">Retainer</option>
          </select>
        </div>

        {/* Pricing Amount */}
        <div>
          <label className="microtext text-muted-foreground">
            {pricingType === 'hourly' ? 'Hourly Rate' : 'Price'}
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
            placeholder="e.g., 75.00"
            value={pricingAmount}
            onChange={(e) => setPricingAmount(Math.max(0, Number(e.target.value || 0)))}
          />
        </div>

        {/* Conditional: Min Hours (for Hourly) */}
        {pricingType === 'hourly' && (
          <div>
            <label className="microtext text-muted-foreground">Minimum Hours</label>
            <input
              type="number"
              min={0}
              step={0.5}
              className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
              placeholder="e.g., 2"
              value={minHours ?? ""}
              onChange={(e) =>
                setMinHours(e.target.value ? Number(e.target.value) : undefined)
              }
            />
            <div className="microtext text-muted-foreground mt-1">
              Minimum billable hours per session
            </div>
          </div>
        )}

        {/* Conditional: Billing Cycle (for Retainer) */}
        {pricingType === 'retainer' && (
          <div>
            <label className="microtext text-muted-foreground">Billing Cycle</label>
            <select
              className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value)}
            >
              <option value="">Select cycle</option>
              {BILLING_CYCLES.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {cycle}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Delivery Time */}
      <div>
        <label className="microtext text-muted-foreground">Delivery Time</label>
        <input
          className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
          placeholder="e.g., 5-7 days"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
        />
      </div>

      {/* Revisions Included */}
      <div>
        <label className="microtext text-muted-foreground">Revisions Included</label>
        <input
          type="number"
          min={0}
          step={1}
          className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
          placeholder="e.g., 3"
          value={revisionsIncluded ?? ""}
          onChange={(e) =>
            setRevisionsIncluded(
              e.target.value ? Math.max(0, Number(e.target.value)) : undefined
            )
          }
        />
      </div>

      {/* Skill Level */}
      <div>
        <label className="microtext text-muted-foreground">Skill Level</label>
        <select
          className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
        >
          <option value="">Select skill level</option>
          {SKILL_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {/* Service Category */}
      <div>
        <label className="microtext text-muted-foreground">Service Category</label>
        <input
          className="mt-1 w-full h-9 px-3 py-1 border rounded-md bg-background"
          placeholder="e.g., Web Development, Graphic Design"
          value={serviceCategory}
          onChange={(e) => setServiceCategory(e.target.value)}
        />
      </div>

      {/* Deliverables */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="microtext text-muted-foreground">Deliverables</label>
          <span className="microtext text-muted-foreground">
            {deliverables.length} item{deliverables.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input
            className="flex-1 h-9 px-3 py-1 border rounded-md bg-background"
            placeholder="What will be delivered? (press Enter)"
            value={newDeliverable}
            onChange={(e) => setNewDeliverable(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDeliverable();
              }
            }}
          />
          <button
            type="button"
            onClick={addDeliverable}
            className="h-9 px-3 rounded-md border text-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          {deliverables.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <span className="text-sm">{item}</span>
              <button
                type="button"
                onClick={() => removeDeliverable(index)}
                className="h-7 px-2 rounded-md border text-xs"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {deliverables.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No deliverables yet. Add items above.
            </div>
          )}
        </div>
      </div>

      {/* Requirements */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="microtext text-muted-foreground">Requirements</label>
          <span className="microtext text-muted-foreground">
            {requirements.length} item{requirements.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input
            className="flex-1 h-9 px-3 py-1 border rounded-md bg-background"
            placeholder="What's needed from client? (press Enter)"
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRequirement();
              }
            }}
          />
          <button
            type="button"
            onClick={addRequirement}
            className="h-9 px-3 rounded-md border text-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          {requirements.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <span className="text-sm">{item}</span>
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                className="h-7 px-2 rounded-md border text-xs"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {requirements.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No requirements yet. Add items above.
            </div>
          )}
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="microtext text-muted-foreground">Add-ons</label>
          <button
            type="button"
            onClick={addAddOn}
            className="px-2 py-1 rounded-md border text-xs flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add Option
          </button>
        </div>
        <div className="space-y-3">
          {addOns.map((addOn) => (
            <div key={addOn.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 h-8 px-2 py-1 border rounded-md bg-background text-sm"
                  placeholder="Add-on name"
                  value={addOn.name}
                  onChange={(e) => updateAddOn(addOn.id, { name: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-24 h-8 px-2 py-1 border rounded-md bg-background text-sm"
                  placeholder="Price"
                  value={addOn.price}
                  onChange={(e) =>
                    updateAddOn(addOn.id, { price: Math.max(0, Number(e.target.value || 0)) })
                  }
                />
                <button
                  type="button"
                  onClick={() => removeAddOn(addOn.id)}
                  className="h-8 px-2 rounded-md border text-xs"
                  title="Remove add-on"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <textarea
                className="w-full h-16 px-2 py-1 border rounded-md bg-background text-xs"
                placeholder="Description of this add-on..."
                value={addOn.description}
                onChange={(e) => updateAddOn(addOn.id, { description: e.target.value })}
              />
            </div>
          ))}
          {addOns.length === 0 && (
            <div className="text-xs text-muted-foreground">
              No add-ons yet. Click "Add Option" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
