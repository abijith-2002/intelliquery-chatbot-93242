import React, { useEffect } from 'react';
import './NotificationToaster.css';

// PUBLIC_INTERFACE
/**
 * NotificationToaster - displays ephemeral toast notifications.
 *
 * Props:
 * @param {Array<{id: string|number, type: 'success'|'error'|'info', message: string}>} notifications - List of toasts to render
 * @param {(id: string|number) => void} onDismiss - Dismiss handler for a toast id
 */
function NotificationToaster({ notifications = [], onDismiss }) {
  useEffect(() => {
    // No-op: auto-dismiss logic should be managed by parent so timers survive re-renders
  }, [notifications]);

  if (!Array.isArray(notifications) || notifications.length === 0) {
    return null;
  }

  return (
    <div className="toaster-container" aria-live="polite" aria-atomic="true">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`toast ${n.type || 'info'}`}
          role="status"
          aria-label={n.type === 'error' ? 'Error notification' : 'Notification'}
        >
          <div className="toast-content">
            <span className="toast-icon" aria-hidden="true">
              {n.type === 'success' ? '✔' : n.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="toast-message">{n.message}</span>
          </div>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => onDismiss && onDismiss(n.id)}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationToaster;
