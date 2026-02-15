"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Car } from "@/types/car";
import { getCarDisplayName, getEffectiveWidth, formatCurrency, formatMpg } from "@/lib/carUtils";

interface BaselineSelectorProps {
  cars: Car[];
  baselineCar: Car | null;
  onBaselineChange: (car: Car | null) => void;
  mirrorBuffer: number;
}

export default function BaselineSelector({
  cars,
  baselineCar,
  onBaselineChange,
  mirrorBuffer,
}: BaselineSelectorProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter and group cars by make
  const groupedResults = useMemo(() => {
    if (!searchQuery.trim()) return {};
    const query = searchQuery.toLowerCase();
    const filtered = cars.filter(car =>
      `${car.year} ${car.make} ${car.model} ${car.trim ?? ""}`.toLowerCase().includes(query)
    ).slice(0, 20);

    const groups: Record<string, Car[]> = {};
    for (const car of filtered) {
      if (!groups[car.make]) groups[car.make] = [];
      groups[car.make].push(car);
    }
    return groups;
  }, [cars, searchQuery]);

  const hasResults = Object.keys(groupedResults).length > 0;

  const selectCar = (car: Car) => {
    onBaselineChange(car);
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-gray-600 pb-2">
        <h2 className="text-lg font-semibold text-white">
          Baseline Vehicle
        </h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
          aria-expanded={showHelp}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Help
        </button>
      </div>

      {showHelp && (
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 text-sm text-blue-200 animate-fadeIn">
          <p className="font-medium mb-2">What is a baseline?</p>
          <p className="text-blue-300 mb-2">
            A baseline is a reference vehicle you know well (like your current car) that helps you compare differences.
          </p>
          <p className="text-blue-300">
            When set, the table shows +/- differences for key specs like price, size, and efficiency compared to your baseline.
          </p>
        </div>
      )}

      <div className="space-y-2" ref={containerRef}>
        <label htmlFor="baseline-search" className="block text-sm font-medium text-gray-300">
          Compare all cars against:
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id="baseline-search"
            type="text"
            placeholder={baselineCar ? getCarDisplayName(baselineCar) : "Search for a car..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full px-3 py-2 pl-8 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
            role="combobox"
            aria-expanded={isDropdownOpen && hasResults}
            aria-haspopup="listbox"
            aria-controls="baseline-results"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); inputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {isDropdownOpen && searchQuery.trim() && (
          <div
            id="baseline-results"
            role="listbox"
            className="bg-gray-900 rounded-lg border border-gray-700 max-h-48 overflow-y-auto"
          >
            {hasResults ? (
              Object.entries(groupedResults).map(([make, makeCars]) => (
                <div key={make}>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-800/50 sticky top-0">
                    {make}
                  </div>
                  {makeCars.map(car => (
                    <button
                      key={car.id}
                      role="option"
                      aria-selected={baselineCar?.id === car.id}
                      onClick={() => selectCar(car)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white text-sm flex justify-between items-center"
                    >
                      <span>{car.year} {car.model}{car.trim ? ` ${car.trim}` : ""}</span>
                      <span className="text-gray-500 text-xs">{car.bodyType}</span>
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <div className="px-3 py-3 text-gray-500 text-sm text-center">
                No cars found for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {baselineCar && (
        <div className="bg-gray-900 rounded p-3 space-y-2">
          <h3 className="font-medium text-white">{getCarDisplayName(baselineCar)}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Width (Folded):</span>
              <span className="text-white ml-1">
                {baselineCar.mirrorsFoldedWidthInches ? `${baselineCar.mirrorsFoldedWidthInches}"` : "-"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Width (Extended):</span>
              <span className="text-white ml-1">
                {getEffectiveWidth(baselineCar, mirrorBuffer).toFixed(1)}"
              </span>
            </div>
            <div>
              <span className="text-gray-400">Seats:</span>
              <span className="text-white ml-1">{baselineCar.seats}</span>
            </div>
            <div>
              <span className="text-gray-400">Doors:</span>
              <span className="text-white ml-1">{baselineCar.doors}</span>
            </div>
            <div>
              <span className="text-gray-400">Fuel:</span>
              <span className="text-white ml-1 capitalize">{baselineCar.fuelType.replace("-", " ")}</span>
            </div>
            <div>
              <span className="text-gray-400">Efficiency:</span>
              <span className="text-white ml-1">{formatMpg(baselineCar)}</span>
            </div>
            <div>
              <span className="text-gray-400">MSRP:</span>
              <span className="text-white ml-1">{formatCurrency(baselineCar.msrp)}</span>
            </div>
          </div>
          {baselineCar.notes && (
            <p className="text-xs text-gray-400 italic">{baselineCar.notes}</p>
          )}
          <button
            onClick={() => onBaselineChange(null)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Clear baseline
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Differences shown in table: <span className="text-green-400">green = better</span>,{" "}
        <span className="text-red-400">red = worse</span>
      </p>
    </div>
  );
}
