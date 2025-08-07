import React from "react";
import "./ChatList.css";

/**
 * ChatList - displays a list of previous chat sessions with 'Resume' options
 * 
 * @param {Object} props
 * @param {Array<{id: string, title: string, lastActive: number, preview: string, messages: Array}>} props.chats
 *  NOTE: The 'chats' array must only include sessions that have at least one message.
 *  The DashboardPage is responsible for filtering out empty chat sessions before passing them here.
 * @param {Function} props.onResumeChat - Handler(chatId)
 */
// PUBLIC_INTERFACE
function ChatList({ chats, onResumeChat }) {
  if (!chats || chats.length === 0) {
    return (
      <div className="chatlist-empty">
        <span className="chatlist-empty-icon">🤖</span>
        <span>No previous chats yet — Start a new conversation!</span>
      </div>
    );
  }
  // Sort by lastActive descending
  const sortedChats = chats
    .slice()
    .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
  return (
    <ul className="chatlist-list" role="listbox">
      {sortedChats.map((chat) => (
        <li key={chat.id} className="chatlist-item">
          <div className="chatlist-details">
            <div className="chatlist-title">{chat.title || "Untitled Chat"}</div>
            <div className="chatlist-meta">
              <span>
                {chat.lastActive
                  ? new Date(chat.lastActive).toLocaleString()
                  : ""}
              </span>
              {chat.preview && (
                <span className="chatlist-preview">
                  — {chat.preview.length > 36
                    ? chat.preview.substring(0, 36) + "…"
                    : chat.preview}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="chatlist-resume-btn"
            onClick={() => onResumeChat(chat.id)}
            aria-label={`Resume chat: ${chat.title || "Untitled Chat"}`}
          >
            Resume
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ChatList;
