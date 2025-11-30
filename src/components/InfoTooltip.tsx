"use client";

import { useState, useRef, useEffect } from "react";

interface InfoTooltipProps {
  title: string;
  children: React.ReactNode;
}

export default function InfoTooltip({ title, children }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-500 text-gray-300 text-xs font-bold inline-flex items-center justify-center"
        title={`Learn about ${title}`}
        type="button"
      >
        ?
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute z-50 left-0 top-6 w-80 bg-gray-900 border border-gray-600 rounded-lg shadow-xl p-4"
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-white font-semibold">{title}</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="text-sm text-gray-300 space-y-2">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Pre-built info content for different filter types
export function AdasInfoContent() {
  return (
    <>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-blue-400">Full Self-Driving (FSD)</p>
        <p className="text-gray-400 text-xs">Most advanced. Handles city streets, intersections, and highway driving with minimal intervention. Currently only Tesla offers this level.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-purple-400">Hands-Free Highway</p>
        <p className="text-gray-400 text-xs">Can drive hands-free on mapped highways. Examples: GM Super Cruise, Ford BlueCruise, Mercedes Drive Pilot. Driver must stay attentive.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-blue-300">Enhanced ADAS</p>
        <p className="text-gray-400 text-xs">Hands-on highway driving with lane centering and adaptive cruise. Maintains lane position and following distance. Most modern vehicles have this.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-gray-400">Basic ADAS</p>
        <p className="text-gray-400 text-xs">Lane keep assist (nudges back if drifting) and adaptive cruise control. Doesn't actively center in lane.</p>
      </div>
      <div>
        <p className="font-medium text-gray-500">None</p>
        <p className="text-gray-400 text-xs">No driver assistance features. Rare in modern vehicles.</p>
      </div>
    </>
  );
}

export function AdasFeaturesInfoContent() {
  return (
    <>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Hands-Free Highway</p>
        <p className="text-gray-400 text-xs">Allows completely hands-off driving on compatible highways. Uses cameras/radar to monitor road and driver attention. Only a few vehicles offer this feature.</p>
      </div>
      <div>
        <p className="font-medium text-white">Auto Lane Change</p>
        <p className="text-gray-400 text-xs">Vehicle can automatically change lanes when you activate the turn signal or when the system determines it's safe. Usually requires driver supervision.</p>
      </div>
    </>
  );
}

export function SafetyRatingInfoContent() {
  return (
    <>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-green-400">TSP+ (Top Safety Pick+)</p>
        <p className="text-gray-400 text-xs">Highest IIHS award. Requires "Good" ratings in all crash tests, good headlights on all trims, and excellent pedestrian detection.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-green-300">TSP (Top Safety Pick)</p>
        <p className="text-gray-400 text-xs">Second-highest award. Requires "Good" crash ratings and at least "Acceptable" headlights and pedestrian detection.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-blue-400">Good</p>
        <p className="text-gray-400 text-xs">Passes all IIHS crash tests with "Good" ratings but may not meet TSP criteria for headlights or other features.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-yellow-400">Acceptable</p>
        <p className="text-gray-400 text-xs">Passes IIHS crash tests with mixed ratings. Some areas may be "Acceptable" or "Marginal" instead of "Good".</p>
      </div>
      <div>
        <p className="font-medium text-gray-500">Not Rated</p>
        <p className="text-gray-400 text-xs">Vehicle hasn't been tested by IIHS yet, usually because it's too new or low-volume.</p>
      </div>
      <p className="text-xs text-gray-500 mt-3 italic">Note: 2025 IIHS criteria are stricter than previous years. Many vehicles that earned TSP in 2024 no longer qualify.</p>
    </>
  );
}

export function WidthInfoContent() {
  return (
    <>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Mirrors Extended</p>
        <p className="text-gray-400 text-xs">Total width with side mirrors in normal driving position. This is the width you need for driving through narrow spaces.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Mirrors Folded</p>
        <p className="text-gray-400 text-xs">Width with side mirrors folded in against the body. Useful for tight parking garages or narrow parking spaces. Not all vehicles have power-folding mirrors.</p>
      </div>
      <div>
        <p className="font-medium text-gray-400">Body Width</p>
        <p className="text-gray-400 text-xs">Width of just the vehicle body, not including mirrors. Rarely used in practice but shown for reference.</p>
      </div>
    </>
  );
}

export function FuelTypeInfoContent() {
  return (
    <>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-blue-400">Electric (EV)</p>
        <p className="text-gray-400 text-xs">100% battery-powered. No gas engine. Charges at home or public stations. Zero tailpipe emissions.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-teal-400">Plug-in Hybrid (PHEV)</p>
        <p className="text-gray-400 text-xs">Has both electric motor and gas engine. Can drive 20-50 miles on battery alone, then switches to gas. Plugs in to charge.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-green-400">Hybrid</p>
        <p className="text-gray-400 text-xs">Gas engine with electric assist. Battery charges from regenerative braking. Cannot plug in. Better fuel economy than gas-only.</p>
      </div>
      <div>
        <p className="font-medium text-gray-400">Gasoline</p>
        <p className="text-gray-400 text-xs">Traditional internal combustion engine. Most common type. Uses regular or premium gasoline.</p>
      </div>
    </>
  );
}

export function PlugTypeInfoContent() {
  return (
    <>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">NACS / Tesla</p>
        <p className="text-gray-400 text-xs">North American Charging Standard. Originally Tesla-only, now becoming the standard for most new EVs. Access to Tesla Supercharger network.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">CCS1</p>
        <p className="text-gray-400 text-xs">Combined Charging System (Type 1). Previously the standard for non-Tesla EVs in North America. Supports DC fast charging.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">J1772</p>
        <p className="text-gray-400 text-xs">Standard Level 2 charging plug. Used by plug-in hybrids and older EVs. Slower charging, up to ~19kW.</p>
      </div>
      <div>
        <p className="font-medium text-white">CHAdeMO</p>
        <p className="text-gray-400 text-xs">Japanese DC fast charging standard. Mostly used by older Nissan Leafs. Being phased out in North America.</p>
      </div>
    </>
  );
}
