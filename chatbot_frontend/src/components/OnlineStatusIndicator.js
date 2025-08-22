import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './OnlineStatusIndicator.css';
import ModalDialog from './ModalDialog';
import { getApiBase, setApiBase, shouldAskForPersistence } from '../utils/apiBase';

/**
 * PUBLIC_INTERFACE
 * OnlineStatusIndicator
 * A minimal, reusable component that periodically checks the backend API root ('/') to determine online status.
 * - Uses session-scoped API base via getApiBase() (falls back to REACT_APP_API_BASE_URL).
 * - Polls every `intervalMs` milliseconds (default: 5000ms).
 * - Renders a small circular indicator and an adjacent pill with status text:
 *   - green for Online, red for Offline, grey for Unknown.
 * - Click the indicator area to open a dialog to change the API base URL for the current session.
 *
 * Props:
 * - intervalMs?: number - polling interval in milliseconds (default 5000)
 * - className?: string - optional className for container
 * - style?: React.CSSProperties - optional inline styles for container
 */
export default function OnlineStatusIndicator({ intervalMs = 5000, className = '', style = {} }) {
  const [online, setOnline] = useState(null); // null = unknown, true = online, false = offline
  const [open, setOpen] = useState(false);
  const [currentBase, setCurrentBase] = useState(getApiBase());
  const [pingKey, setPingKey] = useState(0); // trigger re-poll on base change

  // Normalize base and generate ping URL
  const pingUrl = useMemo(() => `${(currentBase || '').replace(/\/*$/, '')}/`, [currentBase]);

  useEffect(() => {
    let isMounted = true;
    let pollTimer = null;

    const checkStatus = async () => {
      try {
        const resp = await fetch(pingUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });
        if (!isMounted) return;
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
    // Depend on interval and pingUrl so changes to base trigger new polling target
  }, [intervalMs, pingUrl, pingKey]);

  const statusClass = online === null ? 'status-unknown' : online ? 'status-online' : 'status-offline';
  const statusText = online === null ? 'Unknown' : online ? 'Online' : 'Offline';

  const title =
    online === null
      ? `Status: unknown (${currentBase || 'no base set'})`
      : online
      ? `Backend: online (${currentBase || 'no base set'})`
      : `Backend: offline (${currentBase || 'no base set'})`;

  const handleOpen = useCallback(() => {
    setCurrentBase(getApiBase());
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  const handleConfirm = useCallback((value) => {
    // Normalize and save with chosen persistence
    const next = (value || '').trim().replace(/\/*$/, '');
    if (!next) {
      setApiBase('');
      setCurrentBase('');
      setPingKey((k) => k + 1);
      setOpen(false);
      return;
    }

    let persist = undefined;
    try {
      if (shouldAskForPersistence()) {
        // Ask once if user wants to keep this for future sessions
        const yes = window.confirm('Do you want to remember this API URL for future sessions? Click OK to save in your browser, or Cancel to use for this session only.');
        persist = yes ? 'local' : 'session';
      } else {
        // If already had a saved preference, default to session unless user already has local saved
        persist = 'session';
      }
    } catch {
      persist = 'session';
    }

    setApiBase(next, { persist });
    setCurrentBase(next);
    // Trigger a re-poll
    setPingKey((k) => k + 1);
    setOpen(false);
  }, []);

  return (
    <>
      <div
        className={`online-status-indicator clickable ${className}`}
        style={style}
        title={`${title}\nClick to change API base URL`}
        aria-label={title}
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        {/* Unified pill that contains both the dot and the text */}
        <span className={`status-pill ${statusClass}`}>
          <span className="status-dot" aria-hidden="true" />
          <span className="status-text">{statusText}</span>
        </span>
      </div>

      <ModalDialog
        open={open}
        title="Change Backend API Base URL"
        description="Enter the base URL for the backend API. This will be used for requests in this session only."
        variant="prompt"
        defaultValue={currentBase}
        confirmText="Save"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </>
  );
}
