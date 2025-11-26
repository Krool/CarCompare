export type FuelType = "gasoline" | "hybrid" | "electric" | "diesel" | "plug-in-hybrid";

export type PlugType = "J1772" | "CCS1" | "CHAdeMO" | "NACS" | "Tesla" | "none";

export interface Car {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;

  // Dimensions
  bodyWidthInches: number;      // Width without mirrors
  mirrorWidthInches?: number;   // Width with mirrors (if known)
  lengthInches?: number;
  heightInches?: number;

  // Capacity
  seats: number;
  doors: number;
  cargoVolumesCuFt?: number;

  // Powertrain
  fuelType: FuelType;
  plugType: PlugType;
  mpgCity?: number;
  mpgHighway?: number;
  mpgCombined?: number;
  mpge?: number;                 // For electric/hybrid
  electricRangeMiles?: number;  // For electric/plug-in hybrid

  // Pricing
  msrp?: number;                // New car MSRP
  usedPriceLow?: number;        // Estimated used price range
  usedPriceHigh?: number;

  // Features/Notes
  standardFeatures?: string[];
  notes?: string;

  // Metadata
  lastUpdated: string;          // ISO date string
  dataSource?: string;          // Where we got the data
}

export interface CarFilters {
  minSeats?: number;
  maxSeats?: number;
  minPrice?: number;
  maxPrice?: number;
  doors?: number[];
  fuelTypes?: FuelType[];
  plugTypes?: PlugType[];
  maxWidthInches?: number;      // For garage fit
  makes?: string[];
}

export interface CarDatabase {
  cars: Car[];
  lastSyncDate: string;
  mirrorBuffer: number;         // Default inches to add for mirrors
}

export type SortField =
  | "year"
  | "make"
  | "model"
  | "bodyWidthInches"
  | "seats"
  | "doors"
  | "msrp"
  | "mpgCombined"
  | "electricRangeMiles";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
