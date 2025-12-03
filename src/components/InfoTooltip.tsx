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
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Auto Lane Change</p>
        <p className="text-gray-400 text-xs">Vehicle can automatically change lanes when you activate the turn signal or when the system determines it's safe. Usually requires driver supervision.</p>
      </div>
      <div>
        <p className="font-medium text-white">Auto-Folding Mirrors</p>
        <p className="text-gray-400 text-xs">Power-folding side mirrors that can fold in automatically when parked or via button. Useful for tight parking spaces and garages.</p>
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

export function ReviewScoreInfoContent() {
  return (
    <>
      <p className="mb-2">Aggregated scores from professional automotive reviewers, compiled by MotorMashup.</p>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-green-400">80-100: Excellent</p>
        <p className="text-gray-400 text-xs">Top picks in their segment. Highly recommended by most reviewers.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-blue-400">70-79: Good</p>
        <p className="text-gray-400 text-xs">Solid choices with minor drawbacks. Well-regarded overall.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-yellow-400">60-69: Average</p>
        <p className="text-gray-400 text-xs">Meets expectations but doesn't stand out. May have notable compromises.</p>
      </div>
      <div>
        <p className="font-medium text-red-400">Below 60: Below Average</p>
        <p className="text-gray-400 text-xs">Significant issues noted by reviewers. Consider alternatives.</p>
      </div>
    </>
  );
}

export function BodyTypeInfoContent() {
  return (
    <>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Crossover</p>
        <p className="text-gray-400 text-xs">Car-based platform with raised ride height. Typically unibody construction. Better fuel economy than truck-based SUVs. Most popular segment.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">SUV</p>
        <p className="text-gray-400 text-xs">Truck-based platform with body-on-frame construction. Better for towing and off-road. Includes full-size SUVs like Tahoe, Expedition.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Sedan</p>
        <p className="text-gray-400 text-xs">Traditional 4-door car with separate trunk. Lower center of gravity for better handling. Generally most fuel efficient.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Hatchback</p>
        <p className="text-gray-400 text-xs">Compact car with rear liftgate. More cargo flexibility than sedans. Popular in compact and subcompact sizes.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Truck</p>
        <p className="text-gray-400 text-xs">Pickup truck with open cargo bed. Best for towing and hauling. Includes mid-size (Tacoma) and full-size (F-150).</p>
      </div>
      <div>
        <p className="font-medium text-white">Minivan</p>
        <p className="text-gray-400 text-xs">Family hauler with sliding doors. Maximum interior space and easy entry. Best for families with young children.</p>
      </div>
    </>
  );
}

export function EfficiencyInfoContent() {
  return (
    <>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">MPG (Miles Per Gallon)</p>
        <p className="text-gray-400 text-xs">Fuel efficiency for gas/hybrid vehicles. Higher is better. Combined rating averages city (55%) and highway (45%) driving.</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">MPGe (Miles Per Gallon Equivalent)</p>
        <p className="text-gray-400 text-xs">Electric efficiency converted to gas equivalent. 33.7 kWh = 1 gallon of gas. EVs typically rate 100+ MPGe.</p>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        <p className="font-medium text-gray-400 mb-1">Typical ranges:</p>
        <p>• Economy car: 30-40 MPG</p>
        <p>• Hybrid: 40-60 MPG</p>
        <p>• EV: 100-140 MPGe</p>
        <p>• Full-size SUV: 18-25 MPG</p>
      </div>
    </>
  );
}

export function EvRangeInfoContent() {
  return (
    <>
      <p className="mb-2">Maximum distance on a full battery charge (EPA estimated).</p>
      <div className="text-xs text-gray-500">
        <p className="font-medium text-gray-400 mb-1">Typical ranges:</p>
        <p>• Short range EV: 100-200 miles</p>
        <p>• Average EV: 250-300 miles</p>
        <p>• Long range EV: 300-400+ miles</p>
        <p>• Plug-in Hybrid: 20-50 miles (electric only)</p>
      </div>
      <p className="text-xs text-gray-500 mt-2 italic">Note: Real-world range varies with weather, speed, terrain, and climate control use. Cold weather can reduce range 20-40%.</p>
    </>
  );
}

export function TowingInfoContent() {
  return (
    <>
      <p className="mb-2">Maximum weight the vehicle can safely tow when properly equipped.</p>
      <div className="text-xs text-gray-500">
        <p className="font-medium text-gray-400 mb-1">Common trailer weights:</p>
        <p>• Small utility trailer: 1,000-2,000 lbs</p>
        <p>• Jet skis/small boat: 1,500-3,000 lbs</p>
        <p>• Pop-up camper: 1,500-3,000 lbs</p>
        <p>• Small travel trailer: 3,000-5,000 lbs</p>
        <p>• Mid-size boat: 4,000-6,000 lbs</p>
        <p>• Large travel trailer: 5,000-8,000 lbs</p>
        <p>• Horse trailer (2 horse): 6,000-8,000 lbs</p>
      </div>
      <p className="text-xs text-gray-500 mt-2 italic">Note: Requires tow package. Payload and tongue weight limits also apply.</p>
    </>
  );
}

export function GroundClearanceInfoContent() {
  return (
    <>
      <p className="mb-2">Distance from ground to lowest point of the vehicle.</p>
      <div className="text-xs text-gray-500">
        <p className="font-medium text-gray-400 mb-1">Typical clearances:</p>
        <p>• Sports car: 4-5 inches</p>
        <p>• Sedan: 5-6 inches</p>
        <p>• Crossover: 7-8 inches</p>
        <p>• SUV: 8-10 inches</p>
        <p>• Off-road SUV/Truck: 10-12+ inches</p>
      </div>
      <p className="text-xs text-gray-500 mt-2 italic">Higher clearance helps with speed bumps, unpaved roads, snow, and off-road driving.</p>
    </>
  );
}

export function LegroomInfoContent() {
  return (
    <>
      <p className="mb-2">Maximum distance from seat back to pedals for the driver.</p>
      <div className="text-xs text-gray-500">
        <p className="font-medium text-gray-400 mb-1">Typical ranges:</p>
        <p>• Compact car: 40-42 inches</p>
        <p>• Mid-size: 42-44 inches</p>
        <p>• Full-size/SUV: 44-46 inches</p>
      </div>
      <p className="text-xs text-gray-500 mt-2 italic">Drivers 6'2"+ typically need 44+ inches for comfort. Test drive recommended for taller drivers.</p>
    </>
  );
}

export function CargoInfoContent() {
  return (
    <>
      <p className="mb-2">Cargo space behind rear seats (or with seats folded where noted).</p>
      <div className="text-xs text-gray-500">
        <p className="font-medium text-gray-400 mb-1">Typical volumes:</p>
        <p>• Sedan trunk: 12-16 cu ft</p>
        <p>• Hatchback: 15-25 cu ft</p>
        <p>• Compact crossover: 25-35 cu ft</p>
        <p>• Mid-size SUV: 35-45 cu ft</p>
        <p>• Full-size SUV: 45-90 cu ft</p>
        <p>• Minivan: 80-140 cu ft</p>
      </div>
      <p className="text-xs text-gray-500 mt-2 italic">A standard carry-on suitcase is about 2.5 cu ft.</p>
    </>
  );
}

export function LeaseDepreciationInfoContent() {
  return (
    <>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Lease Rating</p>
        <p className="text-gray-400 text-xs">How favorable lease deals typically are. Based on money factor (interest rate), residual value, and available incentives.</p>
        <p className="text-gray-500 text-xs mt-1">Excellent: Great deals, low payments relative to MSRP</p>
        <p className="text-gray-500 text-xs">Poor: High payments, better to buy or look elsewhere</p>
      </div>
      <div className="border-b border-gray-700 pb-2 mb-2">
        <p className="font-medium text-white">Depreciation</p>
        <p className="text-gray-400 text-xs">How fast the vehicle loses value. Low depreciation = better resale value. Luxury vehicles and EVs often depreciate faster.</p>
      </div>
      <div>
        <p className="font-medium text-white">5-Year Resale %</p>
        <p className="text-gray-400 text-xs">Estimated percentage of MSRP the vehicle will be worth after 5 years. Higher is better. Toyota/Lexus typically retain value best.</p>
      </div>
    </>
  );
}
