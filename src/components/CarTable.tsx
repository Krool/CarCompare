"use client";

import { useState } from "react";
import { Car, SortConfig, SortField } from "@/types/car";
import {
  formatCurrency,
  formatMpg,
  getEffectiveWidth,
  calculateDifference,
  getCarDisplayName,
} from "@/lib/carUtils";

interface CarTableProps {
  cars: Car[];
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  baselineCar: Car | null;
  mirrorBuffer: number;
  onSelectBaseline: (car: Car) => void;
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
}

function SortableHeader({ field, label, sortConfig, onSortChange }: SortableHeaderProps) {
  const isActive = sortConfig.field === field;
  return (
    <th
      onClick={() => onSortChange(field)}
      className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700 select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-blue-400">
            {sortConfig.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </th>
  );
}

function DiffBadge({ diff, positive }: { diff: string | null; positive?: "higher" | "lower" }) {
  if (!diff) return null;
  if (diff === "same") {
    return <span className="text-gray-500 text-xs ml-1">(=)</span>;
  }

  const isPositiveNum = diff.startsWith("+");
  const isGood = positive === "higher" ? isPositiveNum : positive === "lower" ? !isPositiveNum : null;

  let colorClass = "text-gray-400";
  if (isGood === true) colorClass = "text-green-400";
  if (isGood === false) colorClass = "text-red-400";

  return <span className={`text-xs ml-1 ${colorClass}`}>({diff})</span>;
}

export default function CarTable({
  cars,
  sortConfig,
  onSortChange,
  baselineCar,
  mirrorBuffer,
  onSelectBaseline,
}: CarTableProps) {
  if (cars.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
        No cars match your filters. Try adjusting the filter criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-gray-800 rounded-lg">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-900">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Baseline
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Image
            </th>
            <SortableHeader field="year" label="Year" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="make" label="Make" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="model" label="Model" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="bodyType" label="Type" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="seats" label="Seats" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="doors" label="Doors" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="bodyWidthInches" label="Width (in)" sortConfig={sortConfig} onSortChange={onSortChange} />
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Fuel
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Plug
            </th>
            <SortableHeader field="mpgCombined" label="Efficiency" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="electricRangeMiles" label="EV Range" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="msrp" label="MSRP" sortConfig={sortConfig} onSortChange={onSortChange} />
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Used Price
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider max-w-xs">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {cars.map((car) => {
            const isBaseline = baselineCar?.id === car.id;
            const effectiveWidth = getEffectiveWidth(car, mirrorBuffer);
            const hasActualMirrorWidth = car.mirrorWidthInches !== undefined;

            return (
              <tr
                key={car.id}
                className={`${isBaseline ? "bg-blue-900/30" : "hover:bg-gray-700/50"}`}
              >
                <td className="px-3 py-2">
                  <button
                    onClick={() => onSelectBaseline(car)}
                    className={`px-2 py-1 rounded text-xs ${
                      isBaseline
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {isBaseline ? "Baseline" : "Set"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <CarImage car={car} />
                </td>
                <td className="px-3 py-2 text-sm text-white">{car.year}</td>
                <td className="px-3 py-2 text-sm text-white">{car.make}</td>
                <td className="px-3 py-2 text-sm text-white">
                  {car.model}
                  {car.trim && <span className="text-gray-400 text-xs ml-1">{car.trim}</span>}
                </td>
                <td className="px-3 py-2 text-sm">
                  <BodyTypeBadge bodyType={car.bodyType} />
                </td>
                <td className="px-3 py-2 text-sm text-white">
                  {car.seats}
                  {baselineCar && !isBaseline && (
                    <DiffBadge diff={calculateDifference(baselineCar, car, "seats", mirrorBuffer)} positive="higher" />
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-white">{car.doors}</td>
                <td className="px-3 py-2 text-sm text-white">
                  <span title={hasActualMirrorWidth ? "Actual mirror width" : `Body: ${car.bodyWidthInches}" + ${mirrorBuffer}" buffer`}>
                    {effectiveWidth.toFixed(1)}
                    {!hasActualMirrorWidth && <span className="text-gray-500">*</span>}
                  </span>
                  {baselineCar && !isBaseline && (
                    <DiffBadge diff={calculateDifference(baselineCar, car, "bodyWidthInches", mirrorBuffer)} positive="lower" />
                  )}
                </td>
                <td className="px-3 py-2 text-sm">
                  <FuelTypeBadge fuelType={car.fuelType} />
                </td>
                <td className="px-3 py-2 text-sm text-gray-300">
                  {car.plugType === "none" ? "-" : car.plugType}
                </td>
                <td className="px-3 py-2 text-sm text-white">
                  {formatMpg(car)}
                  {baselineCar && !isBaseline && car.mpgCombined && baselineCar.mpgCombined && (
                    <DiffBadge diff={calculateDifference(baselineCar, car, "mpgCombined", mirrorBuffer)} positive="higher" />
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-white">
                  {car.electricRangeMiles ? `${car.electricRangeMiles} mi` : "-"}
                </td>
                <td className="px-3 py-2 text-sm text-white">
                  {formatCurrency(car.msrp)}
                  {baselineCar && !isBaseline && (
                    <DiffBadge diff={calculateDifference(baselineCar, car, "msrp", mirrorBuffer)} positive="lower" />
                  )}
                </td>
                <td className="px-3 py-2 text-sm text-gray-300">
                  {car.usedPriceLow && car.usedPriceHigh
                    ? `${formatCurrency(car.usedPriceLow)} - ${formatCurrency(car.usedPriceHigh)}`
                    : "-"}
                </td>
                <td className="px-3 py-2 text-sm text-gray-400 max-w-xs truncate" title={car.notes}>
                  {car.notes ?? "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-700">
        * Width estimated using body width + {mirrorBuffer}" mirror buffer
      </div>
    </div>
  );
}

function FuelTypeBadge({ fuelType }: { fuelType: string }) {
  const colors: Record<string, string> = {
    gasoline: "bg-gray-600 text-gray-200",
    diesel: "bg-yellow-800 text-yellow-200",
    hybrid: "bg-green-800 text-green-200",
    "plug-in-hybrid": "bg-teal-800 text-teal-200",
    electric: "bg-blue-800 text-blue-200",
  };

  const labels: Record<string, string> = {
    gasoline: "Gas",
    diesel: "Diesel",
    hybrid: "Hybrid",
    "plug-in-hybrid": "PHEV",
    electric: "EV",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colors[fuelType] ?? "bg-gray-600"}`}>
      {labels[fuelType] ?? fuelType}
    </span>
  );
}

function BodyTypeBadge({ bodyType }: { bodyType: string }) {
  const colors: Record<string, string> = {
    sedan: "bg-purple-800 text-purple-200",
    crossover: "bg-orange-800 text-orange-200",
    suv: "bg-amber-800 text-amber-200",
    truck: "bg-red-800 text-red-200",
    minivan: "bg-pink-800 text-pink-200",
    hatchback: "bg-cyan-800 text-cyan-200",
    wagon: "bg-lime-800 text-lime-200",
    coupe: "bg-indigo-800 text-indigo-200",
  };

  const labels: Record<string, string> = {
    sedan: "Sedan",
    crossover: "Crossover",
    suv: "SUV",
    truck: "Truck",
    minivan: "Minivan",
    hatchback: "Hatch",
    wagon: "Wagon",
    coupe: "Coupe",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colors[bodyType] ?? "bg-gray-600"}`}>
      {labels[bodyType] ?? bodyType}
    </span>
  );
}

function getCarImageUrl(car: Car): string {
  // Use IMAGIN.studio API for consistent car images
  // Format model name: "RAV4 Hybrid" -> "rav4", "Model Y" -> "model-y", "CR-V" -> "cr-v"
  const modelFamily = car.model
    .split(" ")[0] // Take first word (e.g., "RAV4" from "RAV4 Hybrid")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-") // Replace non-alphanumeric with dash
    .replace(/-+/g, "-") // Remove consecutive dashes
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

  const make = car.make.toLowerCase();

  return `https://cdn.imagin.studio/getImage?customer=img&make=${make}&modelFamily=${modelFamily}&paintId=pspc0001&angle=01&width=200`;
}

function CarImage({ car }: { car: Car }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = getCarImageUrl(car);

  if (hasError) {
    return (
      <div className="w-16 h-10 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
        {car.bodyType.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="w-16 h-10 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
          ...
        </div>
      )}
      <img
        src={imageUrl}
        alt={`${car.year} ${car.make} ${car.model}`}
        className={`w-16 h-10 object-cover rounded ${isLoading ? "opacity-0" : "opacity-100"}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
