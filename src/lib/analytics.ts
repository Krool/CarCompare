// Google Analytics event tracking utilities

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

// Car Compare specific events
export const Analytics = {
  // Track when user compares cars
  carCompared: (carIds: string[]) => {
    trackEvent("car_compared", {
      car_count: carIds.length,
      car_ids: carIds.join(","),
    });
  },

  // Track when user sets a baseline car
  baselineSet: (carId: string, carName: string) => {
    trackEvent("baseline_set", {
      car_id: carId,
      car_name: carName,
    });
  },

  // Track filter usage
  filterApplied: (filterType: string, value: string | number | string[]) => {
    trackEvent("filter_applied", {
      filter_type: filterType,
      filter_value: Array.isArray(value) ? value.join(",") : value,
    });
  },

  // Track CSV export
  csvExported: (carCount: number) => {
    trackEvent("csv_exported", {
      car_count: carCount,
    });
  },

  // Track car favorited
  carFavorited: (carId: string, isFavorite: boolean) => {
    trackEvent("car_favorited", {
      car_id: carId,
      action: isFavorite ? "add" : "remove",
    });
  },

  // Track search
  searchPerformed: (query: string, resultCount: number) => {
    trackEvent("search", {
      search_term: query,
      result_count: resultCount,
    });
  },
};
