"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Car } from "@/types/car";
import { getCarDisplayName, getEffectiveWidth, formatCurrency, formatMpg } from "@/lib/carUtils";
import { EMPTY, bodyTypeLabel, fuelTypeLabel } from "@/lib/labels";

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
    <div className="surface-elevated rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-gray-700/30 pb-2">
        <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
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
        <div className="bg-amber-900/10 border border-amber-800/20 rounded-xl p-3 text-sm text-gray-300 animate-fadeIn">
          <p className="font-medium mb-2 text-amber-400">What is a baseline?</p>
          <p className="text-gray-400 mb-2">
            A baseline is a reference vehicle you know well (like your current car) that helps you compare differences.
          </p>
          <p className="text-gray-400">
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
            className="w-full px-3 py-2 pl-8 bg-gray-800/50 border border-gray-700/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/40 transition-colors"
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
            className="surface-inset rounded-xl border border-gray-700/30 max-h-48 overflow-y-auto"
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
                      <span className="text-gray-500 text-xs">{bodyTypeLabel(car.bodyType)}</span>
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
        <div className="surface-inset rounded-xl p-3 space-y-2">
          <h3 className="font-medium text-white text-sm">{getCarDisplayName(baselineCar)}</h3>
          {/*
            A definition list in two aligned columns. The previous 2-column
            grid of inline label/value pairs held seven items, so the last row
            left half the panel empty and no two values lined up.
          */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-gray-400">Width (folded)</dt>
            <dd className="text-white text-right tabular-nums">
              {baselineCar.mirrorsFoldedWidthInches ? `${baselineCar.mirrorsFoldedWidthInches}"` : EMPTY}
            </dd>

            <dt className="text-gray-400">Width (extended)</dt>
            <dd className="text-white text-right tabular-nums">
              {getEffectiveWidth(baselineCar, mirrorBuffer).toFixed(1)}&quot;
            </dd>

            <dt className="text-gray-400">Seats</dt>
            <dd className="text-white text-right tabular-nums">{baselineCar.seats}</dd>

            <dt className="text-gray-400">Doors</dt>
            <dd className="text-white text-right tabular-nums">{baselineCar.doors}</dd>

            <dt className="text-gray-400">Fuel</dt>
            <dd className="text-white text-right">{fuelTypeLabel(baselineCar.fuelType)}</dd>

            <dt className="text-gray-400">Efficiency</dt>
            <dd className="text-white text-right tabular-nums">{formatMpg(baselineCar)}</dd>

            <dt className="text-gray-400">MSRP</dt>
            <dd className="text-white text-right tabular-nums">{formatCurrency(baselineCar.msrp)}</dd>
          </dl>
          {baselineCar.notes && (
            <p className="text-xs text-gray-400 italic">{baselineCar.notes}</p>
          )}
          <button
            onClick={() => onBaselineChange(null)}
            className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
          >
            Clear baseline
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Differences in table: <span className="delta delta-good">▲▼</span> better,{" "}
        <span className="delta delta-bad">▲▼</span> worse than this car.
      </p>
    </div>
  );
}
