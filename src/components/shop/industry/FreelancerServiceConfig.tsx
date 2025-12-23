"use client";

/**
 * Freelancer Service Configuration Component
 * 
 * Service pricing and configuration UI for freelancer industry pack.
 * Supports:
 * - Multiple pricing types (hourly, project, package, retainer, milestone)
 * - Add-on services
 * - Project description input
 * - Rush delivery option
 * - Milestone-based pricing display
 * - Deliverables and requirements lists
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Clock, 
  Package, 
  RefreshCw, 
  Zap, 
  Check, 
  Calendar,
  Briefcase,
  FileText,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import {
  FreelancerServiceAttributes,
  FreelancerServicePricing,
  FreelancerServiceAddOn,
  FreelancerMilestone,
  calculateFreelancerServiceTotal,
} from "@/types/inventory";
import { 
  SectionCard, 
  SectionHeader, 
  QuantitySelector,
  SummaryRow,
} from "./shared";

// =============================================================================
// TYPES
// =============================================================================

export interface FreelancerServiceDetails {
  selectedAddOns: string[];
  projectDescription?: string;
  preferredDeliveryDate?: number;
  hours?: number;
  isRush?: boolean;
  total: number;
}

export interface FreelancerServiceConfigProps {
  /** Service attributes */
  attributes: FreelancerServiceAttributes;
  /** Base price (from pricing config) */
  basePrice: number;
  /** Callback when configuration changes */
  onConfigChange: (config: FreelancerServiceDetails) => void;
  /** Primary brand color */
  primaryColor?: string;
  /** Initial configuration */
  initialConfig?: Partial<FreelancerServiceDetails>;
}

// =============================================================================
// PRICING TYPE LABELS
// =============================================================================

const PRICING_TYPE_LABELS: Record<FreelancerServicePricing['type'], string> = {
  hourly: 'per hour',
  project: 'fixed price',
  package: 'package',
  retainer: 'retainer',
  milestone: 'milestone-based',
};

const PRICING_TYPE_ICONS: Record<FreelancerServicePricing['type'], React.ReactNode> = {
  hourly: <Clock className="h-5 w-5" />,
  project: <FileText className="h-5 w-5" />,
  package: <Package className="h-5 w-5" />,
  retainer: <RefreshCw className="h-5 w-5" />,
  milestone: <Briefcase className="h-5 w-5" />,
};

// =============================================================================
// PRICING DISPLAY COMPONENT
// =============================================================================

interface PricingDisplayProps {
  pricing: FreelancerServicePricing;
  isRush: boolean;
  hours?: number;
  primaryColor?: string;
}

function PricingDisplay({ pricing, isRush, hours, primaryColor }: PricingDisplayProps) {
  const accentColor = primaryColor || '#0ea5e9';
  
  let displayAmount = pricing.amount;
  let suffix = PRICING_TYPE_LABELS[pricing.type];
  
  if (pricing.type === 'retainer' && pricing.billingCycle) {
    suffix = `/${pricing.billingCycle}`;
  }
  
  if (isRush && pricing.rushMultiplier) {
    displayAmount *= pricing.rushMultiplier;
  }
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {PRICING_TYPE_ICONS[pricing.type]}
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Pricing</div>
          <div className="text-xs text-muted-foreground capitalize">
            {pricing.type.replace('-', ' ')}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold">${displayAmount.toFixed(2)}</div>
        <div className="text-sm text-muted-foreground">{suffix}</div>
      </div>
    </div>
  );
}

// =============================================================================
// HOURS SELECTOR COMPONENT
// =============================================================================

interface HoursSelectorProps {
  hours: number;
  minHours?: number;
  maxHours?: number;
  onChange: (hours: number) => void;
  hourlyRate: number;
}

function HoursSelector({ hours, minHours, maxHours, onChange, hourlyRate }: HoursSelectorProps) {
  const min = minHours || 1;
  
  return (
    <div>
      <SectionHeader title="Hours" icon={<Clock className="h-4 w-4" />} required />
      <div className="flex items-center gap-4">
        <QuantitySelector
          value={hours}
          min={min}
          max={maxHours}
          onChange={onChange}
        />
        <div className="text-sm text-muted-foreground">
          {minHours && `Min ${minHours}h`}
          {maxHours && ` • Max ${maxHours}h`}
        </div>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        Estimated: ${(hours * hourlyRate).toFixed(2)}
      </div>
    </div>
  );
}

// =============================================================================
// MILESTONES DISPLAY COMPONENT
// =============================================================================

interface MilestonesDisplayProps {
  milestones: FreelancerMilestone[];
  totalAmount: number;
  primaryColor?: string;
}

function MilestonesDisplay({ milestones, totalAmount, primaryColor }: MilestonesDisplayProps) {
  const accentColor = primaryColor || '#0ea5e9';
  
  return (
    <div className="space-y-3">
      {milestones.map((milestone, index) => {
        const amount = (totalAmount * milestone.percentage) / 100;
        
        return (
          <div 
            key={milestone.id} 
            className="p-3 rounded-lg border bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div 
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">{milestone.name}</div>
                  {milestone.description && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {milestone.description}
                    </div>
                  )}
                  {milestone.deliverables && milestone.deliverables.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {milestone.deliverables.map((d, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">${amount.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">{milestone.percentage}%</div>
              </div>
            </div>
            {milestone.duration && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {milestone.duration}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// ADD-ONS SELECTOR COMPONENT
// =============================================================================

interface AddOnsSelectorProps {
  addOns: FreelancerServiceAddOn[];
  selectedAddOns: string[];
  onToggle: (addOnId: string) => void;
  primaryColor?: string;
}

function AddOnsSelector({ addOns, selectedAddOns, onToggle, primaryColor }: AddOnsSelectorProps) {
  const accentColor = primaryColor || '#0ea5e9';
  
  return (
    <div className="space-y-2">
      {addOns.map(addOn => {
        const isSelected = selectedAddOns.includes(addOn.id);
        
        return (
          <button
            key={addOn.id}
            onClick={() => onToggle(addOn.id)}
            className={`w-full flex items-center justify-between p-3 rounded-md border-2 transition-all ${
              isSelected ? '' : 'border-transparent bg-muted/50 hover:bg-muted'
            }`}
            style={isSelected ? { 
              borderColor: accentColor, 
              backgroundColor: `${accentColor}10` 
            } : {}}
          >
            <div className="text-left">
              <div className="text-sm font-medium flex items-center gap-2">
                {isSelected && <Check className="h-4 w-4" style={{ color: accentColor }} />}
                {addOn.name}
                {addOn.recurring && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Recurring
                  </span>
                )}
              </div>
              {addOn.description && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {addOn.description}
                </div>
              )}
              {addOn.additionalTime && (
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  +{addOn.additionalTime}
                </div>
              )}
            </div>
            <div className="text-sm font-medium">
              +${addOn.price.toFixed(2)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// DELIVERABLES LIST COMPONENT
// =============================================================================

interface DeliverablesListProps {
  deliverables: string[];
  title: string;
  icon: React.ReactNode;
}

function DeliverablesList({ deliverables, title, icon }: DeliverablesListProps) {
  return (
    <div>
      <SectionHeader title={title} icon={icon} />
      <ul className="space-y-1.5">
        {deliverables.map((item, i) => (
          <li key={i} className="text-sm flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FreelancerServiceConfig({
  attributes,
  basePrice,
  onConfigChange,
  primaryColor,
  initialConfig,
}: FreelancerServiceConfigProps) {
  // Form state
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(
    initialConfig?.selectedAddOns || []
  );
  const [description, setDescription] = useState(
    initialConfig?.projectDescription || ''
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialConfig?.preferredDeliveryDate 
      ? new Date(initialConfig.preferredDeliveryDate).toISOString().split('T')[0]
      : ''
  );
  const [hours, setHours] = useState(
    initialConfig?.hours || attributes.pricing.minHours || 1
  );
  const [isRush, setIsRush] = useState(initialConfig?.isRush || false);
  
  const accentColor = primaryColor || '#0ea5e9';
  
  // Calculate total
  const total = useMemo(() => {
    const addOns = (attributes.addOns || []).filter(a => selectedAddOns.includes(a.id));
    return calculateFreelancerServiceTotal(
      attributes.pricing,
      addOns,
      attributes.pricing.type === 'hourly' ? hours : undefined,
      isRush
    );
  }, [attributes.pricing, attributes.addOns, selectedAddOns, hours, isRush]);
  
  // Toggle add-on selection
  const handleToggleAddOn = useCallback((addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  }, []);
  
  // Notify parent of changes
  useEffect(() => {
    onConfigChange({
      selectedAddOns,
      projectDescription: description || undefined,
      preferredDeliveryDate: deliveryDate ? new Date(deliveryDate).getTime() : undefined,
      hours: attributes.pricing.type === 'hourly' ? hours : undefined,
      isRush: attributes.pricing.rushMultiplier ? isRush : undefined,
      total,
    });
  }, [selectedAddOns, description, deliveryDate, hours, isRush, total, onConfigChange, attributes.pricing]);
  
  // Get min delivery date (today + delivery time if specified)
  const minDeliveryDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);
  
  return (
    <div className="space-y-5">
      {/* Pricing Display */}
      <PricingDisplay
        pricing={attributes.pricing}
        isRush={isRush}
        hours={attributes.pricing.type === 'hourly' ? hours : undefined}
        primaryColor={primaryColor}
      />
      
      {/* Hours Selector (for hourly pricing) */}
      {attributes.pricing.type === 'hourly' && (
        <HoursSelector
          hours={hours}
          minHours={attributes.pricing.minHours}
          maxHours={attributes.pricing.maxHours}
          onChange={setHours}
          hourlyRate={attributes.pricing.amount * (isRush && attributes.pricing.rushMultiplier ? attributes.pricing.rushMultiplier : 1)}
        />
      )}
      
      {/* Rush Delivery Option */}
      {attributes.pricing.rushMultiplier && (
        <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
          <input
            type="checkbox"
            checked={isRush}
            onChange={(e) => setIsRush(e.target.checked)}
            className="rounded border-2"
          />
          <Zap className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <div className="text-sm font-medium">Rush Delivery</div>
            <div className="text-xs text-muted-foreground">
              {attributes.pricing.rushMultiplier}x rate for expedited delivery
            </div>
          </div>
          <div className="text-sm text-orange-500 font-medium">
            +{((attributes.pricing.rushMultiplier - 1) * 100).toFixed(0)}%
          </div>
        </label>
      )}
      
      {/* Delivery Time Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Delivery: {attributes.deliveryTime}</span>
      </div>
      
      {/* Revisions */}
      <div className="flex items-center gap-2 text-sm">
        <RefreshCw className="h-4 w-4 text-muted-foreground" />
        <span>
          {attributes.revisionsIncluded} revision{attributes.revisionsIncluded !== 1 ? 's' : ''} included
          {attributes.additionalRevisionPrice && (
            <span className="text-muted-foreground">
              {' '}(+${attributes.additionalRevisionPrice.toFixed(2)} each additional)
            </span>
          )}
        </span>
      </div>
      
      {/* Milestones (for milestone-based pricing) */}
      {attributes.pricing.type === 'milestone' && attributes.milestones && attributes.milestones.length > 0 && (
        <div>
          <SectionHeader title="Project Milestones" icon={<Briefcase className="h-4 w-4" />} />
          <MilestonesDisplay
            milestones={attributes.milestones}
            totalAmount={attributes.pricing.amount}
            primaryColor={primaryColor}
          />
        </div>
      )}
      
      {/* Deliverables */}
      {attributes.deliverables && attributes.deliverables.length > 0 && (
        <DeliverablesList
          deliverables={attributes.deliverables}
          title="What's Included"
          icon={<Package className="h-4 w-4" />}
        />
      )}
      
      {/* Requirements */}
      {attributes.requirements && attributes.requirements.length > 0 && (
        <div>
          <SectionHeader title="What I Need From You" icon={<AlertCircle className="h-4 w-4" />} />
          <ul className="space-y-1.5">
            {attributes.requirements.map((req, i) => (
              <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                <span className="text-foreground">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Add-ons */}
      {attributes.addOns && attributes.addOns.length > 0 && (
        <div>
          <SectionHeader title="Add-on Services" />
          <AddOnsSelector
            addOns={attributes.addOns}
            selectedAddOns={selectedAddOns}
            onToggle={handleToggleAddOn}
            primaryColor={primaryColor}
          />
        </div>
      )}
      
      {/* Project Description */}
      <div>
        <SectionHeader title="Project Details" icon={<FileText className="h-4 w-4" />} />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project, goals, and any specific requirements..."
          className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
          rows={4}
        />
      </div>
      
      {/* Preferred Delivery Date */}
      <div>
        <SectionHeader title="Preferred Delivery Date" icon={<Calendar className="h-4 w-4" />} />
        <input
          type="date"
          min={minDeliveryDate}
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full h-10 px-3 border rounded-md bg-background text-sm"
        />
        <div className="text-xs text-muted-foreground mt-1">
          Standard delivery: {attributes.deliveryTime}
        </div>
      </div>
      
      {/* Deposit Info */}
      {attributes.pricing.depositPercentage && attributes.pricing.depositPercentage > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-600 dark:text-blue-400">
          <DollarSign className="h-4 w-4" />
          <span>
            {attributes.pricing.depositPercentage}% deposit (${(total * attributes.pricing.depositPercentage / 100).toFixed(2)}) required to start
          </span>
        </div>
      )}
      
      {/* Price Summary */}
      <SectionCard className="bg-muted/30">
        <div className="space-y-2">
          {attributes.pricing.type === 'hourly' ? (
            <SummaryRow
              label={`$${(attributes.pricing.amount * (isRush && attributes.pricing.rushMultiplier ? attributes.pricing.rushMultiplier : 1)).toFixed(2)} × ${hours} hour${hours !== 1 ? 's' : ''}`}
              value={attributes.pricing.amount * hours * (isRush && attributes.pricing.rushMultiplier ? attributes.pricing.rushMultiplier : 1)}
            />
          ) : (
            <SummaryRow
              label={`Base ${attributes.pricing.type} price${isRush ? ' (rush)' : ''}`}
              value={attributes.pricing.amount * (isRush && attributes.pricing.rushMultiplier ? attributes.pricing.rushMultiplier : 1)}
            />
          )}
          
          {selectedAddOns.length > 0 && attributes.addOns && 
            attributes.addOns
              .filter(a => selectedAddOns.includes(a.id))
              .map(addOn => (
                <SummaryRow
                  key={addOn.id}
                  label={addOn.name}
                  value={addOn.price}
                  muted
                />
              ))
          }
          
          <div className="pt-2 border-t">
            <SummaryRow label="Total" value={total} bold />
          </div>
        </div>
      </SectionCard>
      
      {/* Skill Level Badge */}
      {attributes.skillLevel && (
        <div className="text-center">
          <span 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize"
            style={{ 
              backgroundColor: `${accentColor}15`, 
              color: accentColor 
            }}
          >
            {attributes.skillLevel === 'specialist' ? '⭐' : ''}
            {attributes.skillLevel} Level
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// VALIDATION HELPER
// =============================================================================

/**
 * Validate freelancer service configuration
 */
export function validateFreelancerService(
  attributes: FreelancerServiceAttributes,
  config: Partial<FreelancerServiceDetails>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (attributes.pricing.type === 'hourly') {
    if (!config.hours || config.hours < 1) {
      errors.hours = 'Please specify number of hours';
    }
    if (attributes.pricing.minHours && config.hours && config.hours < attributes.pricing.minHours) {
      errors.hours = `Minimum ${attributes.pricing.minHours} hours required`;
    }
    if (attributes.pricing.maxHours && config.hours && config.hours > attributes.pricing.maxHours) {
      errors.hours = `Maximum ${attributes.pricing.maxHours} hours allowed`;
    }
  }
  
  return { valid: Object.keys(errors).length === 0, errors };
}
