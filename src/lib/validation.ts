import { SortConfig, SortDirection, SortField } from "@/types/car";

// Runtime guards for values that arrive from outside the app — share links and
// localStorage. TypeScript describes these as typed once they are inside React
// state, but nothing checks that claim at the boundary, so a hand-edited link or a
// stale stored value reaches the renderer as the wrong shape and throws mid-render.

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

// Declaring this as Record<SortField, true> makes the compiler reject the file if a
// member of the union is ever added without being listed here, so the guard cannot
// silently drift out of sync with the type it is guarding.
const SORT_FIELDS: Record<SortField, true> = {
  year: true,
  make: true,
  model: true,
  bodyType: true,
  lengthInches: true,
  bodyWidthInches: true,
  mirrorsFoldedWidthInches: true,
  heightInches: true,
  groundClearanceInches: true,
  towingCapacityLbs: true,
  seats: true,
  doors: true,
  cargoVolumesCuFt: true,
  msrp: true,
  mpgCombined: true,
  electricRangeMiles: true,
  driverLegroomInches: true,
  safetyRating: true,
  autonomousLevel: true,
  reviewScore: true,
  leaseRating: true,
  depreciationCategory: true,
  fiveYearResalePercent: true,
  reliabilityRating: true,
  insuranceCostAnnual: true,
  maintenanceCostAnnual: true,
  zeroToSixtySeconds: true,
  horsepower: true,
};

export function isSortField(value: unknown): value is SortField {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(SORT_FIELDS, value);
}

export function isSortDirection(value: unknown): value is SortDirection {
  return value === "asc" || value === "desc";
}

/** Returns a usable SortConfig, or null if the input is not one. */
export function toSortConfig(field: unknown, direction: unknown): SortConfig | null {
  return isSortField(field) && isSortDirection(direction) ? { field, direction } : null;
}

/**
 * Parses an integer from URL/stored input, returning undefined for anything that is
 * not a finite number. `parseInt` yields NaN on junk, and `JSON.stringify(NaN)` is
 * `null`, so an unchecked NaN persists as a null that later reads as "filter set to
 * nothing" and silently empties the table.
 */
export function parseFiniteInt(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
