import { Car, CarFilters, SortConfig, SortField, SortDirection, SafetyRating } from "@/types/car";

// Safety rating order for sorting (higher is better)
const SAFETY_RATING_ORDER: Record<SafetyRating | "undefined", number> = {
  "TSP+": 4,
  "TSP": 3,
  "Good": 2,
  "Acceptable": 1,
  "Not Rated": 0,
  "undefined": -1,
};

export function filterCars(cars: Car[], filters: CarFilters, mirrorBuffer: number): Car[] {
  return cars.filter((car) => {
    // Seats filter
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

    // Width filter (garage fit) - use mirror width if available, otherwise body + buffer
    if (filters.maxWidthInches !== undefined) {
      const effectiveWidth = car.mirrorWidthInches ?? car.bodyWidthInches + mirrorBuffer;
      if (effectiveWidth > filters.maxWidthInches) return false;
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
