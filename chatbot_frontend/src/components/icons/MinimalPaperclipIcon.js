import React from "react";

/**
 * MinimalPaperclipIcon - a modern, minimal, stroke-only paperclip icon.
 * Uses currentColor for stroke, matching surrounding text color.
 *
 * @param {Object} props - Component props
 * @param {number} [props.size=18] - Icon size in pixels
 * @param {string} [props.className] - Optional CSS class for styling
 */
// PUBLIC_INTERFACE
function MinimalPaperclipIcon({ size = 18, className = "" }) {
  /** This is a public function: renders a clean, outline paperclip icon for attachment actions. */
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Based on a classic paperclip shape, tuned for a light, minimal stroke */}
      <path
        d="M21 7.5l-9.6 9.6a5 5 0 0 1-7.07-7.07L13.76 0.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 9.5l-9.6 9.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MinimalPaperclipIcon;
