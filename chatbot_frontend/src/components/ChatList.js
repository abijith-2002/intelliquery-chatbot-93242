import React from "react";
import "./ChatList.css";

/**
 * ChatList - displays a simplified list of previous chat sessions
 * Each item shows only the title and is fully clickable
 * 
 * @param {Object} props
 * @param {Array<{id: string, title: string, lastActive: number, messages: Array}>} props.chats
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
        <li
          key={chat.id}
          className="chatlist-item"
          onClick={() => onResumeChat(chat.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onResumeChat(chat.id);
            }
          }}
          aria-label={chat.title || "Untitled Chat"}
        >
          <div className="chatlist-title">{chat.title || "Untitled Chat"}</div>
        </li>
      ))}
    </ul>
  );
}

export default ChatList;
