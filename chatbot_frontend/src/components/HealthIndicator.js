import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './HealthIndicator.css';

/**
 * PUBLIC_INTERFACE
 * HealthIndicator
 * A small, non-intrusive health icon that reflects backend health.
 * Clicking the icon opens a modal allowing the user to view/change the API base URL.
 *
 * Persistence:
 * - Uses localStorage key 'apiBaseUrl' to persist the configured base URL.
 *
 * Health check logic:
 * - Attempts to ping these endpoints in order: /health, /docs, /
 * - On 200 OK, status is considered healthy.
 * - Network error or non-OK marks unhealthy.
 */
export default function HealthIndicator({ defaultBaseUrl }) {
  const LOCAL_STORAGE_KEY = 'apiBaseUrl';
  const [baseUrl, setBaseUrl] = useState(() => {
    // Read stored value or fall back to provided default or origin
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored || defaultBaseUrl || window.location.origin.replace(/\/$/, '');
  });
  const [status, setStatus] = useState('unknown'); // 'healthy' | 'unhealthy' | 'unknown'
  const [open, setOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(baseUrl);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [lastEndpoint, setLastEndpoint] = useState(null);

  // Persist current baseUrl
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, baseUrl);
    } catch {
      // ignore storage errors
    }
  }, [baseUrl]);

  const endpoints = useMemo(() => ['/health', '/docs', '/'], []);

  const doHealthCheck = useCallback(async (url) => {
    const clean = (url || baseUrl || '').replace(/\/$/, '');
    setChecking(true);
    try {
      let ok = false;
      let endpointUsed = null;

      // Try endpoints in order
      for (const ep of endpoints) {
        const full = `${clean}${ep}`;
        endpointUsed = ep;
        try {
          const res = await fetch(full, { method: 'GET', mode: 'cors' });
          if (res.ok) {
            ok = true;
            break;
          }
        } catch (e) {
          // Continue trying next endpoint
        }
      }

      setStatus(ok ? 'healthy' : 'unhealthy');
      setLastEndpoint(endpointUsed);
      setLastChecked(new Date());
    } finally {
      setChecking(false);
    }
  }, [baseUrl, endpoints]);

  // Initial check and periodic refresh
  useEffect(() => {
    doHealthCheck();
    const id = setInterval(() => doHealthCheck(), 30000); // every 30s
    return () => clearInterval(id);
  }, [doHealthCheck]);

  const statusClass = status === 'healthy' ? 'healthy' : status === 'unhealthy' ? 'unhealthy' : 'unknown';
  const statusLabel = status === 'healthy' ? 'Healthy' : status === 'unhealthy' ? 'Unhealthy' : 'Unknown';

  const onOpen = () => {
    setTempUrl(baseUrl);
    setOpen(true);
  };

  const onSave = async () => {
    const normalized = (tempUrl || '').trim().replace(/\/$/, '');
    if (!normalized) return;
    setBaseUrl(normalized);
    setOpen(false);
    await doHealthCheck(normalized);
  };

  const onTest = async () => {
    const normalized = (tempUrl || '').trim().replace(/\/$/, '');
    await doHealthCheck(normalized || baseUrl);
  };

  const onBackdrop = (e) => {
    if (e.target.classList.contains('health-modal-backdrop')) {
      setOpen(false);
    }
  };

  return (
    <>
      <div className="health-indicator-wrapper">
        <span className={`health-dot ${statusClass}`} aria-label={`Backend status: ${statusLabel}`}></span>
        <button className="health-button" onClick={onOpen} title="Backend settings">
          ⚙️
        </button>
        <span className="health-tooltip">{statusLabel}</span>
      </div>

      {open && (
        <div className="health-modal-backdrop" onMouseDown={onBackdrop} role="dialog" aria-modal="true">
          <div className="health-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="health-modal-header">
              <div className="health-modal-title">Backend configuration</div>
              <button className="health-modal-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="health-modal-body">
              <div className="health-field">
                <label htmlFor="apiBaseUrl">API Base URL</label>
                <div className="health-input-row">
                  <input
                    id="apiBaseUrl"
                    className="health-input"
                    type="text"
                    placeholder="https://your-backend.example.com"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                  />
                </div>
                <div className="small-muted">
                  Health check tries <span className="health-endpoint">/health</span>, then <span className="health-endpoint">/docs</span>, then <span className="health-endpoint">/</span>.
                </div>
              </div>
              <div className="health-status-line">
                <span className={`health-dot ${statusClass}`}></span>
                <span>Status: {statusLabel}{checking ? ' (checking...)' : ''}</span>
              </div>
              <div className="small-muted">
                {lastChecked && (
                  <>Last checked: {lastChecked.toLocaleTimeString()} {lastEndpoint ? `(endpoint: ${lastEndpoint})` : ''}</>
                )}
              </div>
            </div>
            <div className="health-actions">
              <button className="health-btn secondary" onClick={onTest} disabled={checking}>
                Test
              </button>
              <button className="health-btn primary" onClick={onSave} disabled={checking}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
