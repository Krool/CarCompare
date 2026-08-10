"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Car, CarFilters, SortConfig, SortField, ColumnId, BodyType, FuelType, SafetyRating, AutonomousLevel, PlugType } from "@/types/car";
import carData from "@/data/cars.json";
import FilterControls from "@/components/FilterControls";
import CarTable from "@/components/CarTable";
import BaselineSelector from "@/components/BaselineSelector";
import CompareModal from "@/components/CompareModal";
import ColumnSettings, { ALL_COLUMNS, DEFAULT_VISIBLE_COLUMNS } from "@/components/ColumnSettings";
import SetupWizard from "@/components/SetupWizard";
import { filterCars, sortCars, getUniqueMakes, exportToCsv, downloadCsv, getCarImageUrl, hasVehicleImagery, localDateStamp } from "@/lib/carUtils";
import { EMPTY, bodyTypeLabel, fuelTypeLabel } from "@/lib/labels";
import CarImagePlaceholder from "@/components/CarImagePlaceholder";
import { DEFAULT_BASELINE_ID, DEFAULT_SORT_CONFIG, STORAGE_KEYS, TOAST_DURATION_MS } from "@/lib/constants";
import { readStorage, readStorageJson, writeStorage } from "@/lib/storage";
import { isStringArray, parseFiniteInt, toSortConfig } from "@/lib/validation";

const VALID_COLUMN_IDS = new Set<string>(ALL_COLUMNS.map(c => c.id));

/**
 * Keeps only column ids this build knows about. A stored list can outlive the deploy
 * that wrote it and a link can be hand-edited, and an unknown id reaches the table as
 * a column it cannot render. Falls back to the defaults rather than leaving the user
 * with a table of nothing when every id is rejected.
 */
function sanitizeColumns(ids: string[]): ColumnId[] {
  const valid = ids.filter((id): id is ColumnId => VALID_COLUMN_IDS.has(id));
  return valid.length > 0 ? valid : DEFAULT_VISIBLE_COLUMNS;
}

// btoa throws on any code point above U+00FF, which would take the Share button down
// before its own clipboard error handling ever runs. Percent-encoding first keeps the
// payload inside Latin1. A pure-ASCII payload encodes byte-for-byte identically to a
// bare btoa, so links already in the wild still decode.
function encodeShareState(json: string): string {
  const latin1 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return btoa(latin1);
}

function decodeShareState(encoded: string): string {
  const percentEncoded = atob(encoded)
    .split("")
    .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
    .join("");
  return decodeURIComponent(percentEncoded);
}

export default function Home() {
  const allCars = carData.cars as Car[];
  const defaultMirrorBuffer = carData.mirrorBuffer;

  // Find default baseline (Toyota RAV4 2011)
  const defaultBaseline = allCars.find((c) => c.id === DEFAULT_BASELINE_ID) ?? null;

  const [filters, setFilters] = useState<CarFilters>({});
  // Newest first. Sorting by price ascending made the landing view a wall of
  // 1960s classics listed at their original MSRP (a $3,592 Charger, a $4,900
  // Ferrari 250 GTO) compared against a modern baseline — accurate data, but a
  // meaningless first screen for someone shopping for a car that fits a garage.
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT_CONFIG);
  const [baselineCar, setBaselineCar] = useState<Car | null>(defaultBaseline);
  const [mirrorBuffer, setMirrorBuffer] = useState(defaultMirrorBuffer);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(DEFAULT_VISIBLE_COLUMNS);
  const [showWizard, setShowWizard] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show toast notification
  const showToast = useCallback((message: string, type: "success" | "info" = "info") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  // Load state from localStorage on mount.
  // The hydration logic is extracted into a named function and invoked once,
  // rather than calling the setters directly in the effect body, so the many
  // interdependent setState calls below read as one deliberate synchronization
  // step (URL/localStorage -> React state) instead of ad hoc effect writes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    loadInitialState();

    function loadInitialState() {
    // Check URL for shared state first
    const urlParams = new URLSearchParams(window.location.search);
    const sharedState = urlParams.get("state");

    // Check for new wizard-style URL params (simpler format)
    const urlColumns = urlParams.get("c");
    const urlBodyTypes = urlParams.get("bt");
    const urlFuelTypes = urlParams.get("ft");
    const urlYear = urlParams.get("y");
    const urlSeats = urlParams.get("s");
    const urlPrice = urlParams.get("p");
    const urlSafetyRating = urlParams.get("sr");
    const urlSortField = urlParams.get("sf");
    const urlSortDir = urlParams.get("sd");
    const urlBaseline = urlParams.get("b");

    const hasNewFormatParams = urlColumns || urlBodyTypes || urlFuelTypes || urlYear || urlSeats || urlPrice || urlSafetyRating || urlSortField || urlBaseline;

    // Favorites, the compare list and the baseline belong to the visitor, not to the
    // link they arrived on, so they load on EVERY path. They used to load only in the
    // no-params branch, while the persist effects below fired for all three the moment
    // isInitialized flipped — so opening someone's share link wrote the empty in-memory
    // defaults straight over the recipient's saved data, irrecoverably.
    loadPersistedUserData();

    if (hasNewFormatParams) {
      // Parse new wizard-style URL format
      if (urlColumns) {
        setVisibleColumns(sanitizeColumns(urlColumns.split(",")));
      }

      const newFilters: CarFilters = {};
      if (urlBodyTypes) {
        newFilters.bodyTypes = urlBodyTypes.split(",") as BodyType[];
      }
      if (urlFuelTypes) {
        newFilters.fuelTypes = urlFuelTypes.split(",") as FuelType[];
      }
      if (urlYear) {
        newFilters.minYear = parseFiniteInt(urlYear);
      }
      // The wizard emits minY/maxY/seats/minP/al/hf/mpg/evr/pt/m as well. They were
      // never read here, so a wizard link silently arrived with the right columns and
      // the wrong result set.
      if (urlParams.get("minY")) {
        newFilters.minYear = parseFiniteInt(urlParams.get("minY"));
      }
      if (urlParams.get("maxY")) {
        newFilters.maxYear = parseFiniteInt(urlParams.get("maxY"));
      }
      if (urlSeats) {
        newFilters.minSeats = parseFiniteInt(urlSeats);
      }
      if (urlParams.get("seats")) {
        const seats = urlParams.get("seats")!.split(",").map(parseFiniteInt).filter((n): n is number => n !== undefined);
        if (seats.length > 0) newFilters.seats = seats;
      }
      if (urlParams.get("minP")) {
        newFilters.minPrice = parseFiniteInt(urlParams.get("minP"));
      }
      if (urlPrice) {
        newFilters.maxPrice = parseFiniteInt(urlPrice);
      }
      if (urlSafetyRating) {
        newFilters.safetyRatings = urlSafetyRating.split(",") as SafetyRating[];
      }
      if (urlParams.get("al")) {
        newFilters.autonomousLevels = urlParams.get("al")!.split(",") as AutonomousLevel[];
      }
      if (urlParams.get("hf") === "1") {
        newFilters.hasHandsFree = true;
      }
      if (urlParams.get("mpg")) {
        newFilters.minMpg = parseFiniteInt(urlParams.get("mpg"));
      }
      if (urlParams.get("evr")) {
        newFilters.minEvRange = parseFiniteInt(urlParams.get("evr"));
      }
      if (urlParams.get("pt")) {
        newFilters.plugTypes = urlParams.get("pt")!.split(",") as PlugType[];
      }
      if (urlParams.get("m")) {
        newFilters.makes = urlParams.get("m")!.split(",");
      }
      if (Object.keys(newFilters).length > 0) {
        setFilters(newFilters);
      }

      const urlSort = toSortConfig(urlSortField, urlSortDir);
      if (urlSort) {
        setSortConfig(urlSort);
      }

      if (urlBaseline) {
        const car = allCars.find(c => c.id === urlBaseline);
        if (car) setBaselineCar(car);
      }

      // Mark wizard as seen and don't show it
      writeStorage(STORAGE_KEYS.hasSeenWizard, "true");

      // The params are deliberately left in place; the URL-sync effect rewrites them
      // into the canonical ?state= form once hydration finishes.
      setIsInitialized(true);
      return;
    } else if (sharedState) {
      try {
        const decoded = JSON.parse(decodeShareState(sharedState));
        // Support both old format (filters, sort, baseline, compare, columns) and new short format (f, s, b, c, v)
        const filters = decoded.f || decoded.filters;
        const sort = decoded.s || decoded.sort;
        const baseline = "b" in decoded ? decoded.b : decoded.baseline;
        const compare = decoded.c || decoded.compare;
        const columns = decoded.v || decoded.columns;

        // Everything below is attacker-authored: validate before it becomes state.
        // An unchecked value reaches the renderer typed but wrong (`{"v":1}` makes
        // visibleColumns.includes() throw), and there is no error boundary to catch it.
        if (filters && typeof filters === "object" && !Array.isArray(filters)) setFilters(filters);
        if (sort) {
          // Handle new format [field, isDesc] or old format {field, direction}
          const decodedSort = Array.isArray(sort)
            ? toSortConfig(sort[0], sort[1] ? "desc" : "asc")
            : toSortConfig(sort?.field, sort?.direction);
          if (decodedSort) setSortConfig(decodedSort);
        }
        if (baseline === null) {
          setBaselineCar(null);
        } else if (typeof baseline === "string") {
          const car = allCars.find(c => c.id === baseline);
          if (car) setBaselineCar(car);
        }
        // A shared compare list replaces the visitor's own; ids are resolved against
        // the dataset so a stale or invented id cannot linger and jam the 4-car cap.
        if (isStringArray(compare)) {
          setCompareList(compare.filter(id => allCars.some(c => c.id === id)));
        }
        if (isStringArray(columns)) setVisibleColumns(sanitizeColumns(columns));
        if (typeof decoded.q === "string") {
          setSearchInput(decoded.q);
          setSearchQuery(decoded.q);
        }
      } catch (e) {
        console.error("Failed to parse shared state:", e);
      }
      setIsInitialized(true);
      return;
    } else {
      const savedFilters = readStorageJson(STORAGE_KEYS.filters, (v): v is CarFilters =>
        typeof v === "object" && v !== null && !Array.isArray(v));
      if (savedFilters) setFilters(savedFilters);

      const savedColumns = readStorageJson(STORAGE_KEYS.columns, isStringArray);
      if (savedColumns) setVisibleColumns(sanitizeColumns(savedColumns));

      // Check if first-time user (no wizard seen)
      if (!readStorage(STORAGE_KEYS.hasSeenWizard)) {
        setShowWizard(true);
      }
    }

    setIsInitialized(true);
    }

    /** Visitor-owned state, orthogonal to whatever a share link carries. */
    function loadPersistedUserData() {
      const savedFavorites = readStorageJson(STORAGE_KEYS.favorites, isStringArray);
      if (savedFavorites) setFavorites(savedFavorites);

      // The garage measurement is the visitor's own; no link format carries it.
      const savedBuffer = parseFiniteInt(readStorage(STORAGE_KEYS.mirrorBuffer));
      if (savedBuffer !== undefined) setMirrorBuffer(savedBuffer);

      const savedCompareList = readStorageJson(STORAGE_KEYS.compareList, isStringArray);
      if (savedCompareList) setCompareList(savedCompareList);

      const savedBaseline = readStorage(STORAGE_KEYS.baseline);
      if (savedBaseline === "") {
        setBaselineCar(null);
      } else if (savedBaseline) {
        const car = allCars.find(c => c.id === savedBaseline);
        if (car) setBaselineCar(car);
      }
    }
  }, [allCars]);

  // Save favorites to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    writeStorage(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites, isInitialized]);

  // Save filters to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    writeStorage(STORAGE_KEYS.filters, JSON.stringify(filters));
  }, [filters, isInitialized]);

  // Save mirror buffer to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    writeStorage(STORAGE_KEYS.mirrorBuffer, mirrorBuffer.toString());
  }, [mirrorBuffer, isInitialized]);

  // Save baseline to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    // "" records a deliberately cleared baseline, which an absent key cannot express —
    // it would be indistinguishable from a first visit. Clearing the baseline used to
    // write nothing at all, so the old car came back on the next reload.
    writeStorage(STORAGE_KEYS.baseline, baselineCar?.id ?? "");
  }, [baselineCar, isInitialized]);

  // Save columns to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    writeStorage(STORAGE_KEYS.columns, JSON.stringify(visibleColumns));
  }, [visibleColumns, isInitialized]);

  // Save compare list to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    writeStorage(STORAGE_KEYS.compareList, JSON.stringify(compareList));
  }, [compareList, isInitialized]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const availableMakes = useMemo(() => getUniqueMakes(allCars), [allCars]);

  const filteredCars = useMemo(() => {
    let cars = filterCars(allCars, filters, mirrorBuffer);

    // Apply favorites filter
    if (filters.showFavoritesOnly) {
      cars = cars.filter(car => favorites.includes(car.id));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      cars = cars.filter(car => {
        const searchString = `${car.year} ${car.make} ${car.model} ${car.trim ?? ""} ${car.bodyType} ${car.fuelType}`.toLowerCase();
        return searchString.includes(query);
      });
    }

    return cars;
  }, [allCars, filters, mirrorBuffer, favorites, searchQuery]);

  const sortedCars = useMemo(() => {
    return sortCars(filteredCars, sortConfig);
  }, [filteredCars, sortConfig]);

  const carsToCompare = useMemo(() => {
    return allCars.filter(car => compareList.includes(car.id));
  }, [allCars, compareList]);

  const handleSortChange = useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const toggleFavorite = useCallback((carId: string) => {
    setFavorites(prev =>
      prev.includes(carId)
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  }, []);

  const toggleCompare = useCallback((carId: string) => {
    setCompareList(prev => {
      if (prev.includes(carId)) {
        const next = prev.filter(id => id !== carId);
        if (next.length === 0) setShowCompareModal(false);
        return next;
      }
      // Limit to 4 cars for comparison
      if (prev.length >= 4) {
        showToast("Maximum 4 cars for comparison", "info");
        return prev;
      }
      // Show helpful toast for first car
      if (prev.length === 0) {
        showToast("Car added to compare. Select more to compare side-by-side!", "success");
      } else if (prev.length === 1) {
        showToast("Click Compare button in header to view side-by-side", "info");
      }
      return [...prev, carId];
    });
  }, [showToast]);

  const removeFromCompare = useCallback((carId: string) => {
    setCompareList(prev => {
      const next = prev.filter(id => id !== carId);
      // The modal renders on `showCompareModal && carsToCompare.length > 0`, so emptying
      // the list here only hides it while leaving the flag set — and it would then spring
      // open unbidden the next time any car was ticked.
      if (next.length === 0) setShowCompareModal(false);
      return next;
    });
  }, []);

  const handleExportCsv = useCallback(() => {
    const csv = exportToCsv(sortedCars, mirrorBuffer);
    downloadCsv(csv, `car-compare-${localDateStamp()}.csv`);
  }, [sortedCars, mirrorBuffer]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /**
   * The current view as a query string, or "" when nothing differs from the defaults.
   *
   * Only non-default values are encoded, so an untouched app keeps a bare URL and a
   * shared one stays as short as the view is unusual. Favorites are deliberately absent:
   * they are the visitor's own, not part of the view being shared.
   */
  const shareQuery = useMemo(() => {
    const state: Record<string, unknown> = {};

    // Only add filters if there are any active
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true))
    );
    if (Object.keys(activeFilters).length > 0) state.f = activeFilters;

    // Only add sort if not default
    if (sortConfig.field !== DEFAULT_SORT_CONFIG.field || sortConfig.direction !== DEFAULT_SORT_CONFIG.direction) {
      state.s = [sortConfig.field, sortConfig.direction === "desc" ? 1 : 0];
    }

    // null is encoded explicitly: "the sharer deliberately compares against nothing" is
    // a different view from "the sharer left it alone", and omitting it handed the
    // recipient their own default baseline back.
    if (baselineCar === null) state.b = null;
    else if (baselineCar.id !== DEFAULT_BASELINE_ID) state.b = baselineCar.id;

    // Only add compare list if not empty
    if (compareList.length > 0) state.c = compareList;

    // Only add columns if different from default (compare sorted arrays)
    const defaultCols = [...DEFAULT_VISIBLE_COLUMNS].sort();
    const currentCols = [...visibleColumns].sort();
    if (JSON.stringify(defaultCols) !== JSON.stringify(currentCols)) {
      state.v = visibleColumns;
    }

    if (searchQuery.trim()) state.q = searchQuery.trim();

    return Object.keys(state).length > 0
      ? `?state=${encodeShareState(JSON.stringify(state))}`
      : "";
  }, [filters, sortConfig, baselineCar, compareList, visibleColumns, searchQuery]);

  // Keep the address bar in step with the view, so copying the URL out of the browser
  // is exactly as good as pressing Share. The app used to strip its params immediately
  // after reading them, which meant the location never described what you were looking
  // at and the Share button was the only way to capture it.
  //
  // replaceState, not pushState: nudging a filter should not bury the previous page
  // under dozens of history entries. It also runs only after hydration, so it cannot
  // clobber the very params it is about to read.
  useEffect(() => {
    if (!isInitialized) return;
    const next = `${window.location.pathname}${shareQuery}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [shareQuery, isInitialized]);

  const handleShareUrl = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}${shareQuery}`;

    navigator.clipboard.writeText(url).then(() => {
      showToast("Share link copied to clipboard!", "success");
    }).catch(() => {
      // Clipboard unavailable or permission denied. Say so before falling back to the
      // prompt, so the browser dialog is explained rather than appearing unbidden.
      showToast("Couldn't copy automatically — copy the link from the dialog", "info");
      prompt("Copy this link to share:", url);
    });
  }, [shareQuery, showToast]);

  const handleWizardComplete = useCallback((settings: {
    columns: ColumnId[];
    baseline: Car | null;
    filters: {
      bodyTypes?: BodyType[];
      fuelTypes?: FuelType[];
      minYear?: number;
      maxYear?: number;
      minSeats?: number;
      seats?: number[];
      minPrice?: number;
      maxPrice?: number;
      safetyRatings?: SafetyRating[];
      autonomousLevels?: AutonomousLevel[];
      hasHandsFree?: boolean;
      minMpg?: number;
      minEvRange?: number;
      plugTypes?: PlugType[];
      makes?: string[];
    };
    sortConfig?: { field: SortField; direction: "asc" | "desc" };
  }) => {
    setVisibleColumns(settings.columns);
    if (settings.baseline) {
      setBaselineCar(settings.baseline);
    }
    // Apply ALL filters from wizard, replacing any existing filters
    setFilters({
      bodyTypes: settings.filters.bodyTypes,
      fuelTypes: settings.filters.fuelTypes,
      minYear: settings.filters.minYear,
      maxYear: settings.filters.maxYear,
      minSeats: settings.filters.minSeats,
      seats: settings.filters.seats,
      minPrice: settings.filters.minPrice,
      maxPrice: settings.filters.maxPrice,
      safetyRatings: settings.filters.safetyRatings,
      autonomousLevels: settings.filters.autonomousLevels,
      hasHandsFree: settings.filters.hasHandsFree,
      minMpg: settings.filters.minMpg,
      minEvRange: settings.filters.minEvRange,
      plugTypes: settings.filters.plugTypes,
      makes: settings.filters.makes,
    });
    if (settings.sortConfig) {
      setSortConfig(settings.sortConfig);
    }
    writeStorage(STORAGE_KEYS.hasSeenWizard, "true");
    setShowWizard(false);
  }, []);

  const handleWizardSkip = useCallback(() => {
    writeStorage(STORAGE_KEYS.hasSeenWizard, "true");
    setShowWizard(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 relative">
      {/* Ambient background glow */}
      <div className="ambient-glow" />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-gray-950 focus:rounded focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* ── Header ── */}
      {/* z-20 keeps the header above <main>: it is a stacking context, so the
          Columns dropdown inside it cannot escape the header's own layer and
          would otherwise be painted underneath the table. */}
      <header className="relative z-20 border-b border-gray-800/80 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Logo mark */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <svg className="w-5 h-5 text-gray-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2M5 17l-1 2m15-2l1 2" />
                <circle cx="7.5" cy="17" r="1" fill="currentColor" />
                <circle cx="16.5" cy="17" r="1" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-gradient-gold">Car</span>
                <span className="text-white">Compare</span>
              </h1>
              <p className="text-gray-400 text-xs tracking-wide uppercase mt-0.5">
                Find the perfect car for your garage
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {compareList.length > 0 && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="btn-accent px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-bounce-once"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare ({compareList.length})
              </button>
            )}
            <ColumnSettings
              visibleColumns={visibleColumns}
              onColumnsChange={setVisibleColumns}
            />
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/50 rounded-lg text-sm font-medium btn-hover no-print transition-colors"
              title="Export filtered results to CSV"
            >
              Export
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/50 rounded-lg text-sm font-medium btn-hover no-print transition-colors"
              title="Print current view"
            >
              Print
            </button>
            <button
              onClick={handleShareUrl}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/50 rounded-lg text-sm font-medium btn-hover no-print transition-colors"
              title="Copy shareable link with current filters"
            >
              Share
            </button>
            {/* Secondary, like its neighbours. Gold used to make re-running
                onboarding the loudest action in the header. */}
            <button
              onClick={() => setShowWizard(true)}
              className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/50 rounded-lg text-sm font-medium btn-hover no-print transition-colors"
              title="Run the quick setup wizard"
            >
              Setup
            </button>
          </div>
        </div>
        {/* Accent line */}
        <div className="header-accent-line mt-5 -mx-6" />
      </header>

      {/* Print-only header - hidden on screen */}
      <div className="hidden print:block print-header">
        <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-4">
          <div>
            <h1 className="text-2xl font-bold">CarCompare Vehicle List</h1>
            <p className="text-sm text-gray-500">
              Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{sortedCars.length} vehicles</p>
            {baselineCar && (
              <p className="text-sm">Baseline: {baselineCar.year} {baselineCar.make} {baselineCar.model}</p>
            )}
          </div>
        </div>
        <div className="text-xs mb-4 print-filters">
          <span className="font-semibold">Filters: </span>
          {(() => {
            const activeFilters: string[] = [];
            if (filters.minYear || filters.maxYear) activeFilters.push(`Year: ${filters.minYear || "any"}-${filters.maxYear || "any"}`);
            if (filters.minPrice || filters.maxPrice) activeFilters.push(`Price: $${filters.minPrice?.toLocaleString() || "0"}-$${filters.maxPrice?.toLocaleString() || "any"}`);
            if (filters.bodyTypes?.length) activeFilters.push(`Type: ${filters.bodyTypes.join(", ")}`);
            if (filters.fuelTypes?.length) activeFilters.push(`Fuel: ${filters.fuelTypes.join(", ")}`);
            if (filters.safetyRatings?.length) activeFilters.push(`Safety: ${filters.safetyRatings.join(", ")}`);
            if (filters.minSeats) activeFilters.push(`${filters.minSeats}+ seats`);
            if (filters.maxWidthInches) activeFilters.push(`Max width: ${filters.maxWidthInches}"`);
            if (filters.maxLengthInches) activeFilters.push(`Max length: ${filters.maxLengthInches}"`);
            if (filters.minEvRange) activeFilters.push(`EV range: ${filters.minEvRange}+ mi`);
            if (searchQuery) activeFilters.push(`Search: "${searchQuery}"`);
            return activeFilters.length > 0 ? activeFilters.join(" | ") : "None";
          })()}
        </div>
      </div>

      <main id="main-content" className="relative z-10 p-6">
        {/*
          The split happens at `md` (768px), not `lg` (1024px). Below the
          breakpoint the sidebar stacks ABOVE the results, so the baseline
          panel plus five filter accordions pushed the first car roughly two
          screens down — which is what every tablet and small laptop saw.
        */}
        <div className="flex flex-col md:flex-row gap-6 md:h-[calc(100dvh-11rem)] md:min-h-[32rem]">
          {/* Sidebar. Sticky and independently scrollable on desktop: with 400+
              rows it otherwise scrolled away on the first flick. */}
          <aside className="md:w-72 lg:w-80 flex-shrink-0 space-y-4 no-print md:overflow-y-auto md:pr-1 md:pb-2">
            <BaselineSelector
              cars={allCars}
              baselineCar={baselineCar}
              onBaselineChange={setBaselineCar}
              mirrorBuffer={mirrorBuffer}
            />
            <FilterControls
              filters={filters}
              onFiltersChange={setFilters}
              availableMakes={availableMakes}
              hasFavorites={favorites.length > 0}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 md:flex md:flex-col md:min-h-0">
            <div className="mb-4 space-y-3 md:flex-shrink-0">
              {/* Search box */}
              <div className="relative">
                <label htmlFor="car-search" className="sr-only">Search cars</label>
                <input
                  id="car-search"
                  type="text"
                  placeholder="Search cars (e.g., Toyota, SUV, 2025, hybrid...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 bg-gray-900/80 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <p className="text-gray-400 text-sm" aria-live="polite" role="status">
                    <span className="text-white font-medium tabular-nums">{sortedCars.length}</span>
                    <span className="text-gray-400"> of </span>
                    <span className="tabular-nums">{allCars.length}</span>
                    <span className="text-gray-400"> vehicles</span>
                  </p>
                  {favorites.length > 0 && (
                    <span className="text-amber-400 text-sm flex items-center gap-1">
                      <span className="text-amber-500">★</span> {favorites.length}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs font-mono tracking-wide">
                  Updated {carData.lastSyncDate}
                </p>
              </div>
            </div>

            {/* Narrow screens: card view */}
            <div className="block md:hidden">
              <MobileCardView
                cars={sortedCars}
                baselineCar={baselineCar}
                mirrorBuffer={mirrorBuffer}
                favorites={favorites}
                compareList={compareList}
                onToggleFavorite={toggleFavorite}
                onToggleCompare={toggleCompare}
                onSelectBaseline={setBaselineCar}
                sortField={sortConfig?.field}
                sortDirection={sortConfig?.direction}
                onSortChange={handleSortChange}
              />
            </div>

            {/* Desktop: Table view */}
            <div className="hidden md:flex md:flex-col md:flex-1 md:min-h-0">
              <CarTable
                cars={sortedCars}
                sortConfig={sortConfig}
                onSortChange={handleSortChange}
                baselineCar={baselineCar}
                mirrorBuffer={mirrorBuffer}
                onSelectBaseline={setBaselineCar}
                compareList={compareList}
                onToggleCompare={toggleCompare}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                visibleColumns={visibleColumns}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Print-only footer */}
      <div className="hidden print:block print-footer">
        <p>CarCompare - krool.github.io/CarCompare</p>
      </div>

      <footer className="relative z-10 border-t border-gray-800/50 px-6 py-5 mt-12">
        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-500 text-xs text-center tracking-wide">
            Data sourced from manufacturer specifications. Prices and availability may vary.
          </p>
          <p className="text-gray-500 text-xs">
            Part of{' '}
            <a
              href="https://krool.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-500 transition-colors inline-flex items-center gap-1"
            >
              Krool World
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </p>
        </div>
      </footer>

      {/* Compare Modal */}
      {showCompareModal && carsToCompare.length > 0 && (
        <CompareModal
          cars={carsToCompare}
          onClose={() => setShowCompareModal(false)}
          onRemoveCar={removeFromCompare}
          mirrorBuffer={mirrorBuffer}
        />
      )}

      {/* Setup Wizard for first-time users */}
      {showWizard && (
        <SetupWizard
          cars={allCars}
          onComplete={handleWizardComplete}
          onSkip={handleWizardSkip}
        />
      )}

      {/* Toast Notification */}
      <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50">
      {toast && (
        <div className="animate-slide-up">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 backdrop-blur-lg ${
            toast.type === "success"
              ? "bg-emerald-900/80 text-emerald-100 border border-emerald-700/50"
              : "bg-gray-800/90 text-gray-100 border border-gray-700/50"
          }`}>
            {toast.type === "success" ? (
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Mobile Card View Component
function MobileCardView({
  cars,
  baselineCar,
  mirrorBuffer,
  favorites,
  compareList,
  onToggleFavorite,
  onToggleCompare,
  onSelectBaseline,
  sortField,
  sortDirection,
  onSortChange,
}: {
  cars: Car[];
  baselineCar: Car | null;
  mirrorBuffer: number;
  favorites: string[];
  compareList: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onSelectBaseline: (car: Car) => void;
  sortField?: SortField;
  sortDirection?: "asc" | "desc";
  onSortChange?: (field: SortField) => void;
}) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(20);

  // Reset visible count when cars list changes (e.g., filter change).
  // Adjusted during render (React's recommended pattern for derived state resets)
  // instead of an effect, to avoid an extra commit/re-render.
  const [prevCarsLength, setPrevCarsLength] = useState(cars.length);
  if (cars.length !== prevCarsLength) {
    setPrevCarsLength(cars.length);
    setVisibleCount(20);
  }

  const toggleExpanded = (carId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(carId)) {
        next.delete(carId);
      } else {
        next.add(carId);
      }
      return next;
    });
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined) return EMPTY;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const sortOptions: { field: SortField; label: string }[] = [
    { field: "msrp", label: "Price" },
    { field: "year", label: "Year" },
    { field: "safetyRating", label: "Safety" },
    { field: "mpgCombined", label: "MPG" },
  ];

  if (cars.length === 0) {
    return (
      <div className="surface-elevated rounded-xl p-10 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="w-10 h-10 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-base font-medium text-gray-300 mb-1">No cars match your filters</p>
          <p className="text-sm text-gray-500">Try expanding your search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile Sort Controls */}
      {onSortChange && (
        <div className="surface-elevated rounded-xl p-3 flex items-center gap-2 flex-wrap">
          <span className="text-gray-500 text-xs uppercase tracking-wider">Sort</span>
          {sortOptions.map(opt => (
            <button
              key={opt.field}
              onClick={() => onSortChange(opt.field)}
              aria-pressed={sortField === opt.field}
              aria-label={sortField === opt.field ? `Sort by ${opt.label}, ${sortDirection === "asc" ? "ascending" : "descending"}` : `Sort by ${opt.label}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                sortField === opt.field
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-gray-800/50 text-gray-400 border border-gray-700/30"
              }`}
            >
              {opt.label}
              {sortField === opt.field && (
                <span className="text-amber-500" aria-hidden="true">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {cars.slice(0, visibleCount).map((car) => {
        const isBaseline = baselineCar?.id === car.id;
        const isFavorite = favorites.includes(car.id);
        const isInCompare = compareList.includes(car.id);
        const effectiveWidth = car.mirrorWidthInches ?? car.bodyWidthInches + mirrorBuffer;
        const isExpanded = expandedCards.has(car.id);

        return (
          <div
            key={car.id}
            className={`surface-elevated rounded-xl p-4 transition-shadow ${
              isBaseline ? "ring-1 ring-amber-500/40 shadow-lg shadow-amber-900/10" : isFavorite ? "ring-1 ring-amber-500/20" : ""
            }`}
          >
            <div className="flex gap-4">
              {/* This card list is `block md:hidden` — rendered on every device and only
                  hidden by CSS. Without loading="lazy", React hoists a <link rel="preload">
                  for each visible card, so desktop visitors eagerly fetched 20 images they
                  never see, at preload priority. */}
              {hasVehicleImagery(car) ? (
                <img
                  src={getCarImageUrl(car, 200)}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="w-32 h-20 object-cover rounded-lg"
                  loading="lazy"
                />
              ) : (
                <CarImagePlaceholder className="w-32 h-20 shrink-0" label={bodyTypeLabel(car.bodyType)} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-semibold text-sm">
                      {car.year} {car.make} {car.model}
                    </h3>
                    {car.trim && <p className="text-gray-400 text-xs">{car.trim}</p>}
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => onToggleFavorite(car.id)}
                      className={`text-lg transition-colors ${isFavorite ? "text-amber-400" : "text-gray-700 hover:text-amber-400"}`}
                      aria-label={isFavorite ? `Remove ${car.year} ${car.make} ${car.model} from favorites` : `Add ${car.year} ${car.make} ${car.model} to favorites`}
                      aria-pressed={isFavorite}
                    >
                      <span aria-hidden="true">★</span>
                    </button>
                    <input
                      type="checkbox"
                      checked={isInCompare}
                      onChange={() => onToggleCompare(car.id)}
                      className="w-4 h-4"
                      aria-label={isInCompare ? `Remove ${car.year} ${car.make} ${car.model} from comparison` : `Add ${car.year} ${car.make} ${car.model} to comparison`}
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="badge badge-neutral">{bodyTypeLabel(car.bodyType)}</span>
                  <span className="badge badge-neutral">{car.seats} seats</span>
                  {car.safetyRating && car.safetyRating !== "Not Rated" && (
                    <span className="badge badge-good">{car.safetyRating}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <span className="text-gray-400 text-xs">MSRP</span>
                <span className="text-white ml-2 tabular-nums">{formatCurrency(car.msrp)}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Width</span>
                <span className="text-white ml-2 tabular-nums">{effectiveWidth.toFixed(1)}&quot;</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Legroom</span>
                <span className="text-white ml-2 tabular-nums">{car.driverLegroomInches ? `${car.driverLegroomInches}"` : EMPTY}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs">MPG</span>
                <span className="text-white ml-2 tabular-nums">
                  {car.mpgCombined ?? car.mpge ?? EMPTY}{car.mpge ? " MPGe" : ""}
                </span>
              </div>
            </div>

            {/* Expanded specs section */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm animate-fadeIn">
                <div>
                  <span className="text-gray-400 text-xs">Length</span>
                  <span className="text-white ml-2 tabular-nums">{car.lengthInches ? `${car.lengthInches}"` : EMPTY}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Height</span>
                  <span className="text-white ml-2 tabular-nums">{car.heightInches ? `${car.heightInches}"` : EMPTY}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Clearance</span>
                  <span className="text-white ml-2 tabular-nums">{car.groundClearanceInches ? `${car.groundClearanceInches}"` : EMPTY}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Cargo</span>
                  <span className="text-white ml-2 tabular-nums">{car.cargoVolumesCuFt ? `${car.cargoVolumesCuFt} cu ft` : EMPTY}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Fuel</span>
                  <span className="text-white ml-2">{fuelTypeLabel(car.fuelType)}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">EV Range</span>
                  <span className="text-white ml-2 tabular-nums">{car.electricRangeMiles ? `${car.electricRangeMiles} mi` : EMPTY}</span>
                </div>
                {car.adasFeatures?.autoFoldingMirrors && (
                  <div className="col-span-2">
                    <span className="text-emerald-400 text-xs">✓ Auto-Folding Mirrors</span>
                  </div>
                )}
              </div>
            )}

            {/* "More specs" is what people came for, so it takes the width.
                Setting a baseline is a niche action and used to occupy ~85% of
                the row purely because it was the flex-1 button. */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => toggleExpanded(car.id)}
                aria-expanded={isExpanded}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-800 text-gray-200 hover:text-white border border-gray-700/50 transition-colors"
              >
                {isExpanded ? "Fewer specs" : "More specs"}
              </button>
              <button
                onClick={() => onSelectBaseline(car)}
                aria-pressed={isBaseline}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isBaseline
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-gray-800 text-gray-400 border border-gray-700/50 hover:text-white"
                }`}
              >
                {isBaseline ? "✓ Baseline" : "Set baseline"}
              </button>
            </div>
          </div>
        );
      })}

      {visibleCount < cars.length && (
        <button
          onClick={() => setVisibleCount(prev => Math.min(prev + 20, cars.length))}
          className="w-full py-3 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-700/30 rounded-xl text-sm font-medium transition-colors"
        >
          Show More ({cars.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
}
