import React, { useEffect, useState, useRef } from 'react';
import './OnlineStatus.css';

/**
 * PUBLIC_INTERFACE
 * OnlineStatus
 * A small status indicator dot that reflects backend reachability.
 * - Polls the backend health endpoint periodically (default 5s)
 * - Shows green when reachable, red when unreachable, and gray when idle/loading
 *
 * Props:
 * - apiBaseUrl?: string        Optional override for API base url; defaults to process.env.REACT_APP_API_BASE_URL
 * - intervalMs?: number        Polling interval in milliseconds (default 5000)
 */
function OnlineStatus({ apiBaseUrl, intervalMs = 5000 }) {
  /** This is a public function: OnlineStatus shows backend health in the header. */
  const API_BASE_URL = apiBaseUrl || process.env.REACT_APP_API_BASE_URL || 'https://vscode-internal-32892-beta.beta01.cloud.kavia.ai:3001';
  const HEALTH_ENDPOINT = `${API_BASE_URL}/`; // FastAPI health endpoint defined at "/"

  const [status, setStatus] = useState('idle'); // 'idle' | 'online' | 'offline' | 'checking'
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  async function checkHealth() {
    // Show checking state briefly
    setStatus((prev) => (prev === 'online' || prev === 'offline' ? prev : 'checking'));
    try {
      abortRef.current?.abort?.();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        // Avoid caching so we get fresh status
        cache: 'no-store',
        signal: controller.signal,
      });

      if (res.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (e) {
      setStatus('offline');
    }
  }

  useEffect(() => {
    // Initial ping
    checkHealth();

    // Polling loop
    timerRef.current = window.setInterval(checkHealth, Math.max(2000, intervalMs));

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      abortRef.current?.abort?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL, intervalMs]);

  const title =
    status === 'online'
      ? 'Backend: Online'
      : status === 'offline'
      ? 'Backend: Offline'
      : 'Backend: Checking…';

  return (
    <div className="online-status" role="status" aria-live="polite" title={title} aria-label={title}>
      <span className={`status-dot ${status}`} />
    </div>
  );
}

export default OnlineStatus;
