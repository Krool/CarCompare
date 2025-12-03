"use client";

import { useState, useMemo, useEffect } from "react";
import { Car } from "@/types/car";
import { getEffectiveWidth, getCarDisplayName } from "@/lib/carUtils";

interface GarageFitVisualizerProps {
  car: Car;
  mirrorBuffer: number;
  onClose: () => void;
}

// localStorage key for garage dimensions
const STORAGE_KEY = "carcompare_garage_dimensions";

interface GarageDimensions {
  width: number;
  length: number;
  height: number;
}

const DEFAULT_GARAGE: GarageDimensions = {
  width: 120, // 10 feet in inches
  length: 240, // 20 feet in inches
  height: 96, // 8 feet in inches
};

// Common garage size presets
const GARAGE_PRESETS: { name: string; dimensions: GarageDimensions }[] = [
  { name: "Small 1-Car", dimensions: { width: 120, length: 240, height: 84 } }, // 10x20x7
  { name: "Standard 1-Car", dimensions: { width: 144, length: 240, height: 96 } }, // 12x20x8
  { name: "Large 1-Car", dimensions: { width: 168, length: 264, height: 108 } }, // 14x22x9
  { name: "Standard 2-Car", dimensions: { width: 240, length: 240, height: 96 } }, // 20x20x8
  { name: "Large 2-Car", dimensions: { width: 288, length: 264, height: 108 } }, // 24x22x9
];

export default function GarageFitVisualizer({
  car,
  mirrorBuffer,
  onClose,
}: GarageFitVisualizerProps) {
  const [garage, setGarage] = useState<GarageDimensions>(DEFAULT_GARAGE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load garage dimensions from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGarage(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse garage dimensions:", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save garage dimensions to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(garage));
  }, [garage, isInitialized]);

  const carWidth = getEffectiveWidth(car, mirrorBuffer);
  const carLength = car.lengthInches ?? 180; // Default to 15 feet if unknown
  const carHeight = car.heightInches ?? 65; // Default to ~5.5 feet if unknown

  const fitAnalysis = useMemo(() => {
    const widthClearance = garage.width - carWidth;
    const lengthClearance = garage.length - carLength;
    const heightClearance = garage.height - carHeight;

    const sideClearance = widthClearance / 2;
    const fits = widthClearance >= 0 && lengthClearance >= 0 && heightClearance >= 0;
    const comfortable = sideClearance >= 24 && lengthClearance >= 36 && heightClearance >= 6; // 2ft sides, 3ft front/back, 6in top

    return {
      fits,
      comfortable,
      widthClearance,
      lengthClearance,
      heightClearance,
      sideClearance,
    };
  }, [garage, carWidth, carLength, carHeight]);

  // Scale factor for visualization (pixels per inch)
  const maxVisualWidth = 400;
  const scale = Math.min(maxVisualWidth / garage.width, maxVisualWidth / garage.length) * 0.9;

  const garageVisualWidth = garage.width * scale;
  const garageVisualLength = garage.length * scale;
  const carVisualWidth = carWidth * scale;
  const carVisualLength = carLength * scale;

  const handleDimensionChange = (field: keyof GarageDimensions, feet: number) => {
    setGarage(prev => ({ ...prev, [field]: feet * 12 }));
  };

  const formatInches = (inches: number): string => {
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    if (remainingInches === 0) return `${feet}'`;
    return `${feet}' ${remainingInches}"`;
  };

  const getClearanceColor = (inches: number, comfortable: number): string => {
    if (inches < 0) return "text-red-400";
    if (inches < comfortable) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Garage Fit Visualizer</h3>
            <p className="text-gray-400 text-sm mt-1">{getCarDisplayName(car)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none p-2"
          >
            ×
          </button>
        </div>

        {/* Garage Dimensions Input */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h4 className="text-white font-medium mb-3">Your Garage Dimensions</h4>

          {/* Quick Presets */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs block mb-2">Quick Presets:</label>
            <div className="flex flex-wrap gap-2">
              {GARAGE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setGarage(preset.dimensions)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-gray-400 text-sm block mb-1">Width (ft)</label>
              <input
                type="number"
                value={Math.round(garage.width / 12)}
                onChange={(e) => handleDimensionChange("width", parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 text-center"
                min={6}
                max={30}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Length (ft)</label>
              <input
                type="number"
                value={Math.round(garage.length / 12)}
                onChange={(e) => handleDimensionChange("length", parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 text-center"
                min={10}
                max={40}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-1">Height (ft)</label>
              <input
                type="number"
                value={Math.round(garage.height / 12)}
                onChange={(e) => handleDimensionChange("height", parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 text-center"
                min={6}
                max={15}
              />
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Tip: Measure from wall to wall, not including storage or shelving
          </p>
        </div>

        {/* Fit Status */}
        <div className={`rounded-lg p-4 mb-6 border-2 ${
          fitAnalysis.fits
            ? fitAnalysis.comfortable
              ? "bg-green-900/30 border-green-600"
              : "bg-yellow-900/30 border-yellow-600"
            : "bg-red-900/30 border-red-600"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {fitAnalysis.fits
                ? fitAnalysis.comfortable
                  ? "✓"
                  : "⚠"
                : "✗"}
            </span>
            <div>
              <h4 className={`text-lg font-semibold ${
                fitAnalysis.fits
                  ? fitAnalysis.comfortable
                    ? "text-green-400"
                    : "text-yellow-400"
                  : "text-red-400"
              }`}>
                {fitAnalysis.fits
                  ? fitAnalysis.comfortable
                    ? "Comfortable Fit"
                    : "Tight Fit"
                  : "Does Not Fit"}
              </h4>
              <p className="text-gray-400 text-sm">
                {fitAnalysis.fits
                  ? fitAnalysis.comfortable
                    ? "Plenty of room to open doors and walk around"
                    : "Will fit, but may be difficult to get in/out"
                  : "This vehicle is too large for your garage"}
              </p>
            </div>
          </div>
        </div>

        {/* Top-Down Visualization */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h4 className="text-white font-medium mb-3">Top-Down View</h4>
          <div className="flex justify-center">
            <div
              className="relative bg-gray-700 border-4 border-gray-500 rounded"
              style={{
                width: garageVisualWidth,
                height: garageVisualLength,
              }}
            >
              {/* Garage label */}
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs">
                {formatInches(garage.width)}
              </span>
              <span className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-gray-400 text-xs whitespace-nowrap">
                {formatInches(garage.length)}
              </span>

              {/* Car (centered) */}
              <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded ${
                  fitAnalysis.fits ? "bg-blue-600" : "bg-red-600"
                }`}
                style={{
                  width: carVisualWidth,
                  height: carVisualLength,
                }}
              >
                {/* Car direction indicator */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white/50" />
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-white/70 text-xs">
                  Car
                </span>
              </div>

              {/* Clearance annotations */}
              {fitAnalysis.fits && (
                <>
                  {/* Side clearances */}
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-green-400">
                    {formatInches(fitAnalysis.sideClearance)}
                  </div>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-green-400">
                    {formatInches(fitAnalysis.sideClearance)}
                  </div>
                  {/* Front/back clearance */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-green-400">
                    {formatInches(fitAnalysis.lengthClearance / 2)}
                  </div>
                </>
              )}

              {/* Garage door indicator */}
              <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-yellow-500" />
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-4">
            Yellow line = garage door
          </p>
        </div>

        {/* Detailed Clearances */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h4 className="text-white font-medium mb-3">Clearance Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Car Width:</span>
              <span className="text-white">{carWidth.toFixed(1)}"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Side Clearance:</span>
              <span className={getClearanceColor(fitAnalysis.sideClearance, 24)}>
                {fitAnalysis.sideClearance >= 0 ? formatInches(fitAnalysis.sideClearance) : "Too wide"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Car Length:</span>
              <span className="text-white">{carLength.toFixed(1)}"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Front/Back Clearance:</span>
              <span className={getClearanceColor(fitAnalysis.lengthClearance, 36)}>
                {fitAnalysis.lengthClearance >= 0 ? formatInches(fitAnalysis.lengthClearance) : "Too long"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Car Height:</span>
              <span className="text-white">{carHeight.toFixed(1)}"</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Overhead Clearance:</span>
              <span className={getClearanceColor(fitAnalysis.heightClearance, 6)}>
                {fitAnalysis.heightClearance >= 0 ? formatInches(fitAnalysis.heightClearance) : "Too tall"}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Recommendations</h4>
          <ul className="text-gray-400 text-sm space-y-1">
            {fitAnalysis.sideClearance < 24 && fitAnalysis.sideClearance >= 0 && (
              <li>• Less than 2ft on each side - opening doors may be difficult</li>
            )}
            {fitAnalysis.sideClearance < 18 && fitAnalysis.sideClearance >= 0 && (
              <li>• Consider folding mirrors when parked</li>
            )}
            {fitAnalysis.lengthClearance < 36 && fitAnalysis.lengthClearance >= 0 && (
              <li>• Limited space front/back - be careful pulling in</li>
            )}
            {fitAnalysis.heightClearance < 12 && fitAnalysis.heightClearance >= 0 && (
              <li>• Low ceiling clearance - watch for roof racks</li>
            )}
            {fitAnalysis.comfortable && (
              <li className="text-green-400">• Great fit! Plenty of room for comfortable entry/exit</li>
            )}
            {!fitAnalysis.fits && (
              <li className="text-red-400">• This vehicle will not fit in your garage</li>
            )}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-gray-500 text-xs mt-4 text-center">
          Dimensions are saved automatically for future comparisons
        </p>
      </div>
    </div>
  );
}
