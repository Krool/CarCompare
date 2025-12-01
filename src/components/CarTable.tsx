"use client";

import { useState } from "react";
import { Car, SortConfig, SortField, SafetyRating, AutonomousLevel, LeaseRating, DepreciationCategory, ColumnId } from "@/types/car";
import {
  formatCurrency,
  formatMpg,
  getEffectiveWidth,
  calculateDifference,
  getCarDisplayName,
} from "@/lib/carUtils";
import GarageFitVisualizer from "./GarageFitVisualizer";

interface CarTableProps {
  cars: Car[];
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  baselineCar: Car | null;
  mirrorBuffer: number;
  onSelectBaseline: (car: Car) => void;
  compareList: string[];
  onToggleCompare: (carId: string) => void;
  favorites: string[];
  onToggleFavorite: (carId: string) => void;
  visibleColumns: ColumnId[];
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
  compareList,
  onToggleCompare,
  favorites,
  onToggleFavorite,
  visibleColumns,
}: CarTableProps) {
  const [modalCar, setModalCar] = useState<Car | null>(null);

  // Helper to check if a column is visible
  const isVisible = (columnId: ColumnId) => visibleColumns.includes(columnId);

  if (cars.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
        No cars match your filters. Try adjusting the filter criteria.
      </div>
    );
  }

  return (
    <>
      {modalCar && (
        <ImageModal
          car={modalCar}
          onClose={() => setModalCar(null)}
          baselineCar={baselineCar}
          mirrorBuffer={mirrorBuffer}
        />
      )}
    <div className="overflow-x-auto bg-gray-800 rounded-lg max-h-[calc(100vh-300px)] overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-900 sticky top-0 z-10">
          <tr>
            {/* Action columns - always visible */}
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider w-10">
              <span title="Add to favorites">★</span>
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-300 uppercase tracking-wider w-10">
              <span title="Add to compare">⚖</span>
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Base
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Image
            </th>
            {/* Configurable columns */}
            {isVisible("year") && <SortableHeader field="year" label="Year" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("make") && <SortableHeader field="make" label="Make" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("model") && <SortableHeader field="model" label="Model" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("bodyType") && <SortableHeader field="bodyType" label="Type" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("safetyRating") && <SortableHeader field="safetyRating" label="Safety" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("reviewScore") && <SortableHeader field="reviewScore" label="Score" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("autonomousLevel") && <SortableHeader field="autonomousLevel" label="ADAS" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("seats") && <SortableHeader field="seats" label="Seats" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("driverLegroomInches") && <SortableHeader field="driverLegroomInches" label="Legroom" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("mirrorsFoldedWidthInches") && <SortableHeader field="mirrorsFoldedWidthInches" label="Folded" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("bodyWidthInches") && <SortableHeader field="bodyWidthInches" label="Extended" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("heightInches") && <SortableHeader field="heightInches" label="Height" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("groundClearanceInches") && <SortableHeader field="groundClearanceInches" label="Clearance" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("fuelType") && (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Fuel
              </th>
            )}
            {isVisible("plugType") && (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Plug
              </th>
            )}
            {isVisible("mpgCombined") && <SortableHeader field="mpgCombined" label="Efficiency" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("electricRangeMiles") && <SortableHeader field="electricRangeMiles" label="EV Range" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("msrp") && <SortableHeader field="msrp" label="MSRP" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("leaseRating") && <SortableHeader field="leaseRating" label="Lease" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("depreciationCategory") && <SortableHeader field="depreciationCategory" label="Deprec." sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("fiveYearResalePercent") && <SortableHeader field="fiveYearResalePercent" label="Resale" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("notes") && (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider max-w-xs">
                Notes
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {cars.map((car) => {
            const isBaseline = baselineCar?.id === car.id;
            const effectiveWidth = getEffectiveWidth(car, mirrorBuffer);
            const isFavorite = favorites.includes(car.id);
            const isInCompare = compareList.includes(car.id);

            return (
              <tr
                key={car.id}
                className={`${isBaseline ? "bg-blue-900/30" : isFavorite ? "bg-yellow-900/20" : "hover:bg-gray-700/50"}`}
              >
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => onToggleFavorite(car.id)}
                    className={`text-xl transition-colors ${
                      isFavorite ? "text-yellow-400" : "text-gray-600 hover:text-yellow-400"
                    }`}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    ★
                  </button>
                </td>
                <td className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={isInCompare}
                    onChange={() => onToggleCompare(car.id)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    title="Add to comparison"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => onSelectBaseline(car)}
                    className={`px-2 py-1 rounded text-xs ${
                      isBaseline
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {isBaseline ? "✓" : "Set"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <CarImage car={car} onImageClick={() => setModalCar(car)} />
                </td>
                {/* Configurable columns */}
                {isVisible("year") && <td className="px-3 py-2 text-sm text-white">{car.year}</td>}
                {isVisible("make") && <td className="px-3 py-2 text-sm text-white">{car.make}</td>}
                {isVisible("model") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.model}
                    {car.trim && <span className="text-gray-400 text-xs ml-1">{car.trim}</span>}
                  </td>
                )}
                {isVisible("bodyType") && (
                  <td className="px-3 py-2 text-sm">
                    <BodyTypeBadge bodyType={car.bodyType} />
                  </td>
                )}
                {isVisible("safetyRating") && (
                  <td className="px-3 py-2 text-sm">
                    <SafetyBadge rating={car.safetyRating} />
                  </td>
                )}
                {isVisible("reviewScore") && (
                  <td className="px-3 py-2 text-sm">
                    <ReviewScoreBadge score={car.reviewScore} />
                  </td>
                )}
                {isVisible("autonomousLevel") && (
                  <td className="px-3 py-2 text-sm">
                    <AdasBadge level={car.autonomousLevel} name={car.adasName} />
                  </td>
                )}
                {isVisible("seats") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.seats}
                    {baselineCar && !isBaseline && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "seats", mirrorBuffer)} positive="higher" />
                    )}
                  </td>
                )}
                {isVisible("driverLegroomInches") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.driverLegroomInches ? `${car.driverLegroomInches}"` : "-"}
                    {baselineCar && !isBaseline && car.driverLegroomInches && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "driverLegroomInches", mirrorBuffer)} positive="higher" />
                    )}
                  </td>
                )}
                {isVisible("mirrorsFoldedWidthInches") && (
                  <td className="px-3 py-2 text-sm text-white" title="Width with mirrors folded">
                    {car.mirrorsFoldedWidthInches ? `${car.mirrorsFoldedWidthInches}"` : "-"}
                    {baselineCar && !isBaseline && car.mirrorsFoldedWidthInches && baselineCar.mirrorsFoldedWidthInches && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "mirrorsFoldedWidthInches", mirrorBuffer)} positive="lower" />
                    )}
                  </td>
                )}
                {isVisible("bodyWidthInches") && (
                  <td className="px-3 py-2 text-sm text-white" title="Width with mirrors extended">
                    {effectiveWidth.toFixed(1)}"
                    {baselineCar && !isBaseline && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "bodyWidthInches", mirrorBuffer)} positive="lower" />
                    )}
                  </td>
                )}
                {isVisible("heightInches") && (
                  <td className="px-3 py-2 text-sm text-white" title="Overall height">
                    {car.heightInches ? `${car.heightInches}"` : "-"}
                    {baselineCar && !isBaseline && car.heightInches && baselineCar.heightInches && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "heightInches", mirrorBuffer)} positive="lower" />
                    )}
                  </td>
                )}
                {isVisible("groundClearanceInches") && (
                  <td className="px-3 py-2 text-sm text-white" title="Ground clearance">
                    {car.groundClearanceInches ? `${car.groundClearanceInches}"` : "-"}
                    {baselineCar && !isBaseline && car.groundClearanceInches && baselineCar.groundClearanceInches && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "groundClearanceInches", mirrorBuffer)} positive="higher" />
                    )}
                  </td>
                )}
                {isVisible("fuelType") && (
                  <td className="px-3 py-2 text-sm">
                    <FuelTypeBadge fuelType={car.fuelType} />
                  </td>
                )}
                {isVisible("plugType") && (
                  <td className="px-3 py-2 text-sm text-gray-300">
                    {car.plugType === "none" ? "-" : car.plugType}
                  </td>
                )}
                {isVisible("mpgCombined") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {formatMpg(car)}
                    {baselineCar && !isBaseline && car.mpgCombined && baselineCar.mpgCombined && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "mpgCombined", mirrorBuffer)} positive="higher" />
                    )}
                  </td>
                )}
                {isVisible("electricRangeMiles") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.electricRangeMiles ? `${car.electricRangeMiles} mi` : "-"}
                  </td>
                )}
                {isVisible("msrp") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {formatCurrency(car.msrp)}
                    {baselineCar && !isBaseline && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "msrp", mirrorBuffer)} positive="lower" />
                    )}
                  </td>
                )}
                {isVisible("leaseRating") && (
                  <td className="px-3 py-2 text-sm">
                    <LeaseRatingBadge rating={car.leaseRating} />
                  </td>
                )}
                {isVisible("depreciationCategory") && (
                  <td className="px-3 py-2 text-sm">
                    <DepreciationBadge category={car.depreciationCategory} />
                  </td>
                )}
                {isVisible("fiveYearResalePercent") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.fiveYearResalePercent ? `${car.fiveYearResalePercent}%` : "-"}
                  </td>
                )}
                {isVisible("notes") && (
                  <td className="px-3 py-2 text-sm text-gray-400 max-w-xs truncate" title={car.notes}>
                    {car.notes ?? "-"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {(isVisible("mirrorsFoldedWidthInches") || isVisible("bodyWidthInches")) && (
        <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-700">
          Folded = mirrors folded in, Extended = mirrors extended out
        </div>
      )}
    </div>
    </>
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

function SafetyBadge({ rating }: { rating?: SafetyRating }) {
  if (!rating || rating === "Not Rated") {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const colors: Record<string, string> = {
    "TSP+": "bg-green-700 text-green-100",
    "TSP": "bg-green-800 text-green-200",
    "Good": "bg-blue-800 text-blue-200",
    "Acceptable": "bg-yellow-800 text-yellow-200",
    "Pending": "bg-gray-600 text-gray-300",
  };

  const titles: Record<string, string> = {
    "TSP+": "IIHS Top Safety Pick+",
    "TSP": "IIHS Top Safety Pick",
    "Good": "IIHS Good Rating",
    "Acceptable": "IIHS Acceptable Rating",
    "Pending": "Awaiting IIHS testing",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs ${colors[rating] ?? "bg-gray-600"}`}
      title={titles[rating]}
    >
      {rating}
    </span>
  );
}

function ReviewScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  // Heatmap colors based on score (0-100)
  // Red (0-40) -> Orange (40-60) -> Yellow (60-75) -> Light Green (75-90) -> Green (90-100)
  const getHeatmapColor = (s: number): string => {
    if (s >= 90) return "bg-green-600 text-white";
    if (s >= 80) return "bg-green-700 text-green-100";
    if (s >= 70) return "bg-lime-700 text-lime-100";
    if (s >= 60) return "bg-yellow-600 text-yellow-100";
    if (s >= 50) return "bg-orange-600 text-orange-100";
    if (s >= 40) return "bg-orange-700 text-orange-100";
    return "bg-red-700 text-red-100";
  };

  const getScoreLabel = (s: number): string => {
    if (s >= 90) return "Excellent";
    if (s >= 80) return "Very Good";
    if (s >= 70) return "Good";
    if (s >= 60) return "Above Average";
    if (s >= 50) return "Average";
    if (s >= 40) return "Below Average";
    return "Poor";
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${getHeatmapColor(score)}`}
      title={`${getScoreLabel(score)} - Aggregated expert review score from MotorMashup`}
    >
      {score}
    </span>
  );
}

function AdasBadge({ level, name }: { level?: AutonomousLevel; name?: string }) {
  if (!level || level === "none") {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const colors: Record<AutonomousLevel, string> = {
    "none": "bg-gray-700 text-gray-400",
    "basic": "bg-gray-600 text-gray-200",
    "enhanced": "bg-blue-800 text-blue-200",
    "hands-free": "bg-purple-700 text-purple-200",
    "full-self-driving": "bg-cyan-700 text-cyan-200",
  };

  const labels: Record<AutonomousLevel, string> = {
    "none": "None",
    "basic": "Basic",
    "enhanced": "Enhanced",
    "hands-free": "Hands-Free",
    "full-self-driving": "FSD",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs ${colors[level]}`}
      title={name ?? level}
    >
      {labels[level]}
    </span>
  );
}

function LeaseRatingBadge({ rating }: { rating?: LeaseRating }) {
  if (!rating) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const colors: Record<LeaseRating, string> = {
    "excellent": "bg-green-600 text-white",
    "good": "bg-green-800 text-green-200",
    "fair": "bg-yellow-700 text-yellow-100",
    "poor": "bg-red-800 text-red-200",
  };

  const titles: Record<LeaseRating, string> = {
    "excellent": "Excellent lease deals typically available",
    "good": "Good lease deals often available",
    "fair": "Fair lease deals - shop around",
    "poor": "Poor lease deals - consider buying",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs capitalize ${colors[rating]}`}
      title={titles[rating]}
    >
      {rating}
    </span>
  );
}

function DepreciationBadge({ category }: { category?: DepreciationCategory }) {
  if (!category) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const colors: Record<DepreciationCategory, string> = {
    "low": "bg-green-600 text-white",
    "medium": "bg-yellow-700 text-yellow-100",
    "high": "bg-orange-700 text-orange-100",
    "very-high": "bg-red-700 text-red-100",
  };

  const labels: Record<DepreciationCategory, string> = {
    "low": "Low",
    "medium": "Med",
    "high": "High",
    "very-high": "V.High",
  };

  const titles: Record<DepreciationCategory, string> = {
    "low": "Low depreciation - holds value well",
    "medium": "Average depreciation",
    "high": "High depreciation - loses value faster",
    "very-high": "Very high depreciation - loses value quickly",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs ${colors[category]}`}
      title={titles[category]}
    >
      {labels[category]}
    </span>
  );
}

function FeatureCheck({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className={`flex items-center gap-1 ${enabled ? "text-green-400" : "text-gray-500"}`}>
      <span>{enabled ? "✓" : "✗"}</span>
      <span>{label}</span>
    </div>
  );
}

// Available angles from IMAGIN.studio
const CAR_ANGLES = [
  { id: "01", label: "Front 3/4" },
  { id: "09", label: "Rear 3/4" },
  { id: "13", label: "Side" },
  { id: "29", label: "Front" },
] as const;

function getCarImageUrl(car: Car, size: number = 400, angle: string = "01"): string {
  // Use IMAGIN.studio API for consistent car images
  // Format model name: "RAV4 Hybrid" -> "rav4", "Model Y" -> "model-y", "CR-V" -> "cr-v"
  const modelFamily = car.model
    .split(" ")[0] // Take first word (e.g., "RAV4" from "RAV4 Hybrid")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-") // Replace non-alphanumeric with dash
    .replace(/-+/g, "-") // Remove consecutive dashes
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

  const make = car.make.toLowerCase();

  return `https://cdn.imagin.studio/getImage?customer=img&make=${make}&modelFamily=${modelFamily}&paintId=pspc0001&angle=${angle}&width=${size}`;
}

interface ImageModalProps {
  car: Car;
  onClose: () => void;
  baselineCar: Car | null;
  mirrorBuffer: number;
}

function ImageModal({ car, onClose, baselineCar, mirrorBuffer }: ImageModalProps) {
  const [selectedAngle, setSelectedAngle] = useState("01");
  const [showGarageFit, setShowGarageFit] = useState(false);
  const imageUrl = getCarImageUrl(car, 800, selectedAngle);
  const isBaseline = baselineCar?.id === car.id;
  const effectiveWidth = getEffectiveWidth(car, mirrorBuffer);

  const DetailRow = ({ label, value, diff, positive }: { label: string; value: string | number | undefined; diff?: string | null; positive?: "higher" | "lower" }) => (
    <div className="flex justify-between py-1 border-b border-gray-700">
      <span className="text-gray-400">{label}</span>
      <span className="text-white">
        {value ?? "-"}
        {diff && !isBaseline && <DiffBadge diff={diff} positive={positive} />}
      </span>
    </div>
  );

  return (
    <>
      {showGarageFit && (
        <GarageFitVisualizer
          car={car}
          mirrorBuffer={mirrorBuffer}
          onClose={() => setShowGarageFit(false)}
        />
      )}
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg max-w-4xl w-full p-6 mt-4 mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">
              {car.year} {car.make} {car.model}
            </h3>
            {car.trim && <p className="text-gray-400">{car.trim}</p>}
            <div className="flex gap-2 mt-2">
              <BodyTypeBadge bodyType={car.bodyType} />
              <FuelTypeBadge fuelType={car.fuelType} />
              <SafetyBadge rating={car.safetyRating} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none p-2"
          >
            ×
          </button>
        </div>

        {/* Image Gallery */}
        <div className="mb-6">
          {/* Main Image */}
          <img
            src={imageUrl}
            alt={`${car.year} ${car.make} ${car.model} - ${CAR_ANGLES.find(a => a.id === selectedAngle)?.label}`}
            className="w-full h-auto rounded-lg mb-3"
          />
          {/* Thumbnail Strip */}
          <div className="flex gap-2 justify-center">
            {CAR_ANGLES.map((angle) => (
              <button
                key={angle.id}
                onClick={() => setSelectedAngle(angle.id)}
                className={`relative rounded overflow-hidden border-2 transition-all ${
                  selectedAngle === angle.id
                    ? "border-blue-500 scale-105"
                    : "border-gray-600 hover:border-gray-400"
                }`}
              >
                <img
                  src={getCarImageUrl(car, 150, angle.id)}
                  alt={angle.label}
                  className="w-20 h-12 object-cover"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 text-center">
                  {angle.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pricing */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Pricing</h4>
            <DetailRow
              label="MSRP"
              value={formatCurrency(car.msrp)}
              diff={baselineCar ? calculateDifference(baselineCar, car, "msrp", mirrorBuffer) : null}
              positive="lower"
            />
          </div>

          {/* Dimensions */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Dimensions</h4>
            <DetailRow
              label="Width (Mirrors Folded)"
              value={car.mirrorsFoldedWidthInches ? `${car.mirrorsFoldedWidthInches}"` : undefined}
              diff={baselineCar && baselineCar.mirrorsFoldedWidthInches && car.mirrorsFoldedWidthInches ? calculateDifference(baselineCar, car, "mirrorsFoldedWidthInches", mirrorBuffer) : null}
              positive="lower"
            />
            <DetailRow
              label="Width (Mirrors Extended)"
              value={`${effectiveWidth.toFixed(1)}"`}
              diff={baselineCar ? calculateDifference(baselineCar, car, "bodyWidthInches", mirrorBuffer) : null}
              positive="lower"
            />
            <DetailRow label="Body Width" value={car.bodyWidthInches ? `${car.bodyWidthInches}"` : undefined} />
            <DetailRow label="Length" value={car.lengthInches ? `${car.lengthInches}"` : undefined} />
            <DetailRow
              label="Height"
              value={car.heightInches ? `${car.heightInches}"` : undefined}
              diff={baselineCar && car.heightInches && baselineCar.heightInches ? calculateDifference(baselineCar, car, "heightInches", mirrorBuffer) : null}
              positive="lower"
            />
            <DetailRow
              label="Ground Clearance"
              value={car.groundClearanceInches ? `${car.groundClearanceInches}"` : undefined}
              diff={baselineCar && car.groundClearanceInches && baselineCar.groundClearanceInches ? calculateDifference(baselineCar, car, "groundClearanceInches", mirrorBuffer) : null}
              positive="higher"
            />
            <button
              onClick={() => setShowGarageFit(true)}
              className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors"
            >
              Check Garage Fit
            </button>
          </div>

          {/* Capacity */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Capacity</h4>
            <DetailRow
              label="Seats"
              value={car.seats}
              diff={baselineCar ? calculateDifference(baselineCar, car, "seats", mirrorBuffer) : null}
              positive="higher"
            />
            <DetailRow label="Doors" value={car.doors} />
            <DetailRow
              label="Driver Legroom"
              value={car.driverLegroomInches ? `${car.driverLegroomInches}"` : undefined}
              diff={baselineCar ? calculateDifference(baselineCar, car, "driverLegroomInches", mirrorBuffer) : null}
              positive="higher"
            />
            <DetailRow label="Cargo Volume" value={car.cargoVolumesCuFt ? `${car.cargoVolumesCuFt} cu ft` : undefined} />
          </div>

          {/* Efficiency */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Efficiency</h4>
            {car.fuelType !== "electric" && (
              <>
                <DetailRow label="City MPG" value={car.mpgCity} />
                <DetailRow label="Highway MPG" value={car.mpgHighway} />
                <DetailRow
                  label="Combined MPG"
                  value={car.mpgCombined}
                  diff={baselineCar ? calculateDifference(baselineCar, car, "mpgCombined", mirrorBuffer) : null}
                  positive="higher"
                />
              </>
            )}
            {car.mpge && <DetailRow label="MPGe" value={car.mpge} />}
            {car.electricRangeMiles && (
              <DetailRow
                label="Electric Range"
                value={`${car.electricRangeMiles} mi`}
                diff={baselineCar ? calculateDifference(baselineCar, car, "electricRangeMiles", mirrorBuffer) : null}
                positive="higher"
              />
            )}
          </div>

          {/* Powertrain */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Powertrain</h4>
            <DetailRow label="Fuel Type" value={car.fuelType} />
            <DetailRow label="Plug Type" value={car.plugType === "none" ? "N/A" : car.plugType} />
          </div>

          {/* Capability */}
          {car.towingCapacityLbs && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Capability</h4>
              <DetailRow label="Towing Capacity" value={`${car.towingCapacityLbs.toLocaleString()} lbs`} />
            </div>
          )}

          {/* Safety */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Safety</h4>
            <DetailRow label="IIHS Rating" value={car.safetyRating ?? "Not Rated"} />
            {car.safetyRating === "TSP+" && (
              <p className="text-xs text-green-400 mt-2">Top Safety Pick+ - Highest IIHS award</p>
            )}
            {car.safetyRating === "TSP" && (
              <p className="text-xs text-green-400 mt-2">Top Safety Pick - Excellent safety rating</p>
            )}
          </div>
        </div>

        {/* Driver Assistance */}
        {car.autonomousLevel && car.autonomousLevel !== "none" && (
          <div className="mt-6 bg-gray-900 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Driver Assistance</h4>
            <div className="flex items-center gap-2 mb-3">
              <AdasBadge level={car.autonomousLevel} name={car.adasName} />
              {car.adasName && <span className="text-gray-300 text-sm">{car.adasName}</span>}
            </div>
            {car.adasFeatures && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <FeatureCheck label="Adaptive Cruise Control" enabled={car.adasFeatures.adaptiveCruiseControl} />
                <FeatureCheck label="Lane Keep Assist" enabled={car.adasFeatures.laneKeepAssist} />
                <FeatureCheck label="Lane Centering" enabled={car.adasFeatures.laneCenteringAssist} />
                <FeatureCheck label="Blind Spot Monitoring" enabled={car.adasFeatures.blindSpotMonitoring} />
                <FeatureCheck label="Auto Emergency Braking" enabled={car.adasFeatures.automaticEmergencyBraking} />
                <FeatureCheck label="Traffic Sign Recognition" enabled={car.adasFeatures.trafficSignRecognition} />
                <FeatureCheck label="Driver Monitoring" enabled={car.adasFeatures.driverMonitoring} />
                <FeatureCheck label="Auto Lane Change" enabled={car.adasFeatures.autoLaneChange} />
                <FeatureCheck label="Summon/Remote Parking" enabled={car.adasFeatures.summonParking} />
                <FeatureCheck label="Hands-Free Highway" enabled={car.adasFeatures.handsFreeHighway} />
                <FeatureCheck label="City Autonomy" enabled={car.adasFeatures.cityAutopilot} />
              </div>
            )}
          </div>
        )}

        {/* Features & Notes */}
        {(car.standardFeatures?.length || car.notes) && (
          <div className="mt-6 bg-gray-900 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Features & Notes</h4>
            {car.standardFeatures && car.standardFeatures.length > 0 && (
              <div className="mb-3">
                <span className="text-gray-400 text-sm">Standard Features:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {car.standardFeatures.map((feature, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-200">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {car.notes && (
              <div>
                <span className="text-gray-400 text-sm">Notes:</span>
                <p className="text-white mt-1">{car.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Search Links */}
        <div className="mt-6 bg-gray-900 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">Search This Vehicle</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SearchLink
              name="Cars.com"
              url={`https://www.cars.com/shopping/results/?keyword=${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}`}
              color="bg-blue-700"
            />
            <SearchLink
              name="AutoTrader"
              url={`https://www.autotrader.com/cars-for-sale/all-cars/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}?startYear=${car.year}&endYear=${car.year}`}
              color="bg-red-700"
            />
            <SearchLink
              name="CarGurus"
              url={`https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?zip=10001&sourceContext=carGurusHomePageModel&newSearchFromOverviewPage=true&inventorySearchWidgetType=AUTO&entitySelectingHelper.selectedEntity=${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}`}
              color="bg-green-700"
            />
            <SearchLink
              name="Edmunds"
              url={`https://www.edmunds.com/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}/${car.year}/`}
              color="bg-purple-700"
            />
            <SearchLink
              name="KBB"
              url={`https://www.kbb.com/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}/${car.year}/`}
              color="bg-cyan-700"
            />
            <SearchLink
              name="TrueCar"
              url={`https://www.truecar.com/used-cars-for-sale/listings/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}/year-${car.year}/`}
              color="bg-orange-700"
            />
            <SearchLink
              name="CarMax"
              url={`https://www.carmax.com/cars/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}?year=${car.year}`}
              color="bg-yellow-700"
            />
            <SearchLink
              name="Google"
              url={`https://www.google.com/search?q=${encodeURIComponent(`${car.year} ${car.make} ${car.model} for sale`)}`}
              color="bg-gray-600"
            />
          </div>
        </div>

        {/* Baseline comparison note */}
        {isBaseline && (
          <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-700">
            <p className="text-blue-300 text-sm">This is your baseline vehicle for comparisons.</p>
          </div>
        )}

        {/* Footer with metadata */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between text-xs text-gray-500">
          <span>Last updated: {car.lastUpdated}</span>
          <span>Source: {car.dataSource ?? "manual"}</span>
        </div>
      </div>
    </div>
    </>
  );
}

function CarImage({ car, onImageClick }: { car: Car; onImageClick: () => void }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = getCarImageUrl(car);

  if (hasError) {
    return (
      <div className="w-28 h-16 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-sm">
        {car.bodyType.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className="w-28 h-16 relative cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onImageClick}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
          ...
        </div>
      )}
      <img
        src={imageUrl}
        alt={`${car.year} ${car.make} ${car.model}`}
        className={`w-28 h-16 object-cover rounded ${isLoading ? "opacity-0" : "opacity-100"}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}

function SearchLink({ name, url, color }: { name: string; url: string; color: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${color} hover:opacity-80 text-white text-center py-2 px-3 rounded text-sm font-medium transition-opacity`}
    >
      {name}
    </a>
  );
}
