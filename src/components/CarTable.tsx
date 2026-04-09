"use client";

import React, { useState, useMemo } from "react";
import { Car, SortConfig, SortField, SafetyRating, AutonomousLevel, LeaseRating, DepreciationCategory, ReliabilityRating, ColumnId } from "@/types/car";
import {
  formatCurrency,
  formatMpg,
  getEffectiveWidth,
  calculateDifference,
  getCarDisplayName,
} from "@/lib/carUtils";
import { useFocusTrap } from "@/lib/useFocusTrap";
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
  tooltip?: string;
}

// Header tooltips for columns that need explanation
const HEADER_TOOLTIPS: Partial<Record<SortField, string>> = {
  safetyRating: "IIHS Top Safety Pick rating",
  autonomousLevel: "Driver Assistance (ADAS) capability level",
  mirrorsFoldedWidthInches: "Width with mirrors folded",
  bodyWidthInches: "Width with mirrors extended",
  groundClearanceInches: "Height from ground to undercarriage",
  mpgCombined: "MPG for gas cars, MPGe for electric",
  electricRangeMiles: "Battery-only driving range",
  leaseRating: "Our lease value score (A=best)",
  depreciationCategory: "Expected 5-year value loss",
  fiveYearResalePercent: "% of value retained after 5 years",
  reliabilityRating: "Expected reliability score",
};

function SortableHeader({ field, label, sortConfig, onSortChange, tooltip }: SortableHeaderProps) {
  const isActive = sortConfig.field === field;
  const headerTooltip = tooltip || HEADER_TOOLTIPS[field];
  const ariaSortValue = isActive
    ? sortConfig.direction === "asc" ? "ascending" as const : "descending" as const
    : "none" as const;

  return (
    <th
      className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-white/[0.02] select-none group relative transition-colors"
      onClick={() => onSortChange(field)}
      title={headerTooltip}
      aria-sort={ariaSortValue}
    >
      <div className="flex items-center gap-1">
        {label}
        {headerTooltip && (
          <svg className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {isActive && (
          <span className="text-amber-400 text-[10px]">
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

  let colorClass = "text-gray-500";
  if (isGood === true) colorClass = "text-emerald-400";
  if (isGood === false) colorClass = "text-rose-400";

  return <span className={`text-xs ml-1 font-mono ${colorClass}`}>({diff})</span>;
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
      <div className="surface-elevated rounded-xl p-10 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-10 h-10 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-base font-medium text-gray-300 mb-1">No cars match your filters</p>
          <p className="text-sm text-gray-400">Try adjusting your criteria:</p>
        </div>
        <ul className="text-gray-400 text-sm space-y-1 max-w-sm mx-auto text-left">
          <li className="flex items-center gap-2"><span className="text-gray-500">-</span> Expand the price or year range</li>
          <li className="flex items-center gap-2"><span className="text-gray-500">-</span> Remove dimension constraints</li>
          <li className="flex items-center gap-2"><span className="text-gray-500">-</span> Select more body or fuel types</li>
          <li className="flex items-center gap-2"><span className="text-gray-500">-</span> Clear specific sidebar filters</li>
        </ul>
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
    <div className="overflow-x-auto surface-elevated rounded-xl max-h-[calc(100vh-300px)] overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-800/80">
        <thead className="bg-gray-900/90 backdrop-blur-sm sticky top-0 z-10">
          <tr>
            {/* Action columns - hidden on print */}
            <th className="px-2 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-10 print:hidden">
              <span title="Add to favorites" className="text-amber-600">★</span>
            </th>
            <th className="px-2 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-10 print:hidden">
              <span title="Add to compare">⚖</span>
            </th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider print:hidden">
              Base
            </th>
            <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Image
            </th>
            <th className="px-2 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-10 print:hidden">
              <span title="View full details">Info</span>
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
            {isVisible("doors") && <SortableHeader field="doors" label="Doors" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("driverLegroomInches") && <SortableHeader field="driverLegroomInches" label="Legroom" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("cargoVolumesCuFt") && <SortableHeader field="cargoVolumesCuFt" label="Cargo" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("lengthInches") && <SortableHeader field="lengthInches" label="Length" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("mirrorsFoldedWidthInches") && <SortableHeader field="mirrorsFoldedWidthInches" label="Folded" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("oneMirrorWidthInches") && (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                1 Mirror
              </th>
            )}
            {isVisible("bodyWidthInches") && <SortableHeader field="bodyWidthInches" label="Extended" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("heightInches") && <SortableHeader field="heightInches" label="Height" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("groundClearanceInches") && <SortableHeader field="groundClearanceInches" label="Clearance" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("towingCapacityLbs") && <SortableHeader field="towingCapacityLbs" label="Towing" sortConfig={sortConfig} onSortChange={onSortChange} />}
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
            {isVisible("zeroToSixtySeconds") && <SortableHeader field="zeroToSixtySeconds" label="0-60" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("horsepower") && <SortableHeader field="horsepower" label="HP" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {/* Pricing & Ownership */}
            {isVisible("msrp") && <SortableHeader field="msrp" label="MSRP" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("leaseRating") && <SortableHeader field="leaseRating" label="Lease" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("depreciationCategory") && <SortableHeader field="depreciationCategory" label="Deprec." sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("fiveYearResalePercent") && <SortableHeader field="fiveYearResalePercent" label="Resale" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("reliabilityRating") && <SortableHeader field="reliabilityRating" label="Reliability" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("insuranceCostAnnual") && <SortableHeader field="insuranceCostAnnual" label="Insure/yr" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("maintenanceCostAnnual") && <SortableHeader field="maintenanceCostAnnual" label="Maint/yr" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("notes") && (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider max-w-xs">
                Notes
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {cars.map((car) => {
            const isBaseline = baselineCar?.id === car.id;
            const effectiveWidth = getEffectiveWidth(car, mirrorBuffer);
            const isFavorite = favorites.includes(car.id);
            const isInCompare = compareList.includes(car.id);

            return (
              <tr
                key={car.id}
                className={`table-row-hover transition-colors ${isBaseline ? "bg-amber-500/[0.06]" : isFavorite ? "bg-amber-500/[0.03]" : ""}`}
              >
                <td className="px-2 py-2 text-center print:hidden">
                  <button
                    onClick={() => onToggleFavorite(car.id)}
                    className={`text-lg transition-colors ${
                      isFavorite ? "text-amber-400" : "text-gray-700 hover:text-amber-400"
                    }`}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    aria-label={isFavorite ? `Remove ${car.year} ${car.make} ${car.model} from favorites` : `Add ${car.year} ${car.make} ${car.model} to favorites`}
                  >
                    ★
                  </button>
                </td>
                <td className="px-2 py-2 text-center print:hidden">
                  <input
                    type="checkbox"
                    checked={isInCompare}
                    onChange={() => onToggleCompare(car.id)}
                    className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 accent-amber-500"
                    title="Add to comparison"
                    aria-label={isInCompare ? `Remove ${car.year} ${car.make} ${car.model} from comparison` : `Add ${car.year} ${car.make} ${car.model} to comparison`}
                  />
                </td>
                <td className="px-3 py-2 print:hidden">
                  <button
                    onClick={() => onSelectBaseline(car)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      isBaseline
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-gray-800/50 text-gray-500 hover:text-gray-300 border border-gray-700/30"
                    }`}
                    aria-label={isBaseline ? `${car.year} ${car.make} ${car.model} is baseline` : `Set ${car.year} ${car.make} ${car.model} as baseline`}
                  >
                    {isBaseline ? "✓" : "Set"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <CarImage car={car} onImageClick={() => setModalCar(car)} />
                </td>
                <td className="px-2 py-2 text-center print:hidden">
                  <button
                    onClick={() => setModalCar(car)}
                    className="p-1.5 rounded-md bg-gray-800/50 hover:bg-amber-500/20 text-gray-500 hover:text-amber-400 transition-colors border border-gray-700/30"
                    title="View full details"
                    aria-label={`View details for ${car.year} ${car.make} ${car.model}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </td>
                {/* Configurable columns */}
                {isVisible("year") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.year}
                  </td>
                )}
                {isVisible("make") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.make}
                  </td>
                )}
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
                {isVisible("doors") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.doors}
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
                {isVisible("cargoVolumesCuFt") && (
                  <td className="px-3 py-2 text-sm text-white" title="Cargo volume in cubic feet">
                    {car.cargoVolumesCuFt ? `${car.cargoVolumesCuFt}` : "-"}
                    {baselineCar && !isBaseline && car.cargoVolumesCuFt && baselineCar.cargoVolumesCuFt && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "cargoVolumesCuFt", mirrorBuffer)} positive="higher" />
                    )}
                  </td>
                )}
                {isVisible("lengthInches") && (
                  <td className="px-3 py-2 text-sm text-white" title="Overall length">
                    {car.lengthInches ? `${car.lengthInches}"` : "-"}
                    {baselineCar && !isBaseline && car.lengthInches && baselineCar.lengthInches && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "lengthInches", mirrorBuffer)} positive="lower" />
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
                {isVisible("oneMirrorWidthInches") && (() => {
                  // Calculate 1 mirror width: (extended - folded) / 2 + folded
                  const folded = car.mirrorsFoldedWidthInches ?? car.bodyWidthInches;
                  const extended = effectiveWidth;
                  const oneMirror = ((extended - folded) / 2) + folded;
                  const baseOneMirror = baselineCar ? (() => {
                    const baseFolded = baselineCar.mirrorsFoldedWidthInches ?? baselineCar.bodyWidthInches;
                    const baseExtended = getEffectiveWidth(baselineCar, mirrorBuffer);
                    return ((baseExtended - baseFolded) / 2) + baseFolded;
                  })() : null;
                  const diff = baseOneMirror && !isBaseline ? (oneMirror - baseOneMirror).toFixed(1) : null;
                  const diffStr = diff ? (parseFloat(diff) > 0 ? `+${diff}` : diff === "0.0" ? "same" : diff) : null;
                  return (
                    <td className="px-3 py-2 text-sm text-white" title="Width with 1 mirror extended (passenger side folded)">
                      {oneMirror.toFixed(1)}"
                      {diffStr && diffStr !== "same" && (
                        <span className={`text-xs ml-1 ${parseFloat(diff!) > 0 ? "text-red-400" : "text-green-400"}`}>({diffStr})</span>
                      )}
                      {diffStr === "same" && <span className="text-gray-500 text-xs ml-1">(=)</span>}
                    </td>
                  );
                })()}
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
                {isVisible("towingCapacityLbs") && (
                  <td className="px-3 py-2 text-sm text-white" title="Towing capacity in pounds">
                    {car.towingCapacityLbs ? `${car.towingCapacityLbs.toLocaleString()}` : "-"}
                    {baselineCar && !isBaseline && car.towingCapacityLbs && baselineCar.towingCapacityLbs && (
                      <DiffBadge diff={calculateDifference(baselineCar, car, "towingCapacityLbs", mirrorBuffer)} positive="higher" />
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
                {isVisible("zeroToSixtySeconds") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.zeroToSixtySeconds ? `${car.zeroToSixtySeconds}s` : "-"}
                  </td>
                )}
                {isVisible("horsepower") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.horsepower ? `${car.horsepower}` : "-"}
                  </td>
                )}
                {/* Pricing & Ownership */}
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
                {isVisible("reliabilityRating") && (
                  <td className="px-3 py-2 text-sm">
                    <ReliabilityBadge rating={car.reliabilityRating} />
                  </td>
                )}
                {isVisible("insuranceCostAnnual") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.insuranceCostAnnual ? formatCurrency(car.insuranceCostAnnual) : "-"}
                  </td>
                )}
                {isVisible("maintenanceCostAnnual") && (
                  <td className="px-3 py-2 text-sm text-white">
                    {car.maintenanceCostAnnual ? formatCurrency(car.maintenanceCostAnnual) : "-"}
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
      {(isVisible("mirrorsFoldedWidthInches") || isVisible("oneMirrorWidthInches") || isVisible("bodyWidthInches")) && (
        <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-800/40">
          Folded = both mirrors folded, 1 Mirror = driver mirror extended only, Extended = both mirrors extended
        </div>
      )}
    </div>
    </>
  );
}

const FuelTypeBadge = React.memo(function FuelTypeBadge({ fuelType }: { fuelType: string }) {
  const colors: Record<string, string> = {
    gasoline: "bg-gray-700/50 text-gray-300 border-gray-600/30",
    diesel: "bg-amber-900/30 text-amber-300 border-amber-800/30",
    hybrid: "bg-emerald-900/30 text-emerald-300 border-emerald-800/30",
    "plug-in-hybrid": "bg-teal-900/30 text-teal-300 border-teal-800/30",
    electric: "bg-sky-900/30 text-sky-300 border-sky-800/30",
  };

  const labels: Record<string, string> = {
    gasoline: "Gas",
    diesel: "Diesel",
    hybrid: "Hybrid",
    "plug-in-hybrid": "PHEV",
    electric: "EV",
  };

  return (
    <span className={`badge border ${colors[fuelType] ?? "bg-gray-700/50 border-gray-600/30"}`}>
      {labels[fuelType] ?? fuelType}
    </span>
  );
});

const BodyTypeBadge = React.memo(function BodyTypeBadge({ bodyType }: { bodyType: string }) {
  const colors: Record<string, string> = {
    sedan: "bg-violet-900/30 text-violet-300 border-violet-800/30",
    crossover: "bg-orange-900/30 text-orange-300 border-orange-800/30",
    suv: "bg-amber-900/30 text-amber-300 border-amber-800/30",
    truck: "bg-rose-900/30 text-rose-300 border-rose-800/30",
    minivan: "bg-pink-900/30 text-pink-300 border-pink-800/30",
    hatchback: "bg-cyan-900/30 text-cyan-300 border-cyan-800/30",
    wagon: "bg-lime-900/30 text-lime-300 border-lime-800/30",
    coupe: "bg-indigo-900/30 text-indigo-300 border-indigo-800/30",
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
    <span className={`badge border ${colors[bodyType] ?? "bg-gray-700/50 border-gray-600/30"}`}>
      {labels[bodyType] ?? bodyType}
    </span>
  );
});

const SafetyBadge = React.memo(function SafetyBadge({ rating }: { rating?: SafetyRating }) {
  if (!rating || rating === "Not Rated") {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const colors: Record<string, string> = {
    "TSP+": "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
    "TSP": "bg-emerald-900/25 text-emerald-400 border-emerald-800/30",
    "Good": "bg-sky-900/25 text-sky-300 border-sky-800/30",
    "Acceptable": "bg-amber-900/25 text-amber-300 border-amber-800/30",
    "Pending": "bg-gray-700/30 text-gray-400 border-gray-600/30",
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
      className={`badge border ${colors[rating] ?? "bg-gray-700/30 border-gray-600/30"}`}
      title={titles[rating]}
    >
      {rating}
    </span>
  );
});

const ReviewScoreBadge = React.memo(function ReviewScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const getHeatmapColor = (s: number): string => {
    if (s >= 90) return "bg-emerald-900/40 text-emerald-300 border-emerald-700/40";
    if (s >= 80) return "bg-emerald-900/25 text-emerald-400 border-emerald-800/30";
    if (s >= 70) return "bg-lime-900/25 text-lime-300 border-lime-800/30";
    if (s >= 60) return "bg-amber-900/25 text-amber-300 border-amber-800/30";
    if (s >= 50) return "bg-orange-900/25 text-orange-300 border-orange-800/30";
    if (s >= 40) return "bg-orange-900/30 text-orange-300 border-orange-700/30";
    return "bg-rose-900/30 text-rose-300 border-rose-700/30";
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
      className={`badge border font-mono ${getHeatmapColor(score)}`}
      title={`${getScoreLabel(score)} - Aggregated expert review score from MotorMashup`}
    >
      {score}
    </span>
  );
});

const AdasBadge = React.memo(function AdasBadge({ level, name }: { level?: AutonomousLevel; name?: string }) {
  if (!level || level === "none") {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const colors: Record<AutonomousLevel, string> = {
    "none": "bg-gray-700/30 text-gray-500 border-gray-600/30",
    "basic": "bg-gray-700/30 text-gray-300 border-gray-600/30",
    "enhanced": "bg-sky-900/25 text-sky-300 border-sky-800/30",
    "hands-free": "bg-violet-900/30 text-violet-300 border-violet-800/30",
    "full-self-driving": "bg-cyan-900/30 text-cyan-300 border-cyan-800/30",
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
      className={`badge border ${colors[level]}`}
      title={name ?? level}
    >
      {labels[level]}
    </span>
  );
});

const LeaseRatingBadge = React.memo(function LeaseRatingBadge({ rating }: { rating?: LeaseRating }) {
  if (!rating) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const colors: Record<LeaseRating, string> = {
    "excellent": "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
    "good": "bg-emerald-900/25 text-emerald-400 border-emerald-800/30",
    "fair": "bg-amber-900/25 text-amber-300 border-amber-800/30",
    "poor": "bg-rose-900/25 text-rose-300 border-rose-800/30",
  };

  const titles: Record<LeaseRating, string> = {
    "excellent": "Excellent lease deals typically available",
    "good": "Good lease deals often available",
    "fair": "Fair lease deals - shop around",
    "poor": "Poor lease deals - consider buying",
  };

  return (
    <span
      className={`badge border capitalize ${colors[rating]}`}
      title={titles[rating]}
    >
      {rating}
    </span>
  );
});

const DepreciationBadge = React.memo(function DepreciationBadge({ category }: { category?: DepreciationCategory }) {
  if (!category) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const colors: Record<DepreciationCategory, string> = {
    "low": "bg-emerald-900/30 text-emerald-300 border-emerald-700/30",
    "medium": "bg-amber-900/25 text-amber-300 border-amber-800/30",
    "high": "bg-orange-900/25 text-orange-300 border-orange-800/30",
    "very-high": "bg-rose-900/25 text-rose-300 border-rose-800/30",
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
      className={`badge border ${colors[category]}`}
      title={titles[category]}
    >
      {labels[category]}
    </span>
  );
});

const ReliabilityBadge = React.memo(function ReliabilityBadge({ rating }: { rating?: ReliabilityRating }) {
  if (!rating) {
    return <span className="text-gray-500 text-xs">-</span>;
  }

  const colors: Record<ReliabilityRating, string> = {
    "excellent": "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
    "good": "bg-emerald-900/25 text-emerald-400 border-emerald-800/30",
    "average": "bg-amber-900/25 text-amber-300 border-amber-800/30",
    "below-average": "bg-orange-900/25 text-orange-300 border-orange-800/30",
    "poor": "bg-rose-900/25 text-rose-300 border-rose-800/30",
  };

  const labels: Record<ReliabilityRating, string> = {
    "excellent": "Excellent",
    "good": "Good",
    "average": "Avg",
    "below-average": "Below",
    "poor": "Poor",
  };

  const titles: Record<ReliabilityRating, string> = {
    "excellent": "Excellent reliability (JD Power top tier)",
    "good": "Good reliability",
    "average": "Average reliability",
    "below-average": "Below average reliability",
    "poor": "Poor reliability - expect more issues",
  };

  return (
    <span
      className={`badge border ${colors[rating]}`}
      title={titles[rating]}
    >
      {labels[rating]}
    </span>
  );
});

const FeatureCheck = React.memo(function FeatureCheck({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${enabled ? "text-emerald-400" : "text-gray-500"}`}>
      <span className="text-xs">{enabled ? "✓" : "✗"}</span>
      <span>{label}</span>
    </div>
  );
});

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
  const [imageError, setImageError] = useState(false);
  const focusTrapRef = useFocusTrap(!showGarageFit);
  const imageUrl = getCarImageUrl(car, 800, selectedAngle);
  const isBaseline = baselineCar?.id === car.id;
  const effectiveWidth = getEffectiveWidth(car, mirrorBuffer);

  const DetailRow = ({ label, value, diff, positive }: { label: string; value: string | number | undefined; diff?: string | null; positive?: "higher" | "lower" }) => (
    <div className="flex justify-between py-1 border-b border-gray-800/50">
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
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
    >
      <div
        ref={focusTrapRef}
        className="surface-elevated rounded-2xl max-w-4xl w-full p-6 mt-4 mb-8 modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 id="image-modal-title" className="text-2xl font-bold text-white">
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
            aria-label="Close details modal"
          >
            ×
          </button>
        </div>

        {/* Image Gallery */}
        <div className="mb-6">
          {/* Main Image */}
          {imageError ? (
            <div className="w-full h-64 bg-gray-700 rounded-lg mb-3 flex items-center justify-center text-gray-500 text-4xl">
              {car.bodyType.charAt(0).toUpperCase()}
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={`${car.year} ${car.make} ${car.model} - ${CAR_ANGLES.find(a => a.id === selectedAngle)?.label}`}
              className="w-full h-auto rounded-lg mb-3"
              onError={() => setImageError(true)}
            />
          )}
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
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
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
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Pricing</h4>
            <DetailRow
              label="MSRP"
              value={formatCurrency(car.msrp)}
              diff={baselineCar ? calculateDifference(baselineCar, car, "msrp", mirrorBuffer) : null}
              positive="lower"
            />
          </div>

          {/* Dimensions */}
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Dimensions</h4>
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
              className="mt-3 w-full py-2 btn-accent rounded-lg text-sm transition-colors"
            >
              Check Garage Fit
            </button>
          </div>

          {/* Capacity */}
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Capacity</h4>
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
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Efficiency</h4>
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
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Powertrain</h4>
            <DetailRow label="Fuel Type" value={car.fuelType} />
            <DetailRow label="Plug Type" value={car.plugType === "none" ? "-" : car.plugType} />
          </div>

          {/* Capability */}
          {car.towingCapacityLbs && (
            <div className="surface-inset rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Capability</h4>
              <DetailRow label="Towing Capacity" value={`${car.towingCapacityLbs.toLocaleString()} lbs`} />
            </div>
          )}

          {/* Safety */}
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Safety</h4>
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
          <div className="mt-6 surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Driver Assistance</h4>
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
          <div className="mt-6 surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Features & Notes</h4>
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
        <div className="mt-6 surface-inset rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50/50 pb-2 uppercase tracking-wider">Search This Vehicle</h4>
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
            <SearchLink
              name="Images"
              url={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}`}
              color="bg-pink-700"
            />
          </div>
        </div>

        {/* Baseline comparison note */}
        {isBaseline && (
          <div className="mt-4 p-3 bg-amber-900/15 rounded-lg border border-amber-700/30">
            <p className="text-amber-400/80 text-sm">This is your baseline vehicle for comparisons.</p>
          </div>
        )}

        {/* Footer with metadata */}
        <div className="mt-6 pt-4 border-t border-gray-800/50 flex justify-between text-xs text-gray-400">
          <span>Last updated: {car.lastUpdated}</span>
          <span>Source: {car.dataSource ?? "manual"}</span>
        </div>
      </div>
    </div>
    </>
  );
}

// Memoized car image component to prevent unnecessary re-renders
const CarImage = React.memo(function CarImage({ car, onImageClick }: { car: Car; onImageClick: () => void }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Memoize the image URL to prevent recalculation
  const imageUrl = useMemo(() => getCarImageUrl(car), [car.make, car.model]);

  // Add timeout to stop loading animation after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000);

    // Also check if image is already loaded (cached)
    if (imgRef.current?.complete) {
      setIsLoading(false);
    }

    return () => clearTimeout(timer);
  }, [imageUrl, isLoading]);

  if (hasError) {
    return (
      <div
        className="w-36 h-16 bg-gray-800/50 border border-gray-700/30 rounded-lg flex items-center justify-center text-gray-500 text-sm cursor-pointer"
        onClick={onImageClick}
        title="Click for details"
      >
        {car.bodyType.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className="w-36 h-16 relative cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onImageClick}
      title="Click for details"
    >
      {isLoading && (
        <div className="absolute inset-0 skeleton rounded flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      <img
        ref={imgRef}
        src={imageUrl}
        alt={`${car.year} ${car.make} ${car.model}`}
        className={`w-36 h-16 object-cover rounded-lg transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
});

function SearchLink({ name, url }: { name: string; url: string; color: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-gray-800/50 hover:bg-amber-500/10 border border-gray-700/30 hover:border-amber-500/30 text-gray-300 hover:text-amber-400 text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors"
    >
      {name}
    </a>
  );
}
