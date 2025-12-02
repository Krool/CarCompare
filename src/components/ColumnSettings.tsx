"use client";

import { useState, useRef, useEffect } from "react";
import { ColumnId, ColumnConfig } from "@/types/car";

// Define all available columns
// Default columns are chosen to fit on a 1920px monitor: year, make, model, type, safety, seats, fuel, mpg, msrp
export const ALL_COLUMNS: ColumnConfig[] = [
  // Action columns (always visible, not configurable)
  { id: "favorite", label: "Favorite", defaultVisible: true, category: "action" },
  { id: "compare", label: "Compare", defaultVisible: true, category: "action" },
  { id: "baseline", label: "Baseline", defaultVisible: true, category: "action" },
  { id: "image", label: "Image", defaultVisible: true, category: "action" },

  // Identity columns
  { id: "year", label: "Year", sortField: "year", defaultVisible: true, category: "identity" },
  { id: "make", label: "Make", sortField: "make", defaultVisible: true, category: "identity" },
  { id: "model", label: "Model", sortField: "model", defaultVisible: true, category: "identity" },
  { id: "bodyType", label: "Body Type", shortLabel: "Type", sortField: "bodyType", defaultVisible: true, category: "identity" },

  // Safety columns
  { id: "safetyRating", label: "Safety Rating", shortLabel: "Safety", sortField: "safetyRating", defaultVisible: true, category: "safety" },
  { id: "reviewScore", label: "Review Score", shortLabel: "Score", sortField: "reviewScore", defaultVisible: false, category: "safety" },
  { id: "autonomousLevel", label: "ADAS Level", shortLabel: "ADAS", sortField: "autonomousLevel", defaultVisible: false, category: "safety" },

  // Dimensions columns
  { id: "seats", label: "Seats", sortField: "seats", defaultVisible: true, category: "dimensions" },
  { id: "driverLegroomInches", label: "Legroom", sortField: "driverLegroomInches", defaultVisible: false, category: "dimensions" },
  { id: "mirrorsFoldedWidthInches", label: "Width (Folded)", shortLabel: "Folded", sortField: "mirrorsFoldedWidthInches", defaultVisible: false, category: "dimensions" },
  { id: "oneMirrorWidthInches", label: "Width (1 Mirror)", shortLabel: "1 Mirror", defaultVisible: false, category: "dimensions" },
  { id: "bodyWidthInches", label: "Width (Extended)", shortLabel: "Extended", sortField: "bodyWidthInches", defaultVisible: false, category: "dimensions" },
  { id: "heightInches", label: "Height", sortField: "heightInches", defaultVisible: false, category: "dimensions" },
  { id: "groundClearanceInches", label: "Ground Clearance", shortLabel: "Clearance", sortField: "groundClearanceInches", defaultVisible: false, category: "dimensions" },

  // Powertrain columns
  { id: "fuelType", label: "Fuel Type", shortLabel: "Fuel", defaultVisible: true, category: "powertrain" },
  { id: "plugType", label: "Plug Type", shortLabel: "Plug", defaultVisible: false, category: "powertrain" },
  { id: "mpgCombined", label: "Efficiency", sortField: "mpgCombined", defaultVisible: true, category: "powertrain" },
  { id: "electricRangeMiles", label: "EV Range", sortField: "electricRangeMiles", defaultVisible: false, category: "powertrain" },
  { id: "zeroToSixtySeconds", label: "0-60 mph", shortLabel: "0-60", sortField: "zeroToSixtySeconds", defaultVisible: false, category: "powertrain" },
  { id: "horsepower", label: "Horsepower", shortLabel: "HP", sortField: "horsepower", defaultVisible: false, category: "powertrain" },

  // Pricing & Ownership columns
  { id: "msrp", label: "MSRP", sortField: "msrp", defaultVisible: true, category: "pricing" },
  { id: "leaseRating", label: "Lease Rating", shortLabel: "Lease", sortField: "leaseRating", defaultVisible: false, category: "pricing" },
  { id: "depreciationCategory", label: "Depreciation", shortLabel: "Deprec.", sortField: "depreciationCategory", defaultVisible: false, category: "pricing" },
  { id: "fiveYearResalePercent", label: "5-Year Resale %", shortLabel: "Resale", sortField: "fiveYearResalePercent", defaultVisible: false, category: "pricing" },
  { id: "reliabilityRating", label: "Reliability", sortField: "reliabilityRating", defaultVisible: false, category: "pricing" },
  { id: "insuranceCostAnnual", label: "Insurance/yr", shortLabel: "Insure", sortField: "insuranceCostAnnual", defaultVisible: false, category: "pricing" },
  { id: "maintenanceCostAnnual", label: "Maintenance/yr", shortLabel: "Maint", sortField: "maintenanceCostAnnual", defaultVisible: false, category: "pricing" },
  { id: "notes", label: "Notes", defaultVisible: false, category: "pricing" },
];

// Default visible columns (all non-action columns)
export const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = ALL_COLUMNS
  .filter(c => c.defaultVisible && c.category !== "action")
  .map(c => c.id);

// Presets
const PRESETS: { name: string; columns: ColumnId[] }[] = [
  {
    name: "All Columns",
    columns: ALL_COLUMNS.filter(c => c.category !== "action").map(c => c.id),
  },
  {
    name: "Minimal",
    columns: ["year", "make", "model", "bodyType", "msrp"],
  },
  {
    name: "Garage Fit",
    columns: ["year", "make", "model", "mirrorsFoldedWidthInches", "oneMirrorWidthInches", "bodyWidthInches", "heightInches", "groundClearanceInches"],
  },
  {
    name: "Safety Focus",
    columns: ["year", "make", "model", "safetyRating", "reviewScore", "autonomousLevel"],
  },
  {
    name: "EV Focus",
    columns: ["year", "make", "model", "fuelType", "plugType", "mpgCombined", "electricRangeMiles", "msrp"],
  },
  {
    name: "Value Focus",
    columns: ["year", "make", "model", "msrp", "leaseRating", "depreciationCategory", "fiveYearResalePercent", "reliabilityRating", "insuranceCostAnnual", "maintenanceCostAnnual"],
  },
  {
    name: "Performance",
    columns: ["year", "make", "model", "zeroToSixtySeconds", "horsepower", "fuelType", "msrp"],
  },
];

interface ColumnSettingsProps {
  visibleColumns: ColumnId[];
  onColumnsChange: (columns: ColumnId[]) => void;
}

export default function ColumnSettings({ visibleColumns, onColumnsChange }: ColumnSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (columnId: ColumnId) => {
    if (visibleColumns.includes(columnId)) {
      onColumnsChange(visibleColumns.filter(id => id !== columnId));
    } else {
      onColumnsChange([...visibleColumns, columnId]);
    }
  };

  const applyPreset = (preset: { name: string; columns: ColumnId[] }) => {
    onColumnsChange(preset.columns);
  };

  const configurableColumns = ALL_COLUMNS.filter(c => c.category !== "action");
  const categories = ["identity", "safety", "dimensions", "powertrain", "pricing"] as const;

  const categoryLabels: Record<typeof categories[number], string> = {
    identity: "Identity",
    safety: "Safety & Ratings",
    dimensions: "Dimensions",
    powertrain: "Powertrain",
    pricing: "Pricing & Notes",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium flex items-center gap-2"
        title="Customize columns"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Columns
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-[70vh] overflow-y-auto">
          <div className="p-4">
            <h3 className="text-white font-semibold mb-3">Customize Columns</h3>

            {/* Presets */}
            <div className="mb-4">
              <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Column categories */}
            {categories.map((category) => {
              const columnsInCategory = configurableColumns.filter(c => c.category === category);
              return (
                <div key={category} className="mb-4">
                  <label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">
                    {categoryLabels[category]}
                  </label>
                  <div className="space-y-1">
                    {columnsInCategory.map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column.id)}
                          onChange={() => toggleColumn(column.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-300 text-sm">{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Reset button */}
            <div className="pt-3 border-t border-gray-700">
              <button
                onClick={() => onColumnsChange(DEFAULT_VISIBLE_COLUMNS)}
                className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
