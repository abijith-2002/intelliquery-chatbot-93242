import React from "react";
import "./Sidebar.css";
import MinimalChatIcon from "./icons/MinimalChatIcon";

/**
 * Sidebar - displays chat sessions, allows switching and starting new chat
 * @param {Object} props
 * @param {Array<{id: string, title: string, preview: string, lastActive: number, messages: Array}>} props.chats
 * @param {string} props.activeSessionId
 * @param {Function} props.onSelectChat - handler(sessionId)
 * @param {Function} props.onNewChat - handler() to start new chat
 * @param {boolean} [props.isOpen=true] - Whether the sidebar is visible (animated collapse when false)
 * @returns {JSX.Element}
 */
// PUBLIC_INTERFACE
function Sidebar({ chats, activeSessionId, onSelectChat, onNewChat, isOpen = true }) {
  /** This is a public function: Sidebar renders the chat list and new chat action; collapsible via isOpen. */
  // Sort by last active desc and only include chats with messages
  const sortedChats = Array.isArray(chats)
    ? chats
        .filter((c) => c && Array.isArray(c.messages) && c.messages.length > 0)
        .slice()
        .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
    : [];

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
      <div className="sidebar-header">
        <span className="sidebar-header-icon" aria-hidden="true">
          <MinimalChatIcon size={18} title="Chats" />
        </span>
        <span className="sidebar-header-title">Chats</span>
      </div>
      <button
        className="sidebar-new-chat-btn"
        type="button"
        onClick={onNewChat}
        aria-label="Start new chat"
      >
        + New Chat
      </button>
      <ul className="sidebar-list" role="listbox" aria-orientation="vertical">
        {sortedChats.length === 0 && (
          <div className="chatlist-empty" style={{ margin: "30px 0" }}>
            <span className="chatlist-empty-icon">🤖</span>
            <span>No past chats yet.</span>
          </div>
        )}
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
