"use client";

import { useState, useEffect, useRef } from "react";
import { Car, SafetyRating } from "@/types/car";
import { formatCurrency, getEffectiveWidth, getCarImageUrl, hasVehicleImagery } from "@/lib/carUtils";
import { EMPTY, adasLevelLabel, fuelTypeLabel, plugTypeLabel, reliabilityLabel } from "@/lib/labels";
import CarImagePlaceholder from "./CarImagePlaceholder";
import { useFocusTrap } from "@/lib/useFocusTrap";

interface CompareModalProps {
  cars: Car[];
  onClose: () => void;
  onRemoveCar: (carId: string) => void;
  mirrorBuffer: number;
}

function CompareCarImage({ car }: { car: Car }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !hasVehicleImagery(car)) {
    return <CarImagePlaceholder className="w-full h-20 mb-2" />;
  }

  return (
    <img
      src={getCarImageUrl(car, 300)}
      alt={`${car.year} ${car.make} ${car.model}`}
      className="w-full h-20 object-contain rounded-xl mb-2"
      onError={() => setHasError(true)}
    />
  );
}

/** True when at least one car has a real reading for this row. */
function hasAnyValue(values: (string | number | undefined)[]): boolean {
  return values.some(v => v !== undefined && v !== null && v !== "" && v !== 0 && v !== EMPTY);
}

function CompareRow({ label, values, format, highlight }: {
  label: string;
  values: (string | number | undefined)[];
  format?: (v: string | number | undefined) => string;
  highlight?: "higher" | "lower";
}) {
  // A row where nobody has data is forty pixels of dashes. Drop it.
  if (!hasAnyValue(values)) return null;

  const formatted = values.map(v => format ? format(v) : (v ?? EMPTY));

  // Which cells win this row.
  //
  // Only real readings compete: the previous version coerced missing values to
  // 0, which let a car with NO towing rating take the "best value" star. Ties
  // all win rather than the first one silently taking it, and if every car
  // ties there is no winner to point at.
  const winners = new Set<number>();
  if (highlight) {
    const numericValues = values.map(v => {
      const n = typeof v === "number" ? v : parseFloat(String(v));
      return Number.isFinite(n) && n > 0 ? n : null;
    });
    const candidates = numericValues.filter((n): n is number => n !== null);
    if (candidates.length > 1) {
      const target = highlight === "higher" ? Math.max(...candidates) : Math.min(...candidates);
      if (candidates.some(n => n !== target)) {
        numericValues.forEach((n, i) => {
          if (n === target) winners.add(i);
        });
      }
    }
  }

  return (
    <tr className="border-b border-gray-800/50">
      <th scope="row" className="px-4 py-2 text-left text-gray-400 font-medium">{label}</th>
      {formatted.map((val, i) => {
        const isMissing = val === EMPTY;
        const isWinner = winners.has(i);
        return (
          <td
            key={i}
            className={`px-4 py-2 text-center tabular-nums ${
              isWinner ? "text-emerald-400 font-semibold" : isMissing ? "text-gray-500" : "text-gray-200"
            }`}
          >
            {val}
            {isWinner && (
              <span className="text-emerald-400 ml-1" title="Best value" aria-hidden="true"> ★</span>
            )}
            {isWinner && <span className="sr-only"> (best value)</span>}
          </td>
        );
      })}
    </tr>
  );
}

/** ✓ / ✗ rather than ✓ / dash — an absent feature is a No, not missing data. */
function CompareBoolRow({ label, cars, get }: {
  label: string;
  cars: Car[];
  get: (car: Car) => boolean | undefined;
}) {
  return (
    <tr className="border-b border-gray-800/50">
      <th scope="row" className="px-4 py-2 text-left text-gray-400 font-medium">{label}</th>
      {cars.map((car) => {
        const on = Boolean(get(car));
        return (
          <td key={car.id} className="px-4 py-2 text-center">
            <span className={on ? "text-emerald-400" : "text-gray-500"} aria-hidden="true">{on ? "✓" : "✗"}</span>
            <span className="sr-only">{on ? "Yes" : "No"}</span>
          </td>
        );
      })}
    </tr>
  );
}

function SafetyBadge({ rating }: { rating?: SafetyRating }) {
  if (!rating || rating === "Not Rated") {
    return <span className="text-gray-500">{EMPTY}</span>;
  }
  const colors: Record<string, string> = {
    "TSP+": "badge-good",
    "TSP": "badge-good",
    "Good": "badge-neutral",
    "Acceptable": "badge-caution",
  };
  return (
    <span className={`badge ${colors[rating] ?? "badge-neutral"}`}>
      {rating}
    </span>
  );
}

export default function CompareModal({ cars, onClose, onRemoveCar, mirrorBuffer }: CompareModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap();

  // Lock body scroll and reset modal scroll position when opened
  useEffect(() => {
    // Save current scroll position and lock body
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    // Reset modal scroll to top
    if (overlayRef.current) {
      overlayRef.current.scrollTop = 0;
    }

    // Handle ESC key to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // Restore body scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (cars.length === 0) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed z-50 bg-black/85 backdrop-blur-sm"
      style={{ top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      {/*
        A bounded flex column, not a tall block inside a scrolling overlay.
        Only the middle scrolls, which is what lets the table's own header row
        stay pinned: `position: sticky` resolves against the nearest scrolling
        ancestor, so the header can only stick if the element that scrolls is
        the one wrapping the table.
      */}
      <div
        ref={focusTrapRef}
        className="surface-elevated rounded-2xl max-w-6xl modal-content flex flex-col max-h-[calc(100dvh-40px)]"
        style={{ margin: '20px auto', width: 'calc(100% - 32px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 px-6 pt-6 pb-3 border-b border-gray-800/60">
          <div className="flex justify-between items-center gap-4">
            <div>
              <h2 id="compare-modal-title" className="text-2xl font-bold text-white">Compare Vehicles</h2>
              {/* The key to reading the table, placed before the table rather
                  than after all of it. */}
              <p className="text-gray-400 text-xs mt-1">
                <span className="text-emerald-400">Green ★</span> marks the best value in each row.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl leading-none p-2"
              aria-label="Close comparison modal"
            >
              ×
            </button>
          </div>
        </div>

        <div className="relative overflow-auto flex-1 min-h-0 px-6">
          <table className="w-full">
            {/* Car Images & Names Header — sticky so the column you are
                reading always has a name attached. */}
            <thead className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm">
              <tr className="border-b border-gray-600">
                <th scope="col" className="px-4 py-2 text-left text-gray-400 w-40"><span className="sr-only">Specification</span></th>
                {cars.map((car) => (
                  <th key={car.id} scope="col" className="px-4 py-4 text-center min-w-[200px]">
                    <div className="relative">
                      <button
                        onClick={() => onRemoveCar(car.id)}
                        className="absolute top-0 right-0 w-6 h-6 rounded-full text-gray-500 hover:text-white hover:bg-white/10 text-lg leading-none transition-colors"
                        title="Remove from comparison"
                        aria-label={`Remove ${car.year} ${car.make} ${car.model} from comparison`}
                      >
                        ×
                      </button>
                      <CompareCarImage car={car} />
                      <div className="text-white font-semibold">
                        {car.year} {car.make}
                      </div>
                      <div className="text-gray-300">{car.model}</div>
                      {car.trim && <div className="text-gray-500 text-sm">{car.trim}</div>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Pricing Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Pricing
                </td>
              </tr>
              <CompareRow
                label="MSRP"
                values={cars.map(c => c.msrp)}
                format={(v) => v ? formatCurrency(v as number) : EMPTY}
                highlight="lower"
              />

              {/* Safety Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Safety
                </td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <th scope="row" className="px-4 py-2 text-left text-gray-400 font-medium">IIHS Rating</th>
                {cars.map((car) => (
                  <td key={car.id} className="px-4 py-2 text-center">
                    <SafetyBadge rating={car.safetyRating} />
                  </td>
                ))}
              </tr>

              {/* Dimensions Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Dimensions
                </td>
              </tr>
              <CompareRow
                label="Width (Mirrors Folded)"
                values={cars.map(c => c.mirrorsFoldedWidthInches)}
                format={(v) => v ? `${(v as number).toFixed(1)}"` : EMPTY}
                highlight="lower"
              />
              <CompareRow
                label="Width (Mirrors Extended)"
                values={cars.map(c => getEffectiveWidth(c, mirrorBuffer))}
                format={(v) => v ? `${(v as number).toFixed(1)}"` : EMPTY}
                highlight="lower"
              />
              <CompareRow
                label="Length"
                values={cars.map(c => c.lengthInches)}
                format={(v) => v ? `${v}"` : EMPTY}
              />
              <CompareRow
                label="Height"
                values={cars.map(c => c.heightInches)}
                format={(v) => v ? `${v}"` : EMPTY}
              />

              {/* Capacity Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Capacity
                </td>
              </tr>
              <CompareRow
                label="Seats"
                values={cars.map(c => c.seats)}
                highlight="higher"
              />
              <CompareRow
                label="Driver Legroom"
                values={cars.map(c => c.driverLegroomInches)}
                format={(v) => v ? `${v}"` : EMPTY}
                highlight="higher"
              />
              <CompareRow
                label="Cargo Volume"
                values={cars.map(c => c.cargoVolumesCuFt)}
                format={(v) => v ? `${v} cu ft` : EMPTY}
                highlight="higher"
              />

              {/* Efficiency Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Efficiency
                </td>
              </tr>
              <CompareRow
                label="Combined MPG"
                values={cars.map(c => c.mpgCombined)}
                highlight="higher"
              />
              <CompareRow
                label="MPGe"
                values={cars.map(c => c.mpge)}
                highlight="higher"
              />
              <CompareRow
                label="EV Range"
                values={cars.map(c => c.electricRangeMiles)}
                format={(v) => v ? `${v} mi` : EMPTY}
                highlight="higher"
              />

              {/* Powertrain Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Powertrain
                </td>
              </tr>
              <CompareRow
                label="Fuel Type"
                values={cars.map(c => fuelTypeLabel(c.fuelType))}
              />
              <CompareRow
                label="Plug Type"
                values={cars.map(c => c.plugType === "none" ? undefined : plugTypeLabel(c.plugType))}
              />
              <CompareRow
                label="Horsepower"
                values={cars.map(c => c.horsepower)}
                format={(v) => v ? `${v} hp` : EMPTY}
                highlight="higher"
              />
              <CompareRow
                label="0-60 mph"
                values={cars.map(c => c.zeroToSixtySeconds)}
                format={(v) => v ? `${v}s` : EMPTY}
                highlight="lower"
              />

              {/* Driver Assistance Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Driver Assistance
                </td>
              </tr>
              <CompareRow
                label="ADAS Level"
                values={cars.map(c => c.autonomousLevel ? adasLevelLabel(c.autonomousLevel) : undefined)}
              />
              <CompareBoolRow
                label="Hands-Free Highway"
                cars={cars}
                get={(car) => car.adasFeatures?.handsFreeHighway}
              />
              <CompareBoolRow
                label="Auto-Folding Mirrors"
                cars={cars}
                get={(car) => car.adasFeatures?.autoFoldingMirrors}
              />

              {/* Ownership Costs Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Ownership
                </td>
              </tr>
              <CompareRow
                label="Reliability"
                values={cars.map(c => c.reliabilityRating ? reliabilityLabel(c.reliabilityRating) : undefined)}
              />
              <CompareRow
                label="Towing Capacity"
                values={cars.map(c => c.towingCapacityLbs)}
                format={(v) => v ? `${(v as number).toLocaleString()} lbs` : EMPTY}
                highlight="higher"
              />
              <CompareRow
                label="Ground Clearance"
                values={cars.map(c => c.groundClearanceInches)}
                format={(v) => v ? `${v}"` : EMPTY}
                highlight="higher"
              />
            </tbody>
          </table>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-800/60 text-center text-gray-500 text-xs">
          Rows where none of these vehicles has data are hidden.
        </div>
      </div>
    </div>
  );
}
