export type FuelType = "gasoline" | "hybrid" | "electric" | "diesel" | "plug-in-hybrid";

export type PlugType = "J1772" | "CCS1" | "CHAdeMO" | "NACS" | "Tesla" | "none";

export type BodyType = "sedan" | "crossover" | "suv" | "truck" | "minivan" | "hatchback" | "wagon" | "coupe";

// IIHS Top Safety Pick ratings
export type SafetyRating = "TSP+" | "TSP" | "Good" | "Acceptable" | "Not Rated";

export interface Car {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  bodyType: BodyType;
  imageUrl?: string;            // URL to car image

  // Dimensions
  bodyWidthInches: number;      // Width without mirrors
  mirrorWidthInches?: number;   // Width with mirrors (if known)
  lengthInches?: number;
  heightInches?: number;

  // Capacity
  seats: number;
  doors: number;
  cargoVolumesCuFt?: number;
  driverLegroomInches?: number;  // Driver leg room in inches

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

  // Safety
  safetyRating?: SafetyRating;    // IIHS rating: TSP+, TSP, Good, Acceptable, Not Rated

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
  bodyTypes?: BodyType[];
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
  | "bodyType"
  | "bodyWidthInches"
  | "seats"
  | "doors"
  | "msrp"
  | "mpgCombined"
  | "electricRangeMiles"
  | "driverLegroomInches"
  | "safetyRating";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
