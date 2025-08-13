import React from "react";

/**
 * MinimalCopyIcon - stroke-only "copy" icon.
 * Uses currentColor to inherit surrounding color.
 *
 * @param {Object} props
 * @param {number} [props.size=16] - Icon size in pixels
 * @param {string} [props.className] - Optional CSS class
 */
// PUBLIC_INTERFACE
function MinimalCopyIcon({ size = 16, className = "" }) {
  /** This is a public function: MinimalCopyIcon renders a lightweight copy icon for controls. */
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
      {/* Back sheet */}
      <rect
        x="7"
        y="7"
        width="12"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* Front sheet */}
      <rect
        x="4"
        y="3"
        width="12"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default MinimalCopyIcon;
