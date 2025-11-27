"use client";

import { CarFilters, FuelType, PlugType, BodyType, SafetyRating } from "@/types/car";

interface FilterControlsProps {
  filters: CarFilters;
  onFiltersChange: (filters: CarFilters) => void;
  availableMakes: string[];
  mirrorBuffer: number;
  onMirrorBufferChange: (buffer: number) => void;
  hasFavorites: boolean;
}

const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: "gasoline", label: "Gas" },
  { value: "hybrid", label: "Hybrid" },
  { value: "plug-in-hybrid", label: "Plug-in Hybrid" },
  { value: "electric", label: "Electric" },
  { value: "diesel", label: "Diesel" },
];

const PLUG_TYPES: { value: PlugType; label: string }[] = [
  { value: "none", label: "None (Gas)" },
  { value: "J1772", label: "J1772" },
  { value: "CCS1", label: "CCS1" },
  { value: "CHAdeMO", label: "CHAdeMO" },
  { value: "NACS", label: "NACS/Tesla" },
];

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "sedan", label: "Sedan" },
  { value: "crossover", label: "Crossover" },
  { value: "suv", label: "SUV" },
  { value: "truck", label: "Truck" },
  { value: "minivan", label: "Minivan" },
  { value: "hatchback", label: "Hatchback" },
  { value: "wagon", label: "Wagon" },
  { value: "coupe", label: "Coupe" },
];

const DOOR_OPTIONS = [2, 4, 5];

const SAFETY_RATINGS: { value: SafetyRating; label: string }[] = [
  { value: "TSP+", label: "TSP+" },
  { value: "TSP", label: "TSP" },
  { value: "Good", label: "Good" },
  { value: "Acceptable", label: "Acceptable" },
  { value: "Not Rated", label: "Not Rated" },
];

// Quick preset filter definitions
const PRESETS = [
  { name: "EVs Under $50k", filters: { fuelTypes: ["electric" as FuelType], maxPrice: 50000 } },
  { name: "Family SUVs", filters: { bodyTypes: ["suv" as BodyType, "crossover" as BodyType], minSeats: 6 } },
  { name: "Top Safety", filters: { safetyRatings: ["TSP+" as SafetyRating] } },
  { name: "Fuel Efficient", filters: { minMpg: 35 } },
  { name: "Long Range EVs", filters: { fuelTypes: ["electric" as FuelType], minEvRange: 300 } },
  { name: "Compact", filters: { bodyTypes: ["crossover" as BodyType, "hatchback" as BodyType, "sedan" as BodyType], maxPrice: 40000 } },
];

export default function FilterControls({
  filters,
  onFiltersChange,
  availableMakes,
  mirrorBuffer,
  onMirrorBufferChange,
  hasFavorites,
}: FilterControlsProps) {
  const updateFilter = (key: keyof CarFilters, value: CarFilters[keyof CarFilters]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleDoorsFilter = (value: number) => {
    const arr = filters.doors ?? [];
    const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    updateFilter("doors", newArr.length > 0 ? newArr : undefined);
  };

  const toggleFuelTypeFilter = (value: FuelType) => {
    const arr = filters.fuelTypes ?? [];
    const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    updateFilter("fuelTypes", newArr.length > 0 ? newArr : undefined);
  };

  const togglePlugTypeFilter = (value: PlugType) => {
    const arr = filters.plugTypes ?? [];
    const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    updateFilter("plugTypes", newArr.length > 0 ? newArr : undefined);
  };

  const toggleMakeFilter = (value: string) => {
    const arr = filters.makes ?? [];
    const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    updateFilter("makes", newArr.length > 0 ? newArr : undefined);
  };

  const toggleBodyTypeFilter = (value: BodyType) => {
    const arr = filters.bodyTypes ?? [];
    const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    updateFilter("bodyTypes", newArr.length > 0 ? newArr : undefined);
  };

  const toggleSafetyFilter = (value: SafetyRating) => {
    const arr = filters.safetyRatings ?? [];
    const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    updateFilter("safetyRatings", newArr.length > 0 ? newArr : undefined);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">Filters</h2>

      {/* Quick Presets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Quick Presets</label>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onFiltersChange({ ...preset.filters })}
              className="px-3 py-1 rounded text-xs bg-purple-800 text-purple-200 hover:bg-purple-700"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Show Favorites Only */}
      {hasFavorites && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showFavoritesOnly ?? false}
              onChange={(e) => updateFilter("showFavoritesOnly", e.target.checked || undefined)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
            />
            <span className="text-sm font-medium text-yellow-400">★ Show Favorites Only</span>
          </label>
        </div>
      )}

      {/* Year Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Year</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={2010}
            max={2026}
            placeholder="Min"
            value={filters.minYear ?? ""}
            onChange={(e) => updateFilter("minYear", e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
          <span className="text-gray-400 self-center">to</span>
          <input
            type="number"
            min={2010}
            max={2026}
            placeholder="Max"
            value={filters.maxYear ?? ""}
            onChange={(e) => updateFilter("maxYear", e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
        </div>
      </div>

      {/* Seats */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Seats</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={12}
            placeholder="Min"
            value={filters.minSeats ?? ""}
            onChange={(e) => updateFilter("minSeats", e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
          <span className="text-gray-400 self-center">to</span>
          <input
            type="number"
            min={1}
            max={12}
            placeholder="Max"
            value={filters.maxSeats ?? ""}
            onChange={(e) => updateFilter("maxSeats", e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Price Range (MSRP)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="Min $"
            value={filters.minPrice ?? ""}
            onChange={(e) => updateFilter("minPrice", e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
          <span className="text-gray-400 self-center">to</span>
          <input
            type="number"
            min={0}
            step={1000}
            placeholder="Max $"
            value={filters.maxPrice ?? ""}
            onChange={(e) => updateFilter("maxPrice", e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
        </div>
      </div>

      {/* Garage Width */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Max Width for Garage (inches)
        </label>
        <input
          type="number"
          min={60}
          max={120}
          placeholder="e.g., 90"
          value={filters.maxWidthInches ?? ""}
          onChange={(e) => updateFilter("maxWidthInches", e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
        <p className="text-xs text-gray-500">Filters by width with mirrors</p>
      </div>

      {/* Mirror Buffer */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Mirror Buffer (inches)
        </label>
        <input
          type="number"
          min={0}
          max={20}
          value={mirrorBuffer}
          onChange={(e) => onMirrorBufferChange(parseInt(e.target.value) || 0)}
          className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
        <p className="text-xs text-gray-500">Added to body width when mirror width unknown</p>
      </div>

      {/* Minimum Legroom */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Min Driver Legroom (inches)
        </label>
        <input
          type="number"
          min={35}
          max={50}
          step={0.5}
          placeholder="e.g., 42"
          value={filters.minLegroom ?? ""}
          onChange={(e) => updateFilter("minLegroom", e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
        <p className="text-xs text-gray-500">Filter for taller drivers</p>
      </div>

      {/* Min Cargo Volume */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Min Cargo Volume (cu ft)
        </label>
        <input
          type="number"
          min={0}
          max={150}
          placeholder="e.g., 60"
          value={filters.minCargo ?? ""}
          onChange={(e) => updateFilter("minCargo", e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
      </div>

      {/* Min MPG/MPGe */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Min MPG/MPGe
        </label>
        <input
          type="number"
          min={0}
          max={200}
          placeholder="e.g., 30"
          value={filters.minMpg ?? ""}
          onChange={(e) => updateFilter("minMpg", e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
      </div>

      {/* Min EV Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Min EV Range (miles)
        </label>
        <input
          type="number"
          min={0}
          max={500}
          placeholder="e.g., 250"
          value={filters.minEvRange ?? ""}
          onChange={(e) => updateFilter("minEvRange", e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        />
        <p className="text-xs text-gray-500">Only shows EVs/PHEVs</p>
      </div>

      {/* Safety Rating */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">IIHS Safety Rating</label>
        <div className="flex gap-2 flex-wrap">
          {SAFETY_RATINGS.map((sr) => (
            <button
              key={sr.value}
              onClick={() => toggleSafetyFilter(sr.value)}
              className={`px-3 py-1 rounded text-sm ${
                filters.safetyRatings?.includes(sr.value)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {sr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Doors */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Doors</label>
        <div className="flex gap-2 flex-wrap">
          {DOOR_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => toggleDoorsFilter(d)}
              className={`px-3 py-1 rounded text-sm ${
                filters.doors?.includes(d)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Body Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Body Type</label>
        <div className="flex gap-2 flex-wrap">
          {BODY_TYPES.map((bt) => (
            <button
              key={bt.value}
              onClick={() => toggleBodyTypeFilter(bt.value)}
              className={`px-3 py-1 rounded text-sm ${
                filters.bodyTypes?.includes(bt.value)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {bt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Fuel Type</label>
        <div className="flex gap-2 flex-wrap">
          {FUEL_TYPES.map((ft) => (
            <button
              key={ft.value}
              onClick={() => toggleFuelTypeFilter(ft.value)}
              className={`px-3 py-1 rounded text-sm ${
                filters.fuelTypes?.includes(ft.value)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plug Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Plug Type</label>
        <div className="flex gap-2 flex-wrap">
          {PLUG_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => togglePlugTypeFilter(pt.value)}
              className={`px-3 py-1 rounded text-sm ${
                filters.plugTypes?.includes(pt.value)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Makes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Makes</label>
        <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
          {availableMakes.map((make) => (
            <button
              key={make}
              onClick={() => toggleMakeFilter(make)}
              className={`px-3 py-1 rounded text-sm ${
                filters.makes?.includes(make)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {make}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => onFiltersChange({})}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
      >
        Clear All Filters
      </button>
    </div>
  );
}
