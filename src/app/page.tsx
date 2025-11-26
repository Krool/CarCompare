"use client";

import { useState, useMemo } from "react";
import { Car, CarFilters, SortConfig, SortField } from "@/types/car";
import carData from "@/data/cars.json";
import FilterControls from "@/components/FilterControls";
import CarTable from "@/components/CarTable";
import BaselineSelector from "@/components/BaselineSelector";
import { filterCars, sortCars, getUniqueMakes } from "@/lib/carUtils";

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

  const availableMakes = useMemo(() => getUniqueMakes(allCars), [allCars]);

  const filteredCars = useMemo(() => {
    return filterCars(allCars, filters, mirrorBuffer);
  }, [allCars, filters, mirrorBuffer]);

  const sortedCars = useMemo(() => {
    return sortCars(filteredCars, sortConfig);
  }, [filteredCars, sortConfig]);

  const handleSortChange = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Car Compare</h1>
        <p className="text-gray-400 text-sm">
          Find the perfect car for your garage and family
        </p>
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
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-400">
                Showing {sortedCars.length} of {allCars.length} vehicles
              </p>
              <p className="text-gray-500 text-sm">
                Last updated: {carData.lastSyncDate}
              </p>
            </div>

            <CarTable
              cars={sortedCars}
              sortConfig={sortConfig}
              onSortChange={handleSortChange}
              baselineCar={baselineCar}
              mirrorBuffer={mirrorBuffer}
              onSelectBaseline={setBaselineCar}
            />
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 mt-8">
        <p className="text-gray-500 text-sm text-center">
          Data sourced from manufacturer specifications. Prices and availability may vary.
          Width marked with * uses body width + {mirrorBuffer}" mirror buffer estimate.
        </p>
      </footer>
    </div>
  );
}
