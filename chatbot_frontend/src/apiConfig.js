 /**
  * Centralized mutable API configuration for the frontend.
  * Allows runtime updates of the API base URL without page reload.
  * Persists the override to localStorage so user choice survives reloads in-session.
  */

const ENV_DEFAULT_BASE = process.env.REACT_APP_API_BASE_URL || '';

const STORAGE_KEY = 'api_base_url_override';

let currentBaseUrl = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && typeof saved === 'string' && saved.trim().length > 0) {
      return saved.trim().replace(/\/+$/, '');
    }
  } catch (_) {}
  const env = (ENV_DEFAULT_BASE || '').trim();
  return env ? env.replace(/\/+$/, '') : '';
})();

/**
 * Basic URL validation allowing http(s) and optional port/path.
 */
function isValidBaseUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the current API base URL used by the app. */
  return currentBaseUrl;
}

// PUBLIC_INTERFACE
export function setApiBaseUrl(nextUrl) {
  /** Sets a new API base URL at runtime. Persists to localStorage if valid. */
  const trimmed = (nextUrl || '').trim().replace(/\/+$/, '');
  if (!isValidBaseUrl(trimmed)) {
    throw new Error('Invalid URL. Please provide a valid http(s) URL.');
  }
  currentBaseUrl = trimmed;
  try {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } catch (_) {}
  return currentBaseUrl;
}

// PUBLIC_INTERFACE
export function clearApiBaseUrlOverride() {
  /** Clears the saved override and reverts to env default (if any). */
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
  currentBaseUrl = (ENV_DEFAULT_BASE || '').trim().replace(/\/+$/, '');
  return currentBaseUrl;
}

// PUBLIC_INTERFACE
export async function apiFetch(path, options = {}) {
  /**
   * Fetch convenience method that prefixes current base URL.
   * Example: apiFetch('/chat', { method: 'POST', body: ... })
   */
  const base = getApiBaseUrl();
  const full = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  return fetch(full, options);
}
