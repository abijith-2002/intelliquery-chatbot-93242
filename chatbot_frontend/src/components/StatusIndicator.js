import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './StatusIndicator.css';
import ModalDialog from './ModalDialog';

/**
 * Helper to read and persist API base URL.
 */
function getStoredApiBaseUrl() {
  try {
    const v = localStorage.getItem('api_base_url');
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  } catch {}
  // Fallback to env var if nothing stored
  return process.env.REACT_APP_API_BASE_URL || '';
}

function setStoredApiBaseUrl(url) {
  try {
    localStorage.setItem('api_base_url', url);
  } catch {}
}

// PUBLIC_INTERFACE
/**
 * StatusIndicator
 * Minimal health status indicator that pings the backend root path using
 * the configured base URL. Clicking lets the user update the base URL via a dialog.
 *
 * Props:
 * - intervalMs?: number (default 5000)
 */
function StatusIndicator({ intervalMs = 5000 }) {
  /** This is a public function: renders a circular indicator reflecting backend health and allows editing API base URL. */
  const [apiBaseUrl, setApiBaseUrl] = useState(getStoredApiBaseUrl);
  const [online, setOnline] = useState(null); // null = unknown, true = ok, false = offline
  const [lastError, setLastError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const controllerRef = useRef(null);

  const healthUrl = useMemo(() => {
    const base = (apiBaseUrl || '').replace(/\/+$/g, '');
    return base ? `${base}/` : '/';
  }, [apiBaseUrl]);

  const checkHealth = useCallback(async () => {
    // Cancel any in-flight check
    if (controllerRef.current) {
      try { controllerRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const res = await fetch(healthUrl, { signal: controller.signal, headers: { Accept: 'application/json,text/plain,*/*' } });
      if (!res.ok) {
        setOnline(false);
        setLastError(`HTTP ${res.status}`);
        return;
      }
      setOnline(true);
      setLastError('');
    } catch (e) {
      setOnline(false);
      setLastError(e && e.message ? e.message : 'Network error');
    }
  }, [healthUrl]);

  // Initial and periodic health checks
  useEffect(() => {
    let mounted = true;
    (async () => {
      await checkHealth();
    })();
    const id = window.setInterval(() => {
      if (!mounted) return;
      checkHealth();
    }, Math.max(1500, intervalMs || 0));
    return () => {
      mounted = false;
      window.clearInterval(id);
      if (controllerRef.current) {
        try { controllerRef.current.abort(); } catch {}
      }
    };
  }, [checkHealth, intervalMs]);

  const colorClass = online == null ? 'unknown' : online ? 'online' : 'offline';
  const title = online == null
    ? `Checking backend … (${healthUrl})`
    : online
      ? `Backend online (${healthUrl})`
      : `Backend offline (${healthUrl})${lastError ? ` - ${lastError}` : ''}`;

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);

  const handleConfirmDialog = (newUrl) => {
    // sanitize and persist
    const trimmed = (newUrl || '').trim();
    if (trimmed.length === 0) return;
    setApiBaseUrl(trimmed);
    setStoredApiBaseUrl(trimmed);
    setDialogOpen(false);
    // Immediately re-check with new URL
    setOnline(null);
    checkHealth();
  };

  // Clicking should open dialog; keyboard accessible.
  return (
    <div className="status-indicator-wrapper">
      <button
        type="button"
        className={`status-indicator ${colorClass}`}
        aria-label={title}
        title={title}
        onClick={handleOpenDialog}
      >
        <span className="dot" aria-hidden="true" />
        <span className="status-text">
          {online == null ? 'Checking' : online ? 'Online' : 'Offline'}
        </span>
      </button>

      <ModalDialog
        open={dialogOpen}
        title="Backend API Base URL"
        description="Enter the base URL to use for the backend. Example: https://your-host:3001"
        variant="prompt"
        defaultValue={apiBaseUrl}
        confirmText="Save"
        cancelText="Cancel"
        onConfirm={handleConfirmDialog}
        onClose={handleCloseDialog}
      />
    </div>
  );
}

export default StatusIndicator;
