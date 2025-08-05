import React from 'react';
import './Header.css';

// PUBLIC_INTERFACE
/**
 * Header component for the chatbot interface
 * Features brand logo, title, and theme toggle functionality
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
        <div className="brand-icon" role="img" aria-label="IntelliQuery Logo">
          🧠
        </div>
        <h1 className="brand-title">IntelliQuery</h1>
        <span className="brand-subtitle">AI Assistant</span>
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
        <span className="theme-text">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      </button>
    </header>
  );
}

export default Header;
