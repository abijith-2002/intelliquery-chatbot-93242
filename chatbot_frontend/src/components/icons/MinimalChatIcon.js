import React from "react";

/**
 * MinimalChatIcon - a modern, minimal, line-based chat bubble icon.
 * Designed to be unobtrusive and fit a dark, minimal theme.
 * Uses stroke-only SVG with currentColor so it adapts to the surrounding color.
 */
// PUBLIC_INTERFACE
function MinimalChatIcon({ size = 24, className = "", title = "App Icon" }) {
  /** This is a public function: MinimalChatIcon renders the app's line icon. */
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
      <title>{title}</title>
      {/* Outer rounded bubble */}
      <rect
        x="3"
        y="4"
        width="18"
        height="13"
        rx="4"
        ry="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      {/* Bubble tail */}
      <path
        d="M8 17l-3 3v-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Subtle typing dots */}
      <circle cx="9" cy="10.5" r="1" fill="currentColor" />
      <circle cx="12" cy="10.5" r="1" fill="currentColor" />
      <circle cx="15" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}

export default MinimalChatIcon;
