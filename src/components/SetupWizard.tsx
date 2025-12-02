"use client";

import { useState } from "react";
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

// Preset configurations based on use case
const USE_CASE_PRESETS = {
  "garage-fit": {
    label: "Garage Fit",
    description: "Find cars that fit your garage or parking space",
    columns: ["year", "make", "model", "bodyType", "mirrorsFoldedWidthInches", "oneMirrorWidthInches", "bodyWidthInches", "heightInches", "groundClearanceInches", "msrp"] as ColumnId[],
    icon: "🏠",
  },
  "family": {
    label: "Family Car Shopping",
    description: "Find safe, reliable cars for your family",
    columns: ["year", "make", "model", "bodyType", "safetyRating", "seats", "reliabilityRating", "msrp"] as ColumnId[],
    icon: "👨‍👩‍👧‍👦",
  },
  "budget": {
    label: "Budget-Conscious",
    description: "Find the best value with low ownership costs",
    columns: ["year", "make", "model", "msrp", "mpgCombined", "reliabilityRating", "insuranceCostAnnual", "maintenanceCostAnnual"] as ColumnId[],
    icon: "💰",
  },
  "ev-shopping": {
    label: "EV Shopping",
    description: "Compare electric vehicles",
    columns: ["year", "make", "model", "electricRangeMiles", "mpgCombined", "plugType", "msrp", "depreciationCategory"] as ColumnId[],
    icon: "⚡",
  },
  "performance": {
    label: "Performance Enthusiast",
    description: "Find fast, powerful cars",
    columns: ["year", "make", "model", "zeroToSixtySeconds", "horsepower", "bodyType", "fuelType", "msrp"] as ColumnId[],
    icon: "🏎️",
  },
  "all-data": {
    label: "Show Me Everything",
    description: "See all available data columns",
    columns: ALL_COLUMNS.filter(c => c.category !== "action" && c.defaultVisible).map(c => c.id),
    icon: "📊",
  },
};

type UseCaseKey = keyof typeof USE_CASE_PRESETS;

export default function SetupWizard({ cars, onComplete, onSkip }: SetupWizardProps) {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [selectedUseCase, setSelectedUseCase] = useState<UseCaseKey | null>(null);
  const [selectedBaseline, setSelectedBaseline] = useState<Car | null>(null);
  const [baselineSearch, setBaselineSearch] = useState("");
  const [preferences, setPreferences] = useState({
    bodyTypes: [] as BodyType[],
    fuelTypes: [] as FuelType[],
    newOnly: false,
  });

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
    const useCase = selectedUseCase ? USE_CASE_PRESETS[selectedUseCase] : USE_CASE_PRESETS["all-data"];

    onComplete({
      columns: useCase.columns,
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
              This helps us show the most relevant columns for your needs.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {(Object.entries(USE_CASE_PRESETS) as [UseCaseKey, typeof USE_CASE_PRESETS[UseCaseKey]][]).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setSelectedUseCase(key)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedUseCase === key
                      ? "bg-blue-600 border-2 border-blue-400"
                      : "bg-gray-700 border-2 border-transparent hover:border-gray-500"
                  }`}
                >
                  <span className="text-2xl mb-2 block">{preset.icon}</span>
                  <span className="text-white font-medium block">{preset.label}</span>
                  <span className="text-gray-400 text-sm">{preset.description}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep("welcome")}
                className="px-6 py-2 text-gray-400 hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setStep("baseline")}
                disabled={!selectedUseCase}
                className={`px-8 py-3 rounded-lg font-medium ${
                  selectedUseCase
                    ? "bg-blue-600 hover:bg-blue-500 text-white btn-hover"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next
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
