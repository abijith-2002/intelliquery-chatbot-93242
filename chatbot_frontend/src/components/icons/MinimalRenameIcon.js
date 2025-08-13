import React from "react";

/**
 * MinimalRenameIcon - stroke-only pencil (edit) icon for rename actions.
 * Uses currentColor to inherit text color.
 *
 * @param {Object} props - Component props
 * @param {number} [props.size=16] - Icon size in pixels
 * @param {string} [props.className] - Optional CSS class
 */
// PUBLIC_INTERFACE
function MinimalRenameIcon({ size = 16, className = "" }) {
  /** This is a public function: MinimalRenameIcon renders a thin pencil icon used for rename. */
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
      {/* Pencil body (diagonal) */}
      <path
        d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0-2.12-2.12L5.88 17.88L4 20z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pencil cap / hint of shape */}
      <path
        d="M14.5 5.5l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MinimalRenameIcon;
