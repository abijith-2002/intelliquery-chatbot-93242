import React from 'react';
import './Header.css';

/**
 * Header component for the Knowledge Chat interface
 * Matches design specifications exactly with chat icon and title
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onLogout - Optional logout handler function
 * @returns {JSX.Element} Header component
 */
// PUBLIC_INTERFACE
function Header({ onLogout }) {
  return (
    <header className="chat-header" role="banner">
      <div className="header-brand">
        <div className="chat-icon" role="img" aria-label="Chat Icon">
          💬
        </div>
        <h1 className="brand-title">Knowledge Chat</h1>
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
            🚪
          </span>
          <span className="logout-text">Logout</span>
        </button>
      )}
    </header>
  );
}

export default Header;
