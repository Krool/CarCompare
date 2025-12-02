"use client";

import { useState, useMemo } from "react";
import { Car, ColumnId, BodyType, FuelType } from "@/types/car";
import { ALL_COLUMNS } from "./ColumnSettings";

interface SetupWizardProps {
  cars: Car[];
  onComplete: (settings: {
    columns: ColumnId[];
    baseline: Car | null;
    filters: {
      bodyTypes?: BodyType[];
      fuelTypes?: FuelType[];
      minYear?: number;
    };
  }) => void;
  onSkip: () => void;
}

type WizardStep = "welcome" | "use-case" | "baseline" | "preferences" | "complete";

// Preset configurations based on use case - can select multiple
const USE_CASE_PRESETS = {
  "garage-fit": {
    label: "Garage Fit",
    description: "Dimensions for parking spaces",
    columns: ["mirrorsFoldedWidthInches", "oneMirrorWidthInches", "bodyWidthInches", "heightInches", "groundClearanceInches"] as ColumnId[],
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
  const [step, setStep] = useState<WizardStep>("welcome");
  const [selectedUseCases, setSelectedUseCases] = useState<UseCaseKey[]>([]);
  const [selectedBaseline, setSelectedBaseline] = useState<Car | null>(null);
  const [baselineSearch, setBaselineSearch] = useState("");
  const [preferences, setPreferences] = useState({
    bodyTypes: [] as BodyType[],
    fuelTypes: [] as FuelType[],
    newOnly: false,
  });

  // Combine columns from all selected use cases
  const combinedColumns = useMemo(() => {
    if (selectedUseCases.length === 0) {
      // Default: show all columns
      return ALL_COLUMNS.filter(c => c.category !== "action" && c.defaultVisible).map(c => c.id);
    }

    const columnsSet = new Set<ColumnId>(BASE_COLUMNS);
    selectedUseCases.forEach(key => {
      USE_CASE_PRESETS[key].columns.forEach(col => columnsSet.add(col));
    });

    // Return in a logical order based on ALL_COLUMNS order
    return ALL_COLUMNS
      .filter(c => c.category !== "action" && columnsSet.has(c.id))
      .map(c => c.id);
  }, [selectedUseCases]);

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

  const handleComplete = () => {
    onComplete({
      columns: combinedColumns,
      baseline: selectedBaseline,
      filters: {
        bodyTypes: preferences.bodyTypes.length > 0 ? preferences.bodyTypes : undefined,
        fuelTypes: preferences.fuelTypes.length > 0 ? preferences.fuelTypes : undefined,
        minYear: preferences.newOnly ? 2024 : undefined,
      },
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

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-8 modal-content max-h-[90vh] overflow-y-auto">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {["welcome", "use-case", "baseline", "preferences"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    step === s ? "bg-blue-500" :
                    ["welcome", "use-case", "baseline", "preferences"].indexOf(step) > i
                      ? "bg-green-500"
                      : "bg-gray-600"
                  }`}
                />
                {i < 3 && <div className="w-8 h-0.5 bg-gray-600" />}
              </div>
            ))}
          </div>
        </div>

        {/* Welcome Step */}
        {step === "welcome" && (
          <div className="text-center animate-fadeIn">
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to <span className="text-blue-400">Car</span>Compare
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Let&apos;s set up your experience in a few quick steps.
              <br />
              <span className="text-gray-400 text-sm">This will only take 30 seconds.</span>
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep("use-case")}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-lg font-medium btn-hover"
              >
                Get Started
              </button>
              <button
                onClick={onSkip}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-lg btn-hover"
              >
                Skip Setup
              </button>
            </div>
          </div>
        )}

        {/* Use Case Step */}
        {step === "use-case" && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
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
                    className={`p-3 rounded-lg text-left transition-all ${
                      isSelected
                        ? "bg-blue-600 border-2 border-blue-400"
                        : "bg-gray-700 border-2 border-transparent hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{preset.icon}</span>
                      {isSelected && <span className="text-green-400 text-sm">✓</span>}
                    </div>
                    <span className="text-white font-medium text-sm block">{preset.label}</span>
                    <span className="text-gray-400 text-xs">{preset.description}</span>
                  </button>
                );
              })}
            </div>

            {/* Preview of selected columns */}
            {selectedUseCases.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-3 mb-6">
                <p className="text-gray-400 text-xs mb-2">
                  Columns: <span className="text-white">{combinedColumns.length}</span> selected
                </p>
                <div className="flex flex-wrap gap-1">
                  {combinedColumns.slice(0, 12).map(col => {
                    const colConfig = ALL_COLUMNS.find(c => c.id === col);
                    return (
                      <span key={col} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
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
                className="px-8 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white btn-hover"
              >
                {selectedUseCases.length === 0 ? "Show All Columns" : "Next"}
              </button>
            </div>
          </div>
        )}

        {/* Baseline Step */}
        {step === "baseline" && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Do you have a reference car?
            </h2>
            <p className="text-gray-400 mb-6 text-center">
              Compare all cars against a baseline (your current car or a known size).
              <br />
              <span className="text-sm">You can change this anytime.</span>
            </p>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search for a car (e.g., 2024 Toyota RAV4)"
                value={baselineSearch}
                onChange={(e) => setBaselineSearch(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
              {filteredCars.length > 0 && (
                <div className="mt-2 bg-gray-900 rounded-lg border border-gray-700 max-h-48 overflow-y-auto">
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
              <div className="mb-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">
                    {selectedBaseline.year} {selectedBaseline.make} {selectedBaseline.model}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">selected as baseline</span>
                </div>
                <button
                  onClick={() => setSelectedBaseline(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
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
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-full"
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
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium btn-hover"
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
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Any preferences?
            </h2>
            <p className="text-gray-400 mb-6 text-center">
              Optionally filter to specific types. You can always change these later.
            </p>

            {/* Body types */}
            <div className="mb-6">
              <p className="text-white font-medium mb-2">Body Types (optional)</p>
              <div className="flex flex-wrap gap-2">
                {(["sedan", "crossover", "suv", "truck", "minivan", "hatchback", "wagon", "coupe"] as BodyType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => toggleBodyType(type)}
                    className={`px-4 py-2 rounded-lg capitalize ${
                      preferences.bodyTypes.includes(type)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Fuel types */}
            <div className="mb-6">
              <p className="text-white font-medium mb-2">Fuel Types (optional)</p>
              <div className="flex flex-wrap gap-2">
                {(["gasoline", "hybrid", "plug-in-hybrid", "electric", "diesel"] as FuelType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => toggleFuelType(type)}
                    className={`px-4 py-2 rounded-lg capitalize ${
                      preferences.fuelTypes.includes(type)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {type.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* New cars only toggle */}
            <div className="mb-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.newOnly}
                  onChange={(e) => setPreferences(prev => ({ ...prev, newOnly: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600"
                />
                <span className="text-white">Only show new cars (2024+)</span>
              </label>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep("baseline")}
                className="px-6 py-2 text-gray-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium btn-hover"
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
