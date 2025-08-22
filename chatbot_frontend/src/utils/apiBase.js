//
// API Base URL manager for current browser session.
//
// This module provides a session-scoped, in-memory override for the backend API base URL.
// It falls back to process.env.REACT_APP_API_BASE_URL if no override is set.
// Use getApiBase() for reads and setApiBase() for writes in runtime.
// Not persisted across reloads (session-only).
//

let apiBaseOverride = null;

// PUBLIC_INTERFACE
export function getApiBase() {
  /** Returns the current API base URL (override if present, else env default). */
  if (typeof apiBaseOverride === 'string' && apiBaseOverride.trim().length > 0) {
    return apiBaseOverride.trim().replace(/\/+$/, '');
  }
  const envBase = process.env.REACT_APP_API_BASE_URL || '';
  return (envBase || '').trim().replace(/\/+$/, '');
}

// PUBLIC_INTERFACE
export function setApiBase(newBase) {
  /** Sets an in-memory override for the API base URL for the current session. */
  if (typeof newBase !== 'string') {
    apiBaseOverride = '';
    return;
  }
  apiBaseOverride = newBase.trim().replace(/\/+$/, '');
}

// PUBLIC_INTERFACE
export function clearApiBaseOverride() {
  /** Clears the in-memory API base URL override, falling back to env on next get. */
  apiBaseOverride = null;
}
