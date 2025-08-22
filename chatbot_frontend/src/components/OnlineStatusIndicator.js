import React, { useEffect, useState } from 'react';
import './OnlineStatusIndicator.css';

/**
 * PUBLIC_INTERFACE
 * OnlineStatusIndicator
 * A minimal, reusable component that periodically checks the backend API root ('/') to determine online status.
 * - Uses REACT_APP_API_BASE_URL as the base URL, defaulting to '' if not provided.
 * - Polls every `intervalMs` milliseconds (default: 5000ms).
 * - Renders a small circular indicator: green when online, red when offline, with a tooltip title.
 *
 * Props:
 * - intervalMs?: number - polling interval in milliseconds (default 5000)
 * - className?: string - optional className for container
 * - style?: React.CSSProperties - optional inline styles for container
 */
export default function OnlineStatusIndicator({ intervalMs = 5000, className = '', style = {} }) {
  const [online, setOnline] = useState(null); // null = unknown, true = online, false = offline

  useEffect(() => {
    let isMounted = true;
    let pollTimer = null;

    const baseUrl = process.env.REACT_APP_API_BASE_URL || '';
    const url = `${baseUrl.replace(/\/+$/, '')}/`;

    const checkStatus = async () => {
      try {
        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        if (!isMounted) return;
        // consider any 2xx as online
        setOnline(resp.ok);
      } catch (e) {
        if (!isMounted) return;
        setOnline(false);
      }
    };

    // Initial check immediately
    checkStatus();

    // Setup interval
    pollTimer = setInterval(checkStatus, Math.max(1000, intervalMs));

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [intervalMs]);

  const statusClass =
    online === null ? 'status-unknown' : online ? 'status-online' : 'status-offline';

  const title =
    online === null ? 'Status: unknown' : online ? 'Backend: online' : 'Backend: offline';

  return (
    <div className={`online-status-indicator ${className}`} style={style} title={title} aria-label={title}>
      <span className={`status-dot ${statusClass}`} />
    </div>
  );
}
