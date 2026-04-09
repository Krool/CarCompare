"use client";

import { useState, useEffect, useRef } from "react";
import { Car, SafetyRating } from "@/types/car";
import { formatCurrency, getEffectiveWidth, getCarImageUrl } from "@/lib/carUtils";
import { useFocusTrap } from "@/lib/useFocusTrap";

interface CompareModalProps {
  cars: Car[];
  onClose: () => void;
  onRemoveCar: (carId: string) => void;
  mirrorBuffer: number;
}

function CompareCarImage({ car }: { car: Car }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-32 bg-gray-800/50 border border-gray-700/30 rounded-xl mb-2 flex items-center justify-center text-gray-600 text-2xl">
        {car.bodyType.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={getCarImageUrl(car, 300)}
      alt={`${car.year} ${car.make} ${car.model}`}
      className="w-full h-32 object-contain rounded-xl mb-2"
      onError={() => setHasError(true)}
    />
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

  const CompareRow = ({ label, values, format, highlight }: {
    label: string;
    values: (string | number | undefined)[];
    format?: (v: string | number | undefined) => string;
    highlight?: "higher" | "lower";
  }) => {
    const formatted = values.map(v => format ? format(v) : (v ?? "-"));

    // Find best value for highlighting
    let bestIndex = -1;
    if (highlight && values.some(v => v !== undefined)) {
      const numericValues = values.map(v => typeof v === "number" ? v : parseFloat(String(v)) || 0);
      if (highlight === "higher") {
        bestIndex = numericValues.indexOf(Math.max(...numericValues));
      } else {
        const validValues = numericValues.filter(v => v > 0);
        if (validValues.length > 0) {
          const minVal = Math.min(...validValues);
          bestIndex = numericValues.indexOf(minVal);
        }
      }
    }

    return (
      <tr className="border-b border-gray-800/50">
        <td className="px-4 py-2 text-gray-400 font-medium">{label}</td>
        {formatted.map((val, i) => (
          <td
            key={i}
            className={`px-4 py-2 text-center ${
              bestIndex === i ? "text-emerald-400 font-semibold" : "text-gray-200"
            }`}
          >
            {val}
          </td>
        ))}
      </tr>
    );
  };

  const SafetyBadge = ({ rating }: { rating?: SafetyRating }) => {
    if (!rating || rating === "Not Rated") {
      return <span className="text-gray-600">-</span>;
    }
    const colors: Record<string, string> = {
      "TSP+": "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
      "TSP": "bg-emerald-900/25 text-emerald-400 border-emerald-800/30",
      "Good": "bg-sky-900/25 text-sky-300 border-sky-800/30",
      "Acceptable": "bg-amber-900/25 text-amber-300 border-amber-800/30",
    };
    return (
      <span className={`badge border ${colors[rating] ?? "bg-gray-700/30 border-gray-600/30"}`}>
        {rating}
      </span>
    );
  };

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
      <div
        ref={focusTrapRef}
        className="surface-elevated rounded-2xl max-w-6xl p-6 modal-content"
        style={{ margin: '20px auto', width: 'calc(100% - 32px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="compare-modal-title" className="text-2xl font-bold text-white">Compare Vehicles</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none p-2"
            aria-label="Close comparison modal"
          >
            ×
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Car Images & Names Header */}
            <thead>
              <tr className="border-b border-gray-600">
                <th className="px-4 py-2 text-left text-gray-400 w-40"></th>
                {cars.map((car) => (
                  <th key={car.id} className="px-4 py-4 text-center min-w-[200px]">
                    <div className="relative">
                      <button
                        onClick={() => onRemoveCar(car.id)}
                        className="absolute -top-2 -right-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-full w-6 h-6 text-sm transition-colors"
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
                format={(v) => v ? formatCurrency(v as number) : "-"}
                highlight="lower"
              />

              {/* Safety Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Safety
                </td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="px-4 py-2 text-gray-400 font-medium">IIHS Rating</td>
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
                format={(v) => v ? `${(v as number).toFixed(1)}"` : "-"}
                highlight="lower"
              />
              <CompareRow
                label="Width (Mirrors Extended)"
                values={cars.map(c => getEffectiveWidth(c, mirrorBuffer))}
                format={(v) => v ? `${(v as number).toFixed(1)}"` : "-"}
                highlight="lower"
              />
              <CompareRow
                label="Length"
                values={cars.map(c => c.lengthInches)}
                format={(v) => v ? `${v}"` : "-"}
              />
              <CompareRow
                label="Height"
                values={cars.map(c => c.heightInches)}
                format={(v) => v ? `${v}"` : "-"}
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
                format={(v) => v ? `${v}"` : "-"}
                highlight="higher"
              />
              <CompareRow
                label="Cargo Volume"
                values={cars.map(c => c.cargoVolumesCuFt)}
                format={(v) => v ? `${v} cu ft` : "-"}
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
                format={(v) => v ? `${v} mi` : "-"}
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
                values={cars.map(c => c.fuelType)}
              />
              <CompareRow
                label="Plug Type"
                values={cars.map(c => c.plugType === "none" ? "-" : c.plugType)}
              />
              <CompareRow
                label="Horsepower"
                values={cars.map(c => c.horsepower)}
                format={(v) => v ? `${v} hp` : "-"}
                highlight="higher"
              />
              <CompareRow
                label="0-60 mph"
                values={cars.map(c => c.zeroToSixtySeconds)}
                format={(v) => v ? `${v}s` : "-"}
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
                values={cars.map(c => c.autonomousLevel ?? "-")}
              />
              <tr className="border-b border-gray-800/50">
                <td className="px-4 py-2 text-gray-400 font-medium">Hands-Free Highway</td>
                {cars.map((car) => (
                  <td key={car.id} className="px-4 py-2 text-center">
                    {car.adasFeatures?.handsFreeHighway ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="px-4 py-2 text-gray-400 font-medium">Auto-Folding Mirrors</td>
                {cars.map((car) => (
                  <td key={car.id} className="px-4 py-2 text-center">
                    {car.adasFeatures?.autoFoldingMirrors ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Ownership Costs Section */}
              <tr className="bg-gray-900/50">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-amber-400/80 font-semibold text-xs uppercase tracking-wider">
                  Ownership
                </td>
              </tr>
              <CompareRow
                label="Reliability"
                values={cars.map(c => c.reliabilityRating)}
              />
              <CompareRow
                label="Towing Capacity"
                values={cars.map(c => c.towingCapacityLbs)}
                format={(v) => v ? `${(v as number).toLocaleString()} lbs` : "-"}
                highlight="higher"
              />
              <CompareRow
                label="Ground Clearance"
                values={cars.map(c => c.groundClearanceInches)}
                format={(v) => v ? `${v}"` : "-"}
                highlight="higher"
              />
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-gray-600 text-xs">
          Green highlighting indicates the best value in each category
        </div>
      </div>
    </div>
  );
}
