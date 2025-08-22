import React from "react";
import "./Sidebar.css";
import MinimalChatIcon from "./icons/MinimalChatIcon";
import MinimalRenameIcon from "./icons/MinimalRenameIcon";
import MinimalTrashIcon from "./icons/MinimalTrashIcon";

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
function Sidebar({ chats, activeSessionId, onSelectChat, onNewChat, isOpen = true, onDeleteChat, onRenameChat }) {
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
      <div className="sidebar-divider" role="separator" aria-orientation="horizontal" />
      <ul className="sidebar-list" role="listbox" aria-orientation="vertical">
        {/* Intentionally render nothing for empty state to keep area minimal */}
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

            {/* Inline actions: rename and delete */}
            {(typeof onRenameChat === "function" || typeof onDeleteChat === "function") && (
              <span className="sidebar-item-actions" aria-hidden="false">
                {typeof onRenameChat === "function" && (
                  <button
                    type="button"
                    className="sidebar-action-btn rename-btn"
                    title="Rename chat"
                    aria-label={`Rename chat: ${chat.title || "Untitled"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameChat(chat.id);
                    }}
                  >
                    <MinimalRenameIcon size={16} />
                  </button>
                )}
                {typeof onDeleteChat === "function" && (
                  <button
                    type="button"
                    className="sidebar-action-btn delete-btn"
                    title="Delete chat"
                    aria-label={`Delete chat: ${chat.title || "Untitled"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                  >
                    <MinimalTrashIcon size={16} />
                  </button>
                )}
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
