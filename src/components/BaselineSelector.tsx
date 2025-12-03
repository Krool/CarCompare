"use client";

import { useState } from "react";
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

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-gray-600 pb-2">
        <h2 className="text-lg font-semibold text-white">
          Baseline Vehicle
        </h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Compare all cars against:
        </label>
        <select
          value={baselineCar?.id ?? ""}
          onChange={(e) => {
            const car = cars.find((c) => c.id === e.target.value) ?? null;
            onBaselineChange(car);
          }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option value="">No baseline selected</option>
          {cars.map((car) => (
            <option key={car.id} value={car.id}>
              {getCarDisplayName(car)}
            </option>
          ))}
        </select>
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
