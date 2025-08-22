import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

/**
 * ApiBaseUrlContext provides a globally accessible, mutable API base URL so that
 * the frontend can dynamically switch backend endpoints without a page reload.
 */
const ApiBaseUrlContext = createContext({
  baseUrl: '',
  setBaseUrl: (_url) => {},
});

// PUBLIC_INTERFACE
export const ApiBaseUrlProvider = ({ children, initialUrl }) => {
  /**
   * Provider that keeps current API base URL in React state and offers an update method.
   * initialUrl is typically sourced from REACT_APP_API_BASE_URL.
   */
  const [baseUrl, setBaseUrlState] = useState(() => {
    // Prefer a previously saved value (user override), else the provided initialUrl.
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('api_base_url') : null;
    return saved || initialUrl || '';
  });

  const setBaseUrl = useCallback((nextUrl) => {
    setBaseUrlState(nextUrl);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('api_base_url', nextUrl);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const value = useMemo(() => ({ baseUrl, setBaseUrl }), [baseUrl, setBaseUrl]);

  return <ApiBaseUrlContext.Provider value={value}>{children}</ApiBaseUrlContext.Provider>;
};

// PUBLIC_INTERFACE
export const useApiBaseUrl = () => {
  /**
   * Hook to access and update the current API base URL.
   * Returns: { baseUrl: string, setBaseUrl: (url: string) => void }
   */
  const ctx = useContext(ApiBaseUrlContext);
  if (!ctx) {
    throw new Error('useApiBaseUrl must be used within ApiBaseUrlProvider');
  }
  return ctx;
};
