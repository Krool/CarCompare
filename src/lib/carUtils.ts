import { Car, CarFilters, SortConfig, SortField, SortDirection, SafetyRating, AutonomousLevel, LeaseRating, DepreciationCategory, ReliabilityRating } from "@/types/car";

// Safety rating order for sorting (higher is better)
const SAFETY_RATING_ORDER: Record<SafetyRating | "undefined", number> = {
  "TSP+": 5,
  "TSP": 4,
  "Good": 3,
  "Acceptable": 2,
  "Pending": 1,
  "Not Rated": 0,
  "undefined": -1,
};

// Autonomous level order for sorting (higher is better)
const AUTONOMOUS_LEVEL_ORDER: Record<AutonomousLevel | "undefined", number> = {
  "full-self-driving": 4,
  "hands-free": 3,
  "enhanced": 2,
  "basic": 1,
  "none": 0,
  "undefined": -1,
};

// Lease rating order for sorting (higher is better)
const LEASE_RATING_ORDER: Record<LeaseRating | "undefined", number> = {
  "excellent": 4,
  "good": 3,
  "fair": 2,
  "poor": 1,
  "undefined": 0,
};

// Depreciation category order for sorting (lower depreciation is better)
const DEPRECIATION_ORDER: Record<DepreciationCategory | "undefined", number> = {
  "low": 4,
  "medium": 3,
  "high": 2,
  "very-high": 1,
  "undefined": 0,
};

// Reliability rating order for sorting (higher is better)
const RELIABILITY_ORDER: Record<ReliabilityRating | "undefined", number> = {
  "excellent": 5,
  "good": 4,
  "average": 3,
  "below-average": 2,
  "poor": 1,
  "undefined": 0,
};

export function filterCars(cars: Car[], filters: CarFilters, mirrorBuffer: number): Car[] {
  return cars.filter((car) => {
    // Seats filter (toggle buttons)
    if (filters.seats && filters.seats.length > 0 && !filters.seats.includes(car.seats)) {
      return false;
    }
    // Seats filter (min/max - for backwards compatibility)
    if (filters.minSeats !== undefined && car.seats < filters.minSeats) return false;
    if (filters.maxSeats !== undefined && car.seats > filters.maxSeats) return false;

    // Price filter (use MSRP for new, usedPriceHigh for used comparison)
    const carPrice = car.msrp ?? car.usedPriceHigh ?? 0;
    if (filters.minPrice !== undefined && carPrice < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && carPrice > filters.maxPrice) return false;

    // Doors filter
    if (filters.doors && filters.doors.length > 0 && !filters.doors.includes(car.doors)) {
      return false;
    }

    // Fuel type filter
    if (filters.fuelTypes && filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(car.fuelType)) {
      return false;
    }

    // Plug type filter
    if (filters.plugTypes && filters.plugTypes.length > 0 && !filters.plugTypes.includes(car.plugType)) {
      return false;
    }

    // Body type filter
    if (filters.bodyTypes && filters.bodyTypes.length > 0 && !filters.bodyTypes.includes(car.bodyType)) {
      return false;
    }

    // Width filter (garage fit) - can filter by folded, one-mirror, or extended width
    if (filters.maxWidthInches !== undefined) {
      const widthType = filters.widthFilterType ?? "extended";
      let widthToCheck: number;
      if (widthType === "folded") {
        widthToCheck = car.mirrorsFoldedWidthInches ?? car.bodyWidthInches + 2;
      } else if (widthType === "one-mirror") {
        // One mirror = folded + half the difference between extended and folded
        const extended = car.mirrorWidthInches ?? car.bodyWidthInches + mirrorBuffer;
        const folded = car.mirrorsFoldedWidthInches ?? car.bodyWidthInches + 2;
        widthToCheck = folded + (extended - folded) / 2;
      } else {
        widthToCheck = car.mirrorWidthInches ?? car.bodyWidthInches + mirrorBuffer;
      }
      if (widthToCheck > filters.maxWidthInches) return false;
    }

    // Length filter (garage fit)
    if (filters.maxLengthInches !== undefined) {
      if (!car.lengthInches || car.lengthInches > filters.maxLengthInches) {
        return false;
      }
    }

    // Height filter (garage fit - low clearance)
    if (filters.maxHeightInches !== undefined) {
      if (!car.heightInches || car.heightInches > filters.maxHeightInches) {
        return false;
      }
    }

    // Ground clearance filter (off-road)
    if (filters.minGroundClearance !== undefined) {
      if (!car.groundClearanceInches || car.groundClearanceInches < filters.minGroundClearance) {
        return false;
      }
    }

    // Towing capacity filter
    if (filters.minTowingCapacity !== undefined) {
      if (!car.towingCapacityLbs || car.towingCapacityLbs < filters.minTowingCapacity) {
        return false;
      }
    }

    // Make filter
    if (filters.makes && filters.makes.length > 0 && !filters.makes.includes(car.make)) {
      return false;
    }

    // Legroom filter
    if (filters.minLegroom !== undefined) {
      if (!car.driverLegroomInches || car.driverLegroomInches < filters.minLegroom) {
        return false;
      }
    }

    // Safety rating filter (by specific ratings)
    if (filters.safetyRatings && filters.safetyRatings.length > 0) {
      if (!car.safetyRating || !filters.safetyRatings.includes(car.safetyRating)) {
        return false;
      }
    }

    // Year range filter
    if (filters.minYear !== undefined && car.year < filters.minYear) {
      return false;
    }
    if (filters.maxYear !== undefined && car.year > filters.maxYear) {
      return false;
    }

    // MPG/MPGe filter
    if (filters.minMpg !== undefined) {
      const efficiency = car.mpgCombined ?? car.mpge ?? 0;
      if (efficiency < filters.minMpg) {
        return false;
      }
    }

    // EV Range filter
    if (filters.minEvRange !== undefined) {
      if (!car.electricRangeMiles || car.electricRangeMiles < filters.minEvRange) {
        return false;
      }
    }

    // Cargo volume filter
    if (filters.minCargo !== undefined) {
      if (!car.cargoVolumesCuFt || car.cargoVolumesCuFt < filters.minCargo) {
        return false;
      }
    }

    // Autonomous level filter
    if (filters.autonomousLevels && filters.autonomousLevels.length > 0) {
      if (!car.autonomousLevel || !filters.autonomousLevels.includes(car.autonomousLevel)) {
        return false;
      }
    }

    // Hands-free driving filter
    if (filters.hasHandsFree === true) {
      if (!car.adasFeatures?.handsFreeHighway) {
        return false;
      }
    }

    // Auto lane change filter
    if (filters.hasAutoLaneChange === true) {
      if (!car.adasFeatures?.autoLaneChange) {
        return false;
      }
    }

    // Auto-folding mirrors filter
    if (filters.hasAutoFoldingMirrors === true) {
      if (!car.adasFeatures?.autoFoldingMirrors) {
        return false;
      }
    }

    // Review score filter
    if (filters.minReviewScore !== undefined) {
      if (!car.reviewScore || car.reviewScore < filters.minReviewScore) {
        return false;
      }
    }

    return true;
  });
}

// Resolves the value a car is ranked by for a given sort field. Returns null for
// fields with no ranking rule, which leaves the comparison to the tie-breakers.
function getSortValue(car: Car, field: SortField): number | string | null {
  switch (field) {
    case "year":
      return car.year;
    case "make":
      return car.make.toLowerCase();
    case "model":
      return car.model.toLowerCase();
    case "bodyType":
      return car.bodyType.toLowerCase();
    case "lengthInches":
      return car.lengthInches ?? 0;
    case "bodyWidthInches":
      return car.mirrorWidthInches ?? car.bodyWidthInches;
    case "mirrorsFoldedWidthInches":
      return car.mirrorsFoldedWidthInches ?? car.bodyWidthInches;
    case "seats":
      return car.seats;
    case "doors":
      return car.doors;
    case "msrp":
      return car.msrp ?? Infinity;
    case "mpgCombined":
      return car.mpgCombined ?? car.mpge ?? 0;
    case "electricRangeMiles":
      return car.electricRangeMiles ?? 0;
    case "driverLegroomInches":
      return car.driverLegroomInches ?? 0;
    case "safetyRating":
      return SAFETY_RATING_ORDER[car.safetyRating ?? "undefined"];
    case "autonomousLevel":
      return AUTONOMOUS_LEVEL_ORDER[car.autonomousLevel ?? "undefined"];
    case "reviewScore":
      return car.reviewScore ?? 0;
    case "heightInches":
      return car.heightInches ?? 0;
    case "groundClearanceInches":
      return car.groundClearanceInches ?? 0;
    case "towingCapacityLbs":
      return car.towingCapacityLbs ?? 0;
    case "cargoVolumesCuFt":
      return car.cargoVolumesCuFt ?? 0;
    case "leaseRating":
      return LEASE_RATING_ORDER[car.leaseRating ?? "undefined"];
    case "depreciationCategory":
      return DEPRECIATION_ORDER[car.depreciationCategory ?? "undefined"];
    case "fiveYearResalePercent":
      return car.fiveYearResalePercent ?? 0;
    case "reliabilityRating":
      return RELIABILITY_ORDER[car.reliabilityRating ?? "undefined"];
    case "insuranceCostAnnual":
      return car.insuranceCostAnnual ?? Infinity;
    case "maintenanceCostAnnual":
      return car.maintenanceCostAnnual ?? Infinity;
    case "zeroToSixtySeconds":
      return car.zeroToSixtySeconds ?? Infinity;
    case "horsepower":
      return car.horsepower ?? 0;
    default:
      return null;
  }
}

function compareSortValues(
  aVal: number | string | null,
  bVal: number | string | null,
  direction: SortDirection
): number {
  if (aVal === null || bVal === null) return 0;

  if (typeof aVal === "string" && typeof bVal === "string") {
    return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  }

  const numA = aVal as number;
  const numB = bVal as number;
  // Guard the equal case explicitly: missing values map to Infinity for some
  // fields, and Infinity - Infinity is NaN, which breaks the comparator.
  if (numA === numB) return 0;
  return direction === "asc" ? numA - numB : numB - numA;
}

export function sortCars(cars: Car[], sortConfig: SortConfig): Car[] {
  return [...cars].sort((a, b) => {
    const primary = compareSortValues(
      getSortValue(a, sortConfig.field),
      getSortValue(b, sortConfig.field),
      sortConfig.direction
    );
    if (primary !== 0) return primary;

    // Ties are common (253 cars share model year 2025), so fall back to a fixed
    // order instead of leaving them in whatever order the dataset happens to use.
    return (
      b.year - a.year ||
      a.make.toLowerCase().localeCompare(b.make.toLowerCase()) ||
      a.model.toLowerCase().localeCompare(b.model.toLowerCase())
    );
  });
}

export function getUniqueMakes(cars: Car[]): string[] {
  return [...new Set(cars.map((c) => c.make))].sort();
}

export function formatCurrency(value: number | undefined): string {
  if (value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMpg(car: Car): string {
  if (car.fuelType === "electric") {
    return car.mpge ? `${car.mpge} MPGe` : "-";
  }
  if (car.mpgCombined) {
    return `${car.mpgCombined} MPG`;
  }
  return "-";
}

export function getEffectiveWidth(car: Car, mirrorBuffer: number): number {
  return car.mirrorWidthInches ?? car.bodyWidthInches + mirrorBuffer;
}

export function calculateDifference(baseline: Car, comparison: Car, field: keyof Car, mirrorBuffer: number): string | null {
  let baseVal: number | undefined;
  let compVal: number | undefined;

  if (field === "bodyWidthInches") {
    baseVal = getEffectiveWidth(baseline, mirrorBuffer);
    compVal = getEffectiveWidth(comparison, mirrorBuffer);
  } else {
    baseVal = baseline[field] as number | undefined;
    compVal = comparison[field] as number | undefined;
  }

  if (baseVal === undefined || compVal === undefined) return null;

  const diff = compVal - baseVal;
  if (diff === 0) return "same";

  const prefix = diff > 0 ? "+" : "";

  if (field === "msrp" || field === "usedPriceLow" || field === "usedPriceHigh") {
    return prefix + formatCurrency(diff);
  }

  return prefix + diff.toFixed(1);
}

export function getCarDisplayName(car: Car): string {
  return `${car.year} ${car.make} ${car.model}${car.trim ? ` ${car.trim}` : ""}`;
}

export function exportToCsv(cars: Car[], mirrorBuffer: number): string {
  const headers = [
    "Year", "Make", "Model", "Trim", "Body Type", "Safety Rating",
    "Seats", "Driver Legroom", "Width (Mirrors Folded)", "Width (Mirrors Extended)", "Body Width",
    "Length", "Height", "Cargo Volume", "Fuel Type", "Plug Type",
    "City MPG", "Highway MPG", "Combined MPG", "MPGe", "EV Range",
    "MSRP", "Used Price Low", "Used Price High",
    "ADAS Level", "ADAS Name", "Hands-Free Driving", "Auto Lane Change",
    "Notes"
  ];

  const rows = cars.map(car => [
    car.year,
    car.make,
    car.model,
    car.trim ?? "",
    car.bodyType,
    car.safetyRating ?? "",
    car.seats,
    car.driverLegroomInches ?? "",
    car.mirrorsFoldedWidthInches ?? "",
    getEffectiveWidth(car, mirrorBuffer).toFixed(1),
    car.bodyWidthInches,
    car.lengthInches ?? "",
    car.heightInches ?? "",
    car.cargoVolumesCuFt ?? "",
    car.fuelType,
    car.plugType === "none" ? "" : car.plugType,
    car.mpgCity ?? "",
    car.mpgHighway ?? "",
    car.mpgCombined ?? "",
    car.mpge ?? "",
    car.electricRangeMiles ?? "",
    car.msrp ?? "",
    car.usedPriceLow ?? "",
    car.usedPriceHigh ?? "",
    car.autonomousLevel ?? "",
    car.adasName ?? "",
    car.adasFeatures?.handsFreeHighway ? "Yes" : "No",
    car.adasFeatures?.autoLaneChange ? "Yes" : "No",
    car.notes ?? ""
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell =>
      typeof cell === "string" && (cell.includes(",") || cell.includes('"'))
        ? `"${cell.replace(/"/g, '""')}"`
        : cell
    ).join(","))
  ].join("\n");

  return csvContent;
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Generate car image URL from imagin.studio API
 * @param car - The car object
 * @param size - Image width in pixels (default: 400)
 * @returns URL string for car image
 */
// IMAGIN.studio account the renders are requested under. The public demo account
// ("img") stamps a large IMAGIN watermark across the middle of every image; that
// watermark is baked into the returned pixels and is only removed by rendering
// under a real account key. Set NEXT_PUBLIC_IMAGIN_CUSTOMER at build time to use
// one — no other code change is needed. See README.md.
const IMAGIN_CUSTOMER = process.env.NEXT_PUBLIC_IMAGIN_CUSTOMER || "img";

// Map fuel type to IMAGIN powerTrain parameter
const IMAGIN_POWERTRAIN: Record<string, string> = {
  electric: "electric",
  hybrid: "hybrid",
  "plug-in-hybrid": "phev",
  gasoline: "petrol",
  diesel: "diesel",
};

export function getCarImageUrl(car: Car, size: number = 400, angle: string = "01"): string {
  const modelFamily = car.model
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const make = car.make.toLowerCase();
  const powerTrain = IMAGIN_POWERTRAIN[car.fuelType] || "";
  // Use CDN load balancing (cdn-01 through cdn-09) based on car id hash
  const cdnNum = ((car.id.charCodeAt(0) + car.id.charCodeAt(car.id.length - 1)) % 9) + 1;
  const cdn = `cdn-0${cdnNum}`;
  const params = new URLSearchParams({
    customer: IMAGIN_CUSTOMER,
    make,
    modelFamily,
    modelYear: String(car.year),
    angle,
    width: String(size),
    zoomType: "fullscreen",
    fileType: "webp",
  });
  if (powerTrain) params.set("powerTrain", powerTrain);
  return `https://${cdn}.imagin.studio/getImage?${params.toString()}`;
}
