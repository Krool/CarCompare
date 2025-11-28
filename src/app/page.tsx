"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Car, CarFilters, SortConfig, SortField } from "@/types/car";
import carData from "@/data/cars.json";
import FilterControls from "@/components/FilterControls";
import CarTable from "@/components/CarTable";
import BaselineSelector from "@/components/BaselineSelector";
import CompareModal from "@/components/CompareModal";
import { filterCars, sortCars, getUniqueMakes, exportToCsv, downloadCsv } from "@/lib/carUtils";

// LocalStorage keys
const STORAGE_KEYS = {
  favorites: "carcompare_favorites",
  filters: "carcompare_filters",
  mirrorBuffer: "carcompare_mirrorBuffer",
  baseline: "carcompare_baseline",
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

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check URL for shared state first
    const urlParams = new URLSearchParams(window.location.search);
    const sharedState = urlParams.get("state");

    if (sharedState) {
      try {
        const decoded = JSON.parse(atob(sharedState));
        if (decoded.filters) setFilters(decoded.filters);
        if (decoded.sort) setSortConfig(decoded.sort);
        if (decoded.baseline) {
          const car = allCars.find(c => c.id === decoded.baseline);
          if (car) setBaselineCar(car);
        }
        if (decoded.compare) setCompareList(decoded.compare);
      } catch (e) {
        console.error("Failed to parse shared state:", e);
      }
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

  const availableMakes = useMemo(() => getUniqueMakes(allCars), [allCars]);

  const filteredCars = useMemo(() => {
    let cars = filterCars(allCars, filters, mirrorBuffer);

    // Apply favorites filter
    if (filters.showFavoritesOnly) {
      cars = cars.filter(car => favorites.includes(car.id));
    }

    return cars;
  }, [allCars, filters, mirrorBuffer, favorites]);

  const sortedCars = useMemo(() => {
    return sortCars(filteredCars, sortConfig);
  }, [filteredCars, sortConfig]);

  const carsToCompare = useMemo(() => {
    return allCars.filter(car => compareList.includes(car.id));
  }, [allCars, compareList]);

  const handleSortChange = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

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
        return prev;
      }
      return [...prev, carId];
    });
  }, []);

  const removeFromCompare = useCallback((carId: string) => {
    setCompareList(prev => prev.filter(id => id !== carId));
  }, []);

  const handleExportCsv = useCallback(() => {
    const csv = exportToCsv(sortedCars, mirrorBuffer);
    downloadCsv(csv, `car-compare-${new Date().toISOString().split('T')[0]}.csv`);
  }, [sortedCars, mirrorBuffer]);

  const handleShareUrl = useCallback(() => {
    const state = {
      filters,
      sort: sortConfig,
      baseline: baselineCar?.id,
      compare: compareList,
    };
    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`;

    navigator.clipboard.writeText(url).then(() => {
      alert("Share link copied to clipboard!");
    }).catch(() => {
      // Fallback for older browsers
      prompt("Copy this link to share:", url);
    });
  }, [filters, sortConfig, baselineCar, compareList]);

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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium"
              >
                Compare ({compareList.length})
              </button>
            )}
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-sm font-medium"
              title="Export filtered results to CSV"
            >
              Export CSV
            </button>
            <button
              onClick={handleShareUrl}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded text-sm font-medium"
              title="Copy shareable link with current filters"
            >
              Share
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0 space-y-4">
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
              mirrorBuffer={mirrorBuffer}
              onMirrorBufferChange={setMirrorBuffer}
              hasFavorites={favorites.length > 0}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 mt-8">
        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-500 text-sm text-center">
            Data sourced from manufacturer specifications. Prices and availability may vary.
            Width marked with * uses body width + {mirrorBuffer}" mirror buffer estimate.
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
}: {
  cars: Car[];
  baselineCar: Car | null;
  mirrorBuffer: number;
  favorites: string[];
  compareList: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onSelectBaseline: (car: Car) => void;
}) {
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
    if (value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (cars.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
        No cars match your filters. Try adjusting the filter criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cars.map((car) => {
        const isBaseline = baselineCar?.id === car.id;
        const isFavorite = favorites.includes(car.id);
        const isInCompare = compareList.includes(car.id);
        const effectiveWidth = car.mirrorWidthInches ?? car.bodyWidthInches + mirrorBuffer;

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

            <div className="mt-4 flex gap-2">
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
