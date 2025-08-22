import React from "react";

/**
 * MinimalLogoutIcon - stroke-only logout icon (door with arrow).
 * Uses currentColor to inherit surrounding color for a minimal dark theme.
 *
 * @param {Object} props
 * @param {number} [props.size=18] - Icon size in pixels
 * @param {string} [props.className] - Optional CSS class for styling
 */
// PUBLIC_INTERFACE
function MinimalLogoutIcon({ size = 18, className = "" }) {
  /** This is a public function: renders a clean logout icon for the header action. */
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Door rectangle */}
      <path
        d="M13 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow pointing right */}
      <path
        d="M10 12h10M16 8l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MinimalLogoutIcon;
