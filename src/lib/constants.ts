import type { SortConfig } from "@/types/car";

// UI timing constants
export const TOAST_DURATION_MS = 3000;

// Sort defaults — newest model year first, so the table opens on current-year
// cars instead of the classics that happen to carry the lowest MSRP.
export const DEFAULT_SORT_CONFIG: SortConfig = { field: "year", direction: "desc" };

// Image API constants
export const IMAGE_SIZES = {
  thumbnail: 150,
  card: 300,
  default: 400,
  large: 800,
} as const;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 50;

// LocalStorage keys
export const STORAGE_KEYS = {
  favorites: "carcompare_favorites",
  filters: "carcompare_filters",
  mirrorBuffer: "carcompare_mirrorBuffer",
  baseline: "carcompare_baseline",
  columns: "carcompare_columns",
  compareList: "carcompare_compareList",
  hasSeenWizard: "carcompare_hasSeenWizard",
} as const;

// Filter defaults
export const PRICE_PRESETS = [40000, 50000, 60000, 80000] as const;
export const MPG_PRESETS = [25, 30, 40, 50] as const;
export const EV_RANGE_PRESETS = [200, 250, 300, 350] as const;
