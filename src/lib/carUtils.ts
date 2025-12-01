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

    // Width filter (garage fit) - can filter by folded or extended width
    if (filters.maxWidthInches !== undefined) {
      const widthType = filters.widthFilterType ?? "extended";
      let widthToCheck: number;
      if (widthType === "folded") {
        widthToCheck = car.mirrorsFoldedWidthInches ?? car.bodyWidthInches + 2;
      } else {
        widthToCheck = car.mirrorWidthInches ?? car.bodyWidthInches + mirrorBuffer;
      }
      if (widthToCheck > filters.maxWidthInches) return false;
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

    // Safety rating filter
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

    // Review score filter
    if (filters.minReviewScore !== undefined) {
      if (!car.reviewScore || car.reviewScore < filters.minReviewScore) {
        return false;
      }
    }

    return true;
  });
}

export function sortCars(cars: Car[], sortConfig: SortConfig): Car[] {
  const sorted = [...cars].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    switch (sortConfig.field) {
      case "year":
        aVal = a.year;
        bVal = b.year;
        break;
      case "make":
        aVal = a.make.toLowerCase();
        bVal = b.make.toLowerCase();
        break;
      case "model":
        aVal = a.model.toLowerCase();
        bVal = b.model.toLowerCase();
        break;
      case "bodyType":
        aVal = a.bodyType.toLowerCase();
        bVal = b.bodyType.toLowerCase();
        break;
      case "bodyWidthInches":
        aVal = a.mirrorWidthInches ?? a.bodyWidthInches;
        bVal = b.mirrorWidthInches ?? b.bodyWidthInches;
        break;
      case "mirrorsFoldedWidthInches":
        aVal = a.mirrorsFoldedWidthInches ?? a.bodyWidthInches;
        bVal = b.mirrorsFoldedWidthInches ?? b.bodyWidthInches;
        break;
      case "seats":
        aVal = a.seats;
        bVal = b.seats;
        break;
      case "doors":
        aVal = a.doors;
        bVal = b.doors;
        break;
      case "msrp":
        aVal = a.msrp ?? Infinity;
        bVal = b.msrp ?? Infinity;
        break;
      case "mpgCombined":
        aVal = a.mpgCombined ?? a.mpge ?? 0;
        bVal = b.mpgCombined ?? b.mpge ?? 0;
        break;
      case "electricRangeMiles":
        aVal = a.electricRangeMiles ?? 0;
        bVal = b.electricRangeMiles ?? 0;
        break;
      case "driverLegroomInches":
        aVal = a.driverLegroomInches ?? 0;
        bVal = b.driverLegroomInches ?? 0;
        break;
      case "safetyRating":
        aVal = SAFETY_RATING_ORDER[a.safetyRating ?? "undefined"];
        bVal = SAFETY_RATING_ORDER[b.safetyRating ?? "undefined"];
        break;
      case "autonomousLevel":
        aVal = AUTONOMOUS_LEVEL_ORDER[a.autonomousLevel ?? "undefined"];
        bVal = AUTONOMOUS_LEVEL_ORDER[b.autonomousLevel ?? "undefined"];
        break;
      case "reviewScore":
        aVal = a.reviewScore ?? 0;
        bVal = b.reviewScore ?? 0;
        break;
      case "heightInches":
        aVal = a.heightInches ?? 0;
        bVal = b.heightInches ?? 0;
        break;
      case "groundClearanceInches":
        aVal = a.groundClearanceInches ?? 0;
        bVal = b.groundClearanceInches ?? 0;
        break;
      case "leaseRating":
        aVal = LEASE_RATING_ORDER[a.leaseRating ?? "undefined"];
        bVal = LEASE_RATING_ORDER[b.leaseRating ?? "undefined"];
        break;
      case "depreciationCategory":
        aVal = DEPRECIATION_ORDER[a.depreciationCategory ?? "undefined"];
        bVal = DEPRECIATION_ORDER[b.depreciationCategory ?? "undefined"];
        break;
      case "fiveYearResalePercent":
        aVal = a.fiveYearResalePercent ?? 0;
        bVal = b.fiveYearResalePercent ?? 0;
        break;
      case "reliabilityRating":
        aVal = RELIABILITY_ORDER[a.reliabilityRating ?? "undefined"];
        bVal = RELIABILITY_ORDER[b.reliabilityRating ?? "undefined"];
        break;
      case "insuranceCostAnnual":
        aVal = a.insuranceCostAnnual ?? Infinity;
        bVal = b.insuranceCostAnnual ?? Infinity;
        break;
      case "maintenanceCostAnnual":
        aVal = a.maintenanceCostAnnual ?? Infinity;
        bVal = b.maintenanceCostAnnual ?? Infinity;
        break;
      case "zeroToSixtySeconds":
        aVal = a.zeroToSixtySeconds ?? Infinity;
        bVal = b.zeroToSixtySeconds ?? Infinity;
        break;
      case "horsepower":
        aVal = a.horsepower ?? 0;
        bVal = b.horsepower ?? 0;
        break;
      default:
        return 0;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortConfig.direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    const numA = aVal as number;
    const numB = bVal as number;
    return sortConfig.direction === "asc" ? numA - numB : numB - numA;
  });

  return sorted;
}

export function getUniqueMakes(cars: Car[]): string[] {
  return [...new Set(cars.map((c) => c.make))].sort();
}

export function formatCurrency(value: number | undefined): string {
  if (value === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMpg(car: Car): string {
  if (car.fuelType === "electric") {
    return car.mpge ? `${car.mpge} MPGe` : "N/A";
  }
  if (car.mpgCombined) {
    return `${car.mpgCombined} MPG`;
  }
  return "N/A";
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
