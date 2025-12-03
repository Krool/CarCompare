export type FuelType = "gasoline" | "hybrid" | "electric" | "diesel" | "plug-in-hybrid";

export type PlugType = "J1772" | "CCS1" | "CHAdeMO" | "NACS" | "Tesla" | "none";

export type BodyType = "sedan" | "crossover" | "suv" | "truck" | "minivan" | "hatchback" | "wagon" | "coupe";

// IIHS Top Safety Pick ratings
export type SafetyRating = "TSP+" | "TSP" | "Good" | "Acceptable" | "Pending" | "Not Rated";

// Autonomous driving capability levels
export type AutonomousLevel =
  | "none"           // No driver assistance
  | "basic"          // Basic ADAS (ACC, LKA)
  | "enhanced"       // Enhanced ADAS (hands-on highway driving)
  | "hands-free"     // Hands-free highway driving (BlueCruise, Super Cruise)
  | "full-self-driving"; // Full autonomy capable (Tesla FSD, etc.)

// Lease rating - how good of a lease deal the vehicle typically offers
export type LeaseRating = "excellent" | "good" | "fair" | "poor";

// Depreciation category - how fast the vehicle loses value
export type DepreciationCategory = "low" | "medium" | "high" | "very-high";

// Reliability rating based on JD Power/Consumer Reports
export type ReliabilityRating = "excellent" | "good" | "average" | "below-average" | "poor";

// Insurance cost category (annual full coverage)
export type InsuranceCostCategory = "low" | "average" | "high" | "very-high";

// Maintenance cost category (annual)
export type MaintenanceCostCategory = "low" | "average" | "high" | "very-high";

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
  groundClearanceInches?: number;    // Ground clearance in inches

  // Capability
  towingCapacityLbs?: number;        // Max towing capacity in pounds

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
  safetyRating?: SafetyRating;    // IIHS rating: TSP+, TSP, Good, Acceptable, Pending, Not Rated

  // Review Score
  reviewScore?: number;           // Aggregated expert review score (0-100 scale, from MotorMashup)

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

  // Lease & Depreciation
  leaseRating?: LeaseRating;           // How good lease deals typically are
  depreciationCategory?: DepreciationCategory;  // How fast it loses value
  fiveYearResalePercent?: number;      // Estimated % of MSRP retained after 5 years

  // Ownership Costs
  reliabilityRating?: ReliabilityRating;  // JD Power / Consumer Reports based
  insuranceCostCategory?: InsuranceCostCategory;  // Annual insurance (low/avg/high/very-high)
  insuranceCostAnnual?: number;           // Estimated annual insurance cost
  maintenanceCostCategory?: MaintenanceCostCategory;  // Annual maintenance (low/avg/high/very-high)
  maintenanceCostAnnual?: number;         // Estimated annual maintenance cost

  // Performance
  zeroToSixtySeconds?: number;  // 0-60 mph time in seconds
  horsepower?: number;          // Engine horsepower
  torqueLbFt?: number;          // Torque in lb-ft

  // Features/Notes
  standardFeatures?: string[];
  notes?: string;

  // Metadata
  lastUpdated: string;          // ISO date string
  dataSource?: string;          // Where we got the data
}

export type WidthFilterType = "extended" | "folded" | "one-mirror";

export interface CarFilters {
  minSeats?: number;
  maxSeats?: number;
  seats?: number[];             // Filter by specific seat counts (toggle buttons)
  minPrice?: number;
  maxPrice?: number;
  doors?: number[];
  fuelTypes?: FuelType[];
  plugTypes?: PlugType[];
  bodyTypes?: BodyType[];
  maxWidthInches?: number;      // For garage fit
  widthFilterType?: WidthFilterType; // Which width to filter by (default: extended)
  maxLengthInches?: number;     // For garage fit - max length
  maxHeightInches?: number;     // For garage fit - max height (low clearance)
  minGroundClearance?: number;  // For off-road capability
  minTowingCapacity?: number;   // Minimum towing capacity in lbs
  makes?: string[];
  minLegroom?: number;          // Minimum driver legroom in inches
  safetyRatings?: SafetyRating[]; // Filter by IIHS safety ratings
  minYear?: number;             // Minimum model year
  maxYear?: number;             // Maximum model year
  minMpg?: number;              // Minimum combined MPG/MPGe
  minEvRange?: number;          // Minimum EV range in miles
  minCargo?: number;            // Minimum cargo volume in cubic feet
  minReviewScore?: number;      // Minimum review score (0-100)
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
  | "lengthInches"
  | "bodyWidthInches"
  | "mirrorsFoldedWidthInches"
  | "heightInches"
  | "groundClearanceInches"
  | "towingCapacityLbs"
  | "seats"
  | "doors"
  | "cargoVolumesCuFt"
  | "msrp"
  | "mpgCombined"
  | "electricRangeMiles"
  | "driverLegroomInches"
  | "safetyRating"
  | "autonomousLevel"
  | "reviewScore"
  | "leaseRating"
  | "depreciationCategory"
  | "fiveYearResalePercent"
  | "reliabilityRating"
  | "insuranceCostAnnual"
  | "maintenanceCostAnnual"
  | "zeroToSixtySeconds"
  | "horsepower";

// Column customization types
export type ColumnId =
  | "favorite" | "compare" | "baseline" | "image"
  | "year" | "make" | "model" | "bodyType"
  | "safetyRating" | "reviewScore" | "autonomousLevel"
  | "seats" | "doors" | "driverLegroomInches" | "cargoVolumesCuFt"
  | "lengthInches" | "mirrorsFoldedWidthInches" | "oneMirrorWidthInches" | "bodyWidthInches" | "heightInches" | "groundClearanceInches" | "towingCapacityLbs"
  | "fuelType" | "plugType" | "mpgCombined" | "electricRangeMiles"
  | "msrp" | "leaseRating" | "depreciationCategory" | "fiveYearResalePercent"
  | "reliabilityRating" | "insuranceCostAnnual" | "maintenanceCostAnnual"
  | "zeroToSixtySeconds" | "horsepower"
  | "notes";

export interface ColumnConfig {
  id: ColumnId;
  label: string;
  shortLabel?: string;
  sortField?: SortField;
  defaultVisible: boolean;
  category: "action" | "identity" | "safety" | "dimensions" | "powertrain" | "pricing";
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
