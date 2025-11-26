"use client";

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
            <SortableHeader field="year" label="Year" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="make" label="Make" sortConfig={sortConfig} onSortChange={onSortChange} />
            <SortableHeader field="model" label="Model" sortConfig={sortConfig} onSortChange={onSortChange} />
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
                <td className="px-3 py-2 text-sm text-white">{car.year}</td>
                <td className="px-3 py-2 text-sm text-white">{car.make}</td>
                <td className="px-3 py-2 text-sm text-white">
                  {car.model}
                  {car.trim && <span className="text-gray-400 text-xs ml-1">{car.trim}</span>}
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
