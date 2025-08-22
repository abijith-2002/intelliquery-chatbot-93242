/**
 * API Base URL manager for current browser session and optional persistence.
 *
 * This module centralizes how the frontend determines which backend base URL to use.
 * It supports:
 *  - In-memory overrides for the current runtime session
 *  - sessionStorage persistence (current browser tab/session)
 *  - localStorage persistence (across reloads and new sessions)
 *  - Fallback to REACT_APP_API_BASE_URL from the build env
 *
 * Usage:
 *  - getApiBase(): string
 *  - setApiBase(newBase: string, { persist?: 'session' | 'local' } = {}): void
 *  - clearApiBaseOverride(): void
 *  - clearApiBasePersistence(): void
 *  - shouldAskForPersistence(): boolean
 */

// Storage keys
const SESSION_KEY = 'api_base_url_session';
const LOCAL_KEY = 'api_base_url_local';

// In-memory runtime override
let apiBaseOverride = null;

// Try initializing from persisted storage
try {
  const s = typeof window !== 'undefined' ? window.sessionStorage?.getItem(SESSION_KEY) : null;
  const l = typeof window !== 'undefined' ? window.localStorage?.getItem(LOCAL_KEY) : null;
  apiBaseOverride = (s && s.trim()) || (l && l.trim()) || null;
} catch {
  apiBaseOverride = null;
}

function normalize(v) {
  return typeof v === 'string' ? v.trim().replace(/\/*$/, '') : '';
}

// PUBLIC_INTERFACE
export function getApiBase() {
  /** Returns the current API base URL using memory, sessionStorage, localStorage, then env default. */
  if (apiBaseOverride && apiBaseOverride.trim().length > 0) {
    return normalize(apiBaseOverride);
  }
  try {
    const s = typeof window !== 'undefined' ? window.sessionStorage?.getItem(SESSION_KEY) : null;
    if (s && s.trim().length > 0) return normalize(s);
  } catch {}
  try {
    const l = typeof window !== 'undefined' ? window.localStorage?.getItem(LOCAL_KEY) : null;
    if (l && l.trim().length > 0) return normalize(l);
  } catch {}
  const envBase = process.env.REACT_APP_API_BASE_URL || '';
  return normalize(envBase || '');
}

// PUBLIC_INTERFACE
export function setApiBase(newBase, options = {}) {
  /**
   * Sets the API base URL override.
   * @param {string} newBase - New base URL.
   * @param {{persist?: 'session'|'local'}} options - Persistence preference.
   */
  const normalized = normalize(newBase);
  apiBaseOverride = normalized;

  const persist = options?.persist;
  try {
    if (persist === 'session') {
      window.sessionStorage?.setItem(SESSION_KEY, normalized);
    } else if (persist === 'local') {
      window.localStorage?.setItem(LOCAL_KEY, normalized);
      // Clear session key to avoid dual precedence confusion
      window.sessionStorage?.removeItem(SESSION_KEY);
    } else {
      // Memory only; clear session key to avoid stale values
      window.sessionStorage?.removeItem(SESSION_KEY);
      // Do not touch local key to preserve user's prior explicit choice
    }
  } catch {
    // Ignore storage failures; memory override suffices for this session
  }
}

// PUBLIC_INTERFACE
export function clearApiBaseOverride() {
  /** Clears the in-memory API base URL override (keeps persisted values if any). */
  apiBaseOverride = null;
}

// PUBLIC_INTERFACE
export function clearApiBasePersistence() {
  /** Clears both session and local persisted API base URL values. */
  try {
    window.sessionStorage?.removeItem(SESSION_KEY);
  } catch {}
  try {
    window.localStorage?.removeItem(LOCAL_KEY);
  } catch {}
}

// PUBLIC_INTERFACE
export function shouldAskForPersistence() {
  /**
   * Helper to decide whether to ask the user to persist choice.
   * Returns true if there is no localStorage value yet.
   */
  try {
    const existing = typeof window !== 'undefined' ? window.localStorage?.getItem(LOCAL_KEY) : null;
    return !existing;
  } catch {
    return false;
  }
}
