"use client";

import { useState, useMemo, useEffect } from "react";
import { Car, ColumnId, BodyType, FuelType, SortField, SafetyRating, AutonomousLevel, PlugType } from "@/types/car";
import { ALL_COLUMNS } from "./ColumnSettings";
import { useFocusTrap } from "@/lib/useFocusTrap";

interface SetupWizardProps {
  cars: Car[];
  onComplete: (settings: {
    columns: ColumnId[];
    baseline: Car | null;
    filters: {
      bodyTypes?: BodyType[];
      fuelTypes?: FuelType[];
      minYear?: number;
      maxYear?: number;
      minSeats?: number;
      maxSeats?: number;
      seats?: number[];
      minPrice?: number;
      maxPrice?: number;
      safetyRatings?: SafetyRating[];
      autonomousLevels?: AutonomousLevel[];
      hasHandsFree?: boolean;
      minMpg?: number;
      minEvRange?: number;
      plugTypes?: PlugType[];
      makes?: string[];
    };
    sortConfig?: { field: SortField; direction: "asc" | "desc" };
  }) => void;
  onSkip: () => void;
}

type WizardStep = "welcome" | "use-case" | "baseline" | "preferences" | "complete";

// Column to car property mapping for checking empty values
// Some columns are computed (like oneMirrorWidthInches) so we use functions
const COLUMN_TO_PROPERTY: Record<string, keyof Car | ((car: Car) => unknown)> = {
  year: "year",
  make: "make",
  model: "model",
  bodyType: "bodyType",
  safetyRating: "safetyRating",
  reviewScore: "reviewScore",
  autonomousLevel: "autonomousLevel",
  seats: "seats",
  driverLegroomInches: "driverLegroomInches",
  mirrorsFoldedWidthInches: "mirrorsFoldedWidthInches",
  // oneMirrorWidthInches is computed from bodyWidthInches + buffer, so we check bodyWidthInches
  oneMirrorWidthInches: (car: Car) => car.bodyWidthInches,
  bodyWidthInches: "bodyWidthInches",
  heightInches: "heightInches",
  groundClearanceInches: "groundClearanceInches",
  fuelType: "fuelType",
  // plugType: check if it's not "none"
  plugType: (car: Car) => car.plugType !== "none" ? car.plugType : null,
  mpgCombined: "mpgCombined",
  electricRangeMiles: "electricRangeMiles",
  zeroToSixtySeconds: "zeroToSixtySeconds",
  horsepower: "horsepower",
  msrp: "msrp",
  leaseRating: "leaseRating",
  depreciationCategory: "depreciationCategory",
  fiveYearResalePercent: "fiveYearResalePercent",
  reliabilityRating: "reliabilityRating",
  insuranceCostAnnual: "insuranceCostAnnual",
  maintenanceCostAnnual: "maintenanceCostAnnual",
  notes: "notes",
};

// Helper to check if a value is "empty" for display purposes
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (typeof value === "number" && isNaN(value)) return true;
  return false;
}

// Helper to check if a column has any non-empty values in the filtered cars
function columnHasData(columnId: ColumnId, cars: Car[]): boolean {
  const property = COLUMN_TO_PROPERTY[columnId];
  if (!property) return true; // If we don't know how to check, keep the column

  for (const car of cars) {
    let value: unknown;
    if (typeof property === "function") {
      value = property(car);
    } else {
      value = car[property];
    }
    if (!isEmptyValue(value)) {
      return true;
    }
  }
  return false;
}

// Preset configurations based on use case - can select multiple
const USE_CASE_PRESETS = {
  "garage-fit": {
    label: "Garage Fit",
    description: "Dimensions for parking spaces",
    columns: ["lengthInches", "mirrorsFoldedWidthInches", "oneMirrorWidthInches", "bodyWidthInches", "heightInches", "groundClearanceInches"] as ColumnId[],
    icon: "🏠",
  },
  "family": {
    label: "Family Safety",
    description: "Safety ratings and seating",
    columns: ["safetyRating", "seats", "reliabilityRating"] as ColumnId[],
    icon: "👨‍👩‍👧‍👦",
  },
  "budget": {
    label: "Budget & Costs",
    description: "Ownership and running costs",
    columns: ["mpgCombined", "reliabilityRating", "insuranceCostAnnual", "maintenanceCostAnnual", "depreciationCategory"] as ColumnId[],
    icon: "💰",
  },
  "ev-shopping": {
    label: "EV / Electric",
    description: "Range and charging info",
    columns: ["electricRangeMiles", "plugType", "fuelType"] as ColumnId[],
    icon: "⚡",
  },
  "performance": {
    label: "Performance",
    description: "Speed and power stats",
    columns: ["zeroToSixtySeconds", "horsepower"] as ColumnId[],
    icon: "🏎️",
  },
};

type UseCaseKey = keyof typeof USE_CASE_PRESETS;

// Base columns always included
const BASE_COLUMNS: ColumnId[] = ["year", "make", "model", "bodyType", "msrp"];

export default function SetupWizard({ cars, onComplete, onSkip }: SetupWizardProps) {
  const focusTrapRef = useFocusTrap();
  const [step, setStep] = useState<WizardStep>("welcome");
  const [selectedUseCases, setSelectedUseCases] = useState<UseCaseKey[]>([]);
  const [selectedBaseline, setSelectedBaseline] = useState<Car | null>(null);
  const [baselineSearch, setBaselineSearch] = useState("");
  const [preferences, setPreferences] = useState({
    bodyTypes: [] as BodyType[],
    fuelTypes: [] as FuelType[],
    newOnly: false,
    minYear: undefined as number | undefined,
    maxYear: undefined as number | undefined,
    minSeats: undefined as number | undefined,
    seats: [] as number[],
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    safetyRatings: [] as SafetyRating[],
    autonomousLevels: [] as AutonomousLevel[],
    hasHandsFree: false,
    minMpg: undefined as number | undefined,
    minEvRange: undefined as number | undefined,
    plugTypes: [] as PlugType[],
    makes: [] as string[],
  });
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: "asc" | "desc" } | undefined>(undefined);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Handle ESC key to close wizard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  // Get unique makes from all cars for make filter
  const availableMakes = useMemo(() => {
    const makes = new Set<string>();
    cars.forEach(car => makes.add(car.make));
    return Array.from(makes).sort();
  }, [cars]);

  // Filter cars based on current preferences (for column filtering and previews)
  const preferencesFilteredCars = useMemo(() => {
    return cars.filter(car => {
      // Body type filter
      if (preferences.bodyTypes.length > 0 && !preferences.bodyTypes.includes(car.bodyType)) {
        return false;
      }
      // Fuel type filter
      if (preferences.fuelTypes.length > 0 && !preferences.fuelTypes.includes(car.fuelType)) {
        return false;
      }
      // Year filter
      if (preferences.newOnly && car.year < 2024) {
        return false;
      }
      if (preferences.minYear && car.year < preferences.minYear) {
        return false;
      }
      if (preferences.maxYear && car.year > preferences.maxYear) {
        return false;
      }
      // Seats filter
      if (preferences.minSeats && car.seats < preferences.minSeats) {
        return false;
      }
      if (preferences.seats.length > 0 && !preferences.seats.includes(car.seats)) {
        return false;
      }
      // Price filter
      if (preferences.minPrice && car.msrp && car.msrp < preferences.minPrice) {
        return false;
      }
      if (preferences.maxPrice && car.msrp && car.msrp > preferences.maxPrice) {
        return false;
      }
      // Safety filter
      if (preferences.safetyRatings.length > 0 && (!car.safetyRating || !preferences.safetyRatings.includes(car.safetyRating))) {
        return false;
      }
      // Autonomous level filter
      if (preferences.autonomousLevels.length > 0 && (!car.autonomousLevel || !preferences.autonomousLevels.includes(car.autonomousLevel))) {
        return false;
      }
      // Hands-free filter
      if (preferences.hasHandsFree && car.autonomousLevel !== "hands-free" && car.autonomousLevel !== "full-self-driving") {
        return false;
      }
      // MPG filter
      if (preferences.minMpg) {
        const mpg = car.mpgCombined || car.mpge;
        if (!mpg || mpg < preferences.minMpg) {
          return false;
        }
      }
      // EV range filter
      if (preferences.minEvRange && (!car.electricRangeMiles || car.electricRangeMiles < preferences.minEvRange)) {
        return false;
      }
      // Plug type filter
      if (preferences.plugTypes.length > 0 && !preferences.plugTypes.includes(car.plugType)) {
        return false;
      }
      // Make filter
      if (preferences.makes.length > 0 && !preferences.makes.includes(car.make)) {
        return false;
      }
      return true;
    });
  }, [cars, preferences]);

  // Combine columns from all selected use cases, excluding empty columns
  const combinedColumns = useMemo(() => {
    let baseColumns: ColumnId[];

    if (selectedUseCases.length === 0) {
      // Default: show all columns
      baseColumns = ALL_COLUMNS.filter(c => c.category !== "action" && c.defaultVisible).map(c => c.id);
    } else {
      const columnsSet = new Set<ColumnId>(BASE_COLUMNS);
      selectedUseCases.forEach(key => {
        USE_CASE_PRESETS[key].columns.forEach(col => columnsSet.add(col));
      });

      // Return in a logical order based on ALL_COLUMNS order
      baseColumns = ALL_COLUMNS
        .filter(c => c.category !== "action" && columnsSet.has(c.id))
        .map(c => c.id);
    }

    // Filter out columns that have no data in the filtered cars
    // Always keep base identity columns
    const alwaysKeep: ColumnId[] = ["year", "make", "model", "bodyType", "msrp"];
    return baseColumns.filter(col =>
      alwaysKeep.includes(col) || columnHasData(col, preferencesFilteredCars)
    );
  }, [selectedUseCases, preferencesFilteredCars]);

  const toggleUseCase = (key: UseCaseKey) => {
    setSelectedUseCases(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  // Filter cars for baseline selection
  const filteredCars = cars.filter(car => {
    if (!baselineSearch.trim()) return false;
    const search = baselineSearch.toLowerCase();
    return `${car.year} ${car.make} ${car.model}`.toLowerCase().includes(search);
  }).slice(0, 8);

  // Popular baseline suggestions
  const popularBaselines = [
    cars.find(c => c.make === "Toyota" && c.model === "RAV4" && c.year >= 2024),
    cars.find(c => c.make === "Honda" && c.model === "CR-V" && c.year >= 2024),
    cars.find(c => c.make === "Tesla" && c.model === "Model Y"),
    cars.find(c => c.make === "Ford" && c.model === "F-150" && c.year >= 2024),
    cars.find(c => c.make === "Toyota" && c.model === "Camry" && c.year >= 2024),
  ].filter(Boolean) as Car[];

  // Generate shareable URL based on current settings
  const generateShareUrl = () => {
    const params = new URLSearchParams();

    // Columns - use short codes
    if (combinedColumns.length > 0) {
      params.set("c", combinedColumns.join(","));
    }

    // Filters
    if (preferences.bodyTypes.length > 0) {
      params.set("bt", preferences.bodyTypes.join(","));
    }
    if (preferences.fuelTypes.length > 0) {
      params.set("ft", preferences.fuelTypes.join(","));
    }
    if (preferences.newOnly) {
      params.set("y", "2024");
    } else if (preferences.minYear) {
      params.set("minY", String(preferences.minYear));
    }
    if (preferences.maxYear) {
      params.set("maxY", String(preferences.maxYear));
    }
    if (preferences.minSeats) {
      params.set("s", String(preferences.minSeats));
    }
    if (preferences.seats.length > 0) {
      params.set("seats", preferences.seats.join(","));
    }
    if (preferences.minPrice) {
      params.set("minP", String(preferences.minPrice));
    }
    if (preferences.maxPrice) {
      params.set("p", String(preferences.maxPrice));
    }
    if (preferences.safetyRatings.length > 0) {
      params.set("sr", preferences.safetyRatings.join(","));
    }
    if (preferences.autonomousLevels.length > 0) {
      params.set("al", preferences.autonomousLevels.join(","));
    }
    if (preferences.hasHandsFree) {
      params.set("hf", "1");
    }
    if (preferences.minMpg) {
      params.set("mpg", String(preferences.minMpg));
    }
    if (preferences.minEvRange) {
      params.set("evr", String(preferences.minEvRange));
    }
    if (preferences.plugTypes.length > 0) {
      params.set("pt", preferences.plugTypes.join(","));
    }
    if (preferences.makes.length > 0) {
      params.set("m", preferences.makes.join(","));
    }

    // Sort config
    if (sortConfig) {
      params.set("sf", sortConfig.field);
      params.set("sd", sortConfig.direction);
    }

    // Baseline car
    if (selectedBaseline) {
      params.set("b", selectedBaseline.id);
    }

    const baseUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
    return `${baseUrl}?${params.toString()}`;
  };

  const handleComplete = () => {
    onComplete({
      columns: combinedColumns,
      baseline: selectedBaseline,
      filters: {
        bodyTypes: preferences.bodyTypes.length > 0 ? preferences.bodyTypes : undefined,
        fuelTypes: preferences.fuelTypes.length > 0 ? preferences.fuelTypes : undefined,
        minYear: preferences.newOnly ? 2024 : preferences.minYear,
        maxYear: preferences.maxYear,
        minSeats: preferences.minSeats,
        seats: preferences.seats.length > 0 ? preferences.seats : undefined,
        minPrice: preferences.minPrice,
        maxPrice: preferences.maxPrice,
        safetyRatings: preferences.safetyRatings.length > 0 ? preferences.safetyRatings : undefined,
        autonomousLevels: preferences.autonomousLevels.length > 0 ? preferences.autonomousLevels : undefined,
        hasHandsFree: preferences.hasHandsFree || undefined,
        minMpg: preferences.minMpg,
        minEvRange: preferences.minEvRange,
        plugTypes: preferences.plugTypes.length > 0 ? preferences.plugTypes : undefined,
        makes: preferences.makes.length > 0 ? preferences.makes : undefined,
      },
      sortConfig,
    });
  };

  const toggleBodyType = (type: BodyType) => {
    setPreferences(prev => ({
      ...prev,
      bodyTypes: prev.bodyTypes.includes(type)
        ? prev.bodyTypes.filter(t => t !== type)
        : [...prev.bodyTypes, type],
    }));
  };

  const toggleFuelType = (type: FuelType) => {
    setPreferences(prev => ({
      ...prev,
      fuelTypes: prev.fuelTypes.includes(type)
        ? prev.fuelTypes.filter(t => t !== type)
        : [...prev.fuelTypes, type],
    }));
  };

  const toggleSafetyRating = (rating: SafetyRating) => {
    setPreferences(prev => ({
      ...prev,
      safetyRatings: prev.safetyRatings.includes(rating)
        ? prev.safetyRatings.filter(r => r !== rating)
        : [...prev.safetyRatings, rating],
    }));
  };

  const toggleAutonomousLevel = (level: AutonomousLevel) => {
    setPreferences(prev => ({
      ...prev,
      autonomousLevels: prev.autonomousLevels.includes(level)
        ? prev.autonomousLevels.filter(l => l !== level)
        : [...prev.autonomousLevels, level],
    }));
  };

  const togglePlugType = (type: PlugType) => {
    setPreferences(prev => ({
      ...prev,
      plugTypes: prev.plugTypes.includes(type)
        ? prev.plugTypes.filter(t => t !== type)
        : [...prev.plugTypes, type],
    }));
  };

  const toggleMake = (make: string) => {
    setPreferences(prev => ({
      ...prev,
      makes: prev.makes.includes(make)
        ? prev.makes.filter(m => m !== make)
        : [...prev.makes, make],
    }));
  };

  const toggleSeats = (seats: number) => {
    setPreferences(prev => ({
      ...prev,
      seats: prev.seats.includes(seats)
        ? prev.seats.filter(s => s !== seats)
        : [...prev.seats, seats],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <div ref={focusTrapRef} className="surface-elevated rounded-2xl max-w-2xl w-full p-8 modal-content max-h-[90vh] overflow-y-auto">
        {/* Progress indicator - clickable steps */}
        <nav aria-label="Setup progress" className="flex justify-center mb-8">
          <ol className="flex items-center gap-2">
            {(["welcome", "use-case", "baseline", "preferences", "complete"] as WizardStep[]).map((s, i) => {
              const stepNames = ["Welcome", "Use Case", "Baseline", "Filters", "Done"];
              const currentIndex = ["welcome", "use-case", "baseline", "preferences", "complete"].indexOf(step);
              const isCompleted = currentIndex > i;
              const isCurrent = step === s;
              const canNavigate = isCompleted;

              return (
                <li key={s} className="flex items-center">
                  <button
                    onClick={() => canNavigate && setStep(s)}
                    disabled={!canNavigate}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`Step ${i + 1} of 5: ${stepNames[i]}${isCurrent ? " (current)" : isCompleted ? " (completed)" : ""}`}
                    className={`w-3 h-3 rounded-full transition-all ${
                      isCurrent ? "bg-amber-500 ring-2 ring-amber-300/50" :
                      isCompleted ? "bg-emerald-500 cursor-pointer hover:ring-2 hover:ring-emerald-300/50" :
                      "bg-gray-700 cursor-not-allowed"
                    }`}
                    title={canNavigate ? `Go back to ${stepNames[i]}` : stepNames[i]}
                  />
                  {i < 4 && (
                    <div className={`w-8 h-0.5 ${isCompleted ? "bg-emerald-500/50" : "bg-gray-700"}`} aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Welcome Step */}
        {step === "welcome" && (
          <div className="text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-900/20">
              <svg className="w-7 h-7 text-gray-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2M5 17l-1 2m15-2l1 2" />
                <circle cx="7.5" cy="17" r="1" fill="currentColor" />
                <circle cx="16.5" cy="17" r="1" fill="currentColor" />
              </svg>
            </div>
            <h2 id="wizard-title" className="text-3xl font-bold text-white mb-3">
              Welcome to <span className="text-gradient-gold">Car</span>Compare
            </h2>
            <p className="text-gray-400 mb-8">
              Set up your experience in a few quick steps.
              <br />
              <span className="text-gray-500 text-sm">Takes about 30 seconds.</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStep("use-case")}
                className="px-8 py-3 btn-accent rounded-xl text-base font-semibold"
              >
                Get Started
              </button>
              <button
                onClick={onSkip}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-base border border-gray-700/50 transition-colors"
              >
                Skip Setup
              </button>
            </div>
          </div>
        )}

        {/* Use Case Step */}
        {step === "use-case" && (
          <div className="animate-fadeIn">
            <h2 id="wizard-title" className="text-2xl font-bold text-white mb-2 text-center">
              What brings you here?
            </h2>
            <p className="text-gray-400 mb-6 text-center">
              Select all that apply. We&apos;ll show columns relevant to your needs.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {(Object.entries(USE_CASE_PRESETS) as [UseCaseKey, typeof USE_CASE_PRESETS[UseCaseKey]][]).map(([key, preset]) => {
                const isSelected = selectedUseCases.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleUseCase(key)}
                    aria-pressed={isSelected}
                    className={`p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-amber-500/10 border border-amber-500/40 shadow-lg shadow-amber-900/10"
                        : "bg-gray-800/30 border border-gray-700/30 hover:border-gray-600/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{preset.icon}</span>
                      {isSelected && <span className="text-amber-400 text-sm">✓</span>}
                    </div>
                    <span className="text-white font-medium text-sm block">{preset.label}</span>
                    <span className="text-gray-400 text-xs">{preset.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Preview of selected columns */}
            {selectedUseCases.length > 0 && (
              <div className="surface-inset rounded-xl p-3 mb-6">
                <p className="text-gray-500 text-xs mb-2">
                  Columns: <span className="text-amber-400 font-medium">{combinedColumns.length}</span> selected
                </p>
                <div className="flex flex-wrap gap-1">
                  {combinedColumns.slice(0, 12).map(col => {
                    const colConfig = ALL_COLUMNS.find(c => c.id === col);
                    return (
                      <span key={col} className="px-2 py-0.5 bg-gray-800/50 text-gray-400 text-xs rounded-md border border-gray-700/30">
                        {colConfig?.shortLabel || colConfig?.label || col}
                      </span>
                    );
                  })}
                  {combinedColumns.length > 12 && (
                    <span className="px-2 py-0.5 text-gray-500 text-xs">
                      +{combinedColumns.length - 12} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep("welcome")}
                className="px-6 py-2 text-gray-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep("baseline")}
                className="px-8 py-3 rounded-lg font-medium btn-accent"
              >
                {selectedUseCases.length === 0 ? "Show All Columns" : "Next"}
              </button>
            </div>
          </div>
        )}

        {/* Baseline Step */}
        {step === "baseline" && (
          <div className="animate-fadeIn">
            <h2 id="wizard-title" className="text-2xl font-bold text-white mb-2 text-center">
              Do you have a reference car?
            </h2>
            <p className="text-gray-400 mb-6 text-center">
              Compare all cars against a baseline (your current car or a known size).
              <br />
              <span className="text-sm">You can change this anytime.</span>
            </p>

            {/* Search */}
            <div className="mb-4">
              <label htmlFor="wizard-baseline-search" className="sr-only">Search for a baseline car</label>
              <input
                id="wizard-baseline-search"
                type="text"
                placeholder="Search for a car (e.g., 2024 Toyota RAV4)"
                value={baselineSearch}
                onChange={(e) => setBaselineSearch(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white placeholder-gray-400"
              />
              {filteredCars.length > 0 && (
                <div className="mt-2 surface-inset rounded-xl border border-gray-700/30 max-h-48 overflow-y-auto">
                  {filteredCars.map(car => (
                    <button
                      key={car.id}
                      onClick={() => {
                        setSelectedBaseline(car);
                        setBaselineSearch("");
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 text-white flex justify-between"
                    >
                      <span>{car.year} {car.make} {car.model}</span>
                      <span className="text-gray-400">{car.bodyType}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected baseline */}
            {selectedBaseline && (
              <div className="mb-4 p-4 bg-amber-900/15 border border-amber-700/30 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">
                    {selectedBaseline.year} {selectedBaseline.make} {selectedBaseline.model}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">selected as baseline</span>
                </div>
                <button
                  onClick={() => setSelectedBaseline(null)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Clear selected baseline"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            )}

            {/* Quick picks */}
            {!selectedBaseline && (
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">Popular choices:</p>
                <div className="flex flex-wrap gap-2">
                  {popularBaselines.map(car => (
                    <button
                      key={car.id}
                      onClick={() => setSelectedBaseline(car)}
                      className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-700/30 text-sm rounded-full"
                    >
                      {car.year} {car.make} {car.model}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep("use-case")}
                className="px-6 py-2 text-gray-400 hover:text-white"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("preferences")}
                  className="px-6 py-2 text-gray-400 hover:text-white"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep("preferences")}
                  className="px-8 py-3 btn-accent rounded-xl font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Step */}
        {step === "preferences" && (
          <div className="animate-fadeIn">
            <h2 id="wizard-title" className="text-2xl font-bold text-white mb-2 text-center">
              Filter Your Results
            </h2>
            <p className="text-gray-400 mb-6 text-center">
              Narrow down to exactly what you&apos;re looking for. All filters are optional.
            </p>

            {/* Body types with descriptions */}
            <div className="mb-4 surface-inset rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">Body Style</p>
                  <p className="text-gray-400 text-xs">What type of vehicle?</p>
                </div>
                {preferences.bodyTypes.length > 0 && (
                  <span className="text-amber-400 text-xs">{preferences.bodyTypes.length} selected</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { type: "sedan" as BodyType, desc: "Traditional 4-door" },
                  { type: "crossover" as BodyType, desc: "Compact utility" },
                  { type: "suv" as BodyType, desc: "Full-size utility" },
                  { type: "truck" as BodyType, desc: "Pickup truck" },
                  { type: "minivan" as BodyType, desc: "Family hauler" },
                  { type: "hatchback" as BodyType, desc: "Sporty compact" },
                  { type: "wagon" as BodyType, desc: "Extended sedan" },
                  { type: "coupe" as BodyType, desc: "2-door sporty" },
                ]).map(({ type, desc }) => (
                  <button
                    key={type}
                    onClick={() => toggleBodyType(type)}
                    aria-pressed={preferences.bodyTypes.includes(type)}
                    className={`p-2 rounded-lg text-left transition-all ${
                      preferences.bodyTypes.includes(type)
                        ? "bg-amber-500/10 border border-amber-500/40"
                        : "bg-gray-800/30 border border-gray-700/30 hover:border-gray-600/50"
                    }`}
                  >
                    <span className="text-white text-sm capitalize block">{type}</span>
                    <span className="text-gray-400 text-xs">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fuel types with descriptions */}
            <div className="mb-4 surface-inset rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">Powertrain</p>
                  <p className="text-gray-400 text-xs">What type of engine or motor?</p>
                </div>
                {preferences.fuelTypes.length > 0 && (
                  <span className="text-amber-400 text-xs">{preferences.fuelTypes.length} selected</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {([
                  { type: "gasoline" as FuelType, desc: "Traditional gas", icon: "⛽" },
                  { type: "hybrid" as FuelType, desc: "Gas + electric", icon: "🔋" },
                  { type: "plug-in-hybrid" as FuelType, desc: "Plugs in + gas", icon: "🔌" },
                  { type: "electric" as FuelType, desc: "100% battery", icon: "⚡" },
                ]).map(({ type, desc, icon }) => (
                  <button
                    key={type}
                    onClick={() => toggleFuelType(type)}
                    aria-pressed={preferences.fuelTypes.includes(type)}
                    className={`p-2 rounded-lg text-left transition-all ${
                      preferences.fuelTypes.includes(type)
                        ? "bg-amber-500/10 border border-amber-500/40"
                        : "bg-gray-800/30 border border-gray-700/30 hover:border-gray-600/50"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{icon}</span>
                      <span className="text-white text-sm capitalize">{type.replace("-", " ")}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick common filters row */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {/* Price Budget */}
              <div className="surface-inset rounded-xl p-3">
                <p className="text-white text-sm font-medium mb-2">Budget</p>
                <div className="flex flex-wrap gap-1">
                  {[40000, 50000, 60000, 80000].map(price => (
                    <button
                      key={price}
                      onClick={() => setPreferences(prev => ({
                        ...prev,
                        maxPrice: prev.maxPrice === price ? undefined : price
                      }))}
                      className={`px-2 py-1 rounded text-xs ${
                        preferences.maxPrice === price
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-gray-300"
                      }`}
                    >
                      &lt;${(price / 1000)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Seats */}
              <div className="surface-inset rounded-xl p-3">
                <p className="text-white text-sm font-medium mb-2">Min Seats</p>
                <div className="flex flex-wrap gap-1">
                  {[5, 6, 7, 8].map(num => (
                    <button
                      key={num}
                      onClick={() => setPreferences(prev => ({
                        ...prev,
                        minSeats: prev.minSeats === num ? undefined : num
                      }))}
                      className={`px-2 py-1 rounded text-xs ${
                        preferences.minSeats === num
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-gray-300"
                      }`}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* New cars only toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 surface-inset rounded-xl">
                <input
                  type="checkbox"
                  checked={preferences.newOnly}
                  onChange={(e) => setPreferences(prev => ({ ...prev, newOnly: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-800 accent-amber-500"
                />
                <div>
                  <span className="text-white block">Only new cars (2024+)</span>
                  <span className="text-gray-400 text-xs">Exclude older model years</span>
                </div>
              </label>
            </div>

            {/* Advanced Filters toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="w-full mb-4 px-4 py-3 bg-amber-900/15 hover:bg-amber-900/25 text-gray-200 rounded-xl text-sm flex items-center justify-between border border-amber-800/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                <div className="text-left">
                  <span className="font-medium block">Advanced Filters</span>
                  <span className="text-amber-400/70 text-xs">Safety ratings, ADAS tech, efficiency, brands</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">4 categories</span>
                <span className="text-amber-400">{showAdvancedFilters ? "▲" : "▼"}</span>
              </div>
            </button>

            {showAdvancedFilters && (
              <div className="space-y-3 mb-4 border-l-2 border-amber-700/30 pl-4">
                {/* Safety Rating */}
                <div className="surface-inset rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-sm font-medium">🛡️ Safety Rating (IIHS)</p>
                    {preferences.safetyRatings.length > 0 && (
                      <span className="text-amber-400 text-xs">{preferences.safetyRatings.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { rating: "TSP+" as SafetyRating, label: "TSP+", desc: "Top Safety Pick+" },
                      { rating: "TSP" as SafetyRating, label: "TSP", desc: "Top Safety Pick" },
                      { rating: "Good" as SafetyRating, label: "Good", desc: "Good rating" },
                    ]).map(({ rating, label }) => (
                      <button
                        key={rating}
                        onClick={() => toggleSafetyRating(rating)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          preferences.safetyRatings.includes(rating)
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Driver Assistance */}
                <div className="surface-inset rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-sm font-medium">🤖 Driver Assistance (ADAS)</p>
                    {(preferences.autonomousLevels.length > 0 || preferences.hasHandsFree) && (
                      <span className="text-amber-400 text-xs">filtered</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {([
                      { level: "full-self-driving" as AutonomousLevel, label: "Full Self-Driving" },
                      { level: "hands-free" as AutonomousLevel, label: "Hands-Free Highway" },
                      { level: "enhanced" as AutonomousLevel, label: "Enhanced ADAS" },
                      { level: "basic" as AutonomousLevel, label: "Basic ADAS" },
                    ]).map(({ level, label }) => (
                      <button
                        key={level}
                        onClick={() => toggleAutonomousLevel(level)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          preferences.autonomousLevels.includes(level)
                            ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                            : "bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-300 mt-2">
                    <input
                      type="checkbox"
                      checked={preferences.hasHandsFree}
                      onChange={(e) => setPreferences(prev => ({ ...prev, hasHandsFree: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 accent-amber-500"
                    />
                    Must have hands-free highway driving
                  </label>
                </div>

                {/* Efficiency */}
                <div className="surface-inset rounded-xl p-3">
                  <p className="text-white text-sm font-medium mb-2">⛽ Efficiency</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Min MPG/MPGe</p>
                      <div className="flex flex-wrap gap-1">
                        {[25, 30, 35, 40].map(mpg => (
                          <button
                            key={mpg}
                            onClick={() => setPreferences(prev => ({
                              ...prev,
                              minMpg: prev.minMpg === mpg ? undefined : mpg
                            }))}
                            className={`px-2 py-1 rounded text-xs ${
                              preferences.minMpg === mpg
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-gray-300"
                            }`}
                          >
                            {mpg}+
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Min EV Range (mi)</p>
                      <div className="flex flex-wrap gap-1">
                        {[200, 250, 300, 350].map(range => (
                          <button
                            key={range}
                            onClick={() => setPreferences(prev => ({
                              ...prev,
                              minEvRange: prev.minEvRange === range ? undefined : range
                            }))}
                            className={`px-2 py-1 rounded text-xs ${
                              preferences.minEvRange === range
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-gray-300"
                            }`}
                          >
                            {range}+
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* EV Plug Type */}
                {(preferences.fuelTypes.includes("electric") || preferences.fuelTypes.includes("plug-in-hybrid") || preferences.fuelTypes.length === 0) && (
                  <div className="surface-inset rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white text-sm font-medium">🔌 EV Plug Type</p>
                      {preferences.plugTypes.length > 0 && (
                        <span className="text-amber-400 text-xs">{preferences.plugTypes.length} selected</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { type: "NACS" as PlugType, label: "NACS (Tesla)" },
                        { type: "CCS1" as PlugType, label: "CCS1" },
                        { type: "J1772" as PlugType, label: "J1772" },
                        { type: "CHAdeMO" as PlugType, label: "CHAdeMO" },
                      ]).map(({ type, label }) => (
                        <button
                          key={type}
                          onClick={() => togglePlugType(type)}
                          className={`px-3 py-1.5 rounded text-sm ${
                            preferences.plugTypes.includes(type)
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Makes */}
                <div className="surface-inset rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-sm font-medium">🏭 Brands</p>
                    {preferences.makes.length > 0 && (
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, makes: [] }))}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Clear ({preferences.makes.length})
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {availableMakes.slice(0, 20).map(make => (
                      <button
                        key={make}
                        onClick={() => toggleMake(make)}
                        className={`px-2 py-1 rounded text-xs ${
                          preferences.makes.includes(make)
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-gray-300"
                        }`}
                      >
                        {make}
                      </button>
                    ))}
                    {availableMakes.length > 20 && (
                      <span className="text-gray-500 text-xs self-center">+{availableMakes.length - 20} more in main filters</span>
                    )}
                  </div>
                </div>

                {/* Sort preference */}
                <div className="surface-inset rounded-xl p-3">
                  <p className="text-white text-sm font-medium mb-2">📊 Default Sort</p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { field: "msrp" as SortField, label: "Price ↑", dir: "asc" as const },
                      { field: "msrp" as SortField, label: "Price ↓", dir: "desc" as const },
                      { field: "safetyRating" as SortField, label: "Safety", dir: "desc" as const },
                      { field: "mpgCombined" as SortField, label: "MPG", dir: "desc" as const },
                      { field: "electricRangeMiles" as SortField, label: "Range", dir: "desc" as const },
                      { field: "year" as SortField, label: "Newest", dir: "desc" as const },
                    ]).map(({ field, label, dir }) => (
                      <button
                        key={`${field}-${dir}`}
                        onClick={() => setSortConfig(prev =>
                          prev?.field === field && prev?.direction === dir
                            ? undefined
                            : { field, direction: dir }
                        )}
                        className={`px-3 py-1.5 rounded text-sm ${
                          sortConfig?.field === field && sortConfig?.direction === dir
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-gray-800/50 text-gray-400 border border-gray-700/30 hover:text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Preview of matched cars */}
            <div className="mb-6 surface-inset rounded-xl p-3">
              <p className="text-gray-400 text-sm">
                <span className="text-white font-medium">{preferencesFilteredCars.length}</span> cars match your filters
                {combinedColumns.length > 0 && (
                  <span className="text-gray-500"> • {combinedColumns.length} columns</span>
                )}
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep("baseline")}
                className="px-6 py-2 text-gray-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep("complete")}
                className="px-8 py-3 btn-accent rounded-xl font-medium"
              >
                Review & Share
              </button>
            </div>
          </div>
        )}

        {/* Complete Step with Share URL */}
        {step === "complete" && (
          <div className="animate-fadeIn">
            <h2 id="wizard-title" className="text-2xl font-bold text-white mb-2 text-center">
              Ready to Compare!
            </h2>
            <p className="text-gray-400 mb-6 text-center">
              Your settings are ready. Share this link to save or send your configuration.
            </p>

            {/* Summary */}
            <div className="surface-inset rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Matching cars:</span>
                <span className="text-white font-medium">{preferencesFilteredCars.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Columns shown:</span>
                <span className="text-white font-medium">{combinedColumns.length}</span>
              </div>
              {selectedBaseline && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Baseline:</span>
                  <span className="text-white font-medium">
                    {selectedBaseline.year} {selectedBaseline.make} {selectedBaseline.model}
                  </span>
                </div>
              )}
              {preferences.bodyTypes.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Body types:</span>
                  <span className="text-white font-medium capitalize">
                    {preferences.bodyTypes.join(", ")}
                  </span>
                </div>
              )}
              {preferences.fuelTypes.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fuel types:</span>
                  <span className="text-white font-medium capitalize">
                    {preferences.fuelTypes.map(t => t.replace("-", " ")).join(", ")}
                  </span>
                </div>
              )}
              {preferences.safetyRatings.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Safety:</span>
                  <span className="text-white font-medium">
                    {preferences.safetyRatings.join(", ")}
                  </span>
                </div>
              )}
              {preferences.autonomousLevels.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">ADAS level:</span>
                  <span className="text-white font-medium">
                    {preferences.autonomousLevels.map(l => l.replace("-", " ")).join(", ")}
                  </span>
                </div>
              )}
              {preferences.makes.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Brands:</span>
                  <span className="text-white font-medium">
                    {preferences.makes.slice(0, 3).join(", ")}{preferences.makes.length > 3 ? ` +${preferences.makes.length - 3}` : ""}
                  </span>
                </div>
              )}
              {sortConfig && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sort by:</span>
                  <span className="text-white font-medium">
                    {sortConfig.field} ({sortConfig.direction === "asc" ? "low to high" : "high to low"})
                  </span>
                </div>
              )}
            </div>

            {/* Share URL */}
            <div className="mb-6">
              <p className="text-white font-medium mb-2" id="wizard-share-label">Share Link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generateShareUrl()}
                  aria-labelledby="wizard-share-label"
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-gray-300 text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateShareUrl());
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Anyone with this link will see your column and filter settings
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep("preferences")}
                className="px-6 py-2 text-gray-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-8 py-3 btn-accent rounded-xl font-medium"
              >
                Start Comparing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
