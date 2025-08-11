import React from "react";
import "./Sidebar.css";

/**
 * Sidebar - displays chat sessions, allows switching and starting new chat
 * @param {Object} props
 * @param {Array<{id: string, title: string, preview: string, lastActive: number, messages: Array}>} props.chats
 * @param {string} props.activeSessionId
 * @param {Function} props.onSelectChat - handler(sessionId)
 * @param {Function} props.onNewChat - handler() to start new chat
 * @returns {JSX.Element}
 */
// PUBLIC_INTERFACE
function Sidebar({ chats, activeSessionId, onSelectChat, onNewChat }) {
  // Sort by last active desc
  const sortedChats = Array.isArray(chats)
    ? chats
        .filter((c) => c && Array.isArray(c.messages) && c.messages.length > 0)
        .slice()
        .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
    : [];
  return (
    <nav className="sidebar-container" aria-label="Chat History Sidebar">
      <div className="sidebar-header">💬 &nbsp; Chats</div>
      <button
        className="sidebar-new-chat-btn"
        type="button"
        onClick={onNewChat}
        aria-label="Start new chat"
      >
        + New Chat
      </button>
      <ul className="sidebar-list" role="listbox">
        {sortedChats.length === 0 && (
          <div className="chatlist-empty" style={{margin: "30px 0", color: "var(--text-muted)"}}>
            <span className="chatlist-empty-icon">🤖</span>
            <span>No past chats yet.</span>
          </div>
        )}
        {sortedChats.map((chat) => (
          <li
            key={chat.id}
            className={
              "sidebar-list-item" +
              (chat.id === activeSessionId ? " selected" : "")
            }
            tabIndex={0}
            onClick={() => onSelectChat(chat.id)}
            aria-label={`Open chat: ${chat.title || "Untitled Chat"}`}
            aria-selected={chat.id === activeSessionId}
            role="option"
          >
            <span className="sidebar-list-title">{chat.title || "Untitled"}</span>
            {chat.preview && (
              <span className="sidebar-list-preview">
                {chat.preview.length > 36
                  ? chat.preview.substring(0, 36) + "…"
                  : chat.preview}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">Powered by IntelliQuery</div>
    </nav>
  );
}

export default Sidebar;
