import React from 'react';
import './Header.css';

// PUBLIC_INTERFACE
/**
 * Header component for the Knowledge Chat interface
 * Matches design specifications exactly with chat icon and title
 * 
 * @param {Object} props - Component props
 * @param {string} props.theme - Current theme ('light' or 'dark')
 * @param {Function} props.onThemeToggle - Theme toggle handler
 * @returns {JSX.Element} Header component
 */
function Header({ theme, onThemeToggle }) {
  return (
    <header className="chat-header" role="banner">
      <div className="header-brand">
        <div className="chat-icon" role="img" aria-label="Chat Icon">
          💬
        </div>
        <h1 className="brand-title">Knowledge Chat</h1>
      </div>
      
      <button 
        className="theme-toggle"
        onClick={onThemeToggle}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        type="button"
      >
        <span className="theme-icon" role="img" aria-label={theme === 'dark' ? 'sun' : 'moon'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </span>
      </button>
    </header>
  );
}

export default Header;
