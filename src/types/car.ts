export type FuelType = "gasoline" | "hybrid" | "electric" | "diesel" | "plug-in-hybrid";

export type PlugType = "J1772" | "CCS1" | "CHAdeMO" | "NACS" | "Tesla" | "none";

export type BodyType = "sedan" | "crossover" | "suv" | "truck" | "minivan" | "hatchback" | "wagon" | "coupe";

// IIHS Top Safety Pick ratings
export type SafetyRating = "TSP+" | "TSP" | "Good" | "Acceptable" | "Not Rated";

// Autonomous driving capability levels
export type AutonomousLevel =
  | "none"           // No driver assistance
  | "basic"          // Basic ADAS (ACC, LKA)
  | "enhanced"       // Enhanced ADAS (hands-on highway driving)
  | "hands-free"     // Hands-free highway driving (BlueCruise, Super Cruise)
  | "full-self-driving"; // Full autonomy capable (Tesla FSD, etc.)

export interface Car {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  bodyType: BodyType;
  imageUrl?: string;            // URL to car image

  // Dimensions
  bodyWidthInches: number;           // Width without mirrors (body only)
  mirrorsFoldedWidthInches?: number; // Width with mirrors folded in
  mirrorWidthInches?: number;        // Width with mirrors extended (unfolded)
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

  // Autonomous Driving Features
  autonomousLevel?: AutonomousLevel;  // Level of autonomous capability
  adasFeatures?: {
    adaptiveCruiseControl?: boolean;   // ACC
    laneKeepAssist?: boolean;          // LKA
    laneCenteringAssist?: boolean;     // Active lane centering
    blindSpotMonitoring?: boolean;     // BSM
    automaticEmergencyBraking?: boolean; // AEB
    trafficSignRecognition?: boolean;  // TSR
    driverMonitoring?: boolean;        // Driver attention monitoring
    autoLaneChange?: boolean;          // Automatic lane changes
    summonParking?: boolean;           // Remote parking/summon
    handsFreeHighway?: boolean;        // Hands-free highway driving
    cityAutopilot?: boolean;           // City street autonomy
  };
  adasName?: string;  // Marketing name (e.g., "Autopilot", "BlueCruise", "Super Cruise")

  // Features/Notes
  standardFeatures?: string[];
  notes?: string;

  // Metadata
  lastUpdated: string;          // ISO date string
  dataSource?: string;          // Where we got the data
}

export type WidthFilterType = "extended" | "folded";

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
  widthFilterType?: WidthFilterType; // Which width to filter by (default: extended)
  makes?: string[];
  minLegroom?: number;          // Minimum driver legroom in inches
  safetyRatings?: SafetyRating[]; // Filter by IIHS safety ratings
  minYear?: number;             // Minimum model year
  maxYear?: number;             // Maximum model year
  minMpg?: number;              // Minimum combined MPG/MPGe
  minEvRange?: number;          // Minimum EV range in miles
  minCargo?: number;            // Minimum cargo volume in cubic feet
  showFavoritesOnly?: boolean;  // Only show favorited vehicles
  autonomousLevels?: AutonomousLevel[]; // Filter by autonomous capability
  hasHandsFree?: boolean;       // Has hands-free driving
  hasAutoLaneChange?: boolean;  // Has automatic lane change
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
  | "mirrorsFoldedWidthInches"
  | "seats"
  | "doors"
  | "msrp"
  | "mpgCombined"
  | "electricRangeMiles"
  | "driverLegroomInches"
  | "safetyRating"
  | "autonomousLevel";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
