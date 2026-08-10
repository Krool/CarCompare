"use client";

import React, { useState, useMemo } from "react";
import { Car, SortConfig, SortField, SafetyRating, AutonomousLevel, LeaseRating, DepreciationCategory, ReliabilityRating, BodyType, FuelType, ColumnId } from "@/types/car";
import {
  formatCurrency,
  formatMpg,
  getEffectiveWidth,
  calculateDifference,
  getCarImageUrl,
  hasVehicleImagery,
  CAR_ANGLES,
  getFoldedWidth,
  getOneMirrorWidth,
  isFoldedWidthEstimated,
  FOLDED_MIRROR_FALLBACK_INCHES,
} from "@/lib/carUtils";
import {
  EMPTY,
  bodyTypeLabel,
  fuelTypeLabel,
  adasLevelLabel,
  plugTypeLabel,
  reliabilityLabel,
  depreciationLabel,
  leaseRatingLabel,
  hasValue,
  optional,
} from "@/lib/labels";
import { useFocusTrap } from "@/lib/useFocusTrap";
import CarImagePlaceholder from "./CarImagePlaceholder";
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

  const sortHint = isActive
    ? sortConfig.direction === "asc" ? "sorted ascending" : "sorted descending"
    : "not sorted, activate to sort";

  return (
    <th
      scope="col"
      className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider select-none group relative transition-colors"
      aria-sort={ariaSortValue}
    >
      <button
        type="button"
        onClick={() => onSortChange(field)}
        title={headerTooltip}
        aria-label={`${label}, ${sortHint}`}
        className="flex items-center gap-1 w-full text-left uppercase tracking-wider cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        {label}
        {headerTooltip && (
          <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {isActive && (
          <span className="text-amber-400 text-[10px]" aria-hidden="true">
            {sortConfig.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </button>
    </th>
  );
}

/**
 * Difference from the baseline car.
 *
 * The arrow encodes direction and the tone encodes judgement, so the reading
 * survives without colour (colour-blind users, greyscale print). Previously
 * hue was the only signal.
 */
function DiffBadge({ diff, positive }: { diff: string | null; positive?: "higher" | "lower" }) {
  if (!diff) return null;
  if (diff === "same") {
    return (
      <span className="delta delta-same ml-1">
        =<span className="sr-only"> same as baseline</span>
      </span>
    );
  }

  const isPositiveNum = diff.startsWith("+");
  const isGood = positive === "higher" ? isPositiveNum : positive === "lower" ? !isPositiveNum : null;

  const toneClass = isGood === true ? "delta-good" : isGood === false ? "delta-bad" : "delta-same";
  const arrow = isPositiveNum ? "▲" : "▼";
  const judgement = isGood === true ? "better" : isGood === false ? "worse" : "different";

  return (
    <span className={`delta ${toneClass} ml-1`}>
      {/* The arrow carries the sign, so both "+" and "-" are dropped from the
          number — otherwise positives read "▲27" and negatives "▼-27". */}
      <span aria-hidden="true">{arrow}</span>
      {diff.replace(/^[+-]/, "")}
      <span className="sr-only"> {diff} versus baseline, {judgement}</span>
    </span>
  );
}

/**
 * A numeric table cell.
 *
 * Renders a muted em-dash when the reading is absent, so "no data" is
 * visually distinct from a real measurement, and suppresses the delta rather
 * than comparing against nothing.
 */
function NumCell({
  value,
  format = String,
  title,
  diff,
  positive,
}: {
  value: number | undefined;
  format?: (v: number) => string;
  title?: string;
  diff?: string | null;
  positive?: "higher" | "lower";
}) {
  if (!hasValue(value)) {
    return (
      <td className="px-3 py-2 text-sm text-gray-500 tabular-nums" title={title}>
        {EMPTY}
      </td>
    );
  }
  return (
    <td className="px-3 py-2 text-sm text-white tabular-nums whitespace-nowrap" title={title}>
      {format(value)}
      {diff && <DiffBadge diff={diff} positive={positive} />}
    </td>
  );
}

function DetailRow({ label, value, diff, positive, isBaseline }: { label: string; value: string | number | undefined; diff?: string | null; positive?: "higher" | "lower"; isBaseline?: boolean }) {
  const isMissing = value === undefined || value === null || value === "";
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-gray-800/50 last:border-b-0">
      <span className="text-gray-400">{label}</span>
      <span className={`text-right tabular-nums ${isMissing ? "text-gray-500" : "text-white"}`}>
        {isMissing ? EMPTY : value}
        {diff && !isBaseline && <DiffBadge diff={diff} positive={positive} />}
      </span>
    </div>
  );
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
    {/*
      `relative` matters: Tailwind's .sr-only is absolutely positioned, and
      without a positioned ancestor the visually-hidden delta descriptions
      resolve against the viewport. Once the table is scrolled right they land
      past the page edge and give the whole document a horizontal scrollbar.
    */}
    <div className="relative surface-elevated rounded-xl overflow-x-auto overflow-y-auto md:h-full md:min-h-0 max-md:max-h-[70dvh]">
      <table className="min-w-full divide-y divide-gray-800/80">
        <thead className="bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
          <tr>
            {/*
              Action columns. They lead the row because star/checkbox at the
              left edge is the convention for selectable tables — but they are
              kept to two narrow cells so the car's identity is the third
              column, not the sixth. The image and a separate "info" button
              used to sit here too; the image now lives inside the model cell
              and details open from the model name.
            */}
            <th scope="col" className="px-2 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-10 print:hidden">
              <span title="Add to favorites" className="text-amber-600" aria-hidden="true">★</span>
              <span className="sr-only">Favorite</span>
            </th>
            <th scope="col" className="px-2 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-10 print:hidden">
              <span title="Add to compare" aria-hidden="true">⚖</span>
              <span className="sr-only">Compare</span>
            </th>
            {/* Configurable columns */}
            {isVisible("year") && <SortableHeader field="year" label="Year" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("make") && <SortableHeader field="make" label="Make" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("model") && <SortableHeader field="model" label="Model" sortConfig={sortConfig} onSortChange={onSortChange} />}
            <th scope="col" className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap print:hidden">
              Base
            </th>
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
              <th scope="col" className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap" title="Width with 1 mirror extended (passenger side folded)">
                1 Mirror
              </th>
            )}
            {isVisible("bodyWidthInches") && <SortableHeader field="bodyWidthInches" label="Extended" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("heightInches") && <SortableHeader field="heightInches" label="Height" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("groundClearanceInches") && <SortableHeader field="groundClearanceInches" label="Clearance" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("towingCapacityLbs") && <SortableHeader field="towingCapacityLbs" label="Towing" sortConfig={sortConfig} onSortChange={onSortChange} />}
            {isVisible("fuelType") && (
              <th scope="col" className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Fuel
              </th>
            )}
            {isVisible("plugType") && (
              <th scope="col" className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
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
              <th scope="col" className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider max-w-xs">
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
            // A delta is only meaningful against another car, and the baseline
            // row has nothing to compare itself to.
            const showDiff = baselineCar !== null && !isBaseline;

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
                    className="w-4 h-4"
                    title="Add to comparison"
                    aria-label={isInCompare ? `Remove ${car.year} ${car.make} ${car.model} from comparison` : `Add ${car.year} ${car.make} ${car.model} to comparison`}
                  />
                </td>
                {/* Configurable columns */}
                {isVisible("year") && (
                  <td className="px-3 py-2 text-sm text-white tabular-nums">
                    {car.year}
                  </td>
                )}
                {isVisible("make") && (
                  <td className="px-3 py-2 text-sm text-white whitespace-nowrap">
                    {car.make}
                  </td>
                )}
                {isVisible("model") && (
                  <td className="px-3 py-2 text-sm">
                    <button
                      onClick={() => setModalCar(car)}
                      className="flex items-center gap-2.5 text-left group/model"
                      aria-label={`View details for ${car.year} ${car.make} ${car.model}`}
                    >
                      <CarImage car={car} />
                      <span className="min-w-0">
                        <span className="text-white group-hover/model:text-amber-400 transition-colors">{car.model}</span>
                        {car.trim && <span className="text-gray-400 text-xs ml-1">{car.trim}</span>}
                      </span>
                    </button>
                  </td>
                )}
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
                  <td className="px-3 py-2 text-sm text-white tabular-nums whitespace-nowrap">
                    {car.seats}
                    {showDiff && (
                      <DiffBadge diff={calculateDifference(baselineCar!, car, "seats", mirrorBuffer)} positive="higher" />
                    )}
                  </td>
                )}
                {isVisible("doors") && (
                  <td className="px-3 py-2 text-sm text-white tabular-nums">
                    {car.doors}
                  </td>
                )}
                {isVisible("driverLegroomInches") && (
                  <NumCell
                    value={car.driverLegroomInches}
                    format={(v) => `${v}"`}
                    diff={showDiff && hasValue(baselineCar?.driverLegroomInches) ? calculateDifference(baselineCar!, car, "driverLegroomInches", mirrorBuffer) : null}
                    positive="higher"
                  />
                )}
                {isVisible("cargoVolumesCuFt") && (
                  <NumCell
                    value={car.cargoVolumesCuFt}
                    title="Cargo volume in cubic feet"
                    diff={showDiff && hasValue(baselineCar?.cargoVolumesCuFt) ? calculateDifference(baselineCar!, car, "cargoVolumesCuFt", mirrorBuffer) : null}
                    positive="higher"
                  />
                )}
                {isVisible("lengthInches") && (
                  <NumCell
                    value={car.lengthInches}
                    format={(v) => `${v}"`}
                    title="Overall length"
                    diff={showDiff && hasValue(baselineCar?.lengthInches) ? calculateDifference(baselineCar!, car, "lengthInches", mirrorBuffer) : null}
                    positive="lower"
                  />
                )}
                {isVisible("mirrorsFoldedWidthInches") && (
                  <NumCell
                    value={getFoldedWidth(car)}
                    /* The filter and the sort both fall back to an estimate for the 90
                       cars with no measured value, so rendering EMPTY here would leave
                       the table disagreeing with its own search. Show it, marked "~". */
                    format={(v) => (isFoldedWidthEstimated(car) ? `~${v.toFixed(1)}"` : `${v}"`)}
                    title={isFoldedWidthEstimated(car)
                      ? `No measured folded width; estimated as body width + ${FOLDED_MIRROR_FALLBACK_INCHES}"`
                      : "Width with mirrors folded"}
                    diff={showDiff && hasValue(baselineCar?.mirrorsFoldedWidthInches) ? calculateDifference(baselineCar!, car, "mirrorsFoldedWidthInches", mirrorBuffer) : null}
                    positive="lower"
                  />
                )}
                {isVisible("oneMirrorWidthInches") && (() => {
                  const oneMirror = getOneMirrorWidth(car, mirrorBuffer);
                  const baseOneMirror = baselineCar ? getOneMirrorWidth(baselineCar, mirrorBuffer) : null;
                  const delta = baseOneMirror !== null && showDiff ? oneMirror - baseOneMirror : null;
                  // Narrower than the baseline is the good direction here, same
                  // as every other width column.
                  const diffStr = delta === null
                    ? null
                    : Math.abs(delta) < 0.05
                      ? "same"
                      : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`;
                  return (
                    <NumCell
                      value={oneMirror}
                      format={(v) => `${v.toFixed(1)}"`}
                      title="Width with 1 mirror extended (passenger side folded)"
                      diff={diffStr}
                      positive="lower"
                    />
                  );
                })()}
                {isVisible("bodyWidthInches") && (
                  <NumCell
                    value={effectiveWidth}
                    format={(v) => `${v.toFixed(1)}"`}
                    title="Width with mirrors extended"
                    diff={showDiff ? calculateDifference(baselineCar!, car, "bodyWidthInches", mirrorBuffer) : null}
                    positive="lower"
                  />
                )}
                {isVisible("heightInches") && (
                  <NumCell
                    value={car.heightInches}
                    format={(v) => `${v}"`}
                    title="Overall height"
                    diff={showDiff && hasValue(baselineCar?.heightInches) ? calculateDifference(baselineCar!, car, "heightInches", mirrorBuffer) : null}
                    positive="lower"
                  />
                )}
                {isVisible("groundClearanceInches") && (
                  <NumCell
                    value={car.groundClearanceInches}
                    format={(v) => `${v}"`}
                    title="Ground clearance"
                    diff={showDiff && hasValue(baselineCar?.groundClearanceInches) ? calculateDifference(baselineCar!, car, "groundClearanceInches", mirrorBuffer) : null}
                    positive="higher"
                  />
                )}
                {isVisible("towingCapacityLbs") && (
                  <NumCell
                    value={car.towingCapacityLbs}
                    format={(v) => v.toLocaleString()}
                    title="Towing capacity in pounds"
                    diff={showDiff && hasValue(baselineCar?.towingCapacityLbs) ? calculateDifference(baselineCar!, car, "towingCapacityLbs", mirrorBuffer) : null}
                    positive="higher"
                  />
                )}
                {isVisible("fuelType") && (
                  <td className="px-3 py-2 text-sm">
                    <FuelTypeBadge fuelType={car.fuelType} />
                  </td>
                )}
                {isVisible("plugType") && (
                  <td className="px-3 py-2 text-sm whitespace-nowrap">
                    <span className={car.plugType === "none" ? "text-gray-500" : "text-gray-300"}>
                      {plugTypeLabel(car.plugType)}
                    </span>
                  </td>
                )}
                {isVisible("mpgCombined") && (() => {
                  const mpg = formatMpg(car);
                  return (
                    <td className="px-3 py-2 text-sm tabular-nums whitespace-nowrap">
                      <span className={mpg === EMPTY ? "text-gray-500" : "text-white"}>{mpg}</span>
                      {showDiff && hasValue(car.mpgCombined) && hasValue(baselineCar?.mpgCombined) && (
                        <DiffBadge diff={calculateDifference(baselineCar!, car, "mpgCombined", mirrorBuffer)} positive="higher" />
                      )}
                    </td>
                  );
                })()}
                {isVisible("electricRangeMiles") && (
                  <NumCell value={car.electricRangeMiles} format={(v) => `${v} mi`} />
                )}
                {isVisible("zeroToSixtySeconds") && (
                  <NumCell value={car.zeroToSixtySeconds} format={(v) => `${v}s`} />
                )}
                {isVisible("horsepower") && (
                  <NumCell value={car.horsepower} format={(v) => `${v} hp`} />
                )}
                {/* Pricing & Ownership */}
                {isVisible("msrp") && (
                  <NumCell
                    value={car.msrp}
                    format={(v) => formatCurrency(v)}
                    diff={showDiff && hasValue(baselineCar?.msrp) ? calculateDifference(baselineCar!, car, "msrp", mirrorBuffer) : null}
                    positive="lower"
                  />
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
                  <NumCell value={car.fiveYearResalePercent} format={(v) => `${v}%`} />
                )}
                {isVisible("reliabilityRating") && (
                  <td className="px-3 py-2 text-sm">
                    <ReliabilityBadge rating={car.reliabilityRating} />
                  </td>
                )}
                {isVisible("insuranceCostAnnual") && (
                  <NumCell value={car.insuranceCostAnnual} format={(v) => formatCurrency(v)} />
                )}
                {isVisible("maintenanceCostAnnual") && (
                  <NumCell value={car.maintenanceCostAnnual} format={(v) => formatCurrency(v)} />
                )}
                {isVisible("notes") && (
                  <td className={`px-3 py-2 text-sm max-w-xs truncate ${car.notes ? "text-gray-400" : "text-gray-500"}`} title={car.notes}>
                    {car.notes ?? EMPTY}
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

/**
 * Fuel type.
 *
 * Category is carried by the label; tone is reserved for the one thing a
 * shopper judges here — whether the car plugs in. Gas and diesel are neutral,
 * electrified powertrains get the brand accent.
 */
const FuelTypeBadge = React.memo(function FuelTypeBadge({ fuelType }: { fuelType: FuelType }) {
  // Hydrogen sits with the electrified powertrains rather than with gas: it is a
  // zero-tailpipe-emission electric drivetrain, and grouping it with diesel would
  // read as a judgement the badge is not making.
  const tone = fuelType === "electric"
    ? "badge-accent"
    : fuelType === "hybrid" || fuelType === "plug-in-hybrid" || fuelType === "hydrogen"
      ? "badge-good"
      : "badge-neutral";

  return (
    <span className={`badge ${tone}`} title={fuelTypeLabel(fuelType)}>
      {fuelTypeLabel(fuelType, true)}
    </span>
  );
});

/**
 * Body type is a category, not a judgement — it gets one neutral tone. It
 * previously had a distinct hue per type, which put eight unrelated colours
 * on screen and made the table read as a legend rather than data.
 */
const BodyTypeBadge = React.memo(function BodyTypeBadge({ bodyType }: { bodyType: BodyType }) {
  return (
    <span className="badge badge-neutral" title={bodyTypeLabel(bodyType)}>
      {bodyTypeLabel(bodyType, true)}
    </span>
  );
});

const SafetyBadge = React.memo(function SafetyBadge({ rating }: { rating?: SafetyRating }) {
  if (!rating || rating === "Not Rated") {
    return <span className="text-gray-500 text-xs">{EMPTY}</span>;
  }

  const colors: Record<string, string> = {
    "TSP+": "badge-good",
    "TSP": "badge-good",
    "Good": "badge-neutral",
    "Acceptable": "badge-caution",
    "Pending": "badge-neutral",
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
      className={`badge ${colors[rating] ?? "badge-neutral"}`}
      title={titles[rating]}
    >
      {rating}
    </span>
  );
});

const ReviewScoreBadge = React.memo(function ReviewScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) {
    return <span className="text-gray-500 text-xs">{EMPTY}</span>;
  }

  // Four semantic steps rather than a seven-stop rainbow: the number itself
  // already carries the fine gradation.
  const getHeatmapColor = (s: number): string => {
    if (s >= 80) return "badge-good";
    if (s >= 60) return "badge-neutral";
    if (s >= 45) return "badge-caution";
    return "badge-bad";
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
      className={`badge font-mono ${getHeatmapColor(score)}`}
      title={`${getScoreLabel(score)} - Aggregated expert review score from MotorMashup`}
    >
      {score}
    </span>
  );
});

const AdasBadge = React.memo(function AdasBadge({ level, name }: { level?: AutonomousLevel; name?: string }) {
  if (!level || level === "none") {
    return <span className="text-gray-500 text-xs">{EMPTY}</span>;
  }

  const colors: Record<AutonomousLevel, string> = {
    "none": "badge-neutral",
    "basic": "badge-neutral",
    "enhanced": "badge-neutral",
    "hands-free": "badge-accent",
    "full-self-driving": "badge-accent",
  };

  return (
    <span
      className={`badge ${colors[level]}`}
      title={name ?? adasLevelLabel(level)}
    >
      {adasLevelLabel(level, true)}
    </span>
  );
});

const LeaseRatingBadge = React.memo(function LeaseRatingBadge({ rating }: { rating?: LeaseRating }) {
  if (!rating) {
    return <span className="text-gray-500 text-xs">{EMPTY}</span>;
  }

  const colors: Record<LeaseRating, string> = {
    "excellent": "badge-good",
    "good": "badge-good",
    "fair": "badge-caution",
    "poor": "badge-bad",
  };

  const titles: Record<LeaseRating, string> = {
    "excellent": "Excellent lease deals typically available",
    "good": "Good lease deals often available",
    "fair": "Fair lease deals - shop around",
    "poor": "Poor lease deals - consider buying",
  };

  return (
    <span
      className={`badge ${colors[rating]}`}
      title={titles[rating]}
    >
      {leaseRatingLabel(rating)}
    </span>
  );
});

const DepreciationBadge = React.memo(function DepreciationBadge({ category }: { category?: DepreciationCategory }) {
  if (!category) {
    return <span className="text-gray-500 text-xs">{EMPTY}</span>;
  }

  const colors: Record<DepreciationCategory, string> = {
    "low": "badge-good",
    "medium": "badge-neutral",
    "high": "badge-caution",
    "very-high": "badge-bad",
  };

  const titles: Record<DepreciationCategory, string> = {
    "low": "Low depreciation - holds value well",
    "medium": "Average depreciation",
    "high": "High depreciation - loses value faster",
    "very-high": "Very high depreciation - loses value quickly",
  };

  return (
    <span
      className={`badge ${colors[category]}`}
      title={titles[category]}
    >
      {depreciationLabel(category, true)}
    </span>
  );
});

const ReliabilityBadge = React.memo(function ReliabilityBadge({ rating }: { rating?: ReliabilityRating }) {
  if (!rating) {
    return <span className="text-gray-500 text-xs">{EMPTY}</span>;
  }

  const colors: Record<ReliabilityRating, string> = {
    "excellent": "badge-good",
    "good": "badge-good",
    "average": "badge-neutral",
    "below-average": "badge-caution",
    "poor": "badge-bad",
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
      className={`badge ${colors[rating]}`}
      title={titles[rating]}
    >
      {reliabilityLabel(rating, true)}
    </span>
  );
});

const FeatureCheck = React.memo(function FeatureCheck({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${enabled ? "text-emerald-400" : "text-gray-500"}`}>
      <span className="text-xs" aria-hidden="true">{enabled ? "✓" : "✗"}</span>
      <span>{label}</span>
      <span className="sr-only">{enabled ? "included" : "not included"}</span>
    </div>
  );
});

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
        {/*
          Sticky so the title and the close control stay reachable — this
          modal is several screens tall and both used to scroll away.
        */}
        <div className="sticky -top-6 z-20 -mx-6 -mt-6 mb-4 px-6 pt-6 pb-4 bg-gray-900/95 backdrop-blur-sm rounded-t-2xl border-b border-gray-800/60">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h3 id="image-modal-title" className="text-2xl font-bold text-white">
                {car.year} {car.make} {car.model}
              </h3>
              {car.trim && <p className="text-gray-400">{car.trim}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                <BodyTypeBadge bodyType={car.bodyType} />
                <FuelTypeBadge fuelType={car.fuelType} />
                {/* Only render when there is a rating — the badge's own empty
                    state is a dash, which read as a stray character here. */}
                {car.safetyRating && car.safetyRating !== "Not Rated" && (
                  <SafetyBadge rating={car.safetyRating} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* The garage-fit check is what this app is for; it was buried in
                  the bottom corner of the dimensions card. */}
              <button
                onClick={() => setShowGarageFit(true)}
                className="btn-accent px-3.5 py-2 rounded-lg text-sm whitespace-nowrap"
              >
                Check Garage Fit
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-3xl leading-none p-2"
                aria-label="Close details modal"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Image Gallery. Suppressed entirely for makes with no render
            library — an angle picker over a stand-in vehicle is worse than
            no gallery at all. */}
        <div className="mb-6">
          {/* Main Image */}
          {!hasVehicleImagery(car) ? (
            <CarImagePlaceholder className="w-full h-56" label={bodyTypeLabel(car.bodyType)} />
          ) : imageError ? (
            <CarImagePlaceholder className="w-full h-64 mb-3" label={bodyTypeLabel(car.bodyType)} />
          ) : (
            /* Capped: at full width the render filled the entire viewport and
               pushed every specification below the fold. */
            <img
              src={imageUrl}
              alt={`${car.year} ${car.make} ${car.model} - ${CAR_ANGLES.find(a => a.id === selectedAngle)?.label}`}
              className="w-full max-h-[38dvh] object-contain rounded-lg mb-3"
              onError={() => setImageError(true)}
            />
          )}
          {/* Thumbnail Strip */}
          <div className={`flex gap-2 justify-center ${hasVehicleImagery(car) ? "" : "hidden"}`}>
            {CAR_ANGLES.map((angle) => (
              <button
                key={angle.id}
                onClick={() => setSelectedAngle(angle.id)}
                className={`relative rounded overflow-hidden border-2 transition-all ${
                  selectedAngle === angle.id
                    ? "border-amber-500 scale-105"
                    : "border-gray-700/50 hover:border-gray-500"
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
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50 pb-2 uppercase tracking-wider">Pricing</h4>
            <DetailRow
              label="MSRP"
              value={optional(car.msrp, (v) => formatCurrency(v as number))}
              diff={baselineCar ? calculateDifference(baselineCar, car, "msrp", mirrorBuffer) : null}
              positive="lower"
              isBaseline={isBaseline}
            />
            <DetailRow
              label="Used Price"
              value={hasValue(car.usedPriceLow) && hasValue(car.usedPriceHigh)
                ? `${formatCurrency(car.usedPriceLow)} – ${formatCurrency(car.usedPriceHigh)}`
                : undefined}
            />
            <DetailRow label="5-Year Resale" value={optional(car.fiveYearResalePercent, (v) => `${v}%`)} />
            <DetailRow label="Depreciation" value={car.depreciationCategory ? depreciationLabel(car.depreciationCategory) : undefined} />
            <DetailRow label="Insurance / yr" value={optional(car.insuranceCostAnnual, (v) => formatCurrency(v as number))} />
            <DetailRow label="Maintenance / yr" value={optional(car.maintenanceCostAnnual, (v) => formatCurrency(v as number))} />
            <DetailRow label="Reliability" value={car.reliabilityRating ? reliabilityLabel(car.reliabilityRating) : undefined} />
          </div>

          {/* Dimensions */}
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50 pb-2 uppercase tracking-wider">Dimensions</h4>
            <DetailRow
              label="Width (Mirrors Folded)"
              value={car.mirrorsFoldedWidthInches ? `${car.mirrorsFoldedWidthInches}"` : undefined}
              diff={baselineCar && baselineCar.mirrorsFoldedWidthInches && car.mirrorsFoldedWidthInches ? calculateDifference(baselineCar, car, "mirrorsFoldedWidthInches", mirrorBuffer) : null}
              positive="lower"
              isBaseline={isBaseline}
            />
            <DetailRow
              label="Width (Mirrors Extended)"
              value={`${effectiveWidth.toFixed(1)}"`}
              diff={baselineCar ? calculateDifference(baselineCar, car, "bodyWidthInches", mirrorBuffer) : null}
              positive="lower"
              isBaseline={isBaseline}
            />
            <DetailRow label="Body Width" value={car.bodyWidthInches ? `${car.bodyWidthInches}"` : undefined} />
            <DetailRow label="Length" value={car.lengthInches ? `${car.lengthInches}"` : undefined} />
            <DetailRow
              label="Height"
              value={car.heightInches ? `${car.heightInches}"` : undefined}
              diff={baselineCar && car.heightInches && baselineCar.heightInches ? calculateDifference(baselineCar, car, "heightInches", mirrorBuffer) : null}
              positive="lower"
              isBaseline={isBaseline}
            />
            <DetailRow
              label="Ground Clearance"
              value={car.groundClearanceInches ? `${car.groundClearanceInches}"` : undefined}
              diff={baselineCar && car.groundClearanceInches && baselineCar.groundClearanceInches ? calculateDifference(baselineCar, car, "groundClearanceInches", mirrorBuffer) : null}
              positive="higher"
              isBaseline={isBaseline}
            />
            <DetailRow label="Towing Capacity" value={optional(car.towingCapacityLbs, (v) => `${(v as number).toLocaleString()} lbs`)} />
          </div>

          {/* Capacity */}
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50 pb-2 uppercase tracking-wider">Capacity</h4>
            <DetailRow
              label="Seats"
              value={car.seats}
              diff={baselineCar ? calculateDifference(baselineCar, car, "seats", mirrorBuffer) : null}
              positive="higher"
              isBaseline={isBaseline}
            />
            <DetailRow label="Doors" value={car.doors} />
            <DetailRow
              label="Driver Legroom"
              value={optional(car.driverLegroomInches, (v) => `${v}"`)}
              diff={baselineCar ? calculateDifference(baselineCar, car, "driverLegroomInches", mirrorBuffer) : null}
              positive="higher"
              isBaseline={isBaseline}
            />
            <DetailRow label="Cargo Volume" value={optional(car.cargoVolumesCuFt, (v) => `${v} cu ft`)} />
          </div>

          {/* Efficiency */}
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50 pb-2 uppercase tracking-wider">Efficiency</h4>
            {car.fuelType !== "electric" && (
              <>
                <DetailRow label="City MPG" value={car.mpgCity} />
                <DetailRow label="Highway MPG" value={car.mpgHighway} />
                <DetailRow
                  label="Combined MPG"
                  value={car.mpgCombined}
                  diff={baselineCar ? calculateDifference(baselineCar, car, "mpgCombined", mirrorBuffer) : null}
                  positive="higher"
                  isBaseline={isBaseline}
                />
              </>
            )}
            {/*
              `{car.mpge && ...}` renders a literal `0` when the field is zero
              rather than undefined — that bug leaked a stray "0" into this
              grid. hasValue() treats 0 as "no reading" for these fields.
            */}
            {hasValue(car.mpge) && <DetailRow label="MPGe" value={car.mpge} />}
            {hasValue(car.electricRangeMiles) && (
              <DetailRow
                label="Electric Range"
                value={`${car.electricRangeMiles} mi`}
                diff={baselineCar ? calculateDifference(baselineCar, car, "electricRangeMiles", mirrorBuffer) : null}
                positive="higher"
                isBaseline={isBaseline}
              />
            )}
          </div>

          {/* Powertrain */}
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50 pb-2 uppercase tracking-wider">Powertrain</h4>
            <DetailRow label="Fuel Type" value={fuelTypeLabel(car.fuelType)} />
            <DetailRow label="Plug Type" value={car.plugType === "none" ? undefined : plugTypeLabel(car.plugType)} />
            <DetailRow label="Horsepower" value={optional(car.horsepower, (v) => `${v} hp`)} />
            <DetailRow label="0-60 mph" value={optional(car.zeroToSixtySeconds, (v) => `${v}s`)} />
          </div>

          {/* Safety */}
          <div className="surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50 pb-2 uppercase tracking-wider">Safety</h4>
            <DetailRow label="IIHS Rating" value={car.safetyRating ?? "Not Rated"} />
            <DetailRow label="ADAS Level" value={adasLevelLabel(car.autonomousLevel)} />
            {car.safetyRating === "TSP+" && (
              <p className="text-xs text-emerald-400 mt-2">Top Safety Pick+ - Highest IIHS award</p>
            )}
            {car.safetyRating === "TSP" && (
              <p className="text-xs text-emerald-400 mt-2">Top Safety Pick - Excellent safety rating</p>
            )}
          </div>
        </div>

        {/* Driver Assistance */}
        {car.autonomousLevel && car.autonomousLevel !== "none" && (
          <div className="mt-6 surface-inset rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50 pb-2 uppercase tracking-wider">Driver Assistance</h4>
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
            <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50 pb-2 uppercase tracking-wider">Features & Notes</h4>
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
          <h4 className="text-sm font-semibold text-gray-200 mb-3 border-b border-gray-800/50 pb-2 uppercase tracking-wider">Search This Vehicle</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SearchLink
              name="Cars.com"
              url={`https://www.cars.com/shopping/results/?keyword=${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}`}
            />
            <SearchLink
              name="AutoTrader"
              url={`https://www.autotrader.com/cars-for-sale/all-cars/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}?startYear=${car.year}&endYear=${car.year}`}
            />
            <SearchLink
              name="CarGurus"
              url={`https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?zip=10001&sourceContext=carGurusHomePageModel&newSearchFromOverviewPage=true&inventorySearchWidgetType=AUTO&entitySelectingHelper.selectedEntity=${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}`}
            />
            <SearchLink
              name="Edmunds"
              url={`https://www.edmunds.com/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}/${car.year}/`}
            />
            <SearchLink
              name="KBB"
              url={`https://www.kbb.com/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}/${car.year}/`}
            />
            <SearchLink
              name="TrueCar"
              url={`https://www.truecar.com/used-cars-for-sale/listings/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}/year-${car.year}/`}
            />
            <SearchLink
              name="CarMax"
              url={`https://www.carmax.com/cars/${car.make.toLowerCase()}/${car.model.toLowerCase().replace(/\s+/g, '-')}?year=${car.year}`}
            />
            <SearchLink
              name="Google"
              url={`https://www.google.com/search?q=${encodeURIComponent(`${car.year} ${car.make} ${car.model} for sale`)}`}
            />
            <SearchLink
              name="Images"
              url={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${car.year} ${car.make} ${car.model}`)}`}
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

// Memoized car image component to prevent unnecessary re-renders.
// Purely presentational — the surrounding cell owns the click target, so the
// thumbnail is not separately interactive (it used to be a second, nested
// click handler beside the "info" button that did the same thing).
const CarImage = React.memo(function CarImage({ car }: { car: Car }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Memoize the image URL to prevent recalculation
  const imageUrl = useMemo(() => getCarImageUrl(car), [car]);

  // Give up on a stalled image after 5s. Previously this only hid the spinner, leaving
  // a blank cell that looked identical to "still loading" — fall through to the same
  // body-type placeholder the onError path uses, so the cell always says something.
  React.useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(() => {
      if (!imgRef.current?.complete) {
        setHasError(true);
      }
      setIsLoading(false);
    }, 5000);

    // Also check if image is already loaded (cached)
    if (imgRef.current?.complete) {
      setIsLoading(false);
    }

    return () => clearTimeout(timer);
  }, [imageUrl]);

  if (hasError || !hasVehicleImagery(car)) {
    return <CarImagePlaceholder className="w-20 h-12 shrink-0" label={bodyTypeLabel(car.bodyType)} />;
  }

  return (
    <span className="w-20 h-12 shrink-0 relative block">
      {isLoading && <span className="absolute inset-0 skeleton rounded-lg block" />}
      <img
        ref={imgRef}
        src={imageUrl}
        alt=""
        className={`w-20 h-12 object-cover rounded-lg transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </span>
  );
});

function SearchLink({ name, url }: { name: string; url: string }) {
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
