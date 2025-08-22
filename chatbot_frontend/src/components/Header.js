import React from 'react';
import './Header.css';
import MinimalChatIcon from './icons/MinimalChatIcon';
import OnlineStatusIndicator from './OnlineStatusIndicator';

/**
 * Header component for the Knowledge Chat interface
 * - Displays brand with minimal line icon
 * - Optionally renders a minimal sidebar toggle button when provided
 * - Optionally renders a logout button when provided
 * - Shows online status next to the title for quick visibility
 *
 * @param {Object} props - Component props
 * @param {Function} [props.onToggleSidebar] - Optional handler to toggle sidebar visibility
 * @param {boolean}  [props.isSidebarOpen] - Optional current state of the sidebar, to reflect icon state
 * @param {Function} [props.onLogout] - Optional logout handler function
 * @returns {JSX.Element} Header component
 */
// PUBLIC_INTERFACE
function Header({ onToggleSidebar, isSidebarOpen, onLogout }) {
  /** This is a public function: Header renders the app header with brand and optional actions. */
  return (
    <header className="chat-header" role="banner">
      <div className="header-brand">
        {typeof onToggleSidebar === 'function' && (
          <button
            className={`sidebar-toggle ${isSidebarOpen ? 'open' : ''}`}
            onClick={onToggleSidebar}
            type="button"
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {/* Minimal hamburger / chevron icon switch (stroke-only) */}
            {isSidebarOpen ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.5 7L9.5 12L14.5 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        )}

        <div className="chat-icon" role="img" aria-label="App Icon">
          <MinimalChatIcon />
        </div>
        <div className="brand-with-status">
          <h1 className="brand-title">Knowledge Chat</h1>
          {/* Inline, compact status dot next to the title */}
          <OnlineStatusIndicator />
        </div>
      </div>

      {onLogout && (
        <button
          className="logout-button"
          onClick={onLogout}
          type="button"
          aria-label="Logout"
          title="Logout"
        >
          <span className="logout-icon" role="img" aria-label="Logout Icon">
            🔒
          </span>
          <span className="logout-text">Logout</span>
        </button>
      )}
    </header>
  );
}

export default Header;
