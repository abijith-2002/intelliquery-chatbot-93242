import React from "react";
import "./Sidebar.css";

/**
 * Sidebar - displays chat sessions, allows switching and starting new chat.
 * Renders nothing when there are no previous chats (no placeholder or extra UI).
 * 
 * @param {Object} props
 * @param {Array<{id: string, title: string, preview: string, lastActive: number, messages: Array}>} props.chats
 * @param {string} props.activeSessionId
 * @param {Function} props.onSelectChat - handler(sessionId)
 * @param {Function} props.onNewChat - handler() to start new chat
 * @param {boolean} [props.isOpen=true] - Whether the sidebar is visible (animated collapse when false)
 * @returns {JSX.Element|null}
 */
// PUBLIC_INTERFACE
function Sidebar({ chats, activeSessionId, onSelectChat, onNewChat, isOpen = true }) {
  /** This is a public function: Sidebar renders the chat list and new chat action; collapsible via isOpen.
   *  When there are no previous chats, this component renders nothing (null).
   */

  // Sort by last active desc and only include chats with messages
  const sortedChats = Array.isArray(chats)
    ? chats
        .filter((c) => c && Array.isArray(c.messages) && c.messages.length > 0)
        .slice()
        .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
    : [];

  // If there are no previous chats, render nothing (no placeholder or extra UI)
  if (sortedChats.length === 0) {
    return null;
  }

  // Keyboard activation for accessibility (Enter/Space)
  const handleItemKeyDown = (e, chatId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectChat(chatId);
    }
  };

  return (
    <nav
      className={`sidebar-container ${isOpen ? "open" : "collapsed"}`}
      aria-label="Chat History Sidebar"
      aria-hidden={!isOpen}
    >
      <div className="sidebar-header">💬 &nbsp; Chats</div>
      <button
        className="sidebar-new-chat-btn"
        type="button"
        onClick={onNewChat}
        aria-label="Start new chat"
      >
        + New Chat
      </button>
      <ul className="sidebar-list" role="listbox" aria-orientation="vertical">
        {sortedChats.map((chat) => (
          <li
            key={chat.id}
            className={
              "sidebar-list-item" + (chat.id === activeSessionId ? " selected" : "")
            }
            tabIndex={0}
            onClick={() => onSelectChat(chat.id)}
            onKeyDown={(e) => handleItemKeyDown(e, chat.id)}
            aria-label={`Open chat: ${chat.title || "Untitled Chat"}`}
            aria-selected={chat.id === activeSessionId}
            role="option"
          >
            {/* Only show the chat title in the sidebar */}
            <span className="sidebar-list-title">{chat.title || "Untitled"}</span>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">Powered by IntelliQuery</div>
    </nav>
  );
}

export default Sidebar;
