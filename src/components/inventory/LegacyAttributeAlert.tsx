"use client";

import React, { useState } from "react";
import { AlertTriangle, RefreshCw, Check, X, Info } from "lucide-react";
import {
  detectSchemaVersion,
  migrateAttributes,
  validateMigratedAttributes,
  type SchemaVersionInfo,
  type ValidationResult,
  CURRENT_SCHEMA_VERSION,
} from "@/lib/inventory-migration";
import type { IndustryPackType } from "@/lib/industry-packs";
import type { IndustryAttributes } from "@/types/inventory";

interface LegacyAttributeAlertProps {
  /** Current attributes from the item */
  attributes?: unknown;
  /** Industry pack type */
  industryPack?: IndustryPackType;
  /** Item ID for display */
  itemId?: string;
  /** Item name for display */
  itemName?: string;
  /** Callback when user clicks migrate */
  onMigrate?: (migratedAttributes: IndustryAttributes) => void;
  /** Whether migration is in progress */
  isMigrating?: boolean;
  /** Collapsed by default */
  defaultCollapsed?: boolean;
}

/**
 * Alert component that displays when an inventory item has legacy attributes
 * and offers the user the option to migrate to the new schema.
 */
export function LegacyAttributeAlert({
  attributes,
  industryPack,
  itemId,
  itemName,
  onMigrate,
  isMigrating = false,
  defaultCollapsed = false,
}: LegacyAttributeAlertProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showPreview, setShowPreview] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // Detect schema version
  const versionInfo: SchemaVersionInfo = detectSchemaVersion(attributes, industryPack);

  // Don't show anything if not legacy
  if (!versionInfo.isLegacy) {
    return null;
  }

  // Attempt to preview migration
  const previewMigration = (): { migrated: IndustryAttributes | null; validation: ValidationResult | null } => {
    if (!industryPack || industryPack === "general") {
      return { migrated: null, validation: null };
    }

    const migrated = migrateAttributes(attributes, industryPack);
    if (!migrated) {
      return { migrated: null, validation: null };
    }

    const validation = validateMigratedAttributes(migrated);
    return { migrated, validation };
  };

  const { migrated, validation } = showPreview ? previewMigration() : { migrated: null, validation: null };

  const handleMigrate = () => {
    setMigrationError(null);
    
    if (!industryPack || industryPack === "general") {
      setMigrationError("Cannot migrate without a valid industry pack");
      return;
    }

    const migratedAttrs = migrateAttributes(attributes, industryPack);
    if (!migratedAttrs) {
      setMigrationError("Migration failed - unable to convert attributes");
      return;
    }

    const validationResult = validateMigratedAttributes(migratedAttrs);
    if (!validationResult.valid) {
      setMigrationError(`Migration validation failed: ${validationResult.errors.join(", ")}`);
      return;
    }

    onMigrate?.(migratedAttrs);
  };

  const getIndustryPackLabel = (pack: IndustryPackType | undefined): string => {
    switch (pack) {
      case "restaurant":
        return "Restaurant";
      case "retail":
        return "Retail";
      case "hotel":
        return "Hotel";
      case "freelancer":
        return "Freelancer";
      default:
        return "General";
    }
  };

  return (
    <div className="rounded-lg border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-medium text-amber-800 dark:text-amber-200">
              Legacy Attributes Detected
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
              Schema v{versionInfo.version} → v{CURRENT_SCHEMA_VERSION}
            </span>
          </div>
        </div>
        <span className="text-amber-600 dark:text-amber-400 text-sm">
          {isCollapsed ? "Show details" : "Hide"}
        </span>
      </button>

      {/* Expanded content */}
      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-3 border-t border-amber-200 dark:border-amber-800">
          {/* Info message */}
          <div className="pt-3 text-sm text-amber-700 dark:text-amber-300">
            {itemName && (
              <p className="font-medium mb-1">Item: {itemName}</p>
            )}
            <p>
              This {getIndustryPackLabel(industryPack).toLowerCase()} item uses an older attribute format. 
              Updating to the new schema will enable enhanced features like:
            </p>
            <ul className="mt-2 ml-4 list-disc text-xs space-y-1">
              {industryPack === "restaurant" && (
                <>
                  <li>Toast-style modifier UI with nested options</li>
                  <li>Dietary tags and allergen display</li>
                  <li>Availability scheduling by day part</li>
                  <li>Nutritional information display</li>
                </>
              )}
              {industryPack === "retail" && (
                <>
                  <li>Color swatches and size buttons</li>
                  <li>Per-variant stock tracking</li>
                  <li>Size charts and care instructions</li>
                  <li>Return policy per product</li>
                </>
              )}
              {industryPack === "hotel" && (
                <>
                  <li>Room-level status tracking</li>
                  <li>Seasonal pricing adjustments</li>
                  <li>Add-on services per booking</li>
                  <li>Cancellation policy management</li>
                </>
              )}
              {industryPack === "freelancer" && (
                <>
                  <li>Multiple pricing models (hourly/project/retainer)</li>
                  <li>Milestone-based payments</li>
                  <li>Add-on services and rush pricing</li>
                  <li>Portfolio showcase</li>
                </>
              )}
            </ul>
          </div>

          {/* Migration status */}
          {!versionInfo.migratable && versionInfo.issues.length > 0 && (
            <div className="rounded-md bg-red-100 dark:bg-red-900/30 p-2 text-sm text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2 font-medium">
                <X className="h-4 w-4" />
                Cannot auto-migrate
              </div>
              <ul className="mt-1 ml-6 list-disc text-xs">
                {versionInfo.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview button and preview content */}
          {versionInfo.migratable && (
            <div className="space-y-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 hover:underline"
              >
                <Info className="h-3.5 w-3.5" />
                {showPreview ? "Hide migration preview" : "Preview migration changes"}
              </button>

              {showPreview && migrated && (
                <div className="rounded-md bg-white/50 dark:bg-black/20 p-2 text-xs">
                  <div className="font-medium mb-1">Migration Preview:</div>
                  <pre className="overflow-x-auto text-[10px] bg-muted p-2 rounded max-h-32">
                    {JSON.stringify(migrated, null, 2)}
                  </pre>
                  
                  {validation && (
                    <div className="mt-2">
                      {validation.valid ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Check className="h-3 w-3" />
                          Validation passed
                        </div>
                      ) : (
                        <div className="text-red-600 dark:text-red-400">
                          <div className="flex items-center gap-1">
                            <X className="h-3 w-3" />
                            Validation errors:
                          </div>
                          <ul className="ml-4 list-disc">
                            {validation.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {validation.warnings.length > 0 && (
                        <div className="mt-1 text-amber-600 dark:text-amber-400">
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Warnings:
                          </div>
                          <ul className="ml-4 list-disc">
                            {validation.warnings.map((warn, i) => (
                              <li key={i}>{warn}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {migrationError && (
            <div className="rounded-md bg-red-100 dark:bg-red-900/30 p-2 text-sm text-red-700 dark:text-red-300">
              {migrationError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            {versionInfo.migratable && onMigrate && (
              <button
                onClick={handleMigrate}
                disabled={isMigrating}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isMigrating ? "animate-spin" : ""}`} />
                {isMigrating ? "Migrating..." : "Update to New Schema"}
              </button>
            )}
            <button
              onClick={() => setIsCollapsed(true)}
              className="px-3 py-1.5 rounded-md border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              Dismiss
            </button>
          </div>

          {/* Help text */}
          <p className="text-[10px] text-amber-600 dark:text-amber-500">
            Your existing data will be preserved. You can continue using the item without migrating, 
            but some new features may not be available.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version of the alert for use in lists/tables
 */
export function LegacyAttributeBadge({
  attributes,
  industryPack,
  onClick,
}: {
  attributes?: unknown;
  industryPack?: IndustryPackType;
  onClick?: () => void;
}) {
  const versionInfo = detectSchemaVersion(attributes, industryPack);

  if (!versionInfo.isLegacy) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
      title="Click to view migration options"
    >
      <AlertTriangle className="h-3 w-3" />
      Legacy v{versionInfo.version}
    </button>
  );
}

/**
 * Hook to check if an item needs migration
 */
export function useNeedsMigration(
  attributes: unknown,
  industryPack?: IndustryPackType
): { needsMigration: boolean; versionInfo: SchemaVersionInfo } {
  const versionInfo = detectSchemaVersion(attributes, industryPack);
  return {
    needsMigration: versionInfo.isLegacy && versionInfo.migratable,
    versionInfo,
  };
}

export default LegacyAttributeAlert;
