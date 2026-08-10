/**
 * Canonical display labels for every enum-ish value in the dataset.
 *
 * The data stores lowercase slugs ("suv", "plug-in-hybrid", "below-average").
 * Rendering those through CSS `capitalize` produced "Suv" and — because
 * `String.replace("-", " ")` only replaces the first hyphen — "Plug In-Hybrid".
 * Every surface must read a label from here instead of transforming the slug.
 */

import {
  AutonomousLevel,
  BodyType,
  DepreciationCategory,
  FuelType,
  InsuranceCostCategory,
  LeaseRating,
  MaintenanceCostCategory,
  PlugType,
  ReliabilityRating,
} from "@/types/car";

/** Shown wherever a value is genuinely absent. One dash, everywhere. */
export const EMPTY = "—";

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  sedan: "Sedan",
  crossover: "Crossover",
  suv: "SUV",
  truck: "Truck",
  minivan: "Minivan",
  hatchback: "Hatchback",
  wagon: "Wagon",
  coupe: "Coupe",
};

/** Compact variants for the table, where column width is scarce. */
export const BODY_TYPE_SHORT_LABELS: Record<BodyType, string> = {
  ...BODY_TYPE_LABELS,
  hatchback: "Hatch",
  crossover: "Cross.",
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  hybrid: "Hybrid",
  "plug-in-hybrid": "Plug-in Hybrid",
  electric: "Electric",
};

export const FUEL_TYPE_SHORT_LABELS: Record<FuelType, string> = {
  gasoline: "Gas",
  diesel: "Diesel",
  hybrid: "Hybrid",
  "plug-in-hybrid": "PHEV",
  electric: "EV",
};

export const ADAS_LEVEL_LABELS: Record<AutonomousLevel, string> = {
  none: "None",
  basic: "Basic",
  enhanced: "Enhanced",
  "hands-free": "Hands-Free",
  "full-self-driving": "Full Self-Driving",
};

export const ADAS_LEVEL_SHORT_LABELS: Record<AutonomousLevel, string> = {
  ...ADAS_LEVEL_LABELS,
  "full-self-driving": "FSD",
};

export const LEASE_RATING_LABELS: Record<LeaseRating, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

export const DEPRECIATION_LABELS: Record<DepreciationCategory, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  "very-high": "Very High",
};

export const DEPRECIATION_SHORT_LABELS: Record<DepreciationCategory, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
  "very-high": "V. High",
};

export const RELIABILITY_LABELS: Record<ReliabilityRating, string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  "below-average": "Below Average",
  poor: "Poor",
};

export const RELIABILITY_SHORT_LABELS: Record<ReliabilityRating, string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  "below-average": "Below Avg",
  poor: "Poor",
};

export const COST_CATEGORY_LABELS: Record<InsuranceCostCategory | MaintenanceCostCategory, string> = {
  low: "Low",
  average: "Average",
  high: "High",
  "very-high": "Very High",
};

export const PLUG_TYPE_LABELS: Record<PlugType, string> = {
  J1772: "J1772",
  CCS1: "CCS1",
  CHAdeMO: "CHAdeMO",
  NACS: "NACS",
  Tesla: "Tesla",
  none: EMPTY,
};

export function bodyTypeLabel(value: BodyType, short = false): string {
  return (short ? BODY_TYPE_SHORT_LABELS : BODY_TYPE_LABELS)[value] ?? value;
}

export function fuelTypeLabel(value: FuelType, short = false): string {
  return (short ? FUEL_TYPE_SHORT_LABELS : FUEL_TYPE_LABELS)[value] ?? value;
}

export function adasLevelLabel(value: AutonomousLevel | undefined, short = false): string {
  if (!value) return EMPTY;
  return (short ? ADAS_LEVEL_SHORT_LABELS : ADAS_LEVEL_LABELS)[value] ?? value;
}

export function plugTypeLabel(value: PlugType | undefined): string {
  if (!value) return EMPTY;
  return PLUG_TYPE_LABELS[value] ?? value;
}

export function reliabilityLabel(value: ReliabilityRating | undefined, short = false): string {
  if (!value) return EMPTY;
  return (short ? RELIABILITY_SHORT_LABELS : RELIABILITY_LABELS)[value] ?? value;
}

export function depreciationLabel(value: DepreciationCategory | undefined, short = false): string {
  if (!value) return EMPTY;
  return (short ? DEPRECIATION_SHORT_LABELS : DEPRECIATION_LABELS)[value] ?? value;
}

export function leaseRatingLabel(value: LeaseRating | undefined): string {
  if (!value) return EMPTY;
  return LEASE_RATING_LABELS[value] ?? value;
}

/**
 * Present an optional measurement. Treats 0 as "no data" for fields where zero
 * is not a meaningful reading (towing capacity, EV range, MPGe) — the previous
 * `{value && ...}` guards leaked a literal `0` into the DOM for those.
 */
export function optional(
  value: number | string | undefined | null,
  format: (v: number | string) => string = String,
): string {
  if (value === undefined || value === null || value === "" || value === 0) return EMPTY;
  return format(value);
}

/** True when a numeric field carries a real reading (not missing, not zero). */
export function hasValue(value: number | undefined | null): value is number {
  return value !== undefined && value !== null && value > 0;
}
