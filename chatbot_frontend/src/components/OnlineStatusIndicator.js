import React, { useEffect, useMemo, useState, useCallback } from 'react';
import './OnlineStatusIndicator.css';
import ModalDialog from './ModalDialog';
import { apiFetch, getApiBaseUrl, setApiBaseUrl, clearApiBaseUrlOverride } from '../apiConfig';

// PUBLIC_INTERFACE
function OnlineStatusIndicator() {
  /** 
   * Minimal online/offline indicator that:
   * - Polls the backend "/" endpoint every 10 seconds to determine health.
   * - Shows a green dot if online (200 OK), red if offline.
   * - On click, opens a modal dialog to view/edit API base URL at runtime.
   */
  const [online, setOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(getApiBaseUrl());
  const [inputError, setInputError] = useState('');

  const poll = useCallback(async () => {
    try {
      const res = await apiFetch('/');
      setOnline(res.ok);
    } catch {
      setOnline(false);
    } finally {
      setLastChecked(Date.now());
    }
  }, []);

  useEffect(() => {
    // initial ping
    poll();
    const id = window.setInterval(poll, 10000);
    return () => window.clearInterval(id);
  }, [poll]);

  // keep input synced when dialog opens in case URL changed elsewhere
  useEffect(() => {
    if (open) setInputValue(getApiBaseUrl());
  }, [open]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setInputError('');
  };

  const dotTitle = useMemo(() => {
    const base = getApiBaseUrl() || '(not set)';
    const when = lastChecked ? new Date(lastChecked).toLocaleTimeString() : 'never';
    return `${online ? 'Online' : 'Offline'} • Base: ${base} • Last check: ${when}`;
  }, [online, lastChecked]);

  const handleSave = useCallback(() => {
    const raw = (inputValue || '').trim();
    // Allow clearing override by leaving blank? Requirement asks to view/edit current config.
    // We'll require a valid http(s) URL. Provide a reset button to revert to env.
    try {
      const updated = setApiBaseUrl(raw);
      setInputError('');
      setOpen(false);
      // Immediately re-poll using new URL so indicator reflects state quickly
      poll();
    } catch (e) {
      setInputError(e.message || 'Invalid URL');
    }
  }, [inputValue, poll]);

  const handleResetToEnv = useCallback(() => {
    clearApiBaseUrlOverride();
    setInputValue(getApiBaseUrl());
    setInputError('');
    // re-poll
    poll();
  }, [poll]);

  return (
    <>
      <button
        type="button"
        className={`online-indicator ${online ? 'online' : 'offline'}`}
        onClick={handleOpen}
        aria-label={online ? 'Backend online. Click to configure API base URL.' : 'Backend offline. Click to configure API base URL.'}
        title={dotTitle}
      >
        <span className="sr-only">{online ? 'Online' : 'Offline'}</span>
      </button>

      <ModalDialog
        open={open}
        title="API Base URL"
        description="Set the base URL for the backend API. This will be used for future requests without reloading the page."
        variant="confirm"
        confirmText="Save"
        cancelText="Close"
        onConfirm={handleSave}
        onClose={handleClose}
      >
        {/* children are not supported by ModalDialog currently, so we render fields using a compatible approach below */}
      </ModalDialog>

      {/* Since ModalDialog currently doesn't accept children, overlay a simple inline dialog using the same styling */}
      {open && (
        <div className="inline-config-panel" role="dialog" aria-modal="true" aria-labelledby="api-config-title">
          <div className="config-card">
            <h3 id="api-config-title" className="config-title">API Base URL</h3>
            <p className="config-desc">Enter a full http(s) URL to your FastAPI backend. Example: https://your-domain.com:3001</p>
            <div className="config-field">
              <label htmlFor="api-base-url-input">Base URL</label>
              <input
                id="api-base-url-input"
                type="url"
                placeholder="https://host:port"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={`config-input ${inputError ? 'error' : ''}`}
              />
              {inputError && <div className="config-error" role="alert">{inputError}</div>}
            </div>
            <div className="config-actions">
              <button type="button" className="config-btn secondary" onClick={handleResetToEnv} title="Revert to .env default">
                Reset to ENV
              </button>
              <div className="spacer" />
              <button type="button" className="config-btn" onClick={handleSave}>
                Save
              </button>
              <button type="button" className="config-btn ghost" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OnlineStatusIndicator;
