"use client";

import { Car, SafetyRating } from "@/types/car";
import { formatCurrency, getEffectiveWidth } from "@/lib/carUtils";

interface CompareModalProps {
  cars: Car[];
  onClose: () => void;
  onRemoveCar: (carId: string) => void;
  mirrorBuffer: number;
}

export default function CompareModal({ cars, onClose, onRemoveCar, mirrorBuffer }: CompareModalProps) {
  if (cars.length === 0) return null;

  const getCarImageUrl = (car: Car, size: number = 400): string => {
    const modelFamily = car.model
      .split(" ")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const make = car.make.toLowerCase();
    return `https://cdn.imagin.studio/getImage?customer=img&make=${make}&modelFamily=${modelFamily}&paintId=pspc0001&angle=01&width=${size}`;
  };

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
      <tr className="border-b border-gray-700">
        <td className="px-4 py-2 text-gray-400 font-medium">{label}</td>
        {formatted.map((val, i) => (
          <td
            key={i}
            className={`px-4 py-2 text-center ${
              bestIndex === i ? "text-green-400 font-semibold" : "text-white"
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
      return <span className="text-gray-500">-</span>;
    }
    const colors: Record<string, string> = {
      "TSP+": "bg-green-700 text-green-100",
      "TSP": "bg-green-800 text-green-200",
      "Good": "bg-blue-800 text-blue-200",
      "Acceptable": "bg-yellow-800 text-yellow-200",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs ${colors[rating] ?? "bg-gray-600"}`}>
        {rating}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg max-w-6xl w-full p-6 mx-4 sm:mx-auto mt-8 mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Compare Vehicles</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none p-2"
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
                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 text-sm"
                        title="Remove from comparison"
                      >
                        ×
                      </button>
                      <img
                        src={getCarImageUrl(car, 300)}
                        alt={`${car.year} ${car.make} ${car.model}`}
                        className="w-full h-32 object-contain rounded-lg mb-2"
                      />
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
              <tr className="bg-gray-900">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-blue-400 font-semibold text-sm uppercase">
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
              <tr className="bg-gray-900">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-blue-400 font-semibold text-sm uppercase">
                  Safety
                </td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="px-4 py-2 text-gray-400 font-medium">IIHS Rating</td>
                {cars.map((car) => (
                  <td key={car.id} className="px-4 py-2 text-center">
                    <SafetyBadge rating={car.safetyRating} />
                  </td>
                ))}
              </tr>

              {/* Dimensions Section */}
              <tr className="bg-gray-900">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-blue-400 font-semibold text-sm uppercase">
                  Dimensions
                </td>
              </tr>
              <CompareRow
                label="Width (w/ mirrors)"
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
              <tr className="bg-gray-900">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-blue-400 font-semibold text-sm uppercase">
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
              <tr className="bg-gray-900">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-blue-400 font-semibold text-sm uppercase">
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
              <tr className="bg-gray-900">
                <td colSpan={cars.length + 1} className="px-4 py-2 text-blue-400 font-semibold text-sm uppercase">
                  Powertrain
                </td>
              </tr>
              <CompareRow
                label="Fuel Type"
                values={cars.map(c => c.fuelType)}
              />
              <CompareRow
                label="Plug Type"
                values={cars.map(c => c.plugType === "none" ? "N/A" : c.plugType)}
              />
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          Green highlighting indicates the best value in each category
        </div>
      </div>
    </div>
  );
}
