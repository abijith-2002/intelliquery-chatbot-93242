import React from "react";

/**
 * MinimalTrashIcon - stroke-only trash bin icon for delete actions.
 * Uses currentColor to inherit text color.
 *
 * @param {Object} props - Component props
 * @param {number} [props.size=16] - Icon size in pixels
 * @param {string} [props.className] - Optional CSS class
 */
// PUBLIC_INTERFACE
function MinimalTrashIcon({ size = 16, className = "" }) {
  /** This is a public function: MinimalTrashIcon renders a thin trash can icon used for delete. */
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
      {/* Lid line */}
      <path
        d="M3 6h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Top section / handle */}
      <path
        d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Body */}
      <path
        d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner lines */}
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default MinimalTrashIcon;
