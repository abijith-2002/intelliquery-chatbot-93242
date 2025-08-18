import React from "react";

/**
 * MinimalAttachmentIcon - a clean, line-only paperclip icon for attachments.
 * Uses stroke-only paths with currentColor so it inherits surrounding color.
 *
 * @param {Object} props - Component props
 * @param {number} [props.size=18] - Icon size in pixels
 * @param {string} [props.className] - Optional CSS class
 */
// PUBLIC_INTERFACE
function MinimalAttachmentIcon({ size = 18, className = "" }) {
  /** This is a public function: renders a minimal outline paperclip icon. */
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
      {/* Single path clip shape */}
      <path
        d="M21 8.5L11.2 18.3a5 5 0 0 1-7.07-7.07l9.1-9.1a3.5 3.5 0 1 1 4.95 4.95l-9.1 9.1a2 2 0 1 1-2.83-2.83L14.2 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MinimalAttachmentIcon;
