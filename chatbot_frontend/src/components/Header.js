import React from 'react';
import './Header.css';

/**
 * Header component for the Knowledge Chat interface
 * Matches design specifications exactly with chat icon and title
 * 
 * No theme toggle button (theme is fixed by parent).
 * 
 * @returns {JSX.Element} Header component
 */
// PUBLIC_INTERFACE
function Header() {
  return (
    <header className="chat-header" role="banner">
      <div className="header-brand">
        <div className="chat-icon" role="img" aria-label="Chat Icon">
          💬
        </div>
        <h1 className="brand-title">Knowledge Chat</h1>
      </div>
    </header>
  );
}

export default Header;
