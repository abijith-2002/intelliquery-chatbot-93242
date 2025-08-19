import React from "react";

/**
 * MinimalPaperclipIcon - a modern, minimal, stroke-only paperclip icon.
 * Uses currentColor for stroke, matching surrounding text color.
 *
 * Props:
 *  - size: pixel size for width/height of the SVG viewport (default 18)
 *  - className: optional CSS class to pass through for styling
 *  - strokeWidth: stroke thickness, defaults to 1.75 for crisp minimal look
 */
// PUBLIC_INTERFACE
function MinimalPaperclipIcon({ size = 18, className = "", strokeWidth = 1.75 }) {
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
      style={{ display: 'block' }} /* ensure mathematical centering within container */
    >
      {/* Feather-like balanced paperclip path for visual centering */}
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.88 16.17a2 2 0 01-2.83-2.83l8.49-8.49"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MinimalPaperclipIcon;
