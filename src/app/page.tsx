"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Car, CarFilters, SortConfig, SortField, ColumnId, BodyType, FuelType, SafetyRating, AutonomousLevel, PlugType } from "@/types/car";
import carData from "@/data/cars.json";
import FilterControls from "@/components/FilterControls";
import CarTable from "@/components/CarTable";
import BaselineSelector from "@/components/BaselineSelector";
import CompareModal from "@/components/CompareModal";
import ColumnSettings, { DEFAULT_VISIBLE_COLUMNS } from "@/components/ColumnSettings";
import SetupWizard from "@/components/SetupWizard";
import { filterCars, sortCars, getUniqueMakes, exportToCsv, downloadCsv } from "@/lib/carUtils";

// LocalStorage keys
const STORAGE_KEYS = {
  favorites: "carcompare_favorites",
  filters: "carcompare_filters",
  mirrorBuffer: "carcompare_mirrorBuffer",
  baseline: "carcompare_baseline",
  columns: "carcompare_columns",
  hasSeenWizard: "carcompare_hasSeenWizard",
};

export default function Home() {
  const allCars = carData.cars as Car[];
  const defaultMirrorBuffer = carData.mirrorBuffer;

  // Find default baseline (Toyota RAV4 2011)
  const defaultBaseline = allCars.find((c) => c.id === "toyota-rav4-2011") ?? null;

  const [filters, setFilters] = useState<CarFilters>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "msrp",
    direction: "asc",
  });
  const [baselineCar, setBaselineCar] = useState<Car | null>(defaultBaseline);
  const [mirrorBuffer, setMirrorBuffer] = useState(defaultMirrorBuffer);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(DEFAULT_VISIBLE_COLUMNS);
  const [showWizard, setShowWizard] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show toast notification
  const showToast = useCallback((message: string, type: "success" | "info" = "info") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check URL for shared state first
    const urlParams = new URLSearchParams(window.location.search);
    const sharedState = urlParams.get("state");

    // Check for new wizard-style URL params (simpler format)
    const urlColumns = urlParams.get("c");
    const urlBodyTypes = urlParams.get("bt");
    const urlFuelTypes = urlParams.get("ft");
    const urlYear = urlParams.get("y");
    const urlSeats = urlParams.get("s");
    const urlPrice = urlParams.get("p");
    const urlSafetyRating = urlParams.get("sr");
    const urlSortField = urlParams.get("sf");
    const urlSortDir = urlParams.get("sd");
    const urlBaseline = urlParams.get("b");

    const hasNewFormatParams = urlColumns || urlBodyTypes || urlFuelTypes || urlYear || urlSeats || urlPrice || urlSafetyRating || urlSortField || urlBaseline;

    if (hasNewFormatParams) {
      // Parse new wizard-style URL format
      if (urlColumns) {
        setVisibleColumns(urlColumns.split(",") as ColumnId[]);
      }

      const newFilters: CarFilters = {};
      if (urlBodyTypes) {
        newFilters.bodyTypes = urlBodyTypes.split(",") as BodyType[];
      }
      if (urlFuelTypes) {
        newFilters.fuelTypes = urlFuelTypes.split(",") as FuelType[];
      }
      if (urlYear) {
        newFilters.minYear = parseInt(urlYear);
      }
      if (urlSeats) {
        newFilters.minSeats = parseInt(urlSeats);
      }
      if (urlPrice) {
        newFilters.maxPrice = parseInt(urlPrice);
      }
      if (urlSafetyRating) {
        newFilters.safetyRatings = urlSafetyRating.split(",") as SafetyRating[];
      }
      if (Object.keys(newFilters).length > 0) {
        setFilters(newFilters);
      }

      if (urlSortField && urlSortDir) {
        setSortConfig({
          field: urlSortField as SortField,
          direction: urlSortDir as "asc" | "desc",
        });
      }

      if (urlBaseline) {
        const car = allCars.find(c => c.id === urlBaseline);
        if (car) setBaselineCar(car);
      }

      // Mark wizard as seen and don't show it
      localStorage.setItem(STORAGE_KEYS.hasSeenWizard, "true");

      // Clear the URL params after loading shared state
      window.history.replaceState({}, "", window.location.pathname);
      setIsInitialized(true);
      return;
    } else if (sharedState) {
      try {
        const decoded = JSON.parse(atob(sharedState));
        // Support both old format (filters, sort, baseline, compare, columns) and new short format (f, s, b, c, v)
        const filters = decoded.f || decoded.filters;
        const sort = decoded.s || decoded.sort;
        const baseline = decoded.b || decoded.baseline;
        const compare = decoded.c || decoded.compare;
        const columns = decoded.v || decoded.columns;

        if (filters) setFilters(filters);
        if (sort) {
          // Handle new format [field, isDesc] or old format {field, direction}
          if (Array.isArray(sort)) {
            setSortConfig({ field: sort[0], direction: sort[1] ? "desc" : "asc" });
          } else {
            setSortConfig(sort);
          }
        }
        if (baseline) {
          const car = allCars.find(c => c.id === baseline);
          if (car) setBaselineCar(car);
        }
        if (compare) setCompareList(compare);
        if (columns) setVisibleColumns(columns);

        // Clear the URL params after loading shared state
        window.history.replaceState({}, "", window.location.pathname);
      } catch (e) {
        console.error("Failed to parse shared state:", e);
      }
      // Don't load localStorage when we have shared state
      setIsInitialized(true);
      return;
    } else {
      // Load from localStorage
      const savedFavorites = localStorage.getItem(STORAGE_KEYS.favorites);
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));

      const savedFilters = localStorage.getItem(STORAGE_KEYS.filters);
      if (savedFilters) setFilters(JSON.parse(savedFilters));

      const savedBuffer = localStorage.getItem(STORAGE_KEYS.mirrorBuffer);
      if (savedBuffer) setMirrorBuffer(parseInt(savedBuffer));

      const savedBaseline = localStorage.getItem(STORAGE_KEYS.baseline);
      if (savedBaseline) {
        const car = allCars.find(c => c.id === savedBaseline);
        if (car) setBaselineCar(car);
      }

      const savedColumns = localStorage.getItem(STORAGE_KEYS.columns);
      if (savedColumns) setVisibleColumns(JSON.parse(savedColumns));

      // Check if first-time user (no wizard seen)
      const hasSeenWizard = localStorage.getItem(STORAGE_KEYS.hasSeenWizard);
      if (!hasSeenWizard) {
        setShowWizard(true);
      }
    }

    setIsInitialized(true);
  }, [allCars]);

  // Save favorites to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites, isInitialized]);

  // Save filters to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEYS.filters, JSON.stringify(filters));
  }, [filters, isInitialized]);

  // Save mirror buffer to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEYS.mirrorBuffer, mirrorBuffer.toString());
  }, [mirrorBuffer, isInitialized]);

  // Save baseline to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    if (baselineCar) {
      localStorage.setItem(STORAGE_KEYS.baseline, baselineCar.id);
    }
  }, [baselineCar, isInitialized]);

  // Save columns to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEYS.columns, JSON.stringify(visibleColumns));
  }, [visibleColumns, isInitialized]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const availableMakes = useMemo(() => getUniqueMakes(allCars), [allCars]);

  const filteredCars = useMemo(() => {
    let cars = filterCars(allCars, filters, mirrorBuffer);

    // Apply favorites filter
    if (filters.showFavoritesOnly) {
      cars = cars.filter(car => favorites.includes(car.id));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      cars = cars.filter(car => {
        const searchString = `${car.year} ${car.make} ${car.model} ${car.trim ?? ""} ${car.bodyType} ${car.fuelType}`.toLowerCase();
        return searchString.includes(query);
      });
    }

    return cars;
  }, [allCars, filters, mirrorBuffer, favorites, searchQuery]);

  const sortedCars = useMemo(() => {
    return sortCars(filteredCars, sortConfig);
  }, [filteredCars, sortConfig]);

  const carsToCompare = useMemo(() => {
    return allCars.filter(car => compareList.includes(car.id));
  }, [allCars, compareList]);

  const handleSortChange = useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const toggleFavorite = useCallback((carId: string) => {
    setFavorites(prev =>
      prev.includes(carId)
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  }, []);

  const toggleCompare = useCallback((carId: string) => {
    setCompareList(prev => {
      if (prev.includes(carId)) {
        return prev.filter(id => id !== carId);
      }
      // Limit to 4 cars for comparison
      if (prev.length >= 4) {
        showToast("Maximum 4 cars for comparison", "info");
        return prev;
      }
      // Show helpful toast for first car
      if (prev.length === 0) {
        showToast("Car added to compare. Select more to compare side-by-side!", "success");
      } else if (prev.length === 1) {
        showToast("Click Compare button in header to view side-by-side", "info");
      }
      return [...prev, carId];
    });
  }, [showToast]);

  const removeFromCompare = useCallback((carId: string) => {
    setCompareList(prev => prev.filter(id => id !== carId));
  }, []);

  const handleExportCsv = useCallback(() => {
    const csv = exportToCsv(sortedCars, mirrorBuffer);
    downloadCsv(csv, `car-compare-${new Date().toISOString().split('T')[0]}.csv`);
  }, [sortedCars, mirrorBuffer]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShareUrl = useCallback(() => {
    // Only include non-default/non-empty values to keep URLs short
    const state: Record<string, unknown> = {};

    // Only add filters if there are any active
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true))
    );
    if (Object.keys(activeFilters).length > 0) state.f = activeFilters;

    // Only add sort if not default
    if (sortConfig.field !== "msrp" || sortConfig.direction !== "asc") {
      state.s = [sortConfig.field, sortConfig.direction === "desc" ? 1 : 0];
    }

    // Only add baseline if set and not default
    if (baselineCar && baselineCar.id !== "toyota-rav4-2011") state.b = baselineCar.id;

    // Only add compare list if not empty
    if (compareList.length > 0) state.c = compareList;

    // Only add columns if different from default (compare sorted arrays)
    const defaultCols = [...DEFAULT_VISIBLE_COLUMNS].sort();
    const currentCols = [...visibleColumns].sort();
    if (JSON.stringify(defaultCols) !== JSON.stringify(currentCols)) {
      state.v = visibleColumns;
    }

    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`;

    navigator.clipboard.writeText(url).then(() => {
      showToast("Share link copied to clipboard!", "success");
    }).catch(() => {
      // Fallback for older browsers
      prompt("Copy this link to share:", url);
    });
  }, [filters, sortConfig, baselineCar, compareList, visibleColumns, showToast]);

  const handleWizardComplete = useCallback((settings: {
    columns: ColumnId[];
    baseline: Car | null;
    filters: {
      bodyTypes?: BodyType[];
      fuelTypes?: FuelType[];
      minYear?: number;
      maxYear?: number;
      minSeats?: number;
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
  }) => {
    setVisibleColumns(settings.columns);
    if (settings.baseline) {
      setBaselineCar(settings.baseline);
    }
    // Apply ALL filters from wizard, replacing any existing filters
    setFilters({
      bodyTypes: settings.filters.bodyTypes,
      fuelTypes: settings.filters.fuelTypes,
      minYear: settings.filters.minYear,
      maxYear: settings.filters.maxYear,
      minSeats: settings.filters.minSeats,
      seats: settings.filters.seats,
      minPrice: settings.filters.minPrice,
      maxPrice: settings.filters.maxPrice,
      safetyRatings: settings.filters.safetyRatings,
      autonomousLevels: settings.filters.autonomousLevels,
      hasHandsFree: settings.filters.hasHandsFree,
      minMpg: settings.filters.minMpg,
      minEvRange: settings.filters.minEvRange,
      plugTypes: settings.filters.plugTypes,
      makes: settings.filters.makes,
    });
    if (settings.sortConfig) {
      setSortConfig(settings.sortConfig);
    }
    localStorage.setItem(STORAGE_KEYS.hasSeenWizard, "true");
    setShowWizard(false);
  }, []);

  const handleWizardSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.hasSeenWizard, "true");
    setShowWizard(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-blue-400">Car</span>
              <span className="text-white">Compare</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Find the perfect car for your garage and family
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {compareList.length > 0 && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium flex items-center gap-2 animate-bounce-once"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare ({compareList.length})
              </button>
            )}
            <ColumnSettings
              visibleColumns={visibleColumns}
              onColumnsChange={setVisibleColumns}
            />
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-sm font-medium btn-hover no-print"
              title="Export filtered results to CSV"
            >
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm font-medium btn-hover no-print"
              title="Print current view"
            >
              Print
            </button>
            <button
              onClick={handleShareUrl}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded text-sm font-medium btn-hover no-print"
              title="Copy shareable link with current filters"
            >
              Share
            </button>
            <button
              onClick={() => setShowWizard(true)}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-sm font-medium btn-hover no-print"
              title="Run the quick setup wizard"
            >
              Setup
            </button>
          </div>
        </div>
      </header>

      {/* Print-only header - hidden on screen */}
      <div className="hidden print:block print-header">
        <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-4">
          <div>
            <h1 className="text-2xl font-bold">CarCompare Vehicle List</h1>
            <p className="text-sm text-gray-600">
              Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{sortedCars.length} vehicles</p>
            {baselineCar && (
              <p className="text-sm">Baseline: {baselineCar.year} {baselineCar.make} {baselineCar.model}</p>
            )}
          </div>
        </div>
        {/* Active filters summary */}
        <div className="text-xs mb-4 print-filters">
          <span className="font-semibold">Filters: </span>
          {(() => {
            const activeFilters: string[] = [];
            if (filters.minYear || filters.maxYear) activeFilters.push(`Year: ${filters.minYear || "any"}-${filters.maxYear || "any"}`);
            if (filters.minPrice || filters.maxPrice) activeFilters.push(`Price: $${filters.minPrice?.toLocaleString() || "0"}-$${filters.maxPrice?.toLocaleString() || "any"}`);
            if (filters.bodyTypes?.length) activeFilters.push(`Type: ${filters.bodyTypes.join(", ")}`);
            if (filters.fuelTypes?.length) activeFilters.push(`Fuel: ${filters.fuelTypes.join(", ")}`);
            if (filters.safetyRatings?.length) activeFilters.push(`Safety: ${filters.safetyRatings.join(", ")}`);
            if (filters.minSeats) activeFilters.push(`${filters.minSeats}+ seats`);
            if (filters.maxWidthInches) activeFilters.push(`Max width: ${filters.maxWidthInches}"`);
            if (filters.maxLengthInches) activeFilters.push(`Max length: ${filters.maxLengthInches}"`);
            if (filters.minEvRange) activeFilters.push(`EV range: ${filters.minEvRange}+ mi`);
            if (searchQuery) activeFilters.push(`Search: "${searchQuery}"`);
            return activeFilters.length > 0 ? activeFilters.join(" | ") : "None";
          })()}
        </div>
      </div>

      <main className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0 space-y-4 no-print">
            <BaselineSelector
              cars={allCars}
              baselineCar={baselineCar}
              onBaselineChange={setBaselineCar}
              mirrorBuffer={mirrorBuffer}
            />
            <FilterControls
              filters={filters}
              onFiltersChange={setFilters}
              availableMakes={availableMakes}
              hasFavorites={favorites.length > 0}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 space-y-3">
              {/* Search box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search cars (e.g., Toyota, SUV, 2025, hybrid...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <p className="text-gray-400">
                    Showing {sortedCars.length} of {allCars.length} vehicles
                  </p>
                  {favorites.length > 0 && (
                    <span className="text-yellow-400 text-sm">
                      ★ {favorites.length} favorited
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  Last updated: {carData.lastSyncDate}
                </p>
              </div>
            </div>

            {/* Mobile: Card view */}
            <div className="block lg:hidden">
              <MobileCardView
                cars={sortedCars}
                baselineCar={baselineCar}
                mirrorBuffer={mirrorBuffer}
                favorites={favorites}
                compareList={compareList}
                onToggleFavorite={toggleFavorite}
                onToggleCompare={toggleCompare}
                onSelectBaseline={setBaselineCar}
                sortField={sortConfig?.field}
                sortDirection={sortConfig?.direction}
                onSortChange={handleSortChange}
              />
            </div>

            {/* Desktop: Table view */}
            <div className="hidden lg:block">
              <CarTable
                cars={sortedCars}
                sortConfig={sortConfig}
                onSortChange={handleSortChange}
                baselineCar={baselineCar}
                mirrorBuffer={mirrorBuffer}
                onSelectBaseline={setBaselineCar}
                compareList={compareList}
                onToggleCompare={toggleCompare}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                visibleColumns={visibleColumns}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Print-only footer */}
      <div className="hidden print:block print-footer">
        <p>CarCompare - krool.github.io/CarCompare</p>
      </div>

      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 mt-8">
        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-500 text-sm text-center">
            Data sourced from manufacturer specifications. Prices and availability may vary.
          </p>
          <p className="text-gray-500 text-sm">
            Part of{' '}
            <a
              href="https://krool.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
            >
              Krool World
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </p>
        </div>
      </footer>

      {/* Compare Modal */}
      {showCompareModal && carsToCompare.length > 0 && (
        <CompareModal
          cars={carsToCompare}
          onClose={() => setShowCompareModal(false)}
          onRemoveCar={removeFromCompare}
          mirrorBuffer={mirrorBuffer}
        />
      )}

      {/* Setup Wizard for first-time users */}
      {showWizard && (
        <SetupWizard
          cars={allCars}
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-green-800 text-green-100 border border-green-600"
              : "bg-blue-800 text-blue-100 border border-blue-600"
          }`}>
            {toast.type === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile Card View Component
function MobileCardView({
  cars,
  baselineCar,
  mirrorBuffer,
  favorites,
  compareList,
  onToggleFavorite,
  onToggleCompare,
  onSelectBaseline,
  sortField,
  sortDirection,
  onSortChange,
}: {
  cars: Car[];
  baselineCar: Car | null;
  mirrorBuffer: number;
  favorites: string[];
  compareList: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onSelectBaseline: (car: Car) => void;
  sortField?: SortField;
  sortDirection?: "asc" | "desc";
  onSortChange?: (field: SortField) => void;
}) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpanded = (carId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(carId)) {
        next.delete(carId);
      } else {
        next.add(carId);
      }
      return next;
    });
  };

  const getCarImageUrl = (car: Car, size: number = 400): string => {
    const modelFamily = car.model
      .split(" ")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const make = car.make.toLowerCase();
    return `https://cdn.imagin.studio/getImage?customer=img&make=${make}&modelFamily=${modelFamily}&paintId=pspc0001&angle=01&width=${size}`;
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const sortOptions: { field: SortField; label: string }[] = [
    { field: "msrp", label: "Price" },
    { field: "year", label: "Year" },
    { field: "safetyRating", label: "Safety" },
    { field: "mpgCombined", label: "MPG" },
  ];

  if (cars.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-300 mb-2">No cars match your filters</p>
          <p className="text-sm">Try expanding your search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Sort Controls */}
      {onSortChange && (
        <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2 flex-wrap">
          <span className="text-gray-400 text-sm">Sort:</span>
          {sortOptions.map(opt => (
            <button
              key={opt.field}
              onClick={() => onSortChange(opt.field)}
              className={`px-3 py-1 rounded text-xs flex items-center gap-1 ${
                sortField === opt.field
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {opt.label}
              {sortField === opt.field && (
                <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {cars.map((car) => {
        const isBaseline = baselineCar?.id === car.id;
        const isFavorite = favorites.includes(car.id);
        const isInCompare = compareList.includes(car.id);
        const effectiveWidth = car.mirrorWidthInches ?? car.bodyWidthInches + mirrorBuffer;
        const isExpanded = expandedCards.has(car.id);

        return (
          <div
            key={car.id}
            className={`bg-gray-800 rounded-lg p-4 ${
              isBaseline ? "ring-2 ring-blue-500" : isFavorite ? "ring-2 ring-yellow-500/50" : ""
            }`}
          >
            <div className="flex gap-4">
              <img
                src={getCarImageUrl(car, 200)}
                alt={`${car.year} ${car.make} ${car.model}`}
                className="w-32 h-20 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-semibold">
                      {car.year} {car.make} {car.model}
                    </h3>
                    {car.trim && <p className="text-gray-400 text-sm">{car.trim}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggleFavorite(car.id)}
                      className={`text-xl ${isFavorite ? "text-yellow-400" : "text-gray-600"}`}
                    >
                      ★
                    </button>
                    <input
                      type="checkbox"
                      checked={isInCompare}
                      onChange={() => onToggleCompare(car.id)}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-gray-700 rounded">{car.bodyType}</span>
                  <span className="px-2 py-0.5 bg-gray-700 rounded">{car.seats} seats</span>
                  {car.safetyRating && car.safetyRating !== "Not Rated" && (
                    <span className="px-2 py-0.5 bg-green-800 text-green-200 rounded">
                      {car.safetyRating}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">MSRP:</span>
                <span className="text-white ml-2">{formatCurrency(car.msrp)}</span>
              </div>
              <div>
                <span className="text-gray-400">Width:</span>
                <span className="text-white ml-2">{effectiveWidth.toFixed(1)}"</span>
              </div>
              <div>
                <span className="text-gray-400">Legroom:</span>
                <span className="text-white ml-2">{car.driverLegroomInches ? `${car.driverLegroomInches}"` : "-"}</span>
              </div>
              <div>
                <span className="text-gray-400">MPG:</span>
                <span className="text-white ml-2">
                  {car.mpgCombined ?? car.mpge ?? "-"}{car.mpge ? " MPGe" : ""}
                </span>
              </div>
            </div>

            {/* Expanded specs section */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-2 text-sm animate-fadeIn">
                <div>
                  <span className="text-gray-400">Length:</span>
                  <span className="text-white ml-2">{car.lengthInches ? `${car.lengthInches}"` : "-"}</span>
                </div>
                <div>
                  <span className="text-gray-400">Height:</span>
                  <span className="text-white ml-2">{car.heightInches ? `${car.heightInches}"` : "-"}</span>
                </div>
                <div>
                  <span className="text-gray-400">Clearance:</span>
                  <span className="text-white ml-2">{car.groundClearanceInches ? `${car.groundClearanceInches}"` : "-"}</span>
                </div>
                <div>
                  <span className="text-gray-400">Cargo:</span>
                  <span className="text-white ml-2">{car.cargoVolumesCuFt ? `${car.cargoVolumesCuFt} cu ft` : "-"}</span>
                </div>
                <div>
                  <span className="text-gray-400">Fuel:</span>
                  <span className="text-white ml-2 capitalize">{car.fuelType.replace("-", " ")}</span>
                </div>
                <div>
                  <span className="text-gray-400">EV Range:</span>
                  <span className="text-white ml-2">{car.electricRangeMiles ? `${car.electricRangeMiles} mi` : "-"}</span>
                </div>
                {car.adasFeatures?.autoFoldingMirrors && (
                  <div className="col-span-2">
                    <span className="text-green-400 text-xs">✓ Auto-Folding Mirrors</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => toggleExpanded(car.id)}
                className="px-3 py-2 rounded text-sm bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                {isExpanded ? "Show Less" : "Show More"}
              </button>
              <button
                onClick={() => onSelectBaseline(car)}
                className={`flex-1 px-3 py-2 rounded text-sm ${
                  isBaseline
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {isBaseline ? "✓ Baseline" : "Set as Baseline"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
