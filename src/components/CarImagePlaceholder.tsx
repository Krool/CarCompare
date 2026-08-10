import React from "react";

/**
 * Silhouette shown when a car render is unavailable.
 *
 * Replaces the single capital letter ("S" for suv) that used to stand in — a
 * consistent shape reads as "no photo" rather than as a typo.
 *
 * Renders a <span>, not a <div>: one call site is inside the table's model
 * <button>, whose content model is phrasing content only.
 */
const CarImagePlaceholder = React.memo(function CarImagePlaceholder({
  className = "",
  label,
}: { className?: string; label?: string }) {
  return (
    <span
      className={`bg-gray-800/40 border border-gray-700/30 rounded-lg flex items-center justify-center text-gray-600 ${className}`}
      title={label}
    >
      <svg className="w-1/3 h-1/3 min-w-4 min-h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2" />
        <circle cx="7.5" cy="17" r="1" fill="currentColor" />
        <circle cx="16.5" cy="17" r="1" fill="currentColor" />
      </svg>
      <span className="sr-only">No image available</span>
    </span>
  );
});

export default CarImagePlaceholder;
