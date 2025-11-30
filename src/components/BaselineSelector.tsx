"use client";

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
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h2 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
        Baseline Vehicle
      </h2>

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
